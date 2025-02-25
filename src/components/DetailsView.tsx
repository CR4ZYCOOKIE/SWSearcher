import React, { useState } from 'react';
import { ArrowLeft, FileText, AlertTriangle } from 'lucide-react';
import type { WorkshopItem } from '../types';
import { convertBBCodeToHtml } from '../utils/bbcode';

interface DetailsViewProps {
  item: WorkshopItem;
  onBack: () => void;
}

export const DetailsView: React.FC<DetailsViewProps> = ({ item, onBack }) => {
  const [activeTab, setActiveTab] = useState<'details' | 'changelog'>('details');
  
  console.log('Item in details view:', {
    id: item.id,
    title: item.title,
    hasChangeNotes: !!item.changeNotes,
    changeNotes: item.changeNotes
  });

  return (
    <div className="animate-fadeIn">
      <button 
        onClick={onBack}
        className="flex items-center text-blue-400 hover:text-blue-300 mb-8 transition-colors"
      >
        <ArrowLeft size={20} className="mr-2" />
        Back to results
      </button>

      <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-8">
        <div className="flex gap-8 mb-8">
          <img
            src={item.thumbnailUrl}
            alt={item.title}
            className="w-96 h-96 object-cover rounded-lg"
          />
          
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-4">{item.title}</h1>
            <p className="text-gray-400 mb-4">
              by{' '}
              <a 
                href={item.author.workshopUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-400 transition-colors"
              >
                {item.author.name}{' '}
                <span className="text-gray-500">({item.author.id})</span>
              </a>
            </p>

            <div className="flex gap-6 text-sm text-gray-400 mb-6">
              <span title={`${item.currentRating.toFixed(1)} out of 5 stars (${item.totalRatings} ratings)`}>
                ⭐ {item.rating}/5
              </span>
              <span title={`${item.currentSubscribers.toLocaleString()} current subscribers out of ${item.totalSubscribers.toLocaleString()} total`}>
                📥 {item.downloads.toLocaleString()}
              </span>
              <span>🕒 Updated: {item.lastUpdated}</span>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {item.tags.map(tag => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-gray-700/50 rounded-full text-sm text-gray-300"
                >
                  {tag}
                </span>
              ))}
            </div>

            {item.banned && (
              <div className="flex items-center text-red-400 gap-2 mb-6">
                <AlertTriangle size={20} />
                <span>This item has been banned</span>
                {item.banReason && (
                  <span className="text-red-300">- {item.banReason}</span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="border-b border-gray-700 mb-6">
          <div className="flex gap-4 -mb-px">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-4 py-2 border-b-2 transition-colors ${
                activeTab === 'details' 
                  ? 'border-blue-500 text-blue-400' 
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              Details
            </button>
            {item.changeNotes && (
              <button
                onClick={() => setActiveTab('changelog')}
                className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                  activeTab === 'changelog' 
                    ? 'border-blue-500 text-blue-400' 
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                <FileText size={16} />
                Change Notes
              </button>
            )}
          </div>
        </div>

        <div className="prose prose-invert max-w-none">
          {activeTab === 'details' ? (
            <div 
              className="bbcode-content" 
              dangerouslySetInnerHTML={{ __html: convertBBCodeToHtml(item.description) }} 
            />
          ) : (
            <div 
              className="bbcode-content"
              dangerouslySetInnerHTML={{ __html: convertBBCodeToHtml(item.changeNotes || '') }} 
            />
          )}
        </div>
      </div>
    </div>
  );
}; 