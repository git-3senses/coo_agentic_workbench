import { Component, EventEmitter, Output, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { RouterModule } from '@angular/router';
import { DifyAgentService, AgentCapability, AgentWorkItem, HealthMetrics } from '../../../services/dify/dify-agent.service';
import { CapabilityCardComponent } from './capability-card.component';
import { WorkItemListComponent } from './work-item-list.component';
import { AgentHealthPanelComponent } from './agent-health-panel.component';

import { NpaPipelineTableComponent } from './npa-pipeline-table.component';
import { UserService } from '../../../services/user.service';
import { DashboardService } from '../../../services/dashboard.service';
import { NpaService } from '../../../services/npa.service';
import { AGENT_REGISTRY, AgentDefinition } from '../../../lib/agent-interfaces';

@Component({
   selector: 'app-npa-dashboard',
   standalone: true,
   imports: [
      CommonModule,
      LucideAngularModule,
      RouterModule,
      CapabilityCardComponent,
      WorkItemListComponent,
      AgentHealthPanelComponent,
      NpaPipelineTableComponent
   ],
   template: `
    <div class="min-h-screen bg-slate-50/50 pb-20 font-sans">
      
      <!-- SECTION 1: AGENT HERO & CTA -->
      <div class="bg-white border-b border-slate-200 pt-8 pb-10 px-6 sm:px-10 shadow-sm relative overflow-hidden">
        <!-- Background Decoration -->
        <div class="absolute top-0 right-0 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        
        <div class="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
          
          <!-- Identity -->
          <div class="flex items-start gap-6">
            <div class="relative group cursor-pointer">
              <!-- Avatar -->
              <div class="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-200 ring-4 ring-white">
                 <lucide-icon name="bot" class="w-10 h-10 text-white"></lucide-icon>
              </div>
              <!-- Pulse -->
              <div class="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                 <div class="w-4 h-4 bg-green-500 rounded-full ring-2 ring-white animate-pulse"></div>
              </div>
            </div>
            
            <div class="space-y-3">
               <div>
                  <h1 class="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                     NPA Agent
                     <span class="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100 uppercase tracking-wide">v2.1 Online</span>
                  </h1>
                  <p class="text-lg text-slate-500 max-w-2xl leading-relaxed mt-1">
                     Your AI-powered NPA workbench with 13 specialist agents across 4 tiers. Create NPAs, predict outcomes, validate docs, and orchestrate approvals via Dify.
                  </p>
               </div>
               
               <!-- Key Stats Badge -->
               <div class="flex items-center gap-6 text-sm font-medium text-slate-600 bg-slate-50 inline-flex px-4 py-2 rounded-lg border border-slate-200/60">
                  <span class="flex items-center gap-1.5 hover:text-indigo-600 transition-colors cursor-help">
                     <lucide-icon name="database" class="w-4 h-4 text-indigo-500"></lucide-icon>
                     {{ heroActiveNpas }} Active NPAs
                  </span>
                  <div class="w-px h-4 bg-slate-300"></div>
                  <span class="flex items-center gap-1.5 hover:text-green-600 transition-colors cursor-help">
                     <lucide-icon name="zap" class="w-4 h-4 text-amber-500"></lucide-icon>
                     {{ heroApprovalRate }}% Approval Rate
                  </span>
                  <div class="w-px h-4 bg-slate-300"></div>
                  <span class="flex items-center gap-1.5 hover:text-purple-600 transition-colors cursor-help">
                     <lucide-icon name="brain-circuit" class="w-4 h-4 text-purple-500"></lucide-icon>
                     {{ heroAvgCycle }}d Avg Cycle
                  </span>
               </div>
            </div>
          </div>

           <!-- Primary CTA (Only for MAKER) -->
          <div class="flex flex-col gap-3 w-full md:w-auto">
             <button *ngIf="userRole() === 'MAKER'" (click)="onCreateNew()" class="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-dbs-primary hover:bg-dbs-primary-hover text-white rounded-xl font-bold text-lg shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0 focus:ring-4 focus:ring-blue-100">
                <lucide-icon name="message-square" class="w-6 h-6"></lucide-icon>
                Chat with Agent
                <span class="absolute right-0 top-0 -mt-1 -mr-1 flex h-3 w-3">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
                </span>
             </button>
             
             <!-- Alternative CTA for CHECKER/APPROVER -->
             <div *ngIf="userRole() !== 'MAKER'" class="px-6 py-4 bg-slate-100/50 rounded-xl border border-slate-200 text-center">
                <p class="text-sm font-semibold text-slate-500">You are in {{ userRole() }} mode.</p>
                <p class="text-xs text-slate-400">Creation is disabled.</p>
             </div>
             <div class="grid grid-cols-3 gap-2">
                <button (click)="onContinueDraft()" class="px-4 py-2 bg-white border border-dbs-border text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center justify-center gap-2">
                   <lucide-icon name="file-edit" class="w-3.5 h-3.5"></lucide-icon> Continue Draft
                </button>
                <button class="px-4 py-2 bg-white border border-dbs-border text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center justify-center gap-2">
                   <lucide-icon name="search" class="w-3.5 h-3.5"></lucide-icon> Search KB
                </button>
                <button (click)="onSeedDemo()" [disabled]="seedingDemo" class="px-4 py-2 bg-dbs-primary text-white rounded-lg text-sm font-semibold hover:bg-dbs-primary-hover transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-60">
                   <lucide-icon [name]="seedingDemo ? 'loader-2' : 'sparkles'" class="w-3.5 h-3.5" [ngClass]="{'animate-spin': seedingDemo}"></lucide-icon>
                   {{ seedingDemo ? 'Seeding...' : 'Demo NPA' }}
                </button>
             </div>
          </div>
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-6 sm:px-10 space-y-12 mt-12">

        <!-- SECTION 7: AGENT HEALTH & PERFORMANCE (Moved to Top) -->
        <section>
           <app-agent-health-panel [metrics]="(healthMetrics$ | async) || emptyMetrics"></app-agent-health-panel>
        </section>

        <!-- SECTION 2: CAPABILITIES (Dynamically Loaded from Dify) -->
        <section>
           <div class="flex items-center gap-3 mb-6">
              <div class="p-2 bg-blue-100 text-blue-700 rounded-lg">
                 <lucide-icon name="target" class="w-5 h-5"></lucide-icon>
              </div>
              <h2 class="text-sm font-bold text-slate-700 uppercase tracking-widest">
                 Agent Capabilities
              </h2>
           </div>
           
           <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <app-capability-card
                *ngFor="let cap of capabilities$ | async"
                [capability]="cap"
                [isExpanded]="expandedCardId === cap.id"
                (expand)="onCardExpand(cap.id)"
                (action)="onCapabilityAction(cap.id)">
              </app-capability-card>
           </div>
        </section>

        <!-- SECTION 2.5: TIER 3 SPECIALIST WORKERS (hidden) -->
        <section *ngIf="false">
           <div class="flex items-center gap-3 mb-6">
              <div class="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                 <lucide-icon name="bot" class="w-5 h-5"></lucide-icon>
              </div>
              <h2 class="text-sm font-bold text-slate-700 uppercase tracking-widest">
                 Tier 3 — Specialist Workers
              </h2>
              <span class="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold border border-indigo-100">{{ tier3Agents.length }} Agents</span>
           </div>
           <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div *ngFor="let agent of tier3Agents" class="bg-white rounded-lg p-4 border border-slate-200 shadow-sm flex items-center gap-3 hover:shadow-md hover:border-slate-300 transition-all cursor-default group">
                 <div class="w-10 h-10 rounded-full flex items-center justify-center border" [ngClass]="agent.color">
                    <lucide-icon [name]="agent.icon" class="w-5 h-5"></lucide-icon>
                 </div>
                 <div class="min-w-0">
                    <h4 class="font-bold text-sm text-slate-700 truncate">{{ agent.name }}</h4>
                    <p class="text-[10px] uppercase tracking-wide font-semibold text-green-600">Ready</p>
                 </div>
              </div>
           </div>
        </section>

        <!-- SECTION 2.6: TIER 1-2 ORCHESTRATORS + TIER 4 UTILITIES (hidden) -->
        <section *ngIf="false">
           <div class="grid grid-cols-1 md:grid-cols-2 gap-6">

              <!-- Tier 1 + 2: Orchestrators -->
              <div>
                 <div class="flex items-center gap-3 mb-4">
                    <div class="p-2 bg-violet-100 text-violet-700 rounded-lg">
                       <lucide-icon name="brain-circuit" class="w-5 h-5"></lucide-icon>
                    </div>
                    <h2 class="text-sm font-bold text-slate-700 uppercase tracking-widest">
                       Tier 1-2 — Orchestrators
                    </h2>
                 </div>
                 <div class="space-y-3">
                    <div *ngFor="let agent of orchestratorAgents" class="bg-white rounded-lg p-4 border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
                       <div class="w-12 h-12 rounded-xl flex items-center justify-center border" [ngClass]="agent.color">
                          <lucide-icon [name]="agent.icon" class="w-6 h-6"></lucide-icon>
                       </div>
                       <div class="flex-1 min-w-0">
                          <h4 class="font-bold text-sm text-slate-900">{{ agent.name }}</h4>
                          <p class="text-xs text-slate-500 truncate">{{ agent.description }}</p>
                       </div>
                       <div class="flex items-center gap-2">
                          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-600 border border-violet-100">Tier {{ agent.tier }}</span>
                          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-600 border border-green-100">Chatflow</span>
                       </div>
                    </div>
                 </div>
              </div>

              <!-- Tier 4: Shared Utilities -->
              <div>
                 <div class="flex items-center gap-3 mb-4">
                    <div class="p-2 bg-slate-200 text-slate-700 rounded-lg">
                       <lucide-icon name="layers" class="w-5 h-5"></lucide-icon>
                    </div>
                    <h2 class="text-sm font-bold text-slate-700 uppercase tracking-widest">
                       Tier 4 — Shared Utilities
                    </h2>
                 </div>
                 <div class="space-y-3">
                    <div *ngFor="let agent of tier4Agents" class="bg-white rounded-lg p-4 border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
                       <div class="w-12 h-12 rounded-xl flex items-center justify-center border" [ngClass]="agent.color">
                          <lucide-icon [name]="agent.icon" class="w-6 h-6"></lucide-icon>
                       </div>
                       <div class="flex-1 min-w-0">
                          <h4 class="font-bold text-sm text-slate-900">{{ agent.name }}</h4>
                          <p class="text-xs text-slate-500 truncate">{{ agent.description }}</p>
                       </div>
                       <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-600 border border-green-100">Ready</span>
                    </div>
                 </div>
              </div>
           </div>
        </section>

        <!-- SECTION 3: INFRASTRUCTURE (MCP + DB + Services) (hidden) -->
        <section *ngIf="false">
            <div class="flex items-center justify-between mb-6">
               <div class="flex items-center gap-3">
                  <div class="p-2 bg-slate-200 text-slate-700 rounded-lg">
                     <lucide-icon name="layers" class="w-5 h-5"></lucide-icon>
                  </div>
                  <h2 class="text-sm font-bold text-slate-700 uppercase tracking-widest">
                     Infrastructure & Tooling
                  </h2>
               </div>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
               <div class="bg-slate-50 border border-slate-200 rounded-lg p-3 hover:bg-white hover:border-slate-300 transition-colors group">
                  <div class="flex items-center justify-between mb-2">
                     <span class="p-1 rounded bg-white border border-slate-200 shadow-sm text-indigo-600">
                        <lucide-icon name="brain-circuit" class="w-3.5 h-3.5"></lucide-icon>
                     </span>
                     <div class="w-2 h-2 rounded-full bg-green-500 shadow-sm shadow-green-200"></div>
                  </div>
                  <h4 class="font-bold text-xs text-slate-700">Dify LLM Platform</h4>
                  <div class="mt-2 space-y-1">
                     <div class="flex justify-between text-[10px] text-slate-500">
                        <span>Agents</span> <span class="font-mono text-slate-900">13</span>
                     </div>
                     <div class="flex justify-between text-[10px] text-slate-500">
                        <span>Status</span> <span class="font-mono text-slate-900">Online</span>
                     </div>
                  </div>
               </div>

               <div class="bg-slate-50 border border-slate-200 rounded-lg p-3 hover:bg-white hover:border-slate-300 transition-colors group">
                  <div class="flex items-center justify-between mb-2">
                     <span class="p-1 rounded bg-white border border-slate-200 shadow-sm text-blue-600">
                        <lucide-icon name="server" class="w-3.5 h-3.5"></lucide-icon>
                     </span>
                     <div class="w-2 h-2 rounded-full bg-green-500 shadow-sm shadow-green-200"></div>
                  </div>
                  <h4 class="font-bold text-xs text-slate-700">MCP Tools</h4>
                  <div class="mt-2 space-y-1">
                     <div class="flex justify-between text-[10px] text-slate-500">
                        <span>Tools</span> <span class="font-mono text-slate-900">50+</span>
                     </div>
                     <div class="flex justify-between text-[10px] text-slate-500">
                        <span>Port</span> <span class="font-mono text-slate-900">3002</span>
                     </div>
                  </div>
               </div>

               <div class="bg-slate-50 border border-slate-200 rounded-lg p-3 hover:bg-white hover:border-slate-300 transition-colors group">
                  <div class="flex items-center justify-between mb-2">
                     <span class="p-1 rounded bg-white border border-slate-200 shadow-sm text-emerald-600">
                        <lucide-icon name="database" class="w-3.5 h-3.5"></lucide-icon>
                     </span>
                     <div class="w-2 h-2 rounded-full bg-green-500 shadow-sm shadow-green-200"></div>
                  </div>
                  <h4 class="font-bold text-xs text-slate-700">MariaDB</h4>
                  <div class="mt-2 space-y-1">
                     <div class="flex justify-between text-[10px] text-slate-500">
                        <span>Tables</span> <span class="font-mono text-slate-900">42</span>
                     </div>
                     <div class="flex justify-between text-[10px] text-slate-500">
                        <span>Records</span> <span class="font-mono text-slate-900">14.5k</span>
                     </div>
                  </div>
               </div>

               <div class="bg-slate-50 border border-slate-200 rounded-lg p-3 hover:bg-white hover:border-slate-300 transition-colors group">
                  <div class="flex items-center justify-between mb-2">
                     <span class="p-1 rounded bg-white border border-slate-200 shadow-sm text-red-600">
                        <lucide-icon name="shield-check" class="w-3.5 h-3.5"></lucide-icon>
                     </span>
                     <div class="w-2 h-2 rounded-full bg-green-500 shadow-sm shadow-green-200"></div>
                  </div>
                  <h4 class="font-bold text-xs text-slate-700">Audit Logger</h4>
                  <div class="mt-2 space-y-1">
                     <div class="flex justify-between text-[10px] text-slate-500">
                        <span>Logs</span> <span class="font-mono text-slate-900">3.4k</span>
                     </div>
                     <div class="flex justify-between text-[10px] text-slate-500">
                        <span>Coverage</span> <span class="font-mono text-slate-900">100%</span>
                     </div>
                  </div>
               </div>

               <div class="bg-slate-50 border border-slate-200 rounded-lg p-3 hover:bg-white hover:border-slate-300 transition-colors group">
                  <div class="flex items-center justify-between mb-2">
                     <span class="p-1 rounded bg-white border border-slate-200 shadow-sm text-amber-600">
                        <lucide-icon name="link-2" class="w-3.5 h-3.5"></lucide-icon>
                     </span>
                     <div class="w-2 h-2 rounded-full bg-green-500 shadow-sm shadow-green-200"></div>
                  </div>
                  <h4 class="font-bold text-xs text-slate-700">Express Proxy</h4>
                  <div class="mt-2 space-y-1">
                     <div class="flex justify-between text-[10px] text-slate-500">
                        <span>Routes</span> <span class="font-mono text-slate-900">15</span>
                     </div>
                     <div class="flex justify-between text-[10px] text-slate-500">
                        <span>Port</span> <span class="font-mono text-slate-900">3000</span>
                     </div>
                  </div>
               </div>
            </div>
        </section>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
           
           <!-- SECTION 4: KNOWLEDGE BASES (1 Col) -->
           <section class="h-full flex flex-col">
              <div class="flex items-center justify-between mb-6">
                 <div class="flex items-center gap-3">
                    <div class="p-2 bg-purple-100 text-purple-700 rounded-lg">
                       <lucide-icon name="book-open" class="w-5 h-5"></lucide-icon>
                    </div>
                    <h2 class="text-sm font-bold text-slate-700 uppercase tracking-widest">
                       Linked Knowledge Bases
                    </h2>
                 </div>
                 <button class="text-xs font-bold text-purple-600 bg-purple-50 border border-purple-100 px-3 py-1.5 rounded-lg hover:bg-purple-100 transition-colors flex items-center gap-1.5" (click)="onCreateNew()">
                     <lucide-icon name="plus" class="w-3 h-3"></lucide-icon> Add KB
                 </button>
              </div>
              
              <div class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex-1 flex flex-col">
                 <div class="divide-y divide-slate-100">
                    <!-- Item 1 -->
                    <div class="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group">
                       <div class="flex items-center gap-4">
                          <div class="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                             <lucide-icon name="database" class="w-5 h-5"></lucide-icon>
                          </div>
                          <div>
                             <h4 class="text-sm font-bold text-slate-900 group-hover:text-indigo-600">Historical NPAs</h4>
                             <p class="text-xs text-slate-500">1,784 records • Vector Embeddings • Updated 2h ago</p>
                          </div>
                       </div>
                       <div class="flex items-center gap-3">
                          <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700">SYNCED</span>
                          <lucide-icon name="chevron-right" class="w-4 h-4 text-slate-300 group-hover:text-indigo-400"></lucide-icon>
                       </div>
                    </div>

                    <!-- Item 2 -->
                    <div class="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group">
                       <div class="flex items-center gap-4">
                          <div class="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100">
                             <lucide-icon name="file-text" class="w-5 h-5"></lucide-icon>
                          </div>
                          <div>
                             <h4 class="text-sm font-bold text-slate-900 group-hover:text-orange-600">Policy Documents</h4>
                             <p class="text-xs text-slate-500">MAS 656, DBS Risk Framework • 200+ Docs</p>
                          </div>
                       </div>
                       <div class="flex items-center gap-3">
                          <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700">SYNCED</span>
                          <lucide-icon name="chevron-right" class="w-4 h-4 text-slate-300 group-hover:text-orange-400"></lucide-icon>
                       </div>
                    </div>

                    <!-- Item 3 -->
                    <div class="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group">
                       <div class="flex items-center gap-4">
                          <div class="w-10 h-10 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center border border-cyan-100">
                             <lucide-icon name="layout" class="w-5 h-5"></lucide-icon>
                          </div>
                          <div>
                             <h4 class="text-sm font-bold text-slate-900 group-hover:text-cyan-600">Templates Library</h4>
                             <p class="text-xs text-slate-500">15 Forms • Auto-fill ready (47 fields)</p>
                          </div>
                       </div>
                       <div class="flex items-center gap-3">
                          <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700">SYNCED</span>
                          <lucide-icon name="chevron-right" class="w-4 h-4 text-slate-300 group-hover:text-cyan-400"></lucide-icon>
                       </div>
                    </div>

                     <!-- Item 4 (Missing Gap): Product Classifications -->
                    <div class="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group">
                       <div class="flex items-center gap-4">
                          <div class="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                             <lucide-icon name="tag" class="w-5 h-5"></lucide-icon>
                          </div>
                          <div>
                             <h4 class="text-sm font-bold text-slate-900 group-hover:text-emerald-600">Product Classifications</h4>
                             <p class="text-xs text-slate-500">Taxonomy, Asset Classes • Updated Today</p>
                          </div>
                       </div>
                       <div class="flex items-center gap-3">
                          <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700">SYNCED</span>
                          <lucide-icon name="chevron-right" class="w-4 h-4 text-slate-300 group-hover:text-emerald-400"></lucide-icon>
                       </div>
                    </div>
                 </div>
                 <div class="bg-slate-50 px-4 py-2 border-t border-slate-200 text-center mt-auto">
                    <button class="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1 w-full" (click)="onViewAll('kb')">
                       View All Knowledge Sources <lucide-icon name="arrow-right" class="w-3 h-3"></lucide-icon>
                    </button>
                 </div>
              </div>
           </section>

           <!-- SECTION 5: SERVICES (1 Col) -->
           <section class="h-full flex flex-col">
               <div class="flex items-center justify-between mb-6">
                 <div class="flex items-center gap-3">
                    <div class="p-2 bg-amber-100 text-amber-700 rounded-lg">
                       <lucide-icon name="database" class="w-5 h-5"></lucide-icon>
                    </div>
                    <h2 class="text-sm font-bold text-slate-700 uppercase tracking-widest">
                       Connected Services
                    </h2>
                 </div>
                 <button class="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-colors flex items-center gap-1.5" (click)="onCreateNew()">
                     <lucide-icon name="plus" class="w-3 h-3"></lucide-icon> Add Service
                  </button>
              </div>
              
              <div class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex-1 flex flex-col">
                 <div class="p-4 space-y-4 flex-1">
                     <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                           <div class="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-600">
                              <lucide-icon name="activity" class="w-4 h-4"></lucide-icon>
                           </div>
                           <div>
                              <p class="text-sm font-bold text-slate-900">Bloomberg API</p>
                              <p class="text-[10px] text-slate-500">Market Data • 14ms</p>
                           </div>
                        </div>
                        <div class="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>
                     </div>

                     <div class="w-full h-px bg-slate-100"></div>

                     <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                           <div class="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-600">
                              <lucide-icon name="shield" class="w-4 h-4"></lucide-icon>
                           </div>
                           <div>
                              <p class="text-sm font-bold text-slate-900">Policy Engine</p>
                              <p class="text-[10px] text-slate-500">Regulatory • Online</p>
                           </div>
                        </div>
                        <div class="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                     </div>

                     <div class="w-full h-px bg-slate-100"></div>

                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                           <div class="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-600">
                              <lucide-icon name="share-2" class="w-4 h-4"></lucide-icon>
                           </div>
                           <div>
                              <p class="text-sm font-bold text-slate-900">SharePoint</p>
                              <p class="text-[10px] text-slate-500">Docs • Syncing...</p>
                           </div>
                        </div>
                        <div class="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse"></div>
                     </div>

                     <div class="w-full h-px bg-slate-100"></div>

                      <div class="flex items-center justify-between opacity-60">
                        <div class="flex items-center gap-3">
                           <div class="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-600">
                              <lucide-icon name="send" class="w-4 h-4"></lucide-icon>
                           </div>
                           <div>
                              <p class="text-sm font-bold text-slate-900">SendGrid</p>
                              <p class="text-[10px] text-slate-500">Email • Idle</p>
                           </div>
                        </div>
                        <div class="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
                     </div>
                  </div>
                  <div class="bg-slate-50 px-4 py-2 border-t border-slate-200 text-center mt-auto">
                     <button class="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1 w-full" (click)="onViewAll('services')">
                        View All Connected Services <lucide-icon name="arrow-right" class="w-3 h-3"></lucide-icon>
                     </button>
                  </div>
               </div>
            </section>
        </div>

        <!-- SECTION 6: ACTIVE WORK ITEMS (Live from Dify) -->
        <section>
           <div class="flex items-center gap-3 mb-6">
              <div class="p-2 bg-sky-100 text-sky-700 rounded-lg">
                 <lucide-icon name="cpu" class="w-5 h-5"></lucide-icon>
              </div>
              <h2 class="text-sm font-bold text-slate-700 uppercase tracking-widest">
                 Active Agent Work Items
              </h2>
           </div>
           
           <app-work-item-list [items]="(workItems$ | async) || []"></app-work-item-list>
        </section>

        <!-- SECTION 7: NPA PIPELINE TABLE -->
        <section>
           <div class="flex items-center gap-3 mb-6">
              <div class="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                 <lucide-icon name="file-text" class="w-5 h-5"></lucide-icon>
              </div>
              <h2 class="text-sm font-bold text-slate-700 uppercase tracking-widest">
                 NPA Pipeline
              </h2>
           </div>

           <app-npa-pipeline-table (onViewDetail)="onViewDetail($event)"></app-npa-pipeline-table>
        </section>

      </div>
    </div>
  `,
   styles: [`
    :host {
      display: block;
    }
  `]
})
export class NpaDashboardComponent implements OnInit {
   @Output() navigateToCreate = new EventEmitter<void>();
   @Output() navigateToDraft = new EventEmitter<void>();
   @Output() navigateToDetail = new EventEmitter<string>();

   private difyService = inject(DifyAgentService);
   private userService = inject(UserService);
   private dashboardService = inject(DashboardService);
   private npaService = inject(NpaService);

   userRole = () => this.userService.currentUser().role;

   capabilities$ = this.difyService.getCapabilities();
   workItems$ = this.difyService.getActiveWorkItems();
   healthMetrics$ = this.difyService.getAgentHealth();

   expandedCardId: string | null = null;
   seedingDemo = false;

   emptyMetrics: HealthMetrics = {
      status: 'down', latency: 0, uptime: 0, activeAgents: 0, totalAgents: 13, totalDecisions: 0
   };

   // Hero stats (from DashboardService KPIs)
   heroActiveNpas = 0;
   heroApprovalRate = 0;
   heroAvgCycle = 0;

   // Data-driven agent lists from AGENT_REGISTRY
   tier3Agents: AgentDefinition[] = AGENT_REGISTRY.filter(a => a.tier === 3);
   tier4Agents: AgentDefinition[] = AGENT_REGISTRY.filter(a => a.tier === 4);
   orchestratorAgents: AgentDefinition[] = AGENT_REGISTRY.filter(a => a.tier === 1 || a.tier === 2);

   constructor() { }

   ngOnInit() {
      this.loadHeroStats();
   }

   private loadHeroStats() {
      this.dashboardService.getKpis().subscribe({
         next: (kpis) => {
            const find = (label: string) => kpis.find(k => k.label.includes(label));
            const pipeline = find('Pipeline');
            const approval = find('Approval');
            const cycle = find('Cycle');

            // Extract active NPA count from subValue (e.g. "42 Active NPAs")
            if (pipeline?.subValue) {
               const match = pipeline.subValue.match(/(\d+)/);
               if (match) this.heroActiveNpas = parseInt(match[1], 10);
            } else {
               this.heroActiveNpas = Math.round(pipeline?.value || 0);
            }
            this.heroApprovalRate = Math.round(approval?.value || 0);
            this.heroAvgCycle = Math.round(cycle?.value || 0);
         },
         error: (err) => console.warn('[NpaDashboard] Failed to load hero KPIs', err)
      });
   }

   onCreateNew() {
      this.navigateToCreate.emit();
   }

   onContinueDraft() {
      this.navigateToDraft.emit();
   }

   onSeedDemo() {
      this.seedingDemo = true;
      this.npaService.seedDemo().subscribe({
         next: (res) => {
            this.seedingDemo = false;
            console.log('[NpaDashboard] Demo NPA seeded:', res.id);
            this.navigateToDetail.emit(res.id);
         },
         error: (err) => {
            this.seedingDemo = false;
            console.error('[NpaDashboard] Seed demo failed:', err);
         }
      });
   }

   onCardExpand(id: string) {
      if (this.expandedCardId === id) {
         this.expandedCardId = null; // Collapse if already open
      } else {
         this.expandedCardId = id;
      }
   }

   onCapabilityAction(id: string) {
      console.log('[DifyAgentService] Triggering capability:', id);
      if (id === 'create_npa') {
         this.onCreateNew();
      }
   }

   onViewDetail(npaId: string) {
      this.navigateToDetail.emit(npaId);
   }

   onViewAll(section: string) {
      console.log('Viewing all for section:', section);
      // Implementation for routing or modal would go here
   }
}
