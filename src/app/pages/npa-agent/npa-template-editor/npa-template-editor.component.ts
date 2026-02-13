import { Component, EventEmitter, Input, Output, OnInit, inject } from '@angular/core';
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
    <!-- MAIN EDITOR CONTAINER -->
    <div class="fixed inset-0 z-[200] bg-slate-50 flex flex-col font-sans animate-in fade-in duration-200">
      
      <!-- TOP BAR -->
      <div class="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm z-20">
        <div class="flex items-center gap-4">
          <button (click)="closeEditor()" class="group flex items-center justify-center p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
             <lucide-icon name="x" class="w-6 h-6 stroke-[1.5] group-hover:rotate-90 transition-transform"></lucide-icon>
          </button>
          <div>
             <h1 class="text-lg font-bold text-gray-900 flex items-center gap-2 tracking-tight">
                eNPA Proposal Form (v2.0)
                <span class="px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                   TSG2025-042
                </span>
             </h1>
             <p class="text-xs text-gray-500 mt-2">Auto-Fill Source: <span class="font-medium text-blue-600">TSG1917 (94% Match)</span></p>
          </div>
        </div>

        <div class="flex items-center gap-4">
           <!-- Legend -->
           <div class="hidden md:flex items-center gap-4 text-xs font-medium border-r border-gray-200 pr-4 mr-2">
              <span class="flex items-center gap-1.5 text-green-700">
                 <lucide-icon name="sparkles" class="w-3.5 h-3.5"></lucide-icon>
                 Direct Copy
              </span>
              <span class="flex items-center gap-1.5 text-amber-700">
                 <lucide-icon name="alert-triangle" class="w-3.5 h-3.5"></lucide-icon>
                 Adapted
              </span>
              <span class="flex items-center gap-1.5 text-red-600">
                 <lucide-icon name="edit-3" class="w-3.5 h-3.5"></lucide-icon>
                 Manual Input
              </span>
           </div>

           <!-- Validate Button -->
           <button (click)="validateGovernance()" class="px-3 py-2 text-sm font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200 flex items-center gap-2">
              <lucide-icon name="shield-check" class="w-4 h-4"></lucide-icon>
              Validate
           </button>

           <button class="px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200 hover:border-gray-300 mr-2">
              Reset
           </button>

           <button (click)="save()" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 shadow-blue-200 flex items-center gap-2">
              <lucide-icon name="save" class="w-4 h-4"></lucide-icon>
              Save & Close
           </button>
        </div>
      </div>

      <!-- SCROLLABLE CONTENT AREA -->
      <div class="flex-1 overflow-hidden flex relative min-h-0">
         
         <!-- LEFT: Navigation Sidebar -->
         <div class="w-64 bg-white border-r border-gray-200 overflow-y-auto hidden lg:block py-6 flex-none">
            <nav class="space-y-1 px-3">
               <a *ngFor="let section of sections" 
                  href="javascript:void(0)"
                  (click)="scrollToSection(section.id)"
                  [class.bg-blue-50]="activeSection === section.id"
                  [class.text-blue-700]="activeSection === section.id"
                  class="group flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors">
                  <span [class.bg-blue-600]="activeSection === section.id" 
                        class="w-1.5 h-1.5 mr-3 rounded-full bg-gray-300 group-hover:bg-gray-400 transition-colors"></span>
                  {{ section.title }}
               </a>
            </nav>
         </div>

         <!-- CENTER: Form Content -->
         <div class="flex-1 overflow-y-auto scroll-smooth p-6 md:p-10 bg-slate-50 relative min-h-0" id="form-container" (scroll)="onScroll($event)">
            <div class="max-w-3xl mx-auto space-y-12 pb-24">
               
               <!-- Section Loop -->
               <div *ngFor="let section of sections" [id]="'sec-' + section.id" class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  
                  <!-- Section Header -->
                  <div class="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                     <div>
                        <h3 class="text-lg font-bold text-gray-900">{{ section.title }}</h3>
                        <p *ngIf="section.description" class="text-sm text-gray-500 mt-2">{{ section.description }}</p>
                     </div>
                  </div>

                  <!-- Fields Grid -->
                  <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 bg-white">
                     <div *ngFor="let field of section.fields" [class.md:col-span-2]="field.type === 'textarea' || field.type === 'header'" class="relative">
                        
                        <!-- Header Field -->
                        <div *ngIf="field.type === 'header'" class="mt-6 mb-2 border-b border-gray-200 pb-2">
                           <h4 class="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                              <span class="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                              {{ field.label }}
                           </h4>
                        </div>

                        <!-- Regular Fields -->
                        <ng-container *ngIf="field.type !== 'header'">
                           <!-- Header: Label + Badges -->
                           <div class="flex items-center justify-between mb-1.5">
                              <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                 {{ field.label }} <span *ngIf="field.required" class="text-red-500">*</span>
                              </label>
                           </div>
   
                           <!-- Input Container -->
                           <div class="relative group" (click)="onFieldFocus(field)">
                              <!-- File Input -->
                              <div *ngIf="field.type === 'file'" class="flex items-center gap-3 p-3 rounded-md border border-dashed border-gray-300 bg-gray-50 hover:bg-blue-50 hover:border-blue-300 transition-colors cursor-pointer" [class.ring-2]="focusedField?.key === field.key" [class.ring-blue-500]="focusedField?.key === field.key">
                                  <div class="p-2 bg-white rounded border border-gray-200 shadow-sm text-gray-500">
                                      <lucide-icon name="upload-cloud" class="w-5 h-5"></lucide-icon>
                                  </div>
                                  <div>
                                      <p class="text-sm font-medium text-gray-700">Upload {{ field.label }}</p>
                                      <p class="text-[10px] text-gray-500">Drag or click to browse</p>
                                  </div>
                              </div>
   
                              <!-- Select Input -->
                              <select *ngIf="field.type === 'select'"
                                     [(ngModel)]="field.value"
                                     [ngClass]="getInputStyles(field.lineage, focusedField?.key === field.key)"
                                     class="w-full text-sm rounded-md px-3 py-2 outline-none transition-all shadow-sm appearance-none bg-white">
                                   <option value="" disabled>{{ field.placeholder || 'Select an option' }}</option>
                                   <option *ngFor="let opt of field.options" [value]="opt">{{ opt }}</option>
                              </select>
                              
                              <!-- Date Input -->
                              <input *ngIf="field.type === 'date'"
                                     [(ngModel)]="field.value"
                                     type="date"
                                     [ngClass]="getInputStyles(field.lineage, focusedField?.key === field.key)"
                                     class="w-full text-sm rounded-md px-3 py-2 outline-none transition-all shadow-sm">
   
                              <!-- Text Input -->
                              <input *ngIf="field.type !== 'textarea' && field.type !== 'file' && field.type !== 'select' && field.type !== 'date'" 
                                     [(ngModel)]="field.value"
                                     [type]="field.type || 'text'"
                                     [placeholder]="field.placeholder || ''"
                                     [ngClass]="getInputStyles(field.lineage, focusedField?.key === field.key)"
                                     class="w-full text-sm rounded-md px-3 py-2 outline-none transition-all shadow-sm">
                              
                              <!-- Textarea -->
                              <textarea *ngIf="field.type === 'textarea'"
                                        [(ngModel)]="field.value"
                                        rows="3"
                                        [placeholder]="field.placeholder || ''"
                                        [ngClass]="getInputStyles(field.lineage, focusedField?.key === field.key)"
                                        class="w-full text-sm rounded-md px-3 py-2 outline-none transition-all shadow-sm"></textarea>
                              
                              <!-- Lineage Badge (Inside Input for compactness) -->
                              <div class="absolute right-2 top-2.5 pointer-events-none">
                                 <ng-container [ngSwitch]="field.lineage">
                                    <lucide-icon *ngSwitchCase="'AUTO'" name="check" class="w-4 h-4 text-green-600 opacity-50"></lucide-icon>
                                    <lucide-icon *ngSwitchCase="'ADAPTED'" name="alert-circle" class="w-4 h-4 text-amber-600 opacity-50"></lucide-icon>
                                    <lucide-icon *ngSwitchCase="'MANUAL'" name="edit-2" class="w-4 h-4 text-red-500 opacity-50"></lucide-icon>
                                 </ng-container>
                              </div>
                           </div>
                        </ng-container>

                     </div>
                  </div>

                  <!-- Section Footer: Actions -->
                  <div class="px-6 py-3 bg-gray-50/80 border-t border-gray-100 flex items-center gap-4">
                     
                     <!-- Document Attachment Trigger -->
                     <button class="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-blue-600 transition-colors" title="Attach Document to Section">
                        <lucide-icon name="paperclip" class="w-4 h-4"></lucide-icon>
                        <span class="hidden sm:inline">Attach</span>
                     </button>

                     <div class="h-4 w-px bg-gray-300"></div>

                     <!-- Comments -->
                     <div class="flex-1 flex items-center gap-2">
                        <div class="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-[10px] font-bold ring-2 ring-white flex-none">JD</div>
                        <input [(ngModel)]="section.comments"
                               placeholder="Add a comment..."
                               class="flex-1 bg-transparent border-none text-sm placeholder:text-gray-400 focus:ring-0 p-0 text-gray-700">
                        <button *ngIf="section.comments" class="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors">Post</button>
                     </div>
                  </div>

            </div>
         </div>

      </div>

         <!-- RIGHT: SOURCE INSPECTOR SIDEBAR -->
         <div class="w-80 bg-white border-l border-gray-200 flex-none flex flex-col shadow-xl z-30 transition-all duration-300"
              [class.translate-x-full]="!focusedField"
              [class.translate-x-0]="focusedField">
            
            <ng-container *ngIf="focusedField">
               <!-- Header -->
               <div class="h-14 border-b border-gray-100 flex items-center justify-between px-5 bg-gray-50">
                   <h3 class="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                      <lucide-icon name="eye" class="w-3.5 h-3.5"></lucide-icon> Source Inspector
                   </h3>
                   <button (click)="focusedField = null" class="text-gray-400 hover:text-gray-600">
                      <lucide-icon name="x" class="w-4 h-4"></lucide-icon>
                   </button>
               </div>

               <div class="p-5 flex-1 overflow-y-auto">
                   <!-- Field Context -->
                   <div class="mb-6">
                      <p class="text-[10px] uppercase font-bold text-gray-400 mb-1">Field Name</p>
                      <h2 class="text-lg font-bold text-gray-900">{{ focusedField.label }}</h2>
                      <div class="mt-2 flex items-center gap-2">
                         <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                               [class.bg-green-100]="focusedField.lineage === 'AUTO'"
                               [class.text-green-700]="focusedField.lineage === 'AUTO'"
                               [class.bg-amber-100]="focusedField.lineage === 'ADAPTED'"
                               [class.text-amber-700]="focusedField.lineage === 'ADAPTED'"
                               [class.bg-red-100]="focusedField.lineage === 'MANUAL'"
                               [class.text-red-700]="focusedField.lineage === 'MANUAL'">
                            {{ focusedField.lineage }}
                         </span>
                         <span *ngIf="focusedField.lineageMetadata?.confidenceScore" class="text-xs font-medium text-gray-500">
                            {{ focusedField.lineageMetadata?.confidenceScore }}% Confidence
                         </span>
                      </div>
                   </div>

                   <!-- AUTO/ADAPTED Content -->
                   <div *ngIf="focusedField.lineage !== 'MANUAL'" class="space-y-6">
                      
                      <!-- Adaptation Logic -->
                      <div *ngIf="focusedField.lineageMetadata?.adaptationLogic" class="bg-amber-50 rounded-lg p-3 border border-amber-100">
                         <div class="flex gap-2">
                            <lucide-icon name="git-branch" class="w-4 h-4 text-amber-600 flex-none mt-0.5"></lucide-icon>
                            <div>
                               <p class="text-xs font-bold text-amber-800 mb-1">Adaptation Logic</p>
                               <p class="text-xs text-amber-700 leading-relaxed">{{ focusedField.lineageMetadata?.adaptationLogic }}</p>
                            </div>
                         </div>
                      </div>

                      <!-- Source Snippet -->
                      <div *ngIf="focusedField.lineageMetadata?.sourceSnippet">
                         <p class="text-[10px] uppercase font-bold text-gray-400 mb-2">Original Source ({{ focusedField.lineageMetadata?.sourceDocId }})</p>
                         <div class="bg-slate-50 rounded-lg p-3 border border-slate-200 text-xs text-gray-600 font-mono leading-relaxed relative cursor-pointer hover:bg-slate-100 transition-colors">
                            "{{ focusedField.lineageMetadata?.sourceSnippet }}"
                            <div class="absolute top-2 right-2 opacity-50">
                               <lucide-icon name="quote" class="w-3 h-3 text-slate-400"></lucide-icon>
                            </div>
                         </div>
                      </div>

                      <div class="pt-4 border-t border-gray-100">
                         <button class="w-full py-2 bg-white border border-gray-200 text-gray-600 hover:text-blue-600 hover:border-blue-300 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2">
                            <lucide-icon name="external-link" class="w-3.5 h-3.5"></lucide-icon> View Full Source Doc
                         </button>
                      </div>
                   </div>

                   <!-- MANUAL Content -->
                   <div *ngIf="focusedField.lineage === 'MANUAL'" class="space-y-4">
                      <div class="bg-blue-50 rounded-lg p-4 border border-blue-100 text-center">
                         <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                            <lucide-icon name="bot" class="w-5 h-5 text-blue-600"></lucide-icon>
                         </div>
                         <h4 class="text-sm font-bold text-blue-900 mb-1">Need help writing this?</h4>
                         <p class="text-xs text-blue-700 mb-3">{{ focusedField.lineageMetadata?.agentTip || 'I can search KB for similar clauses.' }}</p>
                         <button class="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm shadow-blue-200">
                            Ask Agent to Draft
                         </button>
                      </div>
                   </div>
               </div>
            </ng-container>
         </div>

    </div>

    <!-- VALIDATION OVERLAY -->
    <div *ngIf="showValidationModal" class="fixed inset-0 z-[300] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 lg:p-12 animate-in fade-in duration-200">
        <div class="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-full">
            <!-- Header -->
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

            <!-- Body -->
            <div class="p-6 overflow-y-auto" *ngIf="validationResult">
                
                <!-- Score Block -->
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

                <!-- Domain List -->
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

            <!-- Footer -->
            <div class="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
                <button (click)="closeValidationModal()" class="px-5 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-colors">
                    Close
                </button>
            </div>
        </div>
    </div>

   `,
   styles: [`
    /* Custom Scrollbar */
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { bg: transparent; }
    ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
  `]
})
export class NpaTemplateEditorComponent implements OnInit {
   @Output() close = new EventEmitter<void>();
   @Input() inputData: any = null; // Data from Agent

   @Output() onSave = new EventEmitter<any>();

   private governanceService = inject(AgentGovernanceService);

   activeSection = 'p1';
   focusedField: NpaField | null = null;
   showValidationModal = false;
   validationResult: ReadinessResult | null = null;

   private npaService = inject(NpaService);

   // Sections loaded from API (or empty until loaded)
   sections: NpaSection[] = [];

   ngOnInit() {
      // Load real form sections from API if a project ID is available via inputData
      const projectId = this.inputData?.projectId || this.inputData?.id;
      if (projectId) {
         this.npaService.getFormSections(projectId).subscribe({
            next: (apiSections) => {
               this.sections = apiSections.map((s: any) => ({
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
                     placeholder: f.tooltip || '',
                     options: (f.options || []).map((o: any) => o.label || o.value),
                  }))
               }));
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

   validateGovernance() {
      // Construct a description from the form
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
      // Simple concatenation of key fields to simulate a description
      const prodName = this.findFieldValue('Product Details', 'Product Name') || '';
      const riskType = this.findFieldValue('Risk Assessment', 'Primary Risk Type') || '';
      // We assume some business rationale or similar exists or we concat generic text if missing to trigger logic
      return `${prodName}. ${riskType}.`;
   }

   private findFieldValue(sectionTitle: string, fieldLabel: string): string | undefined {
      const sec = this.sections.find(s => s.title === sectionTitle);
      return sec?.fields.find(f => f.label === fieldLabel)?.value;
   }

   save() {
      // Emitting the full sections data as the 'draft'
      this.onSave.emit(this.sections);
      this.close.emit();
   }

   mergeInputData() {
      // Logic to merge inputData (e.g. from Chat) into the sections
      if (!this.inputData) return;

      const productSection = this.sections.find(s => s.title === 'Product Details');
      if (productSection) {
         if (this.inputData.title) this.updateField(productSection, 'Product Name', this.inputData.title);
         if (this.inputData.jurisdictions) this.updateField(productSection, 'Key Currencies', 'CNY (offshore), ' + (this.inputData.jurisdictions.includes('Hong Kong') ? 'HKD' : ''));
      }

      const riskSection = this.sections.find(s => s.title === 'Risk Assessment');
      if (riskSection) {
         if (this.inputData.riskLevel) this.updateField(riskSection, 'Primary Risk Type', 'Market Risk (' + this.inputData.riskLevel + ')');
         if (this.inputData.notional) this.updateField(riskSection, 'Risk Limits (VaR)', 'Daily VaR limit for ' + (this.inputData.notional / 1000000) + 'M position');
      }

      const opsSection = this.sections.find(s => s.title === 'Operational Readiness');
      if (opsSection) {
         this.updateField(opsSection, 'Booking System', 'Murex (MX.3) - IRD Module');
         this.updateField(opsSection, 'Accounting Treatment', 'Fair Value Through Profit/Loss (FVTPL)'); // Automated inference
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
      // Simple scroll spy logic could go here to update activeSection
   }

   autoSize(event: any) {
      const textarea = event.target;
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
   }

   getInputStyles(lineage: FieldLineage, isFocused: boolean): string {
      let base = 'bg-gray-50 border transition-all text-gray-900 ';

      // Lineage colors
      if (lineage === 'AUTO') base += 'border-green-500 ';
      else if (lineage === 'ADAPTED') base += 'border-amber-500 ';
      else if (lineage === 'MANUAL') base += 'border-red-500 ';
      else base += 'border-gray-300 ';

      // Focus state
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
