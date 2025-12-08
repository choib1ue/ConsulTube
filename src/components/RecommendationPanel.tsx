import { Lightbulb, CheckCircle2, AlertCircle } from 'lucide-react';

interface RecommendationPanelProps {
  category: string;
}

export function RecommendationPanel({ category }: RecommendationPanelProps) {
  const recommendations = [
    {
      type: 'success',
      title: '트렌드 주제 활용',
      description: '"가을 신상 하울" 콘텐츠가 급상승 중입니다',
      action: '지금 제작하기'
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Lightbulb className="size-5" style={{ color: '#FF0000' }} />
        <h3 style={{ color: '#202020' }}>맞춤 추천</h3>
      </div>

      <div className="space-y-3 mb-6">
        {recommendations.map((rec, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border ${
              rec.type === 'success'
                ? 'bg-green-50 border-green-200'
                : 'bg-blue-50 border-blue-200'
            }`}
          >
            <div className="flex items-start gap-2 mb-2">
              {rec.type === 'success' ? (
                <CheckCircle2 className="size-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="size-5 text-blue-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className={`mb-1 ${
                  rec.type === 'success' ? 'text-green-900' : 'text-blue-900'
                }`}>
                  {rec.title}
                </div>
                <div className={`text-sm ${
                  rec.type === 'success' ? 'text-green-700' : 'text-blue-700'
                }`}>
                  {rec.description}
                </div>
              </div>
            </div>
            <button className={`text-sm mt-2 px-3 py-1.5 rounded-md ${
              rec.type === 'success'
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            } transition-colors`}>
              {rec.action}
            </button>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-200 pt-6">
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-gray-700 text-sm mb-1">현재 선택한 카테고리</div>
          <div style={{ color: '#202020' }}>{category}</div>
        </div>
      </div>
    </div>
  );
}