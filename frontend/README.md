# Forensic DD Engine — Frontend (Next.js 14)

Production-grade Bloomberg Terminal-style financial audit dashboard built with **Next.js 14 (App Router)**, **Tailwind CSS**, **Recharts**, and **Framer Motion**.

---

## Features
- **Bloomberg Terminal Aesthetic**: Dark `#0a0e1a` shell, JetBrains Mono font, CRT scanline overlay, glowing green/amber/red status indicators.
- **Dynamic Ticker Search**: Live auto-querying SEC EDGAR filings for MSFT, NVDA, AAPL, etc.
- **Fraud Scorecard**: Animated Recharts `RadialBarChart` dials with quantitative risk zones (Beneish M-Score, Sloan Accruals, Altman Z-Score).
- **Adversarial Committee Arena**: Side-by-side Bull vs. Bear debate layout with Fact-Checker badge validation.
- **Source Inspector Drawer**: Clickable citation chips open the raw 10-K disclosure snippet with verified `char_span` highlighted in yellow.
- **Human Review Queue**: Live dashboard monitoring and resolving low-confidence extractions.

---

## Local Development Setup

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.local.example .env.local
   ```
   Ensure `NEXT_PUBLIC_API_URL` points to your running FastAPI backend (defaults to `http://localhost:8000`).

3. **Run local development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Deploying to Vercel

1. **Push your repository to GitHub / GitLab**.
2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Select your repository and configure the build settings:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `frontend`
   - **Build Command**: `next build`
   - **Output Directory**: `.next`
4. **Environment Variables**:
   Add the following environment variable in the Vercel dashboard:
   - `NEXT_PUBLIC_API_URL`: Your deployed FastAPI backend URL (e.g., `https://forensic-api.up.railway.app` or `https://forensic-api.onrender.com`).
5. Click **Deploy**. Vercel will build and assign a global CDN URL (e.g., `https://forensic-dd-engine.vercel.app`).
6. **Important CORS Note**: Make sure to add your Vercel URL to the backend's `CORS_ORIGINS` environment variable so requests are not blocked by browser CORS policy.
