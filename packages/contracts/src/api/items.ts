export interface ItemsListItem {
  id: string;
  title: string;
  subtitle?: string;
  categoryLabel?: string;
  difficultyLabel?: string;
  recommendedReason?: string;
  durationMinutes?: number;
}

export interface ItemsListResponse<TItem extends ItemsListItem = ItemsListItem> {
  items: TItem[];
  page?: number;
  pageSize?: number;
  hasMore: boolean;
}
