using System;
using System.IO;
using System.Text;

namespace PcLocker
{
    public static class Logging
    {
        private static readonly object Gate = new();
        private static string _logFilePath = Path.Combine(AppContext.BaseDirectory, "logs", "locker.log");
        private static bool _initialized;

        public static void Initialize()
        {
            if (_initialized) return;
            try
            {
                TryPreparePath(_logFilePath);
                _initialized = true;
            }
            catch
            {
                // Fallback to LocalAppData when Program Files is read-only
                _logFilePath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                    "PcLocker", "logs", "locker.log");
                TryPreparePath(_logFilePath);
                _initialized = true;
            }
        }

        private static void TryPreparePath(string path)
        {
            var dir = Path.GetDirectoryName(path);
            if (!string.IsNullOrWhiteSpace(dir))
            {
                Directory.CreateDirectory(dir);
            }
        }

        public static void Write(string message, Exception? ex = null)
        {
            try
            {
                var line = new StringBuilder()
                    .Append(DateTimeOffset.Now.ToString("yyyy-MM-dd HH:mm:ss zzz"))
                    .Append(" | ")
                    .Append(message);

                if (ex != null)
                {
                    line.Append(" | ").Append(ex.GetType().Name).Append(": ").Append(ex.Message)
                        .Append("\n").Append(ex.StackTrace);
                }

                lock (Gate)
                {
                    File.AppendAllText(_logFilePath, line.AppendLine().ToString());
                }
            }
            catch
            {
                // Swallow logging errors to avoid app crash
            }
        }
    }
}
