import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnInit,
  Output,
  Renderer2,
  ViewChild
} from '@angular/core';
import { animate, AnimationEvent, query, style, transition, trigger } from '@angular/animations';
import { NavigationExtras, Router } from '@angular/router';
import { delay, Subject, takeUntil } from 'rxjs';
import { JsonPipe } from '@angular/common';

import { TcGalleryService } from '../../services/tc-gallery.service';
import { ImageLoadedDirective } from '../../directives/image-loaded/image-loaded.directive';
import { SwipeDirective } from '../../directives/swipe/swipe.directive';
import { SwipeDirection, SwipeEvent } from '../../directives/swipe/swipe-core.types';
import { BaseComponent } from '../base/base.component';
import { TcGallery, TcGalleryInternal } from '../../interfaces/tc-gallery.interface';
import {
  TcGalleryImage,
  TcGalleryImageInternal,
  TcGalleryImageSelected
} from '../../interfaces/tc-gallery-image.interface';
import { TcGalleryConfig } from '../../interfaces/tc-gallery-config.interface';

enum AnimationDirectionEnum {
  LEFT = 'left',
  RIGHT = 'right',
  STOP = 'stop',
}

@Component({
  selector: 'lib-tc-gallery-slides',
  standalone: true,
  imports: [
    ImageLoadedDirective,
    SwipeDirective,
    JsonPipe,
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
export class TcGallerySlidesComponent extends BaseComponent implements OnInit, AfterViewInit {

  @Input() set gallery(gallery: TcGalleryInternal) {
    this._gallery = gallery;

    this.config = gallery.config;
    this.images = [...gallery.gallery.images];

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
  slides: TcGalleryImageInternal[] = []

  initLazyLoadImages = true;

  config: TcGalleryConfig = {};
  images: TcGalleryImage[] = [];

  isLoading$ = new Subject<number>();

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

  constructor(private renderer: Renderer2, private router: Router, public tcGalleryService: TcGalleryService, private changeDetectorRef: ChangeDetectorRef,) {
    super();
  }

  set currentIndex(index: number) {
    this._currentIndex = index;
    this.currentImage.emit(this.images[index]);
  };
  get currentIndex(): number {
    return this._currentIndex;
  }

  get isPreviousSlideFirstOrHigher(): boolean {
    return this.currentIndex - 1 >= 0;
  }

  get isNextSlideNotLast(): boolean {
    return this.currentIndex + 1 < this.images.length;
  }

  get prevIsLoading(): boolean {
    if (!this.config.preLoadImages) {
      return false;
    }
    return !!this.slides[0]?.isLoading && this.slides.length > 1;
  }
  get nextIsLoading(): boolean {
    if (!this.config.preLoadImages) {
      return false;
    }
    return !!this.slides[this.slides.length - 1]?.isLoading && this.slides.length > 1;
  }

  ngOnInit(): void {
    if (this.config.preLoadImages) {
      this.isLoading$.pipe(
        delay(333),
        takeUntil(this.takeUntil$)
      ).subscribe({
        next: (index: number) => {
          if (this.slides[index] && !this.slides[index].isLoaded) {
            this.markIsLoading(index);
            this.changeDetectorRef.detectChanges();
          }
        }
      });
    }
  }

  ngAfterViewInit(): void {
    if (this.currentIndex >= 1 && !this.config.preLoadImages) {
      this.setStyleOnDummySlide(true);
    }
  }

  onChangeSelectImage(event: Event, slide: TcGalleryImage): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.selectedImage.emit({selected: checked, image: slide});

    this.images = this.images.map((image) => {
      if (image.slug === slide.slug) {
        return {...image, selected: checked};
      }
      return image;
    })
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

        if (this.currentIndex === 1) {
          this.setStyleOnDummySlide(true);
        } else if (this.currentIndex > 1 && this.currentIndex + 1 <= this.images.length) {
          this.slides.shift();
        }

        if (this.isNextSlideNotLast) {
          this.slides.push(this.images[this.currentIndex + 1]);
          this.queueIsLoading(this.slides.length - 1);
        }
      } else if (this.show === AnimationDirectionEnum.LEFT) {
        if (this.isNextSlideNotLast) {
          this.slides.pop();
        }

        this.currentIndex = this.currentIndex - 1;

        if (this.isPreviousSlideFirstOrHigher) {
          this.slides.unshift(this.images[this.currentIndex - 1]);
          this.queueIsLoading(0);
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
    this.markIsLoaded(index);

    if (this.config.preLoadImages) {
      if (this.initLazyLoadImages) {
        if (this.currentIndex >= 1) {
          this.setStyleOnDummySlide(true);
        }

        if (this.isPreviousSlideFirstOrHigher) {
          this.slides.unshift(this.images[this.currentIndex - 1]);
          this.queueIsLoading(0);
        }

        if (this.isNextSlideNotLast) {
          this.slides.push(this.images[this.currentIndex + 1]);
          this.queueIsLoading(this.slides.length - 1);
        }

        this.initLazyLoadImages = false;
      }
    }
  }

  moveImage(direction: AnimationDirectionEnum): void {
    if (
      direction === AnimationDirectionEnum.LEFT && this.currentIndex === 0 ||
      direction === AnimationDirectionEnum.RIGHT && this.currentIndex + 1 === this.images.length ||
      direction === AnimationDirectionEnum.RIGHT && this.slides.length === 1 ||
      (this.config.preLoadImages && (direction === AnimationDirectionEnum.LEFT && this.prevIsLoading || direction === AnimationDirectionEnum.RIGHT && this.nextIsLoading))
    ) {
      return;
    }
    this.show = direction;
  }

  onSwipeEnd(event: SwipeEvent): void {
    if (event.direction === SwipeDirection.X && event.distance < 0 && Math.abs(event.distance) > 75) {
      this.moveImage(this.animationDirectionEnum.RIGHT);
      this.changeDetectorRef.detectChanges();
    } else if (event.direction === SwipeDirection.X && event.distance > 0 && Math.abs(event.distance) > 75) {
      this.moveImage(this.animationDirectionEnum.LEFT);
      this.changeDetectorRef.detectChanges();
    } else if (event.direction === SwipeDirection.Y && event.distance > 0 && Math.abs(event.distance) > 75) {
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
    let countOfSlidesToLoad = this.config.preLoadImages ? 1 : 2;
    let startIndex: number;

    if (!this.config.preLoadImages && this.currentIndex >= 1) {
      startIndex = this.currentIndex - 1;
      countOfSlidesToLoad = 3;
    } else {
      startIndex = this.currentIndex;
    }

    this.slides = this.images.slice(startIndex, startIndex + countOfSlidesToLoad).map((image: TcGalleryImage, index) => ({...image, isLoading: true, isLoaded: false}));
  }

  private queueIsLoading(index: number): void {
    if (this.config.preLoadImages) {
      this.isLoading$.next(index);
    }
  }

  private markIsLoading(index: number): void {
    this.slides = this.slides.map((slide, slideIndex) => {
      if (slideIndex === index) {
        return {
          ...slide,
          isLoading: true,
        }
      }
      return slide;
    })
  }

  private markIsLoaded(index: number): void {
    if (this.slides[index]) {
      this.slides = this.slides.map((slide, slideIndex) => {
        if (slideIndex === index) {
          return {
            ...slide,
            isLoading: false,
            isLoaded: true,
          }
        }
        return slide;
      })
    }
  }

  private isAnimating(event: AnimationEvent): boolean {
    return event.toState !== 'void' && event.toState !== null
  }

  private setStyleOnDummySlide(hide: boolean): void {
    this.renderer.setStyle(this.dummySlide?.nativeElement, 'display', hide ? 'none' : 'block');
  }
}
