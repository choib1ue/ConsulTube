import { TrendingUp, Menu } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: '#FF0000' }}>
              <TrendingUp className="size-6 text-white" />
            </div>
            <div>
              <h2 style={{ color: '#202020' }}>ConsulTube</h2>
              <p className="text-gray-500 text-sm">크리에이터 성장 분석 플랫폼</p>
            </div>
          </div>
          
          <button className="md:hidden p-2 hover:bg-gray-100 rounded-lg">
            <Menu className="size-6 text-gray-600" />
          </button>
        </div>
      </div>
    </header>
  );
}