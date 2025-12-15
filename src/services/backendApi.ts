/**
 * 백엔드 API 호출 서비스
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export interface MetricsResponse {
  avg_views: string;
  trending_topics: number;
  recommended_hashtags: number;
  total_videos: number;
}

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

export interface HashtagStats {
  tag: string;
  avg_views: number;
  correlation: number;
  growth: string;
  video_count: number;
}

export interface HashtagCombination {
  tags: string[];
  expected_views: string;
  correlation: string;
}

export interface TitlePattern {
  pattern: string;
  avg_views: number;
  count: number;
}

export interface EffectiveKeyword {
  word: string;
  sentiment: string;
  frequency: number;
}

export interface AnalysisResponse {
  category: string;
  time_range: string;
  total_videos: number;
  avg_views: string;
  trending_topics: TrendingTopic[];
  trend_data: TrendData[];
  hashtag_stats: HashtagStats[];
  recommended_hashtags: HashtagCombination;
  title_patterns: TitlePattern[];
  effective_keywords: EffectiveKeyword[];
  recommendation: string;
}

/**
 * 메트릭 카드 데이터 조회
 */
export async function getMetrics(
  category: string,
  timeRange: '7days' | '30days' = '7days'
): Promise<MetricsResponse> {
  const response = await fetch(
    `${API_BASE_URL}/metrics/${encodeURIComponent(category)}?time_range=${timeRange}`
  );

  if (!response.ok) {
    throw new Error(`메트릭 데이터 조회 실패: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 전체 분석 데이터 조회
 */
export async function getAnalysis(
  category: string,
  timeRange: '7days' | '30days' = '7days'
): Promise<AnalysisResponse> {
  const response = await fetch(
    `${API_BASE_URL}/analysis/${encodeURIComponent(category)}?time_range=${timeRange}`
  );

  if (!response.ok) {
    throw new Error(`분석 데이터 조회 실패: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 트렌드 데이터 조회
 */
export async function getTrends(
  category: string,
  timeRange: '7days' | '30days' = '7days'
): Promise<{ trend_data: TrendData[]; trending_topics: TrendingTopic[] }> {
  const response = await fetch(
    `${API_BASE_URL}/trends/${encodeURIComponent(category)}?time_range=${timeRange}`
  );

  if (!response.ok) {
    throw new Error(`트렌드 데이터 조회 실패: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 해시태그 분석 데이터 조회
 */
export async function getHashtags(
  category: string,
  timeRange: '7days' | '30days' = '7days'
): Promise<{
  hashtag_stats: HashtagStats[];
  recommended_hashtags: HashtagCombination;
}> {
  const response = await fetch(
    `${API_BASE_URL}/hashtags/${encodeURIComponent(category)}?time_range=${timeRange}`
  );

  if (!response.ok) {
    throw new Error(`해시태그 데이터 조회 실패: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 제목 패턴 분석 데이터 조회
 */
export async function getTitlePatterns(
  category: string,
  timeRange: '7days' | '30days' = '7days'
): Promise<{
  title_patterns: TitlePattern[];
  effective_keywords: EffectiveKeyword[];
  recommendation: string;
}> {
  const response = await fetch(
    `${API_BASE_URL}/title-patterns/${encodeURIComponent(category)}?time_range=${timeRange}`
  );

  if (!response.ok) {
    throw new Error(`제목 패턴 데이터 조회 실패: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 데이터 수집 요청
 */
export async function collectData(
  category: string,
  timeRangeDays: number = 7,
  maxResults: number = 50
): Promise<{ success: boolean; message: string; videos_collected: number; category: string }> {
  const response = await fetch(`${API_BASE_URL}/collect`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      category,
      time_range_days: timeRangeDays,
      max_results: maxResults,
    }),
  });

  if (!response.ok) {
    throw new Error(`데이터 수집 실패: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 마지막 데이터 수집 시간 조회
 */
export async function getLastCollectionTime(): Promise<{
  last_collection_time: string | null;
  has_data: boolean;
}> {
  const response = await fetch(`${API_BASE_URL}/last-collection-time`);

  if (!response.ok) {
    throw new Error(`마지막 수집 시간 조회 실패: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 워드클라우드 데이터 조회
 */
export interface WordCloudWord {
  word: string;
  size: number;
  frequency: number;
}

export interface WordCloudResponse {
  words: WordCloudWord[];
  total_keywords: number;
  time_range: string;
}

export async function getWordCloud(
  category: string,
  timeRange: '7days' | '30days' = '7days',
  maxWords: number = 20
): Promise<WordCloudResponse> {
  const response = await fetch(
    `${API_BASE_URL}/wordcloud/${encodeURIComponent(category)}?time_range=${timeRange}&max_words=${maxWords}`
  );

  if (!response.ok) {
    throw new Error(`워드클라우드 데이터 조회 실패: ${response.statusText}`);
  }

  return response.json();
}

export interface KeywordVideo {
  video_id: string;
  title: string;
  channel_title: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  published_at: string | null;
  thumbnail_medium: string | null;
}

export interface KeywordVideosResponse {
  keyword: string;
  category: string;
  total_count: number;
  videos: KeywordVideo[];
}

export async function getKeywordVideos(
  category: string,
  keyword: string
): Promise<KeywordVideosResponse> {
  const response = await fetch(
    `${API_BASE_URL}/keyword-videos/${encodeURIComponent(category)}/${encodeURIComponent(keyword)}`
  );

  if (!response.ok) {
    throw new Error(`키워드 영상 조회 실패: ${response.statusText}`);
  }

  return response.json();
}

