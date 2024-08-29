export interface TcGalleryImage {
  src: string,
  srcDownload?: string,
  name?: string,
  slug?: string,
  alt?: string,
  caption?: string,
  selected?: boolean,
}

export interface TcGalleryImageInternal extends TcGalleryImage {
  isLoading?: boolean;
  isLoaded?: boolean;
}

export interface TcGalleryImageSelected {
  selected: boolean,
  image: TcGalleryImage,
}

export interface TcGalleryImages {
  images: TcGalleryImage[],
  openImage?: TcGalleryImage,
}
