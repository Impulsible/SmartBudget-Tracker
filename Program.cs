using Microsoft.AspNetCore.Components.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using SmartBudget.Components;
using SmartBudget.Data;
using SmartBudget.Services;
using SmartBudget.Components.Account;
using System.Security.Claims;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddRazorComponents()
    .AddInteractiveServerComponents();

builder.Services.AddControllers();

// ============================================
// DATABASE CONFIGURATION
// ============================================
string connectionString;
var usePostgres = false;

var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");

Console.WriteLine($"🔍 DATABASE_URL: {(string.IsNullOrEmpty(databaseUrl) ? "NOT FOUND" : "FOUND")}");

if (!string.IsNullOrEmpty(databaseUrl))
{
    try
    {
        var uri = new Uri(databaseUrl);
        var userInfo = uri.UserInfo.Split(':');
        var username = userInfo[0];
        var password = userInfo.Length > 1 ? userInfo[1] : "";
        var host = uri.Host;
        var port = uri.Port > 0 ? uri.Port : 5432;
        var database = uri.AbsolutePath.TrimStart('/');

        connectionString = $"Host={host};Port={port};Database={database};Username={username};Password={password};SSL Mode=Require;Trust Server Certificate=true;";
        usePostgres = true;
        Console.WriteLine($"✅ Using PostgreSQL: {host}:{port}/{database}");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"⚠️ Error parsing DATABASE_URL: {ex.Message}");
        connectionString = "Data Source=smartbudget.db";
        usePostgres = false;
    }
}
else
{
    connectionString = builder.Configuration.GetConnectionString("DefaultConnection") ?? "Data Source=smartbudget.db";
    Console.WriteLine($"💾 Using SQLite (fallback)");
    Console.WriteLine($"📁 Database file: {connectionString.Replace("Data Source=", "")}");
}

// Register DbContext
builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    if (usePostgres)
    {
        options.UseNpgsql(connectionString);
        Console.WriteLine("✅ PostgreSQL registered");
    }
    else
    {
        options.UseSqlite(connectionString);
        Console.WriteLine("⚠️ SQLite registered");
    }
});

// ============================================
// IDENTITY SERVICES
// ============================================
builder.Services.AddIdentityCore<IdentityUser>(options =>
{
    options.Password.RequireDigit = true;
    options.Password.RequiredLength = 6;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = true;
    options.Password.RequireLowercase = true;
    options.SignIn.RequireConfirmedAccount = false;
    options.User.RequireUniqueEmail = true;
})
.AddRoles<IdentityRole>()
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddSignInManager()
.AddDefaultTokenProviders();

builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.Name = "SmartBudget.Auth";
    options.Cookie.HttpOnly = true;
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    options.Cookie.SameSite = SameSiteMode.Lax;
    options.ExpireTimeSpan = TimeSpan.FromDays(30);
    options.SlidingExpiration = true;
    options.LoginPath = "/Account/Login";
    options.LogoutPath = "/Account/Logout";
    options.AccessDeniedPath = "/Account/AccessDenied";
});

builder.Services.AddAuthentication(options =>
{
    options.DefaultScheme = IdentityConstants.ApplicationScheme;
    options.DefaultSignInScheme = IdentityConstants.ExternalScheme;
})
.AddIdentityCookies();

builder.Services.AddAuthorization();
builder.Services.AddCascadingAuthenticationState();
builder.Services.AddScoped<AuthenticationStateProvider, IdentityAuthenticationStateProvider>();
builder.Services.AddScoped<ExportService>();
builder.Services.AddHttpClient();

// Register PageInitializationService
builder.Services.AddScoped<PageInitializationService>();

var app = builder.Build();

// ============================================
// DATABASE MIGRATION & SEEDING
// ============================================
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();
    
    try
    {
        var dbContext = services.GetRequiredService<ApplicationDbContext>();
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
        var userManager = services.GetRequiredService<UserManager<IdentityUser>>();
        
        logger.LogInformation("🔄 Checking database...");
        
        if (usePostgres)
        {
            try
            {
                var canConnect = await dbContext.Database.CanConnectAsync();
                if (canConnect)
                {
                    logger.LogInformation("✅ Database connection successful");
                }
                else
                {
                    logger.LogWarning("⚠️ Cannot connect to database - creating...");
                    await dbContext.Database.EnsureCreatedAsync();
                    logger.LogInformation("✅ Database created");
                }
            }
            catch (Exception connEx)
            {
                logger.LogError($"❌ Cannot connect to database: {connEx.Message}");
            }
            
            try
            {
                var pendingMigrations = await dbContext.Database.GetPendingMigrationsAsync();
                if (pendingMigrations.Any())
                {
                    logger.LogInformation($"📋 Found {pendingMigrations.Count()} pending migrations");
                    
                    try
                    {
                        await dbContext.Database.MigrateAsync();
                        logger.LogInformation("✅ Migrations applied successfully");
                    }
                    catch (Exception migrateEx)
                    {
                        logger.LogWarning($"⚠️ Could not apply migrations: {migrateEx.Message}");
                        logger.LogInformation("⚠️ Database may already have tables. Continuing...");
                    }
                }
                else
                {
                    logger.LogInformation("✅ No pending migrations");
                }
            }
            catch (Exception migrationEx)
            {
                logger.LogWarning($"⚠️ Could not check migrations: {migrationEx.Message}");
                await dbContext.Database.EnsureCreatedAsync();
                logger.LogInformation("✅ Database ensured");
            }
        }
        else
        {
            await dbContext.Database.EnsureCreatedAsync();
            logger.LogInformation("✅ SQLite database created");
        }
        
        // ============================================
        // SEED ROLES AND ADMIN USER
        // ============================================
        try
        {
            // Seed roles
            string[] roles = { "User", "Admin" };
            foreach (var role in roles)
            {
                if (!await roleManager.RoleExistsAsync(role))
                {
                    await roleManager.CreateAsync(new IdentityRole(role));
                    logger.LogInformation($"✅ Created role: {role}");
                }
            }
            
            // Seed admin user
            var adminEmail = "admin@smartbudget.com";
            var adminUser = await userManager.FindByEmailAsync(adminEmail);
            
            if (adminUser == null)
            {
                var admin = new IdentityUser
                {
                    UserName = adminEmail,
                    Email = adminEmail,
                    EmailConfirmed = true
                };
                var result = await userManager.CreateAsync(admin, "Admin@123");
                if (result.Succeeded)
                {
                    await userManager.AddClaimAsync(admin, new Claim("FullName", "Admin User"));
                    await userManager.AddToRoleAsync(admin, "Admin");
                    await userManager.AddToRoleAsync(admin, "User");
                    logger.LogInformation("✅ Created admin user: admin@smartbudget.com");
                    logger.LogInformation("📧 Email: admin@smartbudget.com");
                    logger.LogInformation("🔑 Password: Admin@123");
                }
                else
                {
                    logger.LogWarning($"⚠️ Could not create admin: {string.Join(", ", result.Errors.Select(e => e.Description))}");
                }
            }
            else
            {
                logger.LogInformation("ℹ️ Admin user already exists");
                
                var claims = await userManager.GetClaimsAsync(adminUser);
                var fullNameClaim = claims.FirstOrDefault(c => c.Type == "FullName");
                
                if (fullNameClaim == null)
                {
                    await userManager.AddClaimAsync(adminUser, new Claim("FullName", "Admin User"));
                    logger.LogInformation("✅ Added FullName claim to existing admin user");
                }
                else if (fullNameClaim.Value == adminEmail || fullNameClaim.Value == "admin" || fullNameClaim.Value.Contains('@'))
                {
                    await userManager.RemoveClaimAsync(adminUser, fullNameClaim);
                    await userManager.AddClaimAsync(adminUser, new Claim("FullName", "Admin User"));
                    logger.LogInformation("✅ Updated FullName claim for admin user");
                }
                
                var isInRole = await userManager.IsInRoleAsync(adminUser, "Admin");
                if (!isInRole)
                {
                    await userManager.AddToRoleAsync(adminUser, "Admin");
                    logger.LogInformation("✅ Added admin user to Admin role");
                }
            }
        }
        catch (Exception seedEx)
        {
            logger.LogWarning($"⚠️ Could not seed data: {seedEx.Message}");
        }
        
        logger.LogInformation("🎉 Database initialization complete!");
        logger.LogInformation($"📊 Database type: {(usePostgres ? "PostgreSQL" : "SQLite")}");
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "❌ Database initialization failed");
        if (ex.InnerException != null)
        {
            logger.LogError($"Inner exception: {ex.InnerException.Message}");
        }
    }
}

// ============================================
// PIPELINE
// ============================================
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    app.UseHsts();
}
else
{
    app.UseDeveloperExceptionPage();
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();
app.UseAntiforgery();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapRazorComponents<App>()
    .AddInteractiveServerRenderMode();

// ============================================
// ✅ HEALTH CHECK ENDPOINT FOR STATUS PAGE
// ============================================
app.MapGet("/api/health", async (IServiceProvider services) =>
{
    try
    {
        var dbContext = services.GetRequiredService<ApplicationDbContext>();
        var canConnect = await dbContext.Database.CanConnectAsync();
        
        var dbType = usePostgres ? "PostgreSQL" : "SQLite";
        var uptime = DateTime.UtcNow - System.Diagnostics.Process.GetCurrentProcess().StartTime;
        
        return Results.Ok(new
        {
            status = canConnect ? "healthy" : "degraded",
            timestamp = DateTime.UtcNow,
            uptime = $"{uptime.Days}d {uptime.Hours}h {uptime.Minutes}m {uptime.Seconds}s",
            services = new
            {
                database = new
                {
                    status = canConnect ? "connected" : "disconnected",
                    type = dbType
                },
                api = new
                {
                    status = "operational",
                    version = "1.0.0"
                },
                authentication = new
                {
                    status = "operational"
                }
            },
            metrics = new
            {
                memory = GC.GetTotalMemory(false),
                threads = System.Diagnostics.Process.GetCurrentProcess().Threads.Count
            }
        });
    }
    catch (Exception ex)
    {
        return Results.Json(new
        {
            status = "unhealthy",
            timestamp = DateTime.UtcNow,
            error = ex.Message,
            services = new
            {
                database = new
                {
                    status = "disconnected",
                    error = ex.Message
                },
                api = new
                {
                    status = "degraded"
                }
            }
        }, statusCode: 503);
    }
});

// ============================================
// ✅ SIMPLE PING ENDPOINT
// ============================================
app.MapGet("/api/ping", () => Results.Ok(new
{
    status = "ok",
    timestamp = DateTime.UtcNow
}));

// ============================================
// ✅ DATABASE STATUS ENDPOINT
// ============================================
app.MapGet("/api/db-status", async (IServiceProvider services) =>
{
    try
    {
        var dbContext = services.GetRequiredService<ApplicationDbContext>();
        var canConnect = await dbContext.Database.CanConnectAsync();
        
        return Results.Ok(new
        {
            connected = canConnect,
            type = usePostgres ? "PostgreSQL" : "SQLite",
            timestamp = DateTime.UtcNow
        });
    }
    catch (Exception ex)
    {
        return Results.Json(new
        {
            connected = false,
            error = ex.Message,
            timestamp = DateTime.UtcNow
        }, statusCode: 500);
    }
});

app.Run();