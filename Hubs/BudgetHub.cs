using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace SmartBudget.Hubs
{
    [Authorize]
    public class BudgetHub : Hub
    {
        public override async Task OnConnectedAsync()
        {
            var userId = Context.UserIdentifier ?? Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (userId != null)
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, userId);
                Console.WriteLine($"BudgetHub: User {userId} connected");
            }

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = Context.UserIdentifier ?? Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (userId != null)
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, userId);
                Console.WriteLine($"BudgetHub: User {userId} disconnected");
            }

            await base.OnDisconnectedAsync(exception);
        }

        public async Task NotifyUserUpdate(string userId)
        {
            await Clients.Group(userId).SendAsync("DashboardUpdated");
        }

        public async Task NotifyAllUsers()
        {
            await Clients.All.SendAsync("DashboardUpdated");
        }
    }
}