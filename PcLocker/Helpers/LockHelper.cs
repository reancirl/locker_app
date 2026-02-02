using System;
using System.Diagnostics;
using System.Runtime.InteropServices;

namespace PcLocker
{
    public static class LockHelper
    {
        [DllImport("user32.dll", SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool LockWorkStation();

        public static void LockWorkstation()
        {
            try
            {
                if (LockWorkStation())
                {
                    Logging.Write("Win32 LockWorkStation invoked");
                    return;
                }
            }
            catch (Exception ex)
            {
                Logging.Write("LockWorkStation P/Invoke failed", ex);
            }

            try
            {
                var psi = new ProcessStartInfo
                {
                    FileName = "rundll32.exe",
                    Arguments = "user32.dll,LockWorkStation",
                    CreateNoWindow = true,
                    UseShellExecute = true
                };
                Process.Start(psi);
                Logging.Write("Fallback rundll32 lock invoked");
            }
            catch (Exception ex)
            {
                Logging.Write("Fallback lock failed", ex);
            }
        }
    }
}
