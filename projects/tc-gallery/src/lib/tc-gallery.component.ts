import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  HostListener,
} from '@angular/core';
import { AsyncPipe, NgIf } from '@angular/common';
import { map, Subject, takeUntil } from 'rxjs';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';

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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TcGalleryComponent implements AfterContentInit {

  galleriesInternal$ = this.tcGalleryService.galleriesInternal$.pipe(
    map((galleries) => galleries.filter((gallery) => gallery.visible)),
  );

  takeUntilRouterEvents$ = new Subject<void>();

  @HostListener('document:keydown', ['$event']) handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.tcGalleryService.closeLatestGallery();
    }
  }

  constructor(public tcGalleryService: TcGalleryService, private activatedRoute: ActivatedRoute, private router: Router) {}

  ngAfterContentInit(): void {
    this.router.events.pipe(takeUntil(this.takeUntilRouterEvents$)).subscribe((event) => {
      if (event instanceof NavigationEnd) {
        const queryParams = this.activatedRoute.snapshot.queryParams;
        if (queryParams['tcg']) {
          const currentGalleries = this.tcGalleryService.galleries$.getValue();
          currentGalleries.forEach((gallery) => {
            if (gallery.config.changeRoute) {
              const galleryImage = gallery.gallery.images.find((image) => image.slug === queryParams['tcg']);
              if (galleryImage) {
                this.tcGalleryService.openGallery(gallery.id, {tcgImage: galleryImage});
              }
            }
          })
        }

        this.takeUntilRouterEvents$.next();
        this.takeUntilRouterEvents$.complete();
      }
    });
  }

  backdrop(event: MouseEvent): void {
    const clickedElement = event.target as HTMLElement;

    if (clickedElement.classList.contains('tc-gallery__backdrop')) {
      const galleryId = clickedElement.dataset['tcGalleryId'];
      if (galleryId) {
        this.tcGalleryService.closeGallery(+galleryId);
      }
    }
  }
}
