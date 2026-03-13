# Deploying SynthInterview to Google Cloud Platform (GCP)

This guide walks you through deploying the SynthInterview application (Frontend + Backend) to a single Compute Engine Virtual Machine (VM) on GCP, configuring your domain (`prayagtushar.xyz`), setting up Nginx, and securing it with SSL.

## Overview of Architecture

- **GCP Compute Engine (Ubuntu VM)**: Hosts both the Next.js frontend and FastAPI backend.
- **Frontend (Port 3000)**: Served by Next.js (`synth.prayagtushar.xyz`).
- **Backend (Port 8000)**: Served by FastAPI with WebSockets (`api.synth.prayagtushar.xyz`).
- **Nginx**: Acts as a Reverse Proxy to route traffic to the correct ports.
- **Certbot/Let's Encrypt**: Provides free SSL certificates for secure HTTPS/WSS communication.

---

## Step 1: Provision a GCP Compute Engine VM

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Navigate to **Compute Engine > VM instances** and click **Create Instance**.
3. **Configuration**:
   - **Name**: `synth-interview-prod`
   - **Region**: Choose the one closest to you (e.g., `us-central1` or `asia-south1`).
   - **Machine type**: `e2-medium` (2 vCPU, 4GB RAM) is recommended as a baseline for running both Node.js and Python processes.
   - **Boot disk**: Update to **Ubuntu 22.04 LTS**. Set size to at least 20-30GB.
   - **Firewall**: Check **Allow HTTP traffic** and **Allow HTTPS traffic**.
4. Click **Create**.
5. Once running, copy the **External IP** address of your new VM.

---

## Step 2: Configure Domain DNS

Before accessing the VM, point your subdomains to the VM's External IP. Go to the DNS settings for `prayagtushar.xyz` (e.g., GoDaddy, Namecheap, Cloudflare) and add two **A Records**:

1. **Type**: `A`, **Name**: `synth`, **Point to**: `[YOUR_VM_EXTERNAL_IP]`
2. **Type**: `A`, **Name**: `api.synth`, **Point to**: `[YOUR_VM_EXTERNAL_IP]`

_(Note: DNS propagation usually takes a few minutes, but can sometimes take longer)._

---

## Step 3: Server Setup & Dependencies

SSH into your GCP VM (you can click the "SSH" button in the GCP console) and install the required tools.

```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Python 3.11/3.12 & pip
sudo apt install -y python3-pip python3-venv

# Install Node.js & npm (Using NodeSource for Node 20.x)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Bun
curl -fsSL https://bun.sh/install | bash

# Install Nginx and Certbot
sudo apt install -y nginx certbot python3-certbot-nginx

# Install Process Manager (PM2) to keep apps running in background
sudo npm install -g pm2
```

---

## Step 4: Clone & Configure the Project

```bash
# Clone your repository (use HTTPS or setup SSH keys on the VM)
git clone https://github.com/yourusername/synth-interview.git
cd synth-interview

# Install dependencies for both apps using Bun
bun install
```

### Environment Variables

You need to set up your `.env` files for production.

**Frontend (`apps/web/.env`)**

```env
NEXT_PUBLIC_API_URL=https://api.synth.prayagtushar.xyz
```

_(Notice we are using `https` because we will configure SSL shortly)._

**Backend (`apps/api/.env`)**
Create the `.env` file and transfer over your `FIREBASE_SERVICE_ACCOUNT_JSON`, `GEMINI_API_KEY`, etc.

---

## Step 5: Build and Run the Applications

### Backend (FastAPI)

```bash
cd apps/api
# Create a virtual environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Start with PM2 using Uvicorn
pm2 start "uvicorn app.main:app --host 0.0.0.0 --port 8000" --name "synth-api"
```

### Frontend (Next.js)

```bash
cd ../../apps/web

# Build the production app
bun run build

# Start with PM2
pm2 start "bun run start" --name "synth-web"
```

Save the PM2 processes so they auto-restart on server reboot:

```bash
pm2 save
pm2 startup
# (Run the command PM2 spits out at the bottom)
```

---

## Step 6: Configure Nginx

Copy the provided Nginx configuration to the server.

```bash
# Create the Nginx config file
sudo nano /etc/nginx/sites-available/synthinterview

# -> Paste the contents of deploy/nginx.conf into this file, then save (Ctrl+O, Enter, Ctrl+X).

# Enable the site
sudo ln -s /etc/nginx/sites-available/synthinterview /etc/nginx/sites-enabled/

# Remove default nginx config to avoid conflicts
sudo rm /etc/nginx/sites-enabled/default

# Test config for errors
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

## Step 7: Secure with SSL (Crucial)

Since SynthInterview uses WebSockets and requires Microphone/Camera permissions, **browsers strictly require HTTPS**.

Run Certbot to automatically fetch SSL certificates and configure Nginx:

```bash
sudo certbot --nginx -d synth.prayagtushar.xyz -d api.synth.prayagtushar.xyz
```

It will ask for your email address and agree to terms. When it's done, it will automatically update your Nginx configuration to handle port `443` (HTTPS) and gracefully redirect port `80` (HTTP).

## Verification

1. Go to `https://synth.prayagtushar.xyz` in your browser. You should see your landing page.
2. Go to `https://api.synth.prayagtushar.xyz/docs`. You should see the FastAPI Swagger documentation.
3. Start an interview; WebSockets and API calls should now route securely via WSS and HTTPS.
