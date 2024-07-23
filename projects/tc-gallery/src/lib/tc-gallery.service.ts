import { Injectable } from '@angular/core';
import { BehaviorSubject, distinctUntilChanged, filter, map, Observable, Subject } from 'rxjs';

export interface TcGallery {
  id: number,
  gallery: {
    images: TcGalleryImage[],
    current: TcGalleryImage,
  }
  config: TcGalleryConfig,
  afterClosed: Observable<TcAfterClosed>,
}

// @ToDo striky - fix the naming
export class TcGalleryTest {
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

  currentImage(): TcGalleryImage {
    return this.getCurrentGallery(this.galleryId).gallery.current;
  }

  currentImageChange(): Observable<TcGalleryImage> {
    return this.tcGalleryService.galleryInstances$.pipe(
      map((galleryInstances) => galleryInstances.find((galleryInstance) => galleryInstance.id === this.currentGallery.id)),
      filter((galleryInstance) => !!galleryInstance),
      distinctUntilChanged((prev, curr) => prev!.gallery.current !== curr!.gallery.current),
      map((galleryInstance) => galleryInstance!.gallery.current)
    )
  }

  afterClosed(): Observable<TcAfterClosed> {
    return this.currentGallery.afterClosed;
  }

  private getCurrentGallery(id: number): TcGallery {
    return this.tcGalleryService.galleryInstances$.value.find((galleryInstance) => galleryInstance.id === id)!;
  }
}

interface TcGalleryInternal extends TcGallery {
  selectedImages: TcGalleryImage[],
  afterClosedSubject: Subject<TcAfterClosed>,
}

export interface TcAfterClosed {
  selected?: TcGalleryImage[],
}

export interface TcGalleryImage {
  src: string,
  name?: string,
  slug?: string,
  alt?: string,
  caption?: string,
}

export interface TcGalleryImages {
  images: TcGalleryImage[],
  openImage?: TcGalleryImage,
}

export interface TcGalleryConfig {
  backdrop?: boolean,
  selectable?: boolean,
}

@Injectable({
  providedIn: 'root'
})
export class TcGalleryService {

  galleryInstances$: BehaviorSubject<TcGalleryInternal[]> = new BehaviorSubject<TcGalleryInternal[]>([]);

  defaultConfig: TcGalleryConfig = {
    backdrop: true,
    selectable: false,
  }

  constructor() { }

  openGallery(galleryImages: TcGalleryImages, config?: TcGalleryConfig): TcGalleryTest {
    const mergedConfig = {
      ...this.defaultConfig,
      ...config,
    }

    const afterClosed = new Subject<TcAfterClosed>();
    const currentGalleryInstances = this.galleryInstances$.getValue();

    const gallery = {
      id: currentGalleryInstances.length + 1,
      gallery: {
        images: this.convertImages(galleryImages.images),
        current: galleryImages.openImage ?? galleryImages.images[0],
      },
      config: mergedConfig,
      afterClosed: afterClosed.asObservable(),
    };

    currentGalleryInstances.push({
      ...gallery,
      selectedImages: [],
      afterClosedSubject: afterClosed,
    });

    this.galleryInstances$.next(currentGalleryInstances);

    // return Injector.create({providers: [{ provide: TcGalleryTest, useValue: new TcGalleryTest(gallery.id, TcGalleryService) }]}).get(TcGalleryTest);
    // Insert the dialog component into the template reference
    // templateRef.createEmbeddedView(dialogComponentRef.hostView);
    return new TcGalleryTest(gallery.id, this);
  }

  closeLatestGallery(): void {
    const latestGallery = this.galleryInstances$.value.at(-1);
    if (latestGallery) {
      this.closeGallery(latestGallery);
    }
  }

  closeGallery(idOrGallery: number | TcGallery): void {
    let galleryId: number;
    if (typeof idOrGallery === 'number') {
      galleryId = idOrGallery;
    } else {
      galleryId = idOrGallery.id;
    }

    const galleryIndex = this.galleryInstances$.value.findIndex((gallery) => gallery.id === galleryId);
    if (galleryIndex >= 0) {
      const galleryInstances = this.galleryInstances$.value;
      const galleryInstance = galleryInstances[galleryIndex];

      if (galleryInstance.config.selectable) {
        galleryInstance.afterClosedSubject.next({selected: galleryInstance.selectedImages});
      }

      galleryInstance.afterClosedSubject.next({});

      galleryInstances.splice(galleryIndex, 1);

      this.galleryInstances$.next(galleryInstances);
    }
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
