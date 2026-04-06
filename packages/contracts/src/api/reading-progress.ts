export interface ReadingProgress {
  novelId: string;
  chapterId: string;
  chapterTitle?: string;
  progressPercent: number;
  scrollOffset?: number;
  pageIndex?: number;
  updatedAt: string;
}

export interface SaveReadingProgressRequest {
  novelId: string;
  chapterId: string;
  progressPercent: number;
  scrollOffset?: number;
  pageIndex?: number;
}

export interface LoadReadingProgressResponse {
  progress: ReadingProgress | null;
}
