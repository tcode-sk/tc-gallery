<h1 align="center">tCode Gallery - Simple Angular touch image gallery</h1>

<p align="center">
  <em>Import, use, enjoy!</em>
  <br>
</p>

<p align="center">
  <a href="https://www.tcode.sk/"><strong>tcode.sk</strong></a>
  <br>
</p>

<hr>

## Installation

Run `npm i tcgallery --save`

## Usage

1. Import and use `BrowserAnimationsModule` in your Application config
2. Import and use `<tc-gallery></tc-gallery>` in template of your Application
3. Import `TcGalleryService`
4. Use `registerGallery` method on `TcGalleryService` to get `TcGalleryInstance`
5. Call `openGallery` method on `TcGalleryService` with Gallery instance ID to open modal window

### Example

**app.component.html:**

```
<button (click)="openGallery()">open my gallery</button>
<router-outlet />
<tc-gallery></tc-gallery>
```

**app.component.ts:**

```
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, TcGalleryComponent, FormsModule, ReactiveFormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  private tcGalleryInstanceId: number | undefined;

  constructor(private tcGalleryService: TcGalleryService) {}
  
  ngOnInit(): void {
    const tcGalleryInstance = this.tcGalleryService
      .registerGallery({
        images: [
          {
            'src': 'https://yourdomain.com/images/your-image.jpg',
          },
        ],
      });
      
    this.tcGalleryInstanceId = tcGalleryInstance.id;
      
    tcGalleryInstance
      .currentImageChange()
      .subscribe({next: (tcGalleryImage: TcGalleryImage) => console.log('current image: ', tcGalleryImage)});
      
    tcGalleryInstance
      .afterClosed()
      .subscribe({next: (afterClosed: TcAfterClosed) => console.log('closed: ', afterClosed)});  
  }
  
  openGallery(): void {
    if (this.tcGalleryInstanceId !== undefined) {
      this.tcGalleryService.openGallery(this.tcGalleryInstanceId);
    }
  }
}
```

**app.config.ts:**

```
const routes: Routes = [];

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    importProvidersFrom([BrowserAnimationsModule]),
  ]
};
```

## Configuration

### Images

Provide an object with list of images (`TcGalleryImages[]`) and optional property `openImage` with specific image (`TcGalleryImage`) to open with following structures to successfully register gallery instance:

#### TcGalleryImages:

| Property  | Type               | Requirements | Description                                    |
|-----------|--------------------|--------------|------------------------------------------------|
| images    | `TcGalleryImage[]` | required     | List of images of type `TcGalleryImage`        |
| openImage | `TcGalleryImage`   | optional     | Specific image to open from the list of images |


#### TcGalleryImage:

| Property    | Type      | Requirements | Description                                                                                                                                                                                                               |
|-------------|-----------|--------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| src         | `string`  | required     | Source URL of the image                                                                                                                                                                                                   |
| srcDownload | `string`  | optional     | Download URL of the image. It's useful when User can download image in full size, but image in gallery is minified or different type. It's used only if `enableDownload` option is enabled. See section [Config](#config) |
| slug        | `string`  | optional     | Custom slug will be used in URL. If not provided, slug will be automatically generated from filename in `src` property                                                                                                    |
| alt         | `string`  | optional     | Used as `alt` attribute on `<img>` HTML tag                                                                                                                                                                               |
| name        | `string`  | optional     | Name of the image shown on the bottom of the modal window. Note: It's shown only if `showImageName` option is enabled. See section [Config](#config)                                                                      |
| caption     | `string`  | optional     | Description of the image shown on the bottom of the modal window                                                                                                                                                          |
| selected    | `boolean` | optional     | Boolean value if image is pre-selected or not. Note: It's used only if `selectable` option is enabled. See section [Config](#config)                                                                                      |

### Config

Following object can be passed as second parameter of `registerGallery` method on TcGallery Service

| Property             | Type      | Default value | Description                                                                                                                                                                                                                                                                             |
|----------------------|-----------|---------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| backdrop             | `boolean` | `true`        | Enable/disable backdrop. If enabled, click on the backdrop will close modal window                                                                                                                                                                                                      |
| selectable           | `boolean` | `false`       | Makes images selectable by user via checkboxes. If enabled, you can use `selectImageChange()` observable to listening on selected changes and in `afterClosed()` observable list of `selected` images will be returned. For more info, see section [Methods](#methods)                  |
| preLoadImages        | `boolean` | `true`        | After first opened image is loaded, next and previous image (if available) will start loading. User cannot go to next / previous image until image is loaded                                                                                                                            |
| changeRoute          | `boolean` | `true`        | Enables browser history for gallery and create unique URL for each image to make it sharable. You can specific your own slug used in URL or let generate it automatically based on the filename of image. For more info, see [TcGalleryImage](#TcGalleryImage) section, `slug` property |
| disableRightClick    | `boolean` | `false`       | User cannot use right click or do long touch click on the gallery images. Use it to avoid download images for regular users                                                                                                                                                             |
| enableDownload       | `boolean` | `true`        | User can download current image via button on the top right corner. Programmer can specify different source URL to download via `srcDownload` property (see section [TcGalleryImage](#TcGalleryImage)). This setting is independent with `disableRightClick`                            |
| trapFocusAutoCapture | `boolean` | `false`       | If enabled, first focusable element will be automatically focused after gallery is open                                                                                                                                                                                                 |
| showImageName        | `boolean` | `false`       | Shows name of image on the bottom of the modal window                                                                                                                                                                                                                                   |

### Methods

On TcGallery Instance you can use following methods:

| Method               | Type                           | Description                                                                                                               |
|----------------------|--------------------------------|---------------------------------------------------------------------------------------------------------------------------|
| currentImage()       | `TcGalleryImage`               | Returns currently viewed image in gallery                                                                                 |
| currentImageChange() | `Observable<TcGalleryImage>`   | Subscribes to listening for changes when currently viewed image is changed                                                |
| selectImageChange()  | `Observable<TcGalleryImage[]>` | Subscribes to listening for selected images. For more info see [Config](#config)                                          |
| afterClosed()        | `Observable<TcAfterClosed>`    | Subscribes to close event. If `selectable` is enabled in [Config](#config), then list of selected images will be returned |

On TcGallery Service you can use following methods:

| Method                                                                                                   | Type                             | Description                                                                                                                                                                                                                                                                                                      |
|----------------------------------------------------------------------------------------------------------|----------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| registerGallery(galleryImages: `TcGalleryImages`, config?: `TcGalleryConfig`)                            | `TcGalleryInstance`              | Returns gallery instance of new registered gallery in service                                                                                                                                                                                                                                                    |
| getGalleryInstance(galleryId: `number`)                                                                  | `TcGalleryInstance \| undefined` | Returns gallery instance based on gallery ID                                                                                                                                                                                                                                                                     |
| openGallery(idOrGallery: `number \| TcGallery`, openImage?: `{tcgImage?: TcGalleryImage, src?: string}`) | `void`                           | Opens registered gallery based on ID or Gallery Instance with optional second parameter `openImage`. On this optional parameter you can specify `tcImage` or if you don't have `TcGalleryImage` type yet, should be enough to provide `src`. In both scenarios, code tries to find image in list of this gallery |
| closeLatestGallery()                                                                                     | `void`                           | Closes latest opened gallery. Mainly it is used on `keydown` Event for Escape key                                                                                                                                                                                                                                |
| closeGallery(idOrGallery: `number \| TcGalleryInstance`)                                                 | `void`                           | Closes gallery based on ID or Gallery Instance                                                                                                                                                                                                                                                                   |
| closeAllGalleries()                                                                                      | `void`                           | Closes all opened galleries. In this moment it is kind of workaround to close gallery without knowing ID or Instance                                                                                                                                                                                             |
| closeAllRouteRelatedGalleries()                                                                          | `void`                           | Closes all opened galleries which are allowed to change `Route` history. It is used in the moment when User click back browser button or he will navigate back in other way                                                                                                                                      |
| deregisterGallery(idOrGallery: `number \| TcGalleryInstance`)                                            | `void`                           | De-registers gallery. It's useful when you need change [Config](#config) or you don't want to store not necessary instance in memory anymore                                                                                                                                                                     |
| selectImage(galleryId: `number`, imageSelected: `TcGalleryImageSelected`)                                | `void`                           | Selects/deselects image in gallery based on provided ID                                                                                                                                                                                                                                                          |
| currentImageChanged(galleryId: `number`, image: `TcGalleryImage`)                                        | `void`                           | Changes which image in gallery is currently viewed based on provided ID                                                                                                                                                                                                                                          |

### Getters

On TcGallery Instance you can use following getters:

| Property | Type              | Description                       |
|----------|-------------------|-----------------------------------|
| id       | `number`          | Returns current gallery id        |
| config   | `TcGalleryConfig` | Returns current config            |
| isOpen   | `boolean`         | Returns if gallery is open or not |


## Contribution

### General

There are two ways how to contribute. The first one is to download this repo, and run "App wrapper" (same as demo site does). The second way is to add this TcGallery library via NPM link directly into your project and test it there.

### Run with App Wrapper

Run `ng serve` to build on the fly App wrapper (source path: `src/app`)
  + optional flag: `--live-reload=false`

Run `ng build tc-gallery --watch` to build and watch for changes of `tc-gallery` library (source path: `projects/tc-gallery/src/lib/`)

*Both run from App root folder: `/`

### NPM link (optional)

1. Navigate to library’s root folder (where angular.json is located), path: `projects/tc-gallery/src/`
2. Create a symlink to our library in your global npm modules: `npm link`
3. Navigate to your App root folder, path: `/`
4. Link `tc-gallery` library using the globally linked package: `npm link tc-gallery`
5. In your App, import and use the components from library as needed.

### Build

Run `ng build tc-gallery` to build the project. The build artifacts will be stored in the `dist/` directory.
