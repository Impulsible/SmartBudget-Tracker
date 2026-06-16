using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SmartBudget.Models
{
    public class SavingsGoal
    {
        [Key]
        public int Id { get; set; }
        [Required]
        public string UserId { get; set; } = string.Empty;
        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;
        public decimal TargetAmount { get; set; }
        public decimal CurrentAmount { get; set; } = 0;
        [MaxLength(20)]
        public string Color { get; set; } = "#10B981";
        [MaxLength(50)]
        public string Icon { get; set; } = "bi-flag";
        public DateTime TargetDate { get; set; }
        public SavingsGoalStatus Status { get; set; } = SavingsGoalStatus.Active;
        public bool IsCompleted => Status == SavingsGoalStatus.Completed;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
