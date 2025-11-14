# 🔧 Render Build Fix para sa better-sqlite3

## Problem:
`better-sqlite3` ay native module na kailangan i-compile. May error sa build sa Render.

## Solution:

### Option 1: I-update ang Render Settings (RECOMMENDED)

1. **Pumunta sa Render Dashboard** → Your Service → **Settings**

2. **I-update ang Build Command:**
   ```
   npm install --production=false && npm run build
   ```

3. **I-update ang Node Version:**
   - Sa **Environment** section, add:
   - Key: `NODE_VERSION`
   - Value: `20.18.0`

4. **O kung may option sa UI:**
   - Piliin ang **Node Version**: `20.18.0` (LTS)

5. **Click "Save Changes"** at i-redeploy

---

### Option 2: Gamitin ang render.yaml (Auto-configure)

Ang `render.yaml` ay na-update na para sa:
- Node version: 20.18.0 (LTS)
- Build command: `npm install --production=false && npm run build`

Kung gumagamit ka ng `render.yaml`, automatic na ito.

---

### Option 3: Manual Fix sa Render Dashboard

1. **Pumunta sa Service Settings**

2. **Build & Deploy** section:
   - **Build Command:** `npm install --production=false && npm run build`
   - **Node Version:** `20.18.0` (o piliin sa dropdown)

3. **Environment Variables:**
   - Add: `NODE_VERSION=20.18.0`

4. **Click "Save Changes"**

5. **Manual Deploy:**
   - Click "Manual Deploy" → "Deploy latest commit"

---

## Bakit nangyari ito?

- `better-sqlite3` ay native module (C++ code)
- Kailangan i-compile gamit ang `node-gyp`
- Node 25.2.0 ay bago at may compatibility issues
- Node 20.18.0 (LTS) ay mas stable

---

## Verification:

Pagkatapos ng fix, dapat:
- ✅ Build successful
- ✅ Service running
- ✅ Health check passing: `https://your-app.onrender.com/health`

---

## Alternative: Kung hindi pa rin gumana

Kung may error pa rin, puwede mong:
1. I-check ang build logs sa Render dashboard
2. O gumamit ng MySQL instead (hindi kailangan ng native compilation)

