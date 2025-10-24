const { pdfToPng } = require('pdf-to-png-converter');
const fs = require('fs');
const path = require('path');

async function testConversion() {
  const pdfPath = path.join(__dirname, '..', 'test-documents', '2026 Toyota Corolla Hatchback - Product Information.pdf');
  const outputDir = '/tmp/toyota-png-test';

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('Converting PDF to PNG...');
  console.log('PDF:', pdfPath);

  const pngPages = await pdfToPng(pdfPath, {
    outputFolder: outputDir,
    disableFontFace: true,
    useSystemFonts: false,
    viewportScale: 2.0,
    strictMode: false,
  });

  console.log('✓ Converted to', pngPages.length, 'PNG images');

  pngPages.forEach((page, i) => {
    console.log('Page', i + 1, ':', page.path);
    const stats = fs.statSync(page.path);
    console.log('  Size:', Math.round(stats.size / 1024), 'KB');
  });

  // Copy to project root
  const destPath = path.join(__dirname, '..', 'toyota-page-1.png');
  fs.copyFileSync(pngPages[0].path, destPath);
  console.log('\n✓ PNG saved to:', destPath);
}

testConversion().catch(console.error);
