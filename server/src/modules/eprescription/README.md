# E-Prescription Module with PDF Generation

This module handles electronic prescriptions with automatic PDF generation and S3 storage.

## Features

- Create e-prescriptions with automatic PDF generation
- Store PDFs in Amazon S3
- Regenerate PDFs for existing prescriptions
- Professional PDF layout with Preva Care branding

## API Endpoints

### Create E-Prescription
```
POST /api/eprescription/create
```
- Automatically generates PDF and uploads to S3
- Returns prescription data with PDF link

### Regenerate PDF
```
POST /api/eprescription/:id/regenerate-pdf
```
- Regenerates PDF for existing prescription
- Updates S3 link in database
- Returns new PDF link

## PDF Generation

The PDF generation uses Puppeteer to create professional-looking prescription documents with:

- Patient information
- Doctor details
- Vital signs
- Symptoms
- Diagnosis
- Medications
- Lab tests
- Medical advice
- Follow-up schedule

## Environment Variables Required

```env
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=your_region
AWS_S3_BUCKET=your_bucket_name
```

## File Structure

```
eprescription/
├── controllers/
│   ├── eprescription.controller.ts
│   └── index.ts
├── models/
│   └── eprescription.model.ts
├── routes/
│   └── eprescription.route.ts
├── services/
│   ├── eprescription.service.ts
│   └── pdf.service.ts
└── README.md
```

## Dependencies

- puppeteer: PDF generation
- dayjs: Date formatting
- @aws-sdk/client-s3: S3 upload
- multer-s3: File upload handling

## Usage Example

```typescript
// Create prescription (PDF generated automatically)
const prescription = await eprescriptionService.createEPrescription({
  patient: { name: 'John Doe', age: 35, gender: 'M' },
  doctor: { firstName: 'Dr. Jane', lastName: 'Smith' },
  // ... other prescription data
});

// Regenerate PDF for existing prescription
const pdfLink = await eprescriptionService.regeneratePrescriptionPDF(prescriptionId);
```

## Error Handling

- PDF generation errors are logged but don't prevent prescription creation
- S3 upload failures are handled gracefully
- Temporary files are cleaned up automatically 
