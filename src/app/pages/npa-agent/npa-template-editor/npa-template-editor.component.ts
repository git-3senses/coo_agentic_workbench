import { Component, EventEmitter, Input, Output, OnInit, inject, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, UploadCloud, Edit2, AlertCircle, Paperclip } from 'lucide-angular';
import { FormsModule } from '@angular/forms';
import { NpaSection, NpaField, FieldLineage } from '../../../lib/npa-interfaces';
import { NpaService } from '../../../services/npa.service';
import { AgentGovernanceService, ReadinessResult } from '../../../services/agent-governance.service';

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

           <!-- Lineage legend -->
           <div class="hidden lg:flex items-center gap-3 text-xs font-medium border-l border-slate-700 pl-3 ml-1">
              <span class="flex items-center gap-1 text-emerald-400"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>Auto</span>
              <span class="flex items-center gap-1 text-amber-400"><span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>Adapted</span>
              <span class="flex items-center gap-1 text-red-400"><span class="w-1.5 h-1.5 rounded-full bg-red-400"></span>Manual</span>
           </div>

           <div class="h-5 w-px bg-slate-700"></div>

           <button (click)="validateGovernance()" class="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors flex items-center gap-1.5">
              <lucide-icon name="shield-check" class="w-3.5 h-3.5"></lucide-icon> Validate
           </button>
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
                  <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">Completion</span>
                  <span class="text-sm font-bold" [class.text-emerald-600]="getOverallCompletion() >= 80"
                        [class.text-amber-600]="getOverallCompletion() >= 50 && getOverallCompletion() < 80"
                        [class.text-red-500]="getOverallCompletion() < 50">{{ getOverallCompletion() }}%</span>
               </div>
               <div class="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div class="h-full rounded-full transition-all duration-500"
                       [style.width.%]="getOverallCompletion()"
                       [class.bg-emerald-500]="getOverallCompletion() >= 80"
                       [class.bg-amber-500]="getOverallCompletion() >= 50 && getOverallCompletion() < 80"
                       [class.bg-red-400]="getOverallCompletion() < 50"></div>
               </div>
               <!-- Lineage breakdown -->
               <div class="flex items-center gap-3 mt-2.5 text-xs text-gray-500">
                  <span>{{ getLineageCount('AUTO') }} auto</span>
                  <span>{{ getLineageCount('ADAPTED') }} adapted</span>
                  <span>{{ getLineageCount('MANUAL') }} manual</span>
               </div>
            </div>

            <!-- Section nav -->
            <nav class="flex-1 py-1 overflow-y-auto">
               <a *ngFor="let section of sections; let i = index"
                  href="javascript:void(0)"
                  (click)="scrollToSection(section.id)"
                  class="group flex items-center gap-2.5 px-3 py-2.5 text-[13px] transition-all border-l-2 mx-1 rounded-r-md"
                  [class.border-blue-600]="activeSection === section.id"
                  [class.bg-blue-50]="activeSection === section.id"
                  [class.text-blue-800]="activeSection === section.id"
                  [class.font-semibold]="activeSection === section.id"
                  [class.border-transparent]="activeSection !== section.id"
                  [class.text-gray-600]="activeSection !== section.id"
                  [class.hover:bg-gray-100]="activeSection !== section.id"
                  [class.hover:border-gray-300]="activeSection !== section.id">
                  <span class="font-mono text-[11px] text-gray-400 w-5 text-right flex-none">{{ getSectionNumber(i) }}</span>
                  <span class="flex-1 leading-snug truncate">{{ section.title }}</span>
                  <!-- Completion mini-bar -->
                  <div class="w-8 h-1 bg-gray-200 rounded-full flex-none overflow-hidden">
                     <div class="h-full rounded-full transition-all"
                          [style.width.%]="getSectionCompletion(section)"
                          [class.bg-emerald-500]="getSectionCompletion(section) >= 80"
                          [class.bg-amber-400]="getSectionCompletion(section) >= 50 && getSectionCompletion(section) < 80"
                          [class.bg-red-400]="getSectionCompletion(section) < 50"></div>
                  </div>
               </a>
            </nav>

            <!-- Field stats footer -->
            <div class="px-4 py-3 border-t border-gray-200 bg-white text-xs text-gray-500 space-y-1.5">
               <div class="flex justify-between"><span>Total Fields</span><span class="font-bold text-gray-700">{{ getTotalFieldCount() }}</span></div>
               <div class="flex justify-between"><span>Filled</span><span class="font-bold text-emerald-600">{{ getFilledFieldCount() }}</span></div>
               <div class="flex justify-between"><span>Empty</span><span class="font-bold text-gray-400">{{ getTotalFieldCount() - getFilledFieldCount() }}</span></div>
               <div class="flex justify-between"><span>Sections</span><span class="font-bold text-gray-700">{{ sections.length }}</span></div>
            </div>
         </div>

         <!-- CENTER CONTENT -->
         <div class="flex-1 overflow-y-auto scroll-smooth relative min-h-0" id="form-container" (scroll)="onScroll($event)">

            <!-- ====== DOCUMENT VIEW ====== -->
            <ng-container *ngIf="viewMode === 'document'">

            <!-- Document header strip -->
            <div class="bg-gradient-to-r from-slate-800 to-slate-900 px-8 py-4 text-white">
               <div class="flex items-center justify-between">
                  <div>
                     <p class="text-xs font-bold uppercase tracking-[0.15em] text-slate-400 mb-1">New Product Approval</p>
                     <h1 class="text-xl font-bold leading-tight">{{ getDocTitle() }}</h1>
                     <p *ngIf="getDocSubtitle()" class="text-xs text-slate-300 mt-1.5 max-w-xl leading-relaxed">{{ getDocSubtitle() }}</p>
                  </div>
                  <div class="text-right flex-none ml-6">
                     <div class="px-2.5 py-1 rounded bg-white/10 border border-white/20 inline-block">
                        <span class="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Classification</span>
                        <p class="text-xs font-bold text-white">Full NPA</p>
                     </div>
                  </div>
               </div>
               <div class="flex items-center gap-5 mt-3 pt-2.5 border-t border-white/10 text-xs text-slate-400">
                  <span><strong class="text-slate-300">Status:</strong> Draft</span>
                  <span><strong class="text-slate-300">Version:</strong> 1.0</span>
                  <span><strong class="text-slate-300">Created:</strong> {{ getDocDate() }}</span>
                  <span><strong class="text-slate-300">Owner:</strong> {{ getDocOwner() }}</span>
               </div>
            </div>

            <!-- Sections — direct render, no paper wrapper -->
            <div class="bg-white">
               <div *ngFor="let section of sections; let si = index" [id]="'sec-' + section.id" class="border-b border-gray-100">

                  <!-- Section header bar -->
                  <div class="sticky top-0 z-10 bg-gray-50/95 backdrop-blur-sm border-b border-gray-200 px-8 py-2.5 flex items-center gap-3">
                     <span class="text-xs font-mono font-bold text-gray-400 flex-none">{{ getSectionNumber(si) }}.</span>
                     <h2 class="text-sm font-bold text-gray-900 flex-1">{{ section.title }}</h2>
                     <span class="text-xs font-bold px-2.5 py-0.5 rounded-full"
                           [class.bg-emerald-100]="getSectionCompletion(section) >= 80"
                           [class.text-emerald-700]="getSectionCompletion(section) >= 80"
                           [class.bg-amber-100]="getSectionCompletion(section) >= 50 && getSectionCompletion(section) < 80"
                           [class.text-amber-700]="getSectionCompletion(section) >= 50 && getSectionCompletion(section) < 80"
                           [class.bg-red-100]="getSectionCompletion(section) < 50"
                           [class.text-red-700]="getSectionCompletion(section) < 50">
                        {{ getSectionCompletion(section) }}%
                     </span>
                  </div>

                  <!-- Section description if present -->
                  <p *ngIf="section.description" class="px-8 pt-3 text-xs text-gray-500 leading-relaxed">{{ section.description }}</p>

                  <!-- Fields -->
                  <div class="px-8 py-5 space-y-2">
                     <ng-container *ngFor="let field of section.fields">

                        <!-- Header Field -->
                        <div *ngIf="field.type === 'header'" class="pt-5 pb-1.5">
                           <h3 class="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                              <span class="w-0.5 h-3.5 bg-blue-600 rounded-full"></span>
                              {{ field.label }}
                           </h3>
                        </div>

                        <!-- Textarea fields — narrative paragraphs -->
                        <div *ngIf="field.type === 'textarea'" class="py-3 group" (click)="onFieldFocus(field)">
                           <div class="flex items-center gap-2 mb-1.5">
                              <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wide">{{ field.label }}</h4>
                              <span *ngIf="field.required" class="text-red-400 text-[10px]">REQ</span>
                              <span *ngIf="field.lineage && field.value"
                                    class="w-1.5 h-1.5 rounded-full flex-none"
                                    [class.bg-emerald-500]="field.lineage === 'AUTO'"
                                    [class.bg-amber-500]="field.lineage === 'ADAPTED'"
                                    [class.bg-red-500]="field.lineage === 'MANUAL'"></span>
                           </div>
                           <div *ngIf="editingField !== field.key"
                                class="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap cursor-text rounded px-3 py-2.5 -mx-3 hover:bg-blue-50/40 transition-colors border border-transparent hover:border-blue-100"
                                [class.text-gray-300]="!field.value"
                                [class.italic]="!field.value"
                                (click)="startEditing(field)">
                              {{ field.value || 'Click to add content...' }}
                           </div>
                           <textarea *ngIf="editingField === field.key"
                                     #editArea [(ngModel)]="field.value" (blur)="stopEditing()" (input)="autoSize($event)"
                                     class="w-full text-sm text-gray-700 leading-relaxed rounded px-3 py-2.5 -mx-3 border border-blue-300 bg-blue-50/20 outline-none ring-2 ring-blue-100 resize-none"
                                     rows="4"></textarea>
                        </div>

                        <!-- Short fields — inline key:value -->
                        <div *ngIf="field.type !== 'textarea' && field.type !== 'header' && field.type !== 'file'"
                             class="group flex items-baseline gap-4 py-2.5 hover:bg-blue-50/30 -mx-3 px-3 rounded transition-colors cursor-text"
                             (click)="onFieldFocus(field)">
                           <span class="text-sm text-gray-500 flex-none truncate" style="width: 200px;">
                              {{ field.label }}<span *ngIf="field.required" class="text-red-400 text-[10px] ml-0.5">*</span>
                           </span>
                           <div class="flex-1 flex items-center gap-1.5 min-w-0">
                              <ng-container *ngIf="editingField !== field.key">
                                 <span class="text-sm leading-relaxed cursor-text truncate"
                                       [class.text-gray-900]="field.value" [class.font-medium]="field.value"
                                       [class.text-gray-300]="!field.value" [class.italic]="!field.value"
                                       (click)="startEditing(field)">
                                    {{ field.value || '—' }}
                                 </span>
                              </ng-container>
                              <ng-container *ngIf="editingField === field.key">
                                 <select *ngIf="field.type === 'select'" #editArea [(ngModel)]="field.value" (blur)="stopEditing()" (change)="stopEditing()"
                                         class="text-sm border border-blue-300 rounded px-2 py-0.5 bg-blue-50/30 outline-none ring-1 ring-blue-100 flex-1">
                                    <option value="" disabled>Select...</option>
                                    <option *ngFor="let opt of field.options" [value]="opt">{{ opt }}</option>
                                 </select>
                                 <input *ngIf="field.type === 'date'" #editArea [(ngModel)]="field.value" type="date" (blur)="stopEditing()"
                                        class="text-sm border border-blue-300 rounded px-2 py-0.5 bg-blue-50/30 outline-none ring-1 ring-blue-100">
                                 <input *ngIf="field.type !== 'select' && field.type !== 'date'" #editArea [(ngModel)]="field.value" [type]="field.type || 'text'"
                                        (blur)="stopEditing()" (keydown.enter)="stopEditing()"
                                        class="text-sm border border-blue-300 rounded px-2 py-0.5 bg-blue-50/30 outline-none ring-1 ring-blue-100 flex-1">
                              </ng-container>
                              <span *ngIf="field.lineage && field.value && editingField !== field.key"
                                    class="w-1.5 h-1.5 rounded-full flex-none"
                                    [class.bg-emerald-500]="field.lineage === 'AUTO'"
                                    [class.bg-amber-500]="field.lineage === 'ADAPTED'"
                                    [class.bg-red-500]="field.lineage === 'MANUAL'"
                                    [title]="field.lineage"></span>
                           </div>
                        </div>

                        <!-- File upload fields -->
                        <div *ngIf="field.type === 'file'" class="py-2" (click)="onFieldFocus(field)">
                           <div class="flex items-center gap-3 px-3 py-2 rounded border border-dashed border-gray-300 bg-gray-50 hover:bg-blue-50 hover:border-blue-300 transition-colors cursor-pointer">
                              <lucide-icon name="upload-cloud" class="w-4 h-4 text-gray-400"></lucide-icon>
                              <span class="text-xs text-gray-500">{{ field.label }}</span>
                           </div>
                        </div>

                     </ng-container>
                  </div>
               </div>

               <!-- Bottom padding only -->
               <div class="h-16"></div>
            </div>
            </ng-container>

            <!-- ====== FORM VIEW ====== -->
            <ng-container *ngIf="viewMode === 'form'">
            <div class="max-w-4xl mx-auto py-8 space-y-6 pb-24 px-6">
               <div *ngFor="let section of sections" [id]="'sec-' + section.id" class="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div class="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                     <h3 class="text-base font-bold text-gray-900">{{ section.title }}</h3>
                     <p *ngIf="section.description" class="text-sm text-gray-500 mt-1">{{ section.description }}</p>
                  </div>
                  <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                     <div *ngFor="let field of section.fields" [class.md:col-span-2]="field.type === 'textarea' || field.type === 'header'" class="relative">
                        <div *ngIf="field.type === 'header'" class="mt-3 mb-1 border-b border-gray-200 pb-1">
                           <h4 class="text-xs font-bold text-gray-900 uppercase tracking-wide">{{ field.label }}</h4>
                        </div>
                        <ng-container *ngIf="field.type !== 'header'">
                           <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                              {{ field.label }} <span *ngIf="field.required" class="text-red-500">*</span>
                           </label>
                           <div class="relative" (click)="onFieldFocus(field)">
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
                                     [(ngModel)]="field.value" [type]="field.type || 'text'" [placeholder]="field.placeholder || ''"
                                     [ngClass]="getInputStyles(field.lineage, focusedField?.key === field.key)"
                                     class="w-full text-sm rounded-md px-3 py-2 outline-none transition-all">
                              <textarea *ngIf="field.type === 'textarea'" [(ngModel)]="field.value" rows="4"
                                        [placeholder]="field.placeholder || ''"
                                        [ngClass]="getInputStyles(field.lineage, focusedField?.key === field.key)"
                                        class="w-full text-sm rounded-md px-3 py-2 outline-none transition-all"></textarea>
                           </div>
                        </ng-container>
                     </div>
                  </div>
               </div>
            </div>
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
                         <span class="px-2 py-0.5 rounded text-[11px] font-bold uppercase"
                               [class.bg-emerald-100]="focusedField.lineage === 'AUTO'" [class.text-emerald-700]="focusedField.lineage === 'AUTO'"
                               [class.bg-amber-100]="focusedField.lineage === 'ADAPTED'" [class.text-amber-700]="focusedField.lineage === 'ADAPTED'"
                               [class.bg-red-100]="focusedField.lineage === 'MANUAL'" [class.text-red-700]="focusedField.lineage === 'MANUAL'">
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
                      <button class="w-full mt-3 py-2 bg-white border border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-300 rounded text-xs font-semibold transition-colors flex items-center justify-center gap-1.5">
                         <lucide-icon name="external-link" class="w-3 h-3"></lucide-icon> View Source
                      </button>
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

            <!-- Default state: Document Summary Dashboard -->
            <ng-container *ngIf="!focusedField">
               <div class="h-11 border-b border-gray-100 flex items-center px-4 bg-gray-50 flex-none">
                   <h3 class="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                      <lucide-icon name="bar-chart-3" class="w-3.5 h-3.5"></lucide-icon> Document Summary
                   </h3>
               </div>

               <div class="p-4 flex-1 overflow-y-auto space-y-5">
                  <!-- Overall completion gauge -->
                  <div class="text-center py-3">
                     <div class="text-3xl font-bold" [class.text-emerald-600]="getOverallCompletion() >= 80"
                          [class.text-amber-600]="getOverallCompletion() >= 50 && getOverallCompletion() < 80"
                          [class.text-red-500]="getOverallCompletion() < 50">{{ getOverallCompletion() }}%</div>
                     <p class="text-xs text-gray-400 font-medium mt-1">Overall Completion</p>
                  </div>

                  <!-- Lineage breakdown -->
                  <div>
                     <p class="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Lineage Breakdown</p>
                     <div class="space-y-2.5">
                        <div class="flex items-center gap-2.5">
                           <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-none"></span>
                           <span class="text-xs text-gray-600 flex-1">Auto-filled</span>
                           <span class="text-xs font-bold text-gray-800">{{ getLineageCount('AUTO') }}</span>
                        </div>
                        <div class="flex items-center gap-2.5">
                           <span class="w-2.5 h-2.5 rounded-full bg-amber-500 flex-none"></span>
                           <span class="text-xs text-gray-600 flex-1">Adapted</span>
                           <span class="text-xs font-bold text-gray-800">{{ getLineageCount('ADAPTED') }}</span>
                        </div>
                        <div class="flex items-center gap-2.5">
                           <span class="w-2.5 h-2.5 rounded-full bg-red-500 flex-none"></span>
                           <span class="text-xs text-gray-600 flex-1">Manual</span>
                           <span class="text-xs font-bold text-gray-800">{{ getLineageCount('MANUAL') }}</span>
                        </div>
                        <div class="flex items-center gap-2.5 pt-1.5 border-t border-gray-100">
                           <span class="w-2.5 h-2.5 rounded-full bg-gray-300 flex-none"></span>
                           <span class="text-xs text-gray-600 flex-1">Empty</span>
                           <span class="text-xs font-bold text-gray-400">{{ getTotalFieldCount() - getFilledFieldCount() }}</span>
                        </div>
                     </div>
                     <!-- Stacked bar -->
                     <div class="h-2 bg-gray-100 rounded-full overflow-hidden flex mt-2" *ngIf="getTotalFieldCount() > 0">
                        <div class="bg-emerald-500 h-full transition-all" [style.width.%]="(getLineageCount('AUTO') / getTotalFieldCount()) * 100"></div>
                        <div class="bg-amber-500 h-full transition-all" [style.width.%]="(getLineageCount('ADAPTED') / getTotalFieldCount()) * 100"></div>
                        <div class="bg-red-500 h-full transition-all" [style.width.%]="(getLineageCount('MANUAL') / getTotalFieldCount()) * 100"></div>
                     </div>
                  </div>

                  <!-- Section-by-section breakdown -->
                  <div>
                     <p class="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Section Status</p>
                     <div class="space-y-2">
                        <div *ngFor="let section of sections; let i = index" class="flex items-center gap-2.5 text-xs">
                           <lucide-icon *ngIf="getSectionCompletion(section) === 100" name="check-circle" class="w-3 h-3 text-emerald-500 flex-none"></lucide-icon>
                           <lucide-icon *ngIf="getSectionCompletion(section) > 0 && getSectionCompletion(section) < 100" name="clock" class="w-3 h-3 text-amber-500 flex-none"></lucide-icon>
                           <lucide-icon *ngIf="getSectionCompletion(section) === 0" name="circle" class="w-3 h-3 text-gray-300 flex-none"></lucide-icon>
                           <span class="flex-1 truncate text-gray-600">{{ section.title }}</span>
                           <span class="font-mono font-bold text-[11px]"
                                 [class.text-emerald-600]="getSectionCompletion(section) >= 80"
                                 [class.text-amber-600]="getSectionCompletion(section) >= 50 && getSectionCompletion(section) < 80"
                                 [class.text-gray-400]="getSectionCompletion(section) < 50">{{ getSectionCompletion(section) }}%</span>
                        </div>
                     </div>
                  </div>

                  <!-- Quick actions -->
                  <div class="pt-2 border-t border-gray-100 space-y-2">
                     <p class="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Actions</p>
                     <button (click)="validateGovernance()" class="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-gray-200 rounded text-xs font-semibold text-gray-700 transition-colors flex items-center justify-center gap-1.5">
                        <lucide-icon name="shield-check" class="w-3.5 h-3.5"></lucide-icon> Run Governance Check
                     </button>
                     <button class="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-gray-200 rounded text-xs font-semibold text-gray-700 transition-colors flex items-center justify-center gap-1.5">
                        <lucide-icon name="wand-2" class="w-3.5 h-3.5"></lucide-icon> Auto-fill Empty Fields
                     </button>
                  </div>

                  <!-- Tip -->
                  <div class="bg-blue-50 rounded-md p-2.5 border border-blue-100 mt-2">
                     <p class="text-xs text-blue-700 leading-relaxed"><strong>Tip:</strong> Click any field to see its source lineage, adaptation logic, and confidence score in this panel.</p>
                  </div>
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
               if (this.sections.length > 0) {
                  this.activeSection = this.sections[0].id;
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
      // Scroll spy — update activeSection based on scroll position
      const container = e.target;
      for (const section of this.sections) {
         const el = document.getElementById('sec-' + section.id);
         if (el) {
            const rect = el.getBoundingClientRect();
            if (rect.top <= 200 && rect.bottom > 100) {
               this.activeSection = section.id;
               break;
            }
         }
      }
   }

   autoSize(event: any) {
      const textarea = event.target;
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
   }

   getInputStyles(lineage: FieldLineage, isFocused: boolean): string {
      let base = 'bg-gray-50 border transition-all text-gray-900 ';
      if (lineage === 'AUTO') base += 'border-green-500 ';
      else if (lineage === 'ADAPTED') base += 'border-amber-500 ';
      else if (lineage === 'MANUAL') base += 'border-red-500 ';
      else base += 'border-gray-300 ';

      if (isFocused) {
         if (lineage === 'AUTO') base += 'ring-2 ring-green-100 border-green-600 bg-white';
         else if (lineage === 'ADAPTED') base += 'ring-2 ring-amber-100 border-amber-600 bg-white';
         else if (lineage === 'MANUAL') base += 'ring-2 ring-red-100 border-red-600 bg-white';
         else base += 'ring-2 ring-blue-100 border-blue-500 bg-white';
      } else {
         base += 'focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500';
      }
      return base;
   }
}
