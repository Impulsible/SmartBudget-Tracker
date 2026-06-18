using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartBudget.Data;
using SmartBudget.Models;
using System.Security.Claims;

namespace SmartBudget.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class GoalsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<IdentityUser> _userManager;
    private readonly ILogger<GoalsController> _logger;

    public GoalsController(
        ApplicationDbContext context,
        UserManager<IdentityUser> userManager,
        ILogger<GoalsController> logger)
    {
        _context = context;
        _userManager = userManager;
        _logger = logger;
    }

    // GET: api/goals
    [HttpGet]
    public async Task<IActionResult> GetGoals()
    {
        try
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            _logger.LogInformation($"📊 Fetching goals for user: {userId ?? "null"}");
            
            if (string.IsNullOrEmpty(userId))
            {
                _logger.LogWarning("⚠️ User not authenticated - returning empty goals");
                return Ok(new { success = true, goals = new List<object>() });
            }

            var goals = await _context.SavingsGoals
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

            _logger.LogInformation($"✅ Found {goals.Count} goals for user {userId}");
            return Ok(new { success = true, goals = goals });
        }
        catch (Exception ex)
        {
            _logger.LogError($"❌ Error fetching goals: {ex.Message}");
            _logger.LogError($"Stack trace: {ex.StackTrace}");
            
            // Return empty goals instead of error to prevent frontend crash
            return Ok(new { success = true, goals = new List<object>(), message = "Error loading goals, but continuing" });
        }
    }

    // POST: api/goals
    [HttpPost]
    public async Task<IActionResult> CreateGoal([FromBody] GoalRequest request)
    {
        try
        {
            _logger.LogInformation($"📝 Creating goal: {request?.Name ?? "null"}");
            
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { success = false, message = "User not authenticated" });
            }

            if (request == null)
            {
                return BadRequest(new { success = false, message = "Invalid request" });
            }

            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return BadRequest(new { success = false, message = "Goal name is required" });
            }

            if (request.TargetAmount <= 0)
            {
                return BadRequest(new { success = false, message = "Target amount must be greater than 0" });
            }

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

            _context.SavingsGoals.Add(goal);
            await _context.SaveChangesAsync();

            _logger.LogInformation($"✅ Goal created: {goal.Name} (ID: {goal.Id})");

            return Ok(new
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
                    TargetDate = goal.TargetDate.HasValue ? goal.TargetDate.Value.ToString("yyyy-MM-dd") : null,
                    goal.IsCompleted,
                    goal.CreatedAt,
                    goal.UpdatedAt
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError($"❌ Error creating goal: {ex.Message}");
            _logger.LogError($"Stack trace: {ex.StackTrace}");
            return StatusCode(500, new { success = false, message = ex.Message });
        }
    }

    // PUT: api/goals/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateGoal(int id, [FromBody] GoalRequest request)
    {
        try
        {
            _logger.LogInformation($"📝 Updating goal ID: {id}");
            
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { success = false, message = "User not authenticated" });
            }

            if (request == null)
            {
                return BadRequest(new { success = false, message = "Invalid request" });
            }

            var goal = await _context.SavingsGoals
                .FirstOrDefaultAsync(g => g.Id == id && g.UserId == userId);

            if (goal == null)
            {
                return NotFound(new { success = false, message = "Goal not found" });
            }

            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return BadRequest(new { success = false, message = "Goal name is required" });
            }

            if (request.TargetAmount <= 0)
            {
                return BadRequest(new { success = false, message = "Target amount must be greater than 0" });
            }

            goal.Name = request.Name.Trim();
            goal.TargetAmount = request.TargetAmount;
            goal.CurrentAmount = request.CurrentAmount ?? 0;
            goal.Color = request.Color ?? "#10B981";
            goal.Icon = request.Icon ?? "bi-flag";
            goal.TargetDate = !string.IsNullOrEmpty(request.TargetDate) ? DateTime.Parse(request.TargetDate) : (DateTime?)null;
            goal.UpdatedAt = DateTime.UtcNow;
            goal.IsCompleted = goal.CurrentAmount >= goal.TargetAmount;

            await _context.SaveChangesAsync();

            _logger.LogInformation($"✅ Goal updated: {goal.Name} (ID: {goal.Id})");

            return Ok(new { success = true, message = "Goal updated successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError($"❌ Error updating goal: {ex.Message}");
            _logger.LogError($"Stack trace: {ex.StackTrace}");
            return StatusCode(500, new { success = false, message = ex.Message });
        }
    }

    // DELETE: api/goals/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteGoal(int id)
    {
        try
        {
            _logger.LogInformation($"🗑️ Deleting goal ID: {id}");
            
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { success = false, message = "User not authenticated" });
            }

            var goal = await _context.SavingsGoals
                .FirstOrDefaultAsync(g => g.Id == id && g.UserId == userId);

            if (goal == null)
            {
                return NotFound(new { success = false, message = "Goal not found" });
            }

            _context.SavingsGoals.Remove(goal);
            await _context.SaveChangesAsync();

            _logger.LogInformation($"✅ Goal deleted: ID {id}");

            return Ok(new { success = true, message = "Goal deleted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError($"❌ Error deleting goal: {ex.Message}");
            _logger.LogError($"Stack trace: {ex.StackTrace}");
            return StatusCode(500, new { success = false, message = ex.Message });
        }
    }
}

public class GoalRequest
{
    public string Name { get; set; } = "";
    public decimal TargetAmount { get; set; }
    public decimal? CurrentAmount { get; set; }
    public string? Color { get; set; }
    public string? Icon { get; set; }
    public string? TargetDate { get; set; }
}