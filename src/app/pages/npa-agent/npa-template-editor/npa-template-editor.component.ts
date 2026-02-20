import { Component, EventEmitter, Input, Output, OnInit, inject, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, UploadCloud, Edit2, AlertCircle, Paperclip } from 'lucide-angular';
import { FormsModule } from '@angular/forms';
import { NpaSection, NpaField, FieldLineage } from '../../../lib/npa-interfaces';
import { NpaService } from '../../../services/npa.service';
import { AgentGovernanceService, ReadinessResult } from '../../../services/agent-governance.service';
import { NPA_PART_C_TEMPLATE, NPA_APPENDICES_TEMPLATE, TemplateNode, collectFieldKeys, getNavSections } from '../../../lib/npa-template-definition';

@Component({
   selector: 'app-npa-template-editor',
   standalone: true,
   imports: [CommonModule, LucideAngularModule, FormsModule],
   template: `
    <!-- FULL-SCREEN EDITOR CONTAINER -->
    <div class="fixed inset-0 z-[200] bg-white flex flex-col font-sans animate-in fade-in duration-200">

      <!-- TOP BAR -->
      <div class="h-12 bg-slate-900 flex items-center justify-between px-4 z-20 flex-none">
        <div class="flex items-center gap-3">
          <button (click)="closeEditor()" class="flex items-center justify-center w-8 h-8 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-all">
             <lucide-icon name="arrow-left" class="w-4 h-4"></lucide-icon>
          </button>
          <div class="h-5 w-px bg-slate-700"></div>
          <div class="flex items-center gap-2.5">
             <div class="w-7 h-7 rounded bg-blue-600 flex items-center justify-center">
                <lucide-icon name="file-text" class="w-4 h-4 text-white"></lucide-icon>
             </div>
             <div>
                <h1 class="text-sm font-semibold text-white leading-none">{{ getDocTitle() }}</h1>
                <p class="text-xs text-slate-400 mt-0.5">Full NPA &middot; Draft &middot; v1.0</p>
             </div>
          </div>
        </div>

        <div class="flex items-center gap-2">
           <!-- View toggle -->
           <div class="flex items-center bg-slate-800 rounded p-0.5">
              <button (click)="viewMode = 'document'"
                      [class.bg-slate-600]="viewMode === 'document'" [class.text-white]="viewMode === 'document'"
                      class="px-3 py-1.5 text-xs font-medium rounded transition-all text-slate-400 hover:text-slate-200">Doc</button>
              <button (click)="viewMode = 'form'"
                      [class.bg-slate-600]="viewMode === 'form'" [class.text-white]="viewMode === 'form'"
                      class="px-3 py-1.5 text-xs font-medium rounded transition-all text-slate-400 hover:text-slate-200">Form</button>
           </div>

           <!-- Lineage legend — subtle dots only -->
           <div class="hidden lg:flex items-center gap-3 text-[11px] font-medium border-l border-slate-700 pl-3 ml-1 text-slate-400">
              <span class="flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span>Auto</span>
              <span class="flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-slate-500"></span>Adapted</span>
              <span class="flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-slate-300"></span>Manual</span>
           </div>

           <div class="h-5 w-px bg-slate-700"></div>

           <button (click)="save()" class="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors flex items-center gap-1.5">
              <lucide-icon name="save" class="w-3.5 h-3.5"></lucide-icon> Save & Close
           </button>
        </div>
      </div>

      <!-- CONTENT — 3 column -->
      <div class="flex-1 overflow-hidden flex min-h-0">

         <!-- LEFT SIDEBAR — Navigation + Stats -->
         <div class="w-64 bg-slate-50 border-r border-gray-200 overflow-y-auto hidden lg:flex flex-col flex-none">

            <!-- Completion header -->
            <div class="px-4 py-3 border-b border-gray-200 bg-white">
               <div class="flex items-center justify-between mb-2">
                  <span class="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Progress</span>
                  <span class="text-sm font-bold text-gray-700">{{ getOverallCompletion() }}%</span>
               </div>
               <div class="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div class="h-full rounded-full bg-blue-500 transition-all duration-500"
                       [style.width.%]="getOverallCompletion()"></div>
               </div>
               <div class="flex items-center justify-between mt-2 text-[11px] text-gray-400">
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
                  [class.text-gray-900]="activeSection === navItem.id"
                  [class.font-semibold]="activeSection === navItem.id"
                  [class.border-transparent]="activeSection !== navItem.id"
                  [class.text-gray-500]="activeSection !== navItem.id"
                  [class.hover:bg-gray-50]="activeSection !== navItem.id"
                  [class.hover:text-gray-700]="activeSection !== navItem.id">
                  <span class="font-mono text-[10px] text-gray-400 w-7 text-right flex-none">{{ navItem.numbering }}</span>
                  <span class="flex-1 leading-snug truncate">{{ navItem.label }}</span>
                  <span class="text-[10px] font-mono text-gray-400 flex-none">{{ getNodeCompletion(navItem.id) }}%</span>
               </a>
            </nav>

            <!-- Lineage summary footer -->
            <div class="px-4 py-3 border-t border-gray-200 bg-white text-[11px] text-gray-400 space-y-1">
               <div class="flex justify-between"><span>Auto-filled</span><span class="font-semibold text-gray-600">{{ getLineageCount('AUTO') }}</span></div>
               <div class="flex justify-between"><span>Adapted</span><span class="font-semibold text-gray-600">{{ getLineageCount('ADAPTED') }}</span></div>
               <div class="flex justify-between"><span>Manual</span><span class="font-semibold text-gray-600">{{ getLineageCount('MANUAL') }}</span></div>
               <div class="flex justify-between border-t border-gray-100 pt-1 mt-1"><span>Empty</span><span class="font-semibold text-gray-400">{{ getTotalFieldCount() - getFilledFieldCount() }}</span></div>
            </div>
         </div>

         <!-- CENTER CONTENT -->
         <div class="flex-1 overflow-y-auto scroll-smooth relative min-h-0" id="form-container" (scroll)="onScroll($event)">

            <!-- ====== DOCUMENT VIEW (Template Tree) ====== -->
            <ng-container *ngIf="viewMode === 'document'">

            <!-- Document header — Confluence-style clean white header -->
            <div class="bg-white border-b border-gray-200" style="max-width:900px; margin:0 auto; padding: 28px 40px 20px;">
               <h1 class="text-xl font-bold text-gray-900 leading-snug mb-1">{{ getDocTitle() }}</h1>
               <p class="text-[13px] text-gray-500 leading-relaxed mb-3">New Product Approval &mdash; Draft &middot; v1.0</p>
               <div class="flex flex-wrap items-center gap-x-5 gap-y-1 text-[12px] text-gray-500 pt-2 border-t border-gray-100">
                  <span><strong class="text-gray-700">Status:</strong> Draft</span>
                  <span><strong class="text-gray-700">Created:</strong> {{ getDocDate() }}</span>
                  <span><strong class="text-gray-700">Owner:</strong> {{ getDocOwner() }}</span>
                  <span class="ml-auto px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[11px] font-semibold">Full NPA</span>
               </div>
            </div>

            <!-- Part C — Template tree renderer -->
            <div class="bg-white npa-doc-body">

               <!-- Part C header -->
               <div class="npa-doc-part-head">
                  <h2 class="text-[15px] font-bold text-gray-800 uppercase tracking-wide">Part C: Product Information to be Completed by Proposing Unit</h2>
               </div>

               <!-- Render Part C sections -->
               <ng-container *ngFor="let sectionNode of templateTree.children">
                  <ng-container *ngTemplateOutlet="nodeRenderer; context: { $implicit: sectionNode, depth: 0 }"></ng-container>
               </ng-container>

               <!-- Appendices header -->
               <div class="npa-doc-part-head" style="margin-top:24px;">
                  <h2 class="text-[15px] font-bold text-gray-800 uppercase tracking-wide">Appendices</h2>
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
                  <div [id]="'sec-' + node.id" class="sticky top-0 z-10 bg-white border-b border-gray-200 npa-doc-section-head">
                     <div class="flex items-center justify-between">
                        <h2 class="text-[15px] font-bold text-gray-900 leading-snug">
                           <span class="text-gray-400 mr-1.5">{{ node.numbering }}</span>
                           <span *ngIf="node.numbering && !node.numbering.startsWith('Appendix')">.</span>
                           {{ node.label }}
                        </h2>
                        <span class="text-[10px] font-medium text-gray-400">{{ getNodeCompletion(node.id) }}%</span>
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
               </ng-container>

               <!-- TOPIC type — Numbered heading (1, 2, 3) -->
               <ng-container *ngIf="node.type === 'topic'">
                  <div class="npa-doc-topic-head">
                     <h3 class="text-[14px] font-semibold text-gray-800">
                        <span class="text-gray-400 mr-1">{{ node.numbering }}.</span> {{ node.label }}
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
                     <h4 class="text-[14px] font-semibold text-gray-800">
                        <span class="text-gray-500 mr-1">{{ node.numbering }}</span> {{ node.label }}
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
                     <span class="text-gray-500 text-[13px] font-medium mr-1">{{ node.numbering }}</span>
                     <span class="text-[13px] font-medium text-gray-700">{{ node.label }}</span>
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
                                     [class.text-gray-800]="cell === 'Yes'"
                                     [class.text-gray-400]="cell === 'No' || cell === 'N/A'">
                                    {{ cell }}
                                 </td>
                              </ng-container>
                              <ng-container *ngIf="!getFieldForKey(row.fieldKey)">
                                 <td *ngFor="let col of node.tableColumns?.slice(1)" class="text-gray-300 italic">—</td>
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
                     <span *ngIf="field.lineage && field.value"
                           class="w-1.5 h-1.5 rounded-full flex-none ml-1 bg-gray-300"
                           [title]="field.lineage"></span>
                  </div>
                  <div *ngIf="editingField !== field.key"
                       class="npa-doc-field-value doc-content cursor-text"
                       [class.npa-doc-empty]="!field.value"
                       (click)="startEditing(field)"
                       [innerHTML]="formatDocContent(field.value) || getEmptyPlaceholder('Click to add content...')">
                  </div>
                  <textarea *ngIf="editingField === field.key"
                            #editArea [(ngModel)]="field.value" (blur)="stopEditing()" (input)="autoSize($event)"
                            class="w-full text-[14px] text-gray-800 leading-relaxed border border-blue-400 bg-blue-50/30 outline-none ring-1 ring-blue-200 resize-none px-3 py-2 rounded"
                            rows="6"></textarea>
               </div>
            </ng-template>

            </ng-container>

            <!-- ====== FORM VIEW (Template Tree — same hierarchy as Doc View) ====== -->
            <ng-container *ngIf="viewMode === 'form'">

            <!-- Document header — same as Doc View -->
            <div class="bg-white border-b border-gray-200" style="max-width:960px; margin:0 auto; padding: 28px 40px 20px;">
               <h1 class="text-xl font-bold text-gray-900 leading-snug mb-1">{{ getDocTitle() }}</h1>
               <p class="text-[13px] text-gray-500 leading-relaxed mb-3">New Product Approval &mdash; Draft &middot; v1.0</p>
               <div class="flex flex-wrap items-center gap-x-5 gap-y-1 text-[12px] text-gray-500 pt-2 border-t border-gray-100">
                  <span><strong class="text-gray-700">Status:</strong> Draft</span>
                  <span><strong class="text-gray-700">Created:</strong> {{ getDocDate() }}</span>
                  <span><strong class="text-gray-700">Owner:</strong> {{ getDocOwner() }}</span>
                  <span class="ml-auto px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[11px] font-semibold">Form Edit Mode</span>
               </div>
            </div>

            <div class="npa-form-body">

               <!-- Part C header -->
               <div class="npa-form-part-head">
                  <h2 class="text-[14px] font-bold text-gray-700 uppercase tracking-wide">Part C: Product Information to be Completed by Proposing Unit</h2>
               </div>

               <!-- Render Part C sections -->
               <ng-container *ngFor="let sectionNode of templateTree.children">
                  <ng-container *ngTemplateOutlet="formNodeRenderer; context: { $implicit: sectionNode, depth: 0 }"></ng-container>
               </ng-container>

               <!-- Appendices header -->
               <div class="npa-form-part-head" style="margin-top:20px;">
                  <h2 class="text-[14px] font-bold text-gray-700 uppercase tracking-wide">Appendices</h2>
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
                           <h2 class="text-[15px] font-bold text-gray-900">
                              <span class="text-gray-500 mr-1">{{ node.numbering }}</span>
                              <span *ngIf="node.numbering && !node.numbering.startsWith('Appendix')">.</span>
                              {{ node.label }}
                           </h2>
                           <span class="text-[10px] font-medium text-gray-400">{{ getNodeCompletion(node.id) }}%</span>
                        </div>
                        <p *ngIf="node.guidance" class="text-[12px] text-gray-500 mt-1 italic">{{ node.guidance }}</p>
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
                        <span class="text-gray-400 mr-1">{{ node.numbering }}.</span> {{ node.label }}
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
                        <span class="text-gray-400 mr-1">{{ node.numbering }}</span> {{ node.label }}
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
                     <span class="text-gray-400 text-[12px] font-medium mr-1">{{ node.numbering }}</span>
                     <span class="text-[13px] font-medium text-gray-600">{{ node.label }}</span>
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
                                     [class.text-gray-800]="cell === 'Yes'"
                                     [class.text-gray-400]="cell === 'No' || cell === 'N/A'">
                                    {{ cell }}
                                 </td>
                              </ng-container>
                              <ng-container *ngIf="!getFieldForKey(row.fieldKey)">
                                 <td *ngFor="let col of node.tableColumns?.slice(1)" class="text-gray-300 italic">—</td>
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
                  <label class="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                     {{ field.label }}
                     <span *ngIf="field.required" class="text-red-500">*</span>
                     <span *ngIf="field.lineage && field.value"
                           class="inline-block w-1.5 h-1.5 rounded-full ml-1 -mt-px bg-gray-300"
                           [title]="field.lineage"></span>
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

         <!-- RIGHT SIDEBAR — Summary Dashboard / Source Inspector -->
         <div class="w-72 bg-white border-l border-gray-200 flex-none flex flex-col overflow-y-auto hidden lg:flex">

            <!-- If a field is focused: Source Inspector -->
            <ng-container *ngIf="focusedField">
               <div class="h-11 border-b border-gray-100 flex items-center justify-between px-4 bg-gray-50 flex-none">
                   <h3 class="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                      <lucide-icon name="eye" class="w-3.5 h-3.5"></lucide-icon> Source Inspector
                   </h3>
                   <button (click)="focusedField = null" class="text-gray-400 hover:text-gray-600 p-1">
                      <lucide-icon name="x" class="w-4 h-4"></lucide-icon>
                   </button>
               </div>

               <div class="p-4 flex-1 overflow-y-auto space-y-4">
                   <div>
                      <p class="text-[11px] uppercase font-bold text-gray-400 mb-0.5">Field</p>
                      <h2 class="text-sm font-bold text-gray-900">{{ focusedField.label }}</h2>
                      <div class="mt-1.5 flex items-center gap-2">
                         <span class="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-gray-100 text-gray-600">
                            {{ focusedField.lineage }}
                         </span>
                         <span *ngIf="focusedField.lineageMetadata?.confidenceScore" class="text-[11px] font-medium text-gray-400">
                            {{ focusedField.lineageMetadata?.confidenceScore }}%
                         </span>
                      </div>
                   </div>

                   <div *ngIf="focusedField.lineage !== 'MANUAL'">
                      <div *ngIf="focusedField.lineageMetadata?.adaptationLogic" class="bg-amber-50 rounded-md p-2.5 border border-amber-100 mb-3">
                         <p class="text-[11px] font-bold text-amber-800 mb-0.5">Adaptation Logic</p>
                         <p class="text-xs text-amber-700 leading-relaxed">{{ focusedField.lineageMetadata?.adaptationLogic }}</p>
                      </div>
                      <div *ngIf="focusedField.lineageMetadata?.sourceSnippet">
                         <p class="text-[11px] uppercase font-bold text-gray-400 mb-0.5">Source</p>
                         <div class="bg-slate-50 rounded-md p-2.5 border border-slate-200 text-xs text-gray-600 leading-relaxed">
                            "{{ focusedField.lineageMetadata?.sourceSnippet }}"
                         </div>
                      </div>
                   </div>

                   <div *ngIf="focusedField.lineage === 'MANUAL'">
                      <div class="bg-blue-50 rounded-md p-3 border border-blue-100 text-center">
                         <div class="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-1.5">
                            <lucide-icon name="bot" class="w-3.5 h-3.5 text-blue-600"></lucide-icon>
                         </div>
                         <h4 class="text-xs font-bold text-blue-900 mb-0.5">Need help?</h4>
                         <p class="text-[11px] text-blue-700 mb-2">{{ focusedField.lineageMetadata?.agentTip || 'I can search KB for similar clauses.' }}</p>
                         <button class="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition-colors">
                            Ask Agent to Draft
                         </button>
                      </div>
                   </div>
               </div>
            </ng-container>

            <!-- Default state: Minimal prompt to select a field -->
            <ng-container *ngIf="!focusedField">
               <div class="flex-1 flex flex-col items-center justify-center px-6 text-center">
                  <div class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                     <lucide-icon name="eye" class="w-5 h-5 text-gray-400"></lucide-icon>
                  </div>
                  <h4 class="text-sm font-semibold text-gray-600 mb-1">Source Inspector</h4>
                  <p class="text-[12px] text-gray-400 leading-relaxed">Click any field to view its lineage, source data, and confidence score.</p>
               </div>
            </ng-container>
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
                    <h5 class="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Domain Breakdown</h5>
                    <div *ngFor="let d of validationResult.domains" class="flex gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                        <div class="mt-0.5">
                            <lucide-icon *ngIf="d.status === 'PASS'" name="check-circle" class="w-5 h-5 text-emerald-500"></lucide-icon>
                            <lucide-icon *ngIf="d.status === 'FAIL'" name="x-circle" class="w-5 h-5 text-red-500"></lucide-icon>
                            <lucide-icon *ngIf="d.status === 'MISSING'" name="alert-circle" class="w-5 h-5 text-amber-500"></lucide-icon>
                        </div>
                        <div>
                            <div class="flex items-center gap-2 mb-1">
                                <span class="font-bold text-sm text-gray-900">{{ d.name }}</span>
                                <span class="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase"
                                      [ngClass]="getDomainStatusClass(d.status)">
                                    {{ d.status }}
                                </span>
                            </div>
                            <p class="text-xs text-gray-600 leading-relaxed">{{ d.observation }}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
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
      max-width: 900px;
      margin: 0 auto;
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
      max-width: 960px;
      margin: 0 auto;
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
export class NpaTemplateEditorComponent implements OnInit {
   @Output() close = new EventEmitter<void>();
   @Input() inputData: any = null;
   @Output() onSave = new EventEmitter<any>();

   private governanceService = inject(AgentGovernanceService);
   private npaService = inject(NpaService);

   activeSection = '';
   focusedField: NpaField | null = null;
   editingField: string | null = null;
   viewMode: 'document' | 'form' = 'document'; // Default to document view
   showValidationModal = false;
   validationResult: ReadinessResult | null = null;

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
      return '<span class="text-gray-400 italic">' + text + '</span>';
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

   // --- Validation ---
   validateGovernance() {
      const desc = this.extractDescriptionFromForm();
      this.governanceService.analyzeReadiness(desc).subscribe(result => {
         this.validationResult = result;
         this.showValidationModal = true;
      });
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
         default: return 'bg-gray-100 text-gray-800';
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
      if (el) {
         el.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
      let base = 'bg-white border transition-all text-gray-900 border-gray-200 ';

      if (isFocused) {
         base += 'ring-2 ring-blue-100 border-blue-400 bg-white';
      } else {
         base += 'hover:border-gray-300 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400';
      }
      return base;
   }
}
