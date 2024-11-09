/// <reference types="vite/client" />

declare module 'pptxgenjs' {
  export default class PptxGenJS {
    constructor();
    load(data: ArrayBuffer): Promise<void>;
    getSlides(): Slide[];
  }

  interface Slide {
    render(canvas: HTMLCanvasElement): void;
  }
}