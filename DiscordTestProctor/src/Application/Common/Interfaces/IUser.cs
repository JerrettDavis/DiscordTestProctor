using System.Security.Claims;

namespace DiscordTestProctor.Application.Common.Interfaces;

public interface IUser
{
    string? Id { get; }
    string? Name { get; }
    string? Email { get; }

    Task<IEnumerable<Claim>> Claims { get; }
}
