import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { HealthMetrics } from '../../../services/dify/dify-agent.service';

@Component({
   selector: 'app-agent-health-panel',
   standalone: true,
   imports: [CommonModule, LucideAngularModule],
   template: `
    <div class="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm mt-8">
      <!-- Title Bar -->
      <div class="bg-slate-50 px-6 py-3 border-b border-slate-200 flex items-center justify-between">
         <div class="flex items-center gap-2">
            <lucide-icon name="activity" class="w-4 h-4 text-slate-500"></lucide-icon>
            <h3 class="text-xs font-bold uppercase tracking-wider text-slate-600">System Health & Performance</h3>
         </div>
         <div class="flex items-center gap-2 text-xs">
            <span class="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
               <span class="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
               Systems Operational
            </span>
            <span class="text-slate-400">Last updated: Just now</span>
         </div>
      </div>

      <!-- Metrics Grid -->
      <div class="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-100">
         
         <!-- Metric 1: Latency -->
         <div class="p-4 flex items-center gap-4">
             <div class="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <lucide-icon name="zap" class="w-5 h-5"></lucide-icon>
             </div>
             <div>
                <p class="text-2xl font-mono font-bold text-slate-900">{{ metrics.latency }}<span class="text-sm font-sans text-slate-500 font-normal ml-1">ms</span></p>
                <p class="text-xs text-slate-500 font-medium uppercase">API Latency</p>
             </div>
         </div>

         <!-- Metric 2: Uptime -->
         <div class="p-4 flex items-center gap-4">
             <div class="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                <lucide-icon name="server" class="w-5 h-5"></lucide-icon>
             </div>
             <div>
                <p class="text-2xl font-mono font-bold text-slate-900">{{ metrics.uptime }}<span class="text-sm font-sans text-slate-500 font-normal ml-1">%</span></p>
                <p class="text-xs text-slate-500 font-medium uppercase">Uptime (24h)</p>
             </div>
         </div>

          <!-- Metric 3: Active Agents -->
         <div class="p-4 flex items-center gap-4">
             <div class="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                <lucide-icon name="bot" class="w-5 h-5"></lucide-icon>
             </div>
             <div>
                <p class="text-2xl font-mono font-bold text-slate-900">{{ metrics.activeAgents }}<span class="text-sm font-sans text-slate-500 font-normal ml-1">/ 9</span></p>
                <p class="text-xs text-slate-500 font-medium uppercase">Active Agents</p>
             </div>
         </div>

         <!-- Metric 4: Throughput -->
         <div class="p-4 flex items-center gap-4">
             <div class="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                <lucide-icon name="cpu" class="w-5 h-5"></lucide-icon>
             </div>
             <div>
                <p class="text-2xl font-mono font-bold text-slate-900">{{ formatNumber(metrics.totalDecisions) }}</p>
                <p class="text-xs text-slate-500 font-medium uppercase">Daily Decisions</p>
             </div>
         </div>

      </div>
    </div>
  `
})
export class AgentHealthPanelComponent {
   @Input() metrics: HealthMetrics = {
      status: 'down', latency: 0, uptime: 0, activeAgents: 0, totalDecisions: 0
   };

   formatNumber(num: number): string {
      if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
      return num.toString();
   }
}
