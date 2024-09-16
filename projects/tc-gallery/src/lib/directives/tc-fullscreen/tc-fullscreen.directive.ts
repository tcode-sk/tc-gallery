/**
 * *** Angular Fullscreen ***
 *
 * Author: micobarac<Milan Barać>(https://github.com/micobarac)
 * GitHub: https://github.com/micobarac/angular-fullscreen
 * Docs: https://medium.com/@milan.barac/angular-fullscreen-cd8b788c348f
 */

import { DOCUMENT } from '@angular/common';
import { Directive, ElementRef, EventEmitter, HostBinding, HostListener, Inject, Input, Output } from '@angular/core';

export interface TcFullscreenTransition {
  isFullscreen: boolean;
  element: Element | null;
}

@Directive({
  selector: '[tc-fullscreen]',
  standalone: true,
  exportAs: 'tc-fullscreen'
})
export class TcFullscreenDirective {

  @Input() set fullscreenDocument(enabled: boolean) {
    if (enabled) {
      this.element = this.document.documentElement;
    }
  }
  @Output() fullscreenChange = new EventEmitter<TcFullscreenTransition>();

  @HostBinding('class.fullscreen') get isFullscreen(): boolean {
    return this.isFullscreenEnabled();
  }

  @HostListener('document:fullscreenchange') private onTransition() {
    const isFullscreen = this.isFullscreen;
    const element = this.element;
    this.fullscreenChange.emit({ isFullscreen, element });
  }

  private element!: HTMLElement;

  constructor(@Inject(DOCUMENT) private document: Document, private elementRef: ElementRef,) {
    this.element = this.elementRef.nativeElement;
  }

  async enter(): Promise<void> {
    await this.enterFullscreen()
  }

  async exit(): Promise<void> {
    if (this.isFullscreen) {
      await this.exitFullscreen();
    }
  }

  toggle(): void {
    if (this.isFullscreen) {
      this.exit();
    } else {
      this.enter();
    }
  }

  private async enterFullscreen(): Promise<void> {
    const tempElement = this.element;
    await ((tempElement as any).requestFullscreen?.() ||
      (tempElement as any).webkitRequestFullscreen?.() ||
      (tempElement as any).mozRequestFullScreen?.() ||
      (tempElement as any).msRequestFullscreen?.());
  }

  private async exitFullscreen(): Promise<void> {
    await ((this.document as any).exitFullscreen?.() ||
      (this.document as any).webkitExitFullscreen?.() ||
      (this.document as any).mozCancelFullScreen?.() ||
      (this.document as any).msExitFullscreen?.());
  }

  private isFullscreenEnabled(): boolean {
    return !!(
      (this.document as any).fullscreenElement ||
      (this.document as any).webkitFullscreenElement ||
      (this.document as any).mozFullScreenElement ||
      (this.document as any).msFullscreenElement
    );
  }
}
