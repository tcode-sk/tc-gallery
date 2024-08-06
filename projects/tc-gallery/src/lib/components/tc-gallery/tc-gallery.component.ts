import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  HostListener, OnDestroy,
} from '@angular/core';
import { AsyncPipe, NgIf } from '@angular/common';
import { filter, map, Observable, takeUntil } from 'rxjs';
import { ActivatedRoute, NavigationEnd, NavigationStart, Router } from '@angular/router';

import { BaseComponent } from '../base/base.component';
import { TcGalleryService } from '../../services/tc-gallery.service';
import { TcGallerySlidesComponent } from '../tc-gallery-slides/tc-gallery-slides.component';
import { TcGallery, TcGalleryInternal } from '../../interfaces/tc-gallery.interface';
import { TcGalleryImage } from '../../interfaces/tc-gallery-image.interface';

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
export class TcGalleryComponent extends BaseComponent implements AfterContentInit, OnDestroy {

  galleriesInternal$: Observable<TcGalleryInternal[]> = this.tcGalleryService.galleriesInternal$.pipe(
    map((galleries: TcGalleryInternal[]) => galleries.filter((gallery) => gallery.visible)),
  );

  @HostListener('document:keydown', ['$event']) handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.tcGalleryService.closeLatestGallery();
    }
  }

  constructor(public tcGalleryService: TcGalleryService, private activatedRoute: ActivatedRoute, private router: Router) {
    super();
  }

  ngAfterContentInit(): void {
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      filter(() => !!this.activatedRoute.snapshot.queryParams['tcg']),
      map(() => this.tcGalleryService.galleries$.getValue().filter((gallery: TcGallery) => gallery.config.changeRoute)),
      filter((currentGalleries: TcGallery[]) => currentGalleries.length > 0),
      takeUntil(this.takeUntil$),
    ).subscribe((currentGalleries: TcGallery[]) => {
      currentGalleries.forEach((gallery: TcGallery) => {
        const galleryInternal = this.tcGalleryService.galleriesInternal$.value.find((galleryInternal: TcGalleryInternal) => galleryInternal.id === gallery.id);
        if (galleryInternal && !galleryInternal.visible) {
          const galleryImage = gallery.gallery.images.find((image: TcGalleryImage) => image.slug === this.activatedRoute.snapshot.queryParams['tcg']);
          if (galleryImage) {
            this.tcGalleryService.openGallery(gallery.id, {tcgImage: galleryImage});
          }
        }
      });
    });

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationStart && event.navigationTrigger === 'popstate'),
        filter(() => this.tcGalleryService.galleriesInternal$.value.filter((galleryInternal: TcGalleryInternal) => galleryInternal.config.changeRoute && galleryInternal.visible).length > 0),
        takeUntil(this.takeUntil$),
      )
      .subscribe((event) => this.tcGalleryService.closeAllRouteRelatedGalleries());
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
