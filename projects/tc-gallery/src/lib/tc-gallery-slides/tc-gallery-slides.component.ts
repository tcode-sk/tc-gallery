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
import { Observable, Observer } from 'rxjs';
import { NavigationExtras, Router } from '@angular/router';

import { TcGallery, TcGalleryImage } from '../tc-gallery.service';

enum AnimationDirectionEnum {
  LEFT = 'left',
  RIGHT = 'right',
  STOP = 'stop',
}

@Component({
  selector: 'lib-tc-gallery-slides',
  standalone: true,
  imports: [],
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

  @Input() set images(gallery: TcGallery['gallery']) {
    this._images = gallery.images;

    this.setupFirstImage(gallery);
    this.setupSlides();
    this.preloadImages();
  }
  get images(): TcGalleryImage[] {
    return this._images;
  }

  @Output() currentImage = new EventEmitter<TcGalleryImage>();

  animationDirectionEnum = AnimationDirectionEnum;

  show = AnimationDirectionEnum.STOP;
  slides: TcGalleryImage[] = []

  prevIsLoading = false;
  nextIsLoading = false;

  currentIndex: number = 0;
  private isAnimated = false;
  private _images: TcGalleryImage[] = [];

  @ViewChild('dummySlide') dummySlide: ElementRef | undefined;

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === 'ArrowLeft') {
      this.moveImage(this.animationDirectionEnum.LEFT);
    } else if (event.key === 'ArrowRight') {
      this.moveImage(this.animationDirectionEnum.RIGHT);
    }
  }

  constructor(private renderer: Renderer2, private router: Router) {}

  ngAfterViewInit(): void {
    if (this.currentIndex === 1) {
      this.renderer.setStyle(this.dummySlide?.nativeElement, 'display', 'none');
    }
  }

  onStart(event: AnimationEvent) {
    if (event.toState !== 'void' && event.toState !== null) {
      this.isAnimated = true;
    }
  }

  onDone(event: AnimationEvent) {
    if (event.toState !== 'void' && event.toState !== null) {
      if (this.show === AnimationDirectionEnum.RIGHT) {
        this.currentIndex = this.currentIndex + 1;

        if (this.currentIndex + 1 < this.images.length) {
          this.slides.push(this.images[this.currentIndex + 1]);
        }

        if (this.currentIndex === 1) {
          this.renderer.setStyle(this.dummySlide?.nativeElement, 'display', 'none');
        } else if (this.currentIndex > 1 && this.currentIndex + 1 <= this.images.length) {
          this.slides.shift();
        }
      } else if (this.show === AnimationDirectionEnum.LEFT) {
        if (this.currentIndex + 1 < this.images.length) {
          this.slides.pop();
        }

        this.currentIndex = this.currentIndex - 1;

        if (this.currentIndex - 1 >= 0) {
          this.slides.unshift(this.images[this.currentIndex - 1]);
        }

        if (this.currentIndex === 0) {
          this.renderer.setStyle(this.dummySlide?.nativeElement, 'display', 'block');
        }
      }

      const queryParams: NavigationExtras = {
        queryParams: { tcg: this.images[this.currentIndex].slug },
        queryParamsHandling: 'merge' // Preserve existing parameters
      };

      this.router.navigate([], queryParams);
      this.isAnimated = false;
      this.show = AnimationDirectionEnum.STOP;
    }
  }

  setupFirstImage(gallery: TcGallery['gallery']): void {
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

  setupSlides(): void {
    this.slides = this.images.slice(this.currentIndex, this.currentIndex + 2);
  }

  preloadImages(): void {
    if (this.currentIndex - 1 >= 0) {
      this.prevIsLoading = true;

      this.preLoadImage(this.slides[this.currentIndex - 1])
        .subscribe({
          complete: () => this.prevIsLoading = false,
        });
    }

    if (this.currentIndex + 1 < this.slides.length) {
      this.nextIsLoading = true;

      this.preLoadImage(this.slides[this.currentIndex + 1])
        .subscribe({
          complete: () => this.nextIsLoading = false,
        });
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

  private preLoadImage(image: TcGalleryImage): Observable<void> {
    return new Observable((observer: Observer<void>) => {
      const img = new Image();
      img.src = image.src;
      img.onload = () => {
        observer.next();
        observer.complete();
      };
      img.onerror = (err: Event | string) => {
        observer.next();
        observer.complete();
      };
    });
  }
}
