# 🖥️ Local Development Setup - Run Webhook Locally

## Goal:
Gusto mong mag-run ng webhook server sa local computer mo at makita ang orders sa terminal.

---

## 🚀 Quick Setup (Pinakamadali)

### Option 1: localtunnel (FREE, Walang Signup)

#### Step 1: Install localtunnel
```powershell
npm install -g localtunnel
```

#### Step 2: Run ang webhook server
```powershell
cd "C:\Users\Admin\Downloads\delivery_service-main (1)\delivery_service-main"
npm run webhook
```

**Iwanan ito running** sa isang terminal window.

#### Step 3: Run localtunnel (sa bagong terminal window)
```powershell
lt --port 3000 --subdomain gloriafood-webhook
```

**Note:** Kung may error na "subdomain already taken", gumamit ng ibang subdomain:
```powershell
lt --port 3000 --subdomain gloriafood-webhook-123
```

#### Step 4: Copy ang URL
Makikita mo ang URL, halimbawa:
```
https://gloriafood-webhook.loca.lt
```

#### Step 5: I-configure sa GloriaFood
1. Login sa GloriaFood admin panel
2. Settings → Integrations → Webhooks
3. **Webhook URL:** `https://gloriafood-webhook.loca.lt/webhook`
4. **Method:** POST
5. **Protocol:** JSON
6. **Protocol Version:** v2
7. Click "Save"

#### Step 6: Test
- Gumawa ng test order sa GloriaFood
- Dapat makita mo ang order sa terminal kung saan mo na-run ang `npm run webhook`

---

### Option 2: ngrok (FREE, Kailangan ng Signup)

#### Step 1: Download ngrok
1. Pumunta sa: https://ngrok.com/download
2. Download para sa Windows
3. Extract at ilagay sa folder (e.g., `C:\ngrok\`)

#### Step 2: Sign up at get auth token
1. Sign up sa: https://dashboard.ngrok.com/signup (FREE)
2. Copy your auth token

#### Step 3: Configure ngrok
```powershell
cd C:\ngrok
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

#### Step 4: Run ang webhook server
```powershell
cd "C:\Users\Admin\Downloads\delivery_service-main (1)\delivery_service-main"
npm run webhook
```

**Iwanan ito running** sa isang terminal window.

#### Step 5: Run ngrok (sa bagong terminal window)
```powershell
cd C:\ngrok
ngrok http 3000
```

#### Step 6: Copy ang URL
Makikita mo ang URL sa ngrok interface, halimbawa:
```
https://abc123.ngrok-free.app
```

#### Step 7: I-configure sa GloriaFood
1. Login sa GloriaFood admin panel
2. Settings → Integrations → Webhooks
3. **Webhook URL:** `https://abc123.ngrok-free.app/webhook`
4. **Method:** POST
5. **Protocol:** JSON
6. **Protocol Version:** v2
7. Click "Save"

#### Step 8: Test
- Gumawa ng test order sa GloriaFood
- Dapat makita mo ang order sa terminal

**Note:** Sa free tier ng ngrok, ang URL ay nagbabago tuwing restart. Para sa permanent URL, kailangan ng paid plan.

---

## 📋 Complete Setup Checklist

### Bago mo i-configure sa GloriaFood:

- [ ] Webhook server ay running (`npm run webhook`)
- [ ] Tunnel ay running (localtunnel o ngrok)
- [ ] May URL ka na (halimbawa: `https://gloriafood-webhook.loca.lt`)
- [ ] Na-test mo na ang URL sa browser: `https://your-url.com/health`
- [ ] Dapat may response: `{"status":"ok"}`

### Sa GloriaFood Dashboard:

- [ ] Login sa admin panel
- [ ] Settings → Integrations → Webhooks
- [ ] **Webhook URL:** `https://your-tunnel-url.com/webhook`
- [ ] **Method:** POST
- [ ] **Protocol:** JSON
- [ ] **Protocol Version:** v2
- [ ] **Events:** Piliin ang events (New Order, Order Status Changed, etc.)
- [ ] Click "Save"

---

## 🎯 Daily Usage

### Para mag-run ng webhook locally:

1. **Terminal 1 - Webhook Server:**
   ```powershell
   cd "C:\Users\Admin\Downloads\delivery_service-main (1)\delivery_service-main"
   npm run webhook
   ```

2. **Terminal 2 - Tunnel:**
   ```powershell
   # Para sa localtunnel:
   lt --port 3000 --subdomain gloriafood-webhook
   
   # O para sa ngrok:
   ngrok http 3000
   ```

3. **I-configure sa GloriaFood:**
   - Gamitin ang tunnel URL na binigay
   - Example: `https://gloriafood-webhook.loca.lt/webhook`

4. **Gumawa ng test order**
   - Dapat makita mo sa Terminal 1 (webhook server)

---

## 🐛 Troubleshooting

### "Connection refused" o "Cannot reach webhook"
**Solution:**
- Siguraduhin na running ang webhook server (`npm run webhook`)
- Siguraduhin na running ang tunnel (localtunnel o ngrok)
- Check kung tama ang port (default: 3000)
- Check kung tama ang URL sa GloriaFood dashboard

### "Tunnel not running"
**Solution:**
- Para sa localtunnel: `lt --port 3000 --subdomain gloriafood-webhook`
- Para sa ngrok: `ngrok http 3000`
- Siguraduhin na pareho ay running

### "URL nagbabago tuwing restart"
**Solution:**
- Para sa localtunnel: Normal lang ito sa free tier
- Para sa ngrok: Kailangan ng paid plan para sa permanent URL
- O gumamit ng Cloudflare Tunnel (permanent URL, pero kailangan ng domain)

### "Order hindi lumalabas sa terminal"
**Solution:**
- Check kung running ang webhook server
- Check kung running ang tunnel
- Check kung tama ang URL sa GloriaFood
- Check ang webhook server logs kung may natanggap na request

---

## 💡 Tips

1. **localtunnel:**
   - ✅ FREE, walang signup
   - ⚠️ URL nagbabago tuwing restart
   - ✅ Mabilis i-setup

2. **ngrok:**
   - ✅ FREE tier available
   - ⚠️ URL nagbabago sa free tier
   - ✅ May dashboard para sa monitoring

3. **Cloudflare Tunnel:**
   - ✅ FREE, permanent URL
   - ⚠️ Kailangan ng domain
   - ✅ Best para sa production

---

## 🎉 Success!

Kapag successful na:
- ✅ Webhook server running locally
- ✅ Tunnel running (localtunnel o ngrok)
- ✅ GloriaFood naka-configure sa tunnel URL
- ✅ Orders ay lumalabas sa local terminal

**Enjoy local development!** 🚀





