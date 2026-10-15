#!/usr/bin/env bash
set -e

# ==============================================================================
# PlaySlay / PadelSlay • Google Cloud Run One-Click Deployment Script
# ==============================================================================

SERVICE_NAME="padelslay"
REGION="${GCP_REGION:-europe-west1}"

echo "========================================================"
echo "🚀 Deploying PadelSlay to Google Cloud Run"
echo "Service Name: $SERVICE_NAME"
echo "Region:       $REGION"
echo "========================================================"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Error: 'gcloud' CLI is not found in your PATH."
    echo "Please install the Google Cloud SDK: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
    echo "⚠️ No active GCP project set."
    read -p "Enter your Google Cloud Project ID: " PROJECT_ID
    gcloud config set project "$PROJECT_ID"
fi

echo "📦 Project ID: $PROJECT_ID"
echo "🔧 Deploying from source with Cloud Build..."

# Deploy directly from source to Cloud Run
gcloud run deploy "$SERVICE_NAME" \
    --source . \
    --platform managed \
    --region "$REGION" \
    --allow-unauthenticated \
    --port 8080

echo ""
echo "========================================================"
echo "🎉 Deployment Complete!"
echo "Your live PlaySlay service URL is shown above."
echo "========================================================"
