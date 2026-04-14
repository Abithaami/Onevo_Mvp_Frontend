# Onevo Frontend

React version of the Onevo authentication design.

## API boundaries

- **Do not call** `POST /api/webhooks/cloudinary` from this app. That route is for **Cloudinary → backend** signed webhooks only (server-to-server). The browser never holds the API secret required for valid signatures.
- Frontend features depend on normal authenticated APIs and on Cloudinary-backed flows **indirectly** (e.g. image URLs from other endpoints), not on the webhook route itself.

Backend details: `Onevo_Mvp_backend/docs/cloudinary-webhook.md`.

## Run

```bash
npm install
npm run dev
```

