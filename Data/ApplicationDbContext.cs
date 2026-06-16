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

            builder.Entity<Transaction>()
                .HasIndex(t => new { t.UserId, t.Date });

            builder.Entity<Category>()
                .HasIndex(c => new { c.UserId, c.Name })
                .IsUnique();

            // Fix: Use explicit typing for the lambda parameter
            builder.Entity<Budget>()
                .HasIndex((Budget b) => new { b.UserId, b.CategoryId, b.Year, b.Month })
                .IsUnique();
        }
    }
}