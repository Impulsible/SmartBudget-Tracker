using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;

namespace SmartBudget.Pages
{
    public class BasePage : ComponentBase, IDisposable
    {
        [Inject] 
        protected IJSRuntime JS { get; set; } = null!;  // ✅ Non-nullable with null-forgiving operator
        
        protected string PageName { get; set; } = "";
        
        protected override async Task OnAfterRenderAsync(bool firstRender)
        {
            if (!string.IsNullOrEmpty(PageName))
            {
                // Wait for DOM to be ready
                if (firstRender)
                {
                    await Task.Delay(100);
                }

                // Always call initPage - the registry handles duplicates
                await JS.InvokeVoidAsync("initPage", PageName);
            }
        }
        
        public virtual void Dispose()
        {
            if (!string.IsNullOrEmpty(PageName))
            {
                try
                {
                    JS.InvokeVoidAsync("destroyPage", PageName);
                }
                catch
                {
                    // Ignore disposal errors
                }
            }
        }
    }
}