import { Component, inject, ViewChild, ElementRef, AfterViewChecked, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { MarkdownModule } from 'ngx-markdown';
import { UserService } from '../../services/user.service';
import { LayoutService } from '../../services/layout.service';
import { DifyService, DifyAgentResponse } from '../../services/dify/dify.service';
import { AGENT_REGISTRY, AgentAction } from '../../lib/agent-interfaces';
import { Subscription } from 'rxjs';

// ─── Local Interfaces ──────────────────────────────────────────

interface ChatMessage {
    role: 'user' | 'agent';
    content: string;
    timestamp: Date;
    agentIdentity?: AgentIdentity;
    cardType?: 'DOMAIN_ROUTE' | 'CLASSIFICATION' | 'RISK' | 'HARD_STOP' | 'PREDICTION' | 'INFO';
    cardData?: any;
    agentAction?: string;
}

interface AgentIdentity {
    id: string;
    name: string;
    role: string;
    color: string;
    icon: string;
}

interface GlobalTemplate {
    id: string;
    title: string;
    description: string;
    domain: string;
    icon: string;
    iconBg: string;
    prompt: string;
}

@Component({
    selector: 'app-command-center',
    standalone: true,
    imports: [CommonModule, LucideAngularModule, RouterLink, FormsModule, MarkdownModule],
    template: `
    <!-- ═══════ VIEW: LANDING (Overview + Chat Input) ═══════ -->
    <div *ngIf="viewMode === 'LANDING'" class="min-h-full flex flex-col items-center justify-center px-8 bg-white text-gray-900 relative overflow-hidden h-full">

      <!-- Animated Blobs Background -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute top-0 -left-4 w-96 h-96 bg-[#FF3E3E] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
        <div class="absolute top-0 -right-4 w-96 h-96 bg-[#0077CC] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
        <div class="absolute -bottom-32 left-20 w-96 h-96 bg-[#CC9955] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      <!-- Content Wrapper -->
      <div class="relative z-10 w-full max-w-6xl flex flex-col items-center">

          <!-- Pilot Badge -->
          <div class="mb-8 px-4 py-1.5 rounded-full border border-red-200 bg-red-50 backdrop-blur-sm text-xs font-medium text-red-600 flex items-center gap-2 shadow-sm">
            <span class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            Pilot Active: NPA Automation (Phase 0)
          </div>

          <!-- Main Hero Text -->
          <h1 class="text-6xl font-bold tracking-tight mb-4 text-center text-gray-900">
            COO Multi-Agent Workbench
          </h1>
          <p class="text-xl text-gray-500 font-normal mb-12 text-center max-w-2xl">
            Orchestrating complex operations across Trading & Markets with intelligent, task-aware agents.
          </p>

          <!-- Cards Grid -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">

            <!-- Functional Agents Card -->
            <div class="bg-white/60 backdrop-blur-xl rounded-xl flex flex-col shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 overflow-hidden border border-white/50 group"
                 [class.opacity-50]="userRole() !== 'MAKER' && userRole() !== 'ADMIN'"
                 [class.pointer-events-none]="userRole() !== 'MAKER' && userRole() !== 'ADMIN'">
                <div class="p-8 pb-4 flex-1">
                    <div class="w-14 h-14 rounded-2xl bg-red-50/80 border border-red-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                        <lucide-icon name="bot" class="w-7 h-7 text-[#FF3E3E]"></lucide-icon>
                    </div>
                    <h3 class="text-xl font-bold mb-3 text-gray-900">Functional Agents</h3>
                    <p class="text-base text-gray-500 leading-relaxed">
                        Specialized agents for Ideation, Risk, Finance, and Tech approvals.
                    </p>
                </div>
                <div class="mt-6">
                    <div class="border-t border-gray-100/50 flex items-center justify-between px-8 py-5 cursor-pointer hover:bg-red-50/30 transition-colors group/item" [routerLink]="['/agents/npa']">
                        <div class="flex items-center gap-3">
                             <div class="w-2 h-2 rounded-full bg-green-500"></div>
                             <span class="text-sm font-semibold text-gray-700">Product Ideation Agent</span>
                        </div>
                        <lucide-icon name="arrow-right" class="w-4 h-4 text-[#FF3E3E] opacity-0 -translate-x-2 group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all duration-300"></lucide-icon>
                    </div>
                     <div class="border-t border-gray-100/50 flex items-center justify-between px-8 py-5 cursor-not-allowed opacity-40">
                        <div class="flex items-center gap-3">
                             <div class="w-2 h-2 rounded-full bg-gray-300"></div>
                             <span class="text-sm font-semibold text-gray-700">Risk Control Agent</span>
                        </div>
                        <span class="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">Soon</span>
                    </div>
                </div>
            </div>

            <!-- Work Items Card -->
            <div class="bg-white/60 backdrop-blur-xl rounded-xl flex flex-col shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 overflow-hidden border border-white/50 group">
                <div class="p-8 pb-4 flex-1">
                    <div class="w-14 h-14 rounded-2xl bg-gray-50/80 border border-gray-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                        <lucide-icon name="layers" class="w-7 h-7 text-gray-800"></lucide-icon>
                    </div>
                    <h3 class="text-xl font-bold mb-3 text-gray-900">Work Items</h3>
                    <p class="text-base text-gray-500 leading-relaxed">
                        Track cross-functional workflows, approvals, and exceptions in real-time.
                    </p>
                </div>
                <div class="mt-6">
                    <div class="border-t border-gray-100/50 flex items-center justify-between px-8 py-5 cursor-pointer hover:bg-gray-50/50 transition-colors group/item" [routerLink]="['/workspace/inbox']">
                         <span class="text-sm font-semibold text-gray-700">My Dashboard</span>
                         <lucide-icon name="arrow-right" class="w-4 h-4 text-gray-500 opacity-0 -translate-x-2 group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all duration-300"></lucide-icon>
                    </div>
                    <div class="border-t border-gray-100/50 flex items-center justify-between px-8 py-5 cursor-not-allowed opacity-40">
                         <span class="text-sm font-semibold text-gray-700">Exception Queue</span>
                         <span class="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">Soon</span>
                    </div>
                </div>
            </div>

            <!-- Intelligence Card -->
            <div class="bg-white/60 backdrop-blur-xl rounded-xl flex flex-col shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 overflow-hidden border border-white/50 group">
                <div class="p-8 pb-4 flex-1">
                    <div class="w-14 h-14 rounded-2xl bg-orange-50/80 border border-orange-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                        <lucide-icon name="brain-circuit" class="w-7 h-7 text-orange-600"></lucide-icon>
                    </div>
                    <h3 class="text-xl font-bold mb-3 text-gray-900">Intelligence</h3>
                    <p class="text-base text-gray-500 leading-relaxed">
                        Centralized Knowledge Base (SOPs), Policy Engine, and Audit Trails.
                    </p>
                </div>
                 <div class="mt-6">
                    <div class="border-t border-gray-100/50 flex items-center justify-between px-8 py-5 cursor-pointer hover:bg-orange-50/50 transition-colors group/item" [routerLink]="['/knowledge/base']">
                        <span class="text-sm font-semibold text-gray-700">Knowledge Base</span>
                        <lucide-icon name="arrow-right" class="w-4 h-4 text-orange-500 opacity-0 -translate-x-2 group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all duration-300"></lucide-icon>
                    </div>
                     <div class="border-t border-gray-100/50 flex items-center justify-between px-8 py-5 cursor-not-allowed opacity-40">
                        <span class="text-sm font-semibold text-gray-700">Audit Logs</span>
                        <span class="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">Soon</span>
                    </div>
                </div>
            </div>
          </div>

          <!-- ═══ CHAT INPUT (Below Cards) ═══ -->
          <div class="mt-12 w-full max-w-3xl">
              <div class="relative flex items-center group">
                  <div class="absolute left-4 text-violet-400 group-focus-within:text-violet-600 transition-colors">
                      <lucide-icon name="brain-circuit" class="w-5 h-5"></lucide-icon>
                  </div>
                  <input type="text"
                         [(ngModel)]="landingInput"
                         (keydown.enter)="startChatFromLanding()"
                         (focus)="inputFocused = true"
                         (blur)="inputFocused = false"
                         placeholder="Ask the COO Agent — NPA, Risk, Operations, Desk Support..."
                         class="w-full bg-white/80 backdrop-blur-sm text-gray-900 text-sm rounded-2xl pl-12 pr-14 py-4 border border-gray-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 focus:outline-none transition-all placeholder:text-gray-400 shadow-lg hover:shadow-xl focus:shadow-xl">
                  <button (click)="startChatFromLanding()"
                          [disabled]="!landingInput.trim()"
                          class="absolute right-2 p-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm">
                      <lucide-icon name="send" class="w-4 h-4"></lucide-icon>
                  </button>
              </div>
              <div class="flex items-center justify-center gap-4 mt-4">
                  <button *ngFor="let hint of quickHints" (click)="startChatFromHint(hint.prompt)"
                          class="text-[11px] text-gray-400 hover:text-violet-600 font-medium px-3 py-1.5 rounded-full border border-gray-100 hover:border-violet-200 hover:bg-violet-50/50 transition-all cursor-pointer">
                      {{ hint.label }}
                  </button>
              </div>
          </div>

          <!-- Footer Status -->
          <div class="mt-10 text-xs text-gray-400 font-mono">
             System Status: <span class="text-green-600">● Online</span> • Dify API: <span class="text-green-600">● Connected</span> • v0.1.0-alpha
          </div>
      </div>
    </div>

    <!-- ═══════ VIEW: CHAT (Full-screen chat workspace) ═══════ -->
    <div *ngIf="viewMode === 'CHAT'" class="h-[calc(100vh-64px)] w-full flex flex-col bg-white">

      <!-- Chat Header -->
      <div class="h-14 flex items-center justify-between px-6 border-b border-gray-200 bg-white shadow-sm z-20 flex-none">
        <div class="flex items-center gap-4">
          <button (click)="exitChat()" class="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors">
             <lucide-icon name="arrow-left" class="w-5 h-5"></lucide-icon>
          </button>
          <div class="h-6 w-px bg-gray-200"></div>
          <div class="flex items-center gap-3">
             <div class="w-8 h-8 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center">
                 <lucide-icon name="brain-circuit" class="w-4 h-4 text-violet-600"></lucide-icon>
             </div>
             <div>
                <h2 class="text-sm font-bold text-gray-900">COO Agent</h2>
                <p class="text-[10px] font-mono" [ngClass]="activeDomainAgent ? 'text-green-600' : 'text-gray-400'">
                    {{ activeDomainAgent ? activeDomainAgent.name : 'Master Orchestrator' }}
                </p>
             </div>
          </div>
        </div>

        <!-- Mode Toggle -->
        <div class="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
           <button (click)="chatTab = 'CHAT'"
                   class="px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2"
                   [ngClass]="chatTab === 'CHAT' ? 'bg-white text-violet-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'">
               <lucide-icon name="message-square" class="w-3.5 h-3.5"></lucide-icon>
               Chat
           </button>
           <button (click)="chatTab = 'TEMPLATES'"
                   class="px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2"
                   [ngClass]="chatTab === 'TEMPLATES' ? 'bg-white text-violet-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'">
               <lucide-icon name="layout-template" class="w-3.5 h-3.5"></lucide-icon>
               Templates
           </button>
        </div>

        <div class="flex items-center gap-2">
           <button (click)="resetChat()" title="New Conversation"
                   class="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-red-600 transition-colors">
               <lucide-icon name="rotate-ccw" class="w-4 h-4"></lucide-icon>
           </button>
           <div class="h-6 w-px bg-gray-200 mx-1"></div>
           <span class="text-xs text-green-600 font-medium flex items-center gap-1.5 bg-green-50 px-2 py-1 rounded border border-green-100">
              <span class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Online
           </span>
        </div>
      </div>

      <!-- Chat Body -->
      <div class="flex-1 overflow-hidden flex flex-col">

        <!-- ═══ TAB: CHAT ═══ -->
        <div *ngIf="chatTab === 'CHAT'" class="flex-1 flex flex-col h-full">

          <!-- Messages -->
          <div class="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scroll-smooth" #scrollContainer>

             <div *ngFor="let msg of messages" class="flex gap-4 group" [ngClass]="{'flex-row-reverse': msg.role === 'user'}">
                <!-- Avatar -->
                <div class="flex-none w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm relative"
                     [ngClass]="msg.role === 'user' ? 'bg-indigo-600 text-white' : getAvatarClasses(msg.agentIdentity)">
                   <span *ngIf="msg.role === 'user'">{{ userInitial() }}</span>
                   <lucide-icon *ngIf="msg.role !== 'user'" [name]="msg.agentIdentity?.icon || 'brain-circuit'" class="w-4 h-4"></lucide-icon>
                </div>

                <!-- Bubble -->
                <div class="flex flex-col gap-2 max-w-[80%]">
                    <!-- Agent Label -->
                    <span *ngIf="msg.role === 'agent' && msg.agentIdentity" class="text-[10px] font-bold uppercase tracking-wider" [ngClass]="getAgentLabelClass(msg.agentIdentity)">
                        {{ msg.agentIdentity.name }}
                    </span>

                    <div class="rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm"
                         [ngClass]="msg.role === 'user' ? 'bg-indigo-50 border border-indigo-100 text-gray-900 rounded-tr-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'">
                       <markdown [data]="msg.content"></markdown>
                       <span class="text-[9px] opacity-40 mt-1 block font-mono">{{ msg.timestamp | date:'shortTime' }}</span>
                    </div>

                    <!-- CARD: DOMAIN ROUTING -->
                    <div *ngIf="msg.cardType === 'DOMAIN_ROUTE' && msg.cardData" class="bg-violet-50 border border-violet-100 rounded-xl p-4 shadow-sm animate-fade-in w-full">
                        <div class="flex items-center gap-2 mb-3">
                            <lucide-icon name="route" class="w-4 h-4 text-violet-600"></lucide-icon>
                            <span class="text-xs font-bold text-violet-900">Domain Identified</span>
                        </div>
                        <div class="flex items-center gap-3 p-3 bg-white rounded-lg border border-violet-200">
                            <div class="w-10 h-10 rounded-xl flex items-center justify-center" [ngClass]="msg.cardData.color">
                                <lucide-icon [name]="msg.cardData.icon" class="w-5 h-5"></lucide-icon>
                            </div>
                            <div class="flex-1">
                                <h4 class="text-sm font-bold text-gray-900">{{ msg.cardData.name }}</h4>
                                <p class="text-[10px] text-gray-500">{{ msg.cardData.description }}</p>
                            </div>
                            <lucide-icon name="check-circle" class="w-4 h-4 text-green-500"></lucide-icon>
                        </div>
                    </div>

                    <!-- CARD: CLASSIFICATION -->
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
                        <div *ngIf="msg.cardData.scores" class="space-y-2">
                            <div *ngFor="let score of msg.cardData.scores" class="flex items-center gap-2 text-xs">
                                <span class="w-24 text-slate-600 font-medium truncate">{{ score.criterion }}</span>
                                <div class="flex-1 h-1.5 bg-indigo-100 rounded-full overflow-hidden">
                                    <div class="h-full bg-indigo-500 rounded-full transition-all duration-700" [style.width.%]="(score.score / score.maxScore) * 100"></div>
                                </div>
                                <span class="font-mono text-indigo-700 w-8 text-right">{{ score.score }}/{{ score.maxScore }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- CARD: HARD STOP -->
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
                            Matched prohibited item: <strong>{{ msg.cardData.prohibitedMatch?.item || 'Unknown' }}</strong>. Process blocked.
                        </div>
                    </div>

                    <!-- CARD: PREDICTION -->
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
                 <div class="w-8 h-8 rounded-full bg-violet-50 border border-violet-200 flex items-center justify-center">
                     <lucide-icon name="loader-2" class="w-3 h-3 text-violet-600 animate-spin"></lucide-icon>
                 </div>
                 <div class="text-xs text-gray-400 flex items-center gap-2 py-2">
                     <span>{{ thinkingMessage }}</span>
                 </div>
             </div>
          </div>

          <!-- Agent Activity Strip -->
          <div *ngIf="getActiveAgentsList().length > 0" class="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center gap-2 overflow-x-auto flex-none">
             <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex-none">Agents:</span>
             <div *ngFor="let a of getActiveAgentsList()" class="flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium border flex-none"
                  [ngClass]="a.status === 'running' ? 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse' : a.status === 'done' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'">
                <lucide-icon [name]="a.icon" class="w-3 h-3"></lucide-icon>
                {{ a.name }}
                <lucide-icon *ngIf="a.status === 'running'" name="loader-2" class="w-3 h-3 animate-spin"></lucide-icon>
                <lucide-icon *ngIf="a.status === 'done'" name="check" class="w-3 h-3"></lucide-icon>
             </div>
          </div>

          <!-- Generate Work Item Button -->
          <div *ngIf="showGenerateButton" class="px-4 py-3 border-t border-indigo-100 bg-indigo-50/50 flex-none">
             <button (click)="navigateToDomain(activeDomainRoute)"
                     class="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 transform active:scale-95">
                <lucide-icon name="file-plus-2" class="w-4 h-4"></lucide-icon>
                Open in {{ activeDomainAgent?.name || 'Domain Agent' }}
             </button>
          </div>

          <!-- Chat Input -->
          <div class="p-4 bg-gray-50 border-t border-gray-200 flex-none">
             <div class="flex items-center justify-between mb-3 px-1">
                 <div class="flex items-center gap-2">
                     <span class="w-2 h-2 rounded-full animate-pulse" [ngClass]="activeDomainAgent ? 'bg-green-500' : 'bg-violet-500'"></span>
                     <span class="text-xs font-bold text-gray-500 uppercase tracking-wide">{{ activeDomainAgent ? activeDomainAgent.name : 'Master COO Orchestrator' }}</span>
                 </div>
             </div>
             <div class="relative flex items-center">
                 <input type="text"
                        [(ngModel)]="userInput"
                        (keydown.enter)="sendMessage()"
                        placeholder="Continue the conversation..."
                        class="w-full bg-white text-gray-900 text-sm rounded-lg pl-4 pr-12 py-3 border border-gray-300 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none transition-all placeholder:text-gray-400 shadow-sm"
                        [disabled]="isThinking">
                 <button (click)="sendMessage()"
                         [disabled]="!userInput.trim() || isThinking"
                         class="absolute right-2 p-1.5 rounded-md bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm">
                    <lucide-icon name="send" class="w-4 h-4"></lucide-icon>
                 </button>
             </div>
          </div>
        </div>

        <!-- ═══ TAB: TEMPLATES ═══ -->
        <div *ngIf="chatTab === 'TEMPLATES'" class="flex-1 flex flex-col h-full bg-slate-50">

          <!-- Category Filter -->
          <div class="w-full bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-3 overflow-x-auto scrollbar-hide flex-none">
             <div class="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-wider mr-2 flex-none">
                <lucide-icon name="filter" class="w-3.5 h-3.5"></lucide-icon> Domain:
             </div>
             <button *ngFor="let d of templateDomains"
                     (click)="selectedTemplateDomain = d.id"
                     class="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border flex-none"
                     [ngClass]="selectedTemplateDomain === d.id ? 'bg-violet-50 text-violet-700 border-violet-200 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'">
                 {{ d.name }}
             </button>
          </div>

          <!-- Template Grid -->
          <div class="flex-1 overflow-y-auto p-6 md:p-8">
             <div class="max-w-5xl mx-auto">
                <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    {{ getTemplateDomainName(selectedTemplateDomain) }}
                    <span class="text-gray-400 font-normal text-sm">({{ getFilteredTemplates().length }})</span>
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                   <div *ngFor="let t of getFilteredTemplates()"
                        class="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-violet-300 transition-all cursor-pointer group flex flex-col"
                        (click)="executeTemplate(t)">
                      <div class="flex items-start justify-between mb-3">
                         <div class="p-2 rounded-lg" [ngClass]="t.iconBg">
                            <lucide-icon [name]="t.icon" class="w-5 h-5"></lucide-icon>
                         </div>
                         <lucide-icon name="arrow-right" class="w-4 h-4 text-gray-300 group-hover:text-violet-500 transition-colors"></lucide-icon>
                      </div>
                      <h4 class="text-sm font-bold text-gray-900 mb-1 group-hover:text-violet-700 transition-colors">{{ t.title }}</h4>
                      <p class="text-xs text-gray-500 line-clamp-2 flex-1">{{ t.description }}</p>
                      <div class="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                          <span class="text-[10px] px-2 py-0.5 rounded-full font-medium" [ngClass]="t.iconBg">{{ t.domain }}</span>
                      </div>
                   </div>
                </div>
             </div>
          </div>
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
export class CommandCenterComponent implements OnInit, AfterViewChecked, OnDestroy {
    @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

    private userService = inject(UserService);
    private layoutService = inject(LayoutService);
    private difyService = inject(DifyService);
    private router = inject(Router);
    private activitySub?: Subscription;

    userRole = () => this.userService.currentUser().role;

    // ─── View State ─────────────────────────────────────────────
    viewMode: 'LANDING' | 'CHAT' = 'LANDING';
    chatTab: 'CHAT' | 'TEMPLATES' = 'CHAT';

    // ─── Landing State ──────────────────────────────────────────
    landingInput = '';
    inputFocused = false;

    quickHints = [
        { label: 'Create an NPA', prompt: 'I want to create a new product approval for a structured note' },
        { label: 'Risk check', prompt: 'Run a risk assessment for a new FX derivative' },
        { label: 'Search policies', prompt: 'Search the knowledge base for MAS guidelines on structured deposits' },
        { label: 'My approvals', prompt: 'Show me my pending approvals and sign-off status' },
    ];

    // ─── Chat State ─────────────────────────────────────────────
    userInput = '';
    isThinking = false;
    thinkingMessage = 'Master COO analyzing request...';
    messages: ChatMessage[] = [];
    showGenerateButton = false;
    activeDomainRoute = '';

    // Active domain agent (detected by Master COO)
    activeDomainAgent: { id: string; name: string; icon: string; color: string } | null = null;

    // Agent tracking
    readonly AGENTS: Record<string, AgentIdentity> = {};
    activeAgents: Map<string, 'idle' | 'running' | 'done' | 'error'> = new Map();

    // ─── Template State ─────────────────────────────────────────
    selectedTemplateDomain = 'ALL';
    templateDomains = [
        { id: 'ALL', name: 'All Domains' },
        { id: 'NPA', name: 'Product Approval' },
        { id: 'RISK', name: 'Risk & Compliance' },
        { id: 'OPS', name: 'Operations' },
        { id: 'KB', name: 'Knowledge & Policy' },
        { id: 'DESK', name: 'Desk Support' },
    ];

    globalTemplates: GlobalTemplate[] = [
        // NPA
        { id: 'T1', title: 'Draft New Product Concept', description: 'Generate a structured concept paper for a new financial product', domain: 'NPA', icon: 'lightbulb', iconBg: 'bg-amber-100 text-amber-600', prompt: 'I need to create a new product concept paper for a structured product' },
        { id: 'T2', title: 'Classify Existing Product', description: 'Determine NTG / Variation / Existing track for a product', domain: 'NPA', icon: 'git-branch', iconBg: 'bg-purple-100 text-purple-600', prompt: 'Classify this product: FX accumulator with knock-out barrier for institutional clients' },
        { id: 'T3', title: 'Check Prohibited Lists', description: 'Screen a product or entity against prohibited/restricted lists', domain: 'NPA', icon: 'shield-alert', iconBg: 'bg-red-100 text-red-600', prompt: 'Check if cryptocurrency-linked structured note is on the prohibited list' },
        { id: 'T4', title: 'NPA Status Lookup', description: 'Check the current status of an NPA by ID or product name', domain: 'NPA', icon: 'search', iconBg: 'bg-blue-100 text-blue-600', prompt: 'Show me the status of NPA TSG-2024-0047' },

        // Risk
        { id: 'T5', title: 'Initial Risk Assessment', description: 'Run a 4-layer risk cascade on a new product or initiative', domain: 'RISK', icon: 'shield-alert', iconBg: 'bg-red-100 text-red-600', prompt: 'Run a risk assessment for a new equity-linked structured note' },
        { id: 'T6', title: 'Regulatory Compliance Check', description: 'Verify product adherence to MAS or other regulatory guidelines', domain: 'RISK', icon: 'scale', iconBg: 'bg-slate-100 text-slate-700', prompt: 'Check if an FX option structure complies with MAS guidelines SFA Chapter 289' },

        // Operations
        { id: 'T7', title: 'Settlement Workflow', description: 'Get the end-to-end settlement process for an asset class', domain: 'OPS', icon: 'workflow', iconBg: 'bg-indigo-100 text-indigo-600', prompt: 'Explain the settlement workflow for OTC FX options in Singapore' },
        { id: 'T8', title: 'Booking System Setup', description: 'Guide for setting up a new product in booking systems', domain: 'OPS', icon: 'monitor', iconBg: 'bg-teal-100 text-teal-600', prompt: 'What are the steps to set up a new structured deposit in Murex?' },

        // Knowledge
        { id: 'T9', title: 'Search SOPs & Policies', description: 'Search the knowledge base for standard operating procedures', domain: 'KB', icon: 'book-open', iconBg: 'bg-purple-100 text-purple-600', prompt: 'Search knowledge base for NPA approval SOP for cross-border products' },
        { id: 'T10', title: 'Regulatory Guidelines', description: 'Look up specific regulatory frameworks and their implications', domain: 'KB', icon: 'scroll-text', iconBg: 'bg-fuchsia-100 text-fuchsia-600', prompt: 'What are the key MAS requirements for marketing structured products to retail investors?' },

        // Desk Support
        { id: 'T11', title: 'Desk Support Query', description: 'Get help with trading desk operational issues', domain: 'DESK', icon: 'headphones', iconBg: 'bg-blue-100 text-blue-600', prompt: 'Help me resolve a trade booking error for an FX forward' },
        { id: 'T12', title: 'System Access Request', description: 'Raise a request for system access or entitlements', domain: 'DESK', icon: 'key', iconBg: 'bg-orange-100 text-orange-600', prompt: 'I need to request Murex access for a new team member in the FX desk' },
    ];

    constructor() {
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
    }

    ngOnInit() {
        this.activitySub = this.difyService.getAgentActivity().subscribe(update => {
            this.activeAgents.set(update.agentId, update.status);
        });
    }

    ngAfterViewChecked() {
        this.scrollToBottom();
    }

    ngOnDestroy() {
        this.activitySub?.unsubscribe();
        // Restore sidebar when leaving chat
        if (this.viewMode === 'CHAT') {
            this.layoutService.setSidebarVisible(true);
            this.layoutService.setSidebarState(false);
        }
    }

    userInitial(): string {
        return this.userService.currentUser().name.charAt(0);
    }

    // ─── Landing → Chat Transition ──────────────────────────────

    startChatFromLanding() {
        if (!this.landingInput.trim()) return;
        const message = this.landingInput;
        this.landingInput = '';
        this.enterChatMode();
        this.processMessage(message);
    }

    startChatFromHint(prompt: string) {
        this.landingInput = '';
        this.enterChatMode();
        this.processMessage(prompt);
    }

    private enterChatMode() {
        this.viewMode = 'CHAT';
        this.chatTab = 'CHAT';
        this.difyService.reset();
        this.layoutService.setSidebarState(true); // Collapse sidebar
    }

    exitChat() {
        this.viewMode = 'LANDING';
        this.messages = [];
        this.activeDomainAgent = null;
        this.showGenerateButton = false;
        this.difyService.reset();
        this.activeAgents.forEach((_, key) => this.activeAgents.set(key, 'idle'));
        this.layoutService.setSidebarState(false); // Expand sidebar
    }

    // ─── Chat Logic ─────────────────────────────────────────────

    sendMessage() {
        if (!this.userInput.trim()) return;
        const content = this.userInput;
        this.userInput = '';
        this.processMessage(content);
    }

    private processMessage(content: string) {
        this.messages.push({ role: 'user', content, timestamp: new Date() });
        this.isThinking = true;

        // Use DifyService.activeAgentId — it tracks which agent is current
        const currentAgent = this.difyService.activeAgentId;
        const agentDisplay = this.AGENTS[currentAgent];
        this.thinkingMessage = agentDisplay
            ? `${agentDisplay.name} processing...`
            : 'Master COO analyzing request...';

        // sendMessage() with no agentId arg → uses difyService.activeAgentId
        // Each agent has its own conversation_id in the Map
        this.difyService.sendMessage(content).subscribe({
            next: (res) => this.handleResponse(res),
            error: () => {
                this.messages.push({
                    role: 'agent',
                    content: 'Sorry, I encountered an error. Please try again.',
                    timestamp: new Date(),
                    agentIdentity: this.AGENTS['MASTER_COO']
                });
                this.isThinking = false;
            }
        });
    }

    private handleResponse(res: DifyAgentResponse) {
        const agentId = res.metadata?.agent_id || this.difyService.activeAgentId;
        const identity = this.AGENTS[agentId] || this.AGENTS['MASTER_COO'];
        const action = res.metadata?.agent_action;

        // Let DifyService handle routing logic centrally
        let routing: ReturnType<typeof this.difyService.processAgentRouting> | null = null;
        if (res.metadata) {
            routing = this.difyService.processAgentRouting(res.metadata);
        }

        let cardType: ChatMessage['cardType'] = undefined;
        let cardData: any = undefined;

        // Domain routing detection
        if (action === 'ROUTE_DOMAIN' && res.metadata?.payload) {
            // Dify proxy nests domain info under payload.data (from [NPA_DATA] JSON).
            // Support both flat (payload.domainId) and nested (payload.data.domainId).
            const p = res.metadata.payload;
            const domainData = p.data || p; // fallback to flat if data not present

            cardType = 'DOMAIN_ROUTE';
            cardData = { ...domainData, target_agent: p.target_agent, intent: p.intent };
            // Update display state from payload
            this.activeDomainAgent = {
                id: domainData.domainId || p.domainId || 'NPA',
                name: domainData.name || p.name || 'NPA Domain Orchestrator',
                icon: domainData.icon || p.icon || 'target',
                color: domainData.color || p.color || 'bg-orange-50 text-orange-600'
            };
            // Capture the route for navigation
            const route = domainData.route || p.uiRoute || p.route;
            if (route) {
                this.activeDomainRoute = route;
            }
        } else if (action === 'DELEGATE_AGENT' && res.metadata?.payload) {
            // Agent delegation — DifyService already switched the active agent
            const targetId = res.metadata.payload.target_agent;
            const targetAgent = this.AGENTS[targetId];
            if (targetAgent) {
                this.activeDomainAgent = {
                    id: targetId,
                    name: targetAgent.name,
                    icon: targetAgent.icon,
                    color: targetAgent.color
                };
            }
            cardType = 'INFO';
            cardData = {
                title: `Delegating to ${targetAgent?.name || targetId}`,
                description: res.metadata.payload.reason || 'Switching to specialist agent'
            };
        } else if (action === 'SHOW_CLASSIFICATION' && res.metadata?.payload) {
            cardType = 'CLASSIFICATION';
            cardData = res.metadata.payload;
        } else if (action === 'HARD_STOP' || action === 'STOP_PROCESS') {
            cardType = 'HARD_STOP';
            cardData = res.metadata?.payload;
        } else if (action === 'SHOW_PREDICTION' && res.metadata?.payload) {
            cardType = 'PREDICTION';
            cardData = res.metadata.payload;
        } else if (action === 'FINALIZE_DRAFT') {
            this.showGenerateButton = true;
            this.activeDomainRoute = res.metadata?.payload?.route || '/agents/npa';
            // If the agent sent target_agent, route back to previous agent
            if (res.metadata?.payload?.target_agent) {
                this.difyService.returnToPreviousAgent('finalize_draft');
            }
        }

        this.messages.push({
            role: 'agent',
            content: res.answer,
            timestamp: new Date(),
            agentIdentity: identity,
            cardType,
            cardData,
            agentAction: action
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

            // Keep thinking indicator with updated agent label
            this.isThinking = true;
            this.thinkingMessage = `Connecting to ${targetAgent?.name || targetId}...`;

            // Update activeDomainAgent immediately so the UI label at the bottom reflects the new agent
            if (targetAgent) {
                this.activeDomainAgent = {
                    id: targetId,
                    name: targetAgent.name,
                    icon: targetAgent.icon,
                    color: targetAgent.color
                };
            }

            this.difyService.sendMessage(contextMsg, {}, targetId).subscribe({
                next: (greeting) => {
                    const greetIdentity = this.AGENTS[targetId] || this.AGENTS['MASTER_COO'];

                    // Process any metadata from the new agent's greeting
                    if (greeting.metadata) {
                        this.difyService.processAgentRouting(greeting.metadata);
                    }

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

    resetChat() {
        this.messages = [];
        this.activeDomainAgent = null;
        this.showGenerateButton = false;
        this.difyService.reset();
        this.activeAgents.forEach((_, key) => this.activeAgents.set(key, 'idle'));
    }

    navigateToDomain(route: string) {
        if (route) {
            this.layoutService.setSidebarState(false);
            this.router.navigate([route]);
        }
    }

    // ─── Template Logic ─────────────────────────────────────────

    executeTemplate(t: GlobalTemplate) {
        this.chatTab = 'CHAT';
        this.processMessage(t.prompt);
    }

    getTemplateDomainName(id: string): string {
        return this.templateDomains.find(d => d.id === id)?.name || 'All';
    }

    getFilteredTemplates(): GlobalTemplate[] {
        if (this.selectedTemplateDomain === 'ALL') return this.globalTemplates;
        return this.globalTemplates.filter(t => t.domain === this.selectedTemplateDomain);
    }

    // ─── Agent Activity ─────────────────────────────────────────

    getActiveAgentsList(): { id: string; name: string; icon: string; status: string }[] {
        return Array.from(this.activeAgents.entries())
            .filter(([_, status]) => status !== 'idle')
            .map(([id, status]) => {
                const agent = this.AGENTS[id];
                return { id, name: agent?.name || id, icon: agent?.icon || 'bot', status };
            });
    }

    getAvatarClasses(identity?: AgentIdentity): string {
        if (!identity) return 'bg-violet-50 border border-violet-200 text-violet-600';
        const parts = identity.color.split(' ');
        return `${parts[0] || 'bg-violet-50'} border border-gray-200 ${parts[1] || 'text-violet-600'}`;
    }

    getAgentLabelClass(identity?: AgentIdentity): string {
        if (!identity) return 'text-violet-600';
        return identity.color.split(' ')[1] || 'text-violet-600';
    }

    private scrollToBottom(): void {
        try {
            if (this.scrollContainer) {
                this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
            }
        } catch (err) { }
    }
}
