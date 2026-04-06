export interface ChapterSummary {
  id: string;
  novelId: string;
  volumeId?: string;
  title: string;
  order: number;
  wordCount: number;
  updatedAt: string;
  isFree: boolean;
  isTrial: boolean;
  requiresMembership: boolean;
  isPurchased?: boolean;
}

export interface VolumeSummary {
  id: string;
  novelId: string;
  title: string;
  order: number;
  chapters: ChapterSummary[];
}

export interface ChapterNav {
  previousChapterId?: string;
  nextChapterId?: string;
}

export interface ChapterContent {
  id: string;
  novelId: string;
  title: string;
  order: number;
  content: string;
  wordCount: number;
  updatedAt: string;
  nav: ChapterNav;
  isFree: boolean;
  isTrial: boolean;
  requiresMembership: boolean;
  isPurchased?: boolean;
  trialEndOffset?: number;
}

export interface ChapterListResponse {
  novelId: string;
  volumes: VolumeSummary[];
  totalChapters: number;
  continueChapterId?: string;
}
