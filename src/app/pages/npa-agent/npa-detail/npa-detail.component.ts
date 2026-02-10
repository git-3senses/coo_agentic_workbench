import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { NpaTemplateEditorComponent } from '../npa-template-editor/npa-template-editor.component';

export type DetailTab = 'PRODUCT_SPECS' | 'ANALYSIS' | 'APPROVALS' | 'WORKFLOW' | 'MONITORING' | 'CHAT';

@Component({
   selector: 'app-npa-detail',
   standalone: true,
   imports: [CommonModule, LucideAngularModule, NpaTemplateEditorComponent],
   template: `
    <app-npa-template-editor *ngIf="showTemplateEditor" (close)="showTemplateEditor = false"></app-npa-template-editor>
    
    <!-- FULL SCREEN OVERLAY -->
    <div class="fixed inset-0 z-[100] flex flex-col h-screen w-screen bg-slate-50 overscroll-none font-sans">
      
      <!-- HEADER -->
      <div class="flex-none bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm z-20">
        <div class="flex items-center gap-4">
          <!-- Back Button -->
          <button (click)="onBack.emit()" class="group flex items-center justify-center p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <lucide-icon name="arrow-left" class="w-6 h-6 stroke-[1.5] group-hover:-translate-x-0.5 transition-transform"></lucide-icon>
          </button>
          
          <div>
            <div class="flex items-center gap-3 text-xs text-gray-500 mb-2">
              <span class="font-medium text-gray-400">NPA Pipeline</span>
              <lucide-icon name="chevron-right" class="w-3 h-3 text-gray-300"></lucide-icon>
              <span class="font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded">TSG2025-042</span>
               <span class="flex items-center gap-1.5 ml-2">
                 <lucide-icon name="user" class="w-3 h-3"></lucide-icon>
                 <span class="font-medium text-gray-700">Sarah Lim (SG FX Desk)</span>
               </span>
               <span class="text-gray-300">|</span>
               <span class="text-gray-400">Sub: Dec 16, 09:42 AM</span>
            </div>
            
            <div class="flex items-center gap-3">
              <h1 class="text-lg font-bold text-gray-900 tracking-tight">
                FX Put Option GBP/USD
              </h1>
              <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                {{ approvalTrack }}
              </span>
               <span *ngIf="isCrossBorder" class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                <lucide-icon name="globe" class="w-3 h-3 mr-1"></lucide-icon>
                Cross-Border
              </span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-3">
           <button class="px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200 hover:border-gray-300 flex items-center gap-2">
             <lucide-icon name="help-circle" class="w-4 h-4"></lucide-icon>
             Help
           </button>
           <button class="px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200 hover:border-gray-300 flex items-center gap-2">
             <lucide-icon name="save" class="w-4 h-4"></lucide-icon>
             Save Draft
           </button>
           <div class="h-6 w-px bg-gray-300 mx-1"></div>
           <button class="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100/50">
             Reject
           </button>
           <button class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 shadow-blue-200">
             Approve & Sign-Off
           </button>
        </div>
      </div>

      <!-- MAIN CONTENT GRID -->
      <div class="flex-1 overflow-hidden">
        <div class="grid grid-cols-1 lg:grid-cols-12 h-full">
          
          <!-- LEFT COLUMN: Document Preview (4 cols) -->
          <div class="lg:col-span-4 flex flex-col h-full border-r border-gray-200 bg-white p-0 overflow-hidden">
            
            <!-- Preview Header -->
             <div class="flex-none p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h3 class="font-semibold text-sm flex items-center gap-2 text-gray-900">
                   <div class="p-1.5 bg-white border border-gray-200 rounded-md shadow-sm text-red-500">
                      <lucide-icon name="file-text" class="w-4 h-4"></lucide-icon>
                   </div>
                   Document Preview
                </h3>
             </div>

             <!-- Document Viewer Placeholder -->
             <div class="flex-1 bg-slate-50 relative group overflow-hidden flex flex-col items-center justify-center p-8">
                 <div class="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')] opacity-10"></div>
                 
                 <!-- Hover Overlay -->
                 <div class="absolute inset-0 bg-white/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center z-10 cursor-pointer">
                     <div class="bg-gray-900 text-white px-5 py-2.5 rounded-full text-sm font-medium shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform">
                        Click to expand view
                     </div>
                 </div>
                 
                 <div class="w-48 h-64 bg-white shadow-2xl shadow-gray-300/50 border border-gray-200 rounded-lg p-6 relative transform group-hover:scale-105 transition-transform duration-500 ease-out">
                    <!-- Paper Content Mock -->
                    <div class="space-y-3 opacity-60">
                       <div class="h-2 w-1/3 bg-gray-800 rounded mb-4"></div>
                       <div class="h-1.5 w-full bg-gray-200 rounded"></div>
                       <div class="h-1.5 w-full bg-gray-200 rounded"></div>
                       <div class="h-1.5 w-5/6 bg-gray-200 rounded"></div>
                       <div class="h-1.5 w-full bg-gray-200 rounded mt-4"></div>
                       <div class="h-32 w-full bg-blue-50/50 border border-blue-100 rounded mt-2"></div>
                    </div>
                 </div>
                 <p class="mt-6 text-sm font-medium text-gray-500">FX_Option_Term_Sheet_v1.pdf</p>
             </div>

             <!-- File List (Enriched) -->
             <div class="flex-none bg-white border-t border-gray-200 h-1/3 flex flex-col">
                <div class="px-4 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                   <h4 class="text-xs font-bold text-gray-500 uppercase tracking-wider">Attachments (13)</h4>
                   <button class="p-1 hover:bg-blue-50 text-blue-600 rounded">
                      <lucide-icon name="upload-cloud" class="w-4 h-4"></lucide-icon>
                   </button>
                </div>
                <div class="overflow-y-auto p-2 space-y-1">
                   
                   <!-- File Item: Valid -->
                   <div class="flex items-center p-2 rounded-lg hover:bg-gray-50 cursor-pointer group transition-colors border border-transparent hover:border-gray-200">
                      <div class="w-8 h-8 rounded bg-red-50 text-red-500 flex items-center justify-center mr-3 border border-red-100">
                         <lucide-icon name="file-text" class="w-4 h-4"></lucide-icon>
                      </div>
                      <div class="flex-1 min-w-0">
                         <div class="flex items-center justify-between">
                            <p class="text-sm font-medium text-gray-900 truncate">Term_Sheet_Final.pdf</p>
                            <lucide-icon name="check-circle-2" class="w-3.5 h-3.5 text-green-500"></lucide-icon>
                         </div>
                         <p class="text-xs text-gray-500 flex items-center gap-2">
                            <span>2.4 MB</span>
                            <span class="w-1 h-1 rounded-full bg-gray-300"></span>
                            <span>Product Specs</span>
                         </p>
                      </div>
                   </div>

                   <!-- File Item: Warning -->
                   <div class="flex items-center p-2 rounded-lg hover:bg-gray-50 cursor-pointer group transition-colors">
                      <div class="w-8 h-8 rounded bg-blue-50 text-blue-500 flex items-center justify-center mr-3 border border-blue-100">
                         <lucide-icon name="file-bar-chart-2" class="w-4 h-4"></lucide-icon>
                      </div>
                      <div class="flex-1 min-w-0">
                         <div class="flex items-center justify-between">
                            <p class="text-sm font-medium text-gray-900 truncate">Risk_Assessment_Draft.docx</p>
                            <lucide-icon name="alert-triangle" class="w-3.5 h-3.5 text-amber-500"></lucide-icon>
                         </div>
                         <p class="text-xs text-gray-500 flex items-center gap-2">
                            <span>1.1 MB</span>
                            <span class="w-1 h-1 rounded-full bg-gray-300"></span>
                            <span>Risk Analysis</span>
                         </p>
                      </div>
                   </div>

                    <!-- File Item -->
                   <div class="flex items-center p-2 rounded-lg hover:bg-gray-50 cursor-pointer group transition-colors">
                      <div class="w-8 h-8 rounded bg-green-50 text-green-600 flex items-center justify-center mr-3 border border-green-100">
                         <lucide-icon name="file-check" class="w-4 h-4"></lucide-icon>
                      </div>
                      <div class="flex-1 min-w-0">
                         <div class="flex items-center justify-between">
                            <p class="text-sm font-medium text-gray-900 truncate">Pricing_Model_v2.xlsx</p>
                            <lucide-icon name="check-circle-2" class="w-3.5 h-3.5 text-green-500"></lucide-icon>
                         </div>
                         <p class="text-xs text-gray-500 flex items-center gap-2">
                            <span>8.5 MB</span>
                            <span class="w-1 h-1 rounded-full bg-gray-300"></span>
                            <span>Finance</span>
                         </p>
                      </div>
                   </div>

                </div>
             </div>
          </div>

          <!-- RIGHT COLUMN: Enriched Functional Tabs (8 cols) -->
          <div class="lg:col-span-8 flex flex-col h-full bg-slate-50/50 overflow-hidden relative">
             
             <!-- Tabs Header -->
             <div class="flex-none flex items-center px-6 border-b border-gray-200 bg-white gap-6 overflow-x-auto no-scrollbar shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                <button 
                  *ngFor="let tab of tabs"
                  (click)="activeTab = tab.id"
                  [class]="activeTab === tab.id ? 
                    'border-blue-600 text-blue-700 font-semibold' : 
                    'border-transparent text-gray-500 hover:text-gray-800 font-medium hover:bg-gray-50'"
                  class="flex items-center gap-2 py-4 border-b-2 text-sm transition-all whitespace-nowrap px-2">
                   <lucide-icon [name]="tab.icon" [class]="activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'" class="w-4 h-4"></lucide-icon>
                   {{ tab.label }}
                   <span *ngIf="tab.badge" [class]="getBadgeColor(tab.id)" class="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-gray-100 text-gray-600 font-bold border border-gray-200/50">
                     {{ tab.badge }}
                   </span>
                </button>
             </div>

             <!-- Tab Content Area -->
             <div class="flex-1 overflow-y-auto p-8 scroll-smooth">
                
                <!-- 1. PRODUCT SPECS (Enriched) -->
                <div *ngIf="activeTab === 'PRODUCT_SPECS'" class="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-4xl mx-auto">
                   
                   <!-- Quick Summary Card -->
                   <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <div class="flex items-center justify-between mb-6">
                         <h2 class="text-lg font-bold text-gray-900">Product Attributes</h2>
                         <div class="flex items-center gap-2">
                            <span class="text-xs font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-100">
                               ✅ 78% Auto-Filled
                            </span>
                             <span class="text-xs font-medium text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                               Verified by DocExtraction
                            </span>
                         </div>
                      </div>

                      <div class="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-8">
                         <div *ngFor="let attr of productAttributes" class="group">
                            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                               {{ attr.label }}
                               <lucide-icon *ngIf="attr.confidence > 90" name="sparkles" class="w-3 h-3 text-amber-400 opacity-60"></lucide-icon>
                            </p>
                            <div class="flex items-center gap-2">
                               <p class="text-base font-semibold text-gray-900">{{ attr.value }}</p>
                               <div class="opacity-0 group-hover:opacity-100 transition-opacity bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
                                  {{ attr.confidence }}%
                               </div>
                            </div>
                         </div>
                      </div>
                   </div>

                   <!-- NPA Template Status -->
                   <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div (click)="showTemplateEditor = true" class="bg-white rounded-xl border border-gray-200 p-6 shadow-sm cursor-pointer hover:shadow-md hover:border-blue-300 transition-all group relative">
                         <div class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <lucide-icon name="external-link" class="w-4 h-4 text-blue-500"></lucide-icon>
                         </div>
                         <h3 class="text-sm font-bold text-gray-900 mb-4 group-hover:text-blue-700">Template Completion</h3>
                         <div class="relative w-40 h-40 mx-auto">
                            <!-- Circular Progress Mock -->
                            <svg class="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                               <path class="text-gray-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-width="3.5" />
                               <path class="text-blue-600" stroke-dasharray="78, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-width="3.5" />
                            </svg>
                            <div class="absolute inset-0 flex flex-col items-center justify-center">
                               <span class="text-3xl font-bold text-gray-900">37</span>
                               <span class="text-xs text-gray-500 font-medium uppercase">of 47 Fields</span>
                            </div>
                         </div>
                         <div class="mt-4 text-center">
                            <p class="text-sm text-gray-600">Saved approx. <span class="font-bold text-gray-900">45 minutes</span> of manual entry.</p>
                         </div>
                      </div>

                      <div class="bg-gradient-to-br from-blue-50 to-slate-50 rounded-xl border border-blue-100 p-6">
                         <h3 class="text-sm font-bold text-blue-900 mb-2">KB Source Match</h3>
                         <p class="text-sm text-blue-800/80 mb-4">
                            Data auto-filled based on 94% match with historical NPA:
                         </p>
                         <div class="bg-white rounded-lg p-3 border border-blue-100 shadow-sm flex items-start gap-3">
                            <div class="p-2 bg-blue-100 rounded text-blue-600">
                               <lucide-icon name="database" class="w-5 h-5"></lucide-icon>
                            </div>
                            <div>
                               <p class="text-sm font-bold text-gray-900">TSG1917 - FX Option EUR/USD</p>
                               <p class="text-xs text-gray-500 mt-0.5">Approved: Dec 04, 2024 • Validity: Active</p>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>

                <!-- 2. ANALYSIS (Enriched with predictions) -->
                <div *ngIf="activeTab === 'ANALYSIS'" class="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-4xl mx-auto">
                   
                   <!-- ML Prediction Hero -->
                   <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <!-- Likelihood -->
                      <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
                         <div class="absolute right-0 top-0 p-4 opacity-10">
                            <lucide-icon name="trending-up" class="w-16 h-16 text-green-600"></lucide-icon>
                         </div>
                         <h4 class="text-sm font-medium text-gray-500 mb-2">Approval Likelihood</h4>
                         <div class="flex items-baseline gap-2">
                             <span class="text-4xl font-bold text-gray-900">78%</span>
                             <span class="text-sm font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">High</span>
                         </div>
                         <p class="text-xs text-gray-400 mt-2">Confidence Interval: ±5%</p>
                         <div class="mt-4 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div class="h-full bg-green-500 w-[78%] rounded-full"></div>
                         </div>
                      </div>

                      <!-- Timeline -->
                      <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                         <h4 class="text-sm font-medium text-gray-500 mb-2">Predicted Timeline</h4>
                         <div class="flex items-baseline gap-2">
                             <span class="text-4xl font-bold text-gray-900">4.2</span>
                             <span class="text-sm text-gray-500">Days</span>
                         </div>
                          <p class="text-xs text-gray-400 mt-2">vs 12 Day Baseline (67% faster)</p>
                      </div>

                      <!-- Bottleneck -->
                      <div class="bg-white p-6 rounded-xl border border-red-100 shadow-sm bg-red-50/30">
                         <h4 class="text-sm font-medium text-red-600 mb-2 flex items-center gap-2">
                            <lucide-icon name="alert-circle" class="w-4 h-4"></lucide-icon>
                            Likely Bottleneck
                         </h4>
                         <p class="text-gray-900 font-bold">Finance Dept</p>
                         <p class="text-sm text-gray-600 mt-1">Est. 1.8 Days</p>
                         <p class="text-xs text-gray-500 mt-3 pt-3 border-t border-red-100">
                            Reason: ROAE analysis often requested for >$50M deals.
                         </p>
                      </div>
                   </div>

                   <!-- Recommendations / Flags -->
                   <div>
                       <h3 class="text-sm font-bold text-gray-900 mb-4">Agent Findings (3)</h3>
                       <div class="space-y-4">
                          <!-- Critical Red Flag -->
                          <div class="flex gap-4 p-5 rounded-xl bg-red-50/40 border border-red-100">
                              <div class="flex-none pt-1">
                                 <div class="p-2 bg-white rounded-lg border border-red-100 text-red-600 shadow-sm">
                                    <lucide-icon name="shield-alert" class="w-5 h-5"></lucide-icon>
                                 </div>
                              </div>
                              <div class="flex-1">
                                 <div class="flex items-center justify-between mb-1">
                                    <h4 class="font-bold text-gray-900">Missing Risk Memo</h4>
                                    <span class="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded uppercase tracking-wide">Blocker</span>
                                 </div>
                                 <p class="text-sm text-gray-600 leading-relaxed mb-3">
                                    Global Risk Policy 5.2 requires a Risk Memo for FX Options > $10M notional. This is a hard requirement for Sign-Off.
                                 </p>
                                 <button class="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 group">
                                    Auto-Draft Waiver Request
                                    <lucide-icon name="arrow-right" class="w-4 h-4 group-hover:translate-x-0.5 transition-transform"></lucide-icon>
                                 </button>
                              </div>
                          </div>

                          <!-- Green Flag -->
                           <div class="flex gap-4 p-5 rounded-xl bg-green-50/40 border border-green-100">
                              <div class="flex-none pt-1">
                                 <div class="p-2 bg-white rounded-lg border border-green-100 text-green-600 shadow-sm">
                                    <lucide-icon name="check-circle" class="w-5 h-5"></lucide-icon>
                                 </div>
                              </div>
                              <div class="flex-1">
                                 <h4 class="font-bold text-gray-900 mb-1">Compliance Checks Passed</h4>
                                 <p class="text-sm text-gray-600 leading-relaxed">
                                    Prohibited List Checker (4 Layers), Sanctions Check (OFAC/UN), and Regulatory Check (MAS) all cleared.
                                 </p>
                              </div>
                          </div>
                      </div>
                   </div>
                </div>

                <!-- 3. APPROVALS (New Tab) -->
                <div *ngIf="activeTab === 'APPROVALS'" class="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-4xl mx-auto">
                   
                   <!-- Summary Header -->
                   <div class="bg-gray-900 text-white rounded-xl p-6 shadow-lg flex items-center justify-between">
                      <div>
                         <h3 class="text-lg font-bold">Sign-Off Status</h3>
                         <p class="text-gray-400 text-sm mt-1">Pending 6 Approvals • SLA Expires in 22 Hours</p>
                      </div>
                      <div class="flex items-center gap-3">
                         <div class="text-right">
                             <div class="text-2xl font-bold">0/6</div>
                             <div class="text-xs text-gray-400">Completed</div>
                         </div>
                         <div class="w-12 h-12 rounded-full border-4 border-gray-700 flex items-center justify-center">
                            <div class="w-10 h-10 rounded-full border-4 border-transparent border-t-blue-500 animate-spin"></div>
                         </div>
                      </div>
                   </div>

                   <!-- Approvers List -->
                   <div class="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                      <div class="grid grid-cols-12 bg-gray-50 border-b border-gray-200 px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                         <div class="col-span-4">Department / Approver</div>
                         <div class="col-span-3">Status</div>
                         <div class="col-span-3">Time Elapsed</div>
                         <div class="col-span-2 text-right">Action</div>
                      </div>
                      
                      <div class="divide-y divide-gray-100">
                         <!-- Approver 1: Credit -->
                         <div class="grid grid-cols-12 px-6 py-4 items-center hover:bg-gray-50 transition-colors">
                            <div class="col-span-4">
                               <p class="font-bold text-gray-900">RMG-Credit</p>
                               <p class="text-sm text-gray-500">Jane Tan</p>
                            </div>
                            <div class="col-span-3">
                               <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  Pending Review
                               </span>
                            </div>
                            <div class="col-span-3 text-sm text-gray-600 font-mono">2h 15m</div>
                            <div class="col-span-2 text-right">
                               <button class="text-blue-600 hover:text-blue-800 text-xs font-bold">Nudge</button>
                            </div>
                         </div>

                         <!-- Approver 2: Finance -->
                         <div class="grid grid-cols-12 px-6 py-4 items-center hover:bg-gray-50 transition-colors bg-blue-50/20">
                            <div class="col-span-4 relative">
                               <div class="absolute -left-6 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r"></div>
                               <p class="font-bold text-gray-900">Finance (Product Control)</p>
                               <p class="text-sm text-gray-500">Mark Lee</p>
                            </div>
                            <div class="col-span-3">
                               <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 animate-pulse">
                                  Viewing Now
                               </span>
                            </div>
                            <div class="col-span-3 text-sm text-gray-600 font-mono">2h 12m</div>
                            <div class="col-span-2 text-right">
                               <button class="text-gray-400 hover:text-gray-600 text-xs font-bold" disabled>--</button>
                            </div>
                         </div>
                         
                         <!-- Approver 3: Finance VP -->
                         <div class="grid grid-cols-12 px-6 py-4 items-center hover:bg-gray-50 transition-colors opacity-60">
                            <div class="col-span-4">
                               <p class="font-bold text-gray-900">Finance VP</p>
                               <p class="text-sm text-gray-500">Waiting for Finance...</p>
                            </div>
                            <div class="col-span-3">
                               <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                                  Locked
                               </span>
                            </div>
                            <div class="col-span-3 text-sm text-gray-400 font-mono">--</div>
                            <div class="col-span-2 text-right"></div>
                         </div>
                      </div>
                   </div>
                </div>

                <!-- 4. WORKFLOW (Enriched) -->
                <div *ngIf="activeTab === 'WORKFLOW'" class="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-4xl mx-auto">
                   
                   <div class="relative pl-8 border-l border-gray-200 space-y-12 my-6">
                      
                      <!-- Stage 1: Ingestion (Done) -->
                      <div class="relative group">
                         <div class="absolute -left-[37px] top-0 w-6 h-6 rounded-full bg-blue-600 border-4 border-white shadow-md flex items-center justify-center">
                            <lucide-icon name="check" class="w-3 h-3 text-white"></lucide-icon>
                         </div>
                         <h3 class="text-lg font-bold text-gray-900 mb-1">Stage 1: Initiation</h3>
                         <p class="text-xs text-gray-500 uppercase tracking-wide mb-4">Completed: Dec 16, 09:42 AM (Duration: 38m)</p>
                         
                         <div class="bg-gray-50 rounded-lg p-4 border border-gray-200/60 space-y-3">
                            <div class="flex items-center gap-3">
                               <lucide-icon name="message-square" class="w-4 h-4 text-blue-500"></lucide-icon>
                               <span class="text-sm text-gray-700">Product Ideation Interview</span>
                               <span class="text-xs text-green-600 font-mono ml-auto">COMPLETE</span>
                            </div>
                            <div class="flex items-center gap-3">
                               <lucide-icon name="upload-cloud" class="w-4 h-4 text-blue-500"></lucide-icon>
                               <span class="text-sm text-gray-700">Document Upload (13 Files)</span>
                               <span class="text-xs text-green-600 font-mono ml-auto">COMPLETE</span>
                            </div>
                             <div class="flex items-center gap-3">
                               <lucide-icon name="shield-check" class="w-4 h-4 text-blue-500"></lucide-icon>
                               <span class="text-sm text-gray-700">Prohibited List Check (4 Layers)</span>
                               <span class="text-xs text-green-600 font-mono ml-auto">PASSED</span>
                            </div>
                         </div>
                      </div>

                      <!-- Stage 2: Review (Current) -->
                      <div class="relative group">
                         <div class="absolute -left-[37px] top-0 w-6 h-6 rounded-full bg-white border-[3px] border-blue-600 shadow-md flex items-center justify-center animate-pulse">
                            <div class="w-2 h-2 bg-blue-600 rounded-full"></div>
                         </div>
                         <h3 class="text-lg font-bold text-blue-700 mb-1">Stage 2: Review & Sign-Off</h3>
                         <p class="text-xs text-blue-600 uppercase tracking-wide mb-4">In Progress • Start: Dec 16, 10:00 AM</p>

                          <div class="bg-white rounded-lg p-5 border border-blue-200 shadow-sm space-y-4">
                            <div class="flex items-center gap-3">
                               <lucide-icon name="eye" class="w-4 h-4 text-gray-400"></lucide-icon>
                               <span class="text-sm text-gray-900 font-medium">NPA Champion Review</span>
                               <span class="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded ml-auto">PENDING</span>
                            </div>
                            <div class="pl-7 text-xs text-gray-500 border-l border-gray-100 ml-2">
                               Assigned to: <span class="font-semibold text-gray-700">David Chen</span>
                            </div>
                         </div>
                      </div>

                      <!-- Stage 3: Launch (Future) -->
                      <div class="relative group opacity-50">
                         <div class="absolute -left-[37px] top-0 w-6 h-6 rounded-full bg-gray-200 border-4 border-white shadow-sm"></div>
                         <h3 class="text-lg font-bold text-gray-500 mb-1">Stage 4: Launch</h3>
                         <p class="text-xs text-gray-400 uppercase tracking-wide mb-4">Estimated: Dec 20</p>
                      </div>

                      <!-- Stage 4: Post-Launch Monitoring -->
                      <div class="relative group opacity-40">
                         <div class="absolute -left-[37px] top-0 w-6 h-6 rounded-full bg-gray-200 border-4 border-white shadow-sm"></div>
                         <h3 class="text-lg font-bold text-gray-500 mb-1">Stage 5: Post-Launch Monitoring</h3>
                         <p class="text-xs text-gray-400 uppercase tracking-wide mb-4">Continuous • Starts after Launch</p>
                         <div class="bg-gray-50 rounded-lg p-4 border border-gray-200/60 space-y-3">
                            <div class="flex items-center gap-3">
                               <lucide-icon name="activity" class="w-4 h-4 text-gray-400"></lucide-icon>
                               <span class="text-sm text-gray-500">Breach Monitoring (Volume, Rating, Exposure)</span>
                               <span class="text-xs text-gray-400 font-mono ml-auto">PENDING</span>
                            </div>
                            <div class="flex items-center gap-3">
                               <lucide-icon name="bar-chart-2" class="w-4 h-4 text-gray-400"></lucide-icon>
                               <span class="text-sm text-gray-500">Performance Metrics Tracking</span>
                               <span class="text-xs text-gray-400 font-mono ml-auto">PENDING</span>
                            </div>
                            <div class="flex items-center gap-3">
                               <lucide-icon name="clock" class="w-4 h-4 text-gray-400"></lucide-icon>
                               <span class="text-sm text-gray-500">Periodic Review Triggers (90d / 180d / Annual)</span>
                               <span class="text-xs text-gray-400 font-mono ml-auto">PENDING</span>
                            </div>
                         </div>
                      </div>

                   </div>
                </div>

                <!-- 5. MONITORING (Post-NPA) -->
                <div *ngIf="activeTab === 'MONITORING'" class="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-4xl mx-auto">

                   <!-- Breach Alerts -->
                   <div>
                      <h3 class="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                         <lucide-icon name="alert-triangle" class="w-4 h-4 text-rose-500"></lucide-icon>
                         Active Breach Alerts ({{ breaches.length }})
                      </h3>
                      <div class="space-y-4">
                         <div *ngFor="let breach of breaches" class="rounded-xl border p-5 transition-all"
                              [ngClass]="breach.severity === 'critical' ? 'bg-rose-50/40 border-rose-200' : 'bg-amber-50/40 border-amber-200'">
                            <div class="flex items-start justify-between mb-3">
                               <div class="flex items-center gap-3">
                                  <div class="p-2 rounded-lg bg-white shadow-sm border"
                                       [ngClass]="breach.severity === 'critical' ? 'border-rose-100 text-rose-600' : 'border-amber-100 text-amber-600'">
                                     <lucide-icon [name]="breach.severity === 'critical' ? 'shield-alert' : 'alert-triangle'" class="w-5 h-5"></lucide-icon>
                                  </div>
                                  <div>
                                     <h4 class="font-bold text-gray-900">{{ breach.title }}</h4>
                                     <p class="text-xs text-gray-500 font-mono mt-0.5">{{ breach.id }} • {{ breach.triggeredAt }}</p>
                                  </div>
                               </div>
                               <span class="text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded"
                                     [ngClass]="breach.severity === 'critical' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'">
                                  {{ breach.severity }}
                               </span>
                            </div>
                            <p class="text-sm text-gray-600 leading-relaxed mb-3">{{ breach.description }}</p>
                            <div class="flex items-center justify-between text-xs text-gray-500 pt-3 border-t" [ngClass]="breach.severity === 'critical' ? 'border-rose-100' : 'border-amber-100'">
                               <span>Escalated to: <span class="font-semibold text-gray-700">{{ breach.escalatedTo }}</span></span>
                               <span>SLA: {{ breach.slaHours }}h resolution window</span>
                            </div>
                         </div>
                      </div>
                   </div>

                   <!-- Performance Metrics Grid -->
                   <div>
                      <h3 class="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                         <lucide-icon name="bar-chart-2" class="w-4 h-4 text-blue-500"></lucide-icon>
                         Performance Metrics
                      </h3>
                      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                         <div *ngFor="let metric of monitoringMetrics" class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all">
                            <div class="flex items-center justify-between mb-3">
                               <div class="p-1.5 rounded-lg" [ngClass]="'bg-' + metric.color + '-50 text-' + metric.color + '-600'">
                                  <lucide-icon [name]="metric.icon" class="w-4 h-4"></lucide-icon>
                               </div>
                            </div>
                            <div class="text-2xl font-bold text-gray-900 mb-1">{{ metric.value }}</div>
                            <div class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{{ metric.label }}</div>
                         </div>
                      </div>
                   </div>

                   <!-- Conversational Analytics -->
                   <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                      <h3 class="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                         <lucide-icon name="message-square" class="w-4 h-4 text-indigo-500"></lucide-icon>
                         Ask the Monitoring Agent
                      </h3>
                      <p class="text-sm text-gray-500 mb-4">Query real-time monitoring data, ask about breaches, or request analytics.</p>
                      <div class="relative">
                         <input type="text" placeholder="e.g. What caused the volume breach on Jan 15?" class="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm bg-gray-50">
                         <button class="absolute right-2 top-2 p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg">
                            <lucide-icon name="send" class="w-4 h-4"></lucide-icon>
                         </button>
                      </div>
                   </div>
                </div>

                <!-- 6. CHAT (Existing) -->
                <div *ngIf="activeTab === 'CHAT'" class="h-[calc(100vh-280px)] flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <!-- ... Existing Chat Content ... -->
                   <div class="flex-1 p-6 space-y-6 overflow-y-auto bg-slate-50/50">
                       <div class="flex items-start gap-4">
                          <div class="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-sm">
                             <lucide-icon name="bot" class="w-4 h-4"></lucide-icon>
                          </div>
                          <div class="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-gray-100 max-w-[85%] text-sm text-gray-700 leading-relaxed">
                             <p>Hi Sarah! I noticed this is a $75M FX Option. Based on notional >$50M, Finance VP approval will be required.</p>
                             <p class="mt-2 text-indigo-600 font-medium cursor-pointer hover:underline">Plot ROAE Sensitivity Analysis?</p>
                          </div>
                       </div>
                   </div>
                   <!-- Input -->
                   <div class="p-4 bg-white border-t border-gray-100">
                      <div class="relative">
                         <input type="text" placeholder="Type a message..." class="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm">
                         <button class="absolute right-2 top-2 p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg">
                            <lucide-icon name="send" class="w-4 h-4"></lucide-icon>
                         </button>
                      </div>
                   </div>
                </div>

             </div>
          </div>
        </div>
      </div>
    </div>
  `,
   styles: [`
    .no-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .no-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  `]
})
export class NpaDetailComponent implements OnInit {
   @Input() npaContext: any = null;
   @Output() onBack = new EventEmitter<void>();
   @Input() autoOpenEditor = false;

   activeTab: DetailTab = 'PRODUCT_SPECS';

   ngOnInit() {
      if (this.autoOpenEditor) {
         this.showTemplateEditor = true;
      }
   }

   get isCrossBorder(): boolean {
      return this.npaContext?.isCrossBorder ?? true;
   }

   get approvalTrack(): string {
      return this.npaContext?.track === 'NPA_LITE' ? 'NPA Lite (Variation)' : 'Variation (Medium Risk)';
   }

   tabs: { id: DetailTab, label: string, icon: string, badge?: string }[] = [
      { id: 'PRODUCT_SPECS', label: 'NPA Proposal', icon: 'clipboard-list' },
      { id: 'ANALYSIS', label: 'Analysis & Predictions', icon: 'brain-circuit', badge: '78%' },
      { id: 'APPROVALS', label: 'Sign-Off Status', icon: 'users', badge: '6' },
      { id: 'WORKFLOW', label: 'Workflow', icon: 'git-branch' },
      { id: 'MONITORING', label: 'Monitoring', icon: 'activity', badge: '2' },
      { id: 'CHAT', label: 'Assistant', icon: 'message-square' },
   ];

   productAttributes = [
      { label: 'Product Type', value: 'FX Put Option', confidence: 95 },
      { label: 'Underlying', value: 'GBP / USD', confidence: 99 },
      { label: 'Notional', value: '$75,000,000', confidence: 99 },
      { label: 'Tenor', value: '6 Months', confidence: 99 },
      { label: 'Strike Price', value: '1.2750', confidence: 92 },
      { label: 'Settlement', value: 'Cash (USD)', confidence: 96 },
      { label: 'Counterparty', value: 'Acme Corp (HK)', confidence: 85 },
      { label: 'Credit Rating', value: 'A- (S&P)', confidence: 98 },
      { label: 'Booking Desk', value: 'Singapore FX', confidence: 99 },
   ];

   breaches = [
      {
         id: 'BR-001', title: 'Volume Threshold Breach', severity: 'critical',
         description: 'Daily traded volume exceeded $150M threshold (actual: $187M). Triggered at 14:32 SGT.',
         escalatedTo: 'Head of FX Trading (David Chen)', slaHours: 4, triggeredAt: '2h 15m ago'
      },
      {
         id: 'BR-002', title: 'Counterparty Rating Downgrade', severity: 'warning',
         description: 'Acme Corp (HK) downgraded from A- to BBB+ by S&P. Collateral review required.',
         escalatedTo: 'Credit Risk Team', slaHours: 24, triggeredAt: '6h ago'
      }
   ];

   monitoringMetrics = [
      { label: 'Days Since Launch', value: '42', icon: 'calendar', color: 'blue' },
      { label: 'Total Volume', value: '$2.4B', icon: 'bar-chart-2', color: 'indigo' },
      { label: 'Realized P&L', value: '+$3.2M', icon: 'trending-up', color: 'emerald' },
      { label: 'Active Breaches', value: '2', icon: 'alert-triangle', color: 'rose' },
      { label: 'Counterparty Exposure', value: '$87M', icon: 'users', color: 'purple' },
      { label: 'VaR Utilization', value: '68%', icon: 'gauge', color: 'amber' },
      { label: 'Collateral Posted', value: '$12.5M', icon: 'shield', color: 'cyan' },
      { label: 'Next Review', value: 'Feb 28', icon: 'clock', color: 'slate' }
   ];

   getBadgeColor(tabId: string): string {
      switch (tabId) {
         case 'ANALYSIS': return 'text-green-600 bg-green-100 border-green-200';
         case 'APPROVALS': return 'text-amber-600 bg-amber-100 border-amber-200';
         case 'MONITORING': return 'text-rose-600 bg-rose-100 border-rose-200';
         default: return 'text-gray-600 bg-gray-100';
      }
   }

   showTemplateEditor = false;
}
