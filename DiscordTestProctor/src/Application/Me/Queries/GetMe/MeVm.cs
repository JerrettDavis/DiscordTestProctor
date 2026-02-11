namespace DiscordTestProctor.Application.Me.Queries.GetMe;

public record MeVm(
    string Name,
    string Email,
    string DiscordId,
    string? AvatarUrl = null);

