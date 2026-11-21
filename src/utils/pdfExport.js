import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

/**
 * Exports an Arabic invoice HTML element to a crisp A5 PDF.
 * Uses html-to-image (SVG foreignObject) so the browser's native text shaper
 * renders all Arabic cursive ligatures seamlessly without broken/separated characters.
 */
export async function exportInvoiceToPdf(element, filename = 'Facture.pdf') {
  if (!element) {
    throw new Error('Element to export is not provided');
  }

  // 1. Ensure all web fonts are fully loaded
  if (document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // Ignore font ready errors
    }
  }

  // 2. Generate high-resolution PNG via native browser SVG foreignObject rendering
  const dataUrl = await toPng(element, {
    quality: 0.98,
    pixelRatio: 2.5,
    backgroundColor: '#ffffff',
    cacheBust: false,
    filter: (node) => {
      // Exclude elements marked with .no-print
      if (node.classList && node.classList.contains('no-print')) {
        return false;
      }
      return true;
    },
  });

  // 3. Create A5 portrait jsPDF instance
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5',
  });

  const pageWidth = pdf.internal.pageSize.getWidth(); // 148 mm for A5
  const pageHeight = pdf.internal.pageSize.getHeight(); // 210 mm for A5

  const margin = 3; // 3 mm outer margin
  const renderWidth = pageWidth - margin * 2; // 142 mm
  const elementAspectRatio = (element.offsetHeight || 1) / (element.offsetWidth || 1);
  const calculatedHeight = renderWidth * elementAspectRatio;
  const renderHeight = Math.min(calculatedHeight, pageHeight - margin * 2);

  // 4. Draw image onto PDF
  pdf.addImage(dataUrl, 'PNG', margin, margin, renderWidth, renderHeight, undefined, 'FAST');

  // 5. Trigger download
  pdf.save(filename);
}
