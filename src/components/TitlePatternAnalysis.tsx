import React, { useState } from 'react';
import { Type, Sparkles, Loader2, X, ExternalLink, HelpCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useYouTubeData } from '../hooks/useYouTubeData';
import { analyzeTitlePatterns } from '../utils/analysis';
import { getKeywordVideos, type KeywordVideosResponse } from '../services/backendApi';

interface TitlePatternAnalysisProps {
  category: string;
  onPopupStateChange?: (isOpen: boolean) => void;
}

export function TitlePatternAnalysis({ category, onPopupStateChange }: TitlePatternAnalysisProps) {
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  const [keywordVideos, setKeywordVideos] = useState<KeywordVideosResponse | null>(null);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [isPatternModalOpen, setIsPatternModalOpen] = useState(false);
  
  // 카테고리 변경 시 키워드 영상 목록 닫기
  React.useEffect(() => {
    setSelectedKeyword(null);
    setKeywordVideos(null);
  }, [category]);
  
  // 팝업 상태 변경 시 부모 컴포넌트에 알림
  React.useEffect(() => {
    if (onPopupStateChange) {
      onPopupStateChange(selectedKeyword !== null);
    }
  }, [selectedKeyword, onPopupStateChange]);
  
  const { data, loading, error } = useYouTubeData({
    category,
    timeRange: '30days',
    maxResults: 50,
    enabled: true,
  });

  const patternResult = analyzeTitlePatterns(data);
  const patternData = patternResult.patternData;
  const effectiveKeywords = patternResult.effectiveKeywords;
  const recommendation = patternResult.recommendation || '';
  
  // 디버깅: recommendation 값 확인
  if (data && !recommendation) {
    console.warn('추천 문구가 없습니다:', {
      hasData: !!data,
      recommendation: data.recommendation,
      titlePatterns: data.title_patterns?.length,
      effectiveKeywords: data.effective_keywords?.length,
    });
  }

  const handleKeywordClick = async (keyword: string) => {
    setSelectedKeyword(keyword);
    setLoadingVideos(true);
    setKeywordVideos(null);
    
    try {
      const videos = await getKeywordVideos(category, keyword);
      setKeywordVideos(videos);
    } catch (err) {
      console.error('키워드 영상 조회 실패:', err);
    } finally {
      setLoadingVideos(false);
    }
  };

  const formatViews = (views: number): string => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return String(views);
  };
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin" style={{ color: '#FF0000' }} />
          <span className="ml-2 text-gray-600">데이터를 불러오는 중...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-red-600 mb-2">데이터를 불러오는 중 오류가 발생했습니다.</p>
            <p className="text-gray-500 text-sm">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Type className="size-5" style={{ color: '#FF0000' }} />
        <h3 style={{ color: '#202020' }}>제목 패턴 분석</h3>
      </div>

      {patternData.length > 0 ? (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <h4 className="text-gray-700 text-sm">효과적인 제목 패턴</h4>
            <button
              onClick={() => setIsPatternModalOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <HelpCircle className="size-4" />
              <span>분석 기준</span>
            </button>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={patternData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" stroke="#9ca3af" />
              <YAxis type="category" dataKey="pattern" stroke="#9ca3af" width={100} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
                formatter={(value: number) => [`${value.toLocaleString()}`, '평균 조회수']}
                labelFormatter={(label) => `${label}`}
              />
              <Bar dataKey="avgViews" fill="#FF0000" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : null}

      {effectiveKeywords.length > 0 && (
        <div>
          <h4 className="text-gray-700 mb-3 text-sm flex items-center gap-2">
            <Sparkles className="size-4 text-yellow-500" />
            고성과 키워드
          </h4>
          <div className="flex flex-wrap gap-2">
            {effectiveKeywords.map((keyword) => (
              <button
                key={keyword.word}
                onClick={() => handleKeywordClick(keyword.word)}
                className="px-3 py-2 rounded-lg border bg-white border-gray-200 text-gray-700 hover:border-red-300 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span>{keyword.word}</span>
                  <span className="text-xs opacity-70">{keyword.frequency}</span>
                </div>
              </button>
            ))}
          </div>
          
          {/* 키워드 영상 목록 모달 */}
          {selectedKeyword && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setSelectedKeyword(null)}>
              <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold" style={{ color: '#202020' }}>
                      "{selectedKeyword}" 키워드 영상 목록
                    </h3>
                    <button
                      onClick={() => setSelectedKeyword(null)}
                      className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="size-5 text-gray-500" />
                    </button>
                  </div>
                  {loadingVideos ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="size-6 animate-spin" style={{ color: '#FF0000' }} />
                      <span className="ml-2 text-gray-600">영상 목록을 불러오는 중...</span>
                    </div>
                  ) : keywordVideos && keywordVideos.videos.length > 0 ? (
                    <div className="space-y-2">
                      {keywordVideos.videos.map((video, index) => (
                        <a
                          key={video.video_id}
                          href={`https://www.youtube.com/watch?v=${video.video_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-colors"
                        >
                          <div className="flex-shrink-0">
                            {video.thumbnail_medium ? (
                              <img
                                src={video.thumbnail_medium}
                                alt={video.title}
                                className="w-20 h-14 object-cover rounded"
                              />
                            ) : (
                              <div className="w-20 h-14 bg-gray-200 rounded flex items-center justify-center">
                                <ExternalLink className="size-4 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-base font-medium text-gray-900 line-clamp-1 mb-1">
                              {video.title}
                            </h4>
                            <p className="text-sm text-gray-600 mb-1">{video.channel_title}</p>
                            <div className="flex items-center gap-3 text-sm text-gray-500">
                              <span>조회 {formatViews(video.view_count)}</span>
                              <span>좋아요 {formatViews(video.like_count)}</span>
                              <span>댓글 {formatViews(video.comment_count)}</span>
                            </div>
                          </div>
                          <ExternalLink className="size-4 text-gray-400 flex-shrink-0 mr-2" />
                        </a>
                      ))}
                    </div>
                  ) : keywordVideos && keywordVideos.videos.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      "{selectedKeyword}" 키워드가 포함된 영상을 찾을 수 없습니다.
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {recommendation && recommendation.trim() !== '' && (
        <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div className="text-purple-900 mb-1 text-sm">제목 작성 팁</div>
          <div className="text-purple-700 text-sm">
            {recommendation}
          </div>
        </div>
      )}

      {/* 제목 패턴 분석 기준 모달 */}
      {isPatternModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]" onClick={() => setIsPatternModalOpen(false)}>
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold" style={{ color: '#202020' }}>제목 패턴 분석 기준</h3>
              <button
                onClick={() => setIsPatternModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="size-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4 text-gray-700">
              <p className="text-sm leading-relaxed">
                ConsulTube는 YouTube 영상 제목을 분석하여 효과적인 제목 패턴을 찾아드립니다. 다음과 같은 기준으로 제목을 분석합니다:
              </p>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div>
                  <h4 className="font-semibold text-sm mb-2" style={{ color: '#202020' }}>1. 숫자 포함</h4>
                  <p className="text-sm text-gray-600">제목에 숫자가 포함된 경우 (예: "5가지", "10분", "2024년")</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-2" style={{ color: '#202020' }}>2. 질문형</h4>
                  <p className="text-sm text-gray-600">물음표(?) 또는 질문형 단어가 포함된 경우 (예: "알고 계셨나요?", "어떻게", "왜", "무엇")</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-2" style={{ color: '#202020' }}>3. 긴급성 표현</h4>
                  <p className="text-sm text-gray-600">긴급성을 나타내는 단어가 포함된 경우 (예: "지금", "바로", "급하게", "서둘러")</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-2" style={{ color: '#202020' }}>4. 비교형</h4>
                  <p className="text-sm text-gray-600">비교를 나타내는 단어가 포함된 경우 (예: "vs", "대비", "비교", "차이")</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-2" style={{ color: '#202020' }}>5. 후기/리뷰</h4>
                  <p className="text-sm text-gray-600">후기나 리뷰를 나타내는 단어가 포함된 경우 (예: "후기", "리뷰", "솔직", "체험", "사용기")</p>
                </div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-sm mb-2" style={{ color: '#202020' }}>분석 방법:</h4>
                <ul className="text-sm space-y-1 pl-4 list-disc text-gray-600">
                  <li>각 패턴별로 해당하는 영상들의 평균 조회수를 계산합니다</li>
                  <li>평균 조회수가 높은 순서로 패턴을 정렬하여 표시합니다</li>
                  <li>해당 카테고리의 최근 30일 데이터를 기반으로 분석합니다</li>
                </ul>
              </div>
              <p className="text-xs text-gray-500">
                참고: 제목 패턴 분석은 해당 카테고리의 실제 영상 데이터를 기반으로 하며, 패턴과 조회수 간의 상관관계를 보여줍니다.
              </p>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsPatternModalOpen(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                style={{ color: '#202020' }}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
