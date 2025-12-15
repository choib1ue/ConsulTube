import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useYouTubeData } from '../hooks/useYouTubeData';
import { analyzeTrends } from '../utils/analysis';

interface TrendAnalysisProps {
  category: string;
}

export function TrendAnalysis({ category }: TrendAnalysisProps) {
  const [timeRange, setTimeRange] = useState<'7days' | '30days'>('7days');
  
  const { data, loading, error } = useYouTubeData({
    category,
    timeRange,
    maxResults: 50,
    enabled: true,
  });

  const trendResult = analyzeTrends(data, timeRange);
  const trendData = trendResult.trendData;
  const trendingTopics = trendResult.trendingTopics;

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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="size-5" style={{ color: '#FF0000' }} />
          <h3 style={{ color: '#202020' }}>트렌드 분석</h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setTimeRange('7days')}
            className="px-3 py-1.5 rounded-lg text-sm transition-colors"
            style={timeRange === '7days' ? {
              backgroundColor: '#FF0000',
              color: '#FFFFFF'
            } : {
              backgroundColor: '#F3F4F6',
              color: '#202020'
            }}
          >
            7일
          </button>
          <button
            onClick={() => setTimeRange('30days')}
            className="px-3 py-1.5 rounded-lg text-sm transition-colors"
            style={timeRange === '30days' ? {
              backgroundColor: '#FF0000',
              color: '#FFFFFF'
            } : {
              backgroundColor: '#F3F4F6',
              color: '#202020'
            }}
          >
            30일
          </button>
        </div>
      </div>

      {trendData.length > 0 ? (
        <>
          <div className="mb-6">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF0000" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#FF0000" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="views" 
                  stroke="#FF0000" 
                  fillOpacity={1} 
                  fill="url(#colorViews)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {trendingTopics.length > 0 && (
            <div>
              <h4 style={{ color: '#202020' }} className="mb-3">인기 상승 주제</h4>
              <div className="space-y-2">
                {trendingTopics.map((topic, index) => (
                  <div key={topic.topic} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className={`flex items-center justify-center size-6 rounded-full text-xs ${
                        index === 0 ? 'text-white' :
                        index === 1 ? 'text-white' :
                        index === 2 ? 'text-white' :
                        'bg-gray-200 text-gray-600'
                      }`}
                      style={
                        index === 0 ? { backgroundColor: '#FFD700' } :
                        index === 1 ? { backgroundColor: '#C0C0C0' } :
                        index === 2 ? { backgroundColor: '#CD7F32' } :
                        {}
                      }
                      >
                        {index + 1}
                      </span>
                      <span className="text-gray-700">{topic.topic}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500 text-sm">{topic.count}개</span>
                      <span className="text-green-600 text-sm">{topic.growth}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 text-gray-500">
          데이터가 없습니다. 다른 카테고리나 기간을 선택해보세요.
        </div>
      )}
    </div>
  );
}