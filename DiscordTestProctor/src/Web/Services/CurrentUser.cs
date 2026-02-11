using System.Security.Claims;
using DiscordTestProctor.Application.Common.Interfaces;
namespace DiscordTestProctor.Web.Services;

public class CurrentUser(
    IHttpContextAccessor httpContextAccessor) : IUser
{
    public string? Id => httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);
    public string? Name => httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.Name);
    public string? Email => httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.Email);

    public Task<IEnumerable<Claim>> Claims =>
        Task.FromResult(httpContextAccessor.HttpContext?.User.Claims ?? []);
}
