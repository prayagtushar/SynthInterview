#!/bin/bash
# GCP Deployment Script for SynthInterview

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}Starting GCP Deployment Readiness...${NC}"

# Verification
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Error: gcloud CLI is not installed.${NC}"
    exit 1
fi

PROJECT_ID=$(gcloud config get-value project)
if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" == "(unset)" ]; then
    echo -e "${RED}Error: No GCP project selected.${NC}"
    exit 1
fi

echo -e "${GREEN}Project ID: $PROJECT_ID${NC}"

REGION="asia-south1"
REPO="synth-interview"

# Artifact Registry
if ! gcloud artifacts repositories describe $REPO --location=$REGION &> /dev/null; then
    echo -e "Creating repository $REPO..."
    gcloud artifacts repositories create $REPO --repository-format=docker --location=$REGION
fi

# Secret Manager Sync (API vars)
ENV_FILE="apps/api/.env"
if [ -f "$ENV_FILE" ]; then
    # RECRUITER_EMAIL is handled as a secret to maintain consistency with Cloud Run's existing state
    SECRETS=("GEMINI_API_KEY" "FIREBASE_SERVICE_ACCOUNT_JSON" "GCS_BUCKET_NAME" "RECRUITER_EMAIL" "SMTP_HOST" "SMTP_PORT" "SMTP_USER" "SMTP_PASS" "EMAIL_FROM")
    for s in "${SECRETS[@]}"; do
        VALUE=$(grep "^$s=" "$ENV_FILE" | cut -d'=' -f2-)
        if [ ! -z "$VALUE" ]; then
            if ! gcloud secrets describe "$s" &> /dev/null; then
                echo -e "Creating secret $s..."
                echo -n "$VALUE" | gcloud secrets create "$s" --data-file=-
            else
                echo -e "Secret $s exists."
            fi
        fi
    done
fi

# Build Subscriptions (extract all from .env)
WEB_ENV="apps/web/.env"
API_ENV="apps/api/.env"

if [ ! -f "$WEB_ENV" ] || [ ! -f "$API_ENV" ]; then
    echo -e "${RED}Error: apps/web/.env or apps/api/.env not found. Run setup first.${NC}"
    exit 1
fi

# Function to extract value from env
get_val() {
    grep "^$1=" "$2" | cut -d'=' -f2-
}

_NEXT_PUBLIC_API_URL=$(get_val "NEXT_PUBLIC_API_URL" "$WEB_ENV")
_NEXT_PUBLIC_FIREBASE_API_KEY=$(get_val "NEXT_PUBLIC_FIREBASE_API_KEY" "$WEB_ENV")
_NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$(get_val "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN" "$WEB_ENV")
_NEXT_PUBLIC_FIREBASE_PROJECT_ID=$(get_val "NEXT_PUBLIC_FIREBASE_PROJECT_ID" "$WEB_ENV")
_NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$(get_val "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET" "$WEB_ENV")
_NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$(get_val "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID" "$WEB_ENV")
_NEXT_PUBLIC_FIREBASE_APP_ID=$(get_val "NEXT_PUBLIC_FIREBASE_APP_ID" "$WEB_ENV")
_NEXT_PUBLIC_ADMIN_EMAIL=$(get_val "NEXT_PUBLIC_ADMIN_EMAIL" "$WEB_ENV")
_NEXT_PUBLIC_DEMO_CODE=$(get_val "NEXT_PUBLIC_DEMO_CODE" "$WEB_ENV")

_APP_URL=$(get_val "APP_URL" "$API_ENV")

# Execute Build
echo -e "${BLUE}Submitting build to Google Cloud Build...${NC}"
gcloud builds submit --config cloudbuild.yaml \
    --substitutions=_NEXT_PUBLIC_API_URL="$_NEXT_PUBLIC_API_URL",\
_NEXT_PUBLIC_FIREBASE_API_KEY="$_NEXT_PUBLIC_FIREBASE_API_KEY",\
_NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="$_NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",\
_NEXT_PUBLIC_FIREBASE_PROJECT_ID="$_NEXT_PUBLIC_FIREBASE_PROJECT_ID",\
_NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="$_NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",\
_NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="$_NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",\
_NEXT_PUBLIC_FIREBASE_APP_ID="$_NEXT_PUBLIC_FIREBASE_APP_ID",\
_NEXT_PUBLIC_ADMIN_EMAIL="$_NEXT_PUBLIC_ADMIN_EMAIL",\
_NEXT_PUBLIC_DEMO_CODE="$_NEXT_PUBLIC_DEMO_CODE",\
_APP_URL="$_APP_URL"
