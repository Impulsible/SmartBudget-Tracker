using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartBudget.Data;
using SmartBudget.Models;

namespace SmartBudget.Controllers;

[ApiController]
[Route("api/transactions")]
[Authorize]
public class TransactionsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<IdentityUser> _userManager;

    public TransactionsController(ApplicationDbContext context, UserManager<IdentityUser> userManager)
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
    public async Task<IActionResult> GetTransactions(
        [FromQuery] string? type,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        try
        {
            var userId = await GetUserId();
            var query = _context.Transactions
                .Include(t => t.Category)
                .Where(t => t.UserId == userId)
                .AsQueryable();

            if (!string.IsNullOrEmpty(type) && type != "all")
            {
                if (type == "income")
                    query = query.Where(t => t.Type == TransactionType.Income);
                else if (type == "expense")
                    query = query.Where(t => t.Type == TransactionType.Expense);
            }

            if (!string.IsNullOrEmpty(search))
                query = query.Where(t => t.Title.Contains(search) || (t.Description != null && t.Description.Contains(search)));

            var total = await query.CountAsync();

            var transactions = await query
                .OrderByDescending(t => t.Date)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(t => new
                {
                    t.Id,
                    t.Title,
                    Description = t.Title,
                    t.Amount,
                    Type = t.Type == TransactionType.Income ? "income" : "expense",
                    Category = t.Category != null ? t.Category.Name : "Other",
                    t.Date,
                    Status = "Completed"
                })
                .ToListAsync();

            return Ok(new { success = true, transactions, total, page, pageSize });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = ex.Message });
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetTransaction(int id)
    {
        try
        {
            var userId = await GetUserId();
            var t = await _context.Transactions
                .Include(x => x.Category)
                .FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId);

            if (t == null)
                return NotFound(new { success = false, message = "Transaction not found." });

            return Ok(new
            {
                success = true,
                transaction = new
                {
                    t.Id,
                    t.Title,
                    Description = t.Title,
                    t.Amount,
                    Type = t.Type == TransactionType.Income ? "income" : "expense",
                    Category = t.Category?.Name ?? "Other",
                    t.Date,
                    Status = "Completed"
                }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = ex.Message });
        }
    }

    [HttpPost]
    public async Task<IActionResult> CreateTransaction([FromBody] TransactionRequest request)
    {
        try
        {
            Console.WriteLine($"Creating transaction: Title={request.Title}, Amount={request.Amount}, Type={request.Type}");

            if (string.IsNullOrWhiteSpace(request.Title))
                return BadRequest(new { success = false, message = "Title is required." });

            if (request.Amount <= 0)
                return BadRequest(new { success = false, message = "Amount must be greater than zero." });

            var userId = await GetUserId();

            // Convert string type to enum
            var transactionType = request.Type == "income" ? TransactionType.Income : TransactionType.Expense;

            // Get or create default category
            var category = await _context.Categories.FirstOrDefaultAsync(c => c.Name == "Other" && c.UserId == userId);
            if (category == null)
            {
                category = new Category
                {
                    Name = "Other",
                    UserId = userId,
                    Color = "#64748B",
                    CreatedAt = DateTime.UtcNow
                };
                _context.Categories.Add(category);
                await _context.SaveChangesAsync();
            }

            var transaction = new Transaction
            {
                UserId = userId,
                Title = request.Title.Trim(),
                Description = request.Description ?? request.Title.Trim(),
                Amount = request.Amount,
                Type = transactionType,
                CategoryId = category.Id,
                Date = request.Date ?? DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };

            _context.Transactions.Add(transaction);
            await _context.SaveChangesAsync();

            Console.WriteLine($"Transaction created with ID: {transaction.Id}");

            return Ok(new { success = true, id = transaction.Id, message = "Transaction created successfully." });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error: {ex.Message}");
            return StatusCode(500, new { success = false, message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateTransaction(int id, [FromBody] TransactionRequest request)
    {
        try
        {
            var userId = await GetUserId();
            var t = await _context.Transactions
                .FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId);

            if (t == null)
                return NotFound(new { success = false, message = "Transaction not found." });

            if (!string.IsNullOrWhiteSpace(request.Title))
                t.Title = request.Title.Trim();

            if (!string.IsNullOrWhiteSpace(request.Description))
                t.Description = request.Description.Trim();

            if (request.Amount > 0)
                t.Amount = request.Amount;

            t.Type = request.Type == "income" ? TransactionType.Income : TransactionType.Expense;

            if (request.Date.HasValue)
                t.Date = request.Date.Value;

            t.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Transaction updated successfully." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTransaction(int id)
    {
        try
        {
            var userId = await GetUserId();
            var t = await _context.Transactions
                .FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId);

            if (t == null)
                return NotFound(new { success = false, message = "Transaction not found." });

            _context.Transactions.Remove(t);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Transaction deleted successfully." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = ex.Message });
        }
    }

    [HttpDelete("clear")]
    public async Task<IActionResult> ClearAllTransactions()
    {
        try
        {
            var userId = await GetUserId();
            var transactions = await _context.Transactions
                .Where(t => t.UserId == userId)
                .ToListAsync();

            _context.Transactions.RemoveRange(transactions);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "All transactions cleared." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = ex.Message });
        }
    }
}

public class TransactionRequest
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public decimal Amount { get; set; }
    public string? Type { get; set; } = "expense";
    public int? CategoryId { get; set; }
    public DateTime? Date { get; set; }
}