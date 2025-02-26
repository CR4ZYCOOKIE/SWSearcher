export interface WorkshopAuthor {
  id: string;
  name: string;
  profileUrl: string | null;
  workshopUrl: string;
}

interface Rating {
  score: number | null;
  votes: number;
  has_rating: boolean;
  unrated: boolean;
}

export interface WorkshopItem {
  id: string;
  title: string;
  description: string;
  author: WorkshopAuthor;
  thumbnailUrl: string;
  rating: Rating;
  downloads: number;
  lastUpdated: string;
  tags: string[];
  banned: boolean;
  banReason?: string;
  currentSubscribers: number;
  totalSubscribers: number;
  changeNotes?: string;
}