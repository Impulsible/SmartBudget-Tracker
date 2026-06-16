using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartBudget.Data;
using SmartBudget.Models;

namespace SmartBudget.Controllers;

[ApiController]
[Route("api/goals")]
[Authorize]
public class GoalsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<IdentityUser> _userManager;

    public GoalsController(ApplicationDbContext context, UserManager<IdentityUser> userManager)
    {
        _context = context;
        _userManager = userManager;
    }

    private async Task<string> GetUserId()
    {
        var user = await _userManager.GetUserAsync(User);
        return user?.Id ?? throw new UnauthorizedAccessException();
    }

    [HttpGet]
    public async Task<IActionResult> GetGoals()
    {
        var userId = await GetUserId();
        var goals = await _context.SavingsGoals
            .Where(g => g.UserId == userId)
            .OrderBy(g => g.Status)
            .ThenBy(g => g.TargetDate)
            .Select(g => new
            {
                g.Id,
                g.Name,
                g.TargetAmount,
                g.CurrentAmount,
                g.Color,
                g.Icon,
                g.TargetDate,
                Status = g.Status.ToString(),
                g.IsCompleted
            })
            .ToListAsync();

        return Ok(new { success = true, goals });
    }

    [HttpPost]
    public async Task<IActionResult> CreateGoal([FromBody] GoalRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { success = false, message = "Goal name is required." });

        if (request.TargetAmount <= 0)
            return BadRequest(new { success = false, message = "Target amount must be greater than zero." });

        var userId = await GetUserId();
        var goal = new SavingsGoal
        {
            UserId = userId,
            Name = request.Name.Trim(),
            TargetAmount = request.TargetAmount,
            CurrentAmount = request.CurrentAmount,
            Color = request.Color ?? "#10B981",
            Icon = request.Icon ?? "bi-flag",
            TargetDate = request.TargetDate,
            Status = SavingsGoalStatus.Active
        };

        _context.SavingsGoals.Add(goal);
        await _context.SaveChangesAsync();

        return Ok(new { success = true, id = goal.Id });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateGoal(int id, [FromBody] GoalRequest request)
    {
        var userId = await GetUserId();
        var goal = await _context.SavingsGoals
            .FirstOrDefaultAsync(g => g.Id == id && g.UserId == userId);

        if (goal == null)
            return NotFound(new { success = false });

        if (!string.IsNullOrWhiteSpace(request.Name)) goal.Name = request.Name.Trim();
        if (request.TargetAmount > 0) goal.TargetAmount = request.TargetAmount;
        goal.CurrentAmount = request.CurrentAmount;
        if (!string.IsNullOrWhiteSpace(request.Color)) goal.Color = request.Color;
        if (!string.IsNullOrWhiteSpace(request.Icon)) goal.Icon = request.Icon;
        if (request.TargetDate != default) goal.TargetDate = request.TargetDate;

        if (goal.CurrentAmount >= goal.TargetAmount && goal.TargetAmount > 0)
            goal.Status = SavingsGoalStatus.Completed;

        goal.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(new { success = true });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteGoal(int id)
    {
        var userId = await GetUserId();
        var goal = await _context.SavingsGoals
            .FirstOrDefaultAsync(g => g.Id == id && g.UserId == userId);

        if (goal == null)
            return NotFound(new { success = false });

        _context.SavingsGoals.Remove(goal);
        await _context.SaveChangesAsync();
        return Ok(new { success = true });
    }
}

public class GoalRequest
{
    public string? Name { get; set; }
    public decimal TargetAmount { get; set; }
    public decimal CurrentAmount { get; set; }
    public string? Color { get; set; }
    public string? Icon { get; set; }
    public DateTime TargetDate { get; set; }
}
