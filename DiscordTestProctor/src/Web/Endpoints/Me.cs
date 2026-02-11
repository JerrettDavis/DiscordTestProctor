using DiscordTestProctor.Application.Me.Queries.GetMe;
using Microsoft.AspNetCore.Http.HttpResults;

namespace DiscordTestProctor.Web.Endpoints;

public class Me : EndpointGroupBase
{
    public override void Map(WebApplication app) =>
        app.MapGroup(this)
            .RequireAuthorization()
            .MapGet(Get);

    public async Task<Ok<MeVm>> Get(ISender sender) =>
        TypedResults.Ok(await sender.Send(new GetMe()));
}
