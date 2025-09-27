import { WatermarkSystemManager } from './watermark-system';
import { WatermarkConfig } from '@/types/watermark';

// PDF generation with watermarks (using jsPDF)
export class DocumentExportManager {
  // Export document as PDF with watermark for free users
  static async exportToPDF(
    content: string,
    title: string,
    userId: string,
    userTier: 'free' | 'premium' | 'enterprise',
    documentId?: string
  ): Promise<Blob> {
    // Dynamic import to avoid SSR issues
    const { jsPDF } = await import('jspdf');
    const html2canvas = (await import('html2canvas')).default;

    const doc = new jsPDF();

    // Get watermark configuration
    const watermarkConfig = await WatermarkSystemManager.getWatermarkForUser(userTier);

    // Create a temporary container for the content
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.width = '210mm'; // A4 width
    container.style.padding = '20mm';
    container.style.backgroundColor = 'white';
    container.style.fontFamily = 'Arial, sans-serif';
    container.style.fontSize = '12px';
    container.style.lineHeight = '1.6';
    container.innerHTML = content;

    // Add watermark to content if user is free tier
    if (watermarkConfig && userTier === 'free') {
      const watermarkHTML = WatermarkSystemManager.generateWatermarkHTML(watermarkConfig);
      container.innerHTML += watermarkHTML;

      // Track watermark application
      if (documentId) {
        await WatermarkSystemManager.trackWatermarkApplication(
          documentId,
          userId,
          userTier,
          watermarkConfig,
          'pdf'
        );
      }
    }

    document.body.appendChild(container);

    try {
      // Convert HTML to canvas
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      // Add canvas to PDF
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      // Add first page
      doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        doc.addPage();
        doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Add metadata
      doc.setProperties({
        title: title,
        creator: userTier === 'free' ? 'OttoWrite AI (Free Version)' : 'OttoWrite AI',
        producer: 'OttoWrite AI Document Export'
      });

      return doc.output('blob');
    } finally {
      // Clean up
      document.body.removeChild(container);
    }
  }

  // Export as DOCX with watermark
  static async exportToDocx(
    content: string,
    title: string,
    userId: string,
    userTier: 'free' | 'premium' | 'enterprise',
    documentId?: string
  ): Promise<Blob> {
    // Dynamic import for docx library
    const { Document, Packer, Paragraph, TextRun, Footer, AlignmentType } = await import('docx');

    const watermarkConfig = await WatermarkSystemManager.getWatermarkForUser(userTier);

    // Convert HTML content to docx paragraphs (simplified)
    const paragraphs = this.htmlToDocxParagraphs(content);

    // Create footer with watermark for free users
    const footers: any[] = [];
    if (watermarkConfig && userTier === 'free') {
      footers.push(
        new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({
                  text: watermarkConfig.text,
                  size: watermarkConfig.style.fontSize * 2, // Convert to half-points
                  color: watermarkConfig.style.color.replace('#', ''),
                  font: watermarkConfig.style.fontFamily
                }),
                ...(watermarkConfig.subText ? [
                  new TextRun({
                    text: `\n${watermarkConfig.subText}`,
                    size: (watermarkConfig.style.fontSize - 2) * 2,
                    color: watermarkConfig.style.color.replace('#', ''),
                    font: watermarkConfig.style.fontFamily
                  })
                ] : [])
              ]
            })
          ]
        })
      );

      // Track watermark application
      if (documentId) {
        await WatermarkSystemManager.trackWatermarkApplication(
          documentId,
          userId,
          userTier,
          watermarkConfig,
          'docx'
        );
      }
    }

    const doc = new Document({
      sections: [{
        properties: {},
        children: paragraphs,
        footers: footers.length > 0 ? { default: footers[0] } : undefined
      }]
    });

    return await Packer.toBlob(doc);
  }

  // Export as HTML with watermark
  static async exportToHTML(
    content: string,
    title: string,
    userId: string,
    userTier: 'free' | 'premium' | 'enterprise',
    documentId?: string
  ): Promise<string> {
    const watermarkConfig = await WatermarkSystemManager.getWatermarkForUser(userTier);

    let htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      color: #333;
      background: white;
    }
    h1, h2, h3, h4, h5, h6 {
      color: #2c3e50;
      margin-top: 30px;
      margin-bottom: 15px;
    }
    p {
      margin-bottom: 15px;
      text-align: justify;
    }
    .document-header {
      text-align: center;
      border-bottom: 2px solid #3498db;
      padding-bottom: 20px;
      margin-bottom: 40px;
    }
    ${watermarkConfig && userTier === 'free' ? WatermarkSystemManager.generatePrintProtectionCSS() : ''}
  </style>
</head>
<body>
  <div class="document-header">
    <h1>${title}</h1>
    <p style="color: #7f8c8d; font-style: italic;">Created with OttoWrite AI</p>
  </div>

  <div class="document-content">
    ${content}
  </div>
</body>
</html>
    `;

    // Add watermark for free users
    if (watermarkConfig && userTier === 'free') {
      htmlContent = WatermarkSystemManager.applyWatermarkToHTML(htmlContent, watermarkConfig);

      // Track watermark application
      if (documentId) {
        await WatermarkSystemManager.trackWatermarkApplication(
          documentId,
          userId,
          userTier,
          watermarkConfig,
          'html'
        );
      }
    }

    return htmlContent;
  }

  // Print with watermark protection
  static printDocumentWithWatermark(
    content: string,
    title: string,
    userTier: 'free' | 'premium' | 'enterprise'
  ): void {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let printContent = `
<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  <style>
    @media print {
      @page {
        margin: 2cm;
      }
    }
    body {
      font-family: 'Times New Roman', serif;
      line-height: 1.6;
      color: #000;
      background: white;
    }
    h1, h2, h3 { color: #000; }
    .no-print { display: none !important; }
  </style>
    `;

    // Add watermark protection for free users
    if (userTier === 'free') {
      printContent += WatermarkSystemManager.generatePrintProtectionCSS();
    }

    printContent += `
</head>
<body>
  <h1>${title}</h1>
  <div>${content}</div>
</body>
</html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();

    // Wait for content to load, then print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 1000);
  }

  // Helper method to convert HTML to DOCX paragraphs (simplified)
  private static htmlToDocxParagraphs(html: string): any[] {
    // This is a simplified conversion - you might want to use a more robust HTML to DOCX converter
    const textContent = html.replace(/<[^>]*>/g, '').trim();
    const paragraphs = textContent.split('\n\n').filter(p => p.trim());

    return paragraphs.map(text => ({
      children: [{ text: text.trim() }]
    }));
  }
}