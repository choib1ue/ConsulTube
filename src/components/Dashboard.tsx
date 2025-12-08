import { useState } from 'react';
import { Header } from './Header';
import { CategorySelector } from './CategorySelector';
import { MetricsCards } from './MetricsCards';
import { TrendAnalysis } from './TrendAnalysis';
import { HashtagAnalysis } from './HashtagAnalysis';
import { TitlePatternAnalysis } from './TitlePatternAnalysis';
import { RecommendationPanel } from './RecommendationPanel';
import { WordCloud } from './WordCloud';

export function Dashboard() {
  const [selectedCategory, setSelectedCategory] = useState('뷰티');

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAFA' }}>
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 style={{ color: '#202020' }} className="mb-2">크리에이터 성장 대시보드</h1>
          <p className="text-gray-600">데이터 기반으로 콘텐츠 전략을 세워보세요</p>
        </div>

        <CategorySelector 
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        <MetricsCards category={selectedCategory} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <TrendAnalysis category={selectedCategory} />
          </div>
          <div>
            <RecommendationPanel category={selectedCategory} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <HashtagAnalysis category={selectedCategory} />
          <TitlePatternAnalysis category={selectedCategory} />
        </div>

        <WordCloud category={selectedCategory} />
      </main>
    </div>
  );
}