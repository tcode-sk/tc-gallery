export interface TcSwipeCoordinates {
  x: number;
  y: number;
}

export enum TcSwipeDirection {
  X = 'x',
  Y = 'y'
}

export interface TcSwipeStartEvent {
  x: number;
  y: number;
  direction: TcSwipeDirection;
}

export interface TcSwipeEvent {
  direction: TcSwipeDirection;
  distance: number;
  percentage: number;
}

export interface TcSwipeSubscriptionConfig {
  document: Document;
  elementRef: HTMLElement;
  onSwipeMove?: (event: TcSwipeEvent) => void;
  onSwipeEnd?: (event: TcSwipeEvent) => void;
}
