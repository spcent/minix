export interface BookshelfItem {
  novelId: string;
  title: string;
  authorName: string;
  coverUrl?: string;
  latestChapterTitle?: string;
  continueChapterId?: string;
  continueChapterTitle?: string;
  progressPercent?: number;
  updatedAt: string;
  hasUpdate: boolean;
}

export interface ReadingHistoryItem {
  novelId: string;
  title: string;
  chapterId: string;
  chapterTitle: string;
  readAt: string;
}

export interface AddToBookshelfRequest {
  novelId: string;
}

export interface RemoveFromBookshelfRequest {
  novelId: string;
}

export interface BookshelfMutationResponse {
  novelId: string;
  inBookshelf: boolean;
  bookshelfCount: number;
  items: BookshelfItem[];
}

export interface BookshelfResponse {
  items: BookshelfItem[];
}

export interface ReadingHistoryResponse {
  items: ReadingHistoryItem[];
}
