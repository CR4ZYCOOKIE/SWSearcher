import React, { useState } from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for DayZ mods..."
          className="w-full px-4 py-3 pl-12 bg-gray-800/50 rounded-xl border border-gray-700 focus:outline-none focus:border-blue-500 transition-colors"
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
      </div>
    </form>
  );
};