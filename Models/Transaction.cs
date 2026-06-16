using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SmartBudget.Models
{
    public enum TransactionType
    {
        Expense = 0,
        Income = 1
    }

    public enum SavingsGoalStatus
    {
        Active = 0,
        Completed = 1,
        Cancelled = 2
    }

    public class Transaction
    {
        [Key]
        public int Id { get; set; }
        [Required]
        public string UserId { get; set; } = string.Empty;
        [Required]
        [StringLength(100)]
        public string Title { get; set; } = string.Empty;
        [StringLength(500)]
        public string Description { get; set; } = string.Empty;
        [Required]
        public decimal Amount { get; set; }
        [Required]
        public DateTime Date { get; set; } = DateTime.Today;
        [Required]
        public TransactionType Type { get; set; } = TransactionType.Expense;
        public int? CategoryId { get; set; }
        [ForeignKey("CategoryId")]
        public virtual Category? Category { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; internal set; }

    }
}
