# 🌐 Paano Magkaroon ng Permanent URL Endpoint para sa Gloria Food API

Mayroon kang **3 options** para magkaroon ng permanent URL endpoint:

## 📋 Options Overview

1. **Cloudflare Tunnel (RECOMMENDED)** - FREE, permanent URL, kailangan ng domain
2. **ngrok** - FREE tier available, pero nagbabago ang URL (unless paid)
3. **localtunnel** - FREE, pero nagbabago ang URL

---

## 🎯 Option 1: Cloudflare Tunnel (BEST - Permanent URL)

Para sa **permanent/static URL** na hindi na nagbabago, kailangan mo gumawa ng **Named Tunnel** sa Cloudflare.

### Prerequisites

1. Cloudflare account (FREE - sign up sa https://dash.cloudflare.com/sign-up)
2. Domain name sa Cloudflare (puwede kang bumili ng domain, or gamitin existing domain mo)
   - **Wala kang domain?** Puwede kang bumili ng mura sa:
     - Namecheap (~$10-15/year)
     - Cloudflare Registrar (~$8-10/year)
     - GoDaddy (~$12-15/year)

## Quick Setup Steps

### 1. Install Cloudflared

**Download:**
- Visit: https://github.com/cloudflare/cloudflared/releases/latest
- Download: `cloudflared-windows-amd64.exe`
- Rename to `cloudflared.exe`
- Ilagay sa folder: `C:\cloudflared\`
- Add to PATH environment variable

### 2. Login sa Cloudflare

```powershell
cloudflared tunnel login
```

Magbub-drop ng browser para mag-login. Pumili ng domain.

### 3. Create Named Tunnel

```powershell
cloudflared tunnel create gloriafood-webhook
```

Take note ng Tunnel ID na lalabas.

### 4. Create Config File

Create: `C:\Users\[YourUsername]\.cloudflared\config.yml`

```yaml
tunnel: gloriafood-webhook
credentials-file: C:\Users\[YourUsername]\.cloudflared\[TUNNEL-ID].json

ingress:
  - hostname: webhook.yourdomain.com
    service: http://localhost:3000
  - service: http_status:404
```

**IMPORTANT:** 
- Replace `[YourUsername]` with your actual username
- Replace `[TUNNEL-ID]` with actual Tunnel ID from Step 3
- Replace `webhook.yourdomain.com` with your subdomain (e.g., `webhook.tekmaxllc.com`)

### 5. Create DNS Record

```powershell
cloudflared tunnel route dns gloriafood-webhook webhook.yourdomain.com
```

### 6. Run Tunnel

```powershell
cloudflared tunnel run gloriafood-webhook
```

### 7. (Optional) Run as Windows Service

```powershell
cloudflared service install
Start-Service cloudflared
```

## Update GloriaFood Webhook

- **Endpoint URL:** `https://webhook.yourdomain.com/webhook`
- Protocol: json
- Protocol version: v2
- Iba pang settings: same lang

## Daily Usage

**Manual:**
```powershell
# Terminal 1
cloudflared tunnel run gloriafood-webhook

# Terminal 2
npm run webhook
```

**Auto-start (if service):**
```powershell
Start-Service cloudflared  # One time lang
npm run webhook            # Every time
```

## Troubleshooting

```powershell
cloudflared tunnel list
cloudflared tunnel info gloriafood-webhook
```

---

## 🚀 Option 2: ngrok (Quick Setup - No Domain Needed)

**Pros:** Mabilis i-setup, walang domain kailangan  
**Cons:** URL nagbabago sa free tier (unless paid plan)

### Setup Steps:

1. **Download ngrok:**
   - Visit: https://ngrok.com/download
   - Download para sa Windows
   - Extract at ilagay sa folder (e.g., `C:\ngrok\`)

2. **Sign up at get auth token:**
   - Sign up sa https://dashboard.ngrok.com/signup (FREE)
   - Copy your auth token

3. **Configure ngrok:**
   ```powershell
   ngrok config add-authtoken YOUR_AUTH_TOKEN
   ```

4. **Run ngrok:**
   ```powershell
   ngrok http 3000
   ```

5. **Copy ang URL** (halimbawa: `https://abc123.ngrok-free.app`)

6. **Update Gloria Food:**
   - **Endpoint URL:** `https://abc123.ngrok-free.app/webhook`
   - Protocol: json
   - Protocol version: v2

**Note:** Sa free tier, ang URL ay nagbabago tuwing restart. Para sa permanent URL, kailangan ng paid plan ($8/month).

---

## 🔧 Option 3: localtunnel (FREE Alternative)

**Pros:** FREE, walang signup kailangan  
**Cons:** URL nagbabago tuwing restart

### Setup Steps:

1. **Install localtunnel:**
   ```powershell
   npm install -g localtunnel
   ```

2. **Run localtunnel:**
   ```powershell
   lt --port 3000 --subdomain gloriafood-webhook
   ```

3. **Copy ang URL** (halimbawa: `https://gloriafood-webhook.loca.lt`)

4. **Update Gloria Food:**
   - **Endpoint URL:** `https://gloriafood-webhook.loca.lt/webhook`

**Note:** Ang URL ay nagbabago tuwing restart. Para sa permanent URL, mas maganda ang Cloudflare Tunnel.

---

## 📝 Complete Setup Checklist

### Bago mo i-configure ang Gloria Food:

- [ ] Webhook server ay running (`npm run webhook`)
- [ ] May permanent URL ka na (Cloudflare Tunnel, ngrok, o localtunnel)
- [ ] Na-test mo na ang URL sa browser (dapat may response)

### Sa Gloria Food Dashboard:

1. **Pumunta sa Webhook Settings:**
   - Login sa Gloria Food admin panel
   - Pumunta sa Settings → Integrations → Webhooks

2. **Configure Webhook:**
   - **Webhook URL:** `https://your-domain.com/webhook` (o kung ano man ang URL mo)
   - **Method:** POST
   - **Protocol:** JSON
   - **Protocol Version:** v2
   - **Events:** Piliin ang events na gusto mong i-receive (New Order, Order Status Changed, etc.)

3. **Test ang Webhook:**
   - May test button sa Gloria Food dashboard
   - O puwede mong gumawa ng test order
   - Check ang console ng webhook server mo kung may natanggap na request

---

## 🐛 Common Issues & Solutions

### Issue: "Connection refused" o "Cannot reach webhook"
**Solution:**
- Siguraduhin na running ang webhook server (`npm run webhook`)
- Check kung tama ang port (default: 3000)
- Check kung tama ang URL sa Gloria Food dashboard

### Issue: "Tunnel not running"
**Solution:**
- Para sa Cloudflare: `cloudflared tunnel run gloriafood-webhook`
- Para sa ngrok: `ngrok http 3000`
- Para sa localtunnel: `lt --port 3000`

### Issue: "404 Not Found"
**Solution:**
- Siguraduhin na tama ang path: `/webhook` (hindi `/webhooks` o `/api/webhook`)
- Check ang webhook server logs kung anong path ang tinatanggap

### Issue: "URL nagbabago tuwing restart"
**Solution:**
- Gamitin ang Cloudflare Tunnel (Option 1) para sa permanent URL
- O mag-upgrade sa paid plan ng ngrok

---

## 💡 Recommended Setup

**Para sa Production:**
1. Gamitin ang **Cloudflare Tunnel** (Option 1)
2. I-setup bilang Windows Service para auto-start
3. Gamitin ang domain mo para sa professional URL

**Para sa Development/Testing:**
1. Gamitin ang **ngrok** (Option 2) para sa quick testing
2. O **localtunnel** (Option 3) kung walang budget

---

## 📞 Need Help?

Kung may problema:
1. Check ang webhook server logs
2. Test ang URL sa browser: `https://your-url.com/webhook` (GET request)
3. Test ang health endpoint: `https://your-url.com/health`
4. Check ang Gloria Food webhook logs sa dashboard

