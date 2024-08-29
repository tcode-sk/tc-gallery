import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { IMAGES_MOCK } from './mock/images.mock';
import { TcGalleryComponent } from '../../projects/tc-gallery/src/lib/components/tc-gallery/tc-gallery.component';
import { TcGalleryService } from '../../projects/tc-gallery/src/lib/services/tc-gallery.service';
import { TcGalleryImage } from '../../projects/tc-gallery/src/lib/interfaces/tc-gallery-image.interface';
import { TcAfterClosed } from '../../projects/tc-gallery/src/lib/interfaces/tc-gallery.interface';
import { TcGalleryInstance } from '../../projects/tc-gallery/src/lib/classes/tc-gallery-instance.class';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, TcGalleryComponent, FormsModule, ReactiveFormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {

  form = this.fb.nonNullable.group({
    backdrop: true,
    selectable: false,
    preLoadImages: true,
    changeRoute: true,
    disableRightClick: false,
    enableDownload: true,
    trapFocusAutoCapture: false,
    showImageName: false,
  });

  private tcGalleryInstance: TcGalleryInstance | undefined;
  private unsubscribeAll$ = new Subject<void>();

  constructor(private tcGalleryService: TcGalleryService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initGallery();
    this.formChanges();
  }

  openGallery(): void {
    if (this.tcGalleryInstance && this.tcGalleryInstance.id !== undefined) {
      this.tcGalleryService.openGallery(this.tcGalleryInstance.id);
    }
  }

  private formChanges(): void {
    this.form.valueChanges.subscribe({
      next: ()  => {
        this.deregisterGallery();
        this.initGallery();
      }
    });
  }

  private initGallery(): void {
    this.tcGalleryInstance = this.tcGalleryService
      .registerGallery({
        images: IMAGES_MOCK,
      }, this.form.getRawValue());


    this.tcGalleryInstance
      .currentImageChange()
      .pipe(takeUntil(this.unsubscribeAll$))
      .subscribe({next: (tcGalleryImage: TcGalleryImage) => console.log('current image: ', tcGalleryImage)});

    this.tcGalleryInstance
      .selectImageChange()
      .pipe(takeUntil(this.unsubscribeAll$))
      .subscribe({next: (galleryImages: TcGalleryImage[]) => console.log('selected images: ', galleryImages)});

    this.tcGalleryInstance
      .afterClosed()
      .pipe(takeUntil(this.unsubscribeAll$))
      .subscribe({next: (afterClosed: TcAfterClosed) => console.log('closed: ', afterClosed)});
  }

  private deregisterGallery(): void {
    if (this.tcGalleryInstance) {
      this.tcGalleryService.deregisterGallery(this.tcGalleryInstance?.id);
      this.unsubscribeAll$.next();
    }
  }
}
