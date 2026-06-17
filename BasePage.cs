using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;

namespace SmartBudget.Pages
{
    public class BasePage : ComponentBase, IDisposable
    {
        [Inject] protected IJSRuntime? JS { get; set; }
        
        protected string PageName { get; set; } = "";
        private bool _initialized = false;
        
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
#pragma warning disable CS8604 // Possible null reference argument.
                await JS.InvokeVoidAsync("initPage", PageName);
#pragma warning restore CS8604 // Possible null reference argument.
            }
        }
        
        public virtual void Dispose()
        {
            if (!string.IsNullOrEmpty(PageName))
            {
                try
                {
#pragma warning disable CS8604 // Possible null reference argument.
                    _ = JS.InvokeVoidAsync("destroyPage", PageName);
#pragma warning restore CS8604 // Possible null reference argument.
                }
                catch
                {
                    // Ignore disposal errors
                }
            }
        }
    }
}