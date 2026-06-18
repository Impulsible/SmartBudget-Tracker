using Microsoft.AspNetCore.Components.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using SmartBudget.Components;
using SmartBudget.Data;
using SmartBudget.Services;
using SmartBudget.Components.Account;
using System.Security.Claims;
using SmartBudget.Models;

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
// DATABASE MIGRATION & SEEDING - FIXED
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
        
        // ✅ ENSURE DATABASE IS CREATED - FIXED
        try
        {
            logger.LogInformation("📋 Ensuring database exists...");
            await dbContext.Database.EnsureCreatedAsync();
            logger.LogInformation("✅ Database ensured");
        }
        catch (Exception ex)
        {
            logger.LogWarning($"⚠️ Could not ensure database: {ex.Message}");
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
// ✅ HEALTH CHECK ENDPOINT
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

// ============================================
// ✅ GOALS API ENDPOINTS - FULL CRUD
// ============================================

// GET all goals for the current user
app.MapGet("/api/goals", async (UserManager<IdentityUser> userManager, ClaimsPrincipal user, ApplicationDbContext dbContext) =>
{
    try
    {
        var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Results.Ok(new { success = true, goals = new List<object>() });
        }

        var goals = await dbContext.SavingsGoals
            .Where(g => g.UserId == userId)
            .OrderByDescending(g => g.CreatedAt)
            .Select(g => new
            {
                g.Id,
                g.Name,
                g.TargetAmount,
                g.CurrentAmount,
                g.Color,
                g.Icon,
                TargetDate = g.TargetDate.HasValue ? g.TargetDate.Value.ToString("yyyy-MM-dd") : null,
                g.IsCompleted,
                g.CreatedAt,
                g.UpdatedAt
            })
            .ToListAsync();

        return Results.Ok(new { success = true, goals = goals });
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ Error fetching goals: {ex.Message}");
        return Results.Ok(new { success = true, goals = new List<object>() });
    }
});

// POST - Create a new goal - FIXED with better error handling
app.MapPost("/api/goals", async (HttpContext ctx, UserManager<IdentityUser> userManager, ClaimsPrincipal user, ApplicationDbContext dbContext) =>
{
    try
    {
        var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Results.Json(new { success = false, message = "User not authenticated" }, statusCode: 401);
        }

        // Read request body as string first to debug
        string requestBody;
        using (var reader = new StreamReader(ctx.Request.Body))
        {
            requestBody = await reader.ReadToEndAsync();
        }
        Console.WriteLine($"📥 Request body: {requestBody}");

        // Deserialize manually
        var request = System.Text.Json.JsonSerializer.Deserialize<GoalRequest>(requestBody, new System.Text.Json.JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        if (request == null)
        {
            return Results.Json(new { success = false, message = "Invalid request body" }, statusCode: 400);
        }

        // Validate
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return Results.Json(new { success = false, message = "Goal name is required" }, statusCode: 400);
        }

        if (request.TargetAmount <= 0)
        {
            return Results.Json(new { success = false, message = "Target amount must be greater than 0" }, statusCode: 400);
        }

        // Create goal
        var goal = new SavingsGoal
        {
            Name = request.Name.Trim(),
            TargetAmount = request.TargetAmount,
            CurrentAmount = request.CurrentAmount ?? 0,
            Color = request.Color ?? "#10B981",
            Icon = request.Icon ?? "bi-flag",
            TargetDate = !string.IsNullOrEmpty(request.TargetDate) ? DateTime.Parse(request.TargetDate) : (DateTime?)null,
            UserId = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            IsCompleted = false
        };

        Console.WriteLine($"📝 Creating goal: {goal.Name} for user {userId}");

        dbContext.SavingsGoals.Add(goal);
        await dbContext.SaveChangesAsync();

        Console.WriteLine($"✅ Goal created with ID: {goal.Id}");

        return Results.Json(new 
        { 
            success = true, 
            message = "Goal created successfully",
            goal = new
            {
                goal.Id,
                goal.Name,
                goal.TargetAmount,
                goal.CurrentAmount,
                goal.Color,
                goal.Icon,
                TargetDate = goal.TargetDate?.ToString("yyyy-MM-dd"),
                goal.IsCompleted,
                goal.CreatedAt,
                goal.UpdatedAt
            }
        });
    }
    catch (System.Text.Json.JsonException jsonEx)
    {
        Console.WriteLine($"❌ JSON parsing error: {jsonEx.Message}");
        return Results.Json(new { success = false, message = $"Invalid JSON: {jsonEx.Message}" }, statusCode: 400);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ Error creating goal: {ex.Message}");
        Console.WriteLine($"Stack trace: {ex.StackTrace}");
        return Results.Json(new { success = false, message = ex.Message }, statusCode: 500);
    }
});

// PUT - Update a goal
app.MapPut("/api/goals/{id}", async (int id, HttpContext ctx, UserManager<IdentityUser> userManager, ClaimsPrincipal user, ApplicationDbContext dbContext) =>
{
    try
    {
        var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Results.Json(new { success = false, message = "User not authenticated" }, statusCode: 401);
        }

        var request = await ctx.Request.ReadFromJsonAsync<GoalRequest>();
        if (request == null)
        {
            return Results.Json(new { success = false, message = "Invalid request" }, statusCode: 400);
        }

        // Find the goal
        var goal = await dbContext.SavingsGoals
            .FirstOrDefaultAsync(g => g.Id == id && g.UserId == userId);

        if (goal == null)
        {
            return Results.Json(new { success = false, message = "Goal not found" }, statusCode: 404);
        }

        // Validate
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return Results.Json(new { success = false, message = "Goal name is required" }, statusCode: 400);
        }

        if (request.TargetAmount <= 0)
        {
            return Results.Json(new { success = false, message = "Target amount must be greater than 0" }, statusCode: 400);
        }

        // Update goal
        goal.Name = request.Name.Trim();
        goal.TargetAmount = request.TargetAmount;
        goal.CurrentAmount = request.CurrentAmount ?? 0;
        goal.Color = request.Color ?? "#10B981";
        goal.Icon = request.Icon ?? "bi-flag";
        goal.TargetDate = !string.IsNullOrEmpty(request.TargetDate) ? DateTime.Parse(request.TargetDate) : (DateTime?)null;
        goal.UpdatedAt = DateTime.UtcNow;
        goal.IsCompleted = goal.CurrentAmount >= goal.TargetAmount;

        await dbContext.SaveChangesAsync();

        return Results.Json(new { success = true, message = "Goal updated successfully" });
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ Error updating goal: {ex.Message}");
        return Results.Json(new { success = false, message = ex.Message }, statusCode: 500);
    }
});

// DELETE - Delete a goal
app.MapDelete("/api/goals/{id}", async (int id, UserManager<IdentityUser> userManager, ClaimsPrincipal user, ApplicationDbContext dbContext) =>
{
    try
    {
        var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Results.Json(new { success = false, message = "User not authenticated" }, statusCode: 401);
        }

        // Find the goal
        var goal = await dbContext.SavingsGoals
            .FirstOrDefaultAsync(g => g.Id == id && g.UserId == userId);

        if (goal == null)
        {
            return Results.Json(new { success = false, message = "Goal not found" }, statusCode: 404);
        }

        // Delete the goal
        dbContext.SavingsGoals.Remove(goal);
        await dbContext.SaveChangesAsync();

        return Results.Json(new { success = true, message = "Goal deleted successfully" });
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ Error deleting goal: {ex.Message}");
        return Results.Json(new { success = false, message = ex.Message }, statusCode: 500);
    }
});

// ============================================
// ✅ DEBUG - Check if SavingsGoals table exists
// ============================================
app.MapGet("/api/debug/db", async (ApplicationDbContext dbContext) =>
{
    try
    {
        var canConnect = await dbContext.Database.CanConnectAsync();
        var tableExists = false;
        
        try
        {
            // Check if SavingsGoals table exists
            await dbContext.Database.ExecuteSqlRawAsync("SELECT 1 FROM \"SavingsGoals\" LIMIT 1");
            tableExists = true;
        }
        catch
        {
            tableExists = false;
        }
        
        return Results.Ok(new
        {
            databaseConnected = canConnect,
            tableExists = tableExists,
            hasData = tableExists ? await dbContext.SavingsGoals.AnyAsync() : false
        });
    }
    catch (Exception ex)
    {
        return Results.Json(new { error = ex.Message }, statusCode: 500);
    }
});

app.Run();