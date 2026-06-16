using Microsoft.AspNetCore.Components.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using SmartBudget.Components;
using SmartBudget.Data;
using SmartBudget.Services;
using SmartBudget.Components.Account;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddRazorComponents()
    .AddInteractiveServerComponents();

builder.Services.AddControllers();

// ============================================
// DATABASE CONFIGURATION - FORCED POSTGRESQL
// ============================================
string connectionString;
var usePostgres = false;

// ✅ Check for DATABASE_URL from Render
var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");

Console.WriteLine($"🔍 DATABASE_URL: {(string.IsNullOrEmpty(databaseUrl) ? "NOT FOUND" : "FOUND")}");

if (!string.IsNullOrEmpty(databaseUrl))
{
    try
    {
        // ✅ Parse Render's DATABASE_URL
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
    // ❌ Fallback to SQLite - should not happen on Render
    connectionString = "Data Source=smartbudget.db";
    Console.WriteLine("⚠️ WARNING: Using SQLite (accounts will not persist!)");
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
// IDENTITY - COOKIE CONFIGURATION
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

// ✅ Cookie configuration
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
            // ✅ Apply migrations for PostgreSQL
            await dbContext.Database.MigrateAsync();
            logger.LogInformation("✅ PostgreSQL migrations applied");
        }
        else
        {
            // ✅ Ensure SQLite database exists
            await dbContext.Database.EnsureCreatedAsync();
            logger.LogInformation("✅ SQLite database created");
        }
        
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
                await userManager.AddClaimAsync(admin, new System.Security.Claims.Claim("FullName", "Admin"));
                await userManager.AddToRoleAsync(admin, "Admin");
                await userManager.AddToRoleAsync(admin, "User");
                logger.LogInformation("✅ Created admin user: admin@smartbudget.com");
            }
        }
        else
        {
            logger.LogInformation("ℹ️ Admin user already exists");
        }
        
        logger.LogInformation("🎉 Database initialization complete!");
        logger.LogInformation($"📊 Database type: {(usePostgres ? "PostgreSQL" : "SQLite")}");
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "❌ Database initialization failed");
        logger.LogError($"Inner exception: {ex.InnerException?.Message}");
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

// ✅ Authentication must be BEFORE Authorization
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapRazorComponents<App>()
    .AddInteractiveServerRenderMode();

app.Run();