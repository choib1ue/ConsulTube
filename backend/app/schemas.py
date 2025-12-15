from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional


class VideoBase(BaseModel):
    video_id: str
    title: str
    description: Optional[str] = None
    published_at: datetime
    channel_id: str
    channel_title: str
    view_count: int = 0
    like_count: int = 0
    comment_count: int = 0
    thumbnail_default: Optional[str] = None
    thumbnail_medium: Optional[str] = None
    thumbnail_high: Optional[str] = None
    tags: List[str] = []


class VideoCreate(VideoBase):
    category_name: Optional[str] = None


class VideoResponse(VideoBase):
    id: int
    category_id: Optional[int] = None
    collected_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CategoryResponse(BaseModel):
    id: int
    name: str
    created_at: datetime

    class Config:
        from_attributes = True


class HashtagStats(BaseModel):
    tag: str
    avg_views: float
    video_count: int
    correlation: float
    growth: str


class TrendData(BaseModel):
    date: str
    views: float
    engagement: int
    videos: int


class TrendingTopic(BaseModel):
    topic: str
    count: int
    growth: str


class TitlePattern(BaseModel):
    pattern: str
    avg_views: int
    count: int


class EffectiveKeyword(BaseModel):
    word: str
    sentiment: str
    frequency: int


class HashtagCombination(BaseModel):
    tags: List[str]
    expected_views: str
    correlation: str


class AnalysisResponse(BaseModel):
    """분석 결과 응답"""
    category: str
    time_range: str
    total_videos: int
    avg_views: str
    trending_topics: List[TrendingTopic]
    trend_data: List[TrendData]
    hashtag_stats: List[HashtagStats]
    recommended_hashtags: HashtagCombination
    title_patterns: List[TitlePattern]
    effective_keywords: List[EffectiveKeyword]
    recommendation: str


class MetricsResponse(BaseModel):
    """메트릭 카드 데이터"""
    avg_views: str
    trending_topics: int
    recommended_hashtags: int
    total_videos: int


class DataCollectionRequest(BaseModel):
    category: str
    time_range_days: int = 7
    max_results: int = 50


class DataCollectionResponse(BaseModel):
    success: bool
    message: str
    videos_collected: int
    category: str

