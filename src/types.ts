export interface WorkshopAuthor {
  id: string;
  name: string;
  profileUrl: string | null;
  workshopUrl: string;
}

export interface WorkshopItem {
  id: string;
  title: string;
  description: string;
  author: WorkshopAuthor;
  thumbnailUrl: string;
  rating: number;
  downloads: number;
  lastUpdated: string;
  tags: string[];
  banned: boolean;
  banReason?: string;
  currentSubscribers: number;
  totalSubscribers: number;
  currentRating: number;
  totalRatings: number;
}