import { Routes } from '@angular/router';
import { MainLayoutComponent } from './components/layout/main-layout/main-layout';
import { CommandCenterComponent } from './pages/command-center/command-center.component';
import { PlaceholderComponent } from './components/placeholder/placeholder.component';

export const routes: Routes = [
    {
        path: '',
        component: MainLayoutComponent,
        children: [
            { path: '', component: CommandCenterComponent },

            // NPA Agent (Specific Route)
            {
                path: 'agents/npa',
                loadComponent: () => import('./pages/npa-agent/npa-agent.component').then(m => m.NPAAgentComponent)
            },



            // Workbench
            { path: 'workbench/my-work', component: PlaceholderComponent },
            { path: 'workbench/agent-insights', component: PlaceholderComponent },
            { path: 'workbench/cross-function', component: PlaceholderComponent },

            // Work Items
            { path: 'work-items', component: PlaceholderComponent },

            // COO Functions
            { path: 'functions/desk-support', component: PlaceholderComponent },
            {
                path: 'functions/npa',
                loadComponent: () => import('./pages/coo-npa/coo-npa-dashboard.component').then(m => m.CooNpaDashboardComponent)
            },
            { path: 'functions/dce', component: PlaceholderComponent },
            { path: 'functions/orm', component: PlaceholderComponent },
            { path: 'functions/strategic-pm', component: PlaceholderComponent },
            { path: 'functions/business-lead', component: PlaceholderComponent },
            { path: 'functions/business-analysis', component: PlaceholderComponent },

            // Agents
            { path: 'agents/functional/:agentType', component: PlaceholderComponent },
            { path: 'agents/:agentId', component: PlaceholderComponent },

            // Knowledge
            { path: 'knowledge/base', component: PlaceholderComponent },
            { path: 'knowledge/evidence', component: PlaceholderComponent },

            // Reporting
            { path: 'reporting/dashboards', component: PlaceholderComponent },

            // Admin
            { path: 'admin/workflows', component: PlaceholderComponent },

            // Help
            { path: 'help/agents', component: PlaceholderComponent },

            // Fallback
            { path: '**', component: PlaceholderComponent },
        ]
    }
];
