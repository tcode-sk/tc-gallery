import { Observable, Subject } from 'rxjs';

import { TcGalleryImage } from './tc-gallery-image.interface';
import { TcGalleryConfig } from './tc-gallery-config.interface';

export interface TcGallery {
  id: number,
  gallery: {
    images: TcGalleryImage[],
    current: TcGalleryImage,
  },
  config: TcGalleryConfig,
  selectedImages: TcGalleryImage[],
  afterClosed: Observable<TcAfterClosed>,
}

export interface TcGalleryInternal {
  id: number,
  config: TcGalleryConfig,
  gallery: {
    images: TcGalleryImage[],
    current: TcGalleryImage,
  },
  afterClosedSubject: Subject<TcAfterClosed>,
  visible: boolean,
}

export interface TcAfterClosed {
  selected?: TcGalleryImage[],
}

