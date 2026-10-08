# Bakala Express — Customer Mobile App

Hyper-local grocery delivery mobile app for Baldia Town, Karachi.  
Built with React Native, Expo (SDK 57, managed workflow), TypeScript, Expo Router, TanStack Query, and Zustand.

---

## Prerequisites
- Node.js (v20+ recommended, tested on v22.17.0)
- npm (v10+ recommended, tested on v11.4.2)
- Expo Go app on your physical Android/iOS phone
- Laravel 11 Backend running locally on your laptop

---

## Quick Start & Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy the example environment configuration:
```bash
cp .env.example .env
```
Inside `.env`, set `EXPO_PUBLIC_API_URL` to your laptop's local LAN IP:
```env
EXPO_PUBLIC_API_URL=http://192.168.1.5:8000
```
> **Note:** Do NOT use `localhost` or `127.0.0.1` on physical devices because the phone will try to connect to itself. Always use your machine's Wi-Fi / LAN IP (e.g., `192.168.x.x`).

### 3. Start Laravel Backend
Make sure the Laravel backend listens on all network interfaces:
```bash
php artisan serve --host=0.0.0.0 --port=8000
```

### 4. Important: Update Laravel `APP_URL`
In the Laravel `.env` file (`bakalaexpress_webapp_and_backendOfMbileAPp/.env`), set:
```env
APP_URL=http://192.168.1.5:8000
```
*(Replace `192.168.1.5` with your laptop's actual LAN IP).*  
**Why:** Shop profile photos and product listing images are served via Laravel's `asset('storage/...')` helper. If `APP_URL` is left as `http://localhost`, image URLs returned in API responses will point to `localhost` and fail to load on your phone.

### 5. Start the Expo Development Server
```bash
npx expo start
```
Scan the QR code with the **Expo Go** app on your phone (or press `a` for Android Emulator).

---

## Production Security Note
> **For production, the API must be https.**  
Android and iOS require encrypted HTTPS connections in production builds. In development with Expo Go, plain `http://` traffic over local LAN is permitted.

---

## Troubleshooting Guide

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| **Network request failed** | Phone cannot reach laptop IP | Ensure both your phone and laptop are connected to the exact same Wi-Fi network. Verify that the IP in `.env` matches your laptop's current IPv4 address (`ipconfig` on Windows). |
| **Port 8000 Firewall Block** | Windows Defender Firewall blocking incoming port 8000 | Open Windows Defender Firewall and allow inbound connections on TCP port 8000, or temporarily set your Wi-Fi network profile to "Private". |
| **Images not loading** | `APP_URL` in Laravel points to `localhost` | Update `APP_URL` in Laravel's `.env` to your LAN IP (`http://<laptop-ip>:8000`) and run `php artisan config:clear`. |
| **401 Unauthorized / Loop** | Expired or invalid Bearer token | The app automatically clears expired tokens from `expo-secure-store` and redirects to the login screen without infinite looping. |
| **429 Too Many Attempts** | Throttle rate limit hit | Wait 60 seconds (or the cooldown duration indicated by the server banner) before retrying the action. |

---

## Testing & Validation
Run type checks and unit test suites:
```bash
# Type check
npx tsc --noEmit

# Unit tests (Jest + jest-expo)
npm test

# Expo environment diagnostics
npx expo-doctor
```
