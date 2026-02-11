using DiscordTestProctor.Infrastructure.Data;
using DiscordTestProctor.Web.Hubs;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.AddServiceDefaults();
builder.AddKeyVaultIfConfigured();
builder.AddApplicationServices();
builder.AddInfrastructureServices();
builder.AddWebServices();

var app = builder.Build();
var logger = app.Services.GetRequiredService<ILogger<Program>>();

try
{
    logger.LogInformation("Starting application...");

// Configure the HTTP request pipeline.
    if (app.Environment.IsDevelopment() && !app.Configuration.GetValue<bool>("BUILD_ONLY"))
    {
        logger.LogInformation("Initialising database...");
        await app.InitialiseDatabaseAsync<Program>();
    }
    else
    {
        // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
        app.UseHsts();
    }

    app.UseHttpsRedirection();
    app.UseStaticFiles();
    app.UseExceptionHandler();
    app.UseAuthentication();
    app.UseAuthorization();

    app.UseSwaggerUi(settings =>
    {
        settings.Path = "/api";
        settings.DocumentPath = "/api/specification.json";
    });

    app.MapRazorPages();

    app.MapFallbackToFile("index.html");


    app.MapDefaultEndpoints();
    app.MapEndpoints();
    app.MapHub<GuildHub>("/hubs/guilds").RequireAuthorization();

    logger.LogInformation("Application running...");
    await app.RunAsync();
}
catch (Exception ex)
{
    logger.LogError(ex, "An error occurred while starting the application.");
    throw;
} 
finally
{
    logger.LogInformation("Application stopped.");
}


public partial class Program
{
}
