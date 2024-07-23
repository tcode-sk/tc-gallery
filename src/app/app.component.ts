import { Component, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TcGalleryComponent, TcGalleryService } from 'tc-gallery';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, TcGalleryComponent, FormsModule, ReactiveFormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'tc-gallery-test-app';

  @ViewChild('test') test: ViewContainerRef | undefined;

  form = this.fb.group({
    test: ''
  })

  constructor(private tcGalleryService: TcGalleryService, private fb: FormBuilder, private http: HttpClient) {

  }

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
  }

  openGallery(): void {
    const tcGalleryTest = this.tcGalleryService
      .openGallery({
        images: [
          {src: 'https://api.striky.sk/images/ckt/blog/slovakia-ring-september-2023/IMG_0097.jpg'},
          {src: 'https://api.striky.sk/images/ckt/blog/slovakia-ring-september-2023/IMG_0091.jpg'},
          {src: 'https://api.striky.sk/images/ckt/blog/slovakia-ring-september-2023/DSCF0533.jpg'},
          {src: 'https://api.striky.sk/images/ckt/blog/slovakia-ring-september-2023/DSCF0540.jpg'},
          {src: 'https://api.striky.sk/images/ckt/blog/slovakia-ring-september-2023/DSCF0616.jpg'},
        ],
      }, {backdrop: true, preLoadImages: true});

    tcGalleryTest
      .afterClosed()
      .subscribe({next: () => console.log('closed')});
  }

  createRequest(value: string): void {

  }
}
