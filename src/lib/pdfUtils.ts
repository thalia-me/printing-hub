/**
 * Client-side utility to detect total page count from uploaded files (PDFs and images)
 */
export async function detectTotalPages(files: File[]): Promise<number> {
  if (!files || files.length === 0) return 1;

  let totalPages = 0;

  for (const file of files) {
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImage = file.type.startsWith('image/');

    if (isPdf) {
      try {
        const { PDFDocument } = await import('pdf-lib');
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        const count = pdfDoc.getPageCount();
        totalPages += Math.max(1, count);
      } catch (err) {
        console.warn(`[pdfUtils] Could not parse page count for "${file.name}":`, err);
        // Fallback: estimate at least 1 page for this PDF
        totalPages += 1;
      }
    } else if (isImage) {
      // Each image file represents 1 page
      totalPages += 1;
    } else {
      // Unknown doc type (e.g. Word, text file): count as at least 1 page
      totalPages += 1;
    }
  }

  return Math.max(1, totalPages);
}
