export interface WorkshopItem {
  id: string;
  title: string;
  description: string;
  author: string;
  thumbnailUrl: string;
  rating: number;
  downloads: number;
  lastUpdated: string;
  tags: string[];
}