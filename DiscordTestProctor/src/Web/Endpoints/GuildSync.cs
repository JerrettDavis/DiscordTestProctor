using DiscordTestProctor.Domain.Constants;
using DiscordTestProctor.Web.Services;
using Microsoft.AspNetCore.Http.HttpResults;

namespace DiscordTestProctor.Web.Endpoints;

public class GuildSync : EndpointGroupBase
{
    public override void Map(WebApplication app)
    {
        var group = app.MapGroup(this)
            .RequireAuthorization(policy => policy.RequireRole(Roles.Administrator));

        group.MapGet(GetStatus, "status");
        group.MapPost(RunSync, "run");
    }

    public Ok<GuildSyncStatus> GetStatus(GuildSyncState syncState)
    {
        return TypedResults.Ok(syncState.Snapshot());
    }

    public async Task<Ok<GuildSyncStatus>> RunSync(
        GuildSyncService syncService,
        CancellationToken cancellationToken)
    {
        var status = await syncService.RunOnceAsync(cancellationToken);
        return TypedResults.Ok(status);
    }
}
