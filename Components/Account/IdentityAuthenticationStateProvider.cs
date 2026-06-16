using Microsoft.AspNetCore.Components.Authorization;
using Microsoft.AspNetCore.Identity;
using System.Security.Claims;

namespace SmartBudget.Components.Account
{
    public class IdentityAuthenticationStateProvider : AuthenticationStateProvider
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly SignInManager<IdentityUser> _signInManager;

        public IdentityAuthenticationStateProvider(IServiceProvider serviceProvider, SignInManager<IdentityUser> signInManager)
        {
            _serviceProvider = serviceProvider;
            _signInManager = signInManager;
        }

        public override async Task<AuthenticationState> GetAuthenticationStateAsync()
        {
            var user = _signInManager.Context.User;
            
            if (user?.Identity?.IsAuthenticated == true)
            {
                using var scope = _serviceProvider.CreateScope();
                var userManager = scope.ServiceProvider.GetRequiredService<UserManager<IdentityUser>>();
                var identityUser = await userManager.GetUserAsync(user);
                
                if (identityUser != null)
                {
                    var claims = new List<Claim>
                    {
                        new Claim(ClaimTypes.NameIdentifier, identityUser.Id),
                        new Claim(ClaimTypes.Name, identityUser.UserName ?? identityUser.Email ?? string.Empty),
                        new Claim(ClaimTypes.Email, identityUser.Email ?? string.Empty)
                    };
                    var identity = new ClaimsIdentity(claims, "Identity");
                    return new AuthenticationState(new ClaimsPrincipal(identity));
                }
            }

            return new AuthenticationState(new ClaimsPrincipal(new ClaimsIdentity()));
        }
    }
}