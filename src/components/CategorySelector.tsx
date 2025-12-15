import { Sparkles } from 'lucide-react';

interface CategorySelectorProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

// SQL 파일에 정의된 8개 카테고리
const categories = ['뷰티', '패션', '음식', '여행', '게임', '음악', '스포츠', '교육'];

export function CategorySelector({ selectedCategory, onSelectCategory }: CategorySelectorProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="size-5" style={{ color: '#FF0000' }} />
        <h3 style={{ color: '#202020' }}>카테고리 선택</h3>
      </div>
      
              <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => onSelectCategory(category)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedCategory === category
                        ? 'text-white shadow-md'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                    style={selectedCategory === category ? {
                      backgroundColor: '#FF0000',
                      color: '#FFFFFF'
                    } : {
                      color: '#202020'
                    }}
                  >
                    {category}
                  </button>
                ))}
      </div>
    </div>
  );
}
