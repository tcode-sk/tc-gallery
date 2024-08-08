export interface SwipeCoordinates {
  x: number;
  y: number;
}

export enum SwipeDirection {
  X = 'x',
  Y = 'y'
}

export interface SwipeStartEvent {
  x: number;
  y: number;
  direction: SwipeDirection;
}

export interface SwipeEvent {
  direction: SwipeDirection;
  distance: number;
  percentage: number;
}

export interface SwipeSubscriptionConfig {
  document: Document;
  elementRef: HTMLElement;
  onSwipeMove?: (event: SwipeEvent) => void;
  onSwipeEnd?: (event: SwipeEvent) => void;
}
