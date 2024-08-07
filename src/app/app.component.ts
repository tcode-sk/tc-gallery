import { Component, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

import { IMAGES_MOCK } from './mock/images.mock';
import { TcGalleryComponent } from '../../projects/tc-gallery/src/lib/components/tc-gallery/tc-gallery.component';
import { TcGalleryService } from '../../projects/tc-gallery/src/lib/services/tc-gallery.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, TcGalleryComponent, FormsModule, ReactiveFormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'tc-gallery-test-app';

  form = this.fb.group({
    test: ''
  })

  tcGalleryTestId: number | undefined;

  @ViewChild('test') test: ViewContainerRef | undefined;

  constructor(private tcGalleryService: TcGalleryService, private fb: FormBuilder, private http: HttpClient) {}

  ngOnInit(): void {
    // @ToDo striky - bezi's tutorial code learning
    // this.form.get('test')?.valueChanges.pipe(
    // of(1,2,3).pipe(
    //   tap((value) => console.log(value)),
    //   concatMap((value) => {
    //     console.log('http: ', value);
    //     return this.http.get(`https://cat-fact.herokuapp.com/facts/?value=${value}`)
    //   }),
    //   // catchError(() => of(null))
    // ).subscribe({
    //   next: (value) => console.log('next: ' + value),
    //   complete: () => console.log('complete: '),
    //   error: (value: any) => console.log('error: ' + value),
    // })

    const tcGalleryTest = this.tcGalleryService
      .registerGallery({
        images: IMAGES_MOCK,
      }, {backdrop: true, preLoadImages: true, selectable: true, disableRightClick: true});

    tcGalleryTest
      .currentImageChange()
      .subscribe({next: (galleryImage) => console.log('current image: ', galleryImage)});

    tcGalleryTest
      .selectImageChange()
      .subscribe({next: (galleryImages) => console.log('selected images: ', galleryImages)});

    tcGalleryTest
      .afterClosed()
      .subscribe({next: (afterClosed) => console.log('closed: ', afterClosed)});

    this.tcGalleryTestId = tcGalleryTest.id;
  }

  openGallery(): void {
    if (this.tcGalleryTestId !== undefined) {
      this.tcGalleryService.openGallery(this.tcGalleryTestId);
    }
  }

  createRequest(value: string): void {

  }
}
