# AI Commerce OS

An Indonesian e-commerce management platform with AI-powered features for marketplace aggregation, order management, pricing, and content generation.

## Stack

- **Frontend:** Static HTML/CSS/JS dashboards (Tailwind CSS, served via Express)
- **Backend (Docker):** Node.js/Express API — requires Docker Compose to run the full stack
- **Services (Docker):** PostgreSQL, Redis, Meilisearch, RabbitMQ

## How to run (Replit — frontend only)

The frontend dashboards are served as static files via a lightweight Express server:

```
node server.js
```

This serves `stitch_nexus_ai_commerce_os/index.html` on port 5000.

## Full stack (Docker, external server)

See `MANUAL_AI_COMMERCE_OS.md` for full Docker Compose deployment instructions. Requires:
- `SCRAPER_API_KEY` — ScraperAPI key
- `GEMINI_API_KEY` — Google Gemini API key
- `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `WHATSAPP_NUMBER` — WhatsApp notifications
- `SENDGRID_API_KEY` — Email service

## Project structure

- `stitch_nexus_ai_commerce_os/` — all frontend modules (each subfolder has a `code.html`)
- `stitch_nexus_ai_commerce_os/backend/` — Node.js/Express API source
- `stitch_nexus_ai_commerce_os/docker-compose.yml` — full stack Docker Compose config

## User preferences
