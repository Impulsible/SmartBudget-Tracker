using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartBudget.Data;
using SmartBudget.Models;

namespace SmartBudget.Controllers;

[ApiController]
[Route("api/reports")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<IdentityUser> _userManager;

    public ReportsController(ApplicationDbContext context, UserManager<IdentityUser> userManager)
    {
        _context = context;
        _userManager = userManager;
    }

    private async Task<string> GetUserId()
    {
        var user = await _userManager.GetUserAsync(User);
        return user?.Id ?? throw new UnauthorizedAccessException();
    }

    [HttpGet("transactions")]
    public async Task<IActionResult> GetReportTransactions([FromQuery] string period = "month")
    {
        try
        {
            var userId = await GetUserId();
            var now = DateTime.UtcNow;
            DateTime startDate;

            switch (period)
            {
                case "month":
                    startDate = new DateTime(now.Year, now.Month, 1);
                    break;
                case "quarter":
                    startDate = now.AddMonths(-3);
                    break;
                case "year":
                    startDate = new DateTime(now.Year, 1, 1);
                    break;
                default:
                    startDate = new DateTime(now.Year, now.Month, 1);
                    break;
            }

            var transactions = await _context.Transactions
                .Where(t => t.UserId == userId && t.Date >= startDate)
                .Select(t => new
                {
                    t.Id,
                    t.Title,
                    t.Amount,
                    Type = t.Type == TransactionType.Income ? "income" : "expense",
                    t.Date,
                    Category = t.Category != null ? t.Category.Name : "Other"
                })
                .ToListAsync();

            return Ok(new { success = true, transactions });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = ex.Message });
        }
    }
}