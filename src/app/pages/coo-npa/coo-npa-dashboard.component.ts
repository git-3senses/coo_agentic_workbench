import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { Router } from '@angular/router';
import { AgentGovernanceService } from '../../services/agent-governance.service';
import { AGENT_REGISTRY, AgentDefinition } from '../../lib/agent-interfaces';
import { DifyAgentService } from '../../services/dify/dify-agent.service';

interface KpiMetric {
    label: string;
    value: string;
    subValue?: string;
    trend: string;
    trendUp: boolean;
    color: string;
    icon: string;
}

interface NpaItem {
    id?: string;
    productName: string;
    location: string;
    businessUnit: string;
    kickoffDate: string;
    productManager: string;
    pmTeam: string;
    pacApproval: string;
    proposalPreparer: string;
    template: string;
    classification: 'Complex' | 'Standard' | 'Light';
    stage: 'Discovery' | 'DCE Review' | 'Risk Assess' | 'Governance' | 'Sign-Off' | 'Launch';
    status: 'On Track' | 'At Risk' | 'Delayed';
    ageDays: number;
}

@Component({
    selector: 'app-coo-npa-dashboard',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    template: `
    <div class="h-full w-full bg-slate-50/50 flex flex-col font-sans text-slate-900 group/dashboard relative overflow-hidden">

      <!-- HEADER -->
      <div class="bg-white border-b border-gray-200 pt-8 pb-10 px-6 sm:px-10 shadow-sm relative overflow-hidden flex-none">
        <!-- Background Decoration -->
        <div class="absolute top-0 right-0 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

        <div class="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">

          <!-- Identity -->
          <div class="flex items-start gap-6">
            <div class="relative group cursor-pointer">
              <!-- Avatar -->
              <div class="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center shadow-lg shadow-slate-200 ring-4 ring-white">
                 <lucide-icon name="layout-dashboard" class="w-10 h-10 text-white"></lucide-icon>
              </div>
              <!-- Pulse -->
              <div class="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                 <div class="w-4 h-4 bg-green-500 rounded-full ring-2 ring-white animate-pulse"></div>
              </div>
            </div>

            <div class="space-y-3">
               <div>
                  <h1 class="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                     NPA Control Tower
                     <span class="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100 uppercase tracking-wide">Live Dashboard</span>
                  </h1>
                  <p class="text-lg text-slate-500 max-w-2xl leading-relaxed mt-1">
                     Executive overview for New Product Approvals. Monitor pipeline, track governance stages, and oversee approval workflows across all business units.
                  </p>
               </div>

               <!-- Key Stats Badge -->
               <div class="flex items-center gap-6 text-sm font-medium text-slate-600 bg-slate-50 inline-flex px-4 py-2 rounded-lg border border-slate-200/60">
                  <span class="flex items-center gap-1.5 hover:text-indigo-600 transition-colors cursor-help">
                     <lucide-icon name="layers" class="w-4 h-4 text-indigo-500"></lucide-icon>
                     42 Active NPAs
                  </span>
                  <div class="w-px h-4 bg-slate-300"></div>
                  <span class="flex items-center gap-1.5 hover:text-emerald-600 transition-colors cursor-help">
                     <lucide-icon name="check-circle" class="w-4 h-4 text-emerald-500"></lucide-icon>
                     94% Approval Rate
                  </span>
                  <div class="w-px h-4 bg-slate-300"></div>
                  <span class="flex items-center gap-1.5 hover:text-blue-600 transition-colors cursor-help">
                     <lucide-icon name="clock" class="w-4 h-4 text-blue-500"></lucide-icon>
                     32 Days Avg Cycle
                  </span>
               </div>
            </div>
          </div>

          <!-- Primary CTA -->
          <div class="flex flex-col gap-3 w-full md:w-auto">
             <button (click)="navigateToCreate()" class="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-lg shadow-xl shadow-slate-200 transition-all transform hover:-translate-y-0.5 active:translate-y-0 focus:ring-4 focus:ring-slate-100">
                <lucide-icon name="plus" class="w-6 h-6"></lucide-icon>
                Create NPA
             </button>
             <div class="grid grid-cols-2 gap-2">
                <button class="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center justify-center gap-2">
                   <lucide-icon name="download" class="w-3.5 h-3.5"></lucide-icon> Export
                </button>
                <button class="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center justify-center gap-2">
                   <lucide-icon name="filter" class="w-3.5 h-3.5"></lucide-icon> Filter
                </button>
             </div>
          </div>
        </div>
      </div>

      <!-- TABS -->
      <div class="border-b border-slate-200 bg-white px-6 sm:px-10">
         <div class="flex gap-6">
            <button
               [class.border-slate-900]="activeTab === 'overview'"
               [class.text-slate-900]="activeTab === 'overview'"
               [class.border-transparent]="activeTab !== 'overview'"
               [class.text-slate-500]="activeTab !== 'overview'"
               (click)="activeTab = 'overview'"
               class="px-1 py-3 text-sm font-semibold border-b-2 hover:text-slate-900 transition-colors">
               Overview
            </button>
            <button
               [class.border-slate-900]="activeTab === 'npa-pool'"
               [class.text-slate-900]="activeTab === 'npa-pool'"
               [class.border-transparent]="activeTab !== 'npa-pool'"
               [class.text-slate-500]="activeTab !== 'npa-pool'"
               (click)="activeTab = 'npa-pool'"
               class="px-1 py-3 text-sm font-semibold border-b-2 hover:text-slate-900 transition-colors">
               NPA Pool
            </button>
            <button
               [class.border-slate-900]="activeTab === 'monitoring'"
               [class.text-slate-900]="activeTab === 'monitoring'"
               [class.border-transparent]="activeTab !== 'monitoring'"
               [class.text-slate-500]="activeTab !== 'monitoring'"
               (click)="activeTab = 'monitoring'"
               class="px-1 py-3 text-sm font-semibold border-b-2 hover:text-slate-900 transition-colors flex items-center gap-2">
               Monitoring
               <span class="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-600 border border-rose-200">5</span>
            </button>
         </div>
      </div>

      <!-- BODY -->
      <div class="flex-1 overflow-y-auto px-6 sm:px-10 py-8 space-y-8 relative z-10 scrollbar-thin max-w-7xl mx-auto w-full">

         <!-- OVERVIEW TAB CONTENT -->
         <div *ngIf="activeTab === 'overview'" class="space-y-8">

         <!-- 1. KPI CARDS (Enriched) -->
         <div class="grid grid-cols-4 gap-6">
            <div *ngFor="let kpi of kpis" class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group cursor-default">
               <div class="flex justify-between items-start mb-4">
                   <div class="p-2 rounded-lg" [ngClass]="'bg-' + kpi.color + '-50 text-' + kpi.color + '-600'">
                      <lucide-icon [name]="kpi.icon" class="w-5 h-5"></lucide-icon>
                   </div>
                   <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-50 text-slate-500 border border-slate-100 group-hover:border-slate-200 transition-colors">YTD</span>
               </div>
               <div class="space-y-1">
                   <div class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{{ kpi.label }}</div>
                   <div class="flex items-baseline gap-2">
                       <span class="text-3xl font-bold text-slate-900 tracking-tight">{{ kpi.value }}</span>
                       <span *ngIf="kpi.subValue" class="text-sm font-medium text-slate-400">{{ kpi.subValue }}</span>
                   </div>
               </div>
               <div class="mt-4 flex items-center gap-2 text-xs font-medium pt-3 border-t border-slate-50">
                   <span [ngClass]="kpi.trendUp ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'" class="px-1.5 py-0.5 rounded flex items-center gap-1">
                       <lucide-icon [name]="kpi.trendUp ? 'trending-up' : 'trending-down'" class="w-3 h-3"></lucide-icon>
                       {{ kpi.trend }}
                   </span>
                   <span class="text-slate-400">vs last month</span>
               </div>
            </div>
         </div>

         <!-- 2. CHARTS & PIPELINE ROW -->
         <div class="grid grid-cols-12 gap-6">
             
             <!-- LEFT: Donut Chart (Classification) -->
             <div class="col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
                 <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6 flex items-center gap-2">
                    <lucide-icon name="pie-chart" class="w-4 h-4 text-slate-400"></lucide-icon> Mix by Class
                 </h3>
                 
                 <div class="flex-1 flex flex-col items-center justify-center relative">
                     <!-- CSS Donut Chart -->
                     <div class="w-40 h-40 rounded-full relative" 
                          style="background: conic-gradient(#8b5cf6 0% 28%, #3b82f6 28% 86%, #10b981 86% 100%)">
                         <!-- Inner Circle -->
                         <div class="absolute inset-4 bg-white rounded-full flex flex-col items-center justify-center">
                             <span class="text-3xl font-bold text-slate-900">42</span>
                             <span class="text-[10px] font-bold text-slate-400 uppercase">Total Active</span>
                         </div>
                     </div>
                 </div>

                 <div class="mt-6 space-y-3">
                     <div class="flex items-center justify-between text-xs">
                         <div class="flex items-center gap-2">
                             <div class="w-2.5 h-2.5 rounded-full bg-purple-500"></div>
                             <span class="font-medium text-slate-600">Complex (L1)</span>
                         </div>
                         <span class="font-bold text-slate-900">28%</span>
                     </div>
                     <div class="flex items-center justify-between text-xs">
                         <div class="flex items-center gap-2">
                             <div class="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                             <span class="font-medium text-slate-600">Standard (L2)</span>
                         </div>
                         <span class="font-bold text-slate-900">58%</span>
                     </div>
                     <div class="flex items-center justify-between text-xs">
                         <div class="flex items-center gap-2">
                             <div class="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                             <span class="font-medium text-slate-600">Light (L3)</span>
                         </div>
                         <span class="font-bold text-slate-900">14%</span>
                     </div>
                 </div>
             </div>

             <!-- MIDDLE: Pipeline Flow (Visual) -->
             <div class="col-span-6 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
                 <div class="flex items-center justify-between mb-8">
                     <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <lucide-icon name="git-merge" class="w-4 h-4 text-slate-400"></lucide-icon> Pipeline Health
                     </h3>
                     <div class="flex gap-2">
                         <span class="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">Avg Cycle: 32d</span>
                     </div>
                 </div>

                 <!-- Flow Chart -->
                 <div class="flex-1 flex items-center relative px-2">
                     <!-- Connector Line -->
                     <div class="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-100 -translate-y-1/2 z-0"></div>

                     <!-- Stages -->
                     <div class="w-full flex justify-between relative z-10">
                         <div *ngFor="let stage of pipelineStages" class="flex flex-col items-center gap-3 group cursor-pointer">
                             <!-- Circle/Node -->
                             <div class="w-12 h-12 rounded-xl border-2 bg-white flex items-center justify-center shadow-sm transition-all duration-300"
                                  [ngClass]="{
                                      'border-slate-200 text-slate-400 group-hover:border-slate-300': stage.status === 'normal',
                                      'border-amber-400 text-amber-600 shadow-amber-100 bg-amber-50': stage.status === 'warning',
                                      'border-rose-500 text-rose-600 shadow-rose-100 bg-rose-50': stage.status === 'danger',
                                      'border-emerald-500 text-emerald-600 shadow-emerald-100 bg-emerald-50': stage.status === 'success'
                                  }">
                                  <span class="text-lg font-bold">{{ stage.count }}</span>
                             </div>
                             
                             <!-- Label -->
                             <div class="text-center space-y-0.5">
                                 <div class="text-xs font-bold text-slate-900">{{ stage.name }}</div>
                                 <div class="text-[10px] font-mono text-slate-400">{{ stage.avgTime }}</div>
                             </div>

                             <!-- Tooltip (Metric) -->
                             <div *ngIf="stage.risk > 0" class="absolute -top-10 bg-rose-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg animate-bounce">
                                 {{ stage.risk }} Delayed
                             </div>
                         </div>
                     </div>
                 </div>
             </div>

             <!-- RIGHT: Bar Chart (Ageing) -->
             <div class="col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
                 <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6 flex items-center gap-2">
                    <lucide-icon name="clock" class="w-4 h-4 text-slate-400"></lucide-icon> Ageing Analysis
                 </h3>
                 
                 <div class="flex-1 flex items-end justify-between gap-3 min-h-[160px]">
                     <div *ngFor="let age of ageing" class="flex-1 flex flex-col items-center gap-2 group">
                         <div class="text-[10px] font-bold text-slate-900 mb-1">{{ age.count }}</div>
                         <div class="w-full rounded-t-lg bg-indigo-600 group-hover:bg-indigo-700 transition-all duration-300" [style.height.px]="age.height">
                         </div>
                         <div class="text-[10px] font-bold text-slate-400 uppercase text-center leading-tight">{{ age.label }}</div>
                     </div>
                 </div>
             </div>
         </div>

         <!-- 3. STRATEGIC INSIGHTS (Clusters & Prospects) -->
         <div class="grid grid-cols-2 gap-6">
             <!-- Market Clusters -->
             <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
                 <div class="flex items-center justify-between mb-6">
                     <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <lucide-icon name="layout-grid" class="w-4 h-4 text-slate-400"></lucide-icon> Market Clusters
                     </h3>
                     <span class="text-xs font-semibold text-slate-500">Theme Concentration</span>
                 </div>
                 
                 <div class="flex-1 grid grid-cols-2 gap-4">
                     <div *ngFor="let cluster of clusters" class="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-md hover:border-slate-200 transition-all cursor-pointer group relative overflow-hidden">
                         <div class="absolute top-0 right-0 w-16 h-16 rounded-bl-full opacity-10 transition-transform group-hover:scale-150" [ngClass]="cluster.color"></div>
                         
                         <div class="relative z-10">
                             <div class="flex justify-between items-start mb-2">
                                 <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-slate-600 border border-slate-100 shadow-sm">{{ cluster.count }} Products</span>
                                 <lucide-icon name="arrow-up-right" class="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors"></lucide-icon>
                             </div>
                             <h4 class="text-sm font-bold text-slate-900 mb-0.5">{{ cluster.name }}</h4>
                             <p class="text-[10px] text-slate-500 mb-3">{{ cluster.growth }} Growth</p>
                             
                             <div class="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                                 <div class="h-full rounded-full" [ngClass]="cluster.color.replace('bg-', 'bg-')" [style.width]="cluster.intensity"></div>
                             </div>
                         </div>
                     </div>
                 </div>
             </div>

             <!-- Product Opportunities (Prospects) -->
             <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
                 <div class="flex items-center justify-between mb-6">
                     <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <lucide-icon name="telescope" class="w-4 h-4 text-slate-400"></lucide-icon> Product Opportunities
                     </h3>
                     <button class="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                         View Pipeline <lucide-icon name="arrow-right" class="w-3 h-3"></lucide-icon>
                     </button>
                 </div>
                 
                 <div class="flex-1 overflow-y-auto pr-2 space-y-3 scrollbar-thin">
                     <div *ngFor="let item of prospects" class="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 hover:border-slate-200 transition-all group cursor-pointer">
                         <div class="flex items-center gap-4">
                             <div class="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-xs group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                 {{ item.prob }}%
                             </div>
                             <div>
                                 <h4 class="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{{ item.name }}</h4>
                                 <p class="text-[10px] text-slate-500 font-medium">{{ item.theme }} • Est. {{ item.estValue }}</p>
                             </div>
                         </div>
                         <div class="flex items-center gap-2">
                             <span class="px-2 py-1 rounded text-[10px] font-bold bg-slate-100 text-slate-500">Pre-Seed</span>
                             <button class="p-1.5 rounded-md hover:bg-white hover:shadow-sm text-slate-400 hover:text-indigo-600 transition-all">
                                 <lucide-icon name="plus" class="w-3.5 h-3.5"></lucide-icon>
                             </button>
                         </div>
                     </div>
                     <div class="p-3 rounded-lg border border-dashed border-slate-200 flex items-center justify-center text-xs font-semibold text-slate-400 hover:text-slate-600 hover:border-slate-300 hover:bg-slate-50 cursor-pointer transition-all gap-2">
                         <lucide-icon name="plus-circle" class="w-3.5 h-3.5"></lucide-icon> Add Prospect
                     </div>
                 </div>
             </div>
         </div>

         <!-- 4. DATA GRID & TOP REVENUE -->
         <div class="grid grid-cols-12 gap-6">
             
             <!-- MAIN TABLE -->
             <div class="col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                 <div class="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
                     <div class="flex items-center gap-3">
                         <div class="p-1.5 bg-slate-100 rounded text-slate-500">
                             <lucide-icon name="list" class="w-4 h-4"></lucide-icon>
                         </div>
                         <h3 class="text-sm font-bold text-slate-900">Active Approvals Queue</h3>
                         <span class="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">14 Active</span>
                     </div>
                     <div class="flex gap-2">
                         <input type="text" placeholder="Search projects..." class="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-200 w-48 transition-all">
                         <button class="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900 transition-colors">
                             <lucide-icon name="filter" class="w-4 h-4"></lucide-icon>
                         </button>
                     </div>
                 </div>

                 <div class="flex-1 overflow-x-auto">
                     <table class="w-full text-left text-xs">
                         <thead class="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold backdrop-blur-sm">
                             <tr>
                                 <th class="px-6 py-3 w-1/3">Project</th>
                                 <th class="px-6 py-3">Manager & Stage</th>
                                 <th class="px-6 py-3 text-right">Age</th>
                                 <th class="px-6 py-3 text-center">Status</th>
                                 <th class="px-6 py-3"></th>
                             </tr>
                         </thead>
                         <tbody class="divide-y divide-slate-100">
                             <tr *ngFor="let row of npaPool.slice(0, 6)" (click)="navigateToDetail(row)" class="hover:bg-slate-50 transition-colors group cursor-pointer">
                                 <td class="px-6 py-4">
                                     <div class="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">{{ row.productName }}</div>
                                     <div class="flex items-center gap-2 mt-1">
                                        <span class="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border"
                                              [ngClass]="{
                                                'bg-purple-50 text-purple-700 border-purple-100': row.classification === 'Complex',
                                                'bg-blue-50 text-blue-700 border-blue-100': row.classification === 'Standard',
                                                'bg-emerald-50 text-emerald-700 border-emerald-100': row.classification === 'Light'
                                              }">{{ row.classification }}</span>
                                        <span class="text-[10px] text-slate-400">{{ row.location }}</span>
                                     </div>
                                 </td>
                                 <td class="px-6 py-4">
                                     <div class="text-slate-700 font-medium">{{ row.productManager }}</div>
                                     <div class="text-slate-400 text-[11px] mt-0.5 flex items-center gap-1.5">
                                         <div class="w-1.5 h-1.5 rounded-full bg-slate-300"></div> {{ row.stage }}
                                     </div>
                                 </td>
                                 <td class="px-6 py-4 text-right font-mono text-slate-500 font-medium">{{ row.ageDays }}d</td>
                                 <td class="px-6 py-4 text-center">
                                     <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border"
                                           [ngClass]="{
                                              'bg-emerald-50 text-emerald-700 border-emerald-100': row.status === 'On Track',
                                              'bg-amber-50 text-amber-700 border-amber-100': row.status === 'At Risk',
                                              'bg-rose-50 text-rose-700 border-rose-100': row.status === 'Delayed'
                                           }">
                                         <span class="w-1.5 h-1.5 rounded-full" [ngClass]="{
                                            'bg-emerald-500': row.status === 'On Track',
                                            'bg-amber-500': row.status === 'At Risk',
                                            'bg-rose-500': row.status === 'Delayed'
                                         }"></span>
                                         {{ row.status }}
                                     </span>
                                 </td>
                                 <td class="px-6 py-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                                     <button class="p-2 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors">
                                         <lucide-icon name="chevron-right" class="w-4 h-4"></lucide-icon>
                                     </button>
                                 </td>
                             </tr>
                         </tbody>
                     </table>
                 </div>
                 <div class="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                     <span class="text-xs text-slate-500 font-medium">Showing 6 of 14 items</span>
                     <div class="flex gap-2">
                         <button class="px-3 py-1 bg-white border border-slate-200 rounded hover:bg-slate-50 text-xs font-semibold text-slate-600 disabled:opacity-50">Previous</button>
                         <button class="px-3 py-1 bg-white border border-slate-200 rounded hover:bg-slate-50 text-xs font-semibold text-slate-600">Next</button>
                     </div>
                 </div>
             </div>

             <!-- RIGHT: Top Revenue Opportunities -->
             <div class="col-span-4 space-y-6">
                 <div class="bg-slate-900 rounded-xl shadow-lg overflow-hidden border border-slate-800 relative">
                     <div class="absolute top-0 right-0 p-24 bg-indigo-600/20 rounded-full blur-3xl -mr-12 -mt-12"></div>
                     
                     <div class="px-6 py-5 border-b border-white/10 relative z-10 flex justify-between items-center">
                         <h3 class="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                            <lucide-icon name="gem" class="w-4 h-4 text-emerald-400"></lucide-icon> Top Revenue
                         </h3>
                         <span class="text-[10px] font-bold text-slate-400 bg-white/10 px-2 py-1 rounded">PROJ. REVENUE</span>
                     </div>
                     
                     <div class="divide-y divide-white/5 relative z-10">
                         <div *ngFor="let item of topRevenue; let i = index" class="p-5 hover:bg-white/5 transition-colors cursor-pointer group">
                             <div class="flex justify-between items-start mb-1">
                                 <div class="flex items-center gap-3">
                                     <span class="text-xs font-mono text-slate-500">#{{i+1}}</span>
                                     <h4 class="font-bold text-white text-sm group-hover:text-indigo-400 transition-colors truncate max-w-[140px]">{{ item.name }}</h4>
                                 </div>
                                 <div class="font-bold text-emerald-400 text-sm shadow-emerald-500/20 drop-shadow-sm">{{ item.revenue }}</div>
                             </div>
                             <div class="flex justify-between items-center mt-2 pl-7">
                                 <span class="text-[10px] text-slate-400">{{ item.owner }} • {{ item.stage }}</span>
                                 <div class="flex items-center gap-2">
                                     <div class="w-16 h-1 bg-slate-700 rounded-full overflow-hidden">
                                         <div class="h-full bg-emerald-500" [style.width.%]="item.progress"></div>
                                     </div>
                                     <span class="text-[10px] font-mono text-slate-500">{{ item.progress }}%</span>
                                 </div>
                             </div>
                         </div>
                     </div>
                     <div class="p-3 bg-white/5 text-center cursor-pointer hover:bg-white/10 transition-colors">
                         <span class="text-xs font-bold text-slate-400">View All Opportunities</span>
                     </div>
                 </div>

                 <!-- Alerts / Notifications Block -->
                 <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                      <div class="flex items-center gap-2 mb-4">
                          <lucide-icon name="bell" class="w-4 h-4 text-slate-400"></lucide-icon>
                          <h4 class="text-xs font-bold text-slate-900 uppercase tracking-wider">Recent Alerts</h4>
                      </div>
                      <div class="space-y-3">
                          <div class="flex gap-3 items-start">
                              <div class="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 flex-none"></div>
                              <div>
                                  <p class="text-xs font-semibold text-slate-800">Risk Assessment Overdue</p>
                                  <p class="text-[10px] text-slate-500">Crypto Custody Prime • 2h ago</p>
                              </div>
                          </div>
                          <div class="flex gap-3 items-start">
                              <div class="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-none"></div>
                              <div>
                                  <p class="text-xs font-semibold text-slate-800">DCE Review Required</p>
                                  <p class="text-[10px] text-slate-500">Credit Link Note • 5h ago</p>
                              </div>
                          </div>
                      </div>
                 </div>
             </div>
         </div>

         </div>
         <!-- END OVERVIEW TAB CONTENT -->

         <!-- NPA POOL TAB CONTENT -->
         <div *ngIf="activeTab === 'npa-pool'" class="space-y-6">

            <!-- Full-Width NPA Pool Table -->
            <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div class="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="p-1.5 bg-slate-100 rounded text-slate-500">
                            <lucide-icon name="list" class="w-4 h-4"></lucide-icon>
                        </div>
                        <h3 class="text-sm font-bold text-slate-900">Complete NPA Pool</h3>
                        <span class="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">{{ npaPool.length }} Total</span>
                    </div>
                    <div class="flex gap-2">
                        <input type="text" placeholder="Search projects..." class="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-200 w-64 transition-all">
                        <button class="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900 transition-colors">
                            <lucide-icon name="filter" class="w-4 h-4"></lucide-icon>
                        </button>
                        <button class="px-4 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center justify-center gap-2">
                            <lucide-icon name="download" class="w-3.5 h-3.5"></lucide-icon> Export
                        </button>
                    </div>
                </div>

                <div class="flex-1 overflow-x-auto scrollbar-thin">
                    <table class="text-left text-xs" style="min-width: 1800px;">
                        <thead class="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold backdrop-blur-sm sticky top-0">
                            <tr>
                                <th class="px-4 py-3 whitespace-nowrap" style="min-width: 200px;">Product Name</th>
                                <th class="px-4 py-3 whitespace-nowrap" style="min-width: 120px;">Location</th>
                                <th class="px-4 py-3 whitespace-nowrap" style="min-width: 150px;">Business Unit</th>
                                <th class="px-4 py-3 whitespace-nowrap" style="min-width: 110px;">Kickoff Date</th>
                                <th class="px-4 py-3 whitespace-nowrap" style="min-width: 140px;">Product Manager</th>
                                <th class="px-4 py-3 whitespace-nowrap" style="min-width: 150px;">PM Team</th>
                                <th class="px-4 py-3 whitespace-nowrap" style="min-width: 110px;">PAC Approval</th>
                                <th class="px-4 py-3 whitespace-nowrap" style="min-width: 140px;">Proposal Preparer</th>
                                <th class="px-4 py-3 whitespace-nowrap" style="min-width: 160px;">Template</th>
                                <th class="px-4 py-3 whitespace-nowrap" style="min-width: 110px;">Classification</th>
                                <th class="px-4 py-3 whitespace-nowrap" style="min-width: 110px;">Stage</th>
                                <th class="px-4 py-3 whitespace-nowrap text-center" style="min-width: 100px;">Status</th>
                                <th class="px-4 py-3 whitespace-nowrap text-right" style="min-width: 70px;">Age</th>
                                <th class="px-4 py-3 whitespace-nowrap" style="min-width: 50px;"></th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100 bg-white">
                            <tr *ngFor="let row of npaPool" (click)="navigateToDetail(row)" class="hover:bg-slate-50 transition-colors group cursor-pointer">
                                <td class="px-4 py-4 whitespace-nowrap">
                                    <div class="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">{{ row.productName }}</div>
                                </td>
                                <td class="px-4 py-4 whitespace-nowrap">
                                    <div class="text-slate-700">{{ row.location }}</div>
                                </td>
                                <td class="px-4 py-4 whitespace-nowrap">
                                    <div class="text-slate-700">{{ row.businessUnit }}</div>
                                </td>
                                <td class="px-4 py-4 whitespace-nowrap">
                                    <div class="text-slate-700 font-mono text-[11px]">{{ row.kickoffDate }}</div>
                                </td>
                                <td class="px-4 py-4 whitespace-nowrap">
                                    <div class="text-slate-700 font-medium">{{ row.productManager }}</div>
                                </td>
                                <td class="px-4 py-4 whitespace-nowrap">
                                    <div class="text-slate-700">{{ row.pmTeam }}</div>
                                </td>
                                <td class="px-4 py-4 whitespace-nowrap">
                                    <div class="text-slate-700">{{ row.pacApproval }}</div>
                                </td>
                                <td class="px-4 py-4 whitespace-nowrap">
                                    <div class="text-slate-700">{{ row.proposalPreparer }}</div>
                                </td>
                                <td class="px-4 py-4 whitespace-nowrap">
                                    <div class="text-slate-700">{{ row.template }}</div>
                                </td>
                                <td class="px-4 py-4 whitespace-nowrap">
                                    <span class="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border"
                                          [ngClass]="{
                                            'bg-purple-50 text-purple-700 border-purple-100': row.classification === 'Complex',
                                            'bg-blue-50 text-blue-700 border-blue-100': row.classification === 'Standard',
                                            'bg-emerald-50 text-emerald-700 border-emerald-100': row.classification === 'Light'
                                          }">{{ row.classification }}</span>
                                </td>
                                <td class="px-4 py-4 whitespace-nowrap">
                                    <div class="text-slate-700 text-[11px]">{{ row.stage }}</div>
                                </td>
                                <td class="px-4 py-4 whitespace-nowrap text-center">
                                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border"
                                          [ngClass]="{
                                             'bg-emerald-50 text-emerald-700 border-emerald-100': row.status === 'On Track',
                                             'bg-amber-50 text-amber-700 border-amber-100': row.status === 'At Risk',
                                             'bg-rose-50 text-rose-700 border-rose-100': row.status === 'Delayed'
                                          }">
                                        <span class="w-1.5 h-1.5 rounded-full" [ngClass]="{
                                           'bg-emerald-500': row.status === 'On Track',
                                           'bg-amber-500': row.status === 'At Risk',
                                           'bg-rose-500': row.status === 'Delayed'
                                        }"></span>
                                        {{ row.status }}
                                    </span>
                                </td>
                                <td class="px-4 py-4 whitespace-nowrap text-right font-mono text-slate-500 font-medium">{{ row.ageDays }}d</td>
                                <td class="px-4 py-4 whitespace-nowrap text-right opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button class="p-2 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors">
                                        <lucide-icon name="chevron-right" class="w-4 h-4"></lucide-icon>
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                    <span class="text-xs text-slate-500 font-medium">Showing {{ npaPool.length }} of {{ npaPool.length }} items</span>
                    <div class="flex gap-2">
                        <button class="px-3 py-1 bg-white border border-slate-200 rounded hover:bg-slate-50 text-xs font-semibold text-slate-600 disabled:opacity-50" disabled>Previous</button>
                        <button class="px-3 py-1 bg-white border border-slate-200 rounded hover:bg-slate-50 text-xs font-semibold text-slate-600" disabled>Next</button>
                    </div>
                </div>
            </div>

         </div>
         <!-- END NPA POOL TAB CONTENT -->

         <!-- MONITORING TAB CONTENT -->
         <div *ngIf="activeTab === 'monitoring'" class="space-y-8">

            <!-- Aggregate KPIs -->
            <div class="grid grid-cols-4 gap-6">
               <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <div class="flex items-center justify-between mb-3">
                     <div class="p-2 rounded-lg bg-rose-50 text-rose-600">
                        <lucide-icon name="alert-triangle" class="w-5 h-5"></lucide-icon>
                     </div>
                     <span class="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">LIVE</span>
                  </div>
                  <div class="text-3xl font-bold text-slate-900">5</div>
                  <div class="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Active Breaches</div>
               </div>
               <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <div class="flex items-center justify-between mb-3">
                     <div class="p-2 rounded-lg bg-amber-50 text-amber-600">
                        <lucide-icon name="clock" class="w-5 h-5"></lucide-icon>
                     </div>
                  </div>
                  <div class="text-3xl font-bold text-slate-900">4.2h</div>
                  <div class="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Avg Resolution Time</div>
               </div>
               <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <div class="flex items-center justify-between mb-3">
                     <div class="p-2 rounded-lg bg-purple-50 text-purple-600">
                        <lucide-icon name="arrow-up-circle" class="w-5 h-5"></lucide-icon>
                     </div>
                  </div>
                  <div class="text-3xl font-bold text-slate-900">2</div>
                  <div class="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Open Escalations</div>
               </div>
               <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <div class="flex items-center justify-between mb-3">
                     <div class="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                        <lucide-icon name="check-circle" class="w-5 h-5"></lucide-icon>
                     </div>
                  </div>
                  <div class="text-3xl font-bold text-slate-900">12</div>
                  <div class="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Launched Products</div>
               </div>
            </div>

            <!-- Agent Health Grid (13 agents across 4 tiers) -->
            <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
               <div class="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
                  <div class="flex items-center gap-3">
                     <div class="p-1.5 bg-indigo-100 rounded text-indigo-600">
                        <lucide-icon name="brain-circuit" class="w-4 h-4"></lucide-icon>
                     </div>
                     <h3 class="text-sm font-bold text-slate-900">Agent Fleet Status</h3>
                     <span class="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold border border-indigo-100">{{ agentsByTier.length }} Tiers / {{ allAgents.length }} Agents</span>
                  </div>
               </div>
               <div class="p-6 space-y-4">
                  <div *ngFor="let tier of agentsByTier">
                     <h4 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Tier {{ tier.tier }} — {{ tier.label }}</h4>
                     <div class="flex flex-wrap gap-2">
                        <div *ngFor="let agent of tier.agents" class="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white transition-colors">
                           <div class="w-7 h-7 rounded-full flex items-center justify-center" [ngClass]="agent.color">
                              <lucide-icon [name]="agent.icon" class="w-3.5 h-3.5"></lucide-icon>
                           </div>
                           <span class="text-xs font-medium text-slate-700">{{ agent.name }}</span>
                           <span class="w-2 h-2 rounded-full bg-green-500"></span>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            <!-- Post-Launch NPA Health Table -->
            <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
               <div class="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
                  <div class="flex items-center gap-3">
                     <div class="p-1.5 bg-slate-100 rounded text-slate-500">
                        <lucide-icon name="activity" class="w-4 h-4"></lucide-icon>
                     </div>
                     <h3 class="text-sm font-bold text-slate-900">Post-Launch NPA Health</h3>
                  </div>
               </div>
               <table class="w-full text-left text-xs">
                  <thead class="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                     <tr>
                        <th class="px-6 py-3">Product</th>
                        <th class="px-6 py-3">Volume (MTD)</th>
                        <th class="px-6 py-3">P&L</th>
                        <th class="px-6 py-3 text-center">Breaches</th>
                        <th class="px-6 py-3 text-center">Health</th>
                     </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                     <tr *ngFor="let npa of launchedNpas" class="hover:bg-slate-50 transition-colors">
                        <td class="px-6 py-4">
                           <div class="font-bold text-slate-900 text-sm">{{ npa.name }}</div>
                           <div class="text-[10px] text-slate-400 mt-0.5">{{ npa.desk }}</div>
                        </td>
                        <td class="px-6 py-4 font-mono text-slate-700">{{ npa.volume }}</td>
                        <td class="px-6 py-4 font-mono" [ngClass]="npa.pnl.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'">{{ npa.pnl }}</td>
                        <td class="px-6 py-4 text-center">
                           <span class="px-2 py-0.5 rounded-full text-[10px] font-bold"
                                 [ngClass]="npa.breachCount > 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'">
                              {{ npa.breachCount }}
                           </span>
                        </td>
                        <td class="px-6 py-4 text-center">
                           <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border"
                                 [ngClass]="{
                                    'bg-emerald-50 text-emerald-700 border-emerald-100': npa.health === 'Healthy',
                                    'bg-amber-50 text-amber-700 border-amber-100': npa.health === 'Warning',
                                    'bg-rose-50 text-rose-700 border-rose-100': npa.health === 'Critical'
                                 }">
                              <span class="w-1.5 h-1.5 rounded-full" [ngClass]="{
                                 'bg-emerald-500': npa.health === 'Healthy',
                                 'bg-amber-500': npa.health === 'Warning',
                                 'bg-rose-500': npa.health === 'Critical'
                              }"></span>
                              {{ npa.health }}
                           </span>
                        </td>
                     </tr>
                  </tbody>
               </table>
            </div>

            <!-- Breach Details -->
            <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
               <h3 class="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <lucide-icon name="shield-alert" class="w-4 h-4 text-rose-500"></lucide-icon>
                  Recent Breaches Across Portfolio
               </h3>
               <div class="space-y-4">
                  <div *ngFor="let breach of monitoringBreaches" class="flex gap-4 p-4 rounded-lg border transition-all"
                       [ngClass]="breach.severity === 'critical' ? 'bg-rose-50/40 border-rose-100' : 'bg-amber-50/40 border-amber-100'">
                     <div class="flex-none pt-0.5">
                        <div class="w-2 h-2 rounded-full mt-1.5" [ngClass]="breach.severity === 'critical' ? 'bg-rose-500' : 'bg-amber-500'"></div>
                     </div>
                     <div class="flex-1">
                        <div class="flex items-center justify-between mb-1">
                           <h4 class="font-bold text-slate-900 text-sm">{{ breach.title }}</h4>
                           <span class="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded"
                                 [ngClass]="breach.severity === 'critical' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'">{{ breach.severity }}</span>
                        </div>
                        <p class="text-xs text-slate-600 mb-1">{{ breach.description }}</p>
                        <div class="flex items-center gap-4 text-[10px] text-slate-400">
                           <span>{{ breach.product }}</span>
                           <span>{{ breach.triggeredAt }}</span>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

         </div>
         <!-- END MONITORING TAB CONTENT -->

      </div>
    </div>
  `,
    styles: [`
    :host { display: block; height: 100%; }
    .scrollbar-thin::-webkit-scrollbar { width: 6px; }
    .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
    .scrollbar-thin::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 3px; }
    .scrollbar-thin::-webkit-scrollbar-thumb:hover { background-color: #94a3b8; }
  `]
})
export class CooNpaDashboardComponent implements OnInit {

    private difyAgentService: DifyAgentService;

    // Agent fleet data
    allAgents: AgentDefinition[] = AGENT_REGISTRY;
    agentsByTier: { tier: number; label: string; agents: AgentDefinition[] }[] = [];

    constructor(private router: Router, private governanceService: AgentGovernanceService, difyAgentService: DifyAgentService) {
        this.difyAgentService = difyAgentService;
        this.agentsByTier = this.difyAgentService.getAgentsByTier();
    }

    navigateToCreate() {
        this.router.navigate(['/agents/npa'], { queryParams: { mode: 'create' } });
    }

    navigateToDetail(npa: NpaItem) {
        if (npa.id) {
            this.router.navigate(['/agents/npa'], { queryParams: { mode: 'detail', projectId: npa.id } });
        } else {
            // Fallback for mock items without ID
            this.router.navigate(['/agents/npa'], { queryParams: { mode: 'detail', projectId: npa.productName } });
        }
    }

    activeTab: 'overview' | 'npa-pool' | 'monitoring' = 'overview';

    kpis: KpiMetric[] = [];
    pipelineStages: any[] = [];
    ageing: any[] = [];
    topRevenue: any[] = [];
    npaPool: NpaItem[] = [];
    clusters: any[] = [];
    prospects: any[] = [];
    launchedNpas: any[] = [];
    monitoringBreaches: any[] = [];

    ngOnInit() {
        this.loadRealData();
    }

    loadRealData() {
        this.governanceService.getProjects().subscribe({
            next: (projects) => {
                // Transform backend data to NpaItem format
                this.npaPool = projects.map(p => ({
                    productName: p.title || 'Untitled',
                    // Store ID separately if possible, or use productName as ID if that was the convention (it's not ideal but fits existing interface)
                    // Better: The interface NpaItem should have an id field. 
                    // For now, let's map ID to productName to ensure uniqueness in navigation if possible, or just add ID to interface.
                    // Let's stick to the interface for now and hijack 'productName' or just map 'id' to 'productName' if compatible?
                    // actually, let's update navigation to use ID.
                    id: p.id,
                    location: p.jurisdictions?.[0] || 'SG',
                    businessUnit: 'Global Fin. Markets', // Default or fetch
                    kickoffDate: new Date(p.created_at).toLocaleDateString(),
                    productManager: p.submitted_by || 'Unknown',
                    pmTeam: 'Digital Assets', // Default
                    pacApproval: 'Pending',
                    proposalPreparer: p.submitted_by || 'Unknown',
                    template: 'Standard NPA',
                    classification: p.npa_type === 'New-to-Group' ? 'Complex' : (p.npa_type === 'NPA Lite' ? 'Light' : 'Standard'),
                    stage: this.mapStage(p.current_stage),
                    status: 'On Track', // Logic needed
                    ageDays: Math.floor((Date.now() - new Date(p.created_at).getTime()) / (1000 * 3600 * 24))
                }));

                this.calculateKPIs();
                this.initializeStaticMockData(); // Keep static charts for now
            },
            error: (err) => console.error('Failed to load projects', err)
        });
    }

    mapStage(backendStage: string): any {
        const map: any = {
            'INITIATION': 'Discovery',
            'PENDING_SIGN_OFFS': 'Sign-Off',
            'APPROVED': 'Launch',
            'RETURNED_TO_MAKER': 'Review'
        };
        return map[backendStage] || 'Discovery';
    }

    calculateKPIs() {
        const activeCount = this.npaPool.length;
        const complexCount = this.npaPool.filter(p => p.classification === 'Complex').length;
        this.kpis = [
            { label: 'Pipeline Value', value: '$' + (activeCount * 3.5).toFixed(1) + 'M', subValue: `${activeCount} Active`, trend: '+12%', trendUp: true, color: 'indigo', icon: 'layers' },
            { label: 'Avg Cycle Time', value: '32 Days', subValue: '-4d YoY', trend: '-8%', trendUp: true, color: 'blue', icon: 'clock' },
            { label: 'Approval Rate', value: '94%', subValue: '178/190', trend: '+2%', trendUp: true, color: 'emerald', icon: 'check-circle' },
            { label: 'Critical Risks', value: '3', subValue: 'Action Req', trend: '+1', trendUp: false, color: 'rose', icon: 'shield-alert' }
        ];
    }

    initializeStaticMockData() {
        this.pipelineStages = [
            { name: 'Discovery', count: 12, avgTime: '5d', risk: 0, status: 'normal' },
            { name: 'DCE Review', count: 8, avgTime: '3d', risk: 1, status: 'warning' },
            { name: 'Risk Assess', count: 14, avgTime: '12d', risk: 3, status: 'danger' },
            { name: 'Governance', count: 5, avgTime: '7d', risk: 0, status: 'normal' },
            { name: 'Sign-Off', count: 3, avgTime: '2d', risk: 0, status: 'success' }
        ];

        this.ageing = [
            { label: '< 30d', count: 28, height: 120 },
            { label: '30-60d', count: 10, height: 60 },
            { label: '60-90d', count: 3, height: 25 },
            { label: '> 90d', count: 1, height: 10 }
        ];

        this.topRevenue = [
            { name: 'Green Bond ETF', owner: 'Sarah J.', stage: 'Risk Assess', revenue: '$15.2M', progress: 65 },
            { name: 'Crypto Custody', owner: 'Mike R.', stage: 'DCE Review', revenue: '$12.8M', progress: 30 },
            { name: 'AI Wealth Advisory', owner: 'Elena T.', stage: 'Discovery', revenue: '$8.5M', progress: 15 },
            { name: 'Digital Asset Fund', owner: 'Sarah J.', stage: 'Discovery', revenue: '$9.1M', progress: 10 },
            { name: 'Algo Trading Bot', owner: 'Elena T.', stage: 'Risk Assess', revenue: '$6.5M', progress: 55 }
        ];



        this.clusters = [
            { name: 'Sustainability (ESG)', growth: '+45%', count: 18, color: 'bg-emerald-500', intensity: '85%' },
            { name: 'Digital Assets', growth: '+120%', count: 12, color: 'bg-indigo-500', intensity: '95%' },
            { name: 'AI Advisory', growth: '+28%', count: 9, color: 'bg-purple-500', intensity: '60%' },
            { name: 'SME Lending', growth: '+12%', count: 24, color: 'bg-blue-500', intensity: '40%' }
        ];

        this.prospects = [
            { name: 'Tokenized Real Estate', theme: 'Digital Assets', prob: 25, estValue: '$45M' },
            { name: 'Carbon Credit Exchange', theme: 'Sustainability', prob: 60, estValue: '$120M' },
            { name: 'Algorithmic FX Hedging', theme: 'AI Advisory', prob: 40, estValue: '$15M' },
            { name: 'Supply Chain Finance 2.0', theme: 'SME Lending', prob: 85, estValue: '$8M' },
            { name: 'Quantum Key Custody', theme: 'Cybersecurity', prob: 10, estValue: '$200M' }
        ];

        this.launchedNpas = [
            { name: 'Multi-Currency Deposit', desk: 'Consumer Banking · Singapore', volume: '$42.8M', pnl: '+$1.2M', breachCount: 0, health: 'Healthy' },
            { name: 'FX Accumulator - USD/SGD', desk: 'Treasury & Markets · Singapore', volume: '$128.5M', pnl: '+$3.8M', breachCount: 2, health: 'Warning' },
            { name: 'Green Bond Framework', desk: 'Corporate Banking · Hong Kong', volume: '$85.2M', pnl: '-$0.4M', breachCount: 3, health: 'Critical' }
        ];

        this.monitoringBreaches = [
            { title: 'Volume Threshold Exceeded', severity: 'critical', description: 'FX Accumulator USD/SGD daily volume exceeded 150% of approved limit ($192M vs $128M cap).', product: 'FX Accumulator - USD/SGD', triggeredAt: '2 hours ago' },
            { title: 'Counterparty Rating Downgrade', severity: 'critical', description: 'Moody\'s downgraded counterparty XYZ Corp from A- to BBB+, triggering mandatory review.', product: 'Green Bond Framework', triggeredAt: '6 hours ago' },
            { title: 'Collateral Coverage Below Threshold', severity: 'warning', description: 'Collateral coverage ratio dropped to 92%, below the 95% minimum requirement.', product: 'Green Bond Framework', triggeredAt: '1 day ago' },
            { title: 'Concentration Limit Warning', severity: 'warning', description: 'Single counterparty exposure approaching 80% of approved concentration limit.', product: 'FX Accumulator - USD/SGD', triggeredAt: '2 days ago' },
            { title: 'P&L Drawdown Alert', severity: 'warning', description: 'Cumulative P&L drawdown of -$0.4M exceeds weekly monitoring threshold of -$0.3M.', product: 'Green Bond Framework', triggeredAt: '3 days ago' }
        ];
    }
}
