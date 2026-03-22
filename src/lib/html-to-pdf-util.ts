import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/**
 * Renders an HTML string inside a hidden container, captures it with html2canvas,
 * then outputs a multi-page jsPDF document.
 */
export async function htmlStringToPdfBlob(
  htmlContent: string,
  onProgress?: (pct: number) => void
): Promise<Blob> {
  onProgress?.(5);

  // Create an off-screen container
  const container = document.createElement("div");
  container.style.cssText =
    "position:fixed;left:-9999px;top:0;width:794px;background:#fff;padding:40px;font-family:sans-serif;color:#000;line-height:1.6;";
  container.innerHTML = htmlContent;
  document.body.appendChild(container);

  onProgress?.(20);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      width: 794,
      windowWidth: 794,
    });

    onProgress?.(60);

    const imgWidth = 210; // A4 mm
    const pageHeight = 297;
    const margin = 10;
    const contentWidth = imgWidth - margin * 2;
    const imgHeight = (canvas.height * contentWidth) / canvas.width;

    const pdf = new jsPDF("p", "mm", "a4");
    let heightLeft = imgHeight;
    let position = margin;
    const imgData = canvas.toDataURL("image/jpeg", 0.92);

    pdf.addImage(imgData, "JPEG", margin, position, contentWidth, imgHeight);
    heightLeft -= pageHeight - margin * 2;

    while (heightLeft > 0) {
      position = -(pageHeight - margin * 2 - heightLeft + imgHeight) + margin;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", margin, position, contentWidth, imgHeight);
      heightLeft -= pageHeight - margin * 2;
    }

    onProgress?.(90);
    const blob = pdf.output("blob");
    onProgress?.(100);
    return blob;
  } finally {
    document.body.removeChild(container);
  }
}
