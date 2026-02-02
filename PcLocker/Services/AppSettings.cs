using System;
using System.IO;
using System.Text.Json;

namespace PcLocker
{
    public class AppSettings
    {
        public string DeviceId { get; set; } = string.Empty;
        public string ApiBaseUrl { get; set; } = string.Empty;
        public int PollSeconds { get; set; } = 2;
        public int RequestTimeoutSeconds { get; set; } = 5;
        public string? DeviceSecret { get; set; }
        
        public static AppSettings Load()
        {
            var path = Path.Combine(AppContext.BaseDirectory, "AppSettings.json");
            if (!File.Exists(path))
            {
                throw new FileNotFoundException("AppSettings.json not found next to executable", path);
            }

            var json = File.ReadAllText(path);
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            var settings = JsonSerializer.Deserialize<AppSettings>(json, options) ?? new AppSettings();

            if (string.IsNullOrWhiteSpace(settings.DeviceId))
                throw new InvalidOperationException("DeviceId is required in AppSettings.json");
            if (string.IsNullOrWhiteSpace(settings.ApiBaseUrl))
                throw new InvalidOperationException("ApiBaseUrl is required in AppSettings.json");

            settings.ApiBaseUrl = settings.ApiBaseUrl.TrimEnd('/');
            if (settings.PollSeconds <= 0) settings.PollSeconds = 2;
            if (settings.RequestTimeoutSeconds <= 0) settings.RequestTimeoutSeconds = 5;
            return settings;
        }
    }
}
