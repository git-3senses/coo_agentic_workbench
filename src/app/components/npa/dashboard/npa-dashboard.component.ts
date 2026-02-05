import { Component, EventEmitter, Output, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { RouterModule } from '@angular/router';
import { DifyAgentService, AgentCapability, AgentWorkItem, HealthMetrics } from '../../../services/dify/dify-agent.service';
import { CapabilityCardComponent } from './capability-card.component';
import { WorkItemListComponent } from './work-item-list.component';
import { AgentHealthPanelComponent } from './agent-health-panel.component';

@Component({
   selector: 'app-npa-dashboard',
   standalone: true,
   imports: [
      CommonModule,
      LucideAngularModule,
      RouterModule,
      CapabilityCardComponent,
      WorkItemListComponent,
      AgentHealthPanelComponent
   ],
   template: `
    <div class="min-h-screen bg-slate-50/50 pb-20 font-sans">
      
      <!-- SECTION 1: AGENT HERO & CTA -->
      <div class="bg-white border-b border-gray-200 pt-8 pb-10 px-6 sm:px-10 shadow-sm relative overflow-hidden">
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
                     Your AI assistant for New Product Approvals. I can create NPAs, predict outcomes, validate docs, and orchestrate approvals associated with Dify Agents.
                  </p>
               </div>
               
               <!-- Key Stats Badge -->
               <div class="flex items-center gap-6 text-sm font-medium text-slate-600 bg-slate-50 inline-flex px-4 py-2 rounded-lg border border-slate-200/60">
                  <span class="flex items-center gap-1.5 hover:text-indigo-600 transition-colors cursor-help">
                     <lucide-icon name="database" class="w-4 h-4 text-indigo-500"></lucide-icon>
                     1,784 NPAs Learned
                  </span>
                  <div class="w-px h-4 bg-slate-300"></div>
                  <span class="flex items-center gap-1.5 hover:text-green-600 transition-colors cursor-help">
                     <lucide-icon name="zap" class="w-4 h-4 text-amber-500"></lucide-icon>
                     95% Success Rate
                  </span>
                  <div class="w-px h-4 bg-slate-300"></div>
                  <span class="flex items-center gap-1.5 hover:text-purple-600 transition-colors cursor-help">
                     <lucide-icon name="brain-circuit" class="w-4 h-4 text-purple-500"></lucide-icon>
                     92% Prediction Accuracy
                  </span>
               </div>
            </div>
          </div>

          <!-- Primary CTA -->
          <div class="flex flex-col gap-3 w-full md:w-auto">
             <button (click)="onCreateNew()" class="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-lg shadow-xl shadow-slate-200 transition-all transform hover:-translate-y-0.5 active:translate-y-0 focus:ring-4 focus:ring-slate-100">
                <lucide-icon name="message-square" class="w-6 h-6"></lucide-icon>
                Chat with Agent
                <span class="absolute right-0 top-0 -mt-1 -mr-1 flex h-3 w-3">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
                </span>
             </button>
             <div class="grid grid-cols-2 gap-2">
                <button (click)="onContinueDraft()" class="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center justify-center gap-2">
                   <lucide-icon name="file-edit" class="w-3.5 h-3.5"></lucide-icon> Continue Draft
                </button>
                <button class="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center justify-center gap-2">
                   <lucide-icon name="search" class="w-3.5 h-3.5"></lucide-icon> Search KB
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

        <!-- SECTION 2.5: NPA TASK AGENTS (The Workers) of OLD -->
        <section>
           <div class="flex items-center gap-3 mb-6">
              <div class="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                 <lucide-icon name="bot" class="w-5 h-5"></lucide-icon>
              </div>
              <h2 class="text-sm font-bold text-slate-700 uppercase tracking-widest">
                 NPA Task Agents (Domain Workers)
              </h2>
           </div>
           <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <!-- Agent 1: Product Ideation -->
              <div class="bg-white rounded-lg p-4 border border-slate-200 shadow-sm flex items-center gap-3">
                 <div class="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                    <lucide-icon name="lightbulb" class="w-5 h-5"></lucide-icon>
                 </div>
                 <div>
                    <h4 class="font-bold text-sm text-slate-700">Product Ideation</h4>
                    <p class="text-[10px] text-slate-500 uppercase tracking-wide font-semibold text-green-600">Idle</p>
                 </div>
              </div>
              
              <!-- Agent 2: Classification Router -->
              <div class="bg-white rounded-lg p-4 border border-slate-200 shadow-sm flex items-center gap-3">
                 <div class="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                    <lucide-icon name="git-branch" class="w-5 h-5"></lucide-icon>
                 </div>
                 <div>
                    <h4 class="font-bold text-sm text-slate-700">Class. Router</h4>
                    <p class="text-[10px] text-slate-500 uppercase tracking-wide font-semibold text-green-600">Active</p>
                 </div>
              </div>

               <!-- Agent 3: Template Auto-Fill -->
              <div class="bg-white rounded-lg p-4 border border-slate-200 shadow-sm flex items-center gap-3">
                 <div class="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                    <lucide-icon name="file-edit" class="w-5 h-5"></lucide-icon>
                 </div>
                 <div>
                    <h4 class="font-bold text-sm text-slate-700">Template Auto-Fill</h4>
                    <p class="text-[10px] text-slate-500 uppercase tracking-wide font-semibold text-green-600">Idle</p>
                 </div>
              </div>

               <!-- Agent 4: ML-Based Prediction -->
               <div class="bg-white rounded-lg p-4 border border-slate-200 shadow-sm flex items-center gap-3">
                 <div class="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                    <lucide-icon name="trending-up" class="w-5 h-5"></lucide-icon>
                 </div>
                 <div>
                    <h4 class="font-bold text-sm text-slate-700">ML Prediction</h4>
                    <p class="text-[10px] text-slate-500 uppercase tracking-wide font-semibold text-green-600">Idle</p>
                 </div>
              </div>

               <!-- Agent 5: KB Search -->
               <div class="bg-white rounded-lg p-4 border border-slate-200 shadow-sm flex items-center gap-3">
                 <div class="w-10 h-10 rounded-full bg-fuchsia-50 text-fuchsia-600 flex items-center justify-center border border-fuchsia-100">
                    <lucide-icon name="search" class="w-5 h-5"></lucide-icon>
                 </div>
                 <div>
                    <h4 class="font-bold text-sm text-slate-700">KB Search</h4>
                    <p class="text-[10px] text-slate-500 uppercase tracking-wide font-semibold text-green-600">Idle</p>
                 </div>
              </div>
              
               <!-- Agent 6: Conversational Diligence -->
               <div class="bg-white rounded-lg p-4 border border-slate-200 shadow-sm flex items-center gap-3">
                 <div class="w-10 h-10 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center border border-cyan-100">
                    <lucide-icon name="message-square" class="w-5 h-5"></lucide-icon>
                 </div>
                 <div>
                    <h4 class="font-bold text-sm text-slate-700">Conv. Diligence</h4>
                    <p class="text-[10px] text-slate-500 uppercase tracking-wide font-semibold text-green-600">Idle</p>
                 </div>
              </div>

               <!-- Agent 7: Approval Orchestration -->
               <div class="bg-white rounded-lg p-4 border border-slate-200 shadow-sm flex items-center gap-3">
                 <div class="w-10 h-10 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center border border-slate-100">
                    <lucide-icon name="workflow" class="w-5 h-5"></lucide-icon>
                 </div>
                 <div>
                    <h4 class="font-bold text-sm text-slate-700">Appr. Orchestrator</h4>
                    <p class="text-[10px] text-slate-500 uppercase tracking-wide font-semibold text-green-600 animate-pulse">Orchestrating</p>
                 </div>
              </div>

               <!-- Agent 8: Prohibited List Checker -->
               <div class="bg-white rounded-lg p-4 border border-slate-200 shadow-sm flex items-center gap-3">
                 <div class="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center border border-red-100">
                    <lucide-icon name="shield-alert" class="w-5 h-5"></lucide-icon>
                 </div>
                 <div>
                    <h4 class="font-bold text-sm text-slate-700">Prohibited List</h4>
                    <p class="text-[10px] text-slate-500 uppercase tracking-wide font-semibold text-green-600">Idle</p>
                 </div>
              </div>
           </div>
        </section>

        <!-- SECTION 3: BUILDING BLOCKS (Shared Utilities) -->
        <section>
            <div class="flex items-center justify-between mb-6">
               <div class="flex items-center gap-3">
                  <div class="p-2 bg-slate-200 text-slate-700 rounded-lg">
                     <lucide-icon name="layers" class="w-5 h-5"></lucide-icon>
                  </div>
                  <h2 class="text-sm font-bold text-slate-700 uppercase tracking-widest">
                     Shared Utility Agents
                  </h2>
               </div>
            </div>
            
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
               <!-- Utility Card 1: RAG -->
               <div class="bg-slate-50 border border-slate-200 rounded-lg p-3 hover:bg-white hover:border-slate-300 transition-colors group">
                  <div class="flex items-center justify-between mb-2">
                     <span class="p-1 rounded bg-white border border-slate-200 shadow-sm text-indigo-600">
                        <lucide-icon name="brain-circuit" class="w-3.5 h-3.5"></lucide-icon>
                     </span>
                     <div class="w-2 h-2 rounded-full bg-green-500 shadow-sm shadow-green-200"></div>
                  </div>
                  <h4 class="font-bold text-xs text-slate-700">RAG Engine</h4>
                  <div class="mt-2 space-y-1">
                     <div class="flex justify-between text-[10px] text-slate-500">
                        <span>Queries</span> <span class="font-mono text-slate-900">234</span>
                     </div>
                     <div class="flex justify-between text-[10px] text-slate-500">
                        <span>Hit Rate</span> <span class="font-mono text-slate-900">94%</span>
                     </div>
                  </div>
               </div>

               <!-- Utility Card 2: Doc Processing -->
               <div class="bg-slate-50 border border-slate-200 rounded-lg p-3 hover:bg-white hover:border-slate-300 transition-colors group">
                  <div class="flex items-center justify-between mb-2">
                     <span class="p-1 rounded bg-white border border-slate-200 shadow-sm text-blue-600">
                        <lucide-icon name="scan-search" class="w-3.5 h-3.5"></lucide-icon>
                     </span>
                     <div class="w-2 h-2 rounded-full bg-green-500 shadow-sm shadow-green-200"></div>
                  </div>
                  <h4 class="font-bold text-xs text-slate-700">Doc Processing</h4>
                  <div class="mt-2 space-y-1">
                     <div class="flex justify-between text-[10px] text-slate-500">
                        <span>Parsed</span> <span class="font-mono text-slate-900">89</span>
                     </div>
                     <div class="flex justify-between text-[10px] text-slate-500">
                        <span>Speed</span> <span class="font-mono text-slate-900">8s</span>
                     </div>
                  </div>
               </div>

               <!-- Utility Card 3: State Manager -->
               <div class="bg-slate-50 border border-slate-200 rounded-lg p-3 hover:bg-white hover:border-slate-300 transition-colors group">
                  <div class="flex items-center justify-between mb-2">
                     <span class="p-1 rounded bg-white border border-slate-200 shadow-sm text-slate-600">
                        <lucide-icon name="workflow" class="w-3.5 h-3.5"></lucide-icon>
                     </span>
                     <div class="w-2 h-2 rounded-full bg-green-500 shadow-sm shadow-green-200"></div>
                  </div>
                  <h4 class="font-bold text-xs text-slate-700">State Manager</h4>
                  <div class="mt-2 space-y-1">
                     <div class="flex justify-between text-[10px] text-slate-500">
                        <span>Active</span> <span class="font-mono text-slate-900">23</span>
                     </div>
                     <div class="flex justify-between text-[10px] text-slate-500">
                        <span>Loops</span> <span class="font-mono text-slate-900">2</span>
                     </div>
                  </div>
               </div>
               
               <!-- Utility Card 4: Services -->
               <div class="bg-slate-50 border border-slate-200 rounded-lg p-3 hover:bg-white hover:border-slate-300 transition-colors group">
                  <div class="flex items-center justify-between mb-2">
                     <span class="p-1 rounded bg-white border border-slate-200 shadow-sm text-amber-600">
                        <lucide-icon name="link-2" class="w-3.5 h-3.5"></lucide-icon>
                     </span>
                     <div class="w-2 h-2 rounded-full bg-green-500 shadow-sm shadow-green-200"></div>
                  </div>
                  <h4 class="font-bold text-xs text-slate-700">Integration</h4>
                  <div class="mt-2 space-y-1">
                     <div class="flex justify-between text-[10px] text-slate-500">
                        <span>Calls</span> <span class="font-mono text-slate-900">456</span>
                     </div>
                     <div class="flex justify-between text-[10px] text-slate-500">
                        <span>Latency</span> <span class="font-mono text-slate-900">320ms</span>
                     </div>
                  </div>
               </div>

               <!-- Utility Card 5: Audit -->
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

                <!-- Utility Card 6: Notification -->
               <div class="bg-slate-50 border border-slate-200 rounded-lg p-3 hover:bg-white hover:border-slate-300 transition-colors group">
                  <div class="flex items-center justify-between mb-2">
                     <span class="p-1 rounded bg-white border border-slate-200 shadow-sm text-pink-600">
                        <lucide-icon name="bell" class="w-3.5 h-3.5"></lucide-icon>
                     </span>
                     <div class="w-2 h-2 rounded-full bg-green-500 shadow-sm shadow-green-200"></div>
                  </div>
                  <h4 class="font-bold text-xs text-slate-700">Notification</h4>
                  <div class="mt-2 space-y-1">
                     <div class="flex justify-between text-[10px] text-slate-500">
                        <span>Sent</span> <span class="font-mono text-slate-900">892</span>
                     </div>
                     <div class="flex justify-between text-[10px] text-slate-500">
                        <span>Open Rate</span> <span class="font-mono text-slate-900">68%</span>
                     </div>
                  </div>
               </div>

                <!-- Utility Card 7: Analytics -->
               <div class="bg-slate-50 border border-slate-200 rounded-lg p-3 hover:bg-white hover:border-slate-300 transition-colors group">
                  <div class="flex items-center justify-between mb-2">
                     <span class="p-1 rounded bg-white border border-slate-200 shadow-sm text-sky-600">
                        <lucide-icon name="bar-chart-2" class="w-3.5 h-3.5"></lucide-icon>
                     </span>
                     <div class="w-2 h-2 rounded-full bg-green-500 shadow-sm shadow-green-200"></div>
                  </div>
                  <h4 class="font-bold text-xs text-slate-700">Analytics</h4>
                  <div class="mt-2 space-y-1">
                     <div class="flex justify-between text-[10px] text-slate-500">
                        <span>Metrics</span> <span class="font-mono text-slate-900">45</span>
                     </div>
                     <div class="flex justify-between text-[10px] text-slate-500">
                        <span>Real-time</span> <span class="font-mono text-slate-900">Yes</span>
                     </div>
                  </div>
               </div>

                <!-- Utility Card 8: Loop-Back -->
               <div class="bg-slate-50 border border-slate-200 rounded-lg p-3 hover:bg-white hover:border-slate-300 transition-colors group">
                  <div class="flex items-center justify-between mb-2">
                     <span class="p-1 rounded bg-white border border-slate-200 shadow-sm text-lime-600">
                        <lucide-icon name="refresh-cw" class="w-3.5 h-3.5"></lucide-icon>
                     </span>
                     <div class="w-2 h-2 rounded-full bg-green-500 shadow-sm shadow-green-200"></div>
                  </div>
                  <h4 class="font-bold text-xs text-slate-700">Loop-Back</h4>
                  <div class="mt-2 space-y-1">
                     <div class="flex justify-between text-[10px] text-slate-500">
                        <span>Retries</span> <span class="font-mono text-slate-900">12</span>
                     </div>
                     <div class="flex justify-between text-[10px] text-slate-500">
                        <span>Resolved</span> <span class="font-mono text-slate-900">100%</span>
                     </div>
                  </div>
               </div>

               <!-- Utility Card 9: Data Retrieval -->
               <div class="bg-slate-50 border border-slate-200 rounded-lg p-3 hover:bg-white hover:border-slate-300 transition-colors group">
                  <div class="flex items-center justify-between mb-2">
                     <span class="p-1 rounded bg-white border border-slate-200 shadow-sm text-violet-600">
                        <lucide-icon name="server" class="w-3.5 h-3.5"></lucide-icon>
                     </span>
                     <div class="w-2 h-2 rounded-full bg-green-500 shadow-sm shadow-green-200"></div>
                  </div>
                  <h4 class="font-bold text-xs text-slate-700">Data Retrieval</h4>
                  <div class="mt-2 space-y-1">
                     <div class="flex justify-between text-[10px] text-slate-500">
                        <span>Sources</span> <span class="font-mono text-slate-900">8</span>
                     </div>
                     <div class="flex justify-between text-[10px] text-slate-500">
                        <span>Cache</span> <span class="font-mono text-slate-900">HIT</span>
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

   private difyService = inject(DifyAgentService);

   capabilities$ = this.difyService.getCapabilities();
   workItems$ = this.difyService.getActiveWorkItems();
   healthMetrics$ = this.difyService.getAgentHealth();

   expandedCardId: string | null = null;

   emptyMetrics: HealthMetrics = {
      status: 'down', latency: 0, uptime: 0, activeAgents: 0, totalDecisions: 0
   };

   constructor() { }

   ngOnInit() {
      // Logic to refresh data if needed
   }

   onCreateNew() {
      this.navigateToCreate.emit();
   }

   onContinueDraft() {
      this.navigateToDraft.emit();
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

   onViewAll(section: string) {
      console.log('Viewing all for section:', section);
      // Implementation for routing or modal would go here
   }
}
