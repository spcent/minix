export interface FeedState {
  ready: boolean;
}

export function createInitialFeedState(): FeedState {
  return {
    ready: false,
  };
}
