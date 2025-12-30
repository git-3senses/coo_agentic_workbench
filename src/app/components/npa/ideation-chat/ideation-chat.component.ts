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

      <!-- Input -->
      <div class="p-4 bg-gray-50 border-t border-gray-200">
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
    @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
    .animate-fade-in { animation: fade-in 0.3s ease-out; }
  `]
})
export class OrchestratorChatComponent implements OnInit, AfterViewChecked {
    @Output() onComplete = new EventEmitter<void>();
    @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

    userInput = '';
    isThinking = false;
    messages: ChatMessage[] = [];
    nextAgent: AgentIdentity | null = null;

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
            content: 'Hello! I am your **NPA Agent**. I can assist you with all your product approval tasks, including strategy drafting, risk assessment, and compliance checks. How can I help you today?',
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

        // 2. ORCHESTRATION LOGIC (Hidden/Background)
        // In a real app, this would route to different agents, but we will just pass the intent to the single Dify flow.
        this.callAgentResponse(content, this.currentAgent);
    }

    private determineTargetAgent(content: string): AgentIdentity {
        // logic preserved for future backend routing if needed, but not used for UI
        return this.AGENTS['ORCHESTRATOR'];
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
