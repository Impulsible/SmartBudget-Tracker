using Microsoft.JSInterop;

namespace SmartBudget.Services;

public class PageInitializationService
{
    private readonly IJSRuntime _jsRuntime;

    public PageInitializationService(IJSRuntime jsRuntime)
    {
        _jsRuntime = jsRuntime;
    }

    public async Task InitializePage(string pageName)
    {
        try
        {
            Console.WriteLine($"🔄 Initializing page: {pageName}");
            
            // Map page names to initialization functions
            var initFunction = pageName switch
            {
                "dashboard" => "initDashboardPage",
                "transactions" => "initTransactionsPage",
                "budgets" => "initBudgetsPage",
                "goals" => "initGoalsPage",
                "reports" => "initReportsPage",
                "export" => "initExportPage",
                "settings" => "initSettingsPage",
                _ => null
            };

            if (!string.IsNullOrEmpty(initFunction))
            {
                await _jsRuntime.InvokeVoidAsync(initFunction);
                Console.WriteLine($"✅ Page initialized: {pageName}");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Failed to initialize {pageName}: {ex.Message}");
        }
    }

    public async Task ResetPage(string pageName)
    {
        try
        {
            var resetFunction = pageName switch
            {
                "dashboard" => "resetDashboardPage",
                "transactions" => "resetTransactionsPage",
                "budgets" => "resetBudgetsPage",
                "goals" => "resetGoalsPage",
                "reports" => "resetReportsPage",
                _ => null
            };

            if (!string.IsNullOrEmpty(resetFunction))
            {
                await _jsRuntime.InvokeVoidAsync(resetFunction);
                Console.WriteLine($"✅ Page reset: {pageName}");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Failed to reset {pageName}: {ex.Message}");
        }
    }
}