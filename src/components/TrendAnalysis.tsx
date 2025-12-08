import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Calendar } from 'lucide-react';
import { useState } from 'react';

interface TrendAnalysisProps {
  category: string;
}

const mockData = [
  { date: '1주차', views: 32000, engagement: 2400, videos: 45 },
  { date: '2주차', views: 38000, engagement: 2800, videos: 52 },
  { date: '3주차', views: 41000, engagement: 3100, videos: 48 },
  { date: '4주차', views: 45000, engagement: 3600, videos: 58 },
  { date: '5주차', views: 52000, engagement: 4200, videos: 62 },
  { date: '6주차', views: 48000, engagement: 3900, videos: 55 },
  { date: '7주차', views: 55000, engagement: 4500, videos: 68 }
];

const trendingTopics = [
  { topic: '데일리 메이크업 루틴', count: 156, growth: '+45%' },
  { topic: '가을 신상 하울', count: 142, growth: '+38%' },
  { topic: '피부관리 꿀팁', count: 128, growth: '+29%' },
  { topic: '저렴한 뷰티템', count: 115, growth: '+22%' },
  { topic: '메이크업 vs 노메이크업', count: 98, growth: '+18%' }
];

export function TrendAnalysis({ category }: TrendAnalysisProps) {
  const [timeRange, setTimeRange] = useState('7days');

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

      <div className="mb-6">
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={mockData}>
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

      <div>
        <h4 style={{ color: '#202020' }} className="mb-3">인기 상승 주제 TOP 5</h4>
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
    </div>
  );
}