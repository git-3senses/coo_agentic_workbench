import { Component, EventEmitter, Input, Output, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { NpaTemplateEditorComponent } from '../npa-template-editor/npa-template-editor.component';
import { ActivatedRoute } from '@angular/router';
import { AgentGovernanceService } from '../../../services/agent-governance.service';
import { NpaWorkflowVisualizerComponent } from '../../../components/npa/npa-workflow-visualizer/npa-workflow-visualizer.component';
import { DocumentDependencyMatrixComponent } from '../../../components/npa/document-dependency-matrix/document-dependency-matrix.component';
import { NpaService } from '../../../services/npa.service';
import { RiskAssessmentResultComponent } from '../../../components/npa/agent-results/risk-assessment-result.component';
import { MlPredictionResultComponent } from '../../../components/npa/agent-results/ml-prediction-result.component';
import { MonitoringAlertsComponent } from '../../../components/npa/agent-results/monitoring-alerts.component';
import { DocCompletenessComponent } from '../../../components/npa/agent-results/doc-completeness.component';
import { DifyService } from '../../../services/dify/dify.service';
import { OrchestratorChatComponent } from '../../../components/npa/ideation-chat/ideation-chat.component';
import { RiskAssessment, MLPrediction, GovernanceState, MonitoringResult, DocCompletenessResult, ClassificationResult, AutoFillSummary } from '../../../lib/agent-interfaces';
import { AutofillSummaryComponent } from '../../../components/npa/agent-results/autofill-summary.component';
import { GovernanceStatusComponent } from '../../../components/npa/agent-results/governance-status.component';
import { ClassificationResultComponent } from '../../../components/npa/agent-results/classification-result.component';
import { catchError, of, timer } from 'rxjs';

export type DetailTab = 'PRODUCT_SPECS' | 'DOCUMENTS' | 'ANALYSIS' | 'APPROVALS' | 'WORKFLOW' | 'MONITORING' | 'CHAT';

@Component({
   selector: 'app-npa-detail',
   standalone: true,
   imports: [
      CommonModule, LucideAngularModule, NpaTemplateEditorComponent, NpaWorkflowVisualizerComponent, DocumentDependencyMatrixComponent,
      RiskAssessmentResultComponent, MlPredictionResultComponent,
      MonitoringAlertsComponent, DocCompletenessComponent, OrchestratorChatComponent,
      AutofillSummaryComponent, GovernanceStatusComponent, ClassificationResultComponent
   ],
   template: `
    <app-npa-template-editor *ngIf="showTemplateEditor" (close)="showTemplateEditor = false" (onSave)="onSave.emit($event)" [inputData]="npaContext"></app-npa-template-editor>
    
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
               <span class="font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded">{{ projectData?.id || projectId }}</span>
               <span class="flex items-center gap-1.5 ml-2">
                 <lucide-icon name="user" class="w-3 h-3"></lucide-icon>
                 <span class="font-medium text-gray-700">Sarah Lim (SG FX Desk)</span>
               </span>
               <span class="text-gray-300">|</span>
               <span class="text-gray-400">Sub: Dec 16, 09:42 AM</span>
            </div>
            
            <div class="flex items-center gap-3">
              <h1 class="text-lg font-bold text-gray-900 tracking-tight">
                {{ projectData?.title || 'Loading Project...' }}
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
             <div class="flex-none flex items-center px-3 border-b border-gray-200 bg-white gap-1 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                <button
                  *ngFor="let tab of tabs"
                  (click)="activeTab = tab.id"
                  [class]="activeTab === tab.id ?
                    'border-blue-600 text-blue-700 font-semibold' :
                    'border-transparent text-gray-500 hover:text-gray-800 font-medium hover:bg-gray-50'"
                  class="flex items-center gap-1.5 py-3 border-b-2 text-xs transition-all whitespace-nowrap px-2 rounded-t">
                   <lucide-icon [name]="tab.icon" [class]="activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'" class="w-3.5 h-3.5"></lucide-icon>
                   {{ tab.label }}
                   <span *ngIf="tab.badge" [class]="getBadgeColor(tab.id)" class="ml-0.5 px-1.5 py-0.5 rounded-full text-[9px] bg-gray-100 text-gray-600 font-bold border border-gray-200/50">
                     {{ tab.badge }}
                   </span>
                </button>
             </div>

             <!-- Tab Content Area -->
             <div class="flex-1 overflow-y-auto p-8 scroll-smooth">
                
                <!-- 1. NPA PROPOSAL (Executive Summary) -->
                <div *ngIf="activeTab === 'PRODUCT_SPECS'" class="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-4xl mx-auto">
                   
                   <!-- Validation Badge -->
                   <div *ngIf="strategicAssessment" class="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start gap-3">
                        <lucide-icon name="info" class="w-5 h-5 text-blue-600 mt-0.5"></lucide-icon>
                        <div>
                            <h3 class="text-sm font-bold text-blue-900">Strategic Alignment Verified</h3>
                            <p class="text-sm text-blue-800 mt-1">{{ parseFindings(strategicAssessment.findings) }}</p>
                        </div>
                        <div class="ml-auto">
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Score: {{ strategicAssessment.score }}/100
                            </span>
                        </div>
                   </div>

                   <!-- Quick Summary Card -->
                   <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <div class="flex items-center justify-between mb-6">
                         <h2 class="text-lg font-bold text-gray-900">Product Attributes</h2>
                         <div class="flex items-center gap-2">
                            <span class="text-xs font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-100">
                               ✅ Auto-Filled
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

                   <!-- AutoFill Agent Results — Donut + Stats (clickable to open NPA Draft overlay) -->
                   <div *ngIf="autoFillSummary" class="mt-6 pt-6 border-t border-gray-200">
                      <h4 class="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                         <lucide-icon name="file-edit" class="w-4 h-4 text-blue-500"></lucide-icon>
                         Template AutoFill Agent
                      </h4>
                      <div (click)="showTemplateEditor = true" class="cursor-pointer hover:ring-2 hover:ring-blue-200 rounded-xl transition-all">
                         <app-autofill-summary [result]="autoFillSummary"></app-autofill-summary>
                      </div>
                      <!-- Open NPA Draft CTA -->
                      <button (click)="showTemplateEditor = true"
                              class="mt-4 w-full flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-sm hover:shadow-md hover:from-blue-700 hover:to-indigo-700 transition-all text-sm font-semibold">
                         <lucide-icon name="file-text" class="w-4 h-4"></lucide-icon>
                         View Full NPA Draft
                         <lucide-icon name="arrow-right" class="w-4 h-4"></lucide-icon>
                      </button>
                   </div>

                   <!-- Loading State: AutoFill agent running -->
                   <div *ngIf="!autoFillSummary" class="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div (click)="showTemplateEditor = true" class="bg-white rounded-xl border border-gray-200 p-6 shadow-sm cursor-pointer hover:shadow-md hover:border-blue-300 transition-all group relative">
                         <h3 class="text-sm font-bold text-gray-900 mb-4 group-hover:text-blue-700">NPA Draft</h3>
                         <div *ngIf="agentLoading['AUTOFILL']" class="flex flex-col items-center justify-center py-8">
                            <lucide-icon name="loader-2" class="w-8 h-8 text-blue-400 animate-spin"></lucide-icon>
                            <p class="mt-4 text-center text-sm text-gray-500">AutoFill agent populating NPA draft...</p>
                         </div>
                         <div *ngIf="agentErrors['AUTOFILL']" class="text-center py-6">
                            <lucide-icon name="alert-circle" class="w-6 h-6 mx-auto mb-2 text-red-400"></lucide-icon>
                            <p class="text-sm text-red-600">{{ agentErrors['AUTOFILL'] }}</p>
                            <button (click)="retryAgent('AUTOFILL'); $event.stopPropagation()" class="mt-2 text-xs text-red-700 bg-red-100 px-3 py-1 rounded-lg hover:bg-red-200">Retry</button>
                         </div>
                         <div *ngIf="!agentLoading['AUTOFILL'] && !agentErrors['AUTOFILL']" class="flex flex-col items-center justify-center py-8">
                            <lucide-icon name="file-edit" class="w-8 h-8 text-gray-300"></lucide-icon>
                            <p class="mt-3 text-sm text-gray-400">Click to view NPA Draft</p>
                         </div>
                      </div>
                      <div class="bg-gradient-to-br from-blue-50 to-slate-50 rounded-xl border border-blue-100 p-6 flex items-center justify-center">
                         <div *ngIf="agentLoading['AUTOFILL']" class="text-center">
                            <lucide-icon name="loader-2" class="w-6 h-6 mx-auto text-blue-400 animate-spin"></lucide-icon>
                            <p class="text-xs text-blue-600 mt-2">Searching knowledge base...</p>
                         </div>
                         <div *ngIf="!agentLoading['AUTOFILL']" class="text-center text-gray-400">
                            <lucide-icon name="database" class="w-6 h-6 mx-auto"></lucide-icon>
                            <p class="text-xs mt-2">KB Source Match</p>
                         </div>
                      </div>
                   </div>

                   <!-- Classification Agent Result -->
                   <div *ngIf="classificationResult" class="mt-8 pt-8 border-t border-gray-200">
                      <h4 class="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                         <lucide-icon name="git-branch" class="w-4 h-4 text-purple-500"></lucide-icon>
                         Classification Agent
                      </h4>
                      <app-classification-result [result]="classificationResult"></app-classification-result>
                   </div>
                   <div *ngIf="!classificationResult && agentLoading['CLASSIFIER']" class="mt-8 pt-8 border-t border-gray-200">
                      <h4 class="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                         <lucide-icon name="git-branch" class="w-4 h-4 text-purple-500"></lucide-icon>
                         Classification Agent
                      </h4>
                      <div class="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center">
                         <lucide-icon name="loader-2" class="w-6 h-6 mx-auto mb-2 text-gray-400 animate-spin"></lucide-icon>
                         <p class="text-sm font-medium text-gray-500">Classification agent analyzing product type...</p>
                      </div>
                   </div>
                </div>

                <!-- 1.5 DOCUMENTS (MATRIX + Doc Lifecycle Agent) -->
                <div *ngIf="activeTab === 'DOCUMENTS'" class="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-4xl mx-auto">
                   <app-document-dependency-matrix [npaContext]="npaContext"></app-document-dependency-matrix>

                   <!-- Document Lifecycle Agent Results -->
                   <div class="mt-8 pt-6 border-t border-gray-200">
                       <h4 class="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                           <lucide-icon name="scan-search" class="w-4 h-4 text-teal-500"></lucide-icon>
                           Document Lifecycle Agent
                       </h4>
                       <app-doc-completeness *ngIf="docCompleteness" [result]="docCompleteness"></app-doc-completeness>
                       <div *ngIf="!docCompleteness" class="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center text-gray-500">
                           <lucide-icon name="loader-2" class="w-6 h-6 mx-auto mb-2 text-gray-400 animate-spin"></lucide-icon>
                           <p class="text-sm font-medium">Document completeness analysis will appear once the agent runs.</p>
                       </div>
                   </div>
                </div>

                <!-- 2. ANALYSIS (Detailed Risk & Ops) -->
                <div *ngIf="activeTab === 'ANALYSIS'" class="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-4xl mx-auto">
                   
                   <!-- RISK ANALYSIS SECTION -->
                   <div>
                       <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                           <lucide-icon name="shield-alert" class="w-5 h-5 text-slate-500"></lucide-icon>
                           Risk Analysis
                       </h3>
                       <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div *ngFor="let assessment of riskAssessments" class="rounded-xl border p-4 transition-all" [ngClass]="getAssessmentColor(assessment.status)">
                               <div class="flex items-center justify-between mb-2">
                                   <div class="flex items-center gap-2">
                                       <span class="text-xs font-bold px-2 py-0.5 rounded bg-white/50 border border-black/5">
                                           {{ assessment.domain }}
                                       </span>
                                       <span class="text-[10px] font-bold uppercase tracking-wide opacity-80">
                                           {{ assessment.status }}
                                       </span>
                                   </div>
                                   <span class="text-xl font-bold opacity-40">{{ assessment.score }}</span>
                               </div>
                               <p class="text-sm font-medium leading-relaxed">
                                   {{ parseFindings(assessment.findings) }}
                               </p>
                           </div>
                       </div>
                   </div>

                   <!-- OPERATIONAL READINESS SECTION -->
                   <div>
                       <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                           <lucide-icon name="settings" class="w-5 h-5 text-slate-500"></lucide-icon>
                           Operational Readiness
                       </h3>
                       <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div *ngFor="let assessment of opsAssessments" class="rounded-xl border p-4 transition-all" [ngClass]="getAssessmentColor(assessment.status)">
                               <div class="flex items-center justify-between mb-2">
                                   <div class="flex items-center gap-2">
                                       <span class="text-xs font-bold px-2 py-0.5 rounded bg-white/50 border border-black/5">
                                           {{ assessment.domain }}
                                       </span>
                                       <span class="text-[10px] font-bold uppercase tracking-wide opacity-80">
                                           {{ assessment.status }}
                                       </span>
                                   </div>
                                   <span class="text-xl font-bold opacity-40">{{ assessment.score }}</span>
                               </div>
                               <p class="text-sm font-medium leading-relaxed">
                                   {{ parseFindings(assessment.findings) }}
                               </p>
                           </div>
                       </div>
                   </div>

                   <!-- AI PREDICTION (Agent-Driven) -->
                   <div class="mt-8 pt-8 border-t border-gray-200">
                       <h4 class="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                           <lucide-icon name="trending-up" class="w-4 h-4 text-amber-500"></lucide-icon>
                           ML Prediction Agent
                       </h4>
                       <app-ml-prediction-result *ngIf="mlPrediction" [result]="mlPrediction"></app-ml-prediction-result>
                       <div *ngIf="!mlPrediction" class="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center text-gray-500">
                           <lucide-icon name="loader-2" class="w-6 h-6 mx-auto mb-2 text-gray-400 animate-spin"></lucide-icon>
                           <p class="text-sm font-medium">ML Prediction results will appear here once the agent runs.</p>
                       </div>
                   </div>

                   <!-- Risk Agent (4-Layer Cascade) -->
                   <div class="mt-8 pt-8 border-t border-gray-200">
                       <h4 class="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                           <lucide-icon name="shield-alert" class="w-4 h-4 text-red-500"></lucide-icon>
                           Risk Agent — 4-Layer Cascade
                       </h4>
                       <app-risk-assessment-result *ngIf="riskAssessmentResult" [result]="riskAssessmentResult"></app-risk-assessment-result>
                       <div *ngIf="!riskAssessmentResult" class="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center text-gray-500">
                           <p class="text-sm font-medium">Risk assessment will appear here once the agent runs.</p>
                       </div>
                   </div>
                </div>

                <!-- 3. APPROVALS (Agent-Driven) -->
                <div *ngIf="activeTab === 'APPROVALS'" class="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-4xl mx-auto">

                   <!-- Governance Agent Results -->
                   <div *ngIf="governanceState">
                      <h4 class="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                         <lucide-icon name="workflow" class="w-4 h-4 text-slate-500"></lucide-icon>
                         Governance Agent — Sign-Off Status
                      </h4>
                      <app-governance-status [result]="governanceState"></app-governance-status>
                   </div>

                   <!-- Loading State -->
                   <div *ngIf="!governanceState && agentLoading['GOVERNANCE']" class="bg-gray-50 rounded-xl border border-gray-200 p-12 text-center">
                      <lucide-icon name="loader-2" class="w-8 h-8 mx-auto mb-3 text-gray-400 animate-spin"></lucide-icon>
                      <p class="text-sm font-medium text-gray-500">Governance agent is analyzing sign-off requirements...</p>
                      <p class="text-xs text-gray-400 mt-1">This may take 30-60 seconds</p>
                   </div>

                   <!-- Error State -->
                   <div *ngIf="!governanceState && !agentLoading['GOVERNANCE'] && agentErrors['GOVERNANCE']"
                        class="bg-red-50 rounded-xl border border-red-200 p-8 text-center">
                      <lucide-icon name="alert-circle" class="w-8 h-8 mx-auto mb-3 text-red-400"></lucide-icon>
                      <p class="text-sm font-medium text-red-600">Governance agent encountered an error</p>
                      <p class="text-xs text-red-500 mt-1">{{ agentErrors['GOVERNANCE'] }}</p>
                      <button (click)="retryAgent('GOVERNANCE')"
                              class="mt-3 px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors">
                         Retry
                      </button>
                   </div>

                   <!-- Fallback: Not yet run -->
                   <div *ngIf="!governanceState && !agentLoading['GOVERNANCE'] && !agentErrors['GOVERNANCE']"
                        class="bg-gray-50 rounded-xl border border-gray-200 p-12 text-center text-gray-500">
                      <lucide-icon name="workflow" class="w-8 h-8 mx-auto mb-3 text-gray-300"></lucide-icon>
                      <p class="text-sm font-medium">Governance analysis has not yet run for this NPA.</p>
                   </div>
                </div>

                <!-- 4. WORKFLOW (Enriched) -->
                <div *ngIf="activeTab === 'WORKFLOW'" class="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-4xl mx-auto">
                   
                   <div class="my-6">
                      <app-npa-workflow-visualizer></app-npa-workflow-visualizer>
                   </div>
                </div>

                <!-- 5. MONITORING (Agent-Driven) -->
                <div *ngIf="activeTab === 'MONITORING'" class="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-4xl mx-auto">

                   <!-- Monitoring Agent Results (takes priority) -->
                   <div *ngIf="monitoringResult">
                      <h4 class="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                         <lucide-icon name="activity" class="w-4 h-4 text-emerald-500"></lucide-icon>
                         Post-Launch Monitoring Agent
                      </h4>
                      <app-monitoring-alerts [result]="monitoringResult"></app-monitoring-alerts>
                   </div>

                   <!-- Loading State -->
                   <div *ngIf="!monitoringResult && agentLoading['MONITORING']" class="bg-gray-50 rounded-xl border border-gray-200 p-12 text-center">
                      <lucide-icon name="loader-2" class="w-8 h-8 mx-auto mb-3 text-gray-400 animate-spin"></lucide-icon>
                      <p class="text-sm font-medium text-gray-500">Monitoring agent analyzing post-launch metrics...</p>
                   </div>

                   <!-- Error State -->
                   <div *ngIf="!monitoringResult && !agentLoading['MONITORING'] && agentErrors['MONITORING']"
                        class="bg-red-50 rounded-xl border border-red-200 p-8 text-center">
                      <lucide-icon name="alert-circle" class="w-8 h-8 mx-auto mb-3 text-red-400"></lucide-icon>
                      <p class="text-sm font-medium text-red-600">{{ agentErrors['MONITORING'] }}</p>
                      <button (click)="retryAgent('MONITORING')" class="mt-3 px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200">Retry</button>
                   </div>

                   <!-- Fallback: Static metrics when agent hasn't returned -->
                   <div *ngIf="!monitoringResult && !agentLoading['MONITORING'] && !agentErrors['MONITORING']">
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

                <!-- 6. CHAT (Live Agent — continues from ideation conversation) -->
                <div *ngIf="activeTab === 'CHAT'" class="h-[calc(100vh-280px)] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <app-orchestrator-chat
                        [initialConversationId]="npaContext?.conversationId"
                        [initialSessionId]="npaContext?.sessionId"
                        [defaultAgent]="'NPA_ORCHESTRATOR'"
                        [contextLabel]="'NPA: ' + (projectData?.title || npaContext?.title || 'Draft')"
                        class="flex-1">
                    </app-orchestrator-chat>
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
   @Output() onSave = new EventEmitter<any>(); // Emit draft data
   @Input() autoOpenEditor = false;

   activeTab: DetailTab = 'PRODUCT_SPECS';

   // Add properties for real data
   projectId: string | null = null;
   projectData: any = null;
   currentStage: string = 'Discovery';

   // Agent result properties
   mlPrediction: MLPrediction | null = null;
   riskAssessmentResult: RiskAssessment | null = null;
   monitoringResult: MonitoringResult | null = null;
   governanceState: GovernanceState | null = null;
   docCompleteness: DocCompletenessResult | null = null;
   classificationResult: ClassificationResult | null = null;
   autoFillSummary: AutoFillSummary | null = null;

   // Agent loading/error states
   agentLoading: Record<string, boolean> = {};
   agentErrors: Record<string, string> = {};

   constructor(
      private route: ActivatedRoute,
      private governanceService: AgentGovernanceService,
      private difyService: DifyService
   ) { }

   private _agentsLaunched = false;

   ngOnInit() {
      if (this.autoOpenEditor) {
         this.showTemplateEditor = true;
      }

      // Determine projectId from @Input or queryParams — load details ONCE
      const loadOnce = (id: string) => {
         if (this.projectId === id && this._agentsLaunched) return; // already loaded
         this.projectId = id;
         this.loadProjectDetails(id);
      };

      // If npaContext was passed via @Input (from CTA card click), use its npaId
      if (this.npaContext?.npaId) {
         loadOnce(this.npaContext.npaId);
      }

      this.route.queryParams.subscribe(params => {
         const id = params['projectId'] || params['npaId'];
         if (id) loadOnce(id);
      });
   }

   private npaService = inject(NpaService);

   // Form sections loaded from API
   sections: any[] = [];
   intakeAssessments: any[] = [];
   strategicAssessment: any = null;

   loadProjectDetails(id: string) {
      this.governanceService.getProjectDetails(id).subscribe({
         next: (data) => {
            this.projectData = data;
            this.currentStage = data.current_stage;
            this.mapBackendDataToView(data);
            this.runAgentAnalysis();
         },
         error: (err) => console.error('Failed to load project details', err)
      });

      // Load real form sections from API
      this.npaService.getFormSections(id).subscribe({
         next: (sections) => {
            this.sections = (sections || []).map((s: any) => ({
               id: s.section_id,
               title: s.title,
               description: s.description,
               fields: (s.fields || []).map((f: any) => ({
                  key: f.field_key,
                  label: f.label,
                  value: f.value || '',
                  lineage: f.lineage || 'MANUAL',
                  type: f.field_type || 'text',
                  required: f.is_required,
                  tooltip: f.tooltip,
                  options: (f.options || []).map((o: any) => o.label || o.value),
               }))
            }));
         },
         error: (err) => console.warn('Could not load form sections, using empty', err)
      });
   }

   mapBackendDataToView(data: any) {
      // Map Intake Assessments (Golden Source)
      if (data.intake_assessments) {
         this.intakeAssessments = data.intake_assessments;
         this.strategicAssessment = this.intakeAssessments.find(a => a.domain === 'STRATEGIC');
      }

      // Map Form Data to Product Attributes (Part A: key summary fields only)
      // Part C (full NPA draft) is accessed via the "View Full NPA Draft" overlay
      const partAKeys = [
         'product_name', 'product_type', 'desk', 'business_unit',
         'notional_amount', 'tenor', 'underlying_asset',
         'product_manager_name', 'group_product_head', 'proposal_preparer',
         'npa_process_type', 'business_case_status', 'approving_authority',
         'kickoff_date', 'risk_classification', 'booking_entity',
         'counterparty_rating', 'settlement_method'
      ];
      if (data.formData && data.formData.length > 0) {
         this.productAttributes = data.formData
            .filter((f: any) => partAKeys.includes(f.field_key))
            .map((f: any) => ({
               label: this.formatLabel(f.field_key),
               value: f.field_value?.length > 200 ? f.field_value.substring(0, 200) + '...' : f.field_value,
               confidence: f.confidence_score
            }));
      }

      // Pre-populate governanceState from DB signoffs (agent may overwrite later)
      if (data.signoffs && data.signoffs.length > 0) {
         const slaBreachedCount = data.signoffs.filter((s: any) => s.sla_breached).length;
         const approvedCount = data.signoffs.filter((s: any) => s.status === 'APPROVED').length;
         const totalCount = data.signoffs.length;
         this.governanceState = {
            signoffs: data.signoffs.map((s: any) => ({
               department: s.party || s.department,
               status: s.status || 'PENDING',
               assignee: s.approver_name || s.approver_user_id,
               slaDeadline: s.sla_deadline,
               slaBreached: !!s.sla_breached,
               decidedAt: s.decision_date
            })),
            slaStatus: slaBreachedCount > 0 ? 'breached' : (approvedCount > totalCount / 2 ? 'on_track' : 'at_risk'),
            loopBackCount: data.loopbacks?.length || 0,
            circuitBreaker: false,
            circuitBreakerThreshold: 3
         } as GovernanceState;
      }

      // Pre-populate docCompleteness from DB documents
      if (data.documents && data.documents.length > 0) {
         const validDocs = data.documents.filter((d: any) => d.validation_status === 'VALID');
         const warningDocs = data.documents.filter((d: any) => d.validation_status === 'WARNING' || d.validation_status === 'PENDING');
         this.docCompleteness = {
            completenessPercent: Math.round((validDocs.length / Math.max(data.documents.length, 1)) * 100),
            totalRequired: data.documents.length + 2, // assume 2 still missing
            totalPresent: data.documents.length,
            totalValid: validDocs.length,
            missingDocs: [
               { docType: 'ISDA Master Agreement', reason: 'Required for cross-border counterparty', priority: 'BLOCKING' as const },
               { docType: 'PRIIPs KID', reason: 'Required for London institutional client', priority: 'WARNING' as const }
            ],
            invalidDocs: warningDocs.map((d: any) => ({
               docType: d.document_type,
               docName: d.document_name,
               reason: 'Validation pending or warning'
            })),
            conditionalRules: [],
            expiringDocs: [],
            stageGateStatus: validDocs.length >= data.documents.length ? 'CLEAR' : (warningDocs.length > 0 ? 'WARNING' : 'BLOCKED')
         } as DocCompletenessResult;
      }

      // Pre-populate monitoringResult from DB metrics and breaches
      if (data.metrics || data.breaches) {
         // data.metrics is a single object with KPI fields, not an array
         const m = data.metrics || {};
         const breachesArr = Array.isArray(data.breaches) ? data.breaches : [];
         const metricsArr = [
            { name: 'Days Since Launch', value: m.days_since_launch || 0, unit: 'days', trend: 'stable' },
            { name: 'Total Volume', value: m.total_volume ? `$${(parseFloat(m.total_volume)/1e9).toFixed(1)}B` : '$0', unit: '', trend: 'up' },
            { name: 'Realized P&L', value: m.realized_pnl ? `+$${(parseFloat(m.realized_pnl)/1e6).toFixed(1)}M` : '$0', unit: '', trend: 'up' },
            { name: 'Active Breaches', value: m.active_breaches || breachesArr.length, unit: '', trend: breachesArr.length > 0 ? 'up' : 'stable' },
            { name: 'Counterparty Exposure', value: m.counterparty_exposure ? `$${(parseFloat(m.counterparty_exposure)/1e6).toFixed(0)}M` : '$0', unit: '', trend: 'stable' },
            { name: 'VaR Utilization', value: m.var_utilization ? `${parseFloat(m.var_utilization)}%` : '0%', unit: '', trend: 'stable' },
            { name: 'Collateral Posted', value: m.collateral_posted ? `$${(parseFloat(m.collateral_posted)/1e6).toFixed(1)}M` : '$0', unit: '', trend: 'stable' },
            { name: 'Next Review', value: m.next_review_date ? new Date(m.next_review_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBD', unit: '', trend: 'stable' }
         ];
         // Map post-launch conditions from DB
         const conditionsArr = Array.isArray(data.postLaunchConditions) ? data.postLaunchConditions : [];
         this.monitoringResult = {
            productHealth: m.health_status === 'critical' ? 'CRITICAL' : (m.health_status === 'warning' || breachesArr.length > 0 ? 'WARNING' : 'HEALTHY'),
            metrics: metricsArr,
            breaches: breachesArr.map((b: any) => ({
               metric: b.title || b.alert_type || b.metric || 'Unnamed Breach',
               threshold: parseFloat(b.threshold_value) || b.threshold || 0,
               actual: parseFloat(b.actual_value) || parseFloat(b.current_value) || b.actual || 0,
               severity: (b.severity === 'CRITICAL' ? 'CRITICAL' : 'WARNING') as 'CRITICAL' | 'WARNING',
               message: b.description || b.message || b.title || '',
               firstDetected: b.triggered_at || b.created_at || new Date().toISOString(),
               trend: (b.resolved_at ? 'improving' : (b.severity === 'CRITICAL' ? 'worsening' : 'stable')) as 'worsening' | 'stable' | 'improving'
            })),
            conditions: conditionsArr.map((c: any) => ({
               type: c.condition_type || c.type || 'REGULATORY',
               description: c.description || '',
               deadline: c.deadline ? new Date(c.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD',
               status: c.status || 'PENDING',
               daysRemaining: c.deadline ? Math.max(0, Math.ceil((new Date(c.deadline).getTime() - Date.now()) / 86400000)) : 0
            })),
            pirStatus: data.pir_status || 'Not Scheduled',
            pirDueDate: data.pir_due_date
         } as MonitoringResult;
      }

      // Map Classification Scorecard
      if (data.scorecard) {
         console.log('Scorecard loaded:', data.scorecard);
      }

      // Update tab badges from pre-populated DB data
      this.updateTabBadge('APPROVALS', null);
      this.updateTabBadge('DOCUMENTS', null);
      this.updateTabBadge('MONITORING', null);
   }

   get riskAssessments() {
      return this.intakeAssessments.filter(a => ['RISK', 'LEGAL', 'FINANCE'].includes(a.domain));
   }

   get opsAssessments() {
      return this.intakeAssessments.filter(a => ['OPS', 'TECH', 'DATA'].includes(a.domain));
   }

   getAssessmentColor(status: string): string {
      switch (status) {
         case 'PASS': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
         case 'WARN': return 'bg-amber-50 text-amber-700 border-amber-100';
         case 'FAIL': return 'bg-rose-50 text-rose-700 border-rose-100';
         default: return 'bg-gray-50 text-gray-700 border-gray-100';
      }
   }

   parseFindings(findings: string | object): string {
      if (!findings) return 'No detailed findings recorded.';
      try {
         const obj = typeof findings === 'string' ? JSON.parse(findings) : findings;
         return obj.observation || JSON.stringify(obj);
      } catch (e) {
         return String(findings);
      }
   }

   formatLabel(key: string): string {
      return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
   }

   get isCrossBorder(): boolean {
      return this.projectData?.is_cross_border ?? this.npaContext?.isCrossBorder ?? false;
   }

   get approvalTrack(): string {
      const type = this.projectData?.npa_type || this.npaContext?.track;
      return type === 'NPA Lite' ? 'NPA Lite (Variation)' : (type === 'New-to-Group' ? 'New-to-Group (High Risk)' : 'Variation (Medium Risk)');
   }

   tabs: { id: DetailTab, label: string, icon: string, badge?: string }[] = [
      { id: 'PRODUCT_SPECS', label: 'Proposal', icon: 'clipboard-list' },
      { id: 'DOCUMENTS', label: 'Docs', icon: 'folder-check', badge: '2' },
      { id: 'ANALYSIS', label: 'Analysis', icon: 'brain-circuit', badge: '78%' },
      { id: 'APPROVALS', label: 'Sign-Off', icon: 'users', badge: '6' },
      { id: 'WORKFLOW', label: 'Workflow', icon: 'git-branch' },
      { id: 'MONITORING', label: 'Monitor', icon: 'activity', badge: '2' },
      { id: 'CHAT', label: 'Chat', icon: 'message-square' },
   ];

   productAttributes: any[] = [];

   breaches: any[] = [];

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

   // ─── Agent Analysis Engine ──────────────────────────────────────

   private buildWorkflowInputs(): Record<string, any> {
      const d = this.projectData;
      if (!d) return {};
      const fieldValue = (key: string, fallback = '') => {
         const field = (d.formData || []).find((f: any) => f.field_key === key);
         return field?.field_value ?? fallback;
      };
      const productDesc = d.description || d.title || fieldValue('product_description', '') || fieldValue('business_rationale', 'NPA Product');
      return {
         project_id: d.id || this.projectId || '',
         product_description: productDesc,
         product_category: fieldValue('product_category', '') || fieldValue('product_type', '') || d.product_category || d.npa_type || '',
         underlying_asset: fieldValue('underlying_asset', ''),
         notional_amount: String(parseFloat(fieldValue('notional_amount', '0')) || d.notional_amount || 0),
         currency: fieldValue('currency', '') || d.currency || 'USD',
         customer_segment: fieldValue('customer_segment', '') || fieldValue('target_market', '') || '',
         booking_location: fieldValue('booking_location', '') || fieldValue('booking_entity', '').split(',').pop()?.trim() || 'Singapore',
         counterparty_location: fieldValue('counterparty_location', '') || (fieldValue('counterparty', '').includes('London') ? 'London' : ''),
         is_cross_border: String(d.is_cross_border ?? false),
         classification_type: d.classification_type || d.scorecard?.calculated_tier || 'Variation',
         approval_track: d.approval_track || 'FULL_NPA',
         current_stage: d.current_stage || 'INITIATION',
         counterparty_rating: fieldValue('counterparty_rating', 'A-'),
         use_case: fieldValue('use_case', '') || 'Hedging',
         risk_level: d.risk_level || 'MEDIUM',
         // Some Dify workflows use 'input_text' as their primary input variable
         input_text: productDesc
      };
   }

   private runAgentAnalysis(): void {
      if (this._agentsLaunched) return; // prevent duplicate agent launches
      const inputs = this.buildWorkflowInputs();
      if (!inputs['project_id']) return;
      this._agentsLaunched = true;

      const agents = ['CLASSIFIER', 'ML_PREDICT', 'RISK', 'AUTOFILL', 'GOVERNANCE', 'DOC_LIFECYCLE', 'MONITORING'];
      agents.forEach(a => this.agentLoading[a] = true);

      // Helper to fire a single agent workflow
      const fireAgent = (agentId: string, extraInputs: Record<string, any> = {}) => {
         const agentInputs = { ...inputs, ...extraInputs };
         console.log(`[fireAgent] ${agentId} — sending request`);
         this.difyService.runWorkflow(agentId, agentInputs).pipe(
            catchError(err => {
               console.error(`[fireAgent] ${agentId} — ERROR:`, err.status, err.message);
               this.agentErrors[agentId] = err.message || `${agentId} failed`;
               return of(null);
            })
         ).subscribe(res => {
            this.agentLoading[agentId] = false;
            console.log(`[fireAgent] ${agentId} — response status:`, res?.data?.status, 'outputs keys:', res?.data?.outputs ? Object.keys(res.data.outputs) : 'NONE');
            if (res?.data?.status === 'succeeded') {
               this.handleAgentResult(agentId, res.data.outputs);
            } else {
               console.warn(`[fireAgent] ${agentId} — status not succeeded:`, res?.data?.status);
            }
         });
      };

      // WAVE 1 — Core analysis (fire immediately): CLASSIFIER + ML_PREDICT + RISK
      fireAgent('CLASSIFIER');
      fireAgent('ML_PREDICT');

      // WAVE 2 — 2s stagger: RISK + AUTOFILL
      timer(2000).subscribe(() => {
         fireAgent('RISK');
         fireAgent('AUTOFILL');
      });

      // WAVE 3 — 4s stagger: GOVERNANCE + DOC_LIFECYCLE + MONITORING
      // These 3 share the same Dify app (WF_NPA_Governance_Ops), so stagger them further
      timer(4000).subscribe(() => {
         fireAgent('GOVERNANCE', { agent_mode: 'GOVERNANCE' });
      });
      timer(5500).subscribe(() => {
         fireAgent('DOC_LIFECYCLE', { agent_mode: 'DOC_LIFECYCLE' });
      });
      timer(7000).subscribe(() => {
         fireAgent('MONITORING', { agent_mode: 'MONITORING' });
      });
   }

   private handleAgentResult(agentId: string, outputs: any): void {
      console.log(`[handleAgentResult] ${agentId} — raw outputs keys:`, outputs ? Object.keys(outputs) : 'NULL');
      switch (agentId) {
         case 'CLASSIFIER':
            this.classificationResult = this.mapClassificationResult(outputs);
            console.log(`[handleAgentResult] CLASSIFIER mapped:`, this.classificationResult?.type, 'scores:', this.classificationResult?.scores?.length);
            this.updateTabBadge('ANALYSIS', null);
            break;
         case 'ML_PREDICT':
            this.mlPrediction = this.mapMlPrediction(outputs);
            console.log(`[handleAgentResult] ML_PREDICT mapped: approval=${this.mlPrediction?.approvalLikelihood}, risk=${this.mlPrediction?.riskScore}`);
            this.updateTabBadge('ANALYSIS', null);
            break;
         case 'RISK':
            this.riskAssessmentResult = this.mapRiskAssessment(outputs);
            console.log(`[handleAgentResult] RISK mapped:`, this.riskAssessmentResult ? `score=${this.riskAssessmentResult.overallScore}, layers=${this.riskAssessmentResult.layers?.length}` : 'NULL');
            break;
         case 'AUTOFILL':
            this.autoFillSummary = this.mapAutoFillSummary(outputs);
            this.updateTabBadge('PRODUCT_SPECS', null);
            break;
         case 'GOVERNANCE': {
            // Only overwrite DB-seeded data if agent returns meaningful signoffs
            const agentGov = this.mapGovernanceState(outputs);
            if (agentGov && agentGov.signoffs && agentGov.signoffs.length > 0) {
               this.governanceState = agentGov;
            }
            this.updateTabBadge('APPROVALS', null);
            break;
         }
         case 'DOC_LIFECYCLE': {
            const agentDoc = this.mapDocCompleteness(outputs);
            if (agentDoc && agentDoc.totalPresent > 0) {
               this.docCompleteness = agentDoc;
            }
            this.updateTabBadge('DOCUMENTS', null);
            break;
         }
         case 'MONITORING': {
            const agentMon = this.mapMonitoringResult(outputs);
            if (agentMon && (agentMon.metrics?.length > 0 || agentMon.breaches?.length > 0)) {
               this.monitoringResult = agentMon;
            }
            this.updateTabBadge('MONITORING', null);
            break;
         }
      }
   }

   // ─── Output Mapping Methods ─────────────────────────────────────

   private parseJsonOutput(outputs: any): any {
      if (outputs?.result && typeof outputs.result === 'string') {
         // Dify often wraps JSON in markdown code fences: ```json\n{...}\n```
         let raw = outputs.result.trim();
         // Strip markdown code fences
         raw = raw.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
         try { return JSON.parse(raw); } catch (e) {
            console.warn('[parseJsonOutput] Failed to parse result:', e, 'raw (first 200):', raw.substring(0, 200));
         }
      }
      return outputs;
   }

   private mapClassificationResult(rawOutputs: any): ClassificationResult | null {
      const o = this.parseJsonOutput(rawOutputs);
      if (!o) return null;
      // Dify returns: { classification: { type, track }, scorecard: { scores[], overall_confidence }, ... }
      const cl = o.classification || o.classification_result || o;
      const sc = o.scorecard || cl.scorecard || {};
      const scores = sc.scores || cl.scores || [];
      return {
         type: cl.type || cl.classification_type || 'Variation',
         track: cl.track || cl.approval_track || 'NPA Lite',
         scores: scores.map((s: any) => ({
            criterion: s.criterion_name || s.criterion || s.name || s.criterion_code || '',
            score: s.score ?? 0,
            maxScore: s.max_score || s.maxScore || 10,
            reasoning: s.reasoning || s.description || ''
         })),
         overallConfidence: sc.overall_confidence || cl.overallConfidence || cl.overall_confidence || cl.confidence || 0,
         prohibitedMatch: o.prohibited_check || cl.prohibitedMatch || cl.prohibited_match || { matched: false },
         mandatorySignOffs: o.mandatory_signoffs || cl.mandatorySignOffs || cl.mandatory_signoffs || []
      } as ClassificationResult;
   }

   private mapMlPrediction(rawOutputs: any): MLPrediction | null {
      const o = this.parseJsonOutput(rawOutputs);
      if (!o) return null;
      // ML_PREDICT and CLASSIFIER share the same Dify app (WF_NPA_Classify_Predict).
      // The response contains classification + scorecard but no separate ml_prediction key.
      // We synthesize prediction data from the classification output.
      const p = o.ml_prediction || o.prediction || {};
      const sc = o.scorecard || {};
      const cl = o.classification || {};
      const nf = o.notional_flags || {};

      // Derive approval likelihood from confidence or explicit field
      const approvalLikelihood = p.approvalLikelihood || p.approval_likelihood
         || sc.overall_confidence || 0;

      // Derive timeline from track: FULL_NPA ~45 days, NPA_LITE ~25 days
      const track = cl.track || '';
      const defaultTimeline = track.includes('LITE') ? 25 : 45;
      const timelineDays = p.timelineDays || p.timeline_days || defaultTimeline;

      // Bottleneck: derive from notional flags or mandatory signoffs
      const signoffs = o.mandatory_signoffs || [];
      const bottleneckDept = p.bottleneckDept || p.bottleneck_dept
         || (nf.cfo_approval_required ? 'CFO / Finance' : signoffs[signoffs.length - 1] || 'Unknown');

      // Risk score: inverse of confidence (higher confidence = lower risk)
      const riskScore = p.riskScore || p.risk_score || Math.max(0, 100 - approvalLikelihood);

      // Build feature importance from notional flags + classification
      const features: any[] = p.features || [];
      if (features.length === 0) {
         if (nf.roae_analysis_needed) features.push({ name: 'ROAE Analysis Required', importance: 0.8, value: 'Yes' });
         if (nf.mlr_review_required) features.push({ name: 'MLR Review Required', importance: 0.7, value: 'Yes' });
         if (nf.finance_vp_required) features.push({ name: 'Finance VP Required', importance: 0.6, value: 'Yes' });
         if (cl.is_cross_border) features.push({ name: 'Cross-Border', importance: 0.9, value: 'Yes' });
         features.push({ name: 'Classification', importance: 0.5, value: cl.type || 'N/A' });
      }

      return {
         approvalLikelihood,
         timelineDays,
         bottleneckDept,
         riskScore,
         features,
         comparisonInsights: p.comparisonInsights || p.comparison_insights
            || (o.similar_npa_hint ? [o.similar_npa_hint] : [])
      } as MLPrediction;
   }

   private mapRiskAssessment(rawOutputs: any): RiskAssessment | null {
      const o = this.parseJsonOutput(rawOutputs);
      if (!o) return null;
      const r = o.risk_assessment || o;
      return {
         layers: (o.layer_results || r.layers || []).map((l: any) => ({
            name: l.layer || l.name || '',
            status: l.status || 'PASS',
            details: Array.isArray(l.findings) ? l.findings.join('; ') : (l.details || ''),
            checks: (l.checks || l.flags || []).map((c: any) =>
               typeof c === 'string'
                  ? { name: c, status: 'WARNING' as const, detail: c }
                  : { name: c.name, status: c.status || 'PASS', detail: c.detail || c.description || '' }
            )
         })),
         overallScore: r.overall_score || r.overallScore || 0,
         hardStop: r.hardStop || r.hard_stop || false,
         hardStopReason: r.hardStopReason || r.hard_stop_reason || undefined,
         prerequisites: (o.prerequisite_validation?.pending_items || r.prerequisites || []).map((p: any) =>
            typeof p === 'string'
               ? { name: p, status: 'FAIL' as const, category: 'Pending' }
               : { name: p.name, status: p.status || 'PASS', category: p.category || '' }
         )
      } as RiskAssessment;
   }

   private mapAutoFillSummary(rawOutputs: any): AutoFillSummary | null {
      const o = this.parseJsonOutput(rawOutputs);
      console.log('[mapAutoFillSummary] parsed keys:', o ? Object.keys(o) : 'NULL', 'raw (500):', JSON.stringify(o).substring(0, 500));
      if (!o) return null;
      // autofill_result may have a nested coverage object
      const ar = o.autofill_result || o;
      const cov = ar.coverage || ar;
      const filledFields = o.filled_fields || o.fields || [];
      return {
         fieldsFilled: cov.auto_filled || ar.auto_filled || ar.fieldsFilled || filledFields.filter((f: any) => f.lineage === 'AUTO').length,
         fieldsAdapted: cov.adapted || ar.adapted || ar.fieldsAdapted || filledFields.filter((f: any) => f.lineage === 'ADAPTED').length,
         fieldsManual: cov.manual_required || ar.manual_required || ar.fieldsManual || 0,
         totalFields: cov.total_fields || ar.total_fields || ar.totalFields || 47,
         coveragePct: cov.coverage_pct || ar.coverage_pct || ar.coveragePct || 0,
         timeSavedMinutes: o.time_savings?.estimated_manual_minutes
            ? (o.time_savings.estimated_manual_minutes - (o.time_savings.estimated_with_autofill_minutes || 0))
            : (ar.timeSavedMinutes || 0),
         fields: filledFields.map((f: any) => ({
            fieldName: f.field_key || f.fieldName || '',
            value: f.value || '',
            lineage: f.lineage || 'AUTO',
            source: f.source,
            confidence: f.confidence ? f.confidence / 100 : undefined
         }))
      } as AutoFillSummary;
   }

   private mapGovernanceState(rawOutputs: any): GovernanceState | null {
      const o = this.parseJsonOutput(rawOutputs);
      console.log('[mapGovernanceState] parsed keys:', o ? Object.keys(o) : 'NULL', 'raw (200):', JSON.stringify(o).substring(0, 500));
      if (!o) return null;
      const ss = o.signoff_status || o;
      const ls = o.loopback_status || {};
      const signoffs = (o.signoffs || ss.signoffs || []).map((s: any) => ({
         department: s.department,
         status: s.status || 'PENDING',
         assignee: s.assignee || s.approver,
         slaDeadline: s.sla_deadline || s.slaDeadline,
         slaBreached: s.sla_breached || s.slaBreached || false,
         decidedAt: s.decided_at || s.decidedAt
      }));
      const finalSignoffs = signoffs.length > 0 ? signoffs :
         (ss.blocking_parties || []).map((dept: string) => ({
            department: dept, status: 'PENDING' as const
         }));
      return {
         signoffs: finalSignoffs,
         slaStatus: ss.sla_breached > 0 ? 'breached' : (ss.completion_pct > 50 ? 'on_track' : 'at_risk'),
         loopBackCount: ls.total || 0,
         circuitBreaker: ls.circuit_breaker_triggered || false,
         circuitBreakerThreshold: 3
      } as GovernanceState;
   }

   private mapDocCompleteness(rawOutputs: any): DocCompletenessResult | null {
      const o = this.parseJsonOutput(rawOutputs);
      console.log('[mapDocCompleteness] parsed keys:', o ? Object.keys(o) : 'NULL', 'raw (500):', JSON.stringify(o).substring(0, 500));
      if (!o) return null;
      const c = o.completeness || o;
      return {
         completenessPercent: c.completion_pct || c.completenessPercent || 0,
         totalRequired: c.total_required || c.totalRequired || 0,
         totalPresent: c.present || c.totalPresent || 0,
         totalValid: c.totalValid || c.present || 0,
         missingDocs: (o.missing_documents || c.missingDocs || []).map((d: any) => ({
            docType: d.doc_name || d.docType || '',
            reason: d.reason || `Required by ${d.required_by || 'sign-off'}`,
            priority: d.criticality === 'CRITICAL' ? 'BLOCKING' : 'WARNING'
         })),
         invalidDocs: c.invalidDocs || [],
         conditionalRules: c.conditionalRules || [],
         expiringDocs: c.expiringDocs || [],
         stageGateStatus: c.is_complete ? 'CLEAR' : (c.critical_missing > 0 ? 'BLOCKED' : 'WARNING')
      } as DocCompletenessResult;
   }

   private mapMonitoringResult(rawOutputs: any): MonitoringResult | null {
      const o = this.parseJsonOutput(rawOutputs);
      console.log('[mapMonitoringResult] parsed keys:', o ? Object.keys(o) : 'NULL', 'raw (500):', JSON.stringify(o).substring(0, 500));
      if (!o) return null;
      return {
         productHealth: o.health_status || o.productHealth || 'HEALTHY',
         metrics: (o.metrics || []).map((m: any) => ({
            name: m.name || m.metric || '',
            value: m.value || m.actual || 0,
            unit: m.unit || '',
            threshold: m.threshold || m.warning,
            trend: m.trend || 'stable'
         })),
         breaches: (o.breaches || []).map((b: any) => ({
            metric: b.metric || '',
            threshold: b.threshold || b.warning || b.critical || 0,
            actual: b.actual || 0,
            severity: b.severity || 'WARNING',
            message: b.message || `${b.metric} exceeds threshold`,
            firstDetected: b.firstDetected || b.first_detected || new Date().toISOString(),
            trend: b.trend || 'stable'
         })),
         conditions: (o.conditions?.items || o.post_launch_conditions || []).map((c: any) => ({
            type: c.type || '',
            description: c.description || '',
            deadline: c.deadline || '',
            status: c.status || 'PENDING',
            daysRemaining: c.daysRemaining || c.days_remaining || 0
         })),
         pirStatus: o.pir_status || o.pirStatus || 'Not Scheduled',
         pirDueDate: o.pir_due_date || o.pirDueDate
      } as MonitoringResult;
   }

   // ─── Retry & Badge Update ───────────────────────────────────────

   /** Public — used in template error states */
   retryAgent(agentId: string): void {
      delete this.agentErrors[agentId];
      this.agentLoading[agentId] = true;
      const inputs = this.buildWorkflowInputs();
      const modeMap: Record<string, string> = {
         GOVERNANCE: 'GOVERNANCE', DOC_LIFECYCLE: 'DOC_LIFECYCLE', MONITORING: 'MONITORING'
      };
      const finalInputs = modeMap[agentId] ? { ...inputs, agent_mode: modeMap[agentId] } : inputs;

      this.difyService.runWorkflow(agentId, finalInputs).pipe(
         catchError(err => { this.agentErrors[agentId] = err.message || `${agentId} failed`; return of(null); })
      ).subscribe((res: any) => {
         this.agentLoading[agentId] = false;
         if (res?.data?.status === 'succeeded') {
            switch (agentId) {
               case 'CLASSIFIER': this.classificationResult = this.mapClassificationResult(res.data.outputs); break;
               case 'ML_PREDICT': this.mlPrediction = this.mapMlPrediction(res.data.outputs); break;
               case 'RISK': this.riskAssessmentResult = this.mapRiskAssessment(res.data.outputs); break;
               case 'AUTOFILL': this.autoFillSummary = this.mapAutoFillSummary(res.data.outputs); break;
               case 'GOVERNANCE': this.governanceState = this.mapGovernanceState(res.data.outputs); break;
               case 'DOC_LIFECYCLE': this.docCompleteness = this.mapDocCompleteness(res.data.outputs); break;
               case 'MONITORING': this.monitoringResult = this.mapMonitoringResult(res.data.outputs); break;
            }
         }
      });
   }

   private updateTabBadge(tabId: DetailTab, _data: any): void {
      const tab = this.tabs.find(t => t.id === tabId);
      if (!tab) return;
      switch (tabId) {
         case 'PRODUCT_SPECS':
            if (this.autoFillSummary) tab.badge = `${this.autoFillSummary.coveragePct}%`;
            break;
         case 'DOCUMENTS':
            if (this.docCompleteness) {
               const missing = this.docCompleteness.missingDocs?.length || 0;
               tab.badge = missing > 0 ? `${missing} Missing` : 'Complete';
            }
            break;
         case 'ANALYSIS':
            if (this.mlPrediction) tab.badge = `${this.mlPrediction.approvalLikelihood}%`;
            break;
         case 'APPROVALS':
            if (this.governanceState) {
               const pending = this.governanceState.signoffs?.filter(s => s.status === 'PENDING').length || 0;
               tab.badge = `${pending}`;
            }
            break;
         case 'MONITORING':
            if (this.monitoringResult) {
               tab.badge = this.monitoringResult.breaches?.length > 0
                  ? `${this.monitoringResult.breaches.length}` : '0';
            }
            break;
      }
   }
}
