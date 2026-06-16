using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace SmartBudget.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly UserManager<IdentityUser> _userManager;
    private readonly SignInManager<IdentityUser> _signInManager;
    private readonly RoleManager<IdentityRole> _roleManager;

    public AuthController(
        UserManager<IdentityUser> userManager,
        SignInManager<IdentityUser> signInManager,
        RoleManager<IdentityRole> roleManager)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _roleManager = roleManager;
    }

    // ============================================
    // REGISTER
    // ============================================
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        try
        {
            Console.WriteLine($"📝 Register attempt: {request.Email}");

            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(new { success = false, message = "Email and password are required." });
            }

            if (string.IsNullOrWhiteSpace(request.FullName))
            {
                return BadRequest(new { success = false, message = "Full name is required." });
            }

            var existingUser = await _userManager.FindByEmailAsync(request.Email.Trim());
            if (existingUser != null)
            {
                return BadRequest(new { success = false, message = "Email is already registered." });
            }

            var user = new IdentityUser
            {
                UserName = request.Email.Trim(),
                Email = request.Email.Trim(),
                EmailConfirmed = true
            };

            var result = await _userManager.CreateAsync(user, request.Password);

            if (result.Succeeded)
            {
                await _userManager.AddClaimAsync(user, new Claim("FullName", request.FullName.Trim()));

                if (!await _roleManager.RoleExistsAsync("User"))
                    await _roleManager.CreateAsync(new IdentityRole("User"));

                await _userManager.AddToRoleAsync(user, "User");
                await _signInManager.SignInAsync(user, isPersistent: true);

                Console.WriteLine($"✅ User registered successfully: {request.Email}");
                return Ok(new { success = true, message = "Account created successfully!" });
            }

            var errors = string.Join(". ", result.Errors.Select(e => e.Description));
            Console.WriteLine($"❌ Registration failed: {errors}");
            return BadRequest(new { success = false, message = errors });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Registration error: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return StatusCode(500, new { success = false, message = "Server error. Please try again." });
        }
    }

    // ============================================
    // LOGIN - FIXED
    // ============================================
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        try
        {
            Console.WriteLine($"🔑 Login attempt: {request.Email}");

            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(new { success = false, message = "Email and password are required." });
            }

            var user = await _userManager.FindByEmailAsync(request.Email.Trim());
            if (user == null)
            {
                Console.WriteLine($"❌ User not found: {request.Email}");
                return BadRequest(new { success = false, message = "Invalid email or password." });
            }

            Console.WriteLine($"✅ User found: {user.Email}");

            var result = await _signInManager.PasswordSignInAsync(
                user.UserName ?? request.Email.Trim(),
                request.Password,
                request.RememberMe,
                lockoutOnFailure: true
            );

            Console.WriteLine($"🔑 Login result: {result.Succeeded}");

            if (result.Succeeded)
            {
                Console.WriteLine($"✅ Login successful: {request.Email}");
                return Ok(new { success = true, message = "Login successful!" });
            }

            if (result.IsLockedOut)
            {
                Console.WriteLine($"🔒 Account locked: {request.Email}");
                return BadRequest(new { success = false, message = "Account is locked. Please try again later." });
            }

            if (result.IsNotAllowed)
            {
                Console.WriteLine($"🚫 Login not allowed: {request.Email}");
                return BadRequest(new { success = false, message = "Please confirm your email address." });
            }

            Console.WriteLine($"❌ Invalid password for: {request.Email}");
            return BadRequest(new { success = false, message = "Invalid email or password." });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Login error: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return StatusCode(500, new { success = false, message = "Server error. Please try again." });
        }
    }

    // ============================================
    // LOGOUT
    // ============================================
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        await _signInManager.SignOutAsync();
        return Ok(new { success = true, message = "Logged out successfully." });
    }

    // ============================================
    // TEST ENDPOINT - Check if API is working
    // ============================================
    [HttpGet("test")]
    public IActionResult Test()
    {
        return Ok(new { 
            success = true, 
            message = "Auth API is working!",
            timestamp = DateTime.UtcNow,
            isAuthenticated = User.Identity?.IsAuthenticated ?? false
        });
    }

    // ============================================
    // CHECK AUTH STATUS
    // ============================================
    [HttpGet("check")]
    public IActionResult CheckAuth()
    {
        if (User.Identity?.IsAuthenticated == true)
        {
            return Ok(new { isAuthenticated = true, username = User.Identity.Name });
        }
        return Ok(new { isAuthenticated = false });
    }

    // ============================================
    // GET USER PROFILE
    // ============================================
    [HttpGet("profile")]
    [Authorize]
    public async Task<IActionResult> GetProfile()
    {
        try
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
            {
                return Unauthorized(new { success = false, message = "User not found." });
            }

            var claims = await _userManager.GetClaimsAsync(user);
            var fullNameClaim = claims.FirstOrDefault(c => c.Type == "FullName")?.Value;

            return Ok(new
            {
                success = true,
                email = user.Email,
                fullName = fullNameClaim ?? user.Email?.Split('@')[0] ?? "User",
                userId = user.Id
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Profile error: {ex.Message}");
            return StatusCode(500, new { success = false, message = "Server error." });
        }
    }

    // ============================================
    // DEBUG ENDPOINT - Check if users exist
    // ============================================
    [HttpGet("debug-users")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DebugUsers()
    {
        try
        {
            var users = _userManager.Users.Select(u => new { u.Id, u.Email, u.UserName }).ToList();
            return Ok(new { 
                success = true, 
                count = users.Count,
                users = users
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = ex.Message });
        }
    }
}

// ============================================
// REQUEST MODELS
// ============================================
public class RegisterRequest
{
    public string FullName { get; set; } = "";
    public string Email { get; set; } = "";
    public string Password { get; set; } = "";
}

public class LoginRequest
{
    public string Email { get; set; } = "";
    public string Password { get; set; } = "";
    public bool RememberMe { get; set; } = true;
}