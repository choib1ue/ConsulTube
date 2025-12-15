import type { AnalysisResponse } from '../services/backendApi';

/**
 * 메트릭 계산 (백엔드 API 데이터 기반)
 */
export function calculateMetrics(analysisData: AnalysisResponse | null) {
  if (!analysisData) {
    return {
      avgViews: '0',
      trendingTopics: 0,
      recommendedHashtags: 0,
      totalVideos: 0,
    };
  }

  return {
    avgViews: analysisData.avg_views,
    trendingTopics: analysisData.trending_topics.length,
    recommendedHashtags: analysisData.recommended_hashtags.tags.length,
    totalVideos: analysisData.total_videos,
  };
}

/**
 * 트렌드 분석 (백엔드 API 데이터 기반)
 */
export function analyzeTrends(
  analysisData: AnalysisResponse | null,
  timeRange: '7days' | '30days' = '7days'
) {
  if (!analysisData) {
    return {
      trendData: [],
      trendingTopics: [],
    };
  }

  return {
    trendData: analysisData.trend_data.map(trend => ({
      date: trend.date,
      views: trend.views,
      engagement: trend.engagement,
      videos: trend.videos,
    })),
    trendingTopics: analysisData.trending_topics.map(topic => ({
      topic: topic.topic,
      count: topic.count,
      growth: topic.growth,
    })),
  };
}

/**
 * 해시태그 분석 (백엔드 API 데이터 기반)
 */
export function analyzeHashtags(analysisData: AnalysisResponse | null) {
  if (!analysisData) {
    return {
      hashtagData: [],
      recommendedCombination: {
        tags: [],
        expectedViews: '0',
        correlation: '낮음',
      },
    };
  }

  const hashtagData = analysisData.hashtag_stats.map(stat => ({
    tag: stat.tag,
    avgViews: stat.avg_views,
    correlation: stat.correlation,
    growth: stat.growth,
    videoCount: stat.video_count,
  }));

  return {
    hashtagData,
    recommendedCombination: {
      tags: analysisData.recommended_hashtags.tags,
      expectedViews: analysisData.recommended_hashtags.expected_views,
      correlation: analysisData.recommended_hashtags.correlation,
    },
  };
}

/**
 * 제목 패턴 분석 (백엔드 API 데이터 기반)
 */
export function analyzeTitlePatterns(analysisData: AnalysisResponse | null) {
  if (!analysisData) {
    return {
      patternData: [],
      effectiveKeywords: [],
      recommendation: '',
    };
  }

  const patternData = analysisData.title_patterns.map(pattern => ({
    pattern: pattern.pattern,
    avgViews: pattern.avg_views,
    count: pattern.count,
  }));

  const effectiveKeywords = analysisData.effective_keywords.map(keyword => ({
    word: keyword.word,
    sentiment: keyword.sentiment,
    frequency: keyword.frequency,
  }));

  return {
    patternData,
    effectiveKeywords,
    recommendation: analysisData.recommendation,
  };
}

