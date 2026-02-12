using System.Text.Json.Serialization;

namespace PcLocker.Models
{
    public class PcCommandResponse
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("action")]
        public string Action { get; set; } = string.Empty;
    }
}
