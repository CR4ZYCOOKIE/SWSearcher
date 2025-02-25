import React from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const input = form.elements.namedItem('search') as HTMLInputElement;
    onSearch(input.value);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl">
      <div className="relative flex items-center">
        <input
          type="text"
          name="search"
          placeholder="Search workshop items..."
          className="w-full px-6 py-4 bg-gray-800/50 backdrop-blur-xl rounded-xl text-white placeholder-gray-400 outline-none ring-2 ring-gray-700/50 focus:ring-blue-500/50 transition-all duration-300"
        />
        <button
          type="submit"
          className="absolute right-4 p-2 text-gray-400 hover:text-white transition-colors duration-200"
        >
          <Search size={20} />
        </button>
      </div>
    </form>
  );
}