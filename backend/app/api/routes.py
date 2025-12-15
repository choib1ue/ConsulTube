from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict
import random
from ..database import get_db
from ..schemas import (
    AnalysisResponse,
    MetricsResponse,
    DataCollectionRequest,
    DataCollectionResponse,
)
from ..services.data_collector import DataCollector
from ..utils.analysis import (
    calculate_metrics,
    analyze_trends,
    analyze_hashtags,
    analyze_title_patterns,
    get_wordcloud_data,
)

router = APIRouter()


@router.get("/health")
async def health_check():
    """헬스 체크"""
    return {"status": "ok", "message": "ConsulTube API is running"}


@router.get("/last-collection-time")
async def get_last_collection_time(db: Session = Depends(get_db)):
    """마지막 데이터 수집 시간 조회"""
    from sqlalchemy import func
    from ..models import Video
    
    # 가장 최근 수집 시간 조회
    last_collection = (
        db.query(func.max(Video.collected_at))
        .scalar()
    )
    
    if last_collection:
        return {
            "last_collection_time": last_collection.isoformat(),
            "has_data": True,
        }
    else:
        return {
            "last_collection_time": None,
            "has_data": False,
        }


@router.post("/collect", response_model=DataCollectionResponse)
async def collect_data(
    request: DataCollectionRequest, db: Session = Depends(get_db)
):
    """YouTube 데이터 수집"""
    try:
        collector = DataCollector(db)
        videos_collected = collector.collect_videos(
            category_name=request.category,
            time_range_days=request.time_range_days,
            max_results=request.max_results,
        )

        return DataCollectionResponse(
            success=True,
            message=f"{request.category} 카테고리 데이터 수집 완료",
            videos_collected=videos_collected,
            category=request.category,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/metrics/{category}", response_model=MetricsResponse)
async def get_metrics(
    category: str,
    time_range: str = "7days",
    db: Session = Depends(get_db),
):
    """메트릭 카드 데이터 조회"""
    time_range_days = 7 if time_range == "7days" else 30
    metrics = calculate_metrics(db, category, time_range_days)
    return MetricsResponse(**metrics)


@router.get("/analysis/{category}", response_model=AnalysisResponse)
async def get_analysis(
    category: str,
    time_range: str = "7days",
    db: Session = Depends(get_db),
):
    """전체 분석 데이터 조회"""
    time_range_days = 7 if time_range == "7days" else 30

    # 각 분석 함수 호출
    metrics = calculate_metrics(db, category, time_range_days)
    trend_data, trending_topics = analyze_trends(db, category, time_range_days)
    hashtag_stats, recommended_hashtags = analyze_hashtags(
        db, category, time_range_days
    )
    title_patterns, effective_keywords, recommendation = analyze_title_patterns(
        db, category, time_range_days
    )

    return AnalysisResponse(
        category=category,
        time_range=time_range,
        total_videos=metrics["total_videos"],
        avg_views=metrics["avg_views"],
        trending_topics=trending_topics,
        trend_data=trend_data,
        hashtag_stats=hashtag_stats,
        recommended_hashtags=recommended_hashtags,
        title_patterns=title_patterns,
        effective_keywords=effective_keywords,
        recommendation=recommendation,
    )


@router.get("/trends/{category}")
async def get_trends(
    category: str,
    time_range: str = "7days",
    db: Session = Depends(get_db),
):
    """트렌드 데이터 조회"""
    time_range_days = 7 if time_range == "7days" else 30
    trend_data, trending_topics = analyze_trends(db, category, time_range_days)
    return {"trend_data": trend_data, "trending_topics": trending_topics}


@router.get("/hashtags/{category}")
async def get_hashtags(
    category: str,
    time_range: str = "7days",
    db: Session = Depends(get_db),
):
    """해시태그 분석 데이터 조회"""
    time_range_days = 7 if time_range == "7days" else 30
    hashtag_stats, recommended_hashtags = analyze_hashtags(
        db, category, time_range_days
    )
    return {
        "hashtag_stats": hashtag_stats,
        "recommended_hashtags": recommended_hashtags,
    }


@router.get("/title-patterns/{category}")
async def get_title_patterns(
    category: str,
    time_range: str = "7days",
    db: Session = Depends(get_db),
):
    """제목 패턴 분석 데이터 조회"""
    time_range_days = 7 if time_range == "7days" else 30
    title_patterns, effective_keywords, recommendation = analyze_title_patterns(
        db, category, time_range_days
    )
    return {
        "title_patterns": title_patterns,
        "effective_keywords": effective_keywords,
        "recommendation": recommendation,
    }


@router.get("/wordcloud/{category}")
async def get_wordcloud(
    category: str,
    time_range: str = "7days",
    max_words: int = 20,
    db: Session = Depends(get_db),
):
    """워드클라우드용 해시태그 빈도 데이터 조회"""
    time_range_days = 7 if time_range == "7days" else 30
    wordcloud_data = get_wordcloud_data(db, category, time_range_days, max_words)
    return {
        "words": wordcloud_data,
        "total_keywords": len(wordcloud_data),
        "time_range": time_range,
    }


@router.get("/keyword-videos/{category}/{keyword}")
async def get_keyword_videos(
    category: str,
    keyword: str,
    db: Session = Depends(get_db),
):
    """키워드가 포함된 영상 목록 조회 (랜덤 순서)"""
    from ..models import Video, Category
    from sqlalchemy import and_
    
    # 카테고리 확인
    category_obj = db.query(Category).filter(Category.name == category).first()
    if not category_obj:
        raise HTTPException(status_code=404, detail=f"카테고리 '{category}'를 찾을 수 없습니다.")
    
    # 키워드가 제목에 포함된 영상 조회 (랜덤 순서, 최대 10개)
    videos = (
        db.query(Video)
        .filter(
            and_(
                Video.category_id == category_obj.id,
                Video.title.contains(keyword)
            )
        )
        .all()
    )
    # 랜덤으로 섞기
    videos = random.sample(videos, min(10, len(videos))) if len(videos) > 10 else videos
    
    # 응답 데이터 구성
    video_list = []
    for video in videos:
        video_list.append({
            "video_id": video.video_id,
            "title": video.title,
            "channel_title": video.channel_title,
            "view_count": video.view_count,
            "like_count": video.like_count,
            "comment_count": video.comment_count,
            "published_at": video.published_at.isoformat() if video.published_at else None,
            "thumbnail_medium": video.thumbnail_medium,
        })
    
    return {
        "keyword": keyword,
        "category": category,
        "total_count": len(video_list),
        "videos": video_list
    }

