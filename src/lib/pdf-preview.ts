import * as pdfjsLib from "pdfjs-dist";

// Use CDN worker for pdfjs
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;

export interface PageThumbnail {
  pageNumber: number;
  dataUrl: string;
  width: number;
  height: number;
}

export async function renderPdfThumbnails(
  file: File,
  scale = 0.4,
  onProgress?: (current: number, total: number) => void
): Promise<PageThumbnail[]> {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const total = pdf.numPages;
  const thumbnails: PageThumbnail[] = [];

  for (let i = 1; i <= total; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d")!;
    await page.render({ canvasContext: ctx, viewport }).promise;
    thumbnails.push({
      pageNumber: i,
      dataUrl: canvas.toDataURL("image/jpeg", 0.7),
      width: viewport.width,
      height: viewport.height,
    });
    onProgress?.(i, total);
  }

  return thumbnails;
}
