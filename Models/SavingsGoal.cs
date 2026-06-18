using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Identity;

namespace SmartBudget.Models;

public class SavingsGoal
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = "";
    
    [Required]
    public decimal TargetAmount { get; set; }
    
    public decimal CurrentAmount { get; set; }
    
    [MaxLength(20)]
    public string Color { get; set; } = "#10B981";
    
    [MaxLength(20)]
    public string Icon { get; set; } = "bi-flag";
    
    public DateTime? TargetDate { get; set; }
    
    public bool IsCompleted { get; set; }
    
    [Required]
    public string UserId { get; set; } = "";
    
    [ForeignKey("UserId")]
    public virtual IdentityUser User { get; set; } = null!;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime? UpdatedAt { get; set; }
}