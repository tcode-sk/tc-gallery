import { filter, fromEvent, Observable, race, Subscription } from 'rxjs';
import { elementAt, map, switchMap, takeUntil, tap } from 'rxjs/operators';

import { SwipeCoordinates, SwipeDirection, SwipeEvent, SwipeStartEvent, SwipeSubscriptionConfig } from './swipe-core.types';

export function createSwipeSubscription({ document, elementRef, onSwipeMove, onSwipeEnd }: SwipeSubscriptionConfig): Subscription {
  if (!(elementRef instanceof HTMLElement)) {
    throw new Error('Provided domElement should be an instance of HTMLElement');
  }

  if ((typeof onSwipeMove !== 'function') && (typeof onSwipeEnd !== 'function')) {
    throw new Error('At least one of the following swipe event handler functions should be provided: onSwipeMove and/or onSwipeEnd');
  }

  const edgeSwipeThreshold = 25;

  const touchStarts$ = fromEvent<TouchEvent>(elementRef, 'touchstart').pipe(
    map(getTouchCoordinates),
    filter((touchStartEvent: SwipeCoordinates) => !document.defaultView || !(touchStartEvent.x <= edgeSwipeThreshold || touchStartEvent.x >= document.defaultView.innerWidth - edgeSwipeThreshold)),
  );
  const touchMoves$ = fromEvent<TouchEvent>(elementRef, 'touchmove').pipe(map(getTouchCoordinates));
  const touchEnds$ = fromEvent<TouchEvent>(elementRef, 'touchend').pipe(map(getTouchCoordinates));
  const touchCancels$ = fromEvent<TouchEvent>(elementRef, 'touchcancel');

  const touchStartsWithDirection$: Observable<SwipeStartEvent> = touchStarts$.pipe(
    switchMap((touchStartEvent: SwipeCoordinates) => touchMoves$.pipe(
      elementAt(3),
      map((touchMoveEvent: SwipeCoordinates) => ({
          x: touchStartEvent.x,
          y: touchStartEvent.y,
          direction: getTouchDirection(touchStartEvent, touchMoveEvent),
        })
      ))
    )
  );

  return touchStartsWithDirection$.pipe(
    switchMap(touchStartEvent => touchMoves$.pipe(
      map(touchMoveEvent => getTouchDistance(touchStartEvent, touchMoveEvent)),
      tap((coordinates: SwipeCoordinates) => {
        if (typeof onSwipeMove !== 'function') { return; }
        onSwipeMove(getSwipeEvent(touchStartEvent, coordinates));
      }),
      takeUntil(race(
        touchEnds$.pipe(
          map(touchEndEvent => getTouchDistance(touchStartEvent, touchEndEvent)),
          tap((coordinates: SwipeCoordinates) => {
            if (typeof onSwipeEnd !== 'function') { return; }
            onSwipeEnd(getSwipeEvent(touchStartEvent, coordinates, elementRef));
          })
        ),
        touchCancels$
      ))
    ))
  ).subscribe();
}

function getTouchCoordinates(touchEvent: TouchEvent): SwipeCoordinates  {
  return {
    x: touchEvent.changedTouches[0].clientX,
    y: touchEvent.changedTouches[0].clientY,
  };
}

function getTouchDistance(startCoordinates: SwipeCoordinates, moveCoordinates: SwipeCoordinates): SwipeCoordinates {
  return {
    x: moveCoordinates.x - startCoordinates.x,
    y: moveCoordinates.y - startCoordinates.y,
  };
}

function getTouchDirection(startCoordinates: SwipeCoordinates, moveCoordinates: SwipeCoordinates): SwipeDirection {
  const { x, y } = getTouchDistance(startCoordinates, moveCoordinates);
  return Math.abs(x) < Math.abs(y) ? SwipeDirection.Y : SwipeDirection.X;
}

function getSwipeEvent(touchStartEvent: SwipeStartEvent, coordinates: SwipeCoordinates, elementRef?: HTMLElement): SwipeEvent  {
  return {
    direction: touchStartEvent.direction,
    distance: coordinates[touchStartEvent.direction],
    percentage: 0,
    // percentage: getPercentage(touchStartEvent.direction, coordinates[touchStartEvent.direction], elementRef),
  };
}

function getPercentage(direction: SwipeDirection, distance: number, elementRef: HTMLElement | undefined): number {
  if (elementRef) {
    const currentBoundingClientRect = elementRef.getBoundingClientRect()
    if (direction === SwipeDirection.X) {
      return (Math.abs(distance) - currentBoundingClientRect.left) / currentBoundingClientRect.width * 100;
    } else {
      return (Math.abs(distance) - currentBoundingClientRect.top) / currentBoundingClientRect.height * 100;
    }
  }
  return 0;
}
