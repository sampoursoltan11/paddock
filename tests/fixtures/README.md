# Test Fixtures

This directory contains test files and sample documents for testing the SmartProof AI application.

## Files Overview

### Text Content Files (for reference)

These text files contain the content that would be in the PDF versions. Use these as reference when creating actual PDFs.

| File | Purpose | Compliance Status |
|------|---------|------------------|
| `sample-brochure-content.txt` | 2024 Camry brochure with proper disclosures | ✅ Mostly Compliant |
| `compliant-sample.txt` | 2024 Highlander - fully compliant example | ✅ Fully Compliant |
| `non-compliant-sample.txt` | 2024 RAV4 - intentionally non-compliant | ❌ Multiple Violations |
| `invalid-file.txt` | Plain text file for upload validation testing | N/A |

### PDF Files (to be created)

Create PDF versions of the text files above for actual testing:

#### Required PDFs:

1. **sample-brochure.pdf**
   - Convert from: `sample-brochure-content.txt`
   - Use for: Basic upload and compliance testing
   - Expected Result: Should pass with minor warnings

2. **compliant-sample.pdf**
   - Convert from: `compliant-sample.txt`
   - Use for: Testing fully compliant documents
   - Expected Result: Should pass all compliance checks (95-100% score)

3. **non-compliant-sample.pdf**
   - Convert from: `non-compliant-sample.txt`
   - Use for: Testing violation detection
   - Expected Result: Should fail with multiple violations (40-60% score)

4. **another-sample.pdf**
   - Any additional Toyota marketing content
   - Use for: Multiple upload testing

5. **large-file.pdf**
   - A PDF > 10MB
   - Use for: File size limit testing
   - Expected Result: Should be rejected

6. **corrupted.pdf**
   - A corrupted/invalid PDF file
   - Use for: Error handling testing
   - Expected Result: Should fail gracefully with error message

### Image Files (to be created)

Create these image files for image analysis testing:

1. **toyota-logo.jpg**
   - Official Toyota logo (download from toyota.com)
   - Format: JPEG, 300 DPI
   - Use for: Logo detection testing
   - Expected Result: Should detect logo with 85%+ confidence

2. **toyota-logo-low-res.jpg**
   - Toyota logo at low resolution (72 DPI)
   - Use for: Image quality testing
   - Expected Result: Should warn about low resolution

3. **brand-colors.jpg**
   - Image using official Toyota brand colors
   - Include: Red (#EB0A1E), Black (#000000), Silver (#C0C0C0)
   - Use for: Color analysis testing
   - Expected Result: Should pass color compliance

4. **off-brand-colors.jpg**
   - Image using non-approved colors
   - Use for: Color violation testing
   - Expected Result: Should flag color violations

5. **camry-photo.jpg**
   - Stock photo of 2024 Camry
   - Format: JPEG, 300 DPI, high quality
   - Use for: General image analysis

6. **blurry-image.jpg**
   - Intentionally blurred vehicle photo
   - Use for: Quality assessment testing
   - Expected Result: Should detect poor image quality

## Creating PDF Files

### Option 1: Using Online Tools
1. Copy content from `.txt` files
2. Use tools like:
   - Google Docs (File → Download → PDF)
   - Microsoft Word (Save As → PDF)
   - [PDF Generator](https://www.freepdfconvert.com/)

### Option 2: Using Command Line (macOS/Linux)

```bash
# Install pandoc if not already installed
brew install pandoc

# Convert text to PDF
pandoc sample-brochure-content.txt -o sample-brochure.pdf
pandoc compliant-sample.txt -o compliant-sample.pdf
pandoc non-compliant-sample.txt -o non-compliant-sample.pdf
```

### Option 3: Using Python

```python
from fpdf import FPDF

def text_to_pdf(txt_file, pdf_file):
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=10)

    with open(txt_file, 'r') as f:
        for line in f:
            pdf.cell(200, 5, txt=line, ln=True)

    pdf.output(pdf_file)

# Create PDFs
text_to_pdf('sample-brochure-content.txt', 'sample-brochure.pdf')
text_to_pdf('compliant-sample.txt', 'compliant-sample.pdf')
text_to_pdf('non-compliant-sample.txt', 'non-compliant-sample.pdf')
```

## Creating Image Files

### Download Toyota Brand Assets
- Official logo: [toyota.com/brand-assets](https://www.toyota.com/)
- Stock photos: [Toyota Media Room](https://pressroom.toyota.com/)

### Toyota Brand Colors (Official)
- **Toyota Red**: PMS 485C / #EB0A1E / RGB(235, 10, 30)
- **Black**: PMS Process Black / #000000 / RGB(0, 0, 0)
- **Silver**: PMS 877C / #C0C0C0 / RGB(192, 192, 192)
- **White**: Pure White / #FFFFFF / RGB(255, 255, 255)

### Creating Test Images

```bash
# Using ImageMagick to create test images

# Create a simple brand color test image
convert -size 800x600 xc:"#EB0A1E" brand-colors.jpg

# Create an off-brand color image (wrong red)
convert -size 800x600 xc:"#FF0000" off-brand-colors.jpg

# Create a low-resolution version
convert toyota-logo.jpg -resize 100x100 -density 72 toyota-logo-low-res.jpg

# Create a blurred image
convert camry-photo.jpg -blur 0x8 blurry-image.jpg
```

## Creating Large File for Testing

```bash
# Create a large PDF (>10MB)
pdftk sample-brochure.pdf sample-brochure.pdf sample-brochure.pdf \
  sample-brochure.pdf sample-brochure.pdf sample-brochure.pdf \
  cat output large-file.pdf

# Or using ghostscript to create a large file
gs -sDEVICE=pdfwrite -dNOPAUSE -dBATCH -dSAFER \
   -sOutputFile=large-file.pdf \
   sample-brochure.pdf [... repeat 10+ times ...]
```

## Creating Corrupted PDF

```bash
# Create an invalid PDF
echo "This is not a valid PDF" > corrupted.pdf

# Or truncate a valid PDF
head -c 1000 sample-brochure.pdf > corrupted.pdf
```

## Testing Checklist

Use these fixtures to test:

### Upload Functionality
- [ ] `sample-brochure.pdf` - Should upload successfully
- [ ] `invalid-file.txt` - Should be rejected (not a PDF)
- [ ] `large-file.pdf` - Should be rejected (>10MB)
- [ ] `corrupted.pdf` - Should fail with error message

### Compliance Testing
- [ ] `compliant-sample.pdf` - Should score 95-100%
- [ ] `non-compliant-sample.pdf` - Should score 40-60% with violations
- [ ] `sample-brochure.pdf` - Should score 80-95% with minor warnings

### Image Analysis
- [ ] `toyota-logo.jpg` - Should detect logo
- [ ] `toyota-logo-low-res.jpg` - Should warn about resolution
- [ ] `brand-colors.jpg` - Should pass color compliance
- [ ] `off-brand-colors.jpg` - Should fail color compliance
- [ ] `blurry-image.jpg` - Should detect poor quality

### Workflow Testing
- [ ] Multiple file uploads
- [ ] Concurrent uploads
- [ ] Report generation
- [ ] Download functionality

## File Naming Convention

Follow this naming pattern for any additional test files:

```
[model]-[type]-[status].pdf

Examples:
camry-brochure-compliant.pdf
rav4-flyer-non-compliant.pdf
highlander-spec-sheet-partial.pdf
```

## Notes

- **Do not commit actual Toyota brand assets** without proper licensing
- Use mock/sample content for testing
- Keep file sizes reasonable (<5MB except for `large-file.pdf`)
- Update this README when adding new fixtures
- Document expected compliance scores for each file

## Maintenance

- Review fixtures quarterly
- Update content to match latest Toyota guidelines
- Replace outdated model year information
- Add new test cases as compliance rules evolve

---

**Last Updated**: 2025-10-23
**Version**: 1.0.0
