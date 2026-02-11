var builder = DistributedApplication.CreateBuilder(args);

var databaseName = "DiscordTestProctorDb";

var postgres = builder
    .AddPostgres("postgres")
    // Set the name of the default database to auto-create on container startup.
    .WithEnvironment("POSTGRES_DB", databaseName);

var database = postgres.AddDatabase(databaseName);

builder.AddProject<Projects.Web>("web")
    .WithReference(database)
    .WaitFor(database);

builder.Build().Run();
