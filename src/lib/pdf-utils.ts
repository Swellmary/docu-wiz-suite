/**
 * Helper to download pdf-lib Uint8Array as a file.
 * Casts to `Uint8Array<ArrayBuffer>` to satisfy strict TS BlobPart typing.
 */
export function downloadPdf(pdfBytes: Uint8Array, filename: string) {
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
