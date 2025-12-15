from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.mysql import DATETIME
from .database import Base


class Category(Base):
    """카테고리 테이블"""
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(50), unique=True, nullable=False, index=True)
    created_at = Column(DATETIME(fsp=6), server_default=func.now())

    videos = relationship("Video", back_populates="category")


class Video(Base):
    """YouTube 영상 데이터 테이블"""
    __tablename__ = "videos"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    video_id = Column(String(50), unique=True, nullable=False, index=True)
    title = Column(Text, nullable=False)
    description = Column(Text)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    published_at = Column(DATETIME(fsp=6), nullable=False, index=True)
    channel_id = Column(String(100), nullable=False, index=True)
    channel_title = Column(String(200), nullable=False)
    
    # 통계 데이터
    view_count = Column(Integer, default=0, nullable=False)
    like_count = Column(Integer, default=0, nullable=False)
    comment_count = Column(Integer, default=0, nullable=False)
    
    # 썸네일 URL
    thumbnail_default = Column(String(500))
    thumbnail_medium = Column(String(500))
    thumbnail_high = Column(String(500))
    
    # 수집 정보
    collected_at = Column(DATETIME(fsp=6), server_default=func.now(), index=True)
    updated_at = Column(DATETIME(fsp=6), onupdate=func.now())

    category = relationship("Category", back_populates="videos")
    hashtags = relationship("VideoHashtag", back_populates="video", cascade="all, delete-orphan")


class Hashtag(Base):
    """해시태그 테이블"""
    __tablename__ = "hashtags"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    tag = Column(String(100), unique=True, nullable=False, index=True)
    created_at = Column(DATETIME(fsp=6), server_default=func.now())

    videos = relationship("VideoHashtag", back_populates="hashtag")


class VideoHashtag(Base):
    """영상-해시태그 연결 테이블 (다대다 관계)"""
    __tablename__ = "video_hashtags"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    video_id = Column(Integer, ForeignKey("videos.id", ondelete="CASCADE"), nullable=False, index=True)
    hashtag_id = Column(Integer, ForeignKey("hashtags.id", ondelete="CASCADE"), nullable=False, index=True)

    video = relationship("Video", back_populates="hashtags")
    hashtag = relationship("Hashtag", back_populates="videos")


class TrendSnapshot(Base):
    """트렌드 스냅샷 테이블 (시계열 분석용)"""
    __tablename__ = "trend_snapshots"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    snapshot_date = Column(DATETIME(fsp=6), nullable=False, index=True)
    
    # 집계 데이터
    total_videos = Column(Integer, default=0, nullable=False)
    total_views = Column(Integer, default=0, nullable=False)
    total_likes = Column(Integer, default=0, nullable=False)
    total_comments = Column(Integer, default=0, nullable=False)
    avg_views = Column(Float, default=0.0, nullable=False)
    avg_engagement_rate = Column(Float, default=0.0, nullable=False)
    
    created_at = Column(DATETIME(fsp=6), server_default=func.now())

    category = relationship("Category")

