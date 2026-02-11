using DiscordTestProctor.Application.Common.Models;
using DiscordTestProctor.Domain.Entities;

namespace DiscordTestProctor.Application.Common.Interfaces;

public interface IDiscordService
{
    Task<IReadOnlyList<Guild>> GetUserGuildsAsync(string userId, CancellationToken cancellationToken);
    Task<IReadOnlyList<Guild>> GetBotGuildsAsync(CancellationToken cancellationToken);
    Task<IReadOnlyList<DiscordGuildSnapshot>> GetBotGuildSnapshotsAsync(CancellationToken cancellationToken);
}
