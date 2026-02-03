# PC Locker Deployment

## Build
1. Install .NET 8 SDK + Windows 10/11 build tools.
2. From this folder run:
   ```powershell
   dotnet restore
   dotnet publish PcLocker.csproj -c Release -r win10-x64 -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true -p:PublishTrimmed=false --self-contained true
   ```
   - Output: `bin/Release/net8.0-windows10.0.19041.0/win10-x64/publish/`
   - Copy everything from `publish/` to the target PC (e.g., `C:\Program Files\PcLocker`).

## Configure
1. Place `AppSettings.json` **next to PcLocker.exe** and edit:
   ```json
   {
     "DeviceId": "PC-01",
     "ApiBaseUrl": "https://hub.betheldigitalservices.info",
     "PollSeconds": 2,
     "RequestTimeoutSeconds": 5,
     "DeviceSecret": "optional-shared-secret"
   }
   ```
2. Ensure outbound HTTPS to your Laravel host is allowed.
3. First run will create `logs/locker.log` beside the executable (fallback to `%LocalAppData%\PcLocker\logs` if permissions block writing next to the EXE).

## Auto-start on boot (Task Scheduler)
PowerShell (elevated):
```powershell
$exe = "C:\\Program Files\\PcLocker\\PcLocker.exe"
schtasks /Create /TN "PcLocker" /SC ONSTART /RL HIGHEST /TR "`""$exe`""" /F
```
- Runs at startup under the current user session. If you prefer SYSTEM, add `/RU SYSTEM`.
- To add a tiny delay to avoid race conditions: append `/DELAY 0000:10`.

## Operations
- App fails safe to locked when the API is unreachable.
- Sessions are started from the Laravel web app (PCs page); PcLocker only follows server state.
- Server `unlocked_until` is authoritative; local timer re-locks when it elapses.
- Warnings fire at thresholds returned by the API (e.g., 300s, 60s).
- Alt+F4 is blocked in Release; window auto-raises if focus is lost while locked.

## Recovery tips
- If the app is killed, Task Scheduler will relaunch on next boot. For extra resilience, set the task to "Restart on failure" with a 1-minute interval and 3 retries.
- Keep DeviceSecret private; future hardening can enforce an `X-Device-Secret` header on all requests.
