import React from 'react';
import { Eye, TrendingUp, Hash } from 'lucide-react';

interface MetricsCardsProps {
  category: string;
}

export function MetricsCards({ category }: MetricsCardsProps) {
  const metrics = [
    {
      label: '평균 조회수',
      value: '45.2K',
      change: '+12.5%',
      trend: 'up',
      icon: Eye,
      color: 'blue'
    },
    {
      label: '트렌딩 주제',
      value: '8개',
      change: '+3 this week',
      trend: 'up',
      icon: TrendingUp,
      color: 'green'
    },
    {
      label: '추천 해시태그',
      value: '15개',
      change: 'Updated',
      trend: 'neutral',
      icon: Hash,
      color: 'purple'
    }
  ];

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600'
  };

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