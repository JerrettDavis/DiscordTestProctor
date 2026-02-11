# Janus Proctor Console

Janus Proctor is a Discord test proctoring bot and admin console. It lets community admins build certifications, run exams in Discord, and award roles automatically. The web console provides live exam monitoring, results, and guild onboarding.

## Features
- Discord OAuth sign-in for administrators
- Auto guild onboarding with background sync + SignalR updates
- Certification templates and guided setup
- Live exam sessions and results dashboards
- Discord slash command `/get-certificates`
- Role assignment on pass
- Aspire-based local infrastructure with PostgreSQL

## Architecture
- **Web** (`src/Web`): ASP.NET Core + Razor Identity + Vite React client
- **Bot + Sync** (`src/Infrastructure`): Discord.Net client, background services, EF Core
- **Domain/Application**: Clean Architecture boundaries
- **AppHost** (`src/AppHost`): .NET Aspire host with Dockerized Postgres

## Requirements
- .NET SDK 10.x
- Node.js 20+
- Docker Desktop (for Aspire + Postgres)
- Discord developer application with OAuth + bot permissions

## Quick start (Aspire)
```bash
cd .\DiscordTestProctor\src\AppHost\
dotnet run
```
Aspire will start Postgres and the Web service. The web console runs at `https://localhost:5001`.

## Quick start (Web only)
```bash
cd .\DiscordTestProctor\src\Web\
dotnet watch run
```
In another terminal:
```bash
cd .\DiscordTestProctor\src\Web\ClientApp\
npm install
npm start
```

## Configuration
Set the following in `src/Web/appsettings.json`, user secrets, or environment variables:
- `Discord:ClientId`
- `Discord:ClientSecret`
- `Discord:Token`
- `Discord:AdminIds` (array of Discord user IDs)
- `Discord:GuildSyncIntervalSeconds`

Local DB connection (default in `appsettings.Development.json`):
```
ConnectionStrings:DiscordTestProctorDb=Server=127.0.0.1;Port=5432;Database=DiscordTestProctorDb;Username=admin;Password=password;
```

### Vite client env
Create `src/Web/ClientApp/.env.local` (see `src/Web/ClientApp/.env.example`):
```
VITE_API_URL=https://localhost:5001
VITE_BASE_URL=/
VITE_PORT=44447
SSL_CRT_FILE=<path-to-dev-cert>
SSL_KEY_FILE=<path-to-dev-key>
```

## Database migrations
```bash
dotnet ef migrations add <Name> --project src/Infrastructure --startup-project src/Web --output-dir Data/Migrations
dotnet ef database update --project src/Infrastructure --startup-project src/Web
```

## Tests
```bash
dotnet test
```

## Legal
- Privacy: `docs/PRIVACY.md`
- Terms: `docs/TERMS.md`
The web app serves these at `/privacy` and `/terms`.

## License
MIT. See `LICENSE`.
