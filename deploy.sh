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

# Subscriptions
WEB_ENV="apps/web/.env"
API_ENV="apps/api/.env"

NEXT_PUBLIC_API_URL=$(grep "^NEXT_PUBLIC_API_URL=" "$WEB_ENV" | cut -d'=' -f2-)
APP_URL=$(grep "^APP_URL=" "$API_ENV" | cut -d'=' -f2-)

# Execute Build
echo -e "${BLUE}Submitting build to Google Cloud Build...${NC}"
gcloud builds submit --config cloudbuild.yaml \
    --substitutions=_NEXT_PUBLIC_API_URL="$NEXT_PUBLIC_API_URL",_APP_URL="$APP_URL"
