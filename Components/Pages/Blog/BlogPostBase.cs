using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Authorization;
using Microsoft.JSInterop;
using SmartBudget.Pages;

namespace SmartBudget.Components.Pages.Blog
{
    [AllowAnonymous]
    public class BlogPostBase : BasePage, IDisposable
    {
        [Inject] 
        protected IJSRuntime JS { get; set; } = null!;
        
        [Inject] 
        protected NavigationManager Navigation { get; set; } = null!;
        
        protected string CurrentYear => DateTime.Now.Year.ToString();
        protected string CurrentMonth => DateTime.Now.ToString("MMMM");
        protected string CurrentDate => DateTime.Now.ToString("MMMM dd, yyyy");
        
        protected string PageTitle { get; set; } = "";
        protected string PostTitle { get; set; } = "";
        protected string PostAuthor { get; set; } = "";
        protected string PostCategory { get; set; } = "";
        protected int ReadTime { get; set; } = 5;
        protected string PostDate { get; set; } = "";
        protected string PostContent { get; set; } = "";

        protected override async Task OnInitializedAsync()
        {
            await base.OnInitializedAsync();
            PostDate = CurrentDate;
        }

        public void Dispose()
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