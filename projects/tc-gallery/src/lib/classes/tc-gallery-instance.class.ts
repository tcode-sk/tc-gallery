import { distinctUntilChanged, filter, map, Observable } from 'rxjs';

import { TcGalleryService } from '../services/tc-gallery.service';
import { TcAfterClosed, TcGallery } from '../interfaces/tc-gallery.interface';
import { TcGalleryConfig } from '../interfaces/tc-gallery-config.interface';
import { TcGalleryImage } from '../interfaces/tc-gallery-image.interface';

export class TcGalleryInstance {
  private currentGallery: TcGallery;

  constructor(private galleryId: number, private tcGalleryService: TcGalleryService) {
    this.currentGallery = this.getCurrentGallery(galleryId);
  }

  get id(): number {
    return this.galleryId;
  }

  get config(): TcGalleryConfig {
    return this.currentGallery.config;
  }

  get isOpen(): boolean {
    return !!this.tcGalleryService.galleriesInternal$.value.find((gallery) => gallery.id === this.galleryId)?.visible;
  }

  currentImage(): TcGalleryImage {
    return this.getCurrentGallery(this.galleryId).gallery.current;
  }

  currentImageChange(): Observable<TcGalleryImage> {
    return this.tcGalleryService.galleries$.pipe(
      map((galleryInstances) => galleryInstances.find((galleryInstance) => galleryInstance.id === this.currentGallery.id)),
      filter((galleryInstance) => !!galleryInstance),
      distinctUntilChanged((prev, curr) => prev!.gallery.current.slug === curr!.gallery.current.slug),
      map((galleryInstance) => galleryInstance!.gallery.current)
    );
  }

  selectImageChange(): Observable<TcGalleryImage[]> {
    return this.tcGalleryService.galleries$.pipe(
      map((galleryInstances) => galleryInstances.find((galleryInstance) => galleryInstance.id === this.currentGallery.id)),
      filter((galleryInstance) => !!galleryInstance),
      distinctUntilChanged((prev, curr) => prev!.selectedImages.length === curr!.selectedImages.length),
      map((galleryInstance) => galleryInstance!.selectedImages)
    );
  }

  afterClosed(): Observable<TcAfterClosed> {
    return this.currentGallery.afterClosed;
  }

  private getCurrentGallery(id: number): TcGallery {
    return this.tcGalleryService.galleries$.value.find((galleryInstance) => galleryInstance.id === id)!;
  }
}
