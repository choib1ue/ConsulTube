// YouTube Data API v3 타입 정의

export interface YouTubeSearchItem {
  kind: string;
  etag: string;
  id: {
    kind: string;
    videoId: string;
  };
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: {
      default: { url: string; width: number; height: number };
      medium: { url: string; width: number; height: number };
      high: { url: string; width: number; height: number };
    };
    channelTitle: string;
    liveBroadcastContent: string;
    publishTime: string;
  };
}

export interface YouTubeSearchResponse {
  kind: string;
  etag: string;
  nextPageToken?: string;
  prevPageToken?: string;
  regionCode: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
  items: YouTubeSearchItem[];
}

export interface YouTubeVideoStatistics {
  viewCount: string;
  likeCount: string;
  favoriteCount: string;
  commentCount: string;
}

export interface YouTubeVideoItem {
  kind: string;
  etag: string;
  id: string;
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: {
      default: { url: string; width: number; height: number };
      medium: { url: string; width: number; height: number };
      high: { url: string; width: number; height: number };
      standard?: { url: string; width: number; height: number };
      maxres?: { url: string; width: number; height: number };
    };
    channelTitle: string;
    tags?: string[];
    categoryId: string;
    liveBroadcastContent: string;
    localized?: {
      title: string;
      description: string;
    };
  };
  statistics: YouTubeVideoStatistics;
}

export interface YouTubeVideoResponse {
  kind: string;
  etag: string;
  items: YouTubeVideoItem[];
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
}

// ConsulTube에서 사용하는 통합 데이터 타입
export interface VideoData {
  videoId: string;
  title: string;
  description: string;
  tags: string[];
  categoryId: string;
  publishedAt: string;
  channelId: string;
  channelTitle: string;
  statistics: {
    viewCount: number;
    likeCount: number;
    commentCount: number;
  };
  thumbnails: {
    default: string;
    medium: string;
    high: string;
  };
}

// 트렌드 분석용 데이터 타입
export interface TrendData {
  date: string;
  views: number;
  engagement: number;
  videos: number;
}

export interface TrendingTopic {
  topic: string;
  count: number;
  growth: string;
}

// 해시태그 분석용 데이터 타입
export interface HashtagData {
  tag: string;
  avgViews: number;
  correlation: number;
  growth: string;
  videoCount: number;
}

export interface HashtagCombination {
  tags: string[];
  expectedViews: string;
  correlation: string;
}

// 제목 패턴 분석용 데이터 타입
export interface TitlePattern {
  pattern: string;
  avgViews: number;
  count: number;
}

export interface EffectiveKeyword {
  word: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  frequency: number;
}

// API 요청 파라미터 타입
export interface SearchParams {
  q: string;
  maxResults?: number;
  order?: 'date' | 'rating' | 'relevance' | 'title' | 'videoCount' | 'viewCount';
  publishedAfter?: string;
  publishedBefore?: string;
  regionCode?: string;
  type?: 'video' | 'channel' | 'playlist';
  pageToken?: string;
}

export interface VideosParams {
  id: string[];
  part?: string[];
}

