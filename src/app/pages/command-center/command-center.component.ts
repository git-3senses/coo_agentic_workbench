import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

@Component({
    selector: 'app-command-center',
    standalone: true,
    imports: [CommonModule, LucideAngularModule, RouterLink],
    template: `
    <div class="min-h-full flex flex-col items-center justify-center px-8 bg-white text-gray-900 relative overflow-hidden h-full">
      
      <!-- Animated DBS Blobs Background -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        
        <!-- Red Blob (Top Left) -->
        <div class="absolute top-0 -left-4 w-96 h-96 bg-[#FF3E3E] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
        
        <!-- Blue Blob (Top Right) -->
        <div class="absolute top-0 -right-4 w-96 h-96 bg-[#0077CC] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
        
        <!-- Gold Blob (Bottom Center/Left) -->
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
          <p class="text-xl text-gray-500 font-normal mb-16 text-center max-w-2xl">
            Orchestrating complex operations across Trading & Markets with intelligent, task-aware agents.
          </p>

          <!-- Cards Grid -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
            
            <!-- Functional Agents Card -->
            <div class="bg-white/60 backdrop-blur-xl rounded-xl flex flex-col shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 overflow-hidden border border-white/50 group">
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
                    <div class="border-t border-gray-100/50 flex items-center justify-between px-8 py-5 cursor-not-allowed opacity-40">
                         <span class="text-sm font-semibold text-gray-700">My Dashboard</span>
                         <span class="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">Soon</span>
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

          <!-- Footer Status -->
          <div class="mt-16 text-xs text-gray-400 font-mono">
             System Status: <span class="text-green-600">● Online</span> • Dify API: <span class="text-green-600">● Connected</span> • v0.1.0-alpha
          </div>
      </div>
    </div>
  `,
    styles: []
})
export class CommandCenterComponent { }
