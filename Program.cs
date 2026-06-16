using Microsoft.AspNetCore.Components.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using SmartBudget.Components;
using SmartBudget.Data;
using SmartBudget.Services;
using SmartBudget.Components.Account;
using Npgsql;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddRazorComponents()
    .AddInteractiveServerComponents();

// Add API controllers
builder.Services.AddControllers();

// ============================================
// DATABASE CONFIGURATION
// ============================================
string? connectionString = null;
var usePostgres = false;

// Check for DATABASE_URL from Render
var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");

// If DATABASE_URL is not set, use the connection string from appsettings
if (string.IsNullOrEmpty(databaseUrl))
{
    databaseUrl = builder.Configuration.GetConnectionString("DefaultConnection");
}

if (!string.IsNullOrEmpty(databaseUrl))
{
    try
    {
        // Check if it's a PostgreSQL connection string (starts with postgresql://)
        if (databaseUrl.StartsWith("postgresql://"))
        {
            // Parse Render's DATABASE_URL
            var uri = new Uri(databaseUrl);
            var userInfo = uri.UserInfo.Split(':');
            var username = userInfo[0];
            var password = userInfo[1];
            connectionString = $"Host={uri.Host};Port={uri.Port};Database={uri.AbsolutePath.TrimStart('/')};Username={username};Password={password};SSL Mode=Require;Trust Server Certificate=true;";
            usePostgres = true;
            Console.WriteLine("✅ Using PostgreSQL database (Render)");
        }
        else
        {
            // It's a SQLite connection string
            connectionString = databaseUrl;
            Console.WriteLine("✅ Using SQLite database");
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"⚠️ Error parsing DATABASE_URL: {ex.Message}");
        // Fallback to SQLite
        connectionString = "Data Source=smartbudget.db";
    }
}
else
{
    // Fallback to SQLite
    connectionString = "Data Source=smartbudget.db";
    Console.WriteLine("✅ Using SQLite database (fallback)");
}

// Register DbContext with the appropriate provider
builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    if (usePostgres)
    {
        options.UseNpgsql(connectionString);
    }
    else
    {
        options.UseSqlite(connectionString);
    }
});

// Add Identity services
builder.Services.AddIdentityCore<IdentityUser>(options =>
{
    // Password settings
    options.Password.RequireDigit = true;
    options.Password.RequiredLength = 6;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = true;
    options.Password.RequireLowercase = true;
    options.Password.RequiredUniqueChars = 1;
    
    // User settings
    options.User.RequireUniqueEmail = true;
    options.User.AllowedUserNameCharacters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._@+";
    
    // Sign-in settings
    options.SignIn.RequireConfirmedAccount = false;
    options.SignIn.RequireConfirmedEmail = false;
    options.SignIn.RequireConfirmedPhoneNumber = false;
    
    // Lockout settings
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
    options.Lockout.MaxFailedAccessAttempts = 5;
    options.Lockout.AllowedForNewUsers = true;
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

// Add authorization services
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("RequireAdminRole", policy => policy.RequireRole("Admin"));
    options.AddPolicy("RequireUserRole", policy => policy.RequireRole("User", "Admin"));
});

builder.Services.AddCascadingAuthenticationState();
builder.Services.AddScoped<AuthenticationStateProvider, IdentityAuthenticationStateProvider>();
builder.Services.AddScoped<ExportService>();

// Add HttpClient for API calls
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
        
        // Apply migrations for PostgreSQL, or ensure created for SQLite
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
        
        // ============================================
        // SEED ROLES
        // ============================================
        string[] roles = { "User", "Admin" };
        
        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                var result = await roleManager.CreateAsync(new IdentityRole(role));
                if (result.Succeeded)
                {
                    logger.LogInformation($"✅ Created role: {role}");
                }
                else
                {
                    logger.LogError($"❌ Failed to create role {role}: {string.Join(", ", result.Errors.Select(e => e.Description))}");
                }
            }
            else
            {
                logger.LogInformation($"ℹ️ Role already exists: {role}");
            }
        }
        
        // ============================================
        // SEED ADMIN USER
        // ============================================
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
            else
            {
                logger.LogError($"❌ Failed to create admin: {string.Join(", ", result.Errors.Select(e => e.Description))}");
            }
        }
        else
        {
            logger.LogInformation("ℹ️ Admin user already exists");
            
            if (!await userManager.IsInRoleAsync(adminUser, "Admin"))
            {
                await userManager.AddToRoleAsync(adminUser, "Admin");
                logger.LogInformation("✅ Added Admin role to existing admin user");
            }
        }
        
        logger.LogInformation("🎉 Database initialization complete!");
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "❌ An error occurred while initializing the database");
        
        if (ex.InnerException != null)
        {
            logger.LogError($"Inner exception: {ex.InnerException.Message}");
        }
    }
}

// ============================================
// CONFIGURE HTTP REQUEST PIPELINE
// ============================================
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error", createScopeForErrors: true);
    app.UseHsts();
}
else
{
    app.UseDeveloperExceptionPage();
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseAntiforgery();

// Authentication & Authorization must be in this order
app.UseAuthentication();
app.UseAuthorization();

// Map API controllers
app.MapControllers();

// Map Razor components with interactive server rendering
app.MapRazorComponents<App>()
    .AddInteractiveServerRenderMode();

// Log that the app is starting
app.Logger.LogInformation("🚀 SmartBudget application starting...");
app.Logger.LogInformation($"📁 Database: {(usePostgres ? "PostgreSQL (Render)" : "SQLite")}");
app.Logger.LogInformation($"📊 Connection: {connectionString}");

app.Run();