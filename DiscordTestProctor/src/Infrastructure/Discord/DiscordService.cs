using Discord;
using Discord.WebSocket;
using DiscordTestProctor.Application.Common.Interfaces;
using DiscordTestProctor.Application.Common.Models;
using DiscordTestProctor.Domain.Entities;

namespace DiscordTestProctor.Infrastructure.Discord;

public class DiscordService(
    Task<DiscordSocketClient> clientFactory)  : IDiscordService
{
    public async Task<IReadOnlyList<Guild>> GetUserGuildsAsync(
        string userId, 
        CancellationToken cancellationToken)
    {
        var client = await clientFactory;

        // NOTE: Discord.Net does not expose user guilds for OAuth users via the bot token.
        // For now, return the guilds the bot is in.
        return MapGuilds(client);
    }

    public async Task<IReadOnlyList<Guild>> GetBotGuildsAsync(CancellationToken cancellationToken)
    {
        var client = await clientFactory;
        return MapGuilds(client);
    }

    public async Task<IReadOnlyList<DiscordGuildSnapshot>> GetBotGuildSnapshotsAsync(CancellationToken cancellationToken)
    {
        var client = await clientFactory;
        return client.Guilds
            .Select(g => new DiscordGuildSnapshot(
                g.Id.ToString(),
                g.Name,
                g.Roles
                    .Select(r => new DiscordRoleSnapshot(r.Id.ToString(), r.Name, r.IsEveryone))
                    .ToList()))
            .ToList();
    }

    private static IReadOnlyList<Guild> MapGuilds(DiscordSocketClient client)
    {
        return client.Guilds
            .Select(g => new Guild
            {
                GuildId = g.Id.ToString(),
                Name = g.Name
            })
            .ToList();
    }
}
