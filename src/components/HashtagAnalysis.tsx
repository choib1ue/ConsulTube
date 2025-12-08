import { Hash, ArrowUpRight } from 'lucide-react';

interface HashtagAnalysisProps {
  category: string;
}

const hashtagData = [
  { tag: '#뷰티', avgViews: '52.3K', correlation: 0.87, growth: '+15%' },
  { tag: '#메이크업', avgViews: '48.1K', correlation: 0.82, growth: '+12%' },
  { tag: '#데일리룩', avgViews: '45.7K', correlation: 0.79, growth: '+18%' },
  { tag: '#코스메틱', avgViews: '41.2K', correlation: 0.75, growth: '+9%' },
  { tag: '#뷰티템', avgViews: '38.9K', correlation: 0.71, growth: '+11%' },
  { tag: '#신상', avgViews: '36.4K', correlation: 0.68, growth: '+22%' },
  { tag: '#추천', avgViews: '34.8K', correlation: 0.65, growth: '+8%' },
  { tag: '#리뷰', avgViews: '32.5K', correlation: 0.62, growth: '+14%' }
];

export function HashtagAnalysis({ category }: HashtagAnalysisProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Hash className="size-5" style={{ color: '#FF0000' }} />
        <h3 style={{ color: '#202020' }}>해시태그 효과 분석</h3>
      </div>

      <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="text-blue-900 mb-1">추천 해시태그 조합</div>
        <div className="text-blue-700 text-sm">
          #뷰티 #메이크업 #데일리룩 + #신상
        </div>
        <div className="text-blue-600 text-xs mt-2">
          예상 조회수: 45K~55K | 상관도: 높음
        </div>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {hashtagData.map((item, index) => (
          <div key={item.tag} className="p-3 border border-gray-200 rounded-lg hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-2">
              <span style={{ color: '#202020' }}>{item.tag}</span>
              <span className="text-green-600 text-sm flex items-center gap-1">
                {item.growth}
                <ArrowUpRight className="size-3" />
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">평균 조회수: {item.avgViews}</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">상관도:</span>
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
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
