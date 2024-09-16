import { Directive, HostListener, Input } from '@angular/core';

@Directive({
  standalone: true,
  selector: '[tcDisableRightClick]'
})
export class TcDisableRightClickDirective {
  @Input() useDisableRightClick: boolean = true;

  @HostListener('contextmenu', ['$event']) onRightClick(event: MouseEvent): void {
    if (this.useDisableRightClick) {
      event.preventDefault();
    }
  }
}
