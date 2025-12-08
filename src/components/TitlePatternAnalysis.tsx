import { Type, Sparkles } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TitlePatternAnalysisProps {
  category: string;
}

const patternData = [
  { pattern: '숫자 포함', avgViews: 52000, count: 145 },
  { pattern: '질문형', avgViews: 48000, count: 128 },
  { pattern: '긴급성 표현', avgViews: 45000, count: 112 },
  { pattern: '비교형', avgViews: 42000, count: 98 },
  { pattern: '후기/리뷰', avgViews: 38000, count: 156 }
];

const effectiveKeywords = [
  { word: '꿀팁', sentiment: 'positive', frequency: 234 },
  { word: '추천', sentiment: 'positive', frequency: 198 },
  { word: '비교', sentiment: 'neutral', frequency: 167 },
  { word: '솔직', sentiment: 'positive', frequency: 145 },
  { word: '리뷰', sentiment: 'neutral', frequency: 178 },
  { word: '최신', sentiment: 'positive', frequency: 134 },
  { word: 'vs', sentiment: 'neutral', frequency: 123 },
  { word: '완벽', sentiment: 'positive', frequency: 112 }
];

export function TitlePatternAnalysis({ category }: TitlePatternAnalysisProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Type className="size-5" style={{ color: '#FF0000' }} />
        <h3 style={{ color: '#202020' }}>제목 패턴 분석</h3>
      </div>

      <div className="mb-6">
        <h4 className="text-gray-700 mb-3 text-sm">효과적인 제목 패턴</h4>
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
            />
            <Bar dataKey="avgViews" fill="#FF0000" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h4 className="text-gray-700 mb-3 text-sm flex items-center gap-2">
          <Sparkles className="size-4 text-yellow-500" />
          고성과 키워드
        </h4>
        <div className="flex flex-wrap gap-2">
          {effectiveKeywords.map((keyword) => (
            <div
              key={keyword.word}
              className={`px-3 py-2 rounded-lg border ${
                keyword.sentiment === 'positive'
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-gray-50 border-gray-200 text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>{keyword.word}</span>
                <span className="text-xs opacity-70">{keyword.frequency}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
        <div className="text-purple-900 mb-1 text-sm">제목 작성 팁</div>
        <div className="text-purple-700 text-sm">
          "숫자 + 긍정 키워드 + 질문형" 조합 추천
        </div>
        <div className="text-purple-600 text-xs mt-2">
          예시: "5가지 꿀팁! 이 메이크업 방법 알고 계셨나요?"
        </div>
      </div>
    </div>
  );
}
