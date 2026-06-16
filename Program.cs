using Microsoft.AspNetCore.Components.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using SmartBudget.Components;
using SmartBudget.Data;
using SmartBudget.Services;
using SmartBudget.Components.Account;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddRazorComponents()
    .AddInteractiveServerComponents();

// ✅ Add Razor Pages (required for MapFallbackToPage)
builder.Services.AddRazorPages();

// Add API controllers
builder.Services.AddControllers();

// ============================================
// DATABASE CONFIGURATION
// ============================================
string? connectionString = null;
var usePostgres = false;

// Check for DATABASE_URL from Render
var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");

if (!string.IsNullOrEmpty(databaseUrl))
{
    try
    {
        // ✅ Parse Render's DATABASE_URL correctly
        // Format: postgresql://username:password@host:port/database
        var uri = new Uri(databaseUrl);
        
        // Extract user info
        var userInfo = uri.UserInfo.Split(':');
        var username = userInfo[0];
        var password = userInfo.Length > 1 ? userInfo[1] : "";
        
        // Extract host (remove the ":" from host if present)
        var host = uri.Host;
        var port = uri.Port > 0 ? uri.Port : 5432; // Default PostgreSQL port
        
        // Extract database name (remove leading slash)
        var database = uri.AbsolutePath.TrimStart('/');
        
        connectionString = $"Host={host};Port={port};Database={database};Username={username};Password={password};SSL Mode=Require;Trust Server Certificate=true;";
        usePostgres = true;
        Console.WriteLine($"✅ Using PostgreSQL database (Render)");
        Console.WriteLine($"Host: {host}, Port: {port}, Database: {database}");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"⚠️ Error parsing DATABASE_URL: {ex.Message}");
        connectionString = "Data Source=smartbudget.db";
    }
}
else
{
    // Fallback to SQLite
    connectionString = builder.Configuration.GetConnectionString("DefaultConnection") ?? "Data Source=smartbudget.db";
    Console.WriteLine("✅ Using SQLite database (fallback)");
}

// Register DbContext with the appropriate provider
builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    if (usePostgres && !string.IsNullOrEmpty(connectionString))
    {
        options.UseNpgsql(connectionString);
    }
    else
    {
        options.UseSqlite("Data Source=smartbudget.db");
    }
});

// Add Identity services
builder.Services.AddIdentityCore<IdentityUser>(options =>
{
    options.Password.RequireDigit = true;
    options.Password.RequiredLength = 6;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = true;
    options.Password.RequireLowercase = true;
    options.Password.RequiredUniqueChars = 1;
    options.User.RequireUniqueEmail = true;
    options.SignIn.RequireConfirmedAccount = false;
    options.SignIn.RequireConfirmedEmail = false;
})
.AddRoles<IdentityRole>()
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddSignInManager()
.AddDefaultTokenProviders();

// Configure authentication cookies
builder.Services.AddAuthentication(options =>
{
    options.DefaultScheme = IdentityConstants.ApplicationScheme;
    options.DefaultSignInScheme = IdentityConstants.ExternalScheme;
})
.AddIdentityCookies(options =>
{
    options.ApplicationCookie?.Configure(cookie =>
    {
        cookie.Cookie.Name = "SmartBudget.Auth";
        cookie.Cookie.HttpOnly = true;
        cookie.Cookie.SecurePolicy = CookieSecurePolicy.Always;
        cookie.Cookie.SameSite = SameSiteMode.Lax;
        cookie.ExpireTimeSpan = TimeSpan.FromDays(30);
        cookie.SlidingExpiration = true;
        cookie.LoginPath = "/Account/Login";
        cookie.LogoutPath = "/Account/Logout";
        cookie.AccessDeniedPath = "/Account/AccessDenied";
    });
});

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
        logger.LogInformation("🔄 Checking database...");
        
        var dbContext = services.GetRequiredService<ApplicationDbContext>();
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
        var userManager = services.GetRequiredService<UserManager<IdentityUser>>();
        
        if (usePostgres)
        {
            await dbContext.Database.MigrateAsync();
            logger.LogInformation("✅ PostgreSQL database migrated successfully");
        }
        else
        {
            await dbContext.Database.EnsureCreatedAsync();
            logger.LogInformation("✅ SQLite database created and ready");
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
                logger.LogInformation("✅ Created admin user: admin@smartbudget.com / Admin@123");
            }
        }
        
        logger.LogInformation("🎉 Database initialization complete!");
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "❌ An error occurred while initializing the database");
        logger.LogError($"Inner exception: {ex.InnerException?.Message}");
    }
}

// ============================================
// CONFIGURE HTTP REQUEST PIPELINE
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

// ✅ Map controllers first
app.MapControllers();

// ✅ Then Razor components
app.MapRazorComponents<App>()
    .AddInteractiveServerRenderMode();

// ✅ Fallback to Razor Pages (requires AddRazorPages)
app.MapFallbackToPage("/_Host");

app.Logger.LogInformation("🚀 SmartBudget application starting...");

app.Run();