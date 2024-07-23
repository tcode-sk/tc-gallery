# TcGallery

This library was generated with [Angular CLI](https://github.com/angular/angular-cli) version 18.0.0.

## Contribution

### Run

Run `ng serve` to build on the fly App wrapper (source path: `src/app`)
  + optional flag: `--live-reload=false`

Run `ng build tc-gallery --watch` to build and watch for changes of `tc-gallery` library (source path: `projects/tc-gallery/src/lib/`)

*Both run from App root folder: `/`

### NPM link

1. Navigate to library’s root folder (where angular.json is located), path: `projects/tc-gallery/src/`
2. Create a symlink to your library in your global npm modules: `npm link`
3. Navigate to App root folder, path: `/`
4. Link `tc-gallery` library using the globally linked package: `npm link tc-gallery`
5. In test App, import and use the components from library as needed.

## Code scaffolding

Run `ng generate component component-name --project tc-gallery` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module --project tc-gallery`.
> Note: Don't forget to add `--project tc-gallery` or else it will be added to the default project in your `angular.json` file. 

## Build

Run `ng build tc-gallery` to build the project. The build artifacts will be stored in the `dist/` directory.

## Publishing

After building your library with `ng build tc-gallery`, go to the dist folder `cd dist/tc-gallery` and run `npm publish`.

## Running unit tests

Run `ng test tc-gallery` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
