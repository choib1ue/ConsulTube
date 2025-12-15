import { useState, useEffect, useCallback } from 'react';
import {
  getMetrics,
  getAnalysis,
  getTrends,
  getHashtags,
  getTitlePatterns,
  type MetricsResponse,
  type AnalysisResponse,
  type TrendData,
  type TrendingTopic,
  type HashtagStats,
  type HashtagCombination,
  type TitlePattern,
  type EffectiveKeyword,
} from '../services/backendApi';

interface UseBackendDataOptions {
  category: string;
  timeRange?: '7days' | '30days';
  enabled?: boolean;
}

interface UseBackendDataReturn {
  metrics: MetricsResponse | null;
  analysis: AnalysisResponse | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * 백엔드 API에서 데이터를 가져오는 커스텀 훅
 */
export function useBackendData({
  category,
  timeRange = '7days',
  enabled = true,
}: UseBackendDataOptions): UseBackendDataReturn {
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      const [metricsData, analysisData] = await Promise.all([
        getMetrics(category, timeRange),
        getAnalysis(category, timeRange),
      ]);

      setMetrics(metricsData);
      setAnalysis(analysisData);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('알 수 없는 오류가 발생했습니다.');
      setError(error);
      console.error('백엔드 데이터 가져오기 실패:', error);
    } finally {
      setLoading(false);
    }
  }, [category, timeRange, enabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    metrics,
    analysis,
    loading,
    error,
    refetch: fetchData,
  };
}

/**
 * 트렌드 데이터만 가져오는 훅
 */
export function useTrends(category: string, timeRange: '7days' | '30days' = '7days') {
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    getTrends(category, timeRange)
      .then((data) => {
        setTrendData(data.trend_data);
        setTrendingTopics(data.trending_topics);
      })
      .catch((err) => {
        const error = err instanceof Error ? err : new Error('트렌드 데이터 조회 실패');
        setError(error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [category, timeRange]);

  return { trendData, trendingTopics, loading, error };
}

/**
 * 해시태그 데이터만 가져오는 훅
 */
export function useHashtags(category: string, timeRange: '7days' | '30days' = '7days') {
  const [hashtagStats, setHashtagStats] = useState<HashtagStats[]>([]);
  const [recommendedHashtags, setRecommendedHashtags] = useState<HashtagCombination>({
    tags: [],
    expected_views: '0',
    correlation: '낮음',
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    getHashtags(category, timeRange)
      .then((data) => {
        setHashtagStats(data.hashtag_stats);
        setRecommendedHashtags(data.recommended_hashtags);
      })
      .catch((err) => {
        const error = err instanceof Error ? err : new Error('해시태그 데이터 조회 실패');
        setError(error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [category, timeRange]);

  return { hashtagStats, recommendedHashtags, loading, error };
}

/**
 * 제목 패턴 데이터만 가져오는 훅
 */
export function useTitlePatterns(category: string, timeRange: '7days' | '30days' = '7days') {
  const [titlePatterns, setTitlePatterns] = useState<TitlePattern[]>([]);
  const [effectiveKeywords, setEffectiveKeywords] = useState<EffectiveKeyword[]>([]);
  const [recommendation, setRecommendation] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    getTitlePatterns(category, timeRange)
      .then((data) => {
        setTitlePatterns(data.title_patterns);
        setEffectiveKeywords(data.effective_keywords);
        setRecommendation(data.recommendation);
      })
      .catch((err) => {
        const error = err instanceof Error ? err : new Error('제목 패턴 데이터 조회 실패');
        setError(error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [category, timeRange]);

  return { titlePatterns, effectiveKeywords, recommendation, loading, error };
}

