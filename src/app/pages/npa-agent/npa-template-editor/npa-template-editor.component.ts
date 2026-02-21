import { Component, EventEmitter, Input, Output, OnInit, OnDestroy, inject, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { LucideAngularModule, UploadCloud, Edit2, AlertCircle, Paperclip } from 'lucide-angular';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { NpaSection, NpaField, FieldLineage } from '../../../lib/npa-interfaces';
import { NpaService, NpaListItem } from '../../../services/npa.service';
import { AgentGovernanceService, ReadinessResult } from '../../../services/agent-governance.service';
import { NPA_PART_C_TEMPLATE, NPA_APPENDICES_TEMPLATE, TemplateNode, collectFieldKeys, getNavSections } from '../../../lib/npa-template-definition';
import { WorkflowStreamEvent } from '../../../lib/agent-interfaces';

@Component({
   selector: 'app-npa-template-editor',
   standalone: true,
   imports: [CommonModule, LucideAngularModule, FormsModule],
   template: `
    <!-- FULL-SCREEN EDITOR CONTAINER -->
    <div class="fixed inset-0 z-[200] bg-white flex flex-col font-sans animate-in fade-in duration-200">

      <!-- TOP BAR -->
      <div class="bg-slate-900 flex items-center justify-between px-4 z-20 flex-none" style="height:80px">
        <div class="flex items-center gap-3">
          <button (click)="closeEditor()" class="flex items-center justify-center w-8 h-8 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-all">
             <lucide-icon name="arrow-left" class="w-4 h-4"></lucide-icon>
          </button>
          <div class="h-5 w-px bg-slate-700"></div>
          <div class="flex items-center gap-2.5">
             <div class="w-7 h-7 rounded bg-dbs-primary flex items-center justify-center">
                <lucide-icon name="file-text" class="w-4 h-4 text-white"></lucide-icon>
             </div>
             <div>
                <h1 class="text-sm font-semibold text-white leading-none">{{ getDocTitle() }}</h1>
                <p class="text-xs text-slate-400 mt-0.5">Full NPA &middot; Draft &middot; v1.0</p>
             </div>
          </div>
        </div>

        <div class="flex items-center gap-2">
           <!-- View toggle: Live | Doc | Form -->
           <div class="flex items-center bg-slate-800 rounded p-0.5">
              <button (click)="viewMode = 'live'"
                      [class.bg-slate-600]="viewMode === 'live'" [class.text-white]="viewMode === 'live'"
                      class="px-3 py-1.5 text-xs font-medium rounded transition-all text-slate-400 hover:text-slate-200 flex items-center gap-1">
                 <lucide-icon *ngIf="liveWorkflowStatus === 'running'" name="loader-2" class="w-3 h-3 animate-spin"></lucide-icon>
                 <lucide-icon *ngIf="liveWorkflowStatus === 'succeeded'" name="check-circle" class="w-3 h-3 text-emerald-400"></lucide-icon>
                 Live
              </button>
              <button (click)="viewMode = 'document'"
                      [class.bg-slate-600]="viewMode === 'document'" [class.text-white]="viewMode === 'document'"
                      class="px-3 py-1.5 text-xs font-medium rounded transition-all text-slate-400 hover:text-slate-200">Doc</button>
              <button (click)="viewMode = 'form'"
                      [class.bg-slate-600]="viewMode === 'form'" [class.text-white]="viewMode === 'form'"
                      class="px-3 py-1.5 text-xs font-medium rounded transition-all text-slate-400 hover:text-slate-200">Form</button>
           </div>

           <!-- Lineage legend — colored dots -->
           <div class="hidden lg:flex items-center gap-3 text-[11px] font-medium border-l border-slate-700 pl-3 ml-1 text-slate-400">
              <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-emerald-400"></span>Auto</span>
              <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-amber-400"></span>Adapted</span>
              <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-blue-400"></span>Manual</span>
              <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-slate-500 ring-1 ring-slate-400"></span>Empty</span>
           </div>

           <div class="h-5 w-px bg-slate-700"></div>

           <!-- Governance Check CTA -->
           <button (click)="validateGovernance()"
                   [disabled]="isRunningGovernance"
                   class="px-3 py-1.5 text-xs font-semibold rounded transition-colors flex items-center gap-1.5"
                   [ngClass]="isRunningGovernance ? 'bg-slate-700 text-slate-400 cursor-wait' : 'bg-emerald-600 hover:bg-emerald-700 text-white'">
              <lucide-icon [name]="isRunningGovernance ? 'loader-2' : 'shield-check'" class="w-3.5 h-3.5" [class.animate-spin]="isRunningGovernance"></lucide-icon>
              {{ isRunningGovernance ? 'Running...' : 'Governance Check' }}
           </button>

           <button (click)="save()" class="px-4 py-1.5 text-xs font-semibold text-white bg-dbs-primary hover:bg-dbs-primary-hover rounded-lg transition-colors flex items-center gap-1.5">
              <lucide-icon name="save" class="w-3.5 h-3.5"></lucide-icon> Save & Close
           </button>
        </div>
      </div>

      <!-- CONTENT — 3 column -->
      <div class="flex-1 overflow-hidden flex min-h-0">

         <!-- LEFT SIDEBAR — Navigation + Stats -->
         <div class="w-64 bg-slate-50 border-r border-slate-200 overflow-y-auto hidden lg:flex flex-col flex-none">

            <!-- Completion header -->
            <div class="px-4 py-3 border-b border-slate-200 bg-white">
               <div class="flex items-center justify-between mb-2">
                  <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Progress</span>
                  <span class="text-sm font-bold text-slate-700">{{ getOverallCompletion() }}%</span>
               </div>
               <div class="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div class="h-full rounded-full bg-blue-500 transition-all duration-500"
                       [style.width.%]="getOverallCompletion()"></div>
               </div>
               <div class="flex items-center justify-between mt-2 text-[11px] text-slate-400">
                  <span>{{ getFilledFieldCount() }} / {{ getTotalFieldCount() }} fields</span>
               </div>
            </div>

            <!-- Section nav — same template tree for both Doc and Form views -->
            <nav class="flex-1 py-1 overflow-y-auto">
               <a *ngFor="let navItem of templateNavSections"
                  href="javascript:void(0)"
                  (click)="scrollToSection(navItem.id)"
                  class="group flex items-center gap-2 px-3 py-2 text-[12px] transition-all border-l-2 mx-1 rounded-r-sm"
                  [class.border-blue-500]="activeSection === navItem.id"
                  [class.bg-blue-50]="activeSection === navItem.id"
                  [class.text-slate-900]="activeSection === navItem.id"
                  [class.font-semibold]="activeSection === navItem.id"
                  [class.border-transparent]="activeSection !== navItem.id"
                  [class.text-slate-500]="activeSection !== navItem.id"
                  [class.hover:bg-slate-50]="activeSection !== navItem.id"
                  [class.hover:text-slate-700]="activeSection !== navItem.id">
                  <span class="font-mono text-[10px] text-slate-400 w-7 text-right flex-none">{{ navItem.numbering }}</span>
                  <span class="flex-1 leading-snug truncate">{{ navItem.label }}</span>
                  <span class="text-[10px] font-mono text-slate-400 flex-none">{{ getNodeCompletion(navItem.id) }}%</span>
               </a>
            </nav>

            <!-- Lineage summary footer -->
            <div class="px-4 py-3 border-t border-slate-200 bg-white text-[11px] text-slate-500 space-y-1.5">
               <div class="flex items-center justify-between"><span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-emerald-400"></span>Auto-filled (AI)</span><span class="font-bold text-slate-700">{{ getLineageCount('AUTO') }}</span></div>
               <div class="flex items-center justify-between"><span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-amber-400"></span>Adapted</span><span class="font-bold text-slate-700">{{ getLineageCount('ADAPTED') }}</span></div>
               <div class="flex items-center justify-between"><span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-blue-400"></span>Manual</span><span class="font-bold text-slate-700">{{ getLineageCount('MANUAL') }}</span></div>
               <div class="flex items-center justify-between border-t border-slate-100 pt-1.5 mt-1"><span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-slate-300 ring-1 ring-slate-200"></span>Empty</span><span class="font-bold text-slate-400">{{ getTotalFieldCount() - getFilledFieldCount() }}</span></div>
            </div>
         </div>

         <!-- CENTER CONTENT -->
         <div class="flex-1 overflow-y-auto scroll-smooth relative min-h-0" id="form-container" (scroll)="onScroll($event)">

            <!-- ====== LIVE STREAMING VIEW ====== -->
            <ng-container *ngIf="viewMode === 'live'">
              <div class="max-w-4xl mx-auto px-8 py-6">

                <!-- Status Header -->
                <div class="flex items-center justify-between mb-6 bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg flex items-center justify-center"
                         [ngClass]="{
                           'bg-blue-100': liveWorkflowStatus === 'running',
                           'bg-emerald-100': liveWorkflowStatus === 'succeeded',
                           'bg-red-100': liveWorkflowStatus === 'failed',
                           'bg-slate-100': liveWorkflowStatus === 'idle'
                         }">
                      <lucide-icon *ngIf="liveWorkflowStatus === 'running'" name="loader-2" class="w-5 h-5 text-blue-600 animate-spin"></lucide-icon>
                      <lucide-icon *ngIf="liveWorkflowStatus === 'succeeded'" name="check-circle" class="w-5 h-5 text-emerald-600"></lucide-icon>
                      <lucide-icon *ngIf="liveWorkflowStatus === 'failed'" name="x-circle" class="w-5 h-5 text-red-600"></lucide-icon>
                      <lucide-icon *ngIf="liveWorkflowStatus === 'idle'" name="radio" class="w-5 h-5 text-slate-400"></lucide-icon>
                    </div>
                    <div>
                      <h3 class="text-sm font-bold text-slate-900">
                        {{ liveWorkflowStatus === 'running' ? 'AutoFill Agent Working...' :
                           liveWorkflowStatus === 'succeeded' ? 'AutoFill Complete' :
                           liveWorkflowStatus === 'failed' ? 'AutoFill Failed' : 'Waiting for AutoFill' }}
                      </h3>
                      <p class="text-xs text-slate-500">Template AutoFill Agent &middot; 60+ fields</p>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-2xl font-bold font-mono text-slate-700">
                      {{ Math.floor(liveElapsedSeconds / 60) }}:{{ (liveElapsedSeconds % 60).toString().padStart(2, '0') }}
                    </div>
                    <p class="text-[10px] text-slate-400 uppercase tracking-wider">Elapsed</p>
                  </div>
                </div>

                <!-- Error Banner -->
                <div *ngIf="liveError" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div class="flex items-center gap-2">
                    <lucide-icon name="alert-circle" class="w-4 h-4 text-red-500"></lucide-icon>
                    <span class="text-sm text-red-700">{{ liveError }}</span>
                  </div>
                </div>

                <!-- Node Progress -->
                <div *ngIf="liveNodes.length > 0" class="mb-6">
                  <h4 class="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Workflow Steps</h4>
                  <div class="space-y-1">
                    <div *ngFor="let node of liveNodes"
                         class="flex items-center gap-2 py-1.5 px-3 rounded text-xs"
                         [ngClass]="{
                           'bg-blue-50 text-blue-700': node.status === 'running',
                           'bg-emerald-50 text-emerald-700': node.status === 'succeeded',
                           'bg-red-50 text-red-700': node.status === 'failed'
                         }">
                      <lucide-icon *ngIf="node.status === 'running'" name="loader-2" class="w-3.5 h-3.5 animate-spin"></lucide-icon>
                      <lucide-icon *ngIf="node.status === 'succeeded'" name="check-circle" class="w-3.5 h-3.5"></lucide-icon>
                      <lucide-icon *ngIf="node.status === 'failed'" name="x-circle" class="w-3.5 h-3.5"></lucide-icon>
                      <span class="font-medium flex-1">{{ node.title }}</span>
                      <span *ngIf="node.elapsedMs" class="font-mono text-[10px] text-slate-400">
                        {{ (node.elapsedMs / 1000).toFixed(1) }}s
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Streaming Text Output -->
                <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div class="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <h4 class="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <lucide-icon name="file-text" class="w-3.5 h-3.5"></lucide-icon> Agent Output
                    </h4>
                    <span *ngIf="liveWorkflowStatus === 'running'"
                          class="flex items-center gap-1 text-[10px] text-blue-500 font-medium">
                      <span class="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                      Streaming
                    </span>
                  </div>
                  <div class="p-6 font-mono text-xs text-slate-700 leading-relaxed whitespace-pre-wrap max-h-[60vh] overflow-y-auto"
                       [innerHTML]="formatLiveText(liveStreamText)">
                  </div>
                </div>

              </div>
            </ng-container>

            <!-- ====== DOCUMENT VIEW (Template Tree) ====== -->
            <ng-container *ngIf="viewMode === 'document'">

            <!-- Part C — Template tree renderer -->
            <div class="bg-white npa-doc-body">

               <!-- Part C header -->
               <div class="npa-doc-part-head">
                  <h2 class="text-[15px] font-bold text-slate-800 uppercase tracking-wide">Part C: Product Information to be Completed by Proposing Unit</h2>
               </div>

               <!-- Render Part C sections -->
               <ng-container *ngFor="let sectionNode of templateTree.children">
                  <ng-container *ngTemplateOutlet="nodeRenderer; context: { $implicit: sectionNode, depth: 0 }"></ng-container>
               </ng-container>

               <!-- Appendices header -->
               <div class="npa-doc-part-head" style="margin-top:24px;">
                  <h2 class="text-[15px] font-bold text-slate-800 uppercase tracking-wide">Appendices</h2>
               </div>

               <!-- Render Appendices -->
               <ng-container *ngFor="let appNode of appendicesTree">
                  <ng-container *ngTemplateOutlet="nodeRenderer; context: { $implicit: appNode, depth: 0 }"></ng-container>
               </ng-container>

               <!-- Bottom padding -->
               <div class="h-20"></div>
            </div>

            <!-- ── Recursive node renderer template ── -->
            <ng-template #nodeRenderer let-node let-depth="depth">

               <!-- SECTION type — Roman numeral heading (I, II, III) -->
               <ng-container *ngIf="node.type === 'section' || node.type === 'appendix'">
                  <!-- Scroll anchor wrapper (non-sticky, so scroll-to works) -->
                  <div [id]="'sec-' + node.id">
                  <div class="sticky top-0 z-10 bg-white border-b border-slate-200 npa-doc-section-head">
                     <div class="flex items-center justify-between">
                        <h2 class="text-[15px] font-bold text-slate-900 leading-snug">
                           <span class="text-slate-400 mr-1.5">{{ node.numbering }}</span>
                           <span *ngIf="node.numbering && !node.numbering.startsWith('Appendix')">.</span>
                           {{ node.label }}
                        </h2>
                        <span class="text-[10px] font-medium text-slate-400">{{ getNodeCompletion(node.id) }}%</span>
                     </div>
                  </div>
                  <div class="npa-doc-fields">
                     <!-- Guidance text for section-level nodes -->
                     <div *ngIf="node.guidance" class="npa-doc-guidance">
                        <p>{{ node.guidance }}</p>
                     </div>
                     <!-- Render field values for section-level fieldKeys -->
                     <ng-container *ngIf="node.fieldKeys?.length">
                        <ng-container *ngFor="let fk of node.fieldKeys">
                           <ng-container *ngIf="getFieldForKey(fk) as field">
                              <ng-container *ngTemplateOutlet="fieldBlock; context: { $implicit: field }"></ng-container>
                           </ng-container>
                        </ng-container>
                     </ng-container>
                     <!-- Recurse into children -->
                     <ng-container *ngFor="let child of node.children">
                        <ng-container *ngTemplateOutlet="nodeRenderer; context: { $implicit: child, depth: depth + 1 }"></ng-container>
                     </ng-container>
                  </div>
                  </div><!-- close scroll anchor wrapper -->
               </ng-container>

               <!-- TOPIC type — Numbered heading (1, 2, 3) -->
               <ng-container *ngIf="node.type === 'topic'">
                  <div class="npa-doc-topic-head">
                     <h3 class="text-[14px] font-semibold text-slate-800">
                        <span class="text-slate-400 mr-1">{{ node.numbering }}.</span> {{ node.label }}
                     </h3>
                  </div>
                  <!-- Guidance text -->
                  <div *ngIf="node.guidance" class="npa-doc-guidance">
                     <p>{{ node.guidance }}</p>
                  </div>
                  <!-- Field values -->
                  <ng-container *ngIf="node.fieldKeys?.length">
                     <ng-container *ngFor="let fk of node.fieldKeys">
                        <ng-container *ngIf="getFieldForKey(fk) as field">
                           <ng-container *ngTemplateOutlet="fieldBlock; context: { $implicit: field }"></ng-container>
                        </ng-container>
                     </ng-container>
                  </ng-container>
                  <!-- Recurse into children -->
                  <ng-container *ngFor="let child of node.children">
                     <ng-container *ngTemplateOutlet="nodeRenderer; context: { $implicit: child, depth: depth + 1 }"></ng-container>
                  </ng-container>
               </ng-container>

               <!-- SUB_QUESTION type — Lettered sub-heading (a, b, c) -->
               <ng-container *ngIf="node.type === 'sub_question'">
                  <div class="npa-doc-subq-head">
                     <h4 class="text-[14px] font-semibold text-slate-800">
                        <span class="text-slate-500 mr-1">{{ node.numbering }}</span> {{ node.label }}
                     </h4>
                  </div>
                  <!-- Guidance text -->
                  <div *ngIf="node.guidance" class="npa-doc-guidance npa-doc-guidance-sub">
                     <p>{{ node.guidance }}</p>
                  </div>
                  <!-- Field values -->
                  <ng-container *ngIf="node.fieldKeys?.length">
                     <ng-container *ngFor="let fk of node.fieldKeys">
                        <ng-container *ngIf="getFieldForKey(fk) as field">
                           <ng-container *ngTemplateOutlet="fieldBlock; context: { $implicit: field }"></ng-container>
                        </ng-container>
                     </ng-container>
                  </ng-container>
                  <!-- Recurse into children -->
                  <ng-container *ngFor="let child of node.children">
                     <ng-container *ngTemplateOutlet="nodeRenderer; context: { $implicit: child, depth: depth + 1 }"></ng-container>
                  </ng-container>
               </ng-container>

               <!-- DETAIL type — Numbered sub-detail (1.1, 1.2) -->
               <ng-container *ngIf="node.type === 'detail'">
                  <div class="npa-doc-detail-head">
                     <span class="text-slate-500 text-[13px] font-medium mr-1">{{ node.numbering }}</span>
                     <span class="text-[13px] font-medium text-slate-700">{{ node.label }}</span>
                  </div>
                  <ng-container *ngIf="node.fieldKeys?.length">
                     <ng-container *ngFor="let fk of node.fieldKeys">
                        <ng-container *ngIf="getFieldForKey(fk) as field">
                           <ng-container *ngTemplateOutlet="fieldBlock; context: { $implicit: field }"></ng-container>
                        </ng-container>
                     </ng-container>
                  </ng-container>
               </ng-container>

               <!-- TABLE type — Structured table (risk matrix, entity table) -->
               <ng-container *ngIf="node.type === 'table'">
                  <div class="npa-doc-table-wrap">
                     <table class="npa-doc-table">
                        <thead>
                           <tr>
                              <th *ngFor="let col of node.tableColumns">{{ col }}</th>
                           </tr>
                        </thead>
                        <tbody>
                           <tr *ngFor="let row of node.tableFieldMapping">
                              <td class="font-medium">{{ row.rowLabel }}</td>
                              <ng-container *ngIf="getFieldForKey(row.fieldKey) as field">
                                 <!-- Split pipe-delimited values into cells -->
                                 <td *ngFor="let cell of splitTableValue(field.value, (node.tableColumns?.length || 2) - 1)"
                                     (click)="onFieldFocus(field)"
                                     class="cursor-pointer hover:bg-blue-50"
                                     [class.text-slate-800]="cell === 'Yes'"
                                     [class.text-slate-400]="cell === 'No' || cell === 'N/A'">
                                    {{ cell }}
                                 </td>
                              </ng-container>
                              <ng-container *ngIf="!getFieldForKey(row.fieldKey)">
                                 <td *ngFor="let col of node.tableColumns?.slice(1)" class="text-slate-300 italic">—</td>
                              </ng-container>
                           </tr>
                        </tbody>
                     </table>
                  </div>
               </ng-container>

            </ng-template>

            <!-- ── Field rendering block (shared by all node types) ── -->
            <ng-template #fieldBlock let-field>
               <div class="npa-doc-field" (click)="onFieldFocus(field)">
                  <div class="npa-doc-field-label">
                     <span class="npa-doc-field-name">{{ field.label }}:</span>
                     <span *ngIf="field.required" class="text-red-500 text-[11px]">*</span>
                     <span class="w-2 h-2 rounded-full flex-none ml-1"
                           [class.bg-emerald-400]="field.lineage === 'AUTO' && field.value"
                           [class.bg-amber-400]="field.lineage === 'ADAPTED' && field.value"
                           [class.bg-blue-400]="field.lineage === 'MANUAL' && field.value"
                           [class.bg-slate-300]="!field.value"
                           [class.ring-1]="!field.value"
                           [class.ring-slate-200]="!field.value"
                           [title]="field.value ? field.lineage : 'Empty'"></span>
                  </div>
                  <div *ngIf="editingField !== field.key"
                       class="npa-doc-field-value doc-content cursor-text"
                       [class.npa-doc-empty]="!field.value"
                       (click)="startEditing(field)"
                       [innerHTML]="formatDocContent(field.value) || getEmptyPlaceholder('Click to add content...')">
                  </div>
                  <textarea *ngIf="editingField === field.key"
                            #editArea [(ngModel)]="field.value" (blur)="stopEditing()" (input)="autoSize($event)"
                            class="w-full text-[14px] text-slate-800 leading-relaxed border border-blue-400 bg-blue-50/30 outline-none ring-1 ring-blue-200 resize-none px-3 py-2 rounded"
                            rows="6"></textarea>
               </div>
            </ng-template>

            </ng-container>

            <!-- ====== FORM VIEW (Template Tree — same hierarchy as Doc View) ====== -->
            <ng-container *ngIf="viewMode === 'form'">

            <div class="npa-form-body">

               <!-- Part C header -->
               <div class="npa-form-part-head">
                  <h2 class="text-[14px] font-bold text-slate-700 uppercase tracking-wide">Part C: Product Information to be Completed by Proposing Unit</h2>
               </div>

               <!-- Render Part C sections -->
               <ng-container *ngFor="let sectionNode of templateTree.children">
                  <ng-container *ngTemplateOutlet="formNodeRenderer; context: { $implicit: sectionNode, depth: 0 }"></ng-container>
               </ng-container>

               <!-- Appendices header -->
               <div class="npa-form-part-head" style="margin-top:20px;">
                  <h2 class="text-[14px] font-bold text-slate-700 uppercase tracking-wide">Appendices</h2>
               </div>

               <!-- Render Appendices -->
               <ng-container *ngFor="let appNode of appendicesTree">
                  <ng-container *ngTemplateOutlet="formNodeRenderer; context: { $implicit: appNode, depth: 0 }"></ng-container>
               </ng-container>

               <!-- Bottom padding -->
               <div class="h-20"></div>
            </div>

            <!-- ── Form View recursive node renderer ── -->
            <ng-template #formNodeRenderer let-node let-depth="depth">

               <!-- SECTION / APPENDIX — card with header -->
               <ng-container *ngIf="node.type === 'section' || node.type === 'appendix'">
                  <div [id]="'sec-' + node.id" class="npa-form-section">
                     <div class="npa-form-section-head">
                        <div class="flex items-center justify-between">
                           <h2 class="text-[15px] font-bold text-slate-900">
                              <span class="text-slate-500 mr-1">{{ node.numbering }}</span>
                              <span *ngIf="node.numbering && !node.numbering.startsWith('Appendix')">.</span>
                              {{ node.label }}
                           </h2>
                           <span class="text-[10px] font-medium text-slate-400">{{ getNodeCompletion(node.id) }}%</span>
                        </div>
                        <p *ngIf="node.guidance" class="text-[12px] text-slate-500 mt-1 italic">{{ node.guidance }}</p>
                     </div>
                     <div class="npa-form-section-body">
                        <!-- Section-level fields -->
                        <ng-container *ngIf="node.fieldKeys?.length">
                           <div class="npa-form-field-grid">
                              <ng-container *ngFor="let fk of node.fieldKeys">
                                 <ng-container *ngIf="getFieldForKey(fk) as field">
                                    <ng-container *ngTemplateOutlet="formFieldBlock; context: { $implicit: field }"></ng-container>
                                 </ng-container>
                              </ng-container>
                           </div>
                        </ng-container>
                        <!-- Recurse into children -->
                        <ng-container *ngFor="let child of node.children">
                           <ng-container *ngTemplateOutlet="formNodeRenderer; context: { $implicit: child, depth: depth + 1 }"></ng-container>
                        </ng-container>
                     </div>
                  </div>
               </ng-container>

               <!-- TOPIC — numbered heading (1, 2, 3) with grouped fields -->
               <ng-container *ngIf="node.type === 'topic'">
                  <div class="npa-form-topic">
                     <h3 class="npa-form-topic-head">
                        <span class="text-slate-400 mr-1">{{ node.numbering }}.</span> {{ node.label }}
                     </h3>
                     <div *ngIf="node.guidance" class="npa-form-guidance">
                        <p>{{ node.guidance }}</p>
                     </div>
                     <ng-container *ngIf="node.fieldKeys?.length">
                        <div class="npa-form-field-grid">
                           <ng-container *ngFor="let fk of node.fieldKeys">
                              <ng-container *ngIf="getFieldForKey(fk) as field">
                                 <ng-container *ngTemplateOutlet="formFieldBlock; context: { $implicit: field }"></ng-container>
                              </ng-container>
                           </ng-container>
                        </div>
                     </ng-container>
                     <ng-container *ngFor="let child of node.children">
                        <ng-container *ngTemplateOutlet="formNodeRenderer; context: { $implicit: child, depth: depth + 1 }"></ng-container>
                     </ng-container>
                  </div>
               </ng-container>

               <!-- SUB_QUESTION — lettered (a, b, c) -->
               <ng-container *ngIf="node.type === 'sub_question'">
                  <div class="npa-form-subq">
                     <h4 class="npa-form-subq-head">
                        <span class="text-slate-400 mr-1">{{ node.numbering }}</span> {{ node.label }}
                     </h4>
                     <div *ngIf="node.guidance" class="npa-form-guidance npa-form-guidance-sm">
                        <p>{{ node.guidance }}</p>
                     </div>
                     <ng-container *ngIf="node.fieldKeys?.length">
                        <div class="npa-form-field-grid">
                           <ng-container *ngFor="let fk of node.fieldKeys">
                              <ng-container *ngIf="getFieldForKey(fk) as field">
                                 <ng-container *ngTemplateOutlet="formFieldBlock; context: { $implicit: field }"></ng-container>
                              </ng-container>
                           </ng-container>
                        </div>
                     </ng-container>
                     <ng-container *ngFor="let child of node.children">
                        <ng-container *ngTemplateOutlet="formNodeRenderer; context: { $implicit: child, depth: depth + 1 }"></ng-container>
                     </ng-container>
                  </div>
               </ng-container>

               <!-- DETAIL — numbered sub-detail -->
               <ng-container *ngIf="node.type === 'detail'">
                  <div class="npa-form-detail">
                     <span class="text-slate-400 text-[12px] font-medium mr-1">{{ node.numbering }}</span>
                     <span class="text-[13px] font-medium text-slate-600">{{ node.label }}</span>
                  </div>
                  <ng-container *ngIf="node.fieldKeys?.length">
                     <div class="npa-form-field-grid" style="padding-left:20px;">
                        <ng-container *ngFor="let fk of node.fieldKeys">
                           <ng-container *ngIf="getFieldForKey(fk) as field">
                              <ng-container *ngTemplateOutlet="formFieldBlock; context: { $implicit: field }"></ng-container>
                           </ng-container>
                        </ng-container>
                     </div>
                  </ng-container>
               </ng-container>

               <!-- TABLE — same as Doc View -->
               <ng-container *ngIf="node.type === 'table'">
                  <div class="npa-doc-table-wrap" style="margin: 8px 0 16px;">
                     <table class="npa-doc-table">
                        <thead>
                           <tr>
                              <th *ngFor="let col of node.tableColumns">{{ col }}</th>
                           </tr>
                        </thead>
                        <tbody>
                           <tr *ngFor="let row of node.tableFieldMapping">
                              <td class="font-medium">{{ row.rowLabel }}</td>
                              <ng-container *ngIf="getFieldForKey(row.fieldKey) as field">
                                 <td *ngFor="let cell of splitTableValue(field.value, (node.tableColumns?.length || 2) - 1)"
                                     (click)="onFieldFocus(field)"
                                     class="cursor-pointer hover:bg-blue-50"
                                     [class.text-slate-800]="cell === 'Yes'"
                                     [class.text-slate-400]="cell === 'No' || cell === 'N/A'">
                                    {{ cell }}
                                 </td>
                              </ng-container>
                              <ng-container *ngIf="!getFieldForKey(row.fieldKey)">
                                 <td *ngFor="let col of node.tableColumns?.slice(1)" class="text-slate-300 italic">—</td>
                              </ng-container>
                           </tr>
                        </tbody>
                     </table>
                  </div>
               </ng-container>

            </ng-template>

            <!-- ── Form View field input block ── -->
            <ng-template #formFieldBlock let-field>
               <div class="npa-form-field" [class.npa-form-field-wide]="field.type === 'textarea'" (click)="onFieldFocus(field)">
                  <label class="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
                     {{ field.label }}
                     <span *ngIf="field.required" class="text-red-500">*</span>
                     <span class="inline-block w-2 h-2 rounded-full ml-1 -mt-px"
                           [class.bg-emerald-400]="field.lineage === 'AUTO' && field.value"
                           [class.bg-amber-400]="field.lineage === 'ADAPTED' && field.value"
                           [class.bg-blue-400]="field.lineage === 'MANUAL' && field.value"
                           [class.bg-slate-300]="!field.value"
                           [title]="field.value ? field.lineage : 'Empty'"></span>
                  </label>
                  <select *ngIf="field.type === 'select'" [(ngModel)]="field.value"
                          [ngClass]="getInputStyles(field.lineage, focusedField?.key === field.key)"
                          class="w-full text-sm rounded-md px-3 py-2 outline-none transition-all appearance-none bg-white">
                     <option value="" disabled>Select...</option>
                     <option *ngFor="let opt of field.options" [value]="opt">{{ opt }}</option>
                  </select>
                  <input *ngIf="field.type === 'date'" [(ngModel)]="field.value" type="date"
                         [ngClass]="getInputStyles(field.lineage, focusedField?.key === field.key)"
                         class="w-full text-sm rounded-md px-3 py-2 outline-none transition-all">
                  <input *ngIf="field.type !== 'textarea' && field.type !== 'file' && field.type !== 'select' && field.type !== 'date'"
                         [(ngModel)]="field.value" [type]="field.type || 'text'" [placeholder]="field.tooltip || field.placeholder || ''"
                         [ngClass]="getInputStyles(field.lineage, focusedField?.key === field.key)"
                         class="w-full text-sm rounded-md px-3 py-2 outline-none transition-all">
                  <textarea *ngIf="field.type === 'textarea'" [(ngModel)]="field.value"
                            [rows]="getTextareaRows(field.value)"
                            [placeholder]="field.tooltip || field.placeholder || ''"
                            [ngClass]="getInputStyles(field.lineage, focusedField?.key === field.key)"
                            class="w-full text-sm rounded-md px-3 py-2 outline-none transition-all resize-y"></textarea>
               </div>
            </ng-template>

            </ng-container>

         </div>

         <!-- RIGHT SIDEBAR — Source Inspector + Similar NPAs -->
         <div class="w-80 bg-white border-l border-slate-200 flex-none flex-col overflow-y-auto hidden lg:flex">

               <!-- Source Inspector Header -->
               <div class="h-11 border-b border-slate-100 flex items-center justify-between px-4 bg-slate-50 flex-none">
                   <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <lucide-icon name="eye" class="w-3.5 h-3.5"></lucide-icon> Source Inspector
                   </h3>
                   <button *ngIf="focusedField" (click)="focusedField = null" class="text-slate-400 hover:text-slate-600 p-1">
                      <lucide-icon name="x" class="w-4 h-4"></lucide-icon>
                   </button>
               </div>

               <div class="flex-1 overflow-y-auto">

               <!-- Focused field detail -->
               <ng-container *ngIf="focusedField">
               <div class="p-4 space-y-4 border-b border-slate-100">
                   <div>
                      <p class="text-[11px] uppercase font-bold text-slate-400 mb-0.5">Field</p>
                      <h2 class="text-sm font-bold text-slate-900">{{ focusedField.label }}</h2>
                      <div class="mt-1.5 flex items-center gap-2">
                         <span class="px-2 py-0.5 rounded text-[11px] font-bold uppercase flex items-center gap-1"
                               [ngClass]="getLineageBadgeClass(focusedField.lineage, !!focusedField.value)">
                            <span class="w-1.5 h-1.5 rounded-full"
                                  [class.bg-emerald-500]="focusedField.lineage === 'AUTO' && focusedField.value"
                                  [class.bg-amber-500]="focusedField.lineage === 'ADAPTED' && focusedField.value"
                                  [class.bg-blue-500]="focusedField.lineage === 'MANUAL' && focusedField.value"
                                  [class.bg-slate-400]="!focusedField.value"></span>
                            {{ focusedField.value ? focusedField.lineage : 'EMPTY' }}
                         </span>
                         <span *ngIf="focusedField.lineageMetadata?.confidenceScore" class="text-[11px] font-medium text-slate-400">
                            {{ focusedField.lineageMetadata?.confidenceScore }}% confidence
                         </span>
                      </div>
                   </div>

                   <!-- AUTO / ADAPTED — show source info -->
                   <div *ngIf="focusedField.lineage !== 'MANUAL' && focusedField.value">
                      <div *ngIf="focusedField.lineageMetadata?.adaptationLogic" class="bg-amber-50 rounded-md p-2.5 border border-amber-100 mb-3">
                         <p class="text-[11px] font-bold text-amber-800 mb-0.5">Adaptation Logic</p>
                         <p class="text-xs text-amber-700 leading-relaxed">{{ focusedField.lineageMetadata?.adaptationLogic }}</p>
                      </div>
                      <div *ngIf="focusedField.lineageMetadata?.sourceSnippet">
                         <p class="text-[11px] uppercase font-bold text-slate-400 mb-0.5">Source</p>
                         <div class="bg-slate-50 rounded-md p-2.5 border border-slate-200 text-xs text-slate-600 leading-relaxed">
                            "{{ focusedField.lineageMetadata?.sourceSnippet }}"
                         </div>
                      </div>
                   </div>

                   <!-- MANUAL or EMPTY — Ask Agent to Draft CTA -->
                   <div *ngIf="focusedField.lineage === 'MANUAL' || !focusedField.value">
                      <div class="bg-blue-50 rounded-md p-3 border border-blue-100 text-center">
                         <div class="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-1.5">
                            <lucide-icon name="bot" class="w-3.5 h-3.5 text-blue-600"></lucide-icon>
                         </div>
                         <h4 class="text-xs font-bold text-blue-900 mb-0.5">{{ focusedField.value ? 'Refine with AI' : 'Draft with AI' }}</h4>
                         <p class="text-[11px] text-blue-700 mb-2">{{ focusedField.lineageMetadata?.agentTip || 'Agent can draft content for this field based on product context and KB.' }}</p>
                         <button (click)="askAgentToDraft(focusedField)"
                                 [disabled]="isDraftingField"
                                 class="w-full py-2 rounded text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                                 [ngClass]="isDraftingField ? 'bg-blue-300 text-blue-100 cursor-wait' : 'bg-dbs-primary hover:bg-dbs-primary-hover text-white'">
                            <lucide-icon [name]="isDraftingField ? 'loader-2' : 'sparkles'" class="w-3.5 h-3.5" [class.animate-spin]="isDraftingField"></lucide-icon>
                            {{ isDraftingField ? 'Drafting...' : 'Ask Agent to Draft' }}
                         </button>
                      </div>
                   </div>
               </div>
               </ng-container>

               <!-- No field selected prompt -->
               <div *ngIf="!focusedField" class="p-4 text-center text-slate-400 border-b border-slate-100">
                  <lucide-icon name="mouse-pointer-click" class="w-5 h-5 mx-auto mb-1.5 text-slate-300"></lucide-icon>
                  <p class="text-[11px]">Click any field to inspect its source and lineage</p>
               </div>

               <!-- Similar NPAs Reference Panel -->
               <div class="p-4">
                  <div class="flex items-center justify-between mb-3">
                     <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <lucide-icon name="git-compare" class="w-3.5 h-3.5"></lucide-icon> Similar NPA Drafts
                     </h3>
                     <button *ngIf="similarNpas.length === 0 && !isLoadingSimilar"
                             (click)="loadSimilarNpas()"
                             class="text-[10px] font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                        Load
                     </button>
                     <button *ngIf="similarNpas.length > 0"
                             (click)="loadSimilarNpas()"
                             class="text-[10px] font-semibold text-slate-400 hover:text-slate-600 transition-colors">
                        Refresh
                     </button>
                  </div>

                  <!-- Loading state -->
                  <div *ngIf="isLoadingSimilar" class="text-center py-4">
                     <lucide-icon name="loader-2" class="w-4 h-4 mx-auto text-blue-500 animate-spin mb-1"></lucide-icon>
                     <p class="text-[11px] text-slate-400">Finding similar NPAs...</p>
                  </div>

                  <!-- Empty state -->
                  <div *ngIf="!isLoadingSimilar && similarNpas.length === 0" class="bg-slate-50 rounded-lg p-3 text-center border border-dashed border-slate-200">
                     <lucide-icon name="file-search" class="w-5 h-5 mx-auto mb-1 text-slate-300"></lucide-icon>
                     <p class="text-[11px] text-slate-400 mb-1">Find previously approved NPAs with similar product type or risk profile</p>
                     <button (click)="loadSimilarNpas()"
                             class="px-3 py-1.5 bg-white border border-slate-200 rounded text-[11px] font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors">
                        Find Similar NPAs
                     </button>
                  </div>

                  <!-- Similar NPAs list -->
                  <div *ngIf="!isLoadingSimilar && similarNpas.length > 0" class="space-y-2">
                     <div *ngFor="let npa of similarNpas"
                          class="rounded-lg border border-slate-100 p-2.5 hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer group"
                          (click)="viewSimilarNpa(npa)">
                        <div class="flex items-start justify-between gap-2">
                           <div class="min-w-0 flex-1">
                              <p class="text-[12px] font-semibold text-slate-800 truncate group-hover:text-blue-700">{{ npa.title }}</p>
                              <p class="text-[10px] text-slate-400 mt-0.5">{{ npa.npa_type }} &middot; {{ npa.product_category || 'General' }}</p>
                           </div>
                           <span class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase flex-none"
                                 [ngClass]="npa.status === 'Approved' ? 'bg-emerald-50 text-emerald-700' : npa.status === 'Draft' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-500'">
                              {{ npa.status }}
                           </span>
                        </div>
                        <div class="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400">
                           <span class="flex items-center gap-0.5">
                              <lucide-icon name="shield" class="w-3 h-3"></lucide-icon>
                              {{ npa.risk_level || 'N/A' }}
                           </span>
                           <span>&middot;</span>
                           <span>{{ npa.current_stage }}</span>
                           <span class="ml-auto flex items-center gap-0.5 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                              <lucide-icon name="external-link" class="w-3 h-3"></lucide-icon>
                              View
                           </span>
                        </div>
                     </div>
                  </div>
               </div>

               </div>
         </div>

    </div>

    <!-- VALIDATION OVERLAY -->
    <div *ngIf="showValidationModal" class="fixed inset-0 z-[300] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 lg:p-12 animate-in fade-in duration-200">
        <div class="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-full">
            <div class="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="p-2 bg-white/10 rounded-lg">
                        <lucide-icon name="shield-check" class="w-5 h-5 text-emerald-400"></lucide-icon>
                    </div>
                    <div>
                        <h3 class="font-bold text-lg">Governance Check</h3>
                        <p class="text-xs text-slate-400">Agent Assessment Results</p>
                    </div>
                </div>
                <button (click)="closeValidationModal()" class="text-slate-400 hover:text-white transition-colors">
                    <lucide-icon name="x" class="w-6 h-6"></lucide-icon>
                </button>
            </div>

            <div class="p-6 overflow-y-auto" *ngIf="validationResult">
                <div class="flex items-center justify-between mb-6 p-4 rounded-xl border"
                     [ngClass]="validationResult.isReady ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'">
                    <div>
                        <h4 class="text-sm font-medium uppercase tracking-wider"
                           [ngClass]="validationResult.isReady ? 'text-emerald-800' : 'text-red-800'">
                           Readiness Score
                        </h4>
                        <div class="text-4xl font-bold mt-1"
                             [ngClass]="validationResult.isReady ? 'text-emerald-700' : 'text-red-700'">
                             {{ validationResult.score }}%
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide"
                             [ngClass]="validationResult.isReady ? 'bg-emerald-200 text-emerald-800' : 'bg-red-200 text-red-800'">
                            {{ validationResult.isReady ? 'Ready for Review' : 'Issues Found' }}
                        </div>
                    </div>
                </div>

                <div class="space-y-4">
                    <h5 class="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Domain Breakdown</h5>
                    <div *ngFor="let d of validationResult.domains" class="flex gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                        <div class="mt-0.5">
                            <lucide-icon *ngIf="d.status === 'PASS'" name="check-circle" class="w-5 h-5 text-emerald-500"></lucide-icon>
                            <lucide-icon *ngIf="d.status === 'FAIL'" name="x-circle" class="w-5 h-5 text-red-500"></lucide-icon>
                            <lucide-icon *ngIf="d.status === 'MISSING'" name="alert-circle" class="w-5 h-5 text-amber-500"></lucide-icon>
                        </div>
                        <div>
                            <div class="flex items-center gap-2 mb-1">
                                <span class="font-bold text-sm text-slate-900">{{ d.name }}</span>
                                <span class="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase"
                                      [ngClass]="getDomainStatusClass(d.status)">
                                    {{ d.status }}
                                </span>
                            </div>
                            <p class="text-xs text-slate-600 leading-relaxed">{{ d.observation }}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end">
                <button (click)="closeValidationModal()" class="px-5 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-colors">
                    Close
                </button>
            </div>
        </div>
    </div>

   `,
   styles: [`
    :host { display: contents; }
    /* Custom Scrollbar */
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
    /* Smooth whitespace for narrative fields */
    .whitespace-pre-wrap { white-space: pre-wrap; word-break: break-word; }

    /* ===== Confluence-style NPA Document Layout ===== */
    .npa-doc-body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, sans-serif;
      color: #172b4d;
    }

    /* Section heading — clean left border */
    .npa-doc-section-head {
      padding: 14px 40px 12px;
      margin-top: 8px;
      border-left: 3px solid #94a3b8;
      background: #fafbfc;
    }

    /* Field container */
    .npa-doc-fields {
      padding: 8px 40px 16px 52px;
    }

    /* Individual field — compact like a document line */
    .npa-doc-field {
      padding: 6px 0;
      border-bottom: 1px solid #f1f3f5;
    }
    .npa-doc-field:last-child { border-bottom: none; }
    .npa-doc-field:hover { background: #fafbfc; }

    /* Sub-section header */
    .npa-doc-subheader {
      padding: 14px 0 6px;
      margin-top: 4px;
      border-bottom: 1px solid #dfe1e6;
    }

    /* Field label row — numbered like Confluence */
    .npa-doc-field-label {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-bottom: 2px;
    }
    .npa-doc-field-num {
      font-size: 13px;
      font-weight: 600;
      color: #626f86;
      min-width: 20px;
    }
    .npa-doc-field-name {
      font-size: 13px;
      font-weight: 600;
      color: #44546f;
    }

    /* Field value — clean document text */
    .npa-doc-field-value {
      font-size: 14px;
      line-height: 1.7;
      color: #172b4d;
      padding: 2px 0 2px 24px;
      word-break: break-word;
    }
    .npa-doc-empty .npa-doc-field-value,
    .npa-doc-field-value.npa-doc-empty {
      color: #b3bac5;
      font-style: italic;
    }

    /* ===== Part Header (Part C / Appendices) ===== */
    .npa-doc-part-head {
      padding: 16px 40px 10px;
      margin-top: 12px;
      border-bottom: 1px solid #d1d5db;
      background: #f9fafb;
    }

    /* ===== Topic heading (numbered 1, 2, 3) ===== */
    .npa-doc-topic-head {
      padding: 14px 0 4px;
      margin-top: 8px;
      border-bottom: 1px solid #e2e8f0;
    }

    /* ===== Sub-question heading (lettered a, b, c) ===== */
    .npa-doc-subq-head {
      padding: 10px 0 2px;
      margin-top: 4px;
      padding-left: 12px;
      border-left: 2px solid #e2e8f0;
    }

    /* ===== Detail heading (1.1, 1.2) ===== */
    .npa-doc-detail-head {
      padding: 6px 0 2px;
      padding-left: 24px;
    }

    /* ===== Guidance / instructional text ===== */
    .npa-doc-guidance {
      background: #f8fafc;
      border-left: 3px solid #cbd5e1;
      padding: 8px 14px;
      margin: 6px 0 10px;
      border-radius: 0 4px 4px 0;
    }
    .npa-doc-guidance p {
      font-size: 13px;
      font-style: italic;
      color: #64748b;
      line-height: 1.6;
      margin: 0;
    }
    .npa-doc-guidance-sub {
      margin-left: 12px;
    }

    /* ===== Table styling (risk matrix, entity table) ===== */
    .npa-doc-table-wrap {
      margin: 10px 0 16px;
      overflow-x: auto;
    }
    .npa-doc-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    .npa-doc-table th {
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      padding: 8px 12px;
      text-align: left;
      font-weight: 700;
      color: #334155;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .npa-doc-table td {
      border: 1px solid #e2e8f0;
      padding: 6px 12px;
      color: #1e293b;
    }
    .npa-doc-table tr:hover td {
      background: #f8fafc;
    }

    /* Document content styling — lists, paragraphs, markdown */
    .doc-content ul, .doc-content ol { padding-left: 1.25rem; margin: 4px 0; }
    .doc-content ul { list-style-type: disc; }
    .doc-content ol { list-style-type: decimal; }
    .doc-content li { margin-bottom: 2px; line-height: 1.65; font-size: 14px; }
    .doc-content p { margin-bottom: 4px; line-height: 1.65; }
    .doc-content p:last-child { margin-bottom: 0; }
    .doc-content strong { font-weight: 700; color: #1e293b; }
    .doc-content table { width: 100%; border-collapse: collapse; margin: 6px 0; font-size: 13px; }
    .doc-content table th { background: #f1f5f9; border: 1px solid #e2e8f0; padding: 6px 10px; text-align: left; font-weight: 700; }
    .doc-content table td { border: 1px solid #e2e8f0; padding: 5px 10px; }

    /* ===== Form View — Template Tree Layout ===== */
    .npa-form-body {
      margin: 0;
      padding: 0 0 40px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, sans-serif;
    }
    .npa-form-part-head {
      padding: 14px 32px 10px;
      margin-top: 8px;
      border-bottom: 1px solid #d1d5db;
      background: #f9fafb;
    }
    .npa-form-section {
      margin: 8px 12px 0;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
      background: #fff;
    }
    .npa-form-section-head {
      padding: 14px 24px 12px;
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
      border-left: 3px solid #94a3b8;
    }
    .npa-form-section-body {
      padding: 12px 24px 20px;
    }
    .npa-form-topic {
      margin-top: 12px;
      padding-bottom: 4px;
    }
    .npa-form-topic-head {
      font-size: 14px;
      font-weight: 700;
      color: #1e293b;
      padding: 10px 0 4px;
      border-bottom: 1px solid #f1f5f9;
      margin-bottom: 8px;
    }
    .npa-form-subq {
      margin-top: 8px;
      padding-left: 10px;
      border-left: 2px solid #e2e8f0;
    }
    .npa-form-subq-head {
      font-size: 13px;
      font-weight: 600;
      color: #475569;
      padding: 6px 0 2px;
    }
    .npa-form-detail {
      padding: 4px 0 2px 16px;
    }
    .npa-form-guidance {
      background: #f8fafc;
      border-left: 3px solid #cbd5e1;
      padding: 6px 12px;
      margin: 4px 0 8px;
      border-radius: 0 4px 4px 0;
    }
    .npa-form-guidance p {
      font-size: 12px;
      font-style: italic;
      color: #64748b;
      line-height: 1.5;
      margin: 0;
    }
    .npa-form-guidance-sm {
      margin-left: 10px;
    }
    /* Field grid — 2 col for short fields, full width for textareas */
    .npa-form-field-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px 16px;
      margin-top: 4px;
      margin-bottom: 4px;
    }
    .npa-form-field {
      min-width: 0;
    }
    .npa-form-field-wide {
      grid-column: 1 / -1;
    }
  `]
})
export class NpaTemplateEditorComponent implements OnInit, OnDestroy {
   @Output() close = new EventEmitter<void>();
   @Input() inputData: any = null;
   @Output() onSave = new EventEmitter<any>();
   @Input() autofillStream: Subject<WorkflowStreamEvent> | null = null;
   @Input() initialViewMode: 'live' | 'document' | 'form' = 'document';

   private http = inject(HttpClient);
   private governanceService = inject(AgentGovernanceService);
   private npaService = inject(NpaService);

   activeSection = '';
   focusedField: NpaField | null = null;
   editingField: string | null = null;
   viewMode: 'live' | 'document' | 'form' = 'document';
   showValidationModal = false;
   validationResult: ReadinessResult | null = null;
   isRunningGovernance = false;
   isDraftingField = false;
   isLoadingSimilar = false;
   similarNpas: NpaListItem[] = [];

   // Live streaming state
   liveStreamText = '';
   liveNodes: { id: string; title: string; type: string; status: string; elapsedMs?: number }[] = [];
   liveCurrentNode: string | null = null;
   liveWorkflowStatus: 'idle' | 'running' | 'succeeded' | 'failed' = 'idle';
   liveElapsedSeconds = 0;
   liveError: string | null = null;
   private liveStreamSub: Subscription | null = null;
   private liveTimerInterval: any = null;
   private liveStartTime = 0;
   Math = Math; // Expose Math to template

   sections: NpaSection[] = [];

   // Template tree references
   templateTree = NPA_PART_C_TEMPLATE;
   appendicesTree = NPA_APPENDICES_TEMPLATE;
   templateNavSections = getNavSections();

   // O(1) field lookup by key — built after sections load
   private fieldMap = new Map<string, NpaField>();

   // Cache for node completion calculations
   private completionCache = new Map<string, number>();
   // All template nodes indexed by id (for completion lookups)
   private nodeIndex = new Map<string, TemplateNode>();

   ngOnInit() {
      const projectId = this.inputData?.projectId || this.inputData?.id || this.inputData?.npaId;
      if (projectId) {
         this.npaService.getFormSections(projectId).subscribe({
            next: (apiSections) => {
               this.sections = apiSections.map((s: any) => ({
                  id: s.section_id || s.id,
                  title: s.title,
                  description: s.description,
                  fields: (s.fields || []).map((f: any) => ({
                     key: f.field_key || f.key,
                     label: f.label,
                     value: f.value || f.field_value || '',
                     lineage: f.lineage || 'MANUAL',
                     type: f.field_type || f.type || 'text',
                     required: f.is_required || f.required,
                     tooltip: f.tooltip,
                     placeholder: f.tooltip || '',
                     options: (f.options || []).map((o: any) => o.label || o.value || o),
                     lineageMetadata: f.metadata ? (typeof f.metadata === 'string' ? JSON.parse(f.metadata) : f.metadata) : undefined
                  }))
               }));
               // Build O(1) field lookup map
               this.buildFieldMap();
               // Build node index for completion calculations
               this.buildNodeIndex();

               if (this.sections.length > 0) {
                  this.activeSection = this.templateNavSections.length > 0 ? this.templateNavSections[0].id : this.sections[0].id;
               }
               if (this.inputData) {
                  this.mergeInputData();
               }
            },
            error: () => {
               console.warn('[TemplateEditor] Could not load form sections from API');
               if (this.inputData) {
                  this.mergeInputData();
               }
            }
         });
      } else {
         if (this.inputData) {
            this.mergeInputData();
         }
      }

      // Initialize from parent's requested viewMode
      if (this.initialViewMode) {
         this.viewMode = this.initialViewMode;
      }
      // Subscribe to autofill stream if provided
      if (this.autofillStream) {
         this.subscribeLiveStream();
      }
   }

   ngOnDestroy(): void {
      this.liveStreamSub?.unsubscribe();
      this.clearLiveTimer();
   }

   private subscribeLiveStream(): void {
      if (!this.autofillStream) return;

      this.liveWorkflowStatus = 'running';
      this.liveStartTime = Date.now();
      this.liveStreamText = '';
      this.liveNodes = [];
      this.liveError = null;

      // Elapsed-time timer
      this.liveTimerInterval = setInterval(() => {
         this.liveElapsedSeconds = Math.floor((Date.now() - this.liveStartTime) / 1000);
      }, 1000);

      this.liveStreamSub = this.autofillStream.subscribe({
         next: (event) => {
            switch (event.type) {
               case 'workflow_started':
                  this.liveWorkflowStatus = 'running';
                  break;
               case 'node_started':
                  this.liveCurrentNode = event.title;
                  this.liveNodes.push({
                     id: event.nodeId, title: event.title,
                     type: event.nodeType, status: 'running'
                  });
                  break;
               case 'node_finished': {
                  const node = this.liveNodes.find(n => n.id === event.nodeId);
                  if (node) {
                     node.status = event.status;
                     node.elapsedMs = event.elapsedMs;
                  }
                  if (this.liveCurrentNode === event.title) this.liveCurrentNode = null;
                  break;
               }
               case 'text_chunk':
                  this.liveStreamText += event.text;
                  break;
               case 'workflow_finished':
                  this.liveWorkflowStatus = event.status === 'succeeded' ? 'succeeded' : 'failed';
                  break;
               case 'error':
                  this.liveError = event.message;
                  this.liveWorkflowStatus = 'failed';
                  break;
            }
         },
         error: (err) => {
            this.liveError = err.message || 'Stream error';
            this.liveWorkflowStatus = 'failed';
            this.clearLiveTimer();
         },
         complete: () => {
            this.clearLiveTimer();
            // Auto-switch to Doc view after brief delay
            if (this.liveWorkflowStatus === 'succeeded') {
               setTimeout(() => { this.viewMode = 'document'; }, 2000);
            }
         }
      });
   }

   private clearLiveTimer(): void {
      if (this.liveTimerInterval) {
         clearInterval(this.liveTimerInterval);
         this.liveTimerInterval = null;
      }
   }

   /** Escape HTML for Live view text rendering */
   formatLiveText(text: string): string {
      if (!text) return '<span class="text-slate-300 italic">Waiting for output...</span>';
      return text
         .replace(/&/g, '&amp;')
         .replace(/</g, '&lt;')
         .replace(/>/g, '&gt;')
         .replace(/\n/g, '<br>');
   }

   // --- Document helpers ---
   getDocTitle(): string {
      const titleField = this.findFieldByKey('product_name');
      return titleField?.value || this.inputData?.title || 'Untitled NPA';
   }

   getDocSubtitle(): string {
      const descField = this.findFieldByKey('product_description');
      if (descField?.value) {
         return descField.value.length > 150 ? descField.value.substring(0, 150) + '...' : descField.value;
      }
      return this.inputData?.description || '';
   }

   getDocDate(): string {
      const dateField = this.findFieldByKey('kickoff_date');
      return dateField?.value || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
   }

   getDocOwner(): string {
      const owner = this.findFieldByKey('product_manager_name');
      return owner?.value || this.inputData?.submitted_by || 'Product Manager';
   }

   getSectionNumber(index: number): string {
      const romans = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII'];
      return romans[index] || String(index + 1);
   }

   /** HTML placeholder for empty field values */
   getEmptyPlaceholder(text: string): string {
      return '<span class="text-slate-400 italic">' + text + '</span>';
   }

   /** Return 1-based number for non-header fields within a section */
   getFieldNumber(section: NpaSection, fieldIndex: number): number {
      let count = 0;
      for (let i = 0; i <= fieldIndex; i++) {
         if (section.fields[i]?.type !== 'header') count++;
      }
      return count;
   }

   getSectionCompletion(section: NpaSection): number {
      const fields = section.fields.filter(f => f.type !== 'header');
      if (fields.length === 0) return 100;
      const filled = fields.filter(f => f.value && f.value.trim().length > 0).length;
      return Math.round((filled / fields.length) * 100);
   }

   getOverallCompletion(): number {
      const allFields = this.sections.flatMap(s => s.fields.filter(f => f.type !== 'header'));
      if (allFields.length === 0) return 0;
      const filled = allFields.filter(f => f.value && f.value.trim().length > 0).length;
      return Math.round((filled / allFields.length) * 100);
   }

   getLineageCount(lineage: string): number {
      return this.sections.flatMap(s => s.fields).filter(f => f.type !== 'header' && f.value && f.value.trim().length > 0 && f.lineage === lineage).length;
   }

   getTotalFieldCount(): number {
      return this.sections.flatMap(s => s.fields).filter(f => f.type !== 'header').length;
   }

   getFilledFieldCount(): number {
      return this.sections.flatMap(s => s.fields).filter(f => f.type !== 'header' && f.value && f.value.trim().length > 0).length;
   }

   private findFieldByKey(key: string): NpaField | undefined {
      for (const s of this.sections) {
         const f = s.fields.find(f => f.key === key);
         if (f) return f;
      }
      return undefined;
   }

   /**
    * Format raw text content into document-style HTML with bullet points and paragraphs.
    * Detects patterns like "- item", "• item", "1. item" and wraps them in proper HTML lists.
    * Also converts line breaks into paragraphs for a Confluence-like reading experience.
    */
   formatDocContent(value: string | null): string {
      if (!value || !value.trim()) return '';

      // Split into lines (preserve empty lines for paragraph breaks)
      const lines = value.split('\n');

      // Check if content contains a markdown table
      const hasTable = lines.some(l => l.trim().match(/^\|.*\|$/)) && lines.some(l => l.trim().match(/^\|[\s\-\|]+\|$/));
      if (hasTable) {
         return this.formatWithTables(lines);
      }

      const trimmedLines = lines.map(l => l.trim()).filter(l => l.length > 0);

      let html = '';
      let inList = false;
      let listType = '';

      for (const line of trimmedLines) {
         // Apply inline markdown: **bold**
         const processed = line.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

         // Detect bullet points: -, •, *, or numbered (1., 2., etc.)
         const bulletMatch = processed.match(/^[\-\•\*]\s+(.+)/);
         const numberedMatch = processed.match(/^\d+[\.\)]\s+(.+)/);

         if (bulletMatch) {
            if (!inList || listType !== 'ul') {
               if (inList) html += listType === 'ul' ? '</ul>' : '</ol>';
               html += '<ul>';
               inList = true;
               listType = 'ul';
            }
            html += `<li>${bulletMatch[1]}</li>`;
         } else if (numberedMatch) {
            if (!inList || listType !== 'ol') {
               if (inList) html += listType === 'ul' ? '</ul>' : '</ol>';
               html += '<ol>';
               inList = true;
               listType = 'ol';
            }
            html += `<li>${numberedMatch[1]}</li>`;
         } else {
            if (inList) {
               html += listType === 'ul' ? '</ul>' : '</ol>';
               inList = false;
            }
            // Check for semicolon-separated items — convert to bullet list
            if (line.includes(';') && line.split(';').length >= 3) {
               const items = line.split(';').map(i => i.trim()).filter(i => i);
               html += '<ul>';
               for (const item of items) {
                  html += `<li>${item.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')}</li>`;
               }
               html += '</ul>';
            } else {
               html += `<p>${processed}</p>`;
            }
         }
      }

      if (inList) {
         html += listType === 'ul' ? '</ul>' : '</ol>';
      }

      return html;
   }

   /** Parse markdown table syntax into HTML table */
   private formatWithTables(lines: string[]): string {
      let html = '';
      let inTable = false;
      let headerDone = false;
      let inList = false;
      let listType = '';

      for (const rawLine of lines) {
         const line = rawLine.trim();
         if (!line) continue;

         const processed = line.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

         // Table row detection
         if (line.match(/^\|.*\|$/)) {
            // Skip separator row (|---|---|)
            if (line.match(/^\|[\s\-\|:]+\|$/)) {
               continue;
            }
            if (inList) { html += listType === 'ul' ? '</ul>' : '</ol>'; inList = false; }
            const cells = line.split('|').slice(1, -1).map(c => c.trim().replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>'));
            if (!inTable) {
               html += '<table>';
               inTable = true;
               headerDone = false;
            }
            if (!headerDone) {
               html += '<thead><tr>' + cells.map(c => `<th>${c}</th>`).join('') + '</tr></thead><tbody>';
               headerDone = true;
            } else {
               html += '<tr>' + cells.map(c => `<td>${c}</td>`).join('') + '</tr>';
            }
         } else {
            if (inTable) { html += '</tbody></table>'; inTable = false; }
            // Bullet/numbered detection (same as formatDocContent)
            const bulletMatch = processed.match(/^[\-\•\*]\s+(.+)/);
            const numberedMatch = processed.match(/^\d+[\.\)]\s+(.+)/);
            if (bulletMatch) {
               if (!inList || listType !== 'ul') { if (inList) html += listType === 'ul' ? '</ul>' : '</ol>'; html += '<ul>'; inList = true; listType = 'ul'; }
               html += `<li>${bulletMatch[1]}</li>`;
            } else if (numberedMatch) {
               if (!inList || listType !== 'ol') { if (inList) html += listType === 'ul' ? '</ul>' : '</ol>'; html += '<ol>'; inList = true; listType = 'ol'; }
               html += `<li>${numberedMatch[1]}</li>`;
            } else {
               if (inList) { html += listType === 'ul' ? '</ul>' : '</ol>'; inList = false; }
               html += `<p>${processed}</p>`;
            }
         }
      }
      if (inTable) html += '</tbody></table>';
      if (inList) html += listType === 'ul' ? '</ul>' : '</ol>';
      return html;
   }

   // --- Inline editing ---
   startEditing(field: NpaField) {
      this.editingField = field.key;
      this.onFieldFocus(field);
      // Focus the input after Angular renders it
      setTimeout(() => {
         const el = document.querySelector('#form-container textarea:focus, #form-container input:focus') as HTMLElement;
         if (!el) {
            const editAreas = document.querySelectorAll('#form-container textarea, #form-container input[type="text"]');
            const last = editAreas[editAreas.length - 1] as HTMLElement;
            last?.focus();
         }
      }, 50);
   }

   stopEditing() {
      this.editingField = null;
   }

   // --- Governance Check — calls Dify WF_NPA_Governance agent first, then DB fallback ---
   validateGovernance() {
      this.isRunningGovernance = true;
      const projectId = this.inputData?.projectId || this.inputData?.id || this.inputData?.npaId;
      const desc = this.extractDescriptionFromForm();

      // Collect all filled fields as context for the Governance agent
      const filledFields: Record<string, string> = {};
      for (const section of this.sections) {
         for (const field of section.fields) {
            if (field.value && field.value.trim()) {
               filledFields[field.key] = field.value.substring(0, 500); // Cap length
            }
         }
      }

      // Step 1: Try Dify WF_NPA_Governance workflow agent
      const payload = {
         app: 'WF_NPA_Governance',
         inputs: {
            project_id: projectId || 'demo',
            product_description: desc,
            completion_pct: String(this.getOverallCompletion()),
            total_fields: String(this.getTotalFieldCount()),
            filled_fields: String(this.getFilledFieldCount()),
            auto_filled: String(this.getLineageCount('AUTO')),
            form_snapshot: JSON.stringify(filledFields)
         },
         response_mode: 'blocking'
      };

      this.http.post<any>('/api/dify/workflow', payload).subscribe({
         next: (res) => {
            // Parse agent response into ReadinessResult
            const agentResult = this.parseGovernanceAgentResponse(res);
            if (agentResult) {
               this.validationResult = agentResult;
               this.showValidationModal = true;
               this.isRunningGovernance = false;

               // Also persist to DB for audit trail
               if (projectId) {
                  this.governanceService.saveReadinessAssessment(projectId, agentResult).subscribe();
               }
            } else {
               // Agent returned no parseable result — fall back to DB service
               this.fallbackToDbGovernance(desc, projectId);
            }
         },
         error: () => {
            // Dify agent unreachable — fall back to DB-based governance service
            this.fallbackToDbGovernance(desc, projectId);
         }
      });
   }

   /** Parse Dify Governance agent response into ReadinessResult */
   private parseGovernanceAgentResponse(res: any): ReadinessResult | null {
      try {
         const output = res?.data?.outputs || res?.outputs || res;
         const text = output?.text || output?.result || res?.answer || '';

         // Try to parse structured JSON from agent output
         const jsonMatch = text.match(/\{[\s\S]*"score"[\s\S]*\}/);
         if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
               isReady: (parsed.score || 0) >= 85,
               score: parsed.score || 0,
               overallAssessment: parsed.assessment || parsed.overallAssessment || '',
               domains: (parsed.domains || []).map((d: any) => ({
                  name: d.name || d.domain,
                  status: d.status || 'PENDING',
                  observation: d.observation || d.finding || ''
               }))
            };
         }

         // If no structured JSON, build result from text
         if (text.length > 20) {
            const score = this.getOverallCompletion();
            return {
               isReady: score >= 85,
               score,
               overallAssessment: text.substring(0, 500),
               domains: [
                  { name: 'Governance Agent Assessment', status: score >= 85 ? 'PASS' : 'FAIL', observation: text.substring(0, 300) }
               ]
            };
         }

         return null;
      } catch {
         return null;
      }
   }

   /** Fallback: try DB governance service, then local generation */
   private fallbackToDbGovernance(desc: string, projectId: string | undefined) {
      this.governanceService.analyzeReadiness(desc, projectId).subscribe({
         next: (result) => {
            this.validationResult = result;
            this.showValidationModal = true;
            this.isRunningGovernance = false;
         },
         error: () => {
            this.isRunningGovernance = false;
            // Final fallback: generate from field stats
            this.validationResult = this.generateFallbackGovernanceResult();
            this.showValidationModal = true;
         }
      });
   }

   /** Final fallback governance result when both agent and DB are unavailable */
   private generateFallbackGovernanceResult(): ReadinessResult {
      const completion = this.getOverallCompletion();
      const autoCount = this.getLineageCount('AUTO');
      const adaptedCount = this.getLineageCount('ADAPTED');
      const manualCount = this.getLineageCount('MANUAL');
      const emptyCount = this.getTotalFieldCount() - this.getFilledFieldCount();
      const score = Math.min(completion, 100);
      return {
         isReady: score >= 85,
         score,
         overallAssessment: score >= 85
            ? `Draft is ${score}% complete with ${autoCount} AI-filled, ${adaptedCount} adapted, and ${manualCount} manual entries. Appears sufficiently complete for review.`
            : `Draft is only ${score}% complete with ${emptyCount} empty fields remaining. Address gaps before submitting for governance review.`,
         domains: [
            { name: 'Product Specifications', status: completion > 60 ? 'PASS' : 'FAIL', observation: `${completion}% of fields completed across template.` },
            { name: 'Risk Assessment', status: autoCount > 10 ? 'PASS' : 'MISSING', observation: `${autoCount} fields auto-filled by agent. Review for accuracy.` },
            { name: 'Operational Readiness', status: emptyCount < 20 ? 'PASS' : 'FAIL', observation: `${emptyCount} fields still empty — manual input needed.` },
            { name: 'Legal & Regulatory', status: completion > 70 ? 'PASS' : 'MISSING', observation: 'Regulatory fields need review for jurisdiction compliance.' },
            { name: 'Data Governance', status: completion > 80 ? 'PASS' : 'MISSING', observation: 'Data management and aggregation fields need confirmation.' }
         ]
      };
   }

   closeValidationModal() {
      this.showValidationModal = false;
      this.validationResult = null;
   }

   getDomainStatusClass(status: string): string {
      switch (status) {
         case 'PASS': return 'bg-emerald-100 text-emerald-800';
         case 'FAIL': return 'bg-red-100 text-red-800';
         case 'MISSING': return 'bg-amber-100 text-amber-800';
         default: return 'bg-slate-100 text-slate-800';
      }
   }

   private extractDescriptionFromForm(): string {
      const prodName = this.findFieldValue('Product Overview', 'Product Name') || this.findFieldByKey('product_name')?.value || '';
      const riskType = this.findFieldValue('Risk Assessment', 'Primary Risk Type') || this.findFieldByKey('risk_classification')?.value || '';
      const rationale = this.findFieldByKey('business_rationale')?.value || '';
      return `${prodName}. ${riskType}. ${rationale.substring(0, 300)}`;
   }

   private findFieldValue(sectionTitle: string, fieldLabel: string): string | undefined {
      const sec = this.sections.find(s => s.title === sectionTitle);
      return sec?.fields.find(f => f.label === fieldLabel)?.value;
   }

   /** Ask Agent to Draft — triggers Dify autofill workflow for the focused field */
   askAgentToDraft(field: NpaField) {
      this.isDraftingField = true;
      const projectId = this.inputData?.projectId || this.inputData?.id || this.inputData?.npaId;
      const productName = this.findFieldByKey('product_name')?.value || this.inputData?.title || '';
      const riskLevel = this.findFieldByKey('risk_classification')?.value || this.inputData?.riskLevel || '';

      // Call Dify workflow agent for autofill
      const payload = {
         app: 'WF_NPA_Template_Autofill',
         inputs: {
            project_id: projectId || 'demo',
            field_key: field.key,
            field_label: field.label,
            product_name: productName,
            risk_level: riskLevel,
            current_value: field.value || '',
            instruction: `Draft content for the "${field.label}" field of an NPA template. Use professional banking/risk language.`
         },
         response_mode: 'blocking'
      };

      this.http.post<any>('/api/dify/workflow', payload).subscribe({
         next: (res) => {
            const draftValue = res?.data?.outputs?.text || res?.data?.outputs?.result || res?.answer || '';
            if (draftValue) {
               field.value = draftValue;
               field.lineage = 'AUTO';
               field.lineageMetadata = {
                  sourceSnippet: 'Agent Autofill — Dify Workflow',
                  confidenceScore: 85,
                  agentTip: 'This content was drafted by the AI agent. Review and adapt as needed.'
               };
               this.buildFieldMap(); // Refresh map
            }
            this.isDraftingField = false;
         },
         error: () => {
            // Fallback: generate a placeholder draft locally
            field.value = this.generateLocalDraft(field);
            field.lineage = 'AUTO';
            field.lineageMetadata = {
               sourceSnippet: 'Local AI Draft (agent unavailable)',
               confidenceScore: 60,
               agentTip: 'Agent was unavailable. This is a template draft — please review and refine.'
            };
            this.buildFieldMap();
            this.isDraftingField = false;
         }
      });
   }

   /** Generate a local placeholder draft when Dify agent is unavailable */
   private generateLocalDraft(field: NpaField): string {
      const productName = this.findFieldByKey('product_name')?.value || 'the proposed product';
      const fieldLabel = field.label.toLowerCase();

      if (fieldLabel.includes('risk')) {
         return `Risk assessment for ${productName}:\n- Market Risk: Exposure to interest rate and FX fluctuations\n- Credit Risk: Counterparty default probability assessment required\n- Operational Risk: Settlement and booking system integration reviewed\n\nOverall risk level to be confirmed following detailed quantitative analysis.`;
      } else if (fieldLabel.includes('description') || fieldLabel.includes('rationale')) {
         return `${productName} is designed to meet client demand for structured hedging solutions in the current market environment. The product addresses a specific gap in the existing product suite and aligns with the bank's strategic growth objectives in this asset class.`;
      } else if (fieldLabel.includes('operational') || fieldLabel.includes('process')) {
         return `Operational workflow for ${productName}:\n- Trade capture: Murex (MX.3)\n- Confirmation: SWIFT/MarkitWire\n- Settlement: T+2 via standard clearing\n- Valuation: Daily MTM with independent price verification\n- Reporting: Integrated with existing risk and regulatory reporting infrastructure`;
      } else {
         return `[Draft content for "${field.label}" — to be completed based on product specifications and regulatory requirements for ${productName}.]`;
      }
   }

   /** Load similar NPAs for reference */
   loadSimilarNpas() {
      this.isLoadingSimilar = true;
      this.npaService.getAll().subscribe({
         next: (allNpas) => {
            // Filter out current NPA and sort by relevance (same type/category first)
            const currentId = this.inputData?.projectId || this.inputData?.id || this.inputData?.npaId;
            const currentType = this.inputData?.npa_type || '';
            const currentCategory = this.inputData?.product_category || '';

            this.similarNpas = allNpas
               .filter(n => n.id !== currentId)
               .sort((a, b) => {
                  // Score: same type = 2, same category = 1
                  const scoreA = (a.npa_type === currentType ? 2 : 0) + (a.product_category === currentCategory ? 1 : 0);
                  const scoreB = (b.npa_type === currentType ? 2 : 0) + (b.product_category === currentCategory ? 1 : 0);
                  return scoreB - scoreA;
               })
               .slice(0, 5); // Top 5 most similar

            this.isLoadingSimilar = false;
         },
         error: () => {
            this.isLoadingSimilar = false;
         }
      });
   }

   /** View a similar NPA (opens in new browser tab for reference) */
   viewSimilarNpa(npa: NpaListItem) {
      // Open the NPA detail in a new tab for side-by-side reference
      window.open(`/npa/${npa.id}`, '_blank');
   }

   save() {
      this.onSave.emit(this.sections);
      this.close.emit();
   }

   mergeInputData() {
      if (!this.inputData) return;

      const productSection = this.sections.find(s => s.title === 'Product Details' || s.title === 'Product Overview');
      if (productSection) {
         if (this.inputData.title) this.updateField(productSection, 'Product Name', this.inputData.title);
         if (this.inputData.jurisdictions) this.updateField(productSection, 'Key Currencies', 'CNY (offshore), ' + (this.inputData.jurisdictions?.includes?.('Hong Kong') ? 'HKD' : ''));
      }

      const riskSection = this.sections.find(s => s.title === 'Risk Assessment');
      if (riskSection) {
         if (this.inputData.riskLevel) this.updateField(riskSection, 'Primary Risk Type', 'Market Risk (' + this.inputData.riskLevel + ')');
         if (this.inputData.notional) this.updateField(riskSection, 'Risk Limits (VaR)', 'Daily VaR limit for ' + (this.inputData.notional / 1000000) + 'M position');
      }

      const opsSection = this.sections.find(s => s.title === 'Operational Readiness');
      if (opsSection) {
         this.updateField(opsSection, 'Booking System', 'Murex (MX.3) - IRD Module');
         this.updateField(opsSection, 'Accounting Treatment', 'Fair Value Through Profit/Loss (FVTPL)');
         if (this.inputData.isCrossBorder) this.updateField(opsSection, 'Settlement Process', 'HKEx OTC Clear <> SHCH (Swap Connect)');
      }

      const legalSection = this.sections.find(s => s.title === 'Legal & Regulatory');
      if (legalSection && this.inputData.jurisdictions) {
         const jurisdictionStr = Array.isArray(this.inputData.jurisdictions) ? this.inputData.jurisdictions.join(', ') : this.inputData.jurisdictions;
         this.updateField(legalSection, 'Cross-Border Rules', `Review required for ${jurisdictionStr} counterparties`);
      }
   }

   updateField(section: NpaSection, label: string, value: string) {
      const field = section.fields.find(f => f.label === label);
      if (field) {
         field.value = value;
         field.lineage = 'AUTO';
         field.lineageMetadata = { sourceSnippet: 'Agent Chat', confidenceScore: 100 };
      }
   }

   closeEditor() {
      this.close.emit();
   }

   scrollToSection(id: string) {
      this.activeSection = id;
      const el = document.getElementById('sec-' + id);
      const container = document.getElementById('form-container');
      if (el && container) {
         // Calculate actual offset of element relative to scroll container
         let offsetTop = 0;
         let current: HTMLElement | null = el;
         while (current && current !== container) {
            offsetTop += current.offsetTop;
            current = current.offsetParent as HTMLElement | null;
         }
         container.scrollTo({ top: offsetTop, behavior: 'smooth' });
      }
   }

   onFieldFocus(field: NpaField) {
      this.focusedField = field;
   }

   onScroll(e: any) {
      // Scroll spy — update activeSection based on scroll position using template nav IDs
      let lastMatch = '';
      for (const navItem of this.templateNavSections) {
         const el = document.getElementById('sec-' + navItem.id);
         if (el) {
            const rect = el.getBoundingClientRect();
            if (rect.top <= 200) {
               lastMatch = navItem.id;
            }
         }
      }
      if (lastMatch) {
         this.activeSection = lastMatch;
      }
   }

   autoSize(event: any) {
      const textarea = event.target;
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
   }

   // ── Template tree helpers ──

   /** Build O(1) lookup map from all loaded sections' fields */
   private buildFieldMap() {
      this.fieldMap.clear();
      for (const section of this.sections) {
         for (const field of section.fields) {
            if (field.key) {
               this.fieldMap.set(field.key, field);
            }
         }
      }
   }

   /** Build index of all template nodes by ID for completion calculations */
   private buildNodeIndex() {
      this.nodeIndex.clear();
      const indexNode = (node: TemplateNode) => {
         this.nodeIndex.set(node.id, node);
         for (const child of (node.children || [])) {
            indexNode(child);
         }
      };
      indexNode(this.templateTree);
      for (const app of this.appendicesTree) {
         indexNode(app);
      }
   }

   /** O(1) field lookup by key — returns the field or null */
   getFieldForKey(key: string): NpaField | null {
      return this.fieldMap.get(key) || null;
   }

   /** Calculate completion percentage for a template node (recursive) */
   getNodeCompletion(nodeId: string): number {
      // Invalidate cache each call (cheap since template is small)
      const node = this.nodeIndex.get(nodeId);
      if (!node) return 0;

      const keys = collectFieldKeys(node);
      if (keys.length === 0) return 100;

      let filled = 0;
      for (const key of keys) {
         const field = this.fieldMap.get(key);
         if (field?.value && field.value.trim().length > 0) {
            filled++;
         }
      }
      return Math.round((filled / keys.length) * 100);
   }

   /** Calculate textarea rows based on content length */
   getTextareaRows(value: string | undefined): number {
      if (!value) return 3;
      const lines = value.split('\n').length;
      const charLines = Math.ceil(value.length / 80);
      return Math.min(Math.max(lines, charLines, 3), 16);
   }

   /** Split pipe-delimited table cell values (e.g., "Yes | Yes | No | Yes") */
   splitTableValue(value: string | undefined, expectedCols: number): string[] {
      if (!value) return Array(expectedCols).fill('—');
      const parts = value.split('|').map(s => s.trim());
      // Pad or trim to expected columns
      while (parts.length < expectedCols) parts.push('—');
      return parts.slice(0, expectedCols);
   }

   getInputStyles(lineage: FieldLineage, isFocused: boolean): string {
      let base = 'bg-white border transition-all text-slate-900 ';

      if (isFocused) {
         base += 'ring-2 ring-blue-100 border-blue-400 bg-white';
      } else {
         // Color-coded left border based on lineage
         switch (lineage) {
            case 'AUTO':
               base += 'border-slate-200 border-l-emerald-400 border-l-2 hover:border-emerald-300 focus:ring-2 focus:ring-blue-100 focus:border-blue-400';
               break;
            case 'ADAPTED':
               base += 'border-slate-200 border-l-amber-400 border-l-2 hover:border-amber-300 focus:ring-2 focus:ring-blue-100 focus:border-blue-400';
               break;
            default:
               base += 'border-slate-200 hover:border-slate-300 focus:ring-2 focus:ring-blue-100 focus:border-blue-400';
         }
      }
      return base;
   }

   /** Lineage badge CSS class for right sidebar */
   getLineageBadgeClass(lineage: string, hasValue: boolean): string {
      if (!hasValue) return 'bg-slate-100 text-slate-500';
      switch (lineage) {
         case 'AUTO': return 'bg-emerald-50 text-emerald-700';
         case 'ADAPTED': return 'bg-amber-50 text-amber-700';
         case 'MANUAL': return 'bg-blue-50 text-blue-700';
         default: return 'bg-slate-100 text-slate-500';
      }
   }
}
