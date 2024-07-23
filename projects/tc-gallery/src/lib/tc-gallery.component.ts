import { Component, HostListener } from '@angular/core';
import { AsyncPipe, NgIf } from '@angular/common';

import { TcGalleryService } from './tc-gallery.service';
import { TcGallerySlidesComponent } from './tc-gallery-slides/tc-gallery-slides.component';

@Component({
  selector: 'tc-gallery',
  standalone: true,
  imports: [
    AsyncPipe,
    NgIf,
    TcGallerySlidesComponent,
  ],
  templateUrl: 'tc-gallery.component.html',
  styleUrl: 'tc-gallery.component.scss',
})
export class TcGalleryComponent {

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.tcGalleryService.closeLatestGallery();
    }
  }

  constructor(public tcGalleryService: TcGalleryService) {}

  backdrop(event: MouseEvent): void {
    const clickedElement = event.target as HTMLElement;

    if (clickedElement.classList.contains('tc-gallery__backdrop')) {
      const galleryId = clickedElement.dataset['tcGalleryId'];
      if (galleryId) {
        this.tcGalleryService.closeGallery(+galleryId);
      }
    }
  }

  // @ToDo striky - finish it
  tba(): void {}
}
