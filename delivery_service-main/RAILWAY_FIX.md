# 🔧 Railway Deployment Fix Guide

## ❌ Common Issues at Solutions:

### Issue 1: Build Fails
**Solution:** Na-fix na ang `railway.json` - build command ay nasa build phase na, hindi sa start phase.

### Issue 2: MySQL Connection Error
**Problem:** Railway hindi makakonekta sa localhost MySQL mo.

**Solution:** Gamitin ang SQLite sa Railway (default). I-update ang environment variables:

**Sa Railway Variables, i-remove o i-set:**
```
DB_TYPE=sqlite
```
O kaya i-remove mo lang ang MySQL-related variables:
- `DB_HOST`
- `DB_PORT` 
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`

**SQLite ay automatic na gagamitin kung walang MySQL config.**

### Issue 3: Port Configuration
**Solution:** Railway automatically sets `PORT` environment variable. Hindi mo na kailangan i-set manually.

### Issue 4: Missing Dependencies
**Solution:** Na-check na ang `package.json` - lahat ng dependencies ay nandun na.

---

## ✅ Correct Environment Variables para sa Railway:

**Required:**
```
GLORIAFOOD_API_KEY=your_key
GLORIAFOOD_STORE_ID=your_store_id
GLORIAFOOD_API_URL=https://tekmaxllc.com
PORT=3000
NODE_ENV=production
```

**Optional:**
```
GLORIAFOOD_MASTER_KEY=your_master_key
GLORIAFOOD_CONTACT_EMAIL=your_email
WEBHOOK_PATH=/webhook
DATABASE_PATH=./orders.db
```

**Para sa SQLite (default):**
```
DB_TYPE=sqlite
```
O kaya i-remove mo lang ang MySQL variables.

**Para sa MySQL (kung may external MySQL database ka):**
```
DB_TYPE=mysql
DB_HOST=your_mysql_host (hindi localhost!)
DB_PORT=3306
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=gloriafood_orders
```

---

## 🚀 Deployment Steps (Updated):

1. **I-commit ang fixes:**
   ```bash
   git add railway.json nixpacks.toml
   git commit -m "Fix: Railway deployment configuration"
   git push origin master
   ```

2. **Sa Railway Dashboard:**
   - Pumunta sa "Variables" tab
   - I-remove ang MySQL variables (kung wala kang external MySQL)
   - I-set ang `DB_TYPE=sqlite` o i-remove lang
   - Siguraduhin na may `PORT=3000` (o iwan mo lang, Railway auto-set)

3. **Redeploy:**
   - Pumunta sa "Deployments" tab
   - Click "Redeploy" sa latest deployment
   - O kaya mag-push ulit sa GitHub para auto-redeploy

---

## 🐛 Kung May Error Pa:

1. **Check ang logs:**
   - Railway Dashboard → Deployments → Click latest → View Logs
   - Hanapin ang error message

2. **Common Errors:**
   - **"Cannot find module"** → Build failed, check build logs
   - **"ECONNREFUSED"** → MySQL connection issue, switch to SQLite
   - **"Port already in use"** → Remove PORT variable, let Railway set it
   - **"Build timeout"** → Increase build timeout sa Railway settings

3. **Test locally first:**
   ```bash
   npm run build
   npm start
   ```
   Kung gumagana locally, dapat gumana din sa Railway.

---

**Good luck! 🚀**

