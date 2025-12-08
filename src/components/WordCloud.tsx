import { Cloud } from 'lucide-react';

interface WordCloudProps {
  category: string;
}

const wordData = [
  { word: '메이크업', size: 40, frequency: 234 },
  { word: '데일리', size: 35, frequency: 198 },
  { word: '루틴', size: 32, frequency: 187 },
  { word: '꿀팁', size: 30, frequency: 176 },
  { word: '추천', size: 28, frequency: 165 },
  { word: '하울', size: 26, frequency: 154 },
  { word: '신상', size: 24, frequency: 143 },
  { word: '리뷰', size: 22, frequency: 132 },
  { word: '스킨케어', size: 20, frequency: 121 },
  { word: '가을', size: 18, frequency: 110 },
  { word: '뷰티템', size: 16, frequency: 99 },
  { word: '저렴한', size: 14, frequency: 88 },
  { word: '비교', size: 12, frequency: 77 },
  { word: '솔직', size: 10, frequency: 66 }
];

export function WordCloud({ category }: WordCloudProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Cloud className="size-5" style={{ color: '#FF0000' }} />
        <h3 style={{ color: '#202020' }}>주요 키워드 워드클라우드</h3>
      </div>

      <div className="relative h-80 bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-100 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-2 p-6">
          {wordData.map((item, index) => {
            const positions = [
              { top: '10%', left: '15%' },
              { top: '25%', left: '45%' },
              { top: '15%', left: '70%' },
              { top: '45%', left: '10%' },
              { top: '40%', left: '55%' },
              { top: '50%', left: '80%' },
              { top: '70%', left: '20%' },
              { top: '65%', left: '50%' },
              { top: '75%', left: '75%' },
              { top: '30%', left: '30%' },
              { top: '85%', left: '40%' },
              { top: '20%', left: '85%' },
              { top: '55%', left: '35%' },
              { top: '80%', left: '65%' }
            ];
            
            const opacity = 0.4 + (item.frequency / 250) * 0.6;
            
            return (
              <div
                key={item.word}
                className="absolute transition-all hover:scale-110 cursor-pointer"
                style={{
                  ...positions[index % positions.length],
                  fontSize: `${item.size}px`,
                  color: index % 3 === 0 ? '#FF0000' : index % 3 === 1 ? '#202020' : '#666',
                  opacity: opacity,
                  transform: `rotate(${(index % 5 - 2) * 5}deg)`
                }}
                title={`빈도: ${item.frequency}`}
              >
                {item.word}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <div className="p-2 bg-gray-50 rounded">
          <span className="text-gray-600">총 키워드:</span>
          <span className="ml-2" style={{ color: '#202020' }}>142개</span>
        </div>
        <div className="p-2 bg-gray-50 rounded">
          <span className="text-gray-600">분석 기간:</span>
          <span className="ml-2" style={{ color: '#202020' }}>최근 30일</span>
        </div>
      </div>
    </div>
  );
}
