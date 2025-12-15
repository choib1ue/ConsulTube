import React from 'react';
import { Eye, TrendingUp, Hash, Loader2 } from 'lucide-react';
import { useYouTubeData } from '../hooks/useYouTubeData';
import { calculateMetrics } from '../utils/analysis';

interface MetricsCardsProps {
  category: string;
}

export function MetricsCards({ category }: MetricsCardsProps) {
  const { data, loading, error } = useYouTubeData({
    category,
    timeRange: '30days',
    maxResults: 50,
    enabled: true,
  });

  const metricsResult = calculateMetrics(data);
  const avgViews = metricsResult.avgViews;
  const trendingTopics = metricsResult.trendingTopics;
  const recommendedHashtags = metricsResult.recommendedHashtags;

  const metrics = [
    {
      label: '평균 조회수',
      value: avgViews,
      change: loading ? '로딩 중...' : data ? 'Updated' : '데이터 없음',
      trend: 'up' as const,
      icon: Eye,
      color: 'blue'
    },
    {
      label: '트렌딩 주제',
      value: `${trendingTopics}개`,
      change: loading ? '로딩 중...' : 'Updated',
      trend: 'up' as const,
      icon: TrendingUp,
      color: 'green'
    },
    {
      label: '추천 해시태그',
      value: `${recommendedHashtags}개`,
      change: loading ? '로딩 중...' : 'Updated',
      trend: 'neutral' as const,
      icon: Hash,
      color: 'purple'
    }
  ];

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600'
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-5 animate-spin" style={{ color: '#FF0000' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="col-span-3 bg-white rounded-xl shadow-sm border border-red-200 p-5">
          <div className="text-center text-red-600">
            <p className="mb-2">데이터를 불러오는 중 오류가 발생했습니다.</p>
            <p className="text-sm text-gray-500">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <div key={metric.label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2 rounded-lg ${colorClasses[metric.color as keyof typeof colorClasses]}`}>
                <Icon className="size-5" />
              </div>
              {metric.trend === 'up' && (
                <span style={{ color: '#FF0000' }} className="text-sm">↗</span>
              )}
            </div>
            <div className="text-gray-600 text-sm mb-1">{metric.label}</div>
            <div style={{ color: '#202020' }} className="mb-1">{metric.value}</div>
            <div className="text-gray-500 text-xs">{metric.change}</div>
          </div>
        );
      })}
    </div>
  );
}