# 🔧 Webhook Troubleshooting - Hindi Lumalabas ang Order

## Problem:
Nag-run ka ng `npm run webhook` locally, pero hindi lumalabas ang order sa command/terminal.

## Possible Causes:

### 1. **GloriaFood ay naka-configure sa Render URL, hindi localhost**
   - Kung naka-configure ang GloriaFood sa `https://your-app.onrender.com/webhook`
   - Pero nag-run ka ng `npm run webhook` sa local computer
   - Ang order ay pupunta sa Render, hindi sa local computer mo

### 2. **Render service ay hindi running o natutulog**
   - Render free tier ay natutulog pagkatapos ng 15 minutes
   - Kailangan i-wake up ang service

### 3. **Maling webhook URL sa GloriaFood**
   - Hindi tama ang URL configuration

---

## Solution:

### Option 1: Gamitin ang Render (RECOMMENDED)

**Hindi mo na kailangan mag-run ng `npm run webhook` locally!**

1. **I-verify na running ang Render service:**
   - Pumunta sa Render Dashboard
   - Check kung "Live" ang status ng service
   - Kung "Sleeping", i-click ang service para i-wake up

2. **I-verify ang webhook URL sa GloriaFood:**
   - Login sa GloriaFood admin panel
   - Settings → Integrations → Webhooks
   - **Webhook URL** dapat: `https://your-app.onrender.com/webhook`
   - (Hindi `http://localhost:3000/webhook`)

3. **Check ang Render logs:**
   - Pumunta sa Render Dashboard → Your Service → **Logs** tab
   - Dapat makita mo ang incoming webhook requests doon
   - Kapag may order, dapat may log entry

4. **Test ang webhook:**
   - Gumawa ng test order sa GloriaFood
   - Check ang Render logs (hindi local terminal)
   - Dapat makita mo ang order doon

---

### Option 2: Gamitin ang Local Development

Kung gusto mong mag-test locally:

1. **I-update ang GloriaFood webhook URL:**
   - Gamitin ang ngrok o localtunnel
   - Example: `ngrok http 3000`
   - I-copy ang ngrok URL: `https://abc123.ngrok-free.app`
   - I-update sa GloriaFood: `https://abc123.ngrok-free.app/webhook`

2. **Run locally:**
   ```powershell
   npm run webhook
   ```

3. **Gumawa ng test order**
   - Dapat makita mo sa local terminal

---

## Quick Checklist:

### Para sa Render:
- [ ] Render service ay "Live" (hindi sleeping)
- [ ] GloriaFood webhook URL: `https://your-app.onrender.com/webhook`
- [ ] Check Render logs (hindi local terminal)
- [ ] Environment variables naka-set sa Render (API_KEY, STORE_ID)

### Para sa Local:
- [ ] Running ang `npm run webhook`
- [ ] May tunnel (ngrok/localtunnel) kung walang public IP
- [ ] GloriaFood webhook URL ay naka-point sa tunnel URL
- [ ] Check local terminal (hindi Render logs)

---

## Paano i-check kung may natanggap na order:

### Sa Render:
1. Pumunta sa Render Dashboard
2. Click ang service → **Logs** tab
3. Hanapin ang log entries na may "Received webhook" o "Order saved"

### Sa Local:
1. Tingnan ang terminal kung saan mo na-run ang `npm run webhook`
2. Dapat may log entries na may order details

---

## Common Mistakes:

❌ **Mali:** Nag-run ng `npm run webhook` locally pero GloriaFood ay naka-point sa Render URL
✅ **Tama:** Gamitin ang Render logs para makita ang orders

❌ **Mali:** Nag-check ng local terminal pero Render ang ginagamit
✅ **Tama:** Check ang Render logs sa dashboard

❌ **Mali:** Render service ay sleeping
✅ **Tama:** I-wake up ang service o gumamit ng uptime monitor

---

## Next Steps:

1. **I-verify ang Render service status**
2. **Check ang Render logs** (hindi local terminal)
3. **I-verify ang webhook URL sa GloriaFood**
4. **Gumawa ng test order** at check ang Render logs

