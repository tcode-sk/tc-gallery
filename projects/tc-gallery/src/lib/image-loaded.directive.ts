import { Directive, EventEmitter, HostListener, Output } from '@angular/core';

@Directive({
  selector: '[libImageLoaded]',
  standalone: true,
})
export class ImageLoadedDirective {
  @Output() loaded = new EventEmitter<void>();

  @HostListener('load') onLoad(): void {
    this.loaded.emit();
  }
}
