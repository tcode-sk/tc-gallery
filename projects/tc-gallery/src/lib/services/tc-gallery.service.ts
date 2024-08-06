import { Inject, Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { NavigationExtras, Router } from '@angular/router';
import { DOCUMENT } from '@angular/common';

import { TcAfterClosed, TcGallery, TcGalleryInternal } from '../interfaces/tc-gallery.interface';
import { TcGalleryConfig } from '../interfaces/tc-gallery-config.interface';
import { TcGalleryImage, TcGalleryImages, TcGalleryImageSelected } from '../interfaces/tc-gallery-image.interface';
import { TcGalleryInstance } from '../classes/tc-gallery-instance.class';

@Injectable({
  providedIn: 'root'
})
export class TcGalleryService {

  galleriesInternal$ = new BehaviorSubject<TcGalleryInternal[]>([]);
  galleries$: BehaviorSubject<TcGallery[]> = new BehaviorSubject<TcGallery[]>([]);

  defaultConfig: TcGalleryConfig = {
    backdrop: true,
    selectable: false,
    preLoadImages: true,
    changeRoute: true,
  }

  private renderer: Renderer2;

  constructor(private router: Router, private rendererFactory: RendererFactory2, @Inject(DOCUMENT) private document: Document) {
    this.renderer = this.rendererFactory.createRenderer(null, null);
  }

  registerGallery(galleryImages: TcGalleryImages, config?: TcGalleryConfig): TcGalleryInstance {
    const mergedConfig = {
      ...this.defaultConfig,
      ...config,
    }

    const afterClosed = new Subject<TcAfterClosed>();
    const currentGalleriesInternal = this.galleriesInternal$.getValue();
    const currentGalleries = this.galleries$.getValue();

    const gallery: TcGallery = {
      id: currentGalleries.length + 1,
      gallery: {
        images: this.convertImages(galleryImages.images),
        current: galleryImages.openImage ?? galleryImages.images[0],
      },
      config: mergedConfig,
      selectedImages: [],
      afterClosed: afterClosed.asObservable(),
    };

    currentGalleries.push(gallery);
    currentGalleriesInternal.push({
      id: gallery.id,
      config: mergedConfig,
      gallery: {
        images: gallery.gallery.images.map((image) => ({...image})),
        current: {...gallery.gallery.current},
      },
      afterClosedSubject: afterClosed,
      visible: false,
    });

    this.galleries$.next(currentGalleries);
    this.galleriesInternal$.next(currentGalleriesInternal);

    return new TcGalleryInstance(gallery.id, this);
  }

  openGallery(idOrGallery: number | TcGallery, openImage?: {tcgImage?: TcGalleryImage, src?: string}): void {
    const galleryId = this.getGalleryId(idOrGallery);

    const currentGalleriesInternal = this.galleriesInternal$.getValue()
      .map((galleryInternal) => {
        if (galleryInternal.id === galleryId) {
          if (openImage) {
            let currentImage: TcGalleryImage | undefined;
            if (openImage.tcgImage) {
              currentImage = openImage.tcgImage;
            } else {
              const foundCurrentImage = galleryInternal.gallery.images.find((image: TcGalleryImage) => image.src === openImage.src);
              if (foundCurrentImage) {
                currentImage = foundCurrentImage;
              }
            }
            if (currentImage) {
              galleryInternal = {
                ...galleryInternal,
                gallery: {
                  ...galleryInternal.gallery,
                  current: currentImage,
                }
              }
            }
          }

          return {
            ...galleryInternal,
            visible: true,
          }
        }
        return {...galleryInternal};
      });

    this.renderer.setStyle(this.document.body, 'overflow', 'hidden');
    this.galleriesInternal$.next(currentGalleriesInternal);
  }

  closeLatestGallery(): void {
    const latestGallery = this.galleries$.value.at(-1);
    if (latestGallery) {
      this.closeGallery(latestGallery);
    }
  }

  closeGallery(idOrGallery: number | TcGallery): void {
    this.renderer.setStyle(this.document.body, 'overflow', 'auto');
    const galleryId = this.getGalleryId(idOrGallery);

    const galleryIndex = this.galleries$.value.findIndex((gallery) => gallery.id === galleryId);
    if (galleryIndex >= 0) {
      const galleries = this.galleries$.value;
      const galleriesInternal = this.galleriesInternal$.value;
      const gallery = galleries[galleryIndex];
      const galleryInternal = galleriesInternal[galleryIndex];

      if (gallery.config.selectable) {
        galleryInternal.afterClosedSubject.next({selected: [...gallery.selectedImages]});
        galleries[galleryIndex] = {...gallery, selectedImages: []};
      } else {
        galleryInternal.afterClosedSubject.next({});
      }

      if (gallery.config.changeRoute) {
        const queryParams: NavigationExtras = {
          queryParams: { tcg: null },
          queryParamsHandling: 'merge'
        };

        this.router.navigate([], queryParams);
      }

      galleriesInternal[galleryIndex] = {
        ...galleryInternal,
        gallery: {
          ...galleryInternal.gallery,
          current: galleryInternal.gallery.images[0],
        },
        visible: false,
      };

      this.galleries$.next(galleries);
      this.galleriesInternal$.next(galleriesInternal);
    }
  }

  closeAllGalleries(): void {
    this.galleriesInternal$.value
      .filter((galleryInternal) => galleryInternal.visible)
      .forEach((galleryInternal) => {
        this.closeGallery(galleryInternal.id);
      })
  }

  closeAllRouteRelatedGalleries(): void {
    this.galleriesInternal$.value
      .filter((galleryInternal) => galleryInternal.config.changeRoute && galleryInternal.visible)
      .forEach((galleryInternal) => {
        this.closeGallery(galleryInternal.id);
      })
  }

  deregisterGallery(idOrGallery: number | TcGallery): void {
    const galleryId = this.getGalleryId(idOrGallery);

    const galleryIndex = this.galleries$.value.findIndex((gallery) => gallery.id === galleryId);
    if (galleryIndex >= 0) {
      const galleries = this.galleries$.value;
      const galleriesInternal = this.galleriesInternal$.value;
      const galleryInternal = galleriesInternal[galleryIndex];

      galleryInternal.afterClosedSubject.complete();

      galleries.splice(galleryIndex, 1);
      galleriesInternal.splice(galleryIndex, 1);

      this.galleries$.next(galleries);
      this.galleriesInternal$.next(galleriesInternal);
    }
  }

  selectImage(galleryId: number, imageSelected: TcGalleryImageSelected): void {
    let currentGalleries = this.galleries$.getValue();
    currentGalleries = currentGalleries.map((currentGallery) => {
      if (currentGallery.id === galleryId) {
        let selectedImages: TcGalleryImage[] = [...currentGallery.selectedImages];
        if (imageSelected.selected) {
          selectedImages.push(imageSelected.image);
        } else {
          selectedImages = selectedImages.filter((image: TcGalleryImage) => image.slug !== imageSelected.image.slug);
        }

        return {
          ...currentGallery,
          selectedImages,
        }
      }
      return {...currentGallery};
    });

    this.galleries$.next(currentGalleries);
  }

  currentImageChanged(galleryId: number, image: TcGalleryImage): void {
    let currentGalleries = this.galleries$.getValue();
    currentGalleries = currentGalleries.map((currentGallery) => {
      if (currentGallery.id === galleryId) {
        return {
          ...currentGallery,
          gallery: {
            ...currentGallery.gallery,
            current: image,
          },
        };
      }
      return {...currentGallery};
    });

    this.galleries$.next(currentGalleries);
  }

  private getGalleryId(idOrGallery: number | TcGallery): number {
    if (typeof idOrGallery === 'number') {
      return idOrGallery;
    }
    return idOrGallery.id;
  }

  private convertImages(images: TcGalleryImage[]): TcGalleryImage[] {
    const imageSlugs: string[] = [];

    return images.map((image: TcGalleryImage, index: number) => {
      const filename = this.filename(image.src);

      if (!image.slug) {
        image.slug = this.slugify(filename, index, imageSlugs);
      }

      if (!image.alt) {
        image.alt = filename;
      }

      if (!image.name) {
        image.name = filename;
      }

      return image;
    })
  }

  // @ToDo striky - make it as small separated npm package
  private slugify(name: string, index: number, imageSlugs: string[]): string {
    name = name.replace(/^\s+|\s+$/g, ''); // trim
    name = name.toLowerCase();

    // remove accents, swap ñ for n, etc
    const from = "àáäâèéëêìíïîòóöôùúüûñç·/_,:;";
    const to   = "aaaaeeeeiiiioooouuuunc------";
    for (let i=0, l= from.length ; i < l ; i++) {
      name = name.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
    }

    name = name.replace(/[^a-z0-9 -]/g, '') // remove invalid chars
      .replace(/\s+/g, '-') // collapse whitespace and replace by -
      .replace(/-+/g, '-'); // collapse dashes

    if (imageSlugs.indexOf(name) >= 0) {
      name = `${name}--${index}`;
    }

    return name;
  }

  private filename(src: string): string {
    const parts = src.split('/');
    return parts[parts.length - 1];
  }
}
