#!/bin/bash
# GCP Deployment Script for SynthInterview

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting GCP Deployment Readiness & Execution...${NC}"

# 1. Verification
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Error: gcloud CLI is not installed or not in PATH.${NC}"
    exit 1
fi

PROJECT_ID=$(gcloud config get-value project)
if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" == "(unset)" ]; then
    echo -e "${RED}Error: No GCP project selected. Run 'gcloud config set project <your-project-id>'${NC}"
    exit 1
fi

echo -e "${GREEN}Project ID detected: $PROJECT_ID${NC}"

# 2. Prerequisites: Artifact Registry
REGION="us-central1"
REPO="synth-interview"

echo -e "${BLUE}Checking Artifact Registry...${NC}"
if ! gcloud artifacts repositories describe $REPO --location=$REGION &> /dev/null; then
    echo -e "Creating repository $REPO in $REGION..."
    gcloud artifacts repositories create $REPO \
        --repository-format=docker \
        --location=$REGION \
        --description="SynthInterview Docker Repository"
else
    echo -e "${GREEN}Repository exists.${NC}"
fi

# 3. Prerequisites: Secret Manager (Optional Sync)
# This part scans apps/api/.env and creates secrets if they don't exist.
echo -e "${BLUE}Checking Secret Manager...${NC}"
ENV_FILE="apps/api/.env"

if [ -f "$ENV_FILE" ]; then
    # List of secrets mentioned in cloudbuild.yaml
    SECRETS=("GEMINI_API_KEY" "FIREBASE_SERVICE_ACCOUNT_JSON" "GCS_BUCKET_NAME" "ELEVENLABS_API_KEY" "REDIS_URL" "SMTP_PASS")
    
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
else
    echo -e "${RED}Warning: apps/api/.env not found, skipping secret sync.${NC}"
fi

# 4. Substitution Variables for Cloud Build
# Extracting values for substitutions
NEXT_PUBLIC_API_URL=$(grep "^NEXT_PUBLIC_API_URL=" .env | cut -d'=' -f2-)
APP_URL=$(grep "^APP_URL=" apps/api/.env | cut -d'=' -f2-)

# 5. Execute Build
echo -e "${BLUE}Submitting build to Google Cloud Build...${NC}"
gcloud builds submit --config cloudbuild.yaml \
    --substitutions=_NEXT_PUBLIC_API_URL="$NEXT_PUBLIC_API_URL",_APP_URL="$APP_URL"

echo -e "${GREEN}Deployment submitted! Monitor progress in the GCP Console.${NC}"
