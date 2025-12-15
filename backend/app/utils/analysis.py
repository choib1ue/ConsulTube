from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from datetime import datetime, timedelta
from typing import List, Dict, Tuple
import pandas as pd
import numpy as np
import re
from ..models import Video, Category, Hashtag, VideoHashtag


def calculate_metrics(db: Session, category_name: str, time_range_days: int = 7) -> Dict:
    """메트릭 카드 데이터 계산 (pandas 활용)"""
    category = db.query(Category).filter(Category.name == category_name).first()
    if not category:
        return {
            "avg_views": "0",
            "trending_topics": 0,
            "recommended_hashtags": 0,
            "total_videos": 0,
        }

    cutoff_date = datetime.utcnow() - timedelta(days=time_range_days)

    # 지정된 기간 내 영상 조회
    videos = (
        db.query(Video)
        .filter(
            and_(
                Video.category_id == category.id,
                Video.published_at >= cutoff_date,
            )
        )
        .all()
    )
    
    # 데이터가 부족하면 (10개 미만) 전체 기간 사용
    if len(videos) < 10:
        videos = (
            db.query(Video)
            .filter(Video.category_id == category.id)
            .all()
        )

    if not videos:
        return {
            "avg_views": "0",
            "trending_topics": 0,
            "recommended_hashtags": 0,
            "total_videos": 0,
        }

    # pandas DataFrame으로 변환
    df = pd.DataFrame([{
        'id': v.id,
        'view_count': v.view_count,
        'like_count': v.like_count,
        'comment_count': v.comment_count,
    } for v in videos])

    # 평균 조회수 계산 (numpy 활용)
    avg_views = df['view_count'].mean()
    avg_views_formatted = (
        f"{avg_views / 1000:.1f}K" if avg_views >= 1000 else str(int(avg_views))
    )

    # 고유 해시태그 수
    hashtag_ids = (
        db.query(VideoHashtag.hashtag_id)
        .join(Video)
        .filter(
            and_(
                Video.category_id == category.id,
                Video.published_at >= cutoff_date,
            )
        )
        .distinct()
        .all()
    )
    trending_topics = len(hashtag_ids)

    # 추천 해시태그 수 (평균 조회수 30K 이상) - pandas로 계산
    hashtag_video_data = (
        db.query(
            Hashtag.tag,
            Video.view_count,
        )
        .join(VideoHashtag, VideoHashtag.hashtag_id == Hashtag.id)
        .join(Video, Video.id == VideoHashtag.video_id)
        .filter(
            and_(
                Video.category_id == category.id,
                Video.published_at >= cutoff_date,
            )
        )
        .all()
    )
    
    # 데이터가 부족하면 전체 기간 사용
    if len(hashtag_video_data) < 10:
        hashtag_video_data = (
            db.query(
                Hashtag.tag,
                Video.view_count,
            )
            .join(VideoHashtag, VideoHashtag.hashtag_id == Hashtag.id)
            .join(Video, Video.id == VideoHashtag.video_id)
            .filter(Video.category_id == category.id)
            .all()
        )

    if hashtag_video_data:
        hashtag_df = pd.DataFrame(hashtag_video_data)
        hashtag_avg_views = hashtag_df.groupby('tag')['view_count'].mean()
        recommended_hashtags = (hashtag_avg_views >= 30000).sum()
    else:
        recommended_hashtags = 0

    return {
        "avg_views": avg_views_formatted,
        "trending_topics": trending_topics,
        "recommended_hashtags": int(recommended_hashtags),
        "total_videos": len(videos),
    }


def analyze_trends(
    db: Session, category_name: str, time_range_days: int = 7
) -> Tuple[List[Dict], List[Dict]]:
    """트렌드 데이터 분석 (pandas/numpy 활용)"""
    category = db.query(Category).filter(Category.name == category_name).first()
    if not category:
        return [], []

    cutoff_date = datetime.utcnow() - timedelta(days=time_range_days)

    # 지정된 기간 내 영상 조회
    videos = (
        db.query(Video)
        .filter(
            and_(
                Video.category_id == category.id,
                Video.published_at >= cutoff_date,
            )
        )
        .all()
    )
    
    # 데이터가 부족하면 (10개 미만) 전체 기간 사용
    if len(videos) < 10:
        videos = (
            db.query(Video)
            .filter(Video.category_id == category.id)
            .all()
        )

    if not videos:
        return [], []

    # pandas DataFrame으로 변환
    df = pd.DataFrame([{
        'published_at': v.published_at,
        'view_count': v.view_count,
        'like_count': v.like_count,
        'comment_count': v.comment_count,
        'title': v.title,
    } for v in videos])

    # 시간 범위에 따른 데이터 그룹화 (pandas 활용)
    now = datetime.utcnow()
    # days_ago 계산: 음수는 0으로, time_range_days 초과는 time_range_days로 클리핑
    df['days_ago'] = (now - df['published_at']).dt.days
    df['days_ago'] = df['days_ago'].clip(0, time_range_days)
    
    if time_range_days == 7:
        # 7일 기준: 일별로 그룹화 (7일 전, 6일 전, ..., 1일 전, 오늘)
        df['period'] = df['days_ago'].apply(lambda x: f"{int(x)}일 전" if x > 0 else "오늘")
        # 정렬을 위한 순서 매핑 (7일 전이 가장 작은 값, 오늘이 가장 큰 값)
        period_order = {"오늘": 8}  # 오늘은 가장 최근이므로 큰 값
        for i in range(1, 8):
            period_order[f"{i}일 전"] = 8 - i  # 7일 전 = 1, 6일 전 = 2, ..., 1일 전 = 7
    else:
        # 30일 기준: 주별로 그룹화 (4주 전, 3주 전, 2주 전, 1주 전, 이번 주)
        # 주별로 그룹화 (0-6일: 이번 주, 7-13일: 1주 전, 14-20일: 2주 전, 21-27일: 3주 전, 28-30일: 4주 전)
        # days_ago가 28 이상이면 4주 전으로 분류
        df['week_num'] = df['days_ago'].apply(
            lambda x: 0 if x < 7 else (1 if x < 14 else (2 if x < 21 else (3 if x < 28 else 4)))
        )
        df['period'] = df['week_num'].apply(
            lambda x: "이번 주" if x == 0 else f"{int(x)}주 전"
        )
        # 정렬을 위한 순서 매핑 (오래된 날짜가 작은 값)
        period_order = {"이번 주": 5, "1주 전": 4, "2주 전": 3, "3주 전": 2, "4주 전": 1}

    # 기간별 집계 (pandas groupby)
    period_stats = df.groupby('period').agg({
        'view_count': ['sum', 'count'],
        'like_count': 'sum',
        'comment_count': 'sum',
    }).reset_index()

    period_stats.columns = ['date', 'total_views', 'videos', 'total_likes', 'total_comments']
    
    # 7일 기준: 데이터가 없는 날짜도 포함 (0으로 채움)
    if time_range_days == 7:
        all_periods = [f"{i}일 전" for i in range(7, 0, -1)] + ["오늘"]
        existing_periods = set(period_stats['date'].tolist())
        missing_periods = [p for p in all_periods if p not in existing_periods]
        if missing_periods:
            missing_df = pd.DataFrame([{
                'date': p,
                'total_views': 0,
                'videos': 0,
                'total_likes': 0,
                'total_comments': 0
            } for p in missing_periods])
            period_stats = pd.concat([period_stats, missing_df], ignore_index=True)
    
    period_stats['engagement'] = period_stats['total_likes'] + period_stats['total_comments']
    period_stats['views'] = (period_stats['total_views'] / 1000).round(1)  # K 단위

    trend_data = period_stats[['date', 'views', 'engagement', 'videos']].to_dict('records')
    
    # 정렬: period_order를 기준으로 정렬 (오래된 날짜부터 최근 날짜 순)
    # 7일: 7일 전 -> 1일 전 -> 오늘 순서
    # 30일: 4주 전 -> 3주 전 -> 2주 전 -> 1주 전 -> 이번 주 순서
    trend_data.sort(key=lambda x: period_order.get(x['date'], 999), reverse=False)

    # 트렌딩 주제 분석 (제목 키워드 기반) - pandas 활용
    # 제목을 단어로 분리 (#' 기호 및 구두점 제거하여 통합)
    
    # 주제 정규화 함수 (브이로그/VLOG 통합 등)
    def normalize_topic(word: str) -> str:
        """주제를 정규화하여 통합 (브이로그/VLOG, 메이크업/makeup 등)"""
        # '#' 기호 제거
        normalized = word.lstrip('#').strip()
        # 구두점 제거 (쉼표, 마침표, 느낌표, 물음표 등)
        normalized = re.sub(r'[^\w\s가-힣]', '', normalized)
        # 앞뒤 공백 제거
        normalized = normalized.strip()
        # 대소문자 통일 (영문의 경우)
        normalized_lower = normalized.lower()
        # 브이로그/VLOG 통합 (대소문자 구분 없이)
        if normalized_lower == '브이로그' or normalized_lower == 'vlog':
            return '브이로그/VLOG'
        # 메이크업/makeup 통합 (대소문자 구분 없이)
        if normalized_lower == '메이크업' or normalized_lower == 'makeup':
            return '메이크업 / makeup'
        return normalized
    
    all_words = []
    word_videos = []
    original_words_map = {}  # 정규화된 단어 -> 원본 단어들 집합
    
    for idx, row in df.iterrows():
        words = row['title'].split()
        for word in words:
            # 원본 단어 저장
            original_word = word.lstrip('#').strip()
            original_word = re.sub(r'[^\w\s가-힣]', '', original_word).strip()
            
            if len(original_word) > 1:
                # 정규화된 단어
                normalized_word = normalize_topic(original_word)
                
                # 원본 단어들을 맵에 저장
                if normalized_word not in original_words_map:
                    original_words_map[normalized_word] = set()
                original_words_map[normalized_word].add(original_word)
                
                all_words.append(normalized_word)
                word_videos.append({'word': normalized_word, 'view_count': row['view_count']})

    if word_videos:
        word_df = pd.DataFrame(word_videos)
        word_stats = word_df.groupby('word').agg({
            'view_count': ['count', 'mean']
        }).reset_index()
        word_stats.columns = ['topic', 'count', 'avg_views']

        # 최소 3회 이상 언급된 주제만
        word_stats = word_stats[word_stats['count'] >= 3].copy()

        # 성장률 계산 (numpy 활용)
        word_stats['growth'] = np.where(
            word_stats['avg_views'] > 10000, '+45%',
            np.where(word_stats['avg_views'] > 5000, '+30%', '+15%')
        )

        # 카테고리 이름과 영어 번역 매핑
        category_exclusions = {
            '뷰티': ['뷰티', 'beauty', 'beauty tip', 'beautytips'],
            '패션': ['패션', 'fashion', '패션스타일', 'fashionstyle', 'fashion style'],
            '음식': ['음식', 'food', '맛집'],
            '여행': ['여행', 'travel', 'trip', 'tour', '관광', 'tourism', 'traveling'],
            '게임': ['게임', 'game', 'games', 'gaming', '게이밍'],
            '음악': ['음악', 'music', 'song', 'songs', '뮤직'],
            '스포츠': ['스포츠', 'sports', 'sport', '운동', 'athletic', 'athletics'],
            '교육': ['교육', 'education', 'learn', 'learning', 'study', 'studying']
        }
        
        # 카테고리 이름과 영어 번역 제외
        exclusion_list = category_exclusions.get(category_name, [])
        # 대소문자 구분 없이 비교하기 위해 소문자로 변환
        exclusion_list_lower = [ex.lower().strip() for ex in exclusion_list]
        # 카테고리 이름 자체도 추가
        exclusion_list_lower.append(category_name.lower())
        
        # 제외할 주제 필터링 (더 강력한 필터링)
        def should_exclude(topic_key: str) -> bool:
            if not topic_key:
                return False
            topic_lower = topic_key.lower().strip()
            
            # 1. 정규화된 주제 키 직접 확인
            if topic_lower in exclusion_list_lower:
                return True
            
            # 2. 부분 일치 확인 (카테고리 이름이 포함된 경우)
            for exclusion in exclusion_list_lower:
                if exclusion in topic_lower or topic_lower in exclusion:
                    return True
            
            # 3. 원본 단어들 확인
            original_words = original_words_map.get(topic_key, {topic_key})
            for word in original_words:
                word_lower = word.lower().strip()
                if word_lower in exclusion_list_lower:
                    return True
                # 부분 일치 확인
                for exclusion in exclusion_list_lower:
                    if exclusion in word_lower or word_lower in exclusion:
                        return True
            
            return False
        
        # 제외할 주제 필터링
        word_stats_filtered = word_stats[~word_stats['topic'].apply(should_exclude)].copy()
        
        if len(word_stats_filtered) > 0:
            # 통계적 유의성 기반 동적 선택
            # 카테고리 평균 조회수 계산
            category_avg_views = word_stats_filtered['avg_views'].mean()
            category_avg_count = word_stats_filtered['count'].mean()
            
            # 통계적 유의성 기준:
            # 1. 평균 조회수가 카테고리 평균의 1.2배 이상
            # 2. 또는 언급 횟수가 평균 언급 횟수의 1.5배 이상
            # 3. 최소 3개 이상, 최대 10개
            significant_mask = (
                (word_stats_filtered['avg_views'] >= category_avg_views * 1.2) |
                (word_stats_filtered['count'] >= category_avg_count * 1.5)
            )
            word_stats_significant = word_stats_filtered[significant_mask].copy()
            
            # 유의미한 주제가 있으면 그것을 사용, 없으면 상위 5개 사용
            if len(word_stats_significant) >= 3:
                # 유의미한 주제를 조회수와 언급 횟수 가중 평균으로 정렬
                word_stats_significant['score'] = (
                    word_stats_significant['avg_views'] * 0.6 +
                    word_stats_significant['count'] * 1000 * 0.4
                )
                word_stats_filtered = word_stats_significant.nlargest(min(10, len(word_stats_significant)), 'score')
            else:
                # 유의미한 주제가 부족하면 상위 5개 사용 (기존 방식)
                word_stats_filtered = word_stats_filtered.nlargest(5, 'count')
            
            # count 기준으로 내림차순 정렬 (값이 많은 순)
            word_stats_filtered = word_stats_filtered.sort_values('count', ascending=False)
            word_stats_filtered = word_stats_filtered.to_dict('records')
        else:
            word_stats_filtered = []
        
        trending_topics = []
        for row in word_stats_filtered:
            topic_key = row['topic']
            # 원본 단어들 가져오기
            original_words = original_words_map.get(topic_key, {topic_key})
            # 중복 제거 및 정렬 (한글 우선, 그 다음 영문)
            unique_words = sorted(list(original_words), key=lambda x: (not bool(re.search(r'[가-힣]', x)), x.lower()))
            
            # 표시 형식: 여러 단어가 있으면 ' / '로 연결
            if len(unique_words) > 1:
                display_topic = ' / '.join(unique_words)
            else:
                display_topic = unique_words[0]
            
            trending_topics.append({
                'topic': display_topic,
                'count': int(row['count']),
                'growth': row['growth']
            })
    else:
        trending_topics = []

    return trend_data, trending_topics


def analyze_hashtags(
    db: Session, category_name: str, time_range_days: int = 7
) -> Tuple[List[Dict], Dict]:
    """해시태그 효과 분석 (pandas/numpy 활용)"""
    category = db.query(Category).filter(Category.name == category_name).first()
    if not category:
        return [], {"tags": [], "expected_views": "0", "correlation": "낮음"}

    cutoff_date = datetime.utcnow() - timedelta(days=time_range_days)

    # 카테고리별 제외할 해시태그 패턴 (포함된 문자열) - 먼저 정의
    category_hashtag_pattern_exclusions = {
        # 필요시 다른 카테고리 패턴 제외 추가 가능
    }

    # 해시태그별 통계 데이터 가져오기
    hashtag_video_data = (
        db.query(
            Hashtag.tag,
            Video.view_count,
            Video.like_count,
        )
        .join(VideoHashtag, VideoHashtag.hashtag_id == Hashtag.id)
        .join(Video, Video.id == VideoHashtag.video_id)
        .filter(
            and_(
                Video.category_id == category.id,
                Video.published_at >= cutoff_date,
            )
        )
        .all()
    )
    
    # 데이터가 부족하면 (10개 미만) 전체 기간 사용
    if len(hashtag_video_data) < 10:
        hashtag_video_data = (
            db.query(
                Hashtag.tag,
                Video.view_count,
                Video.like_count,
            )
            .join(VideoHashtag, VideoHashtag.hashtag_id == Hashtag.id)
            .join(Video, Video.id == VideoHashtag.video_id)
            .filter(Video.category_id == category.id)
            .all()
        )
    
    # 데이터를 가져온 직후 필터링 적용 (가장 빠른 단계)
    original_count = len(hashtag_video_data)
    if category_name in category_hashtag_pattern_exclusions:
        exclusion_patterns = category_hashtag_pattern_exclusions[category_name]
        filtered_data = []
        excluded_tags = []
        for tag, view_count, like_count in hashtag_video_data:
            tag_clean = str(tag).lstrip('#').lower()  # str()로 변환하여 안전하게 처리
            should_exclude = False
            for pattern in exclusion_patterns:
                if pattern.lower() in tag_clean:
                    should_exclude = True
                    excluded_tags.append(tag)
                    break
            if not should_exclude:
                filtered_data.append((tag, view_count, like_count))
        hashtag_video_data = filtered_data
        print(f"[필터링] {category_name} 카테고리: {original_count}개 -> {len(hashtag_video_data)}개 (제외된 태그: {excluded_tags[:5]})")

    if not hashtag_video_data:
        return [], {"tags": [], "expected_views": "0", "correlation": "낮음"}

    # pandas DataFrame으로 변환 (컬럼 이름 명시)
    df = pd.DataFrame(hashtag_video_data, columns=['tag', 'view_count', 'like_count'])

    # 해시태그별 집계 (pandas groupby)
    hashtag_stats = df.groupby('tag').agg({
        'view_count': ['mean', 'count'],
        'like_count': 'mean',
    }).reset_index()

    hashtag_stats.columns = ['tag', 'avg_views', 'video_count', 'avg_likes']

    # 최소 2개 이상의 영상에 사용된 태그만
    hashtag_stats_all = hashtag_stats[hashtag_stats['video_count'] >= 2].copy()

    # 카테고리별 제외할 해시태그 목록 (정확히 일치하는 태그)
    category_hashtag_exclusions = {
        '뷰티': ['may阿may之美', 'may阿may美妆', 'may阿may频道', 'may阿may风格', '专业教程', '个性妆容', '创意妆容', '化妆技巧', '大胆手法', '实用教程', '时尚之美。', '时尚妆容'],
        '여행': ['A-NA', 'CARMEN', 'Hearts2Hearts', 'IAN', 'JIWOO', 'JUUN', 'STELLA', 'YE-ON', 'YUHA', '스텔라', '에이나', '예온', '유하', '이안', '주은', '지우', '카르멘', '하츠투하츠']
    }
    
    # 해당 카테고리의 제외 목록이 있으면 필터링 (정확히 일치)
    if category_name in category_hashtag_exclusions:
        exclusion_tags = category_hashtag_exclusions[category_name]
        # 대소문자 구분 없이 비교
        exclusion_tags_lower = [tag.lower() for tag in exclusion_tags]
        hashtag_stats_all = hashtag_stats_all[
            ~hashtag_stats_all['tag'].str.lower().isin(exclusion_tags_lower)
        ].copy()
    
    # 해당 카테고리의 패턴 제외 목록이 있으면 필터링 (문자열 포함) - 추가 안전장치
    if category_name in category_hashtag_pattern_exclusions:
        exclusion_patterns = category_hashtag_pattern_exclusions[category_name]
        # 대소문자 구분 없이 패턴이 포함된 태그 제외
        # 태그를 문자열로 변환 후 비교 (더 강력한 필터링)
        for pattern in exclusion_patterns:
            pattern_lower = pattern.lower()
            # 태그를 문자열로 변환 후 '#' 제거하고 비교
            mask = hashtag_stats_all['tag'].astype(str).str.lstrip('#').str.lower().str.contains(pattern_lower, na=False)
            excluded_count = mask.sum()
            if excluded_count > 0:
                excluded_tags_list = hashtag_stats_all[mask]['tag'].tolist()
                print(f"[필터링-추가] {category_name} 카테고리에서 '{pattern}' 패턴 제외: {excluded_count}개 태그 제외됨 (예: {excluded_tags_list[:3]})")
            hashtag_stats_all = hashtag_stats_all[~mask].copy()

    if len(hashtag_stats_all) == 0:
        return [], {"tags": [], "expected_views": "0", "correlation": "낮음"}

    # 전체 카테고리의 평균 참여율 계산 (기준점)
    category_avg_engagement = (df['like_count'].sum() / df['view_count'].sum()) * 100 if df['view_count'].sum() > 0 else 0
    
    # 각 해시태그의 참여율 계산: (좋아요 수 / 조회수) * 100
    hashtag_stats_all['engagement_rate'] = (hashtag_stats_all['avg_likes'] / hashtag_stats_all['avg_views']) * 100
    
    # 카테고리 평균 조회수 계산 (성장률 계산 기준)
    category_avg_views = hashtag_stats_all['avg_views'].mean()
    
    # 성장률 계산 (카테고리 평균 대비 상대적 성과 기반)
    # 평균 대비 비율에 따라 성장률 차등 부여
    hashtag_stats_all['view_ratio'] = hashtag_stats_all['avg_views'] / category_avg_views if category_avg_views > 0 else 1
    
    # 성장률 계산: 평균 대비 비율과 참여율을 종합 고려
    # 조회수 비율이 높고 참여율도 높을수록 높은 성장률
    max_engagement_rate = hashtag_stats_all['engagement_rate'].max() if hashtag_stats_all['engagement_rate'].max() > 0 else 1
    hashtag_stats_all['engagement_ratio'] = hashtag_stats_all['engagement_rate'] / max_engagement_rate
    
    hashtag_stats_all['combined_score'] = (
        hashtag_stats_all['view_ratio'] * 0.6 +  # 조회수 비율 가중치 60%
        hashtag_stats_all['engagement_ratio'] * 0.4  # 참여율 비율 가중치 40%
    )
    
    # 성장률을 5% ~ 25% 범위로 정규화
    if hashtag_stats_all['combined_score'].max() > hashtag_stats_all['combined_score'].min():
        min_score = hashtag_stats_all['combined_score'].min()
        max_score = hashtag_stats_all['combined_score'].max()
        hashtag_stats_all['growth_percent'] = 5 + (
            (hashtag_stats_all['combined_score'] - min_score) / (max_score - min_score)
        ) * 20  # 5% ~ 25% 범위
    else:
        # 모든 값이 같으면 평균 조회수 기준으로 계산
        hashtag_stats_all['growth_percent'] = np.where(
            hashtag_stats_all['avg_views'] >= category_avg_views * 1.5, 20,
            np.where(hashtag_stats_all['avg_views'] >= category_avg_views * 1.2, 15,
            np.where(hashtag_stats_all['avg_views'] >= category_avg_views, 12,
            np.where(hashtag_stats_all['avg_views'] >= category_avg_views * 0.8, 8, 5)))
        )
    
    # 성장률 포맷팅
    hashtag_stats_all['growth'] = '+' + hashtag_stats_all['growth_percent'].round(0).astype(int).astype(str) + '%'

    # 전체 해시태그의 참여율 범위 계산 (정규화 기준으로 사용)
    all_min_engagement = hashtag_stats_all['engagement_rate'].min()
    all_max_engagement = hashtag_stats_all['engagement_rate'].max()
    engagement_range = all_max_engagement - all_min_engagement
    
    # 참여율 다양성을 보장하기 위해 다양한 참여율을 가진 해시태그 선택
    # 1. 조회수 상위 4개
    top_views = hashtag_stats_all.nlargest(4, 'avg_views')
    # 2. 참여율 상위 4개
    top_engagement = hashtag_stats_all.nlargest(4, 'engagement_rate')
    # 3. 참여율 하위 2개 (다양성 확보)
    bottom_engagement = hashtag_stats_all.nsmallest(2, 'engagement_rate')
    
    # 합치고 중복 제거 후 상위 8개 선택
    combined = pd.concat([top_views, top_engagement, bottom_engagement]).drop_duplicates()
    
    # 조회수와 참여율을 모두 고려하여 최종 점수 계산
    combined['score'] = (
        combined['avg_views'] * 0.5 +  # 조회수 가중치 50%
        combined['engagement_rate'] * 10000 * 0.5  # 참여율 가중치 50%
    )
    
    # 점수 기준으로 상위 8개 선택
    hashtag_stats = combined.nlargest(8, 'score')
    
    # 선택된 해시태그들의 참여율 범위 확인
    selected_min_engagement = hashtag_stats['engagement_rate'].min() if len(hashtag_stats) > 0 else all_min_engagement
    selected_max_engagement = hashtag_stats['engagement_rate'].max() if len(hashtag_stats) > 0 else all_max_engagement
    selected_range = selected_max_engagement - selected_min_engagement
    
    # 정규화 범위 결정
    # 선택된 해시태그의 범위가 전체 범위의 30% 이상이면 선택된 범위 사용
    # 그렇지 않으면 전체 범위 사용
    if selected_range >= engagement_range * 0.3 and engagement_range > 0:
        min_engagement = selected_min_engagement
        max_engagement = selected_max_engagement
    else:
        # 전체 범위 사용
        min_engagement = all_min_engagement
        max_engagement = all_max_engagement
    
    # 범위가 너무 좁으면 (0.05% 미만) 중앙값 기준으로 확장
    if max_engagement - min_engagement < 0.05:
        median_engagement = hashtag_stats_all['engagement_rate'].median()
        min_engagement = max(0, median_engagement - 0.15)
        max_engagement = median_engagement + 0.15
    
    # 참여율을 0.5 ~ 0.95 범위로 정규화
    if max_engagement > min_engagement:
        hashtag_stats['correlation'] = 0.5 + (
            (hashtag_stats['engagement_rate'] - min_engagement) / (max_engagement - min_engagement)
        ) * 0.45
    else:
        # 모든 값이 같으면 카테고리 평균 대비 평가
        if category_avg_engagement > 0:
            avg_engagement = hashtag_stats['engagement_rate'].iloc[0] if len(hashtag_stats) > 0 else 0
            if avg_engagement >= category_avg_engagement * 1.2:
                hashtag_stats['correlation'] = 0.85
            elif avg_engagement >= category_avg_engagement:
                hashtag_stats['correlation'] = 0.7
            elif avg_engagement >= category_avg_engagement * 0.8:
                hashtag_stats['correlation'] = 0.6
            else:
                hashtag_stats['correlation'] = 0.5
        else:
            hashtag_stats['correlation'] = 0.65
    
    # 최소값 0.5, 최대값 0.95로 클리핑 (안전장치)
    hashtag_stats['correlation'] = np.clip(hashtag_stats['correlation'], 0.5, 0.95)

    # 최종 결과 생성 전에 다시 한 번 필터링 (안전장치)
    if category_name in category_hashtag_pattern_exclusions:
        exclusion_patterns = category_hashtag_pattern_exclusions[category_name]
        for pattern in exclusion_patterns:
            pattern_lower = pattern.lower()
            mask = hashtag_stats['tag'].astype(str).str.lstrip('#').str.lower().str.contains(pattern_lower, na=False)
            excluded_count = mask.sum()
            if excluded_count > 0:
                excluded_tags = hashtag_stats[mask]['tag'].tolist()
                print(f"[필터링-최종전] {category_name}: '{pattern}' 패턴으로 {excluded_count}개 제외: {excluded_tags}")
            hashtag_stats = hashtag_stats[~mask].copy()

    hashtag_data = []
    for _, row in hashtag_stats.iterrows():
        tag_str = str(row['tag']).lstrip('#')
        # 최종 필터링: "may"가 포함된 태그는 제외
        if category_name in category_hashtag_pattern_exclusions:
            exclusion_patterns = category_hashtag_pattern_exclusions[category_name]
            should_exclude = False
            for pattern in exclusion_patterns:
                if pattern.lower() in tag_str.lower():
                    should_exclude = True
                    print(f"[필터링-최종] 제외된 태그: {tag_str} (패턴: {pattern})")
                    break
            if should_exclude:
                continue
        
        hashtag_data.append({
            # 태그에서 기존 '#' 제거 후 다시 추가 (중복 방지)
            "tag": f"#{tag_str}",
            "avg_views": int(round(row['avg_views'])),
            "correlation": round(row['correlation'], 2),
            "growth": row['growth'],
            "video_count": int(row['video_count']),
        })

    # 추천 해시태그 조합 생성 전에 다시 한 번 필터링 (이중 안전장치)
    if category_name in category_hashtag_pattern_exclusions:
        exclusion_patterns = category_hashtag_pattern_exclusions[category_name]
        filtered_hashtag_data = []
        for h in hashtag_data:
            tag_without_hash = h["tag"].lstrip('#').lower()
            should_exclude = False
            for pattern in exclusion_patterns:
                if pattern.lower() in tag_without_hash:
                    should_exclude = True
                    print(f"[필터링-추천전] 제외된 태그: {h['tag']} (패턴: {pattern})")
                    break
            if not should_exclude:
                filtered_hashtag_data.append(h)
        hashtag_data = filtered_hashtag_data
        print(f"[필터링-최종] {category_name} 카테고리: 최종 {len(hashtag_data)}개 해시태그 반환")

    # 추천 해시태그 조합 - 통계적 유의성 기반 동적 선택
    if len(hashtag_data) > 0:
        # 통계적 유의성 기준으로 필터링:
        # 1. 상관도가 0.65 이상
        # 2. 또는 평균 조회수가 카테고리 평균의 1.3배 이상
        # 3. 최소 2개, 최대 5개
        category_avg_views_for_rec = np.mean([h["avg_views"] for h in hashtag_data])
        
        significant_hashtags = [
            h for h in hashtag_data
            if h["correlation"] >= 0.65 or h["avg_views"] >= category_avg_views_for_rec * 1.3
        ]
        
        # 유의미한 해시태그가 있으면 그것을 사용, 없으면 상위 3개 사용
        if len(significant_hashtags) >= 2:
            # 상관도와 조회수 가중 평균으로 정렬
            for h in significant_hashtags:
                h["rec_score"] = h["correlation"] * 0.6 + (h["avg_views"] / category_avg_views_for_rec) * 0.4
            significant_hashtags.sort(key=lambda x: x["rec_score"], reverse=True)
            top_tags_list = significant_hashtags[:min(5, len(significant_hashtags))]
        else:
            # 유의미한 해시태그가 부족하면 상위 3개 사용 (기존 방식)
            top_tags_list = sorted(hashtag_data, key=lambda x: x["correlation"], reverse=True)[:3]
        
        top_tags = [h["tag"].replace("#", "") for h in top_tags_list]
        combination_views = np.mean([h["avg_views"] for h in top_tags_list])
        avg_correlation = np.mean([h["correlation"] for h in top_tags_list])

        recommended = {
            # 태그에서 기존 '#' 제거 후 다시 추가 (중복 방지)
            "tags": [f"#{tag.lstrip('#')}" for tag in top_tags],
            "expected_views": f"{int(combination_views / 1000)}K~{int(combination_views / 1000 * 1.2)}K",
            "correlation": (
                "높음" if avg_correlation > 0.8 else "보통" if avg_correlation > 0.6 else "낮음"
            ),
        }
    else:
        recommended = {"tags": [], "expected_views": "0", "correlation": "낮음"}

    return hashtag_data, recommended


def get_wordcloud_data(
    db: Session, category_name: str, time_range_days: int = 7, max_words: int = 20
) -> List[Dict]:
    """워드클라우드용 해시태그 빈도 데이터 조회"""
    category = db.query(Category).filter(Category.name == category_name).first()
    if not category:
        return []

    cutoff_date = datetime.utcnow() - timedelta(days=time_range_days)

    # 해시태그별 빈도 계산
    hashtag_counts = (
        db.query(
            Hashtag.tag,
            func.count(VideoHashtag.video_id).label('frequency')
        )
        .join(VideoHashtag, VideoHashtag.hashtag_id == Hashtag.id)
        .join(Video, Video.id == VideoHashtag.video_id)
        .filter(
            and_(
                Video.category_id == category.id,
                Video.published_at >= cutoff_date,
            )
        )
        .group_by(Hashtag.tag)
        .order_by(func.count(VideoHashtag.video_id).desc())
        .limit(max_words)
        .all()
    )

    if not hashtag_counts:
        return []

    # 빈도 최대값 찾기 (크기 정규화용)
    max_frequency = max(count for _, count in hashtag_counts) if hashtag_counts else 1

    # 워드클라우드 데이터 생성
    wordcloud_data = []
    for tag, frequency in hashtag_counts:
        # 크기 정규화 (최소 10px, 최대 40px)
        size = int(10 + (frequency / max_frequency) * 30)
        wordcloud_data.append({
            "word": tag,
            "size": size,
            "frequency": int(frequency),
        })

    return wordcloud_data


def analyze_title_patterns(
    db: Session, category_name: str, time_range_days: int = 7
) -> Tuple[List[Dict], List[Dict], str]:
    """제목 패턴 분석 (pandas/numpy 활용)"""
    category = db.query(Category).filter(Category.name == category_name).first()
    if not category:
        return [], [], ""

    cutoff_date = datetime.utcnow() - timedelta(days=time_range_days)

    # 지정된 기간 내 영상 조회
    videos = (
        db.query(Video)
        .filter(
            and_(
                Video.category_id == category.id,
                Video.published_at >= cutoff_date,
            )
        )
        .all()
    )
    
    # 데이터가 부족하면 (10개 미만) 전체 기간 사용
    if len(videos) < 10:
        videos = (
            db.query(Video)
            .filter(Video.category_id == category.id)
            .all()
        )

    if not videos:
        return [], [], ""

    # pandas DataFrame으로 변환
    df = pd.DataFrame([{
        'title': v.title,
        'view_count': v.view_count,
    } for v in videos])

    # 패턴 분석 (pandas/numpy 활용)
    patterns_data = []

    # 숫자 포함
    df['has_number'] = df['title'].str.contains(r'\d+', regex=True, na=False)
    if df['has_number'].any():
        number_views = df[df['has_number']]['view_count']
        patterns_data.append({
            'pattern': '숫자 포함',
            'avg_views': int(number_views.mean()),
            'count': int(number_views.count()),
        })

    # 질문형
    df['is_question'] = (
        df['title'].str.contains('[?？]', regex=True, na=False) |
        df['title'].str.contains('알고|어떻게|왜|무엇', regex=True, na=False)
    )
    if df['is_question'].any():
        question_views = df[df['is_question']]['view_count']
        patterns_data.append({
            'pattern': '질문형',
            'avg_views': int(question_views.mean()),
            'count': int(question_views.count()),
        })

    # 긴급성 표현
    df['has_urgency'] = df['title'].str.contains('지금|바로|급하게|서둘러', regex=True, na=False)
    if df['has_urgency'].any():
        urgency_views = df[df['has_urgency']]['view_count']
        patterns_data.append({
            'pattern': '긴급성 표현',
            'avg_views': int(urgency_views.mean()),
            'count': int(urgency_views.count()),
        })

    # 비교형
    df['is_comparison'] = df['title'].str.contains('vs|VS|대비|비교|차이', regex=True, case=False, na=False)
    if df['is_comparison'].any():
        comparison_views = df[df['is_comparison']]['view_count']
        patterns_data.append({
            'pattern': '비교형',
            'avg_views': int(comparison_views.mean()),
            'count': int(comparison_views.count()),
        })

    # 후기/리뷰
    df['is_review'] = df['title'].str.contains('후기|리뷰|솔직|체험|사용기', regex=True, na=False)
    if df['is_review'].any():
        review_views = df[df['is_review']]['view_count']
        patterns_data.append({
            'pattern': '후기/리뷰',
            'avg_views': int(review_views.mean()),
            'count': int(review_views.count()),
        })

    pattern_data = sorted(patterns_data, key=lambda x: x['avg_views'], reverse=True)

    # 효과적인 키워드 분석 (pandas 활용)
    positive_keywords = ['꿀팁', '추천', '완벽', '최고', '솔직', '신상', '꿀템']
    
    all_keywords = []
    for _, row in df.iterrows():
        words = row['title'].split()
        for word in words:
            clean_word = ''.join(c for c in word if c.isalnum() or ord(c) >= 0xAC00)
            if len(clean_word) > 1:
                all_keywords.append({
                    'word': clean_word,
                    'view_count': row['view_count'],
                })

    if all_keywords:
        keyword_df = pd.DataFrame(all_keywords)
        keyword_stats = keyword_df.groupby('word').agg({
            'view_count': ['count', 'mean']
        }).reset_index()
        keyword_stats.columns = ['word', 'frequency', 'avg_views']

        # 최소 5회 이상 언급된 키워드만
        keyword_stats = keyword_stats[keyword_stats['frequency'] >= 5].copy()

        # 감성 분석 (numpy 활용)
        keyword_stats['sentiment'] = np.where(
            keyword_stats['word'].isin(positive_keywords), 'positive',
            np.where(keyword_stats['avg_views'] < 10000, 'negative', 'neutral')
        )

        # 상위 8개
        effective_keywords = keyword_stats.nlargest(8, 'frequency')[
            ['word', 'sentiment', 'frequency']
        ].to_dict('records')
    else:
        effective_keywords = []

    # 추천 문구 생성
    top_pattern = pattern_data[0] if pattern_data else None
    top_keyword = next(
        (k for k in effective_keywords if k['sentiment'] == 'positive'), None
    )
    recommendation = (
        f'"{top_keyword["word"]} + {top_pattern["pattern"]}" 조합 추천'
        if top_pattern and top_keyword
        else '"긍정 키워드 + 질문형" 조합 추천'
    )

    return pattern_data, effective_keywords, recommendation
