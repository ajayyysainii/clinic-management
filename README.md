# Clinic Management System

A full-stack clinic management platform for handling patient records, appointments, and e-prescriptions, with automatic prescription PDF generation and cloud storage support.

## Tech Stack

- **Frontend:** React + Vite (JavaScript/TypeScript)
- **Backend:** Node.js + TypeScript
- **Storage/Infra:** AWS S3 (for e-prescription PDFs)

## Repository Structure

```text
clinic-management/
├── client/                      # Frontend (React + Vite)
├── server/                      # Backend API and business logic
│   └── src/modules/eprescription/
│       ├── controllers/         # E-prescription controllers
│       ├── models/              # E-prescription data models
│       ├── routes/              # E-prescription route definitions
│       ├── services/            # Core logic + PDF generation
│       └── README.md            # Module-specific docs
└── README.md                    # Project overview
```

## Key Features

- Manage clinic workflows (patients, consultations, prescriptions)
- E-prescription creation API
- Automatic PDF generation for prescriptions
- Store generated PDFs in Amazon S3
- Regenerate PDF for existing prescriptions

## E-Prescription API (from module docs)

### Create E-Prescription
`POST /api/eprescription/create`

- Creates prescription
- Generates PDF automatically
- Uploads PDF to S3
- Returns prescription + PDF link

### Regenerate Prescription PDF
`POST /api/eprescription/:id/regenerate-pdf`

- Regenerates PDF for an existing prescription
- Updates stored S3 link
- Returns updated PDF link

## Environment Variables

Add the following variables to your backend environment:

```env
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=your_region
AWS_S3_BUCKET=your_bucket_name
```

## Getting Started

### 1) Clone the repository

```bash
git clone https://github.com/ajayyysainii/clinic-management.git
cd clinic-management
```

### 2) Setup frontend

```bash
cd client
npm install
npm run dev
```

### 3) Setup backend

```bash
cd ../server
npm install
# add .env file with required variables
npm run dev
```

> If your backend scripts are different (`start`, `build`, etc.), use the scripts defined in `server/package.json`.

## Notes

- Current root README in the repo is minimal; this version provides a full project overview.
- `client/README.md` appears to be the default Vite template and can be replaced with project-specific frontend docs if needed.
- Consider adding API docs and DB setup instructions in future updates for easier onboarding.

## Future Improvements

- Add authentication/authorization docs
- Add database schema and migration setup
- Add deployment guide (frontend + backend)
- Add API request/response examples
- Add test execution instructions
