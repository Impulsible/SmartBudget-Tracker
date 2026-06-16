using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartBudget.Data;
using SmartBudget.Models;

namespace SmartBudget.Controllers;

[ApiController]
[Route("api/categories")]
[Authorize]
public class CategoriesController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<IdentityUser> _userManager;

    public CategoriesController(ApplicationDbContext context, UserManager<IdentityUser> userManager)
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
    public async Task<IActionResult> GetCategories()
    {
        var userId = await GetUserId();
        var categories = await _context.Categories
            .Where(c => c.UserId == userId)
            .OrderBy(c => c.Name)
            .Select(c => new { c.Id, c.Name, c.Color, c.Icon, c.IsDefault })
            .ToListAsync();

        return Ok(new { success = true, categories });
    }

    [HttpPost]
    public async Task<IActionResult> CreateCategory([FromBody] CategoryRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { success = false, message = "Category name is required." });

        var userId = await GetUserId();
        var category = new Category
        {
            UserId = userId,
            Name = request.Name.Trim(),
            Color = request.Color ?? "#10B981",
            Icon = request.Icon ?? "bi-tag",
            IsDefault = false
        };

        _context.Categories.Add(category);
        await _context.SaveChangesAsync();

        return Ok(new { success = true, id = category.Id });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateCategory(int id, [FromBody] CategoryRequest request)
    {
        var userId = await GetUserId();
        var category = await _context.Categories
            .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);

        if (category == null)
            return NotFound(new { success = false });

        if (!string.IsNullOrWhiteSpace(request.Name)) category.Name = request.Name.Trim();
        if (!string.IsNullOrWhiteSpace(request.Color)) category.Color = request.Color;
        if (!string.IsNullOrWhiteSpace(request.Icon)) category.Icon = request.Icon;

        await _context.SaveChangesAsync();
        return Ok(new { success = true });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteCategory(int id)
    {
        var userId = await GetUserId();
        var category = await _context.Categories
            .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);

        if (category == null)
            return NotFound(new { success = false });

        _context.Categories.Remove(category);
        await _context.SaveChangesAsync();
        return Ok(new { success = true });
    }
}

public class CategoryRequest
{
    public string? Name { get; set; }
    public string? Color { get; set; }
    public string? Icon { get; set; }
}
