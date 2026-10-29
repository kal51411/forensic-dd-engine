# Forensic DD Engine — Backend Cloud Deployment Guide

This guide details how to build and deploy the **FastAPI Backend** using Docker to platforms like **Railway**, **Render**, or any cloud VM.

---

## 1. Local Testing with Docker Compose

Run the entire stack (FastAPI server + Neo4j Community instance) locally:

```bash
# 1. Create your local .env file
cp .env.example .env

# 2. Build and start containers
docker compose up --build -d

# 3. Verify health status
docker compose ps
curl http://localhost:8000/health
```

The server exposes:
- **FastAPI API & Docs**: `http://localhost:8000/docs`
- **Neo4j Browser**: `http://localhost:7474`

---

## 2. Deploying to Railway

Railway natively detects the `Dockerfile` in the root repository.

### Steps:
1. Log in to [Railway](https://railway.app) and create a **New Project**.
2. Select **Deploy from GitHub repo** and choose your repository.
3. Add a **Neo4j** database plugin (or deploy your own Neo4j container from Docker image `neo4j:5.15-community`).
4. Under the FastAPI service settings:
   - **Build Command**: Leave blank (uses Dockerfile).
   - **Healthcheck Path**: `/health`.
5. Set Environment Variables in Railway Dashboard:
   ```env
   CORS_ORIGINS=https://your-frontend-app.vercel.app,http://localhost:3000
   SEC_USER_AGENT=ForensicResearch audit@forensicresearch.org
   NEO4J_URI=bolt://neo4j.railway.internal:7687
   NEO4J_USER=neo4j
   NEO4J_PASSWORD=your_secure_password
   ```
6. Generate a public domain under **Networking** (e.g., `https://forensic-api.up.railway.app`).
7. Copy this URL and set it as `NEXT_PUBLIC_API_URL` on Vercel for your Next.js frontend.

---

## 3. Deploying to Render

Render supports Docker web services with zero code changes:

### Steps:
1. Log in to [Render](https://render.com) and click **New + > Web Service**.
2. Connect your GitHub repository.
3. Configure the service:
   - **Runtime**: `Docker`
   - **Region**: Closest to your users (e.g., Oregon or Frankfurt)
   - **Instance Type**: Free or Starter
   - **Health Check Path**: `/health`
4. In the **Environment Variables** tab, define:
   - `CORS_ORIGINS`: `https://your-frontend-app.vercel.app`
   - `SEC_USER_AGENT`: `ForensicResearch audit@forensicresearch.org`
5. Click **Create Web Service**. Render builds the image using the multi-stage `Dockerfile`.

---

## 4. SEC EDGAR Rate Limit Compliance

The engine enforces a strict **token-bucket rate limiter** (`<= 10 requests/second`) in `ingest/edgar_client.py` and caches responses locally at `.cache/edgar`. When deploying to production:
- Ensure persistent disk storage is mounted for `.cache/edgar` if you want cache persistence across container redeploys.
- Always provide a realistic, identifiable `SEC_USER_AGENT` string adhering to SEC guidelines.
