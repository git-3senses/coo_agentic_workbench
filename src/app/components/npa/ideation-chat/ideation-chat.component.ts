import { Component, EventEmitter, Output, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { DifyService, DifyAgentResponse } from '../../../services/dify/dify.service';
import { MarkdownModule } from 'ngx-markdown';

interface ChatMessage {
    role: 'user' | 'agent';
    content: string;
    timestamp: Date;
    agentIdentity?: AgentIdentity; // The agent who sent this message
}

interface AgentIdentity {
    id: string;
    name: string;
    role: string;
    color: string; // Tailwind class for bg
    icon: string;
}

@Component({
    selector: 'app-orchestrator-chat',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule, MarkdownModule],
    template: `
    <div class="flex flex-col h-full bg-white relative">
      <!-- TOAST NOTIFICATION -->
      <div *ngIf="showToast" class="absolute top-4 right-4 z-50 bg-white border-l-4 border-l-green-500 border-gray-200 shadow-xl p-4 rounded-lg animate-fade-in flex items-center gap-3 transition-all">
          <div class="h-8 w-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
              <lucide-icon name="check" class="w-5 h-5"></lucide-icon>
          </div>
          <div>
              <h4 class="font-bold text-gray-900 text-sm">Proposal Ready</h4>
              <p class="text-xs text-gray-500">Draft generated successfully.</p>
          </div>
          <button (click)="onComplete.emit()" class="ml-4 px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-md hover:bg-green-700 shadow-sm">
              View
          </button>
      </div>

      <!-- Transcript -->
      <div class="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scroll-smooth" #scrollContainer>
         <div *ngFor="let msg of messages" class="flex gap-4 group" [ngClass]="{'flex-row-reverse': msg.role === 'user'}">
            
            <!-- Avatar -->
            <div class="flex-none w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm transition-all relative"
                 [ngClass]="msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-indigo-600'">
               <span *ngIf="msg.role === 'user'">V</span>
               <lucide-icon *ngIf="msg.role !== 'user'" name="bot" class="w-4 h-4"></lucide-icon>
            </div>

            <!-- Bubble -->
            <div class="max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm transition-all"
                 [ngClass]="msg.role === 'user' ? 'bg-indigo-50 border border-indigo-100 text-gray-900 rounded-tr-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'">
               <markdown [data]="msg.content"></markdown>
               <span class="text-[9px] opacity-40 mt-1 block font-mono">{{ msg.timestamp | date:'shortTime' }}</span>
            </div>
         </div>

         <!-- Thinking Indicator -->
         <div *ngIf="isThinking" class="flex gap-4 animate-pulse">
             <div class="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center">
                 <lucide-icon name="loader-2" class="w-3 h-3 text-indigo-600 animate-spin"></lucide-icon>
             </div>
             <div class="text-xs text-gray-400 flex items-center gap-2 py-2">
                 <span>Processing request...</span>
             </div>
         </div>
      </div>

      <!-- Generate Work Item Button -->
      <div *ngIf="showGenerateButton" class="px-4 py-3 border-t border-indigo-100 bg-indigo-50/50">
         <button (click)="generateWorkItem()"
                 class="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 transform active:scale-95">
            <lucide-icon name="file-plus-2" class="w-4 h-4"></lucide-icon>
            Generate Work Item
         </button>
      </div>

      <!-- Input -->
      <div class="p-4 bg-gray-50 border-t border-gray-200">
         <!-- DRAFT READY BANNER (Contextual) -->
         <div *ngIf="isDraftReady" class="mb-3 px-1 flex items-center justify-between bg-green-50 p-3 rounded-xl border border-green-100 animate-fade-in">
             <div class="flex items-center gap-2">
                 <div class="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                    <lucide-icon name="file-check" class="w-3.5 h-3.5"></lucide-icon>
                 </div>
                 <span class="text-sm font-bold text-green-900">Draft Proposal Ready</span>
             </div>
             <button (click)="onComplete.emit()" class="px-4 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-green-700 flex items-center gap-2 transition-colors">
                 Review Now <lucide-icon name="arrow-right" class="w-3.5 h-3.5"></lucide-icon>
             </button>
         </div>

         <!-- Status Indicator (Only if NO draft yet) -->
         <div *ngIf="!isDraftReady" class="flex items-center justify-between mb-3 px-1">
             <div class="flex items-center gap-2">
                 <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                 <span class="text-xs font-bold text-gray-500 uppercase tracking-wide">AI Agent Active</span>
             </div>
         </div>
         
         <div class="relative flex items-center">
             <input type="text" 
                    [(ngModel)]="userInput" 
                    (keydown.enter)="sendMessage()"
                    placeholder="Ask me anything about your NPA..." 
                    class="w-full bg-white text-gray-900 text-sm rounded-lg pl-4 pr-12 py-3 border border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all placeholder:text-gray-400 shadow-sm"
                    [disabled]="isThinking">
             
             <button (click)="sendMessage()" 
                     [disabled]="!userInput.trim() || isThinking"
                     class="absolute right-2 p-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm">
                <lucide-icon name="send" class="w-4 h-4"></lucide-icon>
             </button>
         </div>
      </div>
    </div>
  `,
    styles: [`
    :host { display: block; height: 100%; }
    .scrollbar-thin::-webkit-scrollbar { width: 6px; }
    .scrollbar-thin::-webkit-scrollbar-thumb { background-color: #e5e7eb; border-radius: 3px; }
    @keyframes fade-in { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
    .animate-fade-in { animation: fade-in 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
  `]
})
export class OrchestratorChatComponent implements OnInit, AfterViewChecked {
    @Output() onComplete = new EventEmitter<any>();
    @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

    userInput = '';
    isThinking = false;
    isDraftReady = false;
    showToast = false;
    messages: ChatMessage[] = [];
    nextAgent: AgentIdentity | null = null;
    showGenerateButton = false;
    routingPayload: any = null;

    // DEFINED AGENTS
    readonly AGENTS: Record<string, AgentIdentity> = {
        ORCHESTRATOR: { id: 'ORCHESTRATOR', name: 'NPA Orchestrator', role: 'Main Coordinator', color: 'bg-slate-800', icon: 'brain-circuit' },
        STRATEGY: { id: 'STRATEGY', name: 'Strategy Agent', role: 'Product & Market Analysis', color: 'bg-amber-500', icon: 'lightbulb' },
        RISK: { id: 'RISK', name: 'Risk Agent', role: 'Risk & Compliance Check', color: 'bg-red-500', icon: 'shield-alert' },
        LEGAL: { id: 'LEGAL', name: 'Legal Agent', role: 'Regulatory & Contract Review', color: 'bg-blue-600', icon: 'scale' },
        OPS: { id: 'OPS', name: 'Ops Agent', role: 'Operational Workflow', color: 'bg-emerald-600', icon: 'settings' }
    };

    currentAgent: AgentIdentity = this.AGENTS['ORCHESTRATOR'];

    constructor(private difyService: DifyService) { }

    ngOnInit() {
        this.startConversation();
    }

    ngAfterViewChecked() {
        this.scrollToBottom();
    }

    startConversation() {
        this.difyService.reset();
        this.messages.push({
            role: 'agent',
            content: 'Hello! I am your **NPA Agent**. I can assist you with all your product approval tasks. When you are ready to generate a draft, simply say **"Confirm"**.',
            timestamp: new Date()
        });
    }

    sendMessage() {
        if (!this.userInput.trim()) return;
        this.processUserMessage(this.userInput);
    }

    public triggerInput(text: string) {
        this.processUserMessage(text);
    }

    private processUserMessage(content: string) {
        // 1. User Message
        this.messages.push({ role: 'user', content, timestamp: new Date() });
        this.userInput = '';
        this.isThinking = true;

        // 2. ORCHESTRATION LOGIC (Realtime from Dify Agent)
        this.callAgentResponse(content, this.currentAgent);
    }

    private finishDraft() {
        this.isDraftReady = true;
        this.showToast = true;

        // Hide Toast after 5s
        setTimeout(() => {
            this.showToast = false;
        }, 5000);
    }

    private determineTargetAgent(content: string): AgentIdentity {
        // logic preserved for future backend routing if needed, but not used for UI
        return this.AGENTS['ORCHESTRATOR'];
    }

    generateWorkItem() {
        this.onComplete.emit(this.routingPayload);
    }

    private callAgentResponse(content: string, agent: AgentIdentity) {
        this.difyService.sendMessage(content).subscribe({
            next: (res) => {
                this.messages.push({
                    role: 'agent',
                    content: res.answer,
                    timestamp: new Date()
                });
                this.isThinking = false;

                // Check for Agent Actions
                if (res.metadata?.agent_action === 'FINALIZE_DRAFT') {
                    this.finishDraft();
                } else if (res.metadata?.agent_action === 'ROUTE_WORK_ITEM') {
                    this.routingPayload = res.metadata.payload;
                    this.showGenerateButton = true;
                } else if (res.metadata?.agent_action === 'STOP_PROCESS') {
                    this.showGenerateButton = false;
                    this.routingPayload = null;
                }
            },
            error: () => {
                this.messages.push({
                    role: 'agent',
                    content: "I'm encountering a connection issue. Please try again.",
                    timestamp: new Date()
                });
                this.isThinking = false;
            }
        });
    }

    resetChat() {
        this.messages = [];
        this.currentAgent = this.AGENTS['ORCHESTRATOR'];
        this.startConversation();
    }

    private scrollToBottom(): void {
        try {
            this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
        } catch (err) { }
    }
}
