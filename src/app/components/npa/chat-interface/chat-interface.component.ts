import { Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { FormsModule } from '@angular/forms';
import { OrchestratorChatComponent } from '../ideation-chat/ideation-chat.component';

interface NpaTemplate {
   id: string;
   title: string;
   description: string;
   category: string;
   successRate: number;
   avgTime: string;
   icon?: string;
   iconBg?: string; // e.g. 'bg-blue-100 text-blue-600'
   inputs: { label: string; placeholder: string; key: string; type?: string; required?: boolean }[];
}

@Component({
   selector: 'app-chat-interface',
   standalone: true,
   imports: [CommonModule, LucideAngularModule, FormsModule, OrchestratorChatComponent],
   template: `
    <div class="h-full flex flex-col bg-white">
      <!-- HEADER -->
      <div class="h-16 flex items-center justify-between px-6 border-b border-gray-200 bg-white shadow-sm z-20">
        <!-- Left: Context -->
        <div class="flex items-center gap-4">
          <button (click)="goBack()" class="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors">
             <lucide-icon name="arrow-left" class="w-5 h-5"></lucide-icon>
          </button>
          
          <div class="flex items-center gap-3">
             <div class="h-8 w-px bg-gray-200"></div>
             <div>
                <h2 class="text-sm font-bold text-gray-900">NPA Agent</h2>
                <p class="text-[10px] text-gray-500 font-mono">Product Approval Assistant</p>
             </div>
          </div>
        </div>

        <!-- Center: Mode Toggle -->
        <div class="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
           <button (click)="mode = 'TEMPLATE'" 
                   class="px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2"
                   [ngClass]="mode === 'TEMPLATE' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'">
               <lucide-icon name="layout-template" class="w-3.5 h-3.5"></lucide-icon>
               Templates
           </button>
           <button (click)="mode = 'AGENT'"
                   class="px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2"
                   [ngClass]="mode === 'AGENT' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'">
               <lucide-icon name="message-square" class="w-3.5 h-3.5"></lucide-icon>
               Chat
           </button>
        </div>

        <!-- Right: Actions -->
        <div class="flex items-center gap-2">
           <!-- Reset Chat (Agent Mode Only) -->
           <button *ngIf="mode === 'AGENT'" 
                   (click)="resetChat()" 
                   title="Reset Conversation"
                   class="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-red-600 transition-colors">
               <lucide-icon name="rotate-ccw" class="w-5 h-5"></lucide-icon>
           </button>

           <div class="h-6 w-px bg-gray-200 mx-1"></div>

           <span class="text-xs text-green-600 font-medium flex items-center gap-1.5 bg-green-50 px-2 py-1 rounded border border-green-100">
              <span class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Online
           </span>
        </div>
      </div>

      <!-- BODY CONTENT -->
      <div class="flex-1 overflow-hidden relative flex flex-col">
         
         <!-- MODE 1: TEMPLATE MODE -->
         <div *ngIf="mode === 'TEMPLATE'" class="flex-1 flex flex-col h-full bg-slate-50 relative">
            
            <!-- Context Bar (Categories) -->
            <div class="w-full bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4 overflow-x-auto scrollbar-hide flex-none">
               <div class="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-wider mr-2">
                  <lucide-icon name="filter" class="w-3.5 h-3.5"></lucide-icon> Categories:
               </div>
               
               <button *ngFor="let cat of categories" 
                       (click)="selectedCategory = cat.id"
                       class="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border"
                       [ngClass]="selectedCategory === cat.id ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'">
                   {{ cat.name }}
               </button>
            </div>

            <!-- Main: Template List -->
            <div class="flex-1 overflow-y-auto p-6 md:p-8">
               <div class="max-w-5xl mx-auto space-y-6">
                  <!-- Search & Filter -->
                  <div class="flex items-center justify-between mb-2">
                     <h3 class="text-lg font-bold text-gray-900 flex items-center gap-2">
                        {{ getCategoryName(selectedCategory) }} 
                        <span class="text-gray-400 font-normal text-sm">({{ getTemplatesByCategory(selectedCategory).length }} templates)</span>
                     </h3>
                     
                     <div class="relative w-64">
                         <lucide-icon name="search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"></lucide-icon>
                         <input type="text" placeholder="Filter templates..." class="w-full text-sm pl-9 pr-3 py-2 rounded-lg border border-gray-200 bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none shadow-sm">
                     </div>
                  </div>

                  <!-- Templates Grid -->
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div *ngFor="let t of getTemplatesByCategory(selectedCategory)" 
                          class="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer relative group flex flex-col h-full"
                          (click)="selectTemplate(t)">
                        
                        <div class="flex items-start justify-between mb-3">
                           <div class="p-2 rounded-lg" [ngClass]="t.iconBg || 'bg-gray-100 text-gray-600'">
                              <lucide-icon [name]="t.icon || 'file-text'" class="w-5 h-5"></lucide-icon>
                           </div>
                           <lucide-icon name="arrow-right" class="w-4 h-4 text-gray-300 group-hover:text-indigo-500 transition-colors"></lucide-icon>
                        </div>

                        <h4 class="text-sm font-bold text-gray-900 mb-1 group-hover:text-indigo-700 transition-colors">{{ t.title }}</h4>
                        <p class="text-xs text-gray-500 mb-4 line-clamp-2 flex-1">{{ t.description }}</p>

                        <div class="flex items-center gap-3 text-[10px] font-medium pt-3 border-t border-gray-100">
                           <span class="text-slate-600 flex items-center gap-1">
                              <lucide-icon name="clock" class="w-3 h-3 text-slate-400"></lucide-icon> {{ t.avgTime }}
                           </span>
                           <span class="text-slate-600 flex items-center gap-1">
                              <lucide-icon name="check-circle" class="w-3 h-3 text-green-500"></lucide-icon> {{ t.successRate }}% success
                           </span>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            <!-- Right Panel: Active Template Form (Slide Over) -->
            <div *ngIf="activeTemplate" class="w-96 border-l border-gray-200 bg-white flex-none flex flex-col shadow-2xl absolute right-0 top-0 bottom-0 z-30 animate-slide-in">
               <div class="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                  <h3 class="text-sm font-bold text-gray-900 truncate pr-4">Configure Template</h3>
                  <button (click)="activeTemplate = null" class="text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full p-1 transition-colors">
                     <lucide-icon name="x" class="w-5 h-5"></lucide-icon>
                  </button>
               </div>
               
               <div class="p-6 flex-1 overflow-y-auto">
                  <div class="space-y-6">
                     <div class="flex items-start gap-3">
                        <div class="p-2 rounded-lg flex-none" [ngClass]="activeTemplate.iconBg">
                           <lucide-icon [name]="activeTemplate.icon || 'file-text'" class="w-5 h-5"></lucide-icon>
                        </div>
                        <div>
                           <label class="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Selected</label>
                           <p class="text-sm font-bold text-gray-900 leading-tight">{{ activeTemplate.title }}</p>
                        </div>
                     </div>

                     <div class="p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-xs text-indigo-800">
                        {{ activeTemplate.description }}
                     </div>

                     <div class="space-y-4 pt-2">
                        <div *ngFor="let field of activeTemplate.inputs">
                           <label class="block text-xs font-semibold text-gray-700 mb-1.5">{{ field.label }} <span *ngIf="field.required" class="text-red-500">*</span></label>
                           <input *ngIf="field.type !== 'textarea'" [type]="field.type || 'text'" [placeholder]="field.placeholder" class="w-full text-sm px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-shadow bg-white hover:bg-gray-50 focus:bg-white">
                           <textarea *ngIf="field.type === 'textarea'" [placeholder]="field.placeholder" rows="3" class="w-full text-sm px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-shadow bg-white hover:bg-gray-50 focus:bg-white"></textarea>
                        </div>
                     </div>
                  </div>
               </div>

               <div class="p-4 border-t border-gray-200 bg-gray-50">
                  <button (click)="submitTemplate()" class="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 transform active:scale-95">
                     <lucide-icon name="sparkles" class="w-4 h-4"></lucide-icon> Generate with AI
                  </button>
               </div>
            </div>
         </div>

         <!-- MODE 2: AGENT MODE (Conversation) -->
         <div *ngIf="mode === 'AGENT'" class="h-full flex flex-col">
            <app-orchestrator-chat (onComplete)="handleAgentComplete($event)"></app-orchestrator-chat>
         </div>

      </div>
    </div>
  `,
   styles: [`
    :host { display: block; height: 100%; }
    .animate-slide-in { animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `]
})
export class ChatInterfaceComponent {
   @Output() onBack = new EventEmitter<void>();
   @Output() onComplete = new EventEmitter<any>();
   @ViewChild(OrchestratorChatComponent) chatComponent!: OrchestratorChatComponent;

   mode: 'TEMPLATE' | 'AGENT' = 'TEMPLATE';
   selectedCategory = 'STRATEGY';
   activeTemplate: NpaTemplate | null = null;

   categories = [
      { id: 'STRATEGY', name: 'Product Strategy' },
      { id: 'RISK', name: 'Risk & Compliance' },
      { id: 'LEGAL', name: 'Legal & Regulatory' },
      { id: 'OPS', name: 'Operations' },
      { id: 'MARKETING', name: 'Marketing & Sales' }
   ];

   templates: NpaTemplate[] = [
      // STRATEGY
      {
         id: 'S1',
         title: 'Draft New Product Concept',
         description: 'Generate a structured concept paper for a new financial product, including target market and revenue model.',
         category: 'Product Strategy',
         successRate: 88,
         avgTime: '2m 15s',
         icon: 'lightbulb',
         iconBg: 'bg-amber-100 text-amber-600',
         inputs: [
            { label: 'Product Name', placeholder: 'e.g. Green Bond ETF', key: 'name', required: true },
            { label: 'Target Segment', placeholder: 'e.g. Institutional Investors', key: 'segment' },
            { label: 'Key Features', placeholder: 'Describe main features...', key: 'features', type: 'textarea' }
         ]
      },
      {
         id: 'S2',
         title: 'Competitor Analysis',
         description: 'Analyze key competitors for a proposed product and identify differentiators.',
         category: 'Product Strategy',
         successRate: 92,
         avgTime: '45s',
         icon: 'users',
         iconBg: 'bg-blue-100 text-blue-600',
         inputs: [
            { label: 'Product Type', placeholder: 'e.g. Robo-advisory', key: 'type', required: true },
            { label: 'Main Competitor', placeholder: 'e.g. StashAway', key: 'competitor' }
         ]
      },

      // RISK
      {
         id: 'R1',
         title: 'Initial Risk Assessment',
         description: 'Evaluate potential operational, credit, and market risks for a new initiative.',
         category: 'Risk & Compliance',
         successRate: 95,
         avgTime: '1m 30s',
         icon: 'shield-alert',
         iconBg: 'bg-red-100 text-red-600',
         inputs: [
            { label: 'Product/Process', placeholder: 'e.g. Crypto Custody', key: 'product', required: true },
            { label: 'Jurisdiction', placeholder: 'e.g. Singapore, HK', key: 'jurisdiction' }
         ]
      },
      {
         id: 'R2',
         title: 'Check Prohibited Lists',
         description: 'Scan entities or product types against internal prohibited/restricted lists.',
         category: 'Risk & Compliance',
         successRate: 99,
         avgTime: '10s',
         icon: 'search',
         iconBg: 'bg-orange-100 text-orange-600',
         inputs: [
            { label: 'Keywords', placeholder: 'Enter names or sectors...', key: 'keywords', required: true }
         ]
      },

      // LEGAL
      {
         id: 'L1',
         title: 'Regulatory Compliance Check',
         description: 'Verify if a product structure adheres to MAS Guidelines (e.g., SFA, FAA).',
         category: 'Legal & Regulatory',
         successRate: 91,
         avgTime: '3m',
         icon: 'scale',
         iconBg: 'bg-slate-100 text-slate-700',
         inputs: [
            { label: 'Product Structure', placeholder: 'Describe structure...', key: 'structure', type: 'textarea' },
            { label: 'Relevant Regulation', placeholder: 'e.g. MAS 656', key: 'reg' }
         ]
      },

      // OPS
      {
         id: 'O1',
         title: 'Draft Process Flow',
         description: 'Outline the end-to-end operational workflow for booking and settlement.',
         category: 'Operations',
         successRate: 85,
         avgTime: '2m',
         icon: 'workflow',
         iconBg: 'bg-indigo-100 text-indigo-600',
         inputs: [
            { label: 'Asset Class', placeholder: 'e.g. Equities', key: 'asset' },
            { label: 'Booking System', placeholder: 'e.g. Murex', key: 'system' }
         ]
      }
   ];

   constructor() {
      console.log('ChatInterface Init. Categories:', this.categories);
      console.log('Templates:', this.templates);
   }

   goBack() {
      this.onBack.emit();
   }

   handleAgentComplete(payload: any) {
      this.onComplete.emit(payload);
   }

   getCategoryName(id: string) {
      return this.categories.find(c => c.id === id)?.name || 'Templates';
   }

   getTemplatesByCategory(catId: string) {
      const catName = this.categories.find(c => c.id === catId)?.name;
      if (!catName) return [];
      return this.templates.filter(t => t.category === catName);
   }

   selectTemplate(t: NpaTemplate) {
      this.activeTemplate = t;
   }

   submitTemplate() {
      if (!this.activeTemplate) return;

      // 1. Construct the prompt/message from template and inputs (mocked values for now)
      const templateTitle = this.activeTemplate.title;
      const inputs = this.activeTemplate.inputs.map((i: any) => `${i.label}: [User Input]`).join(', '); // In real app, bind to ngModel
      const message = `Manage Task: ${templateTitle}\nDetails: ${inputs}`;

      // 2. Switch to Agent Mode
      this.mode = 'AGENT';
      this.activeTemplate = null;

      // 3. Trigger Chat (after view update)
      setTimeout(() => {
         if (this.chatComponent) {
            this.chatComponent.triggerInput(message);
         }
      }, 100);
   }

   resetChat() {
      if (this.chatComponent) {
         this.chatComponent.resetChat();
      }
   }
}
