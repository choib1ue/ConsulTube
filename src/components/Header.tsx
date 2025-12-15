import React from 'react';
import { Menu } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src="/ConsulTube-logo.png" 
              alt="ConsulTube Logo" 
              className="h-5 w-5 object-contain flex-shrink-0"
              style={{ maxWidth: '50px', maxHeight:'50px', width: '50px', height: '50px' }}
            />
            <div>
              <h2 style={{ color: '#202020' }} className="leading-tight block mb-0">ConsulTube</h2>
              <p className="text-gray-500 text-sm leading-tight block mt-0">크리에이터를 위한 콘텐츠 성장 분석·추천 플랫폼</p>
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