import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  Renderer2,
  ViewChild
} from '@angular/core';
import { animate, AnimationEvent, query, style, transition, trigger } from '@angular/animations';
import { NavigationExtras, Router } from '@angular/router';

import { TcGallery, TcGalleryConfig, TcGalleryImage, TcGalleryImageSelected } from '../tc-gallery.service';
import { ImageLoadedDirective } from '../image-loaded.directive';

enum AnimationDirectionEnum {
  LEFT = 'left',
  RIGHT = 'right',
  STOP = 'stop',
}

enum IsLoadingEnum {
  LEFT,
  RIGHT,
}

@Component({
  selector: 'lib-tc-gallery-slides',
  standalone: true,
  imports: [
    ImageLoadedDirective,
  ],
  templateUrl: './tc-gallery-slides.component.html',
  styleUrl: './tc-gallery-slides.component.scss',
  animations: [
    trigger('slidesAnimation', [
      transition(`* => ${AnimationDirectionEnum.RIGHT}`, query('.tc-gallery__slide', [animate('1s ease-in', style({transform: 'translateX(-200%)'}))])),
      transition(`* => ${AnimationDirectionEnum.LEFT}`, query('.tc-gallery__slide', [animate('1s ease-in', style({transform: 'translateX(0)'}))])),
    ]),
  ],
})
export class TcGallerySlidesComponent implements AfterViewInit {

  @Input() set galleryInstance(tcGallery: TcGallery) {
    this.config = tcGallery.config;
    this._images = tcGallery.gallery.images;

    this.setupFirstImage(tcGallery.gallery);
    this.setupSlides();
  }
  @Output() currentImage = new EventEmitter<TcGalleryImage>();
  @Output() selectedImage = new EventEmitter<TcGalleryImageSelected>();

  get images(): TcGalleryImage[] {
    return this._images;
  }

  animationDirectionEnum = AnimationDirectionEnum;

  show = AnimationDirectionEnum.STOP;
  slides: TcGalleryImage[] = []

  initLazyLoadImages = true;
  prevIsLoading = false;
  nextIsLoading = false;

  currentIndex: number = 0;

  private config: TcGalleryConfig = {};
  private isAnimated = false;
  private _images: TcGalleryImage[] = [];

  @ViewChild('dummySlide') dummySlide: ElementRef | undefined;

  @HostListener('document:keydown', ['$event']) handleKeyboardEvent(event: KeyboardEvent): void {
    if (event.key === 'ArrowLeft') {
      this.moveImage(this.animationDirectionEnum.LEFT);
    } else if (event.key === 'ArrowRight') {
      this.moveImage(this.animationDirectionEnum.RIGHT);
    }
  }

  constructor(private renderer: Renderer2, private router: Router) {}

  get isPreviousSlideFirstOrHigher(): boolean {
    return this.currentIndex - 1 >= 0;
  }

  get isNextSlideNotLast(): boolean {
    return this.currentIndex + 1 < this.images.length;
  }

  ngAfterViewInit(): void {
    if (this.currentIndex === 1) {
      this.setStyleOnDummySlide(true);
    }
  }

  onStart(event: AnimationEvent): void {
    if (this.isAnimating(event)) {
      this.isAnimated = true;
    }
  }

  onDone(event: AnimationEvent): void {
    if (this.isAnimating(event)) {
      if (this.show === AnimationDirectionEnum.RIGHT) {
        this.currentIndex = this.currentIndex + 1;

        if (this.isNextSlideNotLast) {
          this.slides.push(this.images[this.currentIndex + 1]);
          this.markIsLoading(IsLoadingEnum.RIGHT, true);
        }

        if (this.currentIndex === 1) {
          this.setStyleOnDummySlide(true);
        } else if (this.currentIndex > 1 && this.currentIndex + 1 <= this.images.length) {
          this.slides.shift();
        }
      } else if (this.show === AnimationDirectionEnum.LEFT) {
        if (this.isNextSlideNotLast) {
          this.slides.pop();
        }

        this.currentIndex = this.currentIndex - 1;

        if (this.isPreviousSlideFirstOrHigher) {
          this.slides.unshift(this.images[this.currentIndex - 1]);
          this.markIsLoading(IsLoadingEnum.LEFT, true);
        }

        if (this.currentIndex === 0) {
          this.setStyleOnDummySlide(false);
        }
      }

      const queryParams: NavigationExtras = {
        queryParams: { tcg: this.images[this.currentIndex].slug },
        queryParamsHandling: 'merge'
      };

      this.router.navigate([], queryParams);
      this.isAnimated = false;
      this.show = AnimationDirectionEnum.STOP;
    }
  }

  lazyLoadImages(index: number): void {
    if (this.config.preLoadImages) {
      if (this.initLazyLoadImages) {
        if (this.isPreviousSlideFirstOrHigher) {
          this.markIsLoading(IsLoadingEnum.LEFT, true);
          this.slides.unshift(this.images[this.currentIndex - 1]);
        }

        if (this.isNextSlideNotLast) {
          this.markIsLoading(IsLoadingEnum.RIGHT, true);
          this.slides.push(this.images[this.currentIndex + 1]);
        }

        this.initLazyLoadImages = false;
      } else if (index === 0) {
        this.markIsLoading(IsLoadingEnum.LEFT, false);
      } else if (index === this.slides.length - 1) {
        this.markIsLoading(IsLoadingEnum.RIGHT, false);
      }
    }
  }

  moveImage(direction: AnimationDirectionEnum): void {
    if (
      direction === AnimationDirectionEnum.LEFT && this.currentIndex === 0 ||
      direction === AnimationDirectionEnum.RIGHT && this.currentIndex + 1 === this.images.length
    ) {
      return;
    }
    this.show = direction;
  }

  private setupFirstImage(gallery: TcGallery['gallery']): void {
    let imageIndex = 0;
    if (gallery.current) {
      const tempImageIndex = this.images.findIndex((image: TcGalleryImage) => image.slug === gallery.current.slug);
      if (tempImageIndex >= 0) {
        imageIndex = tempImageIndex;
      }
    }

    this.currentIndex = imageIndex;
    this.currentImage.emit(this.images[imageIndex]);
  }

  private setupSlides(): void {
    let countOfSlidesToLoad = 2;

    if (this.config.preLoadImages) {
      countOfSlidesToLoad = 1;

      if (this.isPreviousSlideFirstOrHigher) {
        this.markIsLoading(IsLoadingEnum.LEFT, true);
      }

      if (this.isNextSlideNotLast) {
        this.markIsLoading(IsLoadingEnum.RIGHT, true);
      }
    }

    this.slides = this.images.slice(this.currentIndex, this.currentIndex + countOfSlidesToLoad);
  }

  private markIsLoading(direction: IsLoadingEnum, value: boolean): void {
    if (this.config.preLoadImages) {
      if (direction === IsLoadingEnum.LEFT) {
        this.prevIsLoading = value;
      } else if (direction === IsLoadingEnum.RIGHT) {
        this.nextIsLoading = value;
      }
    }
  }

  private isAnimating(event: AnimationEvent): boolean {
    return event.toState !== 'void' && event.toState !== null
  }

  private setStyleOnDummySlide(hide: boolean): void {
    this.renderer.setStyle(this.dummySlide?.nativeElement, 'display', hide ? 'none' : 'block');
  }
}
