namespace DiscordTestProctor.Application.Common.Models;

public sealed record DiscordGuildSnapshot(
    string GuildId,
    string Name,
    IReadOnlyList<DiscordRoleSnapshot> Roles);

public sealed record DiscordRoleSnapshot(
    string RoleId,
    string Name,
    bool IsEveryone);
