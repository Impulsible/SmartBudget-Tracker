using OfficeOpenXml;
using SmartBudget.Models;

namespace SmartBudget.Services
{
    public class ExportService
    {
        [Obsolete]
        public ExportService()
        {
            // Set EPPlus license context (required for EPPlus 5+)
            ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
        }

        public byte[] ExportTransactionsToExcel(List<Transaction> transactions)
        {
            using var package = new ExcelPackage();
            var worksheet = package.Workbook.Worksheets.Add("Transactions");
            
            // Headers
            worksheet.Cells[1, 1].Value = "Date";
            worksheet.Cells[1, 2].Value = "Title";
            worksheet.Cells[1, 3].Value = "Description";
            worksheet.Cells[1, 4].Value = "Category";
            worksheet.Cells[1, 5].Value = "Amount";
            worksheet.Cells[1, 6].Value = "Type";
            
            // Style headers
            using (var range = worksheet.Cells[1, 1, 1, 6])
            {
                range.Style.Font.Bold = true;
                range.Style.Fill.PatternType = OfficeOpenXml.Style.ExcelFillStyle.Solid;
                range.Style.Fill.BackgroundColor.SetColor(System.Drawing.Color.LightGray);
            }
            
            var row = 2;
            foreach (var transaction in transactions)
            {
                worksheet.Cells[row, 1].Value = transaction.Date.ToString("yyyy-MM-dd");
                worksheet.Cells[row, 2].Value = transaction.Title;
                worksheet.Cells[row, 3].Value = transaction.Description;
                worksheet.Cells[row, 4].Value = transaction.Category?.Name;
                worksheet.Cells[row, 5].Value = transaction.Amount;
                worksheet.Cells[row, 6].Value = transaction.Type.ToString();
                row++;
            }
            
            worksheet.Cells.AutoFitColumns();
            return package.GetAsByteArray();
        }

        public byte[] ExportBudgetReport(List<Budget> budgets, List<Transaction> transactions)
        {
            using var package = new ExcelPackage();
            var worksheet = package.Workbook.Worksheets.Add("Budget Report");
            
            worksheet.Cells[1, 1].Value = "Category";
            worksheet.Cells[1, 2].Value = "Budget Limit";
            worksheet.Cells[1, 3].Value = "Actual Spending";
            worksheet.Cells[1, 4].Value = "Remaining";
            worksheet.Cells[1, 5].Value = "Status";
            
            using (var range = worksheet.Cells[1, 1, 1, 5])
            {
                range.Style.Font.Bold = true;
                range.Style.Fill.PatternType = OfficeOpenXml.Style.ExcelFillStyle.Solid;
                range.Style.Fill.BackgroundColor.SetColor(System.Drawing.Color.LightGray);
            }
            
            var row = 2;
            foreach (var budget in budgets)
            {
                var spent = transactions.Where(t => t.CategoryId == budget.CategoryId).Sum(t => t.Amount);
                var remaining = budget.Amount - spent;
                var status = remaining >= 0 ? "On Track" : "Over Budget";
                
                worksheet.Cells[row, 1].Value = budget.Category?.Name;
                worksheet.Cells[row, 2].Value = budget.Amount;
                worksheet.Cells[row, 3].Value = spent;
                worksheet.Cells[row, 4].Value = remaining;
                worksheet.Cells[row, 5].Value = status;
                
                if (remaining < 0)
                {
                    worksheet.Cells[row, 5].Style.Font.Color.SetColor(System.Drawing.Color.Red);
                }
                else if (remaining < budget.Amount * 0.2m)
                {
                    worksheet.Cells[row, 5].Style.Font.Color.SetColor(System.Drawing.Color.Orange);
                }
                else
                {
                    worksheet.Cells[row, 5].Style.Font.Color.SetColor(System.Drawing.Color.Green);
                }
                
                row++;
            }
            
            worksheet.Cells.AutoFitColumns();
            return package.GetAsByteArray();
        }
    }
}
