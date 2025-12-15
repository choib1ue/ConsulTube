import os
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from dotenv import load_dotenv
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

load_dotenv()


class YouTubeService:
    def __init__(self):
        self.api_key = os.getenv("YOUTUBE_API_KEY")
        if not self.api_key:
            raise ValueError("YOUTUBE_API_KEY 환경 변수가 설정되지 않았습니다.")
        
        # googleapiclient로 YouTube API 클라이언트 생성
        self.youtube = build("youtube", "v3", developerKey=self.api_key)

    def get_category_query(self, category: str) -> str:
        """카테고리별 검색 쿼리 생성"""
        category_queries = {
            "뷰티": "뷰티 메이크업",
            "패션": "패션 스타일",
            "음식": "요리 레시피",
            "여행": "여행 브이로그",
            "게임": "게임 플레이",
            "음악": "음악 뮤직비디오",
            "스포츠": "스포츠 하이라이트",
            "교육": "교육 강의",
        }
        return category_queries.get(category, category)

    def get_video_view_count(self, video_id: str) -> int:
        """개별 영상의 조회수 가져오기 (예시 코드와 동일)"""
        try:
            video_response = self.youtube.videos().list(
                part="statistics",
                id=video_id
            ).execute()
            
            video_info = video_response.get("items", [])
            if len(video_info) > 0:
                statistics = video_info[0]["statistics"]
                if "viewCount" in statistics:
                    view_count = statistics["viewCount"]
                    return int(view_count)
            return 0
        except HttpError as e:
            print(f"HTTP Error: {e}")
            return 0

    def search_videos(
        self,
        query: str,
        max_results: int = 50,
        published_after: Optional[datetime] = None,
        page_token: Optional[str] = None,
    ) -> Dict:
        """YouTube Search API 호출 (googleapiclient 사용)"""
        request_params = {
            "part": "snippet",
            "q": query,
            "maxResults": min(max_results, 50),  # API 제한: 최대 50
            "order": "date",
            "type": "video",
        }

        if published_after:
            request_params["publishedAfter"] = published_after.isoformat() + "Z"

        if page_token:
            request_params["pageToken"] = page_token

        try:
            search_response = self.youtube.search().list(**request_params).execute()
            return search_response
        except HttpError as e:
            print(f"HTTP Error: {e}")
            raise

    def get_video_details(self, video_ids: List[str]) -> Dict:
        """YouTube Videos API로 상세 정보 가져오기 (googleapiclient 사용)"""
        # API 제한: 한 번에 최대 50개
        all_items = []
        for i in range(0, len(video_ids), 50):
            batch = video_ids[i : i + 50]
            try:
                video_response = self.youtube.videos().list(
                    part="snippet,statistics",
                    id=",".join(batch)
                ).execute()
                all_items.extend(video_response.get("items", []))
            except HttpError as e:
                print(f"HTTP Error: {e}")
                continue

        return {"items": all_items}

    def search_videos_with_pagination(
        self,
        search_query: str,
        max_results: Optional[int] = None,
        published_after: Optional[datetime] = None,
    ) -> List[Dict]:
        """
        검색 쿼리로 모든 영상 수집 (페이지네이션 지원)
        Python 예시 코드와 동일한 구조
        """
        videos = []
        next_page_token = None
        total_collected = 0

        try:
            while True:
                # Search API 호출
                request_params = {
                    "part": "snippet",
                    "q": search_query,
                    "maxResults": 50,  # 페이지당 최대 50개
                    "type": "video",
                }

                if published_after:
                    request_params["publishedAfter"] = published_after.isoformat() + "Z"

                if next_page_token:
                    request_params["pageToken"] = next_page_token

                search_response = self.youtube.search().list(**request_params).execute()

                items = search_response.get("items", [])
                if len(items) == 0:
                    break

                # 각 영상에 대해 상세 정보 가져오기
                for search_result in items:
                    if search_result["id"]["kind"] == "youtube#video":
                        video_id = search_result["id"]["videoId"]
                        video_title = search_result["snippet"]["title"]
                        video_published_at = datetime.fromisoformat(
                            search_result["snippet"]["publishedAt"].replace("Z", "+00:00")
                        )

                        # Videos API로 상세 정보 가져오기
                        video_details = self.get_video_details([video_id])

                        if video_details["items"] and len(video_details["items"]) > 0:
                            item = video_details["items"][0]
                            statistics = item.get("statistics", {})

                            videos.append({
                                "video_id": video_id,
                                "title": video_title,
                                "description": item["snippet"].get("description", ""),
                                "tags": item["snippet"].get("tags", []),
                                "category_id": item["snippet"].get("categoryId"),
                                "published_at": video_published_at,
                                "channel_id": item["snippet"]["channelId"],
                                "channel_title": item["snippet"]["channelTitle"],
                                "view_count": int(statistics.get("viewCount", 0)),
                                "like_count": int(statistics.get("likeCount", 0)),
                                "comment_count": int(statistics.get("commentCount", 0)),
                                "thumbnail_default": item["snippet"]["thumbnails"]
                                .get("default", {})
                                .get("url"),
                                "thumbnail_medium": item["snippet"]["thumbnails"]
                                .get("medium", {})
                                .get("url"),
                                "thumbnail_high": item["snippet"]["thumbnails"]
                                .get("high", {})
                                .get("url"),
                            })

                            total_collected += 1

                        # max_results가 지정된 경우 제한
                        if max_results and total_collected >= max_results:
                            return videos[:max_results]

                # 다음 페이지 토큰 확인
                next_page_token = search_response.get("nextPageToken")
                if not next_page_token:
                    break

            return videos
        except HttpError as e:
            print(f"HTTP Error: {e}")
            return []

    def fetch_video_data(
        self,
        category: str,
        max_results: int = 50,
        time_range_days: int = 7,
        published_after: Optional[datetime] = None,
    ) -> List[Dict]:
        """카테고리별 영상 데이터 가져오기 (기존 메서드와 호환)"""
        query = self.get_category_query(category)
        
        # published_after가 지정되지 않은 경우, time_range_days 기준으로 계산
        if published_after is None:
            published_after = datetime.utcnow() - timedelta(days=time_range_days)

        # 페이지네이션을 지원하는 새로운 메서드 사용
        return self.search_videos_with_pagination(query, max_results, published_after)

    def search_videos(self, search_query: str, max_results: Optional[int] = None) -> List[Dict]:
        """
        사용자 정의 검색 쿼리로 영상 검색 (Python 예시와 동일한 사용법)
        예: search_videos('설화수+화장품+리뷰')
        """
        return self.search_videos_with_pagination(search_query, max_results)

