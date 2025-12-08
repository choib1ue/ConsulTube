import { Sparkles, Heart, Gamepad2, Plane, BookOpen, ShoppingBag, Tv } from 'lucide-react';

interface CategorySelectorProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

const categoryGroups = [
  {
    name: '라이프',
    icon: Heart,
    color: 'from-pink-500 to-rose-500',
    categories: ['뷰티', '패션', '먹방', '일상']
  },
  {
    name: '취미',
    icon: Gamepad2,
    color: 'from-purple-500 to-indigo-500',
    categories: ['게임', '음악', '운동', 'DIY']
  },
  {
    name: '여행·문화',
    icon: Plane,
    color: 'from-blue-500 to-cyan-500',
    categories: ['여행', 'VLOG', '공연', '장소리뷰']
  },
  {
    name: '지식·정보',
    icon: BookOpen,
    color: 'from-green-500 to-emerald-500',
    categories: ['교육', '금융', '커리어', '자기계발']
  },
  {
    name: '리뷰',
    icon: ShoppingBag,
    color: 'from-orange-500 to-amber-500',
    categories: ['IT제품', '화장품', '생활 리뷰']
  },
  {
    name: '엔터',
    icon: Tv,
    color: 'from-red-500 to-pink-500',
    categories: ['뉴스', '이슈', 'K-pop', '챌린지']
  }
];

export function CategorySelector({ selectedCategory, onSelectCategory }: CategorySelectorProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="size-5" style={{ color: '#FF0000' }} />
        <h3 style={{ color: '#202020' }}>카테고리 선택</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categoryGroups.map((group) => {
          const Icon = group.icon;
          return (
            <div key={group.name} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className={`bg-gradient-to-br ${group.color} p-1.5 rounded-md`}>
                  <Icon className="size-4 text-white" />
                </div>
                <span className="text-gray-700">{group.name}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {group.categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => onSelectCategory(category)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all ${
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
        })}
      </div>
    </div>
  );
}
