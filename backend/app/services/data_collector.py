from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime, timedelta
from typing import List
from ..models import Video, Category, Hashtag, VideoHashtag
from .youtube_service import YouTubeService


class DataCollector:
    def __init__(self, db: Session):
        self.db = db
        self.youtube_service = YouTubeService()

    def get_or_create_category(self, category_name: str) -> Category:
        """카테고리 가져오기 또는 생성"""
        category = self.db.query(Category).filter(Category.name == category_name).first()
        if not category:
            category = Category(name=category_name)
            self.db.add(category)
            self.db.commit()
            self.db.refresh(category)
        return category

    def get_or_create_hashtag(self, tag: str) -> Hashtag:
        """해시태그 가져오기 또는 생성"""
        hashtag = self.db.query(Hashtag).filter(Hashtag.tag == tag).first()
        if not hashtag:
            hashtag = Hashtag(tag=tag)
            self.db.add(hashtag)
            self.db.commit()
            self.db.refresh(hashtag)
        return hashtag

    def collect_videos(
        self, category_name: str, time_range_days: int = 7, max_results: int = 50, incremental: bool = True
    ) -> int:
        """YouTube에서 영상 데이터 수집 및 저장
        
        Args:
            category_name: 카테고리명
            time_range_days: 수집할 기간 (일)
            max_results: 최대 수집 영상 수
            incremental: 증분 수집 여부 (True: 마지막 수집 이후 새 영상만, False: 전체 수집)
        """
        # 증분 수집인 경우, 마지막 수집 시간 확인
        published_after = None
        if incremental:
            category = self.db.query(Category).filter(Category.name == category_name).first()
            if category:
                # 해당 카테고리의 가장 최근 수집 시간 확인
                last_collected = (
                    self.db.query(Video.collected_at)
                    .filter(Video.category_id == category.id)
                    .order_by(Video.collected_at.desc())
                    .first()
                )
                if last_collected and last_collected[0]:
                    # 마지막 수집 시간 이후의 영상만 수집
                    published_after = last_collected[0]
                    print(f"[증분 수집] {category_name}: 마지막 수집 시간 이후 영상만 수집 ({published_after})")
        
        # YouTube API에서 데이터 가져오기
        video_data_list = self.youtube_service.fetch_video_data(
            category=category_name,
            max_results=max_results,
            time_range_days=time_range_days,
            published_after=published_after,
        )

        if not video_data_list:
            return 0

        # 카테고리 가져오기 또는 생성
        category = self.get_or_create_category(category_name)

        collected_count = 0

        for video_data in video_data_list:
            # 기존 영상 확인 (video_id로)
            existing_video = (
                self.db.query(Video)
                .filter(Video.video_id == video_data["video_id"])
                .first()
            )

            if existing_video:
                # 기존 영상 업데이트 (통계 데이터 갱신)
                existing_video.title = video_data["title"]
                existing_video.description = video_data["description"]
                existing_video.view_count = video_data["view_count"]
                existing_video.like_count = video_data["like_count"]
                existing_video.comment_count = video_data["comment_count"]
                existing_video.thumbnail_default = video_data["thumbnail_default"]
                existing_video.thumbnail_medium = video_data["thumbnail_medium"]
                existing_video.thumbnail_high = video_data["thumbnail_high"]
                existing_video.updated_at = datetime.utcnow()
                video = existing_video
            else:
                # 새 영상 생성
                video = Video(
                    video_id=video_data["video_id"],
                    title=video_data["title"],
                    description=video_data["description"],
                    category_id=category.id,
                    published_at=video_data["published_at"],
                    channel_id=video_data["channel_id"],
                    channel_title=video_data["channel_title"],
                    view_count=video_data["view_count"],
                    like_count=video_data["like_count"],
                    comment_count=video_data["comment_count"],
                    thumbnail_default=video_data["thumbnail_default"],
                    thumbnail_medium=video_data["thumbnail_medium"],
                    thumbnail_high=video_data["thumbnail_high"],
                )
                self.db.add(video)
                self.db.flush()
                collected_count += 1

            # 해시태그 처리
            if video_data.get("tags"):
                # 기존 해시태그 연결 삭제 (기존 영상 업데이트 시에도)
                self.db.query(VideoHashtag).filter(
                    VideoHashtag.video_id == video.id
                ).delete()
                self.db.flush()  # 삭제 후 flush

                # 태그 중복 제거 및 해시태그 추가
                unique_tags = list(set(video_data["tags"]))  # 중복 제거
                added_hashtag_ids = set()  # 이미 추가한 해시태그 ID 추적
                
                for tag in unique_tags:
                    hashtag = self.get_or_create_hashtag(tag)
                    # 중복 체크
                    if hashtag.id not in added_hashtag_ids:
                        video_hashtag = VideoHashtag(
                            video_id=video.id, hashtag_id=hashtag.id
                        )
                        self.db.add(video_hashtag)
                        added_hashtag_ids.add(hashtag.id)

        try:
            self.db.commit()
        except Exception as e:
            self.db.rollback()
            print(f"[오류] 데이터 저장 실패: {str(e)}")
            raise
        
        return collected_count

