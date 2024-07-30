import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  HostListener, OnDestroy,
} from '@angular/core';
import { AsyncPipe, NgIf } from '@angular/common';
import { filter, map, Subject, takeUntil } from 'rxjs';
import { ActivatedRoute, NavigationEnd, NavigationStart, Router } from '@angular/router';

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
export class TcGalleryComponent implements AfterContentInit, OnDestroy {

  galleriesInternal$ = this.tcGalleryService.galleriesInternal$.pipe(
    map((galleries) => galleries.filter((gallery) => gallery.visible)),
  );

  takeUntil$ = new Subject<void>();

  @HostListener('document:keydown', ['$event']) handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.tcGalleryService.closeLatestGallery();
    }
  }

  constructor(public tcGalleryService: TcGalleryService, private activatedRoute: ActivatedRoute, private router: Router) {}

  ngAfterContentInit(): void {
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      filter(() => !!this.activatedRoute.snapshot.queryParams['tcg']),
      map(() => this.tcGalleryService.galleries$.getValue().filter((gallery) => gallery.config.changeRoute)),
      filter((currentGalleries) => currentGalleries.length > 0),
      takeUntil(this.takeUntil$),
    ).subscribe((currentGalleries) => {
      currentGalleries.forEach((gallery) => {
        const galleryInternal = this.tcGalleryService.galleriesInternal$.value.find((galleryInternal) => galleryInternal.id === gallery.id);
        if (galleryInternal && !galleryInternal.visible) {
          const galleryImage = gallery.gallery.images.find((image) => image.slug === this.activatedRoute.snapshot.queryParams['tcg']);
          if (galleryImage) {
            this.tcGalleryService.openGallery(gallery.id, {tcgImage: galleryImage});
          }
        }
      });
    });

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationStart && event.navigationTrigger === 'popstate'),
        filter(() => this.tcGalleryService.galleriesInternal$.value.filter((galleryInternal) => galleryInternal.config.changeRoute && galleryInternal.visible).length > 0),
        takeUntil(this.takeUntil$),
      )
      .subscribe((event) => this.tcGalleryService.closeAllRouteRelatedGalleries());
  }

  ngOnDestroy(): void {
    this.takeUntil$.next();
    this.takeUntil$.complete();
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
