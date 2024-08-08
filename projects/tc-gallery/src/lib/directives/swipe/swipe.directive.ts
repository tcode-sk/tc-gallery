import { Directive, ElementRef, EventEmitter, Inject, NgZone, OnDestroy, OnInit, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { DOCUMENT } from '@angular/common';

import { SwipeEvent } from './swipe-core.types';
import { createSwipeSubscription } from './swipe-core';

@Directive({
  selector: '[tcSwipe]',
  standalone: true,
})
export class SwipeDirective implements OnInit, OnDestroy {
  private swipeSubscription: Subscription | undefined;

  @Output() swipeMove: EventEmitter<SwipeEvent> = new EventEmitter<SwipeEvent>();
  @Output() swipeEnd: EventEmitter<SwipeEvent> = new EventEmitter<SwipeEvent>();

  constructor(
    private elementRef: ElementRef,
    private zone: NgZone,
    @Inject(DOCUMENT) private document: Document,
  ) {}

  ngOnInit() {
    this.zone.runOutsideAngular(() => {
      this.swipeSubscription = createSwipeSubscription({
        document: this.document,
        elementRef: this.elementRef.nativeElement,
        onSwipeMove: (swipeMoveEvent: SwipeEvent) => this.swipeMove.emit(swipeMoveEvent),
        onSwipeEnd: (swipeEndEvent: SwipeEvent) => this.swipeEnd.emit(swipeEndEvent)
      });
    });
  }

  ngOnDestroy() {
    this.swipeSubscription?.unsubscribe?.();
  }
}
