import { Directive, ElementRef, EventEmitter, Inject, NgZone, OnDestroy, OnInit, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { DOCUMENT } from '@angular/common';

import { TcSwipeEvent } from './tc-swipe-core.types';
import { tcCreateSwipeSubscription } from './tc-swipe-core';

@Directive({
  selector: '[tcSwipe]',
  standalone: true,
})
export class TcSwipeDirective implements OnInit, OnDestroy {
  private swipeSubscription: Subscription | undefined;

  @Output() swipeMove: EventEmitter<TcSwipeEvent> = new EventEmitter<TcSwipeEvent>();
  @Output() swipeEnd: EventEmitter<TcSwipeEvent> = new EventEmitter<TcSwipeEvent>();

  constructor(
    private elementRef: ElementRef,
    private zone: NgZone,
    @Inject(DOCUMENT) private document: Document,
  ) {}

  ngOnInit() {
    this.zone.runOutsideAngular(() => {
      this.swipeSubscription = tcCreateSwipeSubscription({
        document: this.document,
        elementRef: this.elementRef.nativeElement,
        onSwipeMove: (swipeMoveEvent: TcSwipeEvent) => this.swipeMove.emit(swipeMoveEvent),
        onSwipeEnd: (swipeEndEvent: TcSwipeEvent) => this.swipeEnd.emit(swipeEndEvent)
      });
    });
  }

  ngOnDestroy() {
    this.swipeSubscription?.unsubscribe?.();
  }
}
