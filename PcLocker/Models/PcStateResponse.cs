using System;
using System.Text.Json.Serialization;

namespace PcLocker.Models
{
    public class PcStateResponse
    {
        [JsonPropertyName("mode")]
        public string Mode { get; set; } = "locked";

        [JsonPropertyName("session_id")]
        public int? SessionId { get; set; }

        [JsonPropertyName("unlocked_until")]
        public DateTimeOffset? UnlockedUntil { get; set; }

        [JsonPropertyName("warnings")]
        public int[]? Warnings { get; set; }
    }
}
