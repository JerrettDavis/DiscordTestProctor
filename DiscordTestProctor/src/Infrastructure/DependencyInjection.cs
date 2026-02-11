using System.Globalization;
using Discord;
using Discord.WebSocket;
using DiscordTestProctor.Application.Common.Interfaces;
using DiscordTestProctor.Domain.Constants;
using DiscordTestProctor.Infrastructure.Data;
using DiscordTestProctor.Infrastructure.Data.Interceptors;
using DiscordTestProctor.Infrastructure.Discord;
using DiscordTestProctor.Infrastructure.Discord.Commands;
using DiscordTestProctor.Infrastructure.Identity;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

namespace Microsoft.Extensions.DependencyInjection;

public static class DependencyInjection
{
    public static void AddInfrastructureServices(this IHostApplicationBuilder builder)
    {
        var connectionString = builder.Configuration.GetConnectionString("DiscordTestProctorDb");
        Guard.Against.Null(connectionString, message: "Connection string 'DiscordTestProctorDb' not found.");

        builder.Services.AddScoped<ISaveChangesInterceptor, AuditableEntityInterceptor>();
        builder.Services.AddScoped<ISaveChangesInterceptor, DispatchDomainEventsInterceptor>();

        builder.Services.AddDbContext<ApplicationDbContext>((sp, options) =>
        {
            options.AddInterceptors(sp.GetServices<ISaveChangesInterceptor>());
            options.UseNpgsql(connectionString);
        });

        builder.EnrichNpgsqlDbContext<ApplicationDbContext>();

        builder.Services.AddScoped<IApplicationDbContext>(provider =>
            provider.GetRequiredService<ApplicationDbContext>());

        builder.Services.AddScoped<ApplicationDbContextInitializer>();
        
        builder.Services
            .AddDefaultIdentity<ApplicationUser>()
            .AddRoles<IdentityRole>()
            .AddEntityFrameworkStores<ApplicationDbContext>();

        builder.Services
            .AddAuthentication()
            .AddDiscord(options =>
            {
                options.ClientId = builder.Configuration["Discord:ClientId"] ?? throw new InvalidOperationException();
                options.ClientSecret = builder.Configuration["Discord:ClientSecret"] ?? throw new InvalidOperationException();
                options.SignInScheme = IdentityConstants.ExternalScheme;
                
                options.ClaimActions.MapCustomJson("urn:discord:avatar:url", user =>
                                string.Format(
                                    CultureInfo.InvariantCulture,
                                    "https://cdn.discordapp.com/avatars/{0}/{1}.{2}",
                                    user.GetString("id"),
                                    user.GetString("avatar"),
                                    user.GetString("avatar")!.StartsWith("a_") ? "gif" : "png"));
                
                options.Scope.Add("identify");
                options.Scope.Add("email");
                options.Scope.Add("guilds");
                
                
                options.SaveTokens = true;
            });

        builder.Services.AddSingleton(TimeProvider.System);
        builder.Services.AddTransient<IIdentityService, IdentityService>();

        builder.Services.AddAuthorization(options =>
            options.AddPolicy(Policies.CanPurge, policy => policy.RequireRole(Roles.Administrator)));


        builder.Services
            .AddSingleton(new DiscordSocketConfig
            {
                GatewayIntents = GatewayIntents.Guilds
            })
            .AddSingleton<DiscordSocketClient>()
            .AddSingleton<Task<DiscordSocketClient>>(async sp =>
            {
                var client = sp.GetRequiredService<DiscordSocketClient>();
                var readyTcs = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);

                Task OnReady()
                {
                    readyTcs.TrySetResult();
                    return Task.CompletedTask;
                }

                client.Ready += OnReady;
                await client.LoginAsync(TokenType.Bot,
                    sp.GetRequiredService<IConfiguration>().GetValue<string>("Discord:Token"));

                await client.StartAsync();
                await Task.WhenAny(readyTcs.Task, Task.Delay(TimeSpan.FromSeconds(30)));
                client.Ready -= OnReady;

                return client;
            });

        builder.Services.AddSingleton<IDiscordService, DiscordService>();
        builder.Services.AddSingleton<GetCertificates>();
        builder.Services.AddHostedService<CertificateService>();
    }
}
