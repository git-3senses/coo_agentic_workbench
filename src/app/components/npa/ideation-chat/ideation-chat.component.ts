import { Component, EventEmitter, Output, OnInit, ViewChild, ElementRef, AfterViewChecked, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { DifyService, DifyAgentResponse } from '../../../services/dify/dify.service';
import { MarkdownModule } from 'ngx-markdown';
import { AGENT_REGISTRY, AgentDefinition, AgentAction, AgentActivityUpdate } from '../../../lib/agent-interfaces';
import { Subscription } from 'rxjs';

interface ChatMessage {
    role: 'user' | 'agent';
    content: string;
    timestamp: Date;
    agentIdentity?: AgentIdentity;
    cardType?: 'CLASSIFICATION' | 'RISK' | 'HARD_STOP' | 'PREDICTION' | 'DELEGATION';
    cardData?: any;
    agentAction?: AgentAction;
}

interface AgentIdentity {
    id: string;
    name: string;
    role: string;
    color: string;
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
          <button (click)="onComplete.emit(routingPayload)" class="ml-4 px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-md hover:bg-green-700 shadow-sm">
              View
          </button>
      </div>

      <!-- Transcript -->
      <div class="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scroll-smooth" #scrollContainer>
         <div *ngFor="let msg of messages" class="flex gap-4 group" [ngClass]="{'flex-row-reverse': msg.role === 'user'}">
            
            <!-- Avatar -->
            <div class="flex-none w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm transition-all relative"
                 [ngClass]="msg.role === 'user' ? 'bg-indigo-600 text-white chat-avatar-user' : 'bg-white border border-gray-200 text-indigo-600 chat-avatar-agent'">
               <span *ngIf="msg.role === 'user'">V</span>
               <lucide-icon *ngIf="msg.role !== 'user'" name="bot" class="w-4 h-4"></lucide-icon>
            </div>

            <!-- Bubble Container -->
            <div class="flex flex-col gap-2 max-w-[85%]">
                
                <!-- Text Bubble -->
                <div class="rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm transition-all"
                     [ngClass]="msg.role === 'user' ? 'bg-indigo-50 border border-indigo-100 text-gray-900 rounded-tr-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'">
                   <markdown [data]="msg.content"></markdown>
                   <span class="text-[9px] opacity-40 mt-1 block font-mono">{{ msg.timestamp | date:'shortTime' }}</span>
                </div>

                <!-- CARD: CLASSIFICATION (from Dify metadata) -->
                <div *ngIf="msg.cardType === 'CLASSIFICATION' && msg.cardData" class="bg-indigo-50 border border-indigo-100 rounded-xl p-4 shadow-sm animate-fade-in w-full">
                    <div class="flex items-center justify-between mb-3">
                        <div class="flex items-center gap-3">
                            <div class="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                                <lucide-icon name="git-branch" class="w-5 h-5"></lucide-icon>
                            </div>
                            <div>
                                <h4 class="text-sm font-bold text-indigo-900">{{ msg.cardData.type || 'Classification' }}</h4>
                                <p class="text-[10px] text-indigo-600 font-mono uppercase">{{ msg.cardData.track }}</p>
                            </div>
                        </div>
                        <span class="px-2.5 py-1 rounded-full text-xs font-bold" [ngClass]="msg.cardData.overallConfidence > 80 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'">
                            {{ msg.cardData.overallConfidence }}% Confidence
                        </span>
                    </div>

                    <!-- Score Bars (7-criteria) -->
                    <div *ngIf="msg.cardData.scores" class="space-y-2 mb-3">
                        <div *ngFor="let score of msg.cardData.scores" class="flex items-center gap-2 text-xs">
                            <span class="w-24 text-slate-600 font-medium truncate">{{ score.criterion }}</span>
                            <div class="flex-1 h-1.5 bg-indigo-100 rounded-full overflow-hidden">
                                <div class="h-full bg-indigo-500 rounded-full transition-all duration-700" [style.width.%]="(score.score / score.maxScore) * 100"></div>
                            </div>
                            <span class="font-mono text-indigo-700 w-8 text-right">{{ score.score }}/{{ score.maxScore }}</span>
                        </div>
                    </div>
                </div>

                <!-- CARD: HARD STOP (Prohibited Product) -->
                <div *ngIf="msg.cardType === 'HARD_STOP' && msg.cardData" class="bg-red-50 border-2 border-red-300 rounded-xl p-4 shadow-sm animate-fade-in w-full">
                    <div class="flex items-center gap-3 mb-3">
                        <div class="p-2 bg-red-100 text-red-700 rounded-lg">
                            <lucide-icon name="shield-alert" class="w-5 h-5"></lucide-icon>
                        </div>
                        <div>
                            <h4 class="text-sm font-bold text-red-900">PROHIBITED — Hard Stop</h4>
                            <p class="text-[10px] text-red-600 font-mono uppercase">{{ msg.cardData.prohibitedMatch?.layer || 'REGULATORY' }}</p>
                        </div>
                    </div>
                    <div class="text-xs text-red-800 p-2 bg-white/50 rounded border border-red-200">
                        Matched prohibited item: <strong>{{ msg.cardData.prohibitedMatch?.item || 'Unknown' }}</strong>. NPA creation blocked.
                    </div>
                </div>

                <!-- CARD: ML PREDICTION -->
                <div *ngIf="msg.cardType === 'PREDICTION' && msg.cardData" class="bg-amber-50 border border-amber-100 rounded-xl p-4 shadow-sm animate-fade-in w-full">
                    <div class="flex items-center gap-3 mb-3">
                        <div class="p-2 bg-amber-100 text-amber-700 rounded-lg">
                            <lucide-icon name="trending-up" class="w-5 h-5"></lucide-icon>
                        </div>
                        <h4 class="text-sm font-bold text-amber-900">ML Prediction</h4>
                    </div>
                    <div class="grid grid-cols-3 gap-3 text-center">
                        <div>
                            <div class="text-2xl font-bold text-amber-900">{{ msg.cardData.approvalLikelihood || 0 }}%</div>
                            <div class="text-[10px] text-amber-600 uppercase font-bold">Approval</div>
                        </div>
                        <div>
                            <div class="text-2xl font-bold text-amber-900">{{ msg.cardData.timelineDays || 0 }}d</div>
                            <div class="text-[10px] text-amber-600 uppercase font-bold">Timeline</div>
                        </div>
                        <div>
                            <div class="text-sm font-bold text-amber-900">{{ msg.cardData.bottleneckDept || '-' }}</div>
                            <div class="text-[10px] text-amber-600 uppercase font-bold">Bottleneck</div>
                        </div>
                    </div>
                </div>

            </div>
         </div>

         <!-- Thinking Indicator -->
         <div *ngIf="isThinking" class="flex gap-4 animate-pulse">
             <div class="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center">
                 <lucide-icon name="loader-2" class="w-3 h-3 text-indigo-600 animate-spin"></lucide-icon>
             </div>
             <div class="text-xs text-gray-400 flex items-center gap-2 py-2">
                 <span>{{ thinkingMessage }}</span>
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

      <!-- Agent Activity Strip -->
      <div *ngIf="getActiveAgentsList().length > 0" class="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center gap-2 overflow-x-auto">
         <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex-none">Agents:</span>
         <div *ngFor="let a of getActiveAgentsList()" class="flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium border flex-none"
              [ngClass]="a.status === 'running' ? 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse' : a.status === 'done' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'">
            <lucide-icon [name]="a.icon" class="w-3 h-3"></lucide-icon>
            {{ a.name }}
            <lucide-icon *ngIf="a.status === 'running'" name="loader-2" class="w-3 h-3 animate-spin"></lucide-icon>
            <lucide-icon *ngIf="a.status === 'done'" name="check" class="w-3 h-3"></lucide-icon>
         </div>
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
             <button (click)="onComplete.emit(routingPayload)" class="px-4 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-green-700 flex items-center gap-2 transition-colors">
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
export class OrchestratorChatComponent implements OnInit, AfterViewChecked, OnDestroy {
    @Output() onComplete = new EventEmitter<any>();
    @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

    private difyService = inject(DifyService);
    private activitySub?: Subscription;
    private agentChangeSub?: Subscription;

    userInput = '';
    isThinking = false;
    thinkingMessage = 'Processing request...';
    isDraftReady = false;
    showToast = false;
    messages: ChatMessage[] = [];
    nextAgent: AgentIdentity | null = null;
    showGenerateButton = false;
    routingPayload: any = null;

    // 13-AGENT REGISTRY (data-driven from AGENT_REGISTRY)
    readonly AGENTS: Record<string, AgentIdentity> = {};
    activeAgents: Map<string, 'idle' | 'running' | 'done' | 'error'> = new Map();

    currentAgent: AgentIdentity;

    constructor() {
        // Build agent identity map from AGENT_REGISTRY
        for (const agent of AGENT_REGISTRY) {
            this.AGENTS[agent.id] = {
                id: agent.id,
                name: agent.name,
                role: agent.description,
                color: agent.color,
                icon: agent.icon
            };
            this.activeAgents.set(agent.id, 'idle');
        }
        this.currentAgent = this.AGENTS['MASTER_COO'];
    }

    ngOnInit() {
        this.startConversation();

        // Subscribe to real-time agent activity updates
        this.activitySub = this.difyService.getAgentActivity().subscribe(update => {
            this.activeAgents.set(update.agentId, update.status);
        });

        // Subscribe to agent change events — update the UI label when routing happens
        this.agentChangeSub = this.difyService.getAgentChanges().subscribe(change => {
            const newAgent = this.AGENTS[change.toAgent];
            if (newAgent) {
                this.currentAgent = newAgent;
            }
        });
    }

    ngAfterViewChecked() {
        this.scrollToBottom();
    }

    ngOnDestroy() {
        this.activitySub?.unsubscribe();
        this.agentChangeSub?.unsubscribe();
    }

    startConversation() {
        this.difyService.reset();
        // Push initial greeting via DifyService — starts with MASTER_COO
        this.isThinking = true;
        this.difyService.sendMessage('', {}, 'MASTER_COO').subscribe(res => {
            this.messages.push({
                role: 'agent',
                content: res.answer,
                timestamp: new Date(),
                agentIdentity: this.AGENTS['MASTER_COO']
            });
            this.isThinking = false;
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
        this.messages.push({ role: 'user', content, timestamp: new Date() });
        this.userInput = '';
        this.isThinking = true;
        this.thinkingMessage = `${this.currentAgent?.name || 'Agent'} processing...`;

        // Send to the currently active agent (resolved by DifyService)
        // DifyService.activeAgentId tracks which agent we're talking to,
        // and each agent has its own conversation_id in the Map.
        this.difyService.sendMessage(content).subscribe({
            next: (res) => {
                this.handleDifyResponse(res);
            },
            error: () => {
                const currentId = this.difyService.activeAgentId;
                this.messages.push({
                    role: 'agent',
                    content: 'Sorry, I encountered an error processing your request.',
                    timestamp: new Date(),
                    agentIdentity: this.AGENTS[currentId] || this.AGENTS['MASTER_COO']
                });
                this.isThinking = false;
            }
        });
    }

    private handleDifyResponse(res: DifyAgentResponse) {
        const agentId = res.metadata?.agent_id || this.difyService.activeAgentId;
        const identity = this.AGENTS[agentId] || this.AGENTS['MASTER_COO'];
        const action = res.metadata?.agent_action;

        // Let DifyService handle routing logic (ROUTE_DOMAIN, DELEGATE_AGENT, etc.)
        let routing: { shouldSwitch: boolean; targetAgent?: string; action: AgentAction } | null = null;
        if (res.metadata) {
            routing = this.difyService.processAgentRouting(res.metadata);
        }

        // Determine card type from agent_action metadata
        let cardType: ChatMessage['cardType'] = undefined;
        let cardData: any = undefined;

        if (action === 'SHOW_CLASSIFICATION' && res.metadata?.payload) {
            cardType = 'CLASSIFICATION';
            cardData = res.metadata.payload;
        } else if (action === 'HARD_STOP' || action === 'STOP_PROCESS') {
            cardType = 'HARD_STOP';
            cardData = res.metadata?.payload;
        } else if (action === 'SHOW_PREDICTION' && res.metadata?.payload) {
            cardType = 'PREDICTION';
            cardData = res.metadata.payload;
        } else if (action === 'DELEGATE_AGENT' && res.metadata?.payload) {
            cardType = 'DELEGATION';
            cardData = res.metadata.payload;
        } else if (action === 'FINALIZE_DRAFT') {
            this.finishDraft(res.metadata?.payload);
        }

        this.messages.push({
            role: 'agent',
            content: res.answer,
            timestamp: new Date(),
            agentIdentity: identity,
            cardType,
            cardData,
            agentAction: action as AgentAction
        });

        // ─── AUTO-GREETING: When agent switches, auto-send greeting to new agent ───
        // This fires the new agent's introduction so the user doesn't have to type.
        if (routing?.shouldSwitch && routing.targetAgent) {
            const targetId = routing.targetAgent;
            const targetAgent = this.AGENTS[targetId];
            const intent = res.metadata?.payload?.intent
                || res.metadata?.payload?.data?.intent
                || '';

            // Build context message that carries the user's original intent
            const contextMsg = intent
                ? `The user wants to: ${intent}. Please introduce yourself and guide them.`
                : '';

            // Keep thinking indicator active with updated agent name
            this.isThinking = true;
            this.thinkingMessage = `Connecting to ${targetAgent?.name || targetId}...`;

            // Update currentAgent immediately so UI label reflects the new agent
            if (targetAgent) {
                this.currentAgent = targetAgent;
            }

            this.difyService.sendMessage(contextMsg, {}, targetId).subscribe({
                next: (greeting) => {
                    const greetIdentity = this.AGENTS[targetId] || this.AGENTS['MASTER_COO'];
                    this.messages.push({
                        role: 'agent',
                        content: greeting.answer,
                        timestamp: new Date(),
                        agentIdentity: greetIdentity
                    });
                    this.isThinking = false;
                },
                error: () => {
                    // Even on error, show a fallback greeting so user knows what happened
                    this.messages.push({
                        role: 'agent',
                        content: `You're now connected to **${targetAgent?.name || targetId}**. How can I help you?`,
                        timestamp: new Date(),
                        agentIdentity: targetAgent || this.AGENTS['MASTER_COO']
                    });
                    this.isThinking = false;
                }
            });
        } else {
            this.isThinking = false;
        }
    }

    private finishDraft(payload?: any) {
        this.isDraftReady = true;
        this.showToast = true;

        this.routingPayload = payload || {
            title: 'NPA Draft',
            npaType: 'Variation',
            riskLevel: 'MEDIUM',
            isCrossBorder: false,
            description: 'Auto-generated NPA draft from agent analysis.',
            notional: 0,
            jurisdictions: ['Singapore'],
            requiredSignOffs: payload?.mandatorySignOffs || ['Finance', 'Credit', 'Ops'],
            submittedBy: 'Current User',
            submittedDate: new Date()
        };

        // If Ideation sent target_agent, route back to Orchestrator
        if (payload?.target_agent) {
            this.difyService.returnToPreviousAgent('finalize_draft');
        }

        this.showGenerateButton = true;
        setTimeout(() => { this.showToast = false; }, 5000);
    }

    generateWorkItem() {
        this.onComplete.emit(this.routingPayload);
    }

    resetChat() {
        this.messages = [];
        this.currentAgent = this.AGENTS['MASTER_COO'];
        this.isDraftReady = false;
        this.showGenerateButton = false;
        this.activeAgents.forEach((_, key) => this.activeAgents.set(key, 'idle'));
        this.startConversation();
    }

    /** Get agents that are currently active (running/done) for display */
    getActiveAgentsList(): { id: string; name: string; icon: string; status: string }[] {
        return Array.from(this.activeAgents.entries())
            .filter(([_, status]) => status !== 'idle')
            .map(([id, status]) => {
                const agent = this.AGENTS[id];
                return { id, name: agent?.name || id, icon: agent?.icon || 'bot', status };
            });
    }

    private scrollToBottom(): void {
        try {
            this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
        } catch (err) { }
    }
}
