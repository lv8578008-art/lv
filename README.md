# VIP Rewards & Membership Platform

A full-stack, production-grade VIP Rewards, Membership, and Affiliate Web Application with mobile USB deployment support.

---

## 📱 Quick Mobile USB Push

To test or run the application directly on your Android phone connected via USB cable:

1. Ensure **USB Debugging** is turned ON in your phone's Developer Options.
2. Plug your phone into your computer via USB.
3. Simply run the 1-click script:
   ```cmd
   .\push-to-phone.bat
   ```
   This automatically creates the USB bridge:
   - Forwards Frontend: `localhost:5173` &rarr; PC Vite server (with hot reload)
   - Forwards Backend API: `localhost:8000` &rarr; PC FastAPI server
   - Opens `http://localhost:5173` on your phone's screen

---

## 🛠️ Architecture & Tech Stack

### Frontend
- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS, Lucide Icons, Recharts
- **Mobile Container**: Capacitor Android (`@capacitor/core`, `@capacitor/android`)
- **Port**: `5173`

### Backend
- **Framework**: FastAPI (Python 3.13)
- **Database**: SQLite with WAL mode (`vip_platform.db`) / Supabase SQL compatibility
- **Authentication**: JWT Bearer Tokens, Argon2id / Bcrypt password hashing
- **Port**: `8000`

---

## 🚀 Running the Project Locally

### 1. Backend Server (FastAPI)
Run from the workspace root (`d:\pl`):
```powershell
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
- Swagger Interactive Documentation: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- API Health Status: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

### 2. Frontend Development Server (Vite)
Run from the `frontend` directory:
```powershell
cd frontend
npm run dev
```
- Local URL: [http://localhost:5173](http://localhost:5173)

### 3. Automated Test Suite
To execute the end-to-end integration test suite:
```powershell
python test_backend.py
```

---

## 🔐 Default Credentials & Admin Access

### Superadmin Account
- **Username / Mobile**: `admin` (or `9999999999`)
- **Initial Password**: `admin639`
- **Updated Test Password**: `AdminSecure@2026`
- **Admin Portal URL**: [http://localhost:5173/admin](http://localhost:5173/admin)

---

## 💎 VIP Membership Tiers & Withdrawal Schedule

| VIP Tier | Plan Name | Price | Duration | Permitted Withdrawal Day |
| :--- | :--- | :--- | :--- | :--- |
| **VIP 1** | Starter | ₹500 | 30 Days | **Saturday** |
| **VIP 2** | Silver | ₹1,500 | 45 Days | **Friday** |
| **VIP 3** | Gold | ₹5,000 | 60 Days | **Thursday** |
| **VIP 4** | Platinum | ₹15,000 | 90 Days | **Wednesday** |
| **VIP 5** | Diamond | ₹50,000 | 120 Days | **Tuesday** |
| **VIP 6** | Elite | ₹150,000 | 180 Days | **Monday** |

- **Minimum Withdrawal**: ₹199
- **Maximum Withdrawal**: ₹99,999 per request
- **Double-spending protection**: Withdrawal amounts are atomically placed into `reserved_balance`.

---

## 👥 3-Tier Affiliate Commission Structure

- **Level 1 (Direct)**: 10.0%
- **Level 2 (Secondary)**: 3.0%
- **Level 3 (Tertiary)**: 1.5%

Commissions are calculated in real time upon plan activation and recorded in the audit ledger.

---

## 📦 Android Native APK Build

If you wish to package the app into a standalone `.apk`:
```powershell
cd frontend
npm run build
npx cap sync
cd android
$env:JAVA_HOME = "C:\Users\HI\.gradle\jdks\eclipse_adoptium-21-amd64-windows.2"
.\gradlew.bat assembleDebug
```
The output APK will be placed in `frontend/android/app/build/outputs/apk/debug/app-debug.apk`.
