import { useState, useEffect } from 'react';
import { Header } from './Header';
import { CategorySelector } from './CategorySelector';
import { MetricsCards } from './MetricsCards';
import { TrendAnalysis } from './TrendAnalysis';
import { HashtagAnalysis } from './HashtagAnalysis';
import { TitlePatternAnalysis } from './TitlePatternAnalysis';
import { WordCloud } from './WordCloud';
import { getLastCollectionTime } from '../services/backendApi';
import { Clock, RefreshCw } from 'lucide-react';

export function Dashboard() {
  const [selectedCategory, setSelectedCategory] = useState('뷰티');
  const [lastCollectionTime, setLastCollectionTime] = useState<string | null>(null);
  const [hasData, setHasData] = useState(false);
  const [isKeywordPopupOpen, setIsKeywordPopupOpen] = useState(false);

  useEffect(() => {
    const fetchLastCollectionTime = async () => {
      try {
        const result = await getLastCollectionTime();
        setLastCollectionTime(result.last_collection_time);
        setHasData(result.has_data);
      } catch (error) {
        console.error('마지막 수집 시간 조회 실패:', error);
      }
    };

    fetchLastCollectionTime();
    // 1분마다 업데이트
    const interval = setInterval(fetchLastCollectionTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const formatCollectionTime = (timeString: string | null): string => {
    if (!timeString) return '데이터 수집 대기 중';
    
    try {
      const date = new Date(timeString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);
      
      // 한국 시간으로 변환
      const koreaDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
      const hours = koreaDate.getHours().toString().padStart(2, '0');
      const minutes = koreaDate.getMinutes().toString().padStart(2, '0');
      const month = (koreaDate.getMonth() + 1).toString().padStart(2, '0');
      const day = koreaDate.getDate().toString().padStart(2, '0');
      
      if (diffDays === 0 && diffHours < 24) {
        // 오늘 수집된 경우
        return `금일 ${hours}:${minutes}에 업데이트된 데이터 기반입니다`;
      } else if (diffDays === 1) {
        // 어제 수집된 경우
        return `어제 ${hours}:${minutes}에 업데이트된 데이터 기반입니다`;
      } else {
        // 그 이전
        return `${month}월 ${day}일 ${hours}:${minutes}에 업데이트된 데이터 기반입니다`;
      }
    } catch (error) {
      return '데이터 수집 시간 정보를 불러올 수 없습니다';
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAFA' }}>
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="mb-4">
            <h1 style={{ color: '#202020' }} className="mb-2">크리에이터 성장 대시보드</h1>
            <p className="text-gray-600">데이터 기반으로 콘텐츠 전략을 세워보세요</p>
          </div>
          
          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Clock className="size-4 text-blue-600" />
            <span className="text-blue-700 text-sm">
              {hasData ? (
                formatCollectionTime(lastCollectionTime)
              ) : (
                '데이터 수집 대기 중입니다. 매일 오전 2시에 자동으로 업데이트됩니다.'
              )}
            </span>
            <RefreshCw className="size-3 text-blue-500 ml-auto" />
          </div>
        </div>

        <CategorySelector 
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        <MetricsCards category={selectedCategory} />

        <div className="mb-6">
          <TrendAnalysis category={selectedCategory} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className={isKeywordPopupOpen ? 'opacity-40 pointer-events-none transition-opacity duration-200' : 'transition-opacity duration-200'}>
            <HashtagAnalysis category={selectedCategory} />
          </div>
          <TitlePatternAnalysis 
            category={selectedCategory} 
            onPopupStateChange={setIsKeywordPopupOpen}
          />
        </div>

        <WordCloud category={selectedCategory} />
      </main>
    </div>
  );
}