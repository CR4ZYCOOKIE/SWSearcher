import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Gamepad2, AlertCircle } from 'lucide-react';
import { SearchBar } from './components/SearchBar';
import { WorkshopItem } from './components/WorkshopItem';
import { searchWorkshop } from './services/steam';
import type { WorkshopItem as WorkshopItemType } from './types';

function App() {
  const [searchResults, setSearchResults] = useState<WorkshopItemType[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const results = await searchWorkshop(query, '221100'); // DayZ AppID
      setSearchResults(results);
    } catch (err) {
      setError('Failed to fetch workshop items. Please check your Steam API key and try again.');
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center mb-12"
        >
          <Gamepad2 size={40} className="text-blue-500 mr-4" />
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
            Workshop Explorer
          </h1>
        </motion.div>

        <div className="flex flex-col items-center mb-12">
          <SearchBar onSearch={handleSearch} />
          <p className="mt-2 text-sm text-gray-400">
            Enter a keyword to search DayZ workshop items
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center p-4 mb-8 bg-red-500/20 rounded-xl text-red-200"
          >
            <AlertCircle size={20} className="mr-2" />
            {error}
          </motion.div>
        )}

        {isSearching ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {searchResults.map(item => (
              <WorkshopItem key={item.id} item={item} />
            ))}
            {searchResults.length === 0 && !isSearching && !error && (
              <p className="text-center text-gray-400">
                No results found. Try a different search term.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;