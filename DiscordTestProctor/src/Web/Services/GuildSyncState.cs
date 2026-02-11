namespace DiscordTestProctor.Web.Services;

public sealed record GuildSyncStatus(
    DateTimeOffset? LastRun,
    DateTimeOffset? LastSuccess,
    string? LastError,
    int LastGuildCount,
    int LastRoleCount,
    int LastTemplateCount,
    double? LastDurationMs,
    int IntervalSeconds);

public class GuildSyncState
{
    private readonly object _lock = new();
    private GuildSyncStatus _status = new(null, null, null, 0, 0, 0, null, 60);

    public GuildSyncStatus Snapshot()
    {
        lock (_lock)
        {
            return _status;
        }
    }

    public void SetIntervalSeconds(int seconds)
    {
        lock (_lock)
        {
            _status = _status with { IntervalSeconds = seconds };
        }
    }

    public void MarkRun(DateTimeOffset startedAt)
    {
        lock (_lock)
        {
            _status = _status with { LastRun = startedAt };
        }
    }

    public void MarkFailure(Exception ex)
    {
        lock (_lock)
        {
            _status = _status with { LastError = ex.Message };
        }
    }

    public void MarkSuccess(
        DateTimeOffset startedAt,
        int guildCount,
        int roleCount,
        int templateCount,
        double durationMs)
    {
        lock (_lock)
        {
            _status = _status with
            {
                LastSuccess = startedAt,
                LastError = null,
                LastGuildCount = guildCount,
                LastRoleCount = roleCount,
                LastTemplateCount = templateCount,
                LastDurationMs = durationMs
            };
        }
    }
}
