# Bakit Hindi Gumagana? / Why It's Not Working?

## 🎯 Ang Problema (The Problem)

Ang setup mo ay gumagamit ng **WEBHOOK** (https://tekmaxllc.com/webhook), hindi polling API. Kaya hindi gumagana ang `npm run dev` na polling mode.

## ✅ Solution: Gamitin ang Webhook Mode

### Hakbang 1: I-stop ang current script
Press `Ctrl+C` kung nagra-run pa.

### Hakbang 2: Patakbuhin ang Webhook Mode
```bash
npm run webhook
```

### Hakbang 3: I-check kung naka-listen na
Dapat makita mo:
```
🌐 GloriaFood Webhook Server Started
✅ Server listening on port 3000
📍 Webhook endpoint: http://localhost:3000/webhook
```

### Hakbang 4: I-configure ang GloriaFood
Sa GloriaFood dashboard, i-update ang webhook endpoint sa:
- **Webhook URL**: `https://tekmaxllc.com/webhook` (kung nakadeploy na sa server)
- **O kung local testing**: Gamitin ngrok: `ngrok http 3000`

## 🧪 Test Connection

Para ma-test kung gumagana:
```bash
npm run test
```

## ⚠️ Important Notes

1. **Polling Mode (`npm run dev`)** - Hindi gumagana kung webhook lang ang supported
2. **Webhook Mode (`npm run webhook`)** - Ito ang tamang mode para sa setup mo
3. **Database** - Lahat ng orders na natanggap ay saved sa `orders.db`

## 📊 Check Orders in Database

After running webhook, check:
- Open `orders.db` using SQLite browser
- Or use: `npm run test` to see stats

---

## 🆘 Kung Wala Pa Ring Orders

1. **Check if webhook server is running**: `npm run webhook`
2. **Verify GloriaFood webhook configuration**: Check dashboard
3. **Test webhook manually**: POST request sa `/webhook` endpoint
4. **Check database**: Verify `orders.db` file exists
















