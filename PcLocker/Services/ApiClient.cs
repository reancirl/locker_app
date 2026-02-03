using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using PcLocker.Models;

namespace PcLocker
{
    public class ApiClient : IDisposable
    {
        private readonly HttpClient _client;
        private readonly JsonSerializerOptions _jsonOptions = new() { PropertyNameCaseInsensitive = true };
        private bool _disposed;

        public ApiClient(AppSettings settings)
        {
            _client = new HttpClient
            {
                BaseAddress = new Uri(settings.ApiBaseUrl),
                Timeout = TimeSpan.FromSeconds(settings.RequestTimeoutSeconds)
            };

            _client.DefaultRequestHeaders.Accept.Clear();
            _client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            if (!string.IsNullOrWhiteSpace(settings.DeviceSecret))
            {
                _client.DefaultRequestHeaders.Add("X-Device-Secret", settings.DeviceSecret);
            }
        }

        public async Task<PcStateResponse?> GetPcStateAsync(string deviceId, CancellationToken cancellationToken)
        {
            var url = $"/api/pcs/{Uri.EscapeDataString(deviceId)}/state";
            using var response = await _client.GetAsync(url, cancellationToken);
            response.EnsureSuccessStatusCode();
            await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            return await JsonSerializer.DeserializeAsync<PcStateResponse>(stream, _jsonOptions, cancellationToken);
        }

        public void Dispose()
        {
            if (_disposed) return;
            _client.Dispose();
            _disposed = true;
        }
    }
}
