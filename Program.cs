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

// Add API controllers
builder.Services.AddControllers();

// Add database context with SQLite (persistent file database)
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection") ?? "Data Source=smartbudget.db"));

// Add Identity services
builder.Services.AddIdentityCore<IdentityUser>(options =>
{
    // Password settings - relaxed for easier registration
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
    options.SignIn.RequireConfirmedAccount = false; // No email confirmation needed
    options.SignIn.RequireConfirmedEmail = false;
    options.SignIn.RequireConfirmedPhoneNumber = false;
    
    // Lockout settings
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
    options.Lockout.MaxFailedAccessAttempts = 5;
    options.Lockout.AllowedForNewUsers = true;
})
.AddRoles<IdentityRole>() // Add role support
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
    // Configure cookie settings for persistent login
    options.ApplicationCookie?.Configure(cookie =>
    {
        cookie.Cookie.Name = "SmartBudget.Auth";
        cookie.Cookie.HttpOnly = true;
        cookie.Cookie.SecurePolicy = CookieSecurePolicy.Always;
        cookie.Cookie.SameSite = SameSiteMode.Lax;
        cookie.ExpireTimeSpan = TimeSpan.FromDays(30); // Stay logged in for 30 days
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
// ENSURE DATABASE IS CREATED AND SEEDED
// This runs on every deployment/startup
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
        
        // Create the database if it doesn't exist
        // This is what makes accounts persist on deployment
        await dbContext.Database.EnsureCreatedAsync();
        logger.LogInformation("✅ Database exists and is ready");
        
        // Apply any pending migrations if using migrations
        // await dbContext.Database.MigrateAsync();
        
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
        // SEED ADMIN USER (Optional)
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
            
            // Ensure admin has roles
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
        
        // Log the inner exception for more details
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
    // The default HSTS value is 30 days. You may want to change this for production.
    app.UseHsts();
}
else
{
    // Show detailed errors in development
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
app.Logger.LogInformation($"📁 Database location: {builder.Configuration.GetConnectionString("DefaultConnection") ?? "Data Source=smartbudget.db"}");

app.Run();