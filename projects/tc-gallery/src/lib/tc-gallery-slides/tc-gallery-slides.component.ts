import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
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

import {
  TcGallery,
  TcGalleryConfig,
  TcGalleryImage,
  TcGalleryImageSelected,
  TcGalleryInternal,
  TcGalleryService
} from '../tc-gallery.service';
import { ImageLoadedDirective } from '../directives/image-loaded/image-loaded.directive';
import { SwipeDirective } from '../directives/swipe/swipe.directive';
import { SwipeDirection, SwipeEvent } from '../directives/swipe/swipe-core.types';

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
    SwipeDirective,
  ],
  templateUrl: './tc-gallery-slides.component.html',
  styleUrl: './tc-gallery-slides.component.scss',
  animations: [
    trigger('slidesAnimation', [
      transition(`* => ${AnimationDirectionEnum.RIGHT}`, query('.tc-gallery__slide', [animate('0.5s ease-in', style({transform: 'translateX(-200%)'}))])),
      transition(`* => ${AnimationDirectionEnum.LEFT}`, query('.tc-gallery__slide', [animate('0.5s ease-in', style({transform: 'translateX(0)'}))])),
    ]),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TcGallerySlidesComponent implements AfterViewInit {

  @Input() set gallery(gallery: TcGalleryInternal) {
    this._gallery = gallery;

    this.config = gallery.config;
    this.images = gallery.gallery.images;

    this.setupFirstImage(gallery.gallery);
    this.setupSlides();
  }
  get gallery(): TcGalleryInternal {
    return this._gallery;
  }
  @Output() currentImage = new EventEmitter<TcGalleryImage>();
  @Output() selectedImage = new EventEmitter<TcGalleryImageSelected>();

  animationDirectionEnum = AnimationDirectionEnum;

  show = AnimationDirectionEnum.STOP;
  slides: TcGalleryImage[] = []

  initLazyLoadImages = true;
  prevIsLoading = false;
  nextIsLoading = false;

  set currentIndex(index: number) {
    this._currentIndex = index;
    this.currentImage.emit(this.images[index]);
  };
  get currentIndex(): number {
    return this._currentIndex;
  }

  config: TcGalleryConfig = {};
  images: TcGalleryImage[] = [];

  private isAnimated = false;

  private _currentIndex = 0;
  private _gallery!: TcGalleryInternal;
  private firstRouteNavigation = false;

  @ViewChild('dummySlide') dummySlide: ElementRef | undefined;

  @HostListener('document:keydown', ['$event']) handleKeyboardEvent(event: KeyboardEvent): void {
    if (event.key === 'ArrowLeft') {
      this.moveImage(this.animationDirectionEnum.LEFT);
    } else if (event.key === 'ArrowRight') {
      this.moveImage(this.animationDirectionEnum.RIGHT);
    }
  }

  constructor(private renderer: Renderer2, private router: Router, public tcGalleryService: TcGalleryService, private changeDetectorRef: ChangeDetectorRef,) {}

  get isPreviousSlideFirstOrHigher(): boolean {
    return this.currentIndex - 1 >= 0;
  }

  get isNextSlideNotLast(): boolean {
    return this.currentIndex + 1 < this.images.length;
  }

  ngAfterViewInit(): void {
    if (this.currentIndex >= 1) {
      this.setStyleOnDummySlide(true);
    }
  }

  onChangeSelectImage(event: Event, slide: TcGalleryImage): void {
    this.selectedImage.emit({selected: (event.target as HTMLInputElement).checked, image: slide});
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

      if (this.config.changeRoute) {
        const queryParams: NavigationExtras = {
          queryParams: { tcg: this.images[this.currentIndex].slug },
          queryParamsHandling: 'merge',
          replaceUrl: this.firstRouteNavigation,
        };
        this.firstRouteNavigation = true;

        this.router.navigate([], queryParams);
      }
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

  onSwipeEnd(event: SwipeEvent): void {
    if (event.direction === SwipeDirection.X && event.distance < 0 && Math.abs(event.distance) > 150) {
      this.moveImage(this.animationDirectionEnum.RIGHT);
      this.changeDetectorRef.detectChanges();
    } else if (event.direction === SwipeDirection.X && event.distance > 0 && Math.abs(event.distance) > 150) {
      this.moveImage(this.animationDirectionEnum.LEFT);
      this.changeDetectorRef.detectChanges();
    } else if (event.direction === SwipeDirection.Y && event.distance > 0 && Math.abs(event.distance) > 150) {
      this.tcGalleryService.closeGallery(this.gallery.id);
    }
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
