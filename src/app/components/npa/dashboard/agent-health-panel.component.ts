import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { HealthMetrics, DifyAgentService } from '../../../services/dify/dify-agent.service';

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
            <h3 class="text-xs font-bold uppercase tracking-widest text-slate-600">System Health & Performance</h3>
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

         <!-- Metric 1: Overall Agent Health -->
         <div class="p-4 flex items-center gap-4">
             <div class="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                <lucide-icon name="heart-pulse" class="w-5 h-5"></lucide-icon>
             </div>
             <div>
                <p class="text-2xl font-mono font-bold text-slate-900">{{ metrics.activeAgents }}<span class="text-sm font-sans text-slate-500 font-normal ml-1">/ {{ metrics.totalAgents || 13 }}</span></p>
                <p class="text-xs text-slate-500 font-medium uppercase">Agents Healthy</p>
                <div class="flex items-center gap-1 mt-1">
                   <div class="h-1.5 flex-1 bg-green-500 rounded-full" [style.width.%]="(metrics.activeAgents / (metrics.totalAgents || 13)) * 100"></div>
                   <div class="h-1.5 bg-slate-200 rounded-full" [style.width.%]="100 - (metrics.activeAgents / (metrics.totalAgents || 13)) * 100"></div>
                </div>
             </div>
         </div>

         <!-- Metric 2: Confidence Score -->
         <div class="p-4 flex items-center gap-4">
             <div class="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <lucide-icon name="gauge" class="w-5 h-5"></lucide-icon>
             </div>
             <div>
                <p class="text-2xl font-mono font-bold text-slate-900">{{ metrics.confidenceScore || 0 }}<span class="text-sm font-sans text-slate-500 font-normal ml-1">%</span></p>
                <p class="text-xs text-slate-500 font-medium uppercase">Confidence Score</p>
                <div class="flex items-center gap-1 mt-1">
                   <div class="h-1.5 rounded-full" [style.width.%]="metrics.confidenceScore || 0"
                        [ngClass]="(metrics.confidenceScore || 0) >= 80 ? 'bg-green-500' : (metrics.confidenceScore || 0) >= 60 ? 'bg-amber-500' : 'bg-rose-500'"></div>
                   <div class="h-1.5 bg-slate-200 rounded-full" [style.width.%]="100 - (metrics.confidenceScore || 0)"></div>
                </div>
             </div>
         </div>

         <!-- Metric 3: Tools Used -->
         <div class="p-4 flex items-center gap-4">
             <div class="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                <lucide-icon name="wrench" class="w-5 h-5"></lucide-icon>
             </div>
             <div>
                <p class="text-2xl font-mono font-bold text-slate-900">{{ metrics.toolsUsed || 0 }}</p>
                <p class="text-xs text-slate-500 font-medium uppercase">Tools Connected</p>
                <p class="text-[10px] text-slate-400 mt-0.5">MCP, APIs, Workflows</p>
             </div>
         </div>

         <!-- Metric 4: KBs Connected -->
         <div class="p-4 flex items-center gap-4 cursor-pointer hover:bg-slate-50" (click)="showKbs = !showKbs">
             <div class="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                <lucide-icon name="book-open" class="w-5 h-5"></lucide-icon>
             </div>
             <div class="flex-1 flex items-center justify-between">
                <div>
                   <p class="text-2xl font-mono font-bold text-slate-900">{{ kbs.length || metrics.kbsConnected || 0 }}</p>
                   <p class="text-xs text-slate-500 font-medium uppercase">KBs Connected</p>
                   <p class="text-[10px] text-slate-400 mt-0.5">{{ formatNumber(totalKbRecords || metrics.kbRecords || 0) }} records indexed</p>
                </div>
                <lucide-icon [name]="showKbs ? 'chevron-up' : 'chevron-down'" class="w-4 h-4 text-slate-400"></lucide-icon>
             </div>
         </div>

      </div>

      <!-- KBs List Expanded Area -->
      <div *ngIf="showKbs" class="border-t border-slate-100 bg-slate-50 p-4 max-h-60 overflow-y-auto">
         <h4 class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">Connected Datasets (Dify API)</h4>
         <div *ngIf="kbs.length === 0" class="text-sm text-slate-500 px-2">No KBs found or failed to load.</div>
         <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div *ngFor="let kb of kbs" class="bg-white p-3 rounded border border-slate-200 flex items-start gap-3">
               <div class="w-8 h-8 rounded shrink-0 flex items-center justify-center text-slate-500 bg-slate-100">
                  <lucide-icon name="database" class="w-4 h-4"></lucide-icon>
               </div>
               <div>
                  <h5 class="text-sm font-medium text-slate-900 leading-tight mb-1" [title]="kb.name">{{ kb.name | slice:0:30 }}{{ kb.name.length > 30 ? '...' : '' }}</h5>
                  <p class="text-[10px] text-slate-500">{{ formatNumber(kb.document_count || kb.total_documents || 0) }} indexed docs • {{ kb.provider || 'Dify' }}</p>
               </div>
            </div>
         </div>
      </div>
    </div>
  `
})
export class AgentHealthPanelComponent implements OnInit {
   @Input() metrics: HealthMetrics = {
      status: 'down', latency: 0, uptime: 0, activeAgents: 0, totalAgents: 13, totalDecisions: 0,
      confidenceScore: 0, toolsUsed: 0, kbsConnected: 0, kbRecords: 0
   };

   kbs: any[] = [];
   totalKbRecords = 0;
   showKbs = false;

   constructor(private difyService: DifyAgentService) { }

   ngOnInit() {
      this.difyService.getConnectedKnowledgeBases().subscribe(kbs => {
         this.kbs = kbs;
         this.totalKbRecords = kbs.reduce((sum, kb) => sum + (kb.document_count || kb.total_documents || 0), 0);
      });
   }

   formatNumber(num: number): string {
      if (!num) return '0';
      if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
      return num.toString();
   }
}
