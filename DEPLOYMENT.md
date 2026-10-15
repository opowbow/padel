# Deploying PlaySlay to Google Cloud Run 🚀

This repository is pre-configured with a production-ready, multi-stage **Dockerfile** and **Nginx** configuration tailored for **Google Cloud Run**.

---

## ⚡ Quick Deploy (One Command)

If you have the [Google Cloud CLI (`gcloud`)](https://cloud.google.com/sdk/docs/install) installed and authenticated:

```bash
./deploy-cloudrun.sh
```

Or run the `gcloud` command directly from the `padel` directory:

```bash
gcloud run deploy playslay \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080
```

### What this command does:
1. Packages your repository code (respecting `.dockerignore`).
2. Triggers Google Cloud Build to execute the multi-stage `Dockerfile`.
3. Compiles the Vite React TypeScript application into optimized static assets.
4. Spins up a high-performance, lightweight Alpine Nginx container.
5. Deploys the service to Cloud Run on port 8080 with an automatically generated, public HTTPS URL (e.g. `https://playslay-xxxx-uc.a.run.app`).

---

## 🛠️ Step-by-Step Initial Setup (First Time Users)

### 1. Authenticate with Google Cloud
```bash
gcloud auth login
```

### 2. Set Your Target Project
```bash
gcloud config set project YOUR_PROJECT_ID
```
*(Replace `YOUR_PROJECT_ID` with your actual GCP Project ID)*

### 3. Enable Required Google Cloud APIs
```bash
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com
```

### 4. Deploy
```bash
gcloud run deploy playslay \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

---

## 🐳 Alternative: Build & Test Locally with Docker

To test the containerized production image locally before pushing to Cloud Run:

```bash
# 1. Build Docker image
docker build -t playslay:latest .

# 2. Run container locally on port 8080
docker run -p 8080:8080 playslay:latest
```

Open your browser at `http://localhost:8080` to verify the production build.

---

## ⚙️ Container Configuration Details

- **Port**: Configured to listen on port `8080` as required by Cloud Run.
- **SPA Fallback**: `nginx.conf` routes all URLs to `/index.html` (`try_files $uri $uri/ /index.html;`) so that client-side state and tabs load smoothly without 404s.
- **Caching**: Static JS, CSS, and images have automatic cache-control headers (`max-age=15552000`) for blazing-fast edge performance.
- **Gzip**: Automatic gzip compression enabled for JSON, JavaScript, CSS, and SVG assets.
