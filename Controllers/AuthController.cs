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
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { success = false, message = "Email and password are required." });
        }

        if (string.IsNullOrWhiteSpace(request.FullName))
        {
            return BadRequest(new { success = false, message = "Full name is required." });
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

            return Ok(new { success = true, message = "Account created successfully!" });
        }

        return BadRequest(new { success = false, message = string.Join(". ", result.Errors.Select(e => e.Description)) });
    }

    // ============================================
    // LOGIN
    // ============================================
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { success = false, message = "Email and password are required." });
        }

        // Find user by email
        var user = await _userManager.FindByEmailAsync(request.Email.Trim());
        if (user == null)
        {
            return BadRequest(new { success = false, message = "Invalid email or password." });
        }

        // Attempt to sign in
        var result = await _signInManager.PasswordSignInAsync(
            user.UserName ?? request.Email.Trim(),
            request.Password,
            request.RememberMe,
            lockoutOnFailure: true
        );

        if (result.Succeeded)
        {
            return Ok(new { success = true, message = "Login successful!" });
        }

        if (result.IsLockedOut)
        {
            return BadRequest(new { success = false, message = "Account is locked due to multiple failed attempts. Please try again in 15 minutes." });
        }

        if (result.IsNotAllowed)
        {
            return BadRequest(new { success = false, message = "Please confirm your email address before signing in." });
        }

        if (result.RequiresTwoFactor)
        {
            return BadRequest(new { success = false, message = "Two-factor authentication is required.", requiresTwoFactor = true });
        }

        return BadRequest(new { success = false, message = "Invalid email or password." });
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
    // FORGOT PASSWORD
    // ============================================
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
        {
            return BadRequest(new { success = false, message = "Please enter your email address." });
        }

        var user = await _userManager.FindByEmailAsync(request.Email.Trim());

        // Always return success to prevent email enumeration
        if (user == null)
        {
            return Ok(new { success = true, message = "If the email exists, a reset link has been sent." });
        }

        // Generate password reset token
        var token = await _userManager.GeneratePasswordResetTokenAsync(user);

        // Build reset link
        var encodedToken = Uri.EscapeDataString(token);
        var encodedEmail = Uri.EscapeDataString(request.Email.Trim());
        var callbackUrl = $"{Request.Scheme}://{Request.Host}/Account/ResetPassword?email={encodedEmail}&token={encodedToken}";

        // In production, send this via email
        // For now, log it to console
        Console.WriteLine("============================================");
        Console.WriteLine("PASSWORD RESET LINK:");
        Console.WriteLine(callbackUrl);
        Console.WriteLine("============================================");

        return Ok(new { success = true, message = "Password reset link has been sent to your email." });
    }

    // ============================================
    // RESET PASSWORD
    // ============================================
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Token) || string.IsNullOrWhiteSpace(request.NewPassword))
        {
            return BadRequest(new { success = false, message = "All fields are required." });
        }

        if (request.NewPassword.Length < 6)
        {
            return BadRequest(new { success = false, message = "Password must be at least 6 characters." });
        }

        var user = await _userManager.FindByEmailAsync(request.Email.Trim());
        if (user == null)
        {
            return BadRequest(new { success = false, message = "Invalid request. Please try the forgot password process again." });
        }

        var result = await _userManager.ResetPasswordAsync(user, request.Token, request.NewPassword);

        if (result.Succeeded)
        {
            return Ok(new { success = true, message = "Password has been reset successfully! You can now log in." });
        }

        return BadRequest(new { success = false, message = string.Join(". ", result.Errors.Select(e => e.Description)) });
    }

    // ============================================
    // CHANGE PASSWORD (Added this endpoint)
    // ============================================
    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.CurrentPassword) || string.IsNullOrWhiteSpace(request.NewPassword))
            {
                return BadRequest(new { success = false, message = "Current password and new password are required." });
            }

            if (request.NewPassword.Length < 6)
            {
                return BadRequest(new { success = false, message = "New password must be at least 6 characters." });
            }

            var user = await _userManager.GetUserAsync(User);
            if (user == null)
            {
                return Unauthorized(new { success = false, message = "User not found." });
            }

            var result = await _userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);

            if (result.Succeeded)
            {
                // Sign in again after password change
                await _signInManager.RefreshSignInAsync(user);
                return Ok(new { success = true, message = "Password changed successfully." });
            }

            return BadRequest(new { success = false, message = string.Join(". ", result.Errors.Select(e => e.Description)) });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = ex.Message });
        }
    }

    // ============================================
    // UPDATE PROFILE (Added this endpoint)
    // ============================================
    [HttpPut("profile")]
    [Authorize]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        try
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
            {
                return Unauthorized(new { success = false, message = "User not found." });
            }

            // Update FullName claim
            if (!string.IsNullOrWhiteSpace(request.FullName))
            {
                var existingClaims = await _userManager.GetClaimsAsync(user);
                var fullNameClaim = existingClaims.FirstOrDefault(c => c.Type == "FullName");
                
                if (fullNameClaim != null)
                {
                    await _userManager.ReplaceClaimAsync(user, fullNameClaim, new Claim("FullName", request.FullName.Trim()));
                }
                else
                {
                    await _userManager.AddClaimAsync(user, new Claim("FullName", request.FullName.Trim()));
                }
            }

            // Update phone number if provided
            if (request.PhoneNumber != null)
            {
                user.PhoneNumber = request.PhoneNumber;
                await _userManager.UpdateAsync(user);
            }

            return Ok(new { success = true, message = "Profile updated successfully." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = ex.Message });
        }
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
            var avatarClaim = claims.FirstOrDefault(c => c.Type == "AvatarUrl")?.Value;

            return Ok(new
            {
                success = true,
                email = user.Email,
                fullName = fullNameClaim ?? user.Email?.Split('@')[0] ?? "User",
                phoneNumber = user.PhoneNumber ?? "",
                avatarUrl = avatarClaim ?? "",
                roles = await _userManager.GetRolesAsync(user)
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

public class ForgotPasswordRequest
{
    public string Email { get; set; } = "";
}

public class ResetPasswordRequest
{
    public string Email { get; set; } = "";
    public string Token { get; set; } = "";
    public string NewPassword { get; set; } = "";
}

public class ChangePasswordRequest
{
    public string CurrentPassword { get; set; } = "";
    public string NewPassword { get; set; } = "";
}

public class UpdateProfileRequest
{
    public string? FullName { get; set; }
    public string? PhoneNumber { get; set; }
}