import { useState, useEffect } from 'react';
import { getAnalysis, type AnalysisResponse } from '../services/backendApi';

interface UseYouTubeDataOptions {
  category: string;
  timeRange?: '7days' | '30days';
  maxResults?: number;
  enabled?: boolean;
}

interface UseYouTubeDataReturn {
  data: AnalysisResponse | null; // 백엔드 분석 데이터
  loading: boolean;
  error: Error | null;
}

/**
 * YouTube 데이터를 가져오는 커스텀 훅
 * 백엔드 API의 분석 데이터를 가져옵니다
 */
export function useYouTubeData({
  category,
  timeRange = '7days',
  maxResults = 50,
  enabled = true,
}: UseYouTubeDataOptions): UseYouTubeDataReturn {
  const [data, setData] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    getAnalysis(category, timeRange)
      .then((analysisData: AnalysisResponse) => {
        setData(analysisData);
      })
      .catch((err) => {
        const error = err instanceof Error ? err : new Error('데이터를 불러오는 중 오류가 발생했습니다.');
        setError(error);
        console.error('YouTube 데이터 가져오기 실패:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [category, timeRange, enabled]);

  return {
    data,
    loading,
    error,
  };
}

