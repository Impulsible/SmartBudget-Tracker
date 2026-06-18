using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using SmartBudget.Models;

namespace SmartBudget.Data
{
    public class ApplicationDbContext : IdentityDbContext<IdentityUser>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Transaction> Transactions { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<Budget> Budgets { get; set; }
        public DbSet<SavingsGoal> SavingsGoals { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // Transaction indexes
            builder.Entity<Transaction>()
                .HasIndex(t => new { t.UserId, t.Date });

            builder.Entity<Transaction>()
                .HasIndex(t => t.Type);

            // Category indexes
            builder.Entity<Category>()
                .HasIndex(c => new { c.UserId, c.Name })
                .IsUnique();

            // Budget indexes
            builder.Entity<Budget>()
                .HasIndex(b => new { b.UserId, b.CategoryId, b.Year, b.Month })
                .IsUnique();

            // ✅ FIXED: SavingsGoal indexes - remove Status reference
            builder.Entity<SavingsGoal>()
                .HasIndex(g => new { g.UserId, g.IsCompleted });

            // Alternative: If you want to add a Status property later:
            // builder.Entity<SavingsGoal>()
            //     .HasIndex(g => new { g.UserId, g.Status });
            
            // Or just index by UserId only:
            // builder.Entity<SavingsGoal>()
            //     .HasIndex(g => g.UserId);
        }
    }
}