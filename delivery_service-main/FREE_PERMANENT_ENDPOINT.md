# 🆓 Libreng Permanent Endpoint para sa Gloria Food API

Mayroon kang **ilang options** para magkaroon ng **LIBRENG permanent endpoint** na hindi na nagbabago ang URL:

## 📋 Options Overview (Lahat LIBRE)

1. **Railway.app** ⭐ RECOMMENDED - FREE tier, permanent URL, walang domain kailangan
2. **Render.com** - FREE tier, permanent URL, walang domain kailangan  
3. **Fly.io** - FREE tier, permanent URL
4. **Cloudflare Tunnel + Free Subdomain** - Libre kung may free subdomain service
5. **Vercel/Netlify** - Para sa serverless functions (may limitations)

---

## 🚀 Option 1: Railway.app (PINAKA RECOMMENDED - 100% FREE)

**Pros:**
- ✅ 100% FREE (may $5 credit monthly)
- ✅ Permanent URL (hindi nagbabago)
- ✅ Auto-deploy mula sa GitHub
- ✅ Walang domain kailangan
- ✅ Easy setup

**Cons:**
- ⚠️ May sleep time pag walang activity (pero auto-wake naman)

### Setup Steps:

#### 1. Sign up sa Railway
- Pumunta sa: https://railway.app
- Sign up gamit ang GitHub account (FREE)

#### 2. Create New Project
- Click "New Project"
- Piliin "Deploy from GitHub repo"
- O kung wala pa, piliin "Empty Project"

#### 3. Setup Environment Variables
Sa Railway dashboard, pumunta sa Variables tab at i-add:
```
GLORIAFOOD_API_KEY=your_api_key
GLORIAFOOD_STORE_ID=your_store_id
WEBHOOK_PORT=3000
WEBHOOK_PATH=/webhook
DATABASE_PATH=./orders.db
```

#### 4. Deploy Options

**Option A: Deploy from GitHub (Recommended)**
1. Push ang code mo sa GitHub
2. Sa Railway, click "New Project" → "Deploy from GitHub repo"
3. Piliin ang repository mo
4. Railway auto-detect ng Node.js at mag-deploy

**Option B: Deploy from Local (Quick Setup)**
1. Install Railway CLI:
   ```powershell
   npm install -g @railway/cli
   ```
2. Login:
   ```powershell
   railway login
   ```
3. Initialize at deploy:
   ```powershell
   railway init
   railway up
   ```

#### 5. Get Permanent URL
- Pagkatapos ng deploy, Railway magbibigay ng URL tulad ng:
  - `https://your-project-name.up.railway.app`
- **Ito ang permanent URL mo!** Hindi na magbabago.

#### 6. Update Gloria Food
- **Webhook URL:** `https://your-project-name.up.railway.app/webhook`
- Protocol: JSON
- Protocol Version: v2

#### 7. Update package.json para sa Railway
Dagdag sa `package.json`:
```json
{
  "scripts": {
    "start": "node dist/webhook-mode.js",
    "build": "tsc"
  },
  "engines": {
    "node": "18.x"
  }
}
```

#### 8. Create railway.json (Optional)
Create `railway.json`:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm run build && npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

---

## 🌐 Option 2: Render.com (FREE - Permanent URL)

**Pros:**
- ✅ 100% FREE tier
- ✅ Permanent URL
- ✅ Auto-deploy from GitHub
- ✅ Walang domain kailangan

**Cons:**
- ⚠️ Sleeps after 15 minutes ng inactivity (pero auto-wake)

### Setup Steps:

#### 1. Sign up sa Render
- Pumunta sa: https://render.com
- Sign up (FREE)

#### 2. Create New Web Service
- Click "New +" → "Web Service"
- Connect GitHub repository
- O kung wala, piliin "Public Git repository"

#### 3. Configure Service
- **Name:** gloriafood-webhook (o kahit ano)
- **Environment:** Node
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`

#### 4. Environment Variables
Add sa Environment tab:
```
GLORIAFOOD_API_KEY=your_api_key
GLORIAFOOD_STORE_ID=your_store_id
WEBHOOK_PORT=10000
WEBHOOK_PATH=/webhook
NODE_ENV=production
```

**Note:** Render uses port 10000, kaya kailangan i-update ang code o environment variable.

#### 5. Get Permanent URL
- Render magbibigay ng URL: `https://gloriafood-webhook.onrender.com`
- **Ito ang permanent URL mo!**

#### 6. Update Gloria Food
- **Webhook URL:** `https://gloriafood-webhook.onrender.com/webhook`

---

## ✈️ Option 3: Fly.io (FREE - Permanent URL)

**Pros:**
- ✅ FREE tier (3 shared-cpu VMs)
- ✅ Permanent URL
- ✅ Walang domain kailangan
- ✅ Hindi natutulog (always on)

**Cons:**
- ⚠️ Mas complex ang setup

### Setup Steps:

#### 1. Install Fly CLI
```powershell
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
```

#### 2. Sign up at Login
```powershell
fly auth signup
# O kung may account na:
fly auth login
```

#### 3. Initialize Fly App
```powershell
cd delivery_service-main
fly launch
```

#### 4. Create fly.toml
Create `fly.toml`:
```toml
app = "gloriafood-webhook"
primary_region = "iad"

[build]
  builder = "paketobuildpacks/builder:base"

[env]
  PORT = "3000"
  NODE_ENV = "production"

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = false
  auto_start_machines = true
  min_machines_running = 1
  processes = ["app"]

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 256
```

#### 5. Set Secrets (Environment Variables)
```powershell
fly secrets set GLORIAFOOD_API_KEY=your_api_key
fly secrets set GLORIAFOOD_STORE_ID=your_store_id
fly secrets set WEBHOOK_PORT=3000
fly secrets set WEBHOOK_PATH=/webhook
```

#### 6. Deploy
```powershell
fly deploy
```

#### 7. Get Permanent URL
- Fly magbibigay ng URL: `https://gloriafood-webhook.fly.dev`
- **Ito ang permanent URL mo!**

---

## 🔗 Option 4: Cloudflare Tunnel + Free Subdomain

Kung gusto mo ng Cloudflare Tunnel pero walang domain, puwede kang gumamit ng **free subdomain services**:

### Free Subdomain Services:

1. **DuckDNS** (https://www.duckdns.org) - 100% FREE
   - Sign up → Get subdomain (e.g., `yourname.duckdns.org`)
   - Update DNS records sa Cloudflare
   - Gamitin sa Cloudflare Tunnel

2. **No-IP** (https://www.noip.com) - FREE tier
   - Sign up → Get subdomain
   - May free tier (kailangan i-renew monthly)

3. **Freenom** (https://www.freenom.com) - FREE domains
   - Puwede kang kumuha ng free domain (.tk, .ml, .ga, etc.)
   - Transfer sa Cloudflare
   - Gamitin sa Cloudflare Tunnel

### Setup with DuckDNS:

#### 1. Get DuckDNS Subdomain
1. Sign up sa https://www.duckdns.org
2. Create subdomain (e.g., `gloriafood-webhook`)
3. Get full domain: `gloriafood-webhook.duckdns.org`

#### 2. Setup Cloudflare Tunnel
Follow ang steps sa `CLOUDFLARE_TUNNEL_SETUP.md` pero gamitin ang DuckDNS domain.

#### 3. Update DNS sa DuckDNS
Sa DuckDNS dashboard, i-update ang IP address (kung kailangan).

---

## 📦 Option 5: Vercel/Netlify (Serverless - May Limitations)

**Pros:**
- ✅ 100% FREE
- ✅ Permanent URL
- ✅ Walang domain kailangan

**Cons:**
- ⚠️ Serverless functions lang (may timeout limits)
- ⚠️ Kailangan i-refactor ang code para sa serverless

**Note:** Mas complex ito kasi kailangan i-convert ang Express app sa serverless functions.

---

## 🎯 Recommended Setup (Para sa Production)

**Para sa pinakamadali at reliable:**

1. **Railway.app** - Pinakamadali, permanent URL, auto-deploy
2. **Render.com** - Alternative sa Railway, same features
3. **Fly.io** - Kung gusto mo ng always-on (hindi natutulog)

**Para sa local development:**
- Gamitin ang **ngrok** o **localtunnel** para sa quick testing

---

## 📝 Quick Comparison

| Service | Free Tier | Permanent URL | Always On | Ease of Setup |
|---------|-----------|---------------|-----------|---------------|
| Railway | ✅ Yes | ✅ Yes | ⚠️ Sleeps | ⭐⭐⭐⭐⭐ Easy |
| Render | ✅ Yes | ✅ Yes | ⚠️ Sleeps | ⭐⭐⭐⭐ Easy |
| Fly.io | ✅ Yes | ✅ Yes | ✅ Yes | ⭐⭐⭐ Medium |
| Cloudflare + DuckDNS | ✅ Yes | ✅ Yes | ✅ Yes | ⭐⭐ Complex |
| Vercel/Netlify | ✅ Yes | ✅ Yes | ✅ Yes | ⭐ Complex |

---

## 🚀 Quick Start Guide (Railway - Recommended)

### Step 1: Prepare Code
Siguraduhin na may `package.json` na may:
```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/webhook-mode.js"
  }
}
```

### Step 2: Push to GitHub
```powershell
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/your-repo.git
git push -u origin main
```

### Step 3: Deploy sa Railway
1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub repo"
3. Piliin ang repository mo
4. Add environment variables
5. Wait for deploy
6. Copy ang URL (permanent na ito!)

### Step 4: Update Gloria Food
- **Webhook URL:** `https://your-app.up.railway.app/webhook`

---

## 🐛 Troubleshooting

### Railway/Render: "Application Error"
- Check ang logs sa dashboard
- Siguraduhin na tama ang `start` command
- Check kung naka-build na ang TypeScript (`npm run build`)

### Fly.io: "Deploy Failed"
- Check ang `fly.toml` configuration
- Siguraduhin na tama ang port (3000)
- Check ang logs: `fly logs`

### Cloudflare Tunnel: "Cannot connect"
- Siguraduhin na running ang tunnel: `cloudflared tunnel run gloriafood-webhook`
- Check ang config file
- Verify DNS records

---

## 💡 Tips

1. **Para sa production:** Gamitin ang Railway o Render (pinakamadali)
2. **Para sa always-on:** Gamitin ang Fly.io
3. **Para sa local testing:** Gamitin ang ngrok
4. **Para sa custom domain:** Gamitin ang Cloudflare Tunnel

---

## 📞 Need Help?

Kung may problema:
1. Check ang service logs (Railway/Render/Fly dashboard)
2. Test ang health endpoint: `https://your-url.com/health`
3. Test ang webhook endpoint: `https://your-url.com/webhook` (GET request)
4. Check ang Gloria Food webhook logs

---

## ✅ Checklist

Bago mo i-configure ang Gloria Food:
- [ ] Na-deploy na ang webhook server (Railway/Render/Fly)
- [ ] May permanent URL ka na
- [ ] Na-test mo na ang URL sa browser (dapat may response)
- [ ] Na-test mo na ang `/health` endpoint
- [ ] Environment variables ay naka-set na

Sa Gloria Food Dashboard:
- [ ] Webhook URL ay naka-set na sa permanent URL mo
- [ ] Protocol: JSON
- [ ] Protocol Version: v2
- [ ] Na-test mo na ang webhook (test button o test order)

---

**🎉 Congratulations! May permanent endpoint ka na na 100% FREE!**

