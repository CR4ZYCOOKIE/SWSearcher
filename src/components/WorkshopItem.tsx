import React from 'react';
import { motion } from 'framer-motion';
import type { WorkshopItem as WorkshopItemType } from '../types';

interface WorkshopItemProps {
  item: WorkshopItemType;
}

export const WorkshopItem: React.FC<WorkshopItemProps> = ({ item }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800/50 rounded-xl border border-gray-700 p-6 hover:border-gray-600 transition-colors"
    >
      <div className="flex gap-6">
        <img
          src={item.thumbnailUrl}
          alt={item.title}
          className="w-40 h-40 object-cover rounded-lg"
        />
        <div className="flex-1">
          <h2 className="text-2xl font-semibold">{item.title}</h2>
          <p className="text-gray-400 mt-1">by {item.author}</p>
          <p className="text-gray-300 mt-3 line-clamp-2">{item.description}</p>
          
          <div className="flex gap-6 mt-4 text-sm text-gray-400">
            <span>⭐ {item.rating}/5</span>
            <span>📥 {item.downloads.toLocaleString()}</span>
            <span>🕒 Updated: {item.lastUpdated}</span>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {item.tags.map(tag => (
              <span
                key={tag}
                className="px-3 py-1 bg-gray-700/50 rounded-full text-sm text-gray-300"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};