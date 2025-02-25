import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, AlertTriangle, Info } from 'lucide-react';
import type { WorkshopItem as WorkshopItemType } from '../types';

interface WorkshopItemProps {
  item: WorkshopItemType;
  onViewDetails: (item: WorkshopItemType) => void;
}

export const WorkshopItem: React.FC<WorkshopItemProps> = ({ item, onViewDetails }) => {
  const steamUrl = `https://steamcommunity.com/sharedfiles/filedetails/?id=${item.id}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800/50 rounded-xl border border-gray-700 p-6 hover:border-gray-600 transition-colors"
    >
      <div className="flex gap-6">
        <div className="flex-shrink-0 flex flex-col items-center gap-4">
          <a 
            href={steamUrl} 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <img
              src={item.thumbnailUrl}
              alt={item.title}
              className="w-40 h-40 object-cover rounded-lg hover:opacity-90 transition-opacity"
            />
          </a>
          <button
            onClick={() => onViewDetails(item)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors text-sm"
          >
            <Info size={16} />
            More Info
          </button>
        </div>
        
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <a 
              href={steamUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group"
            >
              <h2 className="text-2xl font-semibold group-hover:text-blue-400 transition-colors">
                {item.title}
              </h2>
              <ExternalLink className="inline-block ml-2 opacity-0 group-hover:opacity-100 transition-opacity" size={16} />
            </a>
          </div>
          
          <p className="text-gray-400 mt-1">
            by{' '}
            <a 
              href={item.author.workshopUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-400 transition-colors"
              title="View author's workshop"
            >
              {item.author.name}{' '}
              <span className="text-gray-500">({item.author.id})</span>
            </a>
          </p>
          <p className="text-gray-300 mt-3 line-clamp-2">{item.description}</p>
          
          <div className="flex gap-6 mt-4 text-sm text-gray-400">
            <span title={`${item.currentRating.toFixed(1)} out of 5 stars (${item.totalRatings} ratings)`}>
              ⭐ {item.rating}/5
            </span>
            <span title={`${item.currentSubscribers.toLocaleString()} current subscribers out of ${item.totalSubscribers.toLocaleString()} total`}>
              📥 {item.downloads.toLocaleString()}
            </span>
            <span className="flex items-center gap-2">
              🕒 Updated: {item.lastUpdated}
              {item.banned && (
                <span 
                  className="flex items-center text-red-400 gap-1" 
                  title={item.banReason || 'This item has been banned'}
                >
                  <AlertTriangle size={14} />
                  Banned
                </span>
              )}
            </span>
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