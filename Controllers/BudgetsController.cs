using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartBudget.Data;
using SmartBudget.Models;

namespace SmartBudget.Controllers;

[ApiController]
[Route("api/budgets")]
[Authorize]
public class BudgetsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<IdentityUser> _userManager;

    public BudgetsController(ApplicationDbContext context, UserManager<IdentityUser> userManager)
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
    public async Task<IActionResult> GetBudgets()
    {
        var userId = await GetUserId();
        var budgets = await _context.Budgets
            .Where(b => b.UserId == userId)
            .OrderBy(b => b.Name)
            .Select(b => new
            {
                b.Id,
                b.Name,
                b.Amount,
                b.Color,
                b.CategoryId,
                b.Year,
                b.Month,
                b.CreatedAt,
                b.UpdatedAt
            })
            .ToListAsync();

        return Ok(new { success = true, budgets });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetBudget(int id)
    {
        var userId = await GetUserId();
        var budget = await _context.Budgets
            .FirstOrDefaultAsync(b => b.Id == id && b.UserId == userId);

        if (budget == null)
            return NotFound(new { success = false, message = "Budget not found." });

        return Ok(new
        {
            success = true,
            budget = new
            {
                budget.Id,
                budget.Name,
                budget.Amount,
                budget.Color,
                budget.CategoryId,
                budget.Year,
                budget.Month
            }
        });
    }

    [HttpPost]
    public async Task<IActionResult> CreateBudget([FromBody] BudgetRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { success = false, message = "Budget name is required." });

        if (request.Amount <= 0)
            return BadRequest(new { success = false, message = "Amount must be greater than zero." });

        var userId = await GetUserId();

        var budget = new Budget
        {
            UserId = userId,
            Name = request.Name.Trim(),
            Amount = request.Amount,
            Color = request.Color ?? "#10B981",
            CategoryId = request.CategoryId,
            Year = request.Year > 0 ? request.Year : DateTime.UtcNow.Year,
            Month = request.Month > 0 ? request.Month : DateTime.UtcNow.Month,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Budgets.Add(budget);
        await _context.SaveChangesAsync();

        return Ok(new { success = true, id = budget.Id, message = "Budget created successfully." });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateBudget(int id, [FromBody] BudgetRequest request)
    {
        var userId = await GetUserId();
        var budget = await _context.Budgets
            .FirstOrDefaultAsync(b => b.Id == id && b.UserId == userId);

        if (budget == null)
            return NotFound(new { success = false, message = "Budget not found." });

        if (!string.IsNullOrWhiteSpace(request.Name))
            budget.Name = request.Name.Trim();

        if (request.Amount > 0)
            budget.Amount = request.Amount;

        if (!string.IsNullOrWhiteSpace(request.Color))
            budget.Color = request.Color;

        if (request.CategoryId.HasValue)
            budget.CategoryId = request.CategoryId;

        if (request.Month > 0)
            budget.Month = request.Month;

        if (request.Year > 0)
            budget.Year = request.Year;

        budget.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new { success = true, message = "Budget updated successfully." });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteBudget(int id)
    {
        var userId = await GetUserId();
        var budget = await _context.Budgets
            .FirstOrDefaultAsync(b => b.Id == id && b.UserId == userId);

        if (budget == null)
            return NotFound(new { success = false, message = "Budget not found." });

        _context.Budgets.Remove(budget);
        await _context.SaveChangesAsync();

        return Ok(new { success = true, message = "Budget deleted successfully." });
    }
}

public class BudgetRequest
{
    public string? Name { get; set; }
    public decimal Amount { get; set; }
    public string? Color { get; set; }
    public int? CategoryId { get; set; }
    public int Month { get; set; }
    public int Year { get; set; }
}
