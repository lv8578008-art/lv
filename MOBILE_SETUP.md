# Mobile USB Setup & Troubleshooting Guide

This guide explains how to connect and run the VIP Platform application on any Android device using a USB cable.

---

## Prerequisites
1. An Android phone with a USB data cable.
2. PC running the backend (`uvicorn`) and frontend (`npm run dev`).

---

## Step 1: Enable USB Debugging on Your Phone
1. Go to **Settings** > **About phone**.
2. Tap **Build number** 7 times continuously until you see *"You are now a developer!"*.
3. Go back to **Settings** > **System** (or **Additional Settings**) > **Developer options**.
4. Enable **USB debugging**.

---

## Step 2: Connect via USB
1. Plug your phone into your computer via USB.
2. When prompted on your phone:
   - Choose **File Transfer / Android Auto** (do not leave on "Charge only").
   - A popup will appear: **"Allow USB debugging?"**
   - Check the box **"Always allow from this computer"** and tap **Allow**.

---

## Step 3: Launch with 1-Click
Run the included batch script from the project folder:
```cmd
.\push-to-phone.bat
```

This will automatically:
1. Detect your device.
2. Reverse port `5173` (Vite Frontend with Hot Reload).
3. Reverse port `8000` (FastAPI Backend API).
4. Launch the application in your mobile browser at `http://localhost:5173`.

---

## Troubleshooting Common Issues

### 1. Device shows `unauthorized`
- Unlock your phone's screen and look for the **"Allow USB debugging?"** dialog. Tap **Allow**.

### 2. Device not showing up
- Change USB cable or use a different USB port on your PC.
- Check USB connection mode is set to **File Transfer** / **MTP**.

### 3. API calls failing on mobile
- Ensure `push-to-phone.bat` was run so port 8000 is reversed.
- Verify your FastAPI backend is running on `127.0.0.1:8000`.
