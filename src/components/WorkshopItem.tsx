import React from 'react';
import { motion } from 'framer-motion';
import { Star, Download, Clock } from 'lucide-react';
import type { WorkshopItem as WorkshopItemType } from '../types';

interface WorkshopItemProps {
  item: WorkshopItemType;
}

export const WorkshopItem: React.FC<WorkshopItemProps> = ({ item }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-4 hover:ring-2 ring-blue-500/50 transition-all duration-300"
    >
      <div className="flex gap-4">
        <img
          src={item.thumbnailUrl}
          alt={item.title}
          className="w-32 h-32 object-cover rounded-lg"
        />
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
          <p className="text-gray-400 text-sm mb-4 line-clamp-2">{item.description}</p>
          
          <div className="flex items-center gap-4 text-sm text-gray-300">
            <div className="flex items-center gap-1">
              <Star size={16} className="text-yellow-500" />
              <span>{item.rating.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Download size={16} className="text-green-500" />
              <span>{item.downloads.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock size={16} className="text-blue-500" />
              <span>{item.lastUpdated}</span>
            </div>
          </div>

          <div className="flex gap-2 mt-3">
            {item.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-700/50 rounded-full text-xs text-gray-300"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}