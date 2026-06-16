using Microsoft.AspNetCore.SignalR;
using SmartBudget.Hubs;

namespace SmartBudget.Services
{
    public class BudgetUpdateService
    {
        private readonly IHubContext<BudgetHub> _hubContext;

        public BudgetUpdateService(IHubContext<BudgetHub> hubContext)
        {
            _hubContext = hubContext;
        }

        public async Task NotifyUser(string userId)
        {
            await _hubContext.Clients.Group(userId).SendAsync("DashboardUpdated");
        }

        public async Task NotifyAll()
        {
            await _hubContext.Clients.All.SendAsync("DashboardUpdated");
        }
    }
}