import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Inject,
  Input,
  OnInit,
  Output,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { animate, AnimationEvent, query, style, transition, trigger } from '@angular/animations';
import { NavigationExtras, Router } from '@angular/router';
import { delay, Subject, takeUntil } from 'rxjs';
import { DOCUMENT, JsonPipe } from '@angular/common';
import { CdkTrapFocus } from '@angular/cdk/a11y';
import { HttpClient } from '@angular/common/http';

import { TcGalleryService } from '../../services/tc-gallery.service';
import { TcImageLoadedDirective } from '../../directives/tc-image-loaded/tc-image-loaded.directive';
import { TcSwipeDirective } from '../../directives/tc-swipe/tc-swipe.directive';
import { TcSwipeDirection, TcSwipeEvent } from '../../directives/tc-swipe/tc-swipe-core.types';
import { TcBaseComponent } from '../tc-base/tc-base.component';
import { TcGallery, TcGalleryInternal } from '../../interfaces/tc-gallery.interface';
import {
  TcGalleryImage,
  TcGalleryImageInternal,
  TcGalleryImageSelected
} from '../../interfaces/tc-gallery-image.interface';
import { TcGalleryConfig } from '../../interfaces/tc-gallery-config.interface';
import { TcDisableRightClickDirective } from '../../directives/tc-right-click/tc-right-click.directive';
import { TcFullscreenDirective, TcFullscreenTransition } from '../../directives/tc-fullscreen/tc-fullscreen.directive';
import { TcAnimationDirectionEnum, TcAnimationLifeCycleEnum } from '../../enums/tc-animation.enum';
import { TcAnimationEventInterface } from '../../interfaces/tc-animation-event.interface';

@Component({
  selector: 'lib-tc-gallery-slides',
  standalone: true,
  imports: [
    TcImageLoadedDirective,
    TcSwipeDirective,
    JsonPipe,
    TcDisableRightClickDirective,
    TcFullscreenDirective,
    CdkTrapFocus,
  ],
  templateUrl: './tc-gallery-slides.component.html',
  styleUrl: './tc-gallery-slides.component.scss',
  animations: [
    trigger('slidesAnimation', [
      transition(`* => ${TcAnimationDirectionEnum.RIGHT}`, query('.tc-gallery__slide', [animate('0.5s ease-in', style({transform: 'translateX(-200%)'}))])),
      transition(`* => ${TcAnimationDirectionEnum.LEFT}`, query('.tc-gallery__slide', [animate('0.5s ease-in', style({transform: 'translateX(0)'}))])),
    ]),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TcGallerySlidesComponent extends TcBaseComponent implements OnInit, AfterViewInit {

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

  animationDirectionEnum = TcAnimationDirectionEnum;

  show = TcAnimationDirectionEnum.STOP;
  slides: TcGalleryImageInternal[] = []
  currentSlideIndex = 0;

  initLazyLoadImages = true;

  config: TcGalleryConfig = {};
  images: TcGalleryImage[] = [];

  isLoading$ = new Subject<number>();

  isFullscreen = false;

  private isAnimated = false;
  private animationEvent$ = new Subject<TcAnimationEventInterface>();

  private _currentIndex = 0;
  private _gallery!: TcGalleryInternal;
  private firstRouteNavigation = false;
  private wasFocused = false;

  @ViewChild('dummySlide') dummySlide: ElementRef | undefined;
  @ViewChild(TcFullscreenDirective) fullscreen!: TcFullscreenDirective;

  @HostListener('document:keydown', ['$event']) handleKeyboardEvent(event: KeyboardEvent): void {
    if (event.key === 'ArrowLeft') {
      this.moveImage(this.animationDirectionEnum.LEFT);
    } else if (event.key === 'ArrowRight') {
      this.moveImage(this.animationDirectionEnum.RIGHT);
    }
  }

  @HostListener('document:keydown.tab', ['$event']) onTabKey(event: KeyboardEvent): void {
    if (!this.config.trapFocusAutoCapture && !this.wasFocused) {
      let focusableElements = this.elementRef.nativeElement.querySelectorAll(
        'button.tc-gallery__btn--arrow:not([disabled])'
      );

      if (focusableElements.length === 0) {
        focusableElements = this.elementRef.nativeElement.querySelectorAll(
          'input:not([disabled])'
        );
      }

      if (focusableElements.length === 0) {
        focusableElements = this.elementRef.nativeElement.querySelectorAll(
          'button:not([disabled])'
        );
      }

      if (focusableElements.length > 0) {
        focusableElements[0].focus();
        event.preventDefault();
      }

      this.wasFocused = true;
    }
  }

  constructor(private renderer: Renderer2, private router: Router, public tcGalleryService: TcGalleryService,
              private changeDetectorRef: ChangeDetectorRef, @Inject(DOCUMENT) public document: Document,
              private elementRef: ElementRef, private http: HttpClient) {
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

    this.animationEvent$.pipe(takeUntil(this.takeUntil$)).subscribe({next: (animationEvent: TcAnimationEventInterface) => {
      if (animationEvent.animationLifeCycle === TcAnimationLifeCycleEnum.START) {
        this.isAnimated = true;
      } else if (animationEvent.animationLifeCycle === TcAnimationLifeCycleEnum.END) {
        this.onAnimationDone();
        this.isAnimated = false;
      }
    }})
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

        this.currentSlideIndex = this.slides.length - 1;

        if (this.isNextSlideNotLast) {
          this.slides.push(this.images[this.currentIndex + 1]);
          this.queueIsLoading(this.slides.length - 1);
        }

        this.initLazyLoadImages = false;
      }
    }
  }

  moveImage(direction: TcAnimationDirectionEnum): void {
    if (
      direction === TcAnimationDirectionEnum.LEFT && this.currentIndex === 0 ||
      direction === TcAnimationDirectionEnum.RIGHT && this.currentIndex + 1 === this.images.length ||
      direction === TcAnimationDirectionEnum.RIGHT && this.slides.length === 1 ||
      (this.config.preLoadImages && (direction === TcAnimationDirectionEnum.LEFT && this.prevIsLoading || direction === TcAnimationDirectionEnum.RIGHT && this.nextIsLoading))
    ) {
      return;
    }
    this.show = direction;
  }

  onSwipeEnd(event: TcSwipeEvent): void {
    if (event.direction === TcSwipeDirection.X && event.distance < 0 && Math.abs(event.distance) > 75) {
      this.moveImage(this.animationDirectionEnum.RIGHT);
      this.changeDetectorRef.detectChanges();
    } else if (event.direction === TcSwipeDirection.X && event.distance > 0 && Math.abs(event.distance) > 75) {
      this.moveImage(this.animationDirectionEnum.LEFT);
      this.changeDetectorRef.detectChanges();
    } else if (event.direction === TcSwipeDirection.Y && event.distance > 0 && Math.abs(event.distance) > 75) {
      this.tcGalleryService.closeGallery(this.gallery.id);
    }
  }

  toggleFullscreen(): void {
    this.fullscreen.toggle();
  }

  onFullscreenChange(event: TcFullscreenTransition): void {
    this.isFullscreen = event.isFullscreen;
  }

  downloadImage(): void {
    const url = this.images[this.currentIndex].srcDownload ? this.images[this.currentIndex].srcDownload! : this.images[this.currentIndex].src;

    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: (blob: Blob) => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = this.images[this.currentIndex].slug!;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        },
      error: (error)=> {
        console.error('Error downloading the image: ', error);
      }
    });
  }

  onStart(event: AnimationEvent): void {
    if (this.isAnimating(event)) {
      this.animationEvent$.next({animationEvent: event, animationLifeCycle: TcAnimationLifeCycleEnum.START});
    }
  }

  onDone(event: AnimationEvent): void {
    if (this.isAnimating(event)) {
      this.animationEvent$.next({animationEvent: event, animationLifeCycle: TcAnimationLifeCycleEnum.END});
    }
  }

  private onAnimationDone(): void {
    if (this.show === TcAnimationDirectionEnum.RIGHT) {
      this.currentIndex = this.currentIndex + 1;

      if (this.currentIndex === 1) {
        this.setStyleOnDummySlide(true);
      } else if (this.currentIndex > 1 && this.currentIndex + 1 <= this.images.length) {
        this.slides.shift();
      }

      this.currentSlideIndex = this.slides.length - 1;

      if (this.isNextSlideNotLast) {
        this.slides.push(this.images[this.currentIndex + 1]);
        this.queueIsLoading(this.slides.length - 1);
      }
    } else if (this.show === TcAnimationDirectionEnum.LEFT) {
      if (this.isNextSlideNotLast) {
        this.slides.pop();
      }

      this.currentIndex = this.currentIndex - 1;

      if (this.isPreviousSlideFirstOrHigher) {
        this.currentSlideIndex = this.slides.length - 1;
        this.slides.unshift(this.images[this.currentIndex - 1]);
        this.queueIsLoading(0);
      } else {
        this.currentSlideIndex = 0;
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

    this.show = TcAnimationDirectionEnum.STOP;
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
