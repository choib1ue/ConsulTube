import React, { useState } from 'react';
import { Hash, ArrowUpRight, Loader2, X, HelpCircle } from 'lucide-react';
import { useYouTubeData } from '../hooks/useYouTubeData';
import { analyzeHashtags } from '../utils/analysis';

interface HashtagAnalysisProps {
  category: string;
}

export function HashtagAnalysis({ category }: HashtagAnalysisProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data, loading, error } = useYouTubeData({
    category,
    timeRange: '30days',
    maxResults: 50,
    enabled: true,
  });

  const hashtagResult = analyzeHashtags(data);
  const hashtagData = hashtagResult.hashtagData;
  const recommendedCombination = hashtagResult.recommendedCombination;
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

  const formatViews = (views: number): string => {
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return String(views);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
        <Hash className="size-5" style={{ color: '#FF0000' }} />
        <h3 style={{ color: '#202020' }}>해시태그 효과 분석</h3>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <HelpCircle className="size-4" />
          <span>상관도란?</span>
        </button>
      </div>

      {/* 모달창 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold" style={{ color: '#202020' }}>상관도 계산 방식</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="size-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4 text-gray-700">
              <p className="text-sm leading-relaxed">
                ConsulTube에서 사용하는 <strong>상관도</strong>는 해시태그와 영상 성과 간의 연관성을 나타내는 지표입니다.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-sm" style={{ color: '#202020' }}>계산 방식:</h4>
                <div className="text-sm space-y-1 pl-4">
                  <p>• 참여율(Engagement Rate) = (평균 좋아요 수 / 평균 조회수) × 100</p>
                  <p>• 상관도 = 카테고리 내 모든 해시태그의 참여율을 0.5 ~ 0.95 범위로 정규화</p>
                  <p>• 참여율이 높을수록 상관도가 높게 계산됩니다</p>
                  <p>• 높은 상관도는 해당 해시태그를 사용한 영상들이 평균보다 높은 참여도를 보인다는 것을 의미합니다</p>
                </div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-sm mb-2" style={{ color: '#202020' }}>해석 방법:</h4>
                <ul className="text-sm space-y-1 pl-4 list-disc">
                  <li><strong>높음 (0.8 이상):</strong> 해당 해시태그를 사용한 영상들이 높은 참여도를 보입니다</li>
                  <li><strong>보통 (0.6 ~ 0.8):</strong> 평균적인 효과를 보입니다</li>
                  <li><strong>낮음 (0.6 미만):</strong> 상대적으로 낮은 참여도를 보입니다</li>
                </ul>
              </div>
              <p className="text-xs text-gray-500">
                참고: 상관도는 해시태그와 영상 성과 간의 통계적 연관성을 나타내며, 인과관계를 의미하지는 않습니다.
              </p>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                style={{ color: '#202020' }}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {recommendedCombination.tags.length > 0 && (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-blue-900 mb-1">추천 해시태그 조합</div>
          <div className="text-blue-700 text-sm">
            {recommendedCombination.tags.join(' ')}
          </div>
          <div className="text-blue-600 text-xs mt-2">
            예상 조회수: {recommendedCombination.expectedViews} | 상관도: {recommendedCombination.correlation}
          </div>
        </div>
      )}

      {hashtagData.length > 0 ? (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {hashtagData.map((item) => (
            <div key={item.tag} className="p-3 border border-gray-200 rounded-lg hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-2">
                <span style={{ color: '#202020' }}>{item.tag}</span>
                <span className="text-green-600 text-sm flex items-center gap-1">
                  {item.growth} 성장률
                  <ArrowUpRight className="size-3" />
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">평균 조회수: {formatViews(item.avgViews)}</span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">상관도:</span>
                  <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: i < Math.round(item.correlation * 5) ? '#FF0000' : '#D1D5DB'
                        }}
                      />
                    ))}
                    </div>
                    <span className="text-xs font-medium text-gray-700 min-w-[2.5rem]">
                      {item.correlation.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          해시태그 데이터가 없습니다.
        </div>
      )}
    </div>
  );
}
