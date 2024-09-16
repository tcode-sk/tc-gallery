import { Component, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';

@Component({
  selector: 'lib-base',
  standalone: true,
  imports: [],
  template: ``
})
export class TcBaseComponent implements OnDestroy {
  takeUntil$ = new Subject<void>();

  ngOnDestroy(): void {
    this.takeUntil$.next();
    this.takeUntil$.complete();
  }
}
