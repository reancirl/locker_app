# Locker App (Laravel CSMS + Windows PcLocker)

This repo contains:
- `csms/` Laravel backend (controller for PC sessions)
- `PcLocker/` .NET 8 WPF client that locks/unlocks Windows PCs

---
## Local development (Laravel)
1) Prereqs: PHP 8.2+, Composer, Node 20+, MySQL/Postgres/SQLite.
2) Install deps:
```bash
cd csms
composer install
npm install
cp .env.example .env   # configure DB
php artisan key:generate
```
3) Migrate + seed (creates PC-01; user seed left but locker now runs guest-only):
```bash
php artisan migrate --seed
```
4) Serve API locally:
```bash
php artisan serve
```
Local base URL: `http://127.0.0.1:8000`

---
## PcLocker client (local test)
1) Install .NET 8 SDK on Windows.
2) In `PcLocker/AppSettings.json`, set
```json
{
  "DeviceId": "PC-01",
  "ApiBaseUrl": "http://127.0.0.1:8000",
  "PollSeconds": 2,
  "RequestTimeoutSeconds": 5
}
```
3) Build/run (from Windows):
```powershell
cd PcLocker
dotnet build
# or run
bin/Debug/net8.0-windows10.0.19041.0/PcLocker.exe
```

---
## Publish PcLocker for deployment
```powershell
cd PcLocker
dotnet publish PcLocker.csproj -c Release -r win10-x64 -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true -p:PublishTrimmed=false --self-contained true
```
Copy the `publish/` output to each PC (e.g., `C:\Program Files\PcLocker`). Place `AppSettings.json` beside `PcLocker.exe` and set a unique `DeviceId` per PC. Production ApiBaseUrl: `https://hub.betheldigitalservices.info`.

### Auto-start on Windows (Task Scheduler)
Elevated PowerShell example:
```powershell
$exe = "C:\\Program Files\\PcLocker\\PcLocker.exe"
schtasks /Create /TN "PcLocker" /SC ONSTART /RL HIGHEST /TR "`""$exe`""" /F
```
Optionally add `/DELAY 0000:10` and `/RU SYSTEM`.

---
## Production notes
- Deploy Laravel (`csms/`) to `https://hub.betheldigitalservices.info`.
- The locker fails safe to locked when the API is unreachable.
- Warnings fire at 5 minutes and 1 minute by default (server response `warnings`).
- Sessions are now started from the Laravel UI (PCs page). PcLocker only follows server state.
