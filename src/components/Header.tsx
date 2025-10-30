import { MapPin } from 'lucide-react';

interface HeaderProps {
  showSearch?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}

export function Header({ showSearch = false, searchValue = '', onSearchChange }: HeaderProps) {
  return (
    <header className="bg-background-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
            <MapPin className="w-6 h-6 text-white fill-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-text-primary leading-tight">highway</span>
            <span className="text-sm font-semibold text-text-primary leading-tight">delite</span>
          </div>
        </div>

        {showSearch && (
          <div className="flex items-center gap-3 flex-1 max-w-md ml-auto">
            <input
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Search experiences"
              className="flex-1 px-4 py-2 bg-gray-100 border-none rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-yellow"
            />
            <button className="px-6 py-2 bg-primary-yellow hover:bg-primary-yellow-dark text-text-primary font-medium rounded-lg transition">
              Search
            </button>
          </div>
        )}

        {!showSearch && (
          <button className="px-6 py-2 bg-primary-yellow hover:bg-primary-yellow-dark text-text-primary font-medium rounded-lg transition">
            Search
          </button>
        )}
      </div>
    </header>
  );
}
