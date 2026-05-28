# Breathe ESG — React Frontend

## Stack
- React 19 + Vite
- React Router v7 — client-side routing
- Axios — API client with JWT interceptors
- react-dropzone — drag-and-drop file uploads
- recharts — emissions charts on the dashboard

---

## Pages

| Route    | Page              | Description                                         |
|----------|-------------------|-----------------------------------------------------|
| /login   | Login             | JWT auth against Django /api/auth/token/            |
| /        | Overview          | Emissions stats + recent ingestion jobs             |
| /upload  | Data Ingestion    | Upload SAP / Utility / Travel files                 |
| /review  | Review Dashboard  | Approve or reject normalized emission records       |

---

## Setup

```bash
npm install
cp .env.example .env   # set VITE_API_URL if needed
npm run dev            # starts on http://localhost:3000
```

The dev server proxies /api/* to http://localhost:8000 automatically (vite.config.js), so no CORS issues during development.

---

## Django API contract

### Auth
- POST /api/auth/token/        body: { email, password } => { access, refresh, user }
- POST /api/auth/token/refresh/ body: { refresh } => { access }

### Ingestion
- POST /api/ingestion/upload/  multipart: file + source_type (sap|utility|travel) => { job_id }
- GET  /api/ingestion/jobs/

### Emission Records
- GET  /api/emissions/records/  params: status, source_type, scope, page, page_size
- POST /api/emissions/records/:id/approve/
- POST /api/emissions/records/:id/reject/      body: { reason }
- POST /api/emissions/records/bulk_approve/    body: { ids }
- POST /api/emissions/records/bulk_reject/     body: { ids, reason }

### Dashboard
- GET /api/dashboard/stats/

### Record shape
```json
{
  "id": 1,
  "source_type": "sap",
  "scope": 1,
  "activity_description": "Diesel -- Plant DE01",
  "facility": "DE01",
  "raw_value": 1200,
  "raw_unit": "L",
  "co2e_kg": 3192.0,
  "period_start": "2024-01-01",
  "period_end": "2024-01-31",
  "status": "pending",
  "flags": ["unit_conversion_assumed"]
}
```

---

## Deployment

Build static files:
```bash
VITE_API_URL=https://your-django-app.onrender.com/api npm run build
```
Serve the dist/ folder as a static site on Render, Railway, Vercel, or Fly.
