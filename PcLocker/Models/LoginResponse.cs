using System.Text.Json.Serialization;

namespace PcLocker.Models
{
    public class LoginResponse
    {
        [JsonPropertyName("ok")]
        public bool Ok { get; set; }

        [JsonPropertyName("message")]
        public string? Message { get; set; }

        [JsonPropertyName("session_id")]
        public int? SessionId { get; set; }

        [JsonPropertyName("unlocked_until")]
        public DateTimeOffset? UnlockedUntil { get; set; }
    }
}
