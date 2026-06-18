namespace SmartBudget.Models;

public class GoalRequest
{
    public string Name { get; set; } = "";
    public decimal TargetAmount { get; set; }
    public decimal? CurrentAmount { get; set; }
    public string? Color { get; set; }
    public string? Icon { get; set; }
    public string? TargetDate { get; set; }
}