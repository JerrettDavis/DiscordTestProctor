using DiscordTestProctor.Application.Common.Interfaces;

namespace DiscordTestProctor.Application.Me.Queries.GetMe;

public record GetMe : IRequest<MeVm>;

public class GetMeHandler(
    IUser user,
    IIdentityService identityService) : IRequestHandler<GetMe, MeVm>
{
    public async Task<MeVm> Handle(
        GetMe request, 
        CancellationToken cancellationToken)
    {
        var id = user.Id!;
        var logins = await identityService.GetLoginProvidersAsync(id);
        var claims = await user.Claims;
        var discordLogin = logins.FirstOrDefault();

        return new MeVm(
            user.Name!,
            user.Email!,
            discordLogin.Value ?? string.Empty,
            claims.FirstOrDefault(c => c.Type == "urn:discord:avatar:url")?.Value);
    }
}
