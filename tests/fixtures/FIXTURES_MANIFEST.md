# Test Fixtures Manifest

This document lists all available test fixtures and their intended use.

## PDF Test Files

### ✅ Valid PDF Files

| File | Size | Content | Compliance Status | Expected Score | Use Case |
|------|------|---------|------------------|----------------|----------|
| `sample-brochure.pdf` | ~2KB | 2024 Camry brochure | Mostly compliant | 80-90% | Basic upload & compliance testing |
| `compliant-sample.pdf` | ~2KB | 2024 Highlander brochure | Fully compliant | 95-100% | Testing compliant documents |
| `another-sample.pdf` | ~2KB | 2024 Corolla brochure | Mostly compliant | 85-95% | Multiple upload testing |

**Features in valid PDFs:**
- Proper PDF structure (PDF 1.4 format)
- Readable text content
- Marketing information with specs
- Pricing and financing offers
- Legal disclaimers

### ❌ Invalid/Test PDF Files

| File | Type | Purpose | Expected Behavior |
|------|------|---------|------------------|
| `non-compliant-sample.pdf` | Valid PDF | Testing violation detection | Should fail (40-60% score) |
| `corrupted.pdf` | Invalid | Error handling | Should reject with error |

**Violations in non-compliant PDF:**
- Superlative claims ("BEST SUV EVER")
- Hyperbolic language ("AMAZING", "INCREDIBLE")
- Missing legal disclosures
- Incomplete product specifications
- Inadequate disclaimers

## Text Reference Files

| File | Purpose |
|------|---------|
| `sample-brochure-content.txt` | Source content for sample-brochure.pdf |
| `compliant-sample.txt` | Fully compliant example with annotations |
| `non-compliant-sample.txt` | Non-compliant example with violation explanations |
| `invalid-file.txt` | For testing file type validation |

## Image Test Files (SVG Format)

### Logo Files

| File | Description | Use Case |
|------|-------------|----------|
| `toyota-logo.svg` | Simplified Toyota logo | Logo detection testing |

**Logo Features:**
- Toyota red (#EB0A1E)
- Three interlocking ovals design
- TOYOTA text below
- Clean, scalable vector format

### Color Test Files

| File | Colors Used | Compliance | Purpose |
|------|-------------|------------|---------|
| `brand-colors.svg` | Toyota Red (#EB0A1E), Black (#000000), Silver (#C0C0C0), White (#FFFFFF) | ✅ Compliant | Testing brand color compliance |
| `off-brand-colors.svg` | Wrong Red (#FF0000), Purple (#800080), Green (#00AA00), Blue (#0000FF) | ❌ Non-compliant | Testing color violation detection |

### Vehicle Images

| File | Description | Use Case |
|------|-------------|----------|
| `camry-photo.svg` | 2024 Camry side view illustration | General image analysis |

## Test Data Characteristics

### PDF Documents

**Sample Brochure (Camry):**
- Model: 2024 Toyota Camry
- Specifications: 2.5L, 203 HP, 28/39 MPG
- Pricing: $26,420 - $31,280 MSRP
- Lease: $299/month, 36 months
- Has: Most required disclosures
- Missing: Some detailed legal language

**Compliant Sample (Highlander):**
- Model: 2024 Toyota Highlander
- Specifications: 2.4L Turbo or 3.5L V6
- Complete EPA estimates
- Full warranty details
- Comprehensive lease disclosure
- All required legal statements
- Equal Opportunity Lender statement

**Non-Compliant Sample (RAV4):**
- Intentional violations:
  - 4 brand violations
  - 8 legal violations
  - 7 PIT violations
- No proper specifications
- Missing disclosures
- Hyperbolic marketing language

### Image Specifications

**Toyota Brand Colors (Official):**
- **Red**: PMS 485C / #EB0A1E / RGB(235, 10, 30)
- **Black**: PMS Process Black / #000000 / RGB(0, 0, 0)
- **Silver**: PMS 877C / #C0C0C0 / RGB(192, 192, 192)
- **White**: Pure White / #FFFFFF / RGB(255, 255, 255)

## Usage in Tests

### Unit Tests
```typescript
// tests/unit/backend-functions.test.ts
const testPdfPath = join(__dirname, '../fixtures/sample-brochure.pdf');
```

### Integration Tests
```typescript
// tests/integration/agent-workflow.test.ts
const testPdfBuffer = readFileSync(join(__dirname, '../fixtures/sample-brochure.pdf'));
```

### E2E Tests
```typescript
// tests/e2e/upload-workflow.test.ts
const testPdfPath = join(__dirname, '../fixtures/sample-brochure.pdf');
await fileInput.setInputFiles(testPdfPath);
```

## Creating Additional Fixtures

### Converting SVG to JPG/PNG

For tests requiring raster images:

```bash
# Using ImageMagick
convert toyota-logo.svg -density 300 toyota-logo.jpg
convert brand-colors.svg -density 300 brand-colors.jpg
convert camry-photo.svg -density 300 camry-photo.jpg

# Low resolution version
convert toyota-logo.svg -density 72 toyota-logo-low-res.jpg

# Blurred version
convert camry-photo.jpg -blur 0x8 blurry-image.jpg
```

### Creating Large PDF

```bash
# Concatenate multiple PDFs to create large file
pdftk sample-brochure.pdf sample-brochure.pdf sample-brochure.pdf \
  cat output temp.pdf
# Repeat until > 10MB
```

### Creating High-Resolution PDFs

For production-quality testing, use tools like:
- Adobe InDesign
- Microsoft Publisher
- Canva (with Toyota brand assets)
- Figma (export to PDF)

## Expected Test Results

| File | Upload | Parse | Compliance Score | Violations | Warnings |
|------|--------|-------|-----------------|------------|----------|
| sample-brochure.pdf | ✅ | ✅ | 85% | 0-2 | 2-4 |
| compliant-sample.pdf | ✅ | ✅ | 98% | 0 | 0-1 |
| non-compliant-sample.pdf | ✅ | ✅ | 45% | 8-12 | 3-5 |
| another-sample.pdf | ✅ | ✅ | 88% | 0-1 | 2-3 |
| corrupted.pdf | ✅ | ❌ | N/A | N/A | N/A |
| invalid-file.txt | ❌ | N/A | N/A | N/A | N/A |

## Notes

- **SVG files** are provided for easy editing and version control
- Convert to JPG/PNG when raster format is needed
- **PDF files** are minimal but valid for testing
- For realistic testing, use actual Toyota marketing materials (with permission)
- All content is mock data for testing purposes only
- Do not use these files for actual Toyota marketing

## Maintenance

- Update content when compliance rules change
- Add new fixtures for edge cases
- Keep file sizes reasonable (<5MB except large-file.pdf)
- Document expected compliance scores

---

**Created**: 2025-10-23
**Last Updated**: 2025-10-23
**Version**: 1.0.0
