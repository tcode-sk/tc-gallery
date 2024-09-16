import { filter, fromEvent, Observable, race, Subscription } from 'rxjs';
import { elementAt, map, switchMap, takeUntil, tap } from 'rxjs/operators';

import { TcSwipeCoordinates, TcSwipeDirection, TcSwipeEvent, TcSwipeStartEvent, TcSwipeSubscriptionConfig } from './tc-swipe-core.types';

export function tcCreateSwipeSubscription({ document, elementRef, onSwipeMove, onSwipeEnd }: TcSwipeSubscriptionConfig): Subscription {
  if (!(elementRef instanceof HTMLElement)) {
    throw new Error('Provided domElement should be an instance of HTMLElement');
  }

  if ((typeof onSwipeMove !== 'function') && (typeof onSwipeEnd !== 'function')) {
    throw new Error('At least one of the following swipe event handler functions should be provided: onSwipeMove and/or onSwipeEnd');
  }

  const edgeSwipeThreshold = 25;

  const touchStarts$ = fromEvent<TouchEvent>(elementRef, 'touchstart').pipe(
    map(getTouchCoordinates),
    filter((touchStartEvent: TcSwipeCoordinates) => !document.defaultView || !(touchStartEvent.x <= edgeSwipeThreshold || touchStartEvent.x >= document.defaultView.innerWidth - edgeSwipeThreshold)),
  );
  const touchMoves$ = fromEvent<TouchEvent>(elementRef, 'touchmove').pipe(map(getTouchCoordinates));
  const touchEnds$ = fromEvent<TouchEvent>(elementRef, 'touchend').pipe(map(getTouchCoordinates));
  const touchCancels$ = fromEvent<TouchEvent>(elementRef, 'touchcancel');

  const touchStartsWithDirection$: Observable<TcSwipeStartEvent> = touchStarts$.pipe(
    switchMap((touchStartEvent: TcSwipeCoordinates) => touchMoves$.pipe(
      elementAt(3),
      map((touchMoveEvent: TcSwipeCoordinates) => ({
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
      tap((coordinates: TcSwipeCoordinates) => {
        if (typeof onSwipeMove !== 'function') { return; }
        onSwipeMove(getSwipeEvent(touchStartEvent, coordinates));
      }),
      takeUntil(race(
        touchEnds$.pipe(
          map(touchEndEvent => getTouchDistance(touchStartEvent, touchEndEvent)),
          tap((coordinates: TcSwipeCoordinates) => {
            if (typeof onSwipeEnd !== 'function') { return; }
            onSwipeEnd(getSwipeEvent(touchStartEvent, coordinates, elementRef));
          })
        ),
        touchCancels$
      ))
    ))
  ).subscribe();
}

function getTouchCoordinates(touchEvent: TouchEvent): TcSwipeCoordinates  {
  return {
    x: touchEvent.changedTouches[0].clientX,
    y: touchEvent.changedTouches[0].clientY,
  };
}

function getTouchDistance(startCoordinates: TcSwipeCoordinates, moveCoordinates: TcSwipeCoordinates): TcSwipeCoordinates {
  return {
    x: moveCoordinates.x - startCoordinates.x,
    y: moveCoordinates.y - startCoordinates.y,
  };
}

function getTouchDirection(startCoordinates: TcSwipeCoordinates, moveCoordinates: TcSwipeCoordinates): TcSwipeDirection {
  const { x, y } = getTouchDistance(startCoordinates, moveCoordinates);
  return Math.abs(x) < Math.abs(y) ? TcSwipeDirection.Y : TcSwipeDirection.X;
}

function getSwipeEvent(touchStartEvent: TcSwipeStartEvent, coordinates: TcSwipeCoordinates, elementRef?: HTMLElement): TcSwipeEvent  {
  return {
    direction: touchStartEvent.direction,
    distance: coordinates[touchStartEvent.direction],
    percentage: 0,
    // percentage: getPercentage(touchStartEvent.direction, coordinates[touchStartEvent.direction], elementRef),
  };
}

function getPercentage(direction: TcSwipeDirection, distance: number, elementRef: HTMLElement | undefined): number {
  if (elementRef) {
    const currentBoundingClientRect = elementRef.getBoundingClientRect()
    if (direction === TcSwipeDirection.X) {
      return (Math.abs(distance) - currentBoundingClientRect.left) / currentBoundingClientRect.width * 100;
    } else {
      return (Math.abs(distance) - currentBoundingClientRect.top) / currentBoundingClientRect.height * 100;
    }
  }
  return 0;
}
