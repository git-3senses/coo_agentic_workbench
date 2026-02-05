import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, UploadCloud, Edit2, AlertCircle, Paperclip } from 'lucide-angular';
import { FormsModule } from '@angular/forms';

export type FieldLineage = 'AUTO' | 'ADAPTED' | 'MANUAL';

export interface LineageMetadata {
   sourceDocId?: string;       // e.g., 'TSG1917'
   sourceSnippet?: string;     // The exact text from the source
   adaptationLogic?: string;   // Reasoning for adaptation
   confidenceScore?: number;   // 0-100
   agentTip?: string;          // Helpful prompt for Manual fields
}

export interface NpaField {
   key: string;
   label: string;
   value: string;
   lineage: FieldLineage;
   lineageMetadata?: LineageMetadata; // New: The "Why" behind the data
   type?: 'text' | 'textarea' | 'date' | 'select' | 'currency' | 'file';
   options?: string[]; // For select types
   tooltip?: string;   // Explanation for adaptation or source
   placeholder?: string;
   required?: boolean;
}

export interface NpaSection {
   id: string;
   title: string;
   description?: string;
   fields: NpaField[];
   comments?: string; // New: Section-level comments
   documents?: string[]; // New: Section-level attachments
}

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
                eNPA Proposal Form
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

           <button class="px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200 hover:border-gray-300 mr-2">
              Reset
           </button>

           <button class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 shadow-blue-200 flex items-center gap-2">
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
                     <div *ngFor="let field of section.fields" [class.md:col-span-2]="field.type === 'textarea'" class="relative">
                        
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

                           <!-- Text Input -->
                           <input *ngIf="field.type !== 'textarea' && field.type !== 'file'" 
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
export class NpaTemplateEditorComponent {
   @Output() close = new EventEmitter<void>();

   activeSection = 'spec';
   focusedField: NpaField | null = null; // New state for Inspector

   // MOCK DATA
   sections: NpaSection[] = [
      {
         id: 'spec',
         title: '1. Product & Business Case',
         description: 'Core details defining the product structure and economics.',
         fields: [
            {
               key: 'name', label: 'Product Name', value: 'FX Put Option GBP/USD', lineage: 'AUTO',
               lineageMetadata: { sourceDocId: 'TSG1917', sourceSnippet: 'Product Name: FX Put Option EUR/USD', confidenceScore: 98 }
            },
            {
               key: 'type', label: 'Product Type', value: 'FX Option', lineage: 'AUTO',
               lineageMetadata: { sourceDocId: 'Classification Agent', sourceSnippet: 'Classified as FX Option based on "Put Option" keyword.', confidenceScore: 99 }
            },
            { key: 'desk', label: 'Booking Desk', value: 'Singapore FX', lineage: 'AUTO' },
            {
               key: 'bu', label: 'Business Unit', value: 'Treasury & Markets', lineage: 'AUTO',
               lineageMetadata: { sourceDocId: 'TSG1917', sourceSnippet: 'Business Unit: Treasury & Markets', confidenceScore: 100 }
            },
            {
               key: 'notional', label: 'Notional Amount', value: '$75,000,000', lineage: 'AUTO',
               lineageMetadata: { sourceDocId: 'Term Sheet', sourceSnippet: 'Notional: USD 75M', confidenceScore: 100 }
            },
            { key: 'tenor', label: 'Tenor', value: '6 Months', lineage: 'AUTO' },
            {
               key: 'counterparty', label: 'Counterparty Name', value: '', lineage: 'MANUAL', placeholder: 'Enter Legal Entity Name', required: true,
               lineageMetadata: { agentTip: 'I can search Salesforce for recent counterparties in Hong Kong.' }
            },
            { key: 'tradeDate', label: 'Trade Date', value: '', lineage: 'MANUAL', type: 'date', required: true },
         ]
      },
      {
         id: 'ops',
         title: '2. Operational & Technology',
         description: 'Systems and processes for booking, valuation, and settlement.',
         fields: [
            {
               key: 'system', label: 'Booking System', value: 'Murex', lineage: 'AUTO',
               lineageMetadata: { sourceDocId: 'TSG1917', sourceSnippet: 'Booking System: Murex (Version 3.1)', confidenceScore: 95 }
            },
            {
               key: 'valuation', label: 'Valuation Model', value: 'Black-Scholes', lineage: 'AUTO',
               lineageMetadata: { sourceDocId: 'TSG1917', sourceSnippet: 'Valuation: Black-Scholes Standard Model', confidenceScore: 95 }
            },
            { key: 'settlement', label: 'Settlement Method', value: 'Cash (USD) via CLS', lineage: 'AUTO' },
            { key: 'conf', label: 'Confirmation Process', value: 'SWIFT MT300', lineage: 'AUTO' },
         ]
      },
      {
         id: 'pricing',
         title: '3. Pricing Model',
         description: 'Methodology for fair value and risk sensitivity.',
         fields: [
            { key: 'method', label: 'Pricing Methodology', value: 'Mid-market + bid-offer spread', lineage: 'AUTO' },
            {
               key: 'roae', label: 'ROAE Sensitivity Analysis', value: 'Sensitivity: 10bps move = $85k impact...', lineage: 'ADAPTED', type: 'textarea',
               lineageMetadata: {
                  sourceDocId: 'Finance Policy 2024',
                  sourceSnippet: 'Deals > $50M Notional require ROAE sensitivity.',
                  adaptationLogic: 'Triggered by Rule: Notional > $50M. Template inserted for user completion.',
                  confidenceScore: 90
               }
            },
            { key: 'bespoke', label: 'Bespoke Adjustments', value: '', lineage: 'MANUAL', type: 'textarea', placeholder: 'Describe any non-standard pricing logic...' },
         ]
      },
      {
         id: 'risk',
         title: '4. Risk Assessments',
         description: 'Evaluation of market, credit, listing, and operational risks.',
         fields: [
            {
               key: 'market', label: 'Market Risk', value: 'Moderate-to-High. Notional represents 4.5% of desk book. Daily VaR estimated at $360k.', lineage: 'ADAPTED', type: 'textarea',
               lineageMetadata: {
                  sourceDocId: 'TSG1917',
                  sourceSnippet: 'Daily VaR: $180k (based on $25M Notional).',
                  adaptationLogic: 'Scaled VaR linearly from $25M → $75M. Risk rating bumped from Moderate to Moderate-High due to >4% Book limit.',
                  confidenceScore: 85
               }
            },
            {
               key: 'credit', label: 'Credit Risk', value: 'Counterparty rated A- (S&P). Weekly collateral exchange required per CSA.', lineage: 'ADAPTED', type: 'textarea',
               lineageMetadata: {
                  sourceDocId: 'Credit Matrix',
                  sourceSnippet: 'Rating: BBB+ requires Daily collateral.',
                  adaptationLogic: 'Adjusted collateral frequency to Weekly based on improved Rating (A-).',
                  confidenceScore: 92
               }
            },
            {
               key: 'ops_risk', label: 'Operational Risk', value: 'Moderate. Cross-border booking (SG-HK) requires manual month-end reconciliation.', lineage: 'ADAPTED', type: 'textarea',
               lineageMetadata: {
                  sourceDocId: 'Ops Policy: Branch',
                  sourceSnippet: 'Single entity booking: Low Risk.',
                  adaptationLogic: 'Inserted Cross-Border Clause due to SG Desk + HK Counterparty.',
                  confidenceScore: 95
               }
            },
         ]
      },
      {
         id: 'reg',
         title: '5. Regulatory Requirements',
         description: 'Compliance with local and international regulations.',
         fields: [
            { key: 'mas656', label: 'Applicable Regulations', value: 'MAS 656, CFTC Part 20, EMIR', lineage: 'AUTO' },
            { key: 'reporting', label: 'Reporting Obligations', value: 'DTCC SDR Reporting required within T+1', lineage: 'AUTO' },
         ]
      },
      {
         id: 'signoff',
         title: '6. Sign-Off Matrix',
         description: 'Required approvers based on product classification.',
         fields: [
            {
               key: 'parties', label: 'Required Sign-Offs', value: 'RMG-Credit, Finance (Product Control), Finance VP, Market Risk, Ops, Technology', lineage: 'ADAPTED', type: 'textarea',
               lineageMetadata: {
                  sourceDocId: 'Classification Agent',
                  sourceSnippet: 'Standard Sign-offs: Credit, Finance, MLR.',
                  adaptationLogic: 'Added "Finance VP" (Notional > $50M) and "Ops/Tech" (Cross-Border Rule).',
                  confidenceScore: 100
               }
            },
            { key: 'timeline', label: 'Est. Approval Timeline', value: '4-5 Days', lineage: 'AUTO', tooltip: 'Predicted by ML Agent' },
         ]
      },
      {
         id: 'legal',
         title: '7. Legal Considerations',
         fields: [
            { key: 'law', label: 'Governing Law', value: 'Singapore Law', lineage: 'AUTO' },
            { key: 'docs', label: 'Documentation', value: 'ISDA Master Agreement (2002)', lineage: 'AUTO' },
            { key: 'special', label: 'Special Provisions', value: '', lineage: 'MANUAL', type: 'textarea' },
         ]
      },
      {
         id: 'attachments',
         title: '8. Supporting Documents',
         description: 'Attach any relevant files, term sheets, or email approvals.',
         fields: [
            { key: 'termSheet', label: 'Final Term Sheet', value: '', lineage: 'MANUAL', type: 'file', required: true, tooltip: 'Required for approval.' },
            { key: 'riskMemo', label: 'Risk Memo', value: '', lineage: 'MANUAL', type: 'file' },
         ]
      }
   ];

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
