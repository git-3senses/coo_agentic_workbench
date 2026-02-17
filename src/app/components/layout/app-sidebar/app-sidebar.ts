import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SharedIconsModule } from '../../../shared/icons/shared-icons.module';
import { LayoutService } from '../../../services/layout.service';

@Component({
    selector: 'app-app-sidebar',
    standalone: true,
    imports: [CommonModule, RouterLink, RouterLinkActive, SharedIconsModule],
    template: `
    <aside class="flex flex-col h-full bg-[#f9f9f9] text-[#4b5563] text-[13px] font-medium tracking-tight select-none overflow-hidden transition-all duration-300 border-r border-border/40 relative z-30"
           [class.items-center]="isCollapsed()">

       <!-- Collapsed: empty strip (hamburger is in top-bar) -->
       <div *ngIf="isCollapsed()" class="flex-1"></div>

       <!-- Navigation Area (expanded only) -->
       <nav *ngIf="!isCollapsed()" class="flex-1 py-4 space-y-6 overflow-y-auto overflow-x-hidden scrollbar-hide w-full px-3">


          <!-- Section: My Workspace -->
          <div>
            <h3 *ngIf="!isCollapsed()" class="px-3 mb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider truncate">My Workspace</h3>
            <div class="space-y-0.5">
                <!-- Dashboard / Overview -->
                <a routerLink="/" class="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-black/5 transition-colors text-black" [class.justify-center]="isCollapsed()" routerLinkActive="bg-black/5 font-semibold">
                   <lucide-icon name="layout-dashboard" class="w-4 h-4 flex-none"></lucide-icon>
                   <span *ngIf="!isCollapsed()" class="truncate">Overview</span>
                </a>

                <!-- Inbox (Action Required) -->
                <a routerLink="/workspace/inbox" routerLinkActive="bg-black/5 font-semibold text-black" class="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-black/5 transition-colors" [class.justify-center]="isCollapsed()">
                   <lucide-icon name="inbox" class="w-4 h-4 flex-none text-indigo-600"></lucide-icon>
                   <span *ngIf="!isCollapsed()" class="truncate">My Inbox</span>
                   <span *ngIf="!isCollapsed()" class="ml-auto bg-indigo-100 text-indigo-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">3</span>
                </a>

                <!-- Drafts -->
                <a routerLink="/workspace/drafts" routerLinkActive="bg-black/5 font-semibold text-black" class="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-black/5 transition-colors" [class.justify-center]="isCollapsed()">
                   <lucide-icon name="file-edit" class="w-4 h-4 flex-none text-gray-500"></lucide-icon>
                   <span *ngIf="!isCollapsed()" class="truncate">Drafts</span>
                </a>

                <!-- Watchlist -->
                <a routerLink="/workspace/watchlist" routerLinkActive="bg-black/5 font-semibold text-black" class="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-black/5 transition-colors" [class.justify-center]="isCollapsed()">
                   <lucide-icon name="eye" class="w-4 h-4 flex-none text-gray-500"></lucide-icon>
                   <span *ngIf="!isCollapsed()" class="truncate">Watchlist</span>
                </a>
            </div>
          </div>

          <!-- Section: COO Functions -->
          <div>
            <h3 *ngIf="!isCollapsed()" class="px-3 mb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider truncate">COO Functions</h3>
            <div class="space-y-0.5">
                <a class="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-black/5 transition-colors" [class.justify-center]="isCollapsed()">
                    <lucide-icon name="headphones" class="w-4 h-4 flex-none"></lucide-icon>
                    <span *ngIf="!isCollapsed()" class="truncate">Desk Support</span>
                </a>
                <a routerLink="/functions/npa" routerLinkActive="bg-black/5 font-semibold text-black" class="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-black/5 transition-colors" [class.justify-center]="isCollapsed()">
                    <lucide-icon name="file-check" class="w-4 h-4 flex-none"></lucide-icon>
                    <span *ngIf="!isCollapsed()" class="truncate">New Product Approval</span>
                </a>
                <a class="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-black/5 transition-colors" [class.justify-center]="isCollapsed()">
                    <lucide-icon name="users" class="w-4 h-4 flex-none"></lucide-icon>
                    <span *ngIf="!isCollapsed()" class="truncate">DCE Client Services</span>
                </a>
                <a class="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-black/5 transition-colors" [class.justify-center]="isCollapsed()">
                    <lucide-icon name="shield-alert" class="w-4 h-4 flex-none"></lucide-icon>
                    <span *ngIf="!isCollapsed()" class="truncate">Operation Risk</span>
                </a>
                <a class="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-black/5 transition-colors" [class.justify-center]="isCollapsed()">
                     <lucide-icon name="presentation" class="w-4 h-4 flex-none"></lucide-icon>
                    <span *ngIf="!isCollapsed()" class="truncate">Strategic PM</span>
                </a>
                <a class="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-black/5 transition-colors" [class.justify-center]="isCollapsed()">
                    <lucide-icon name="briefcase" class="w-4 h-4 flex-none"></lucide-icon>
                    <span *ngIf="!isCollapsed()" class="truncate">Business Leads</span>
                </a>
                <a class="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-black/5 transition-colors" [class.justify-center]="isCollapsed()">
                    <lucide-icon name="bar-chart-3" class="w-4 h-4 flex-none"></lucide-icon>
                    <span *ngIf="!isCollapsed()" class="truncate">Business Analysis</span>
                </a>
            </div>
          </div>
          
           <!-- Section: Functional Agents -->
          <div>
            <h3 *ngIf="!isCollapsed()" class="px-3 mb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider truncate">Functional Agents</h3>
             <div class="space-y-0.5">
                 <a class="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-black/5 transition-colors" [class.justify-center]="isCollapsed()">
                    <lucide-icon name="headphones" class="w-4 h-4 flex-none text-blue-500"></lucide-icon>
                    <span *ngIf="!isCollapsed()" class="truncate">Desk Support Agent</span>
                 </a>
                 <a routerLink="/agents/npa" routerLinkActive="bg-black/5 font-semibold text-black" class="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-black/5 transition-colors" [class.justify-center]="isCollapsed()">
                    <lucide-icon name="file-check" class="w-4 h-4 flex-none text-blue-500"></lucide-icon>
                    <span *ngIf="!isCollapsed()" class="truncate">NPA Agent</span>
                 </a>
                 <a class="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-black/5 transition-colors" [class.justify-center]="isCollapsed()">
                    <lucide-icon name="users" class="w-4 h-4 flex-none text-blue-500"></lucide-icon>
                    <span *ngIf="!isCollapsed()" class="truncate">DCE Agent</span>
                 </a>
                  <a class="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-black/5 transition-colors" [class.justify-center]="isCollapsed()">
                    <lucide-icon name="shield-alert" class="w-4 h-4 flex-none text-blue-500"></lucide-icon>
                    <span *ngIf="!isCollapsed()" class="truncate">ORM Agent</span>
                 </a>
                  <a class="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-black/5 transition-colors" [class.justify-center]="isCollapsed()">
                    <lucide-icon name="target" class="w-4 h-4 flex-none text-blue-500"></lucide-icon>
                    <span *ngIf="!isCollapsed()" class="truncate">Strategic PM Agent</span>
                 </a>
                  <a class="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-black/5 transition-colors" [class.justify-center]="isCollapsed()">
                    <lucide-icon name="trending-up" class="w-4 h-4 flex-none text-blue-500"></lucide-icon>
                    <span *ngIf="!isCollapsed()" class="truncate">Biz Analysis Agent</span>
                 </a>
             </div>
          </div>

          <!-- Section: Utility Agents -->
           <div>
             <h3 *ngIf="!isCollapsed()" class="px-3 mb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider truncate">Utility Agents</h3>
             <div class="space-y-0.5">
                 <a class="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-black/5 transition-colors" [class.justify-center]="isCollapsed()">
                    <lucide-icon name="file-text" class="w-4 h-4 flex-none text-purple-500"></lucide-icon>
                    <span *ngIf="!isCollapsed()" class="truncate">Doc Processing</span>
                 </a>
                 <a class="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-black/5 transition-colors" [class.justify-center]="isCollapsed()">
                    <lucide-icon name="database" class="w-4 h-4 flex-none text-purple-500"></lucide-icon>
                    <span *ngIf="!isCollapsed()" class="truncate">Knowledge Base (RAG)</span>
                 </a>
                 <a class="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-black/5 transition-colors" [class.justify-center]="isCollapsed()">
                    <lucide-icon name="search" class="w-4 h-4 flex-none text-purple-500"></lucide-icon>
                    <span *ngIf="!isCollapsed()" class="truncate">Data Retrieval</span>
                 </a>
                 <a class="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-black/5 transition-colors" [class.justify-center]="isCollapsed()">
                    <lucide-icon name="workflow" class="w-4 h-4 flex-none text-purple-500"></lucide-icon>
                    <span *ngIf="!isCollapsed()" class="truncate">State Manager</span>
                 </a>
                 <a class="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-black/5 transition-colors" [class.justify-center]="isCollapsed()">
                    <lucide-icon name="bell" class="w-4 h-4 flex-none text-purple-500"></lucide-icon>
                    <span *ngIf="!isCollapsed()" class="truncate">Notification Utility</span>
                 </a>
                 <a class="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-black/5 transition-colors" [class.justify-center]="isCollapsed()">
                    <lucide-icon name="bar-chart-3" class="w-4 h-4 flex-none text-purple-500"></lucide-icon>
                    <span *ngIf="!isCollapsed()" class="truncate">Analytics & Reporting</span>
                 </a>
                 <a class="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-black/5 transition-colors" [class.justify-center]="isCollapsed()">
                    <lucide-icon name="scroll-text" class="w-4 h-4 flex-none text-purple-500"></lucide-icon>
                    <span *ngIf="!isCollapsed()" class="truncate">Policy/SOP Agent</span>
                 </a>
             </div>
          </div>

          <!-- Section: Knowledge & Evidence -->
          <div>
            <h3 *ngIf="!isCollapsed()" class="px-3 mb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider truncate">Knowledge & Evidence</h3>
            <div class="space-y-0.5">
                <a class="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-black/5 transition-colors" [class.justify-center]="isCollapsed()">
                    <lucide-icon name="book-open" class="w-4 h-4 flex-none"></lucide-icon>
                    <span *ngIf="!isCollapsed()" class="truncate">Knowledge Base</span>
                </a>
                <a class="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-black/5 transition-colors" [class.justify-center]="isCollapsed()">
                    <lucide-icon name="library" class="w-4 h-4 flex-none"></lucide-icon>
                    <span *ngIf="!isCollapsed()" class="truncate">Evidence Library</span>
                </a>
                 <a class="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-black/5 transition-colors" [class.justify-center]="isCollapsed()">
                    <lucide-icon name="file-stack" class="w-4 h-4 flex-none"></lucide-icon>
                    <span *ngIf="!isCollapsed()" class="truncate">Precedents & Patterns</span>
                </a>
            </div>
          </div>
          
          <!-- Section: Reporting -->
          <div>
            <h3 *ngIf="!isCollapsed()" class="px-3 mb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider truncate">Reporting & Governance</h3>
            <div class="space-y-0.5">
                <a class="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-black/5 transition-colors" [class.justify-center]="isCollapsed()">
                    <lucide-icon name="layout-dashboard" class="w-4 h-4 flex-none"></lucide-icon>
                    <span *ngIf="!isCollapsed()" class="truncate">Dashboards</span>
                </a>
                <a class="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-black/5 transition-colors" [class.justify-center]="isCollapsed()">
                    <lucide-icon name="pie-chart" class="w-4 h-4 flex-none"></lucide-icon>
                    <span *ngIf="!isCollapsed()" class="truncate">Management Packs</span>
                </a>
            </div>
          </div>

          <!-- Section: Audit Control -->
          <div>
            <h3 *ngIf="!isCollapsed()" class="px-3 mb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider truncate">Audit Control</h3>
            <div class="space-y-0.5">
                <a class="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-black/5 transition-colors" [class.justify-center]="isCollapsed()">
                    <lucide-icon name="scroll-text" class="w-4 h-4 flex-none"></lucide-icon>
                    <span *ngIf="!isCollapsed()" class="truncate">Audit Trails</span>
                </a>
                 <a class="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-black/5 transition-colors" [class.justify-center]="isCollapsed()">
                    <lucide-icon name="clipboard-check" class="w-4 h-4 flex-none"></lucide-icon>
                    <span *ngIf="!isCollapsed()" class="truncate">Control Evidence</span>
                </a>
                 <a class="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-black/5 transition-colors" [class.justify-center]="isCollapsed()">
                    <lucide-icon name="terminal" class="w-4 h-4 flex-none"></lucide-icon>
                    <span *ngIf="!isCollapsed()" class="truncate">Agent Action Logs</span>
                </a>
                 <a class="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-black/5 transition-colors" [class.justify-center]="isCollapsed()">
                    <lucide-icon name="check-circle-2" class="w-4 h-4 flex-none"></lucide-icon>
                    <span *ngIf="!isCollapsed()" class="truncate">Maker Checker Validation</span>
                </a>
                <a class="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-black/5 transition-colors" [class.justify-center]="isCollapsed()">
                    <lucide-icon name="file-text" class="w-4 h-4 flex-none"></lucide-icon>
                    <span *ngIf="!isCollapsed()" class="truncate">Regulatory Submissions</span>
                </a>
                <a class="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-black/5 transition-colors" [class.justify-center]="isCollapsed()">
                    <lucide-icon name="search" class="w-4 h-4 flex-none"></lucide-icon>
                    <span *ngIf="!isCollapsed()" class="truncate">Audit Reviews & Findings</span>
                </a>
            </div>
          </div>

           <!-- Section: Admin -->
          <div>
            <h3 *ngIf="!isCollapsed()" class="px-3 mb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider truncate">Admin & Configuration</h3>
            <div class="space-y-0.5">
                <a class="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-black/5 transition-colors" [class.justify-center]="isCollapsed()">
                    <lucide-icon name="settings" class="w-4 h-4 flex-none"></lucide-icon>
                    <span *ngIf="!isCollapsed()" class="truncate">Workflow Configuration</span>
                </a>
                 <a class="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-black/5 transition-colors" [class.justify-center]="isCollapsed()">
                    <lucide-icon name="shield" class="w-4 h-4 flex-none"></lucide-icon>
                    <span *ngIf="!isCollapsed()" class="truncate">Roles & Entitlements</span>
                </a>
                 <a class="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-black/5 transition-colors" [class.justify-center]="isCollapsed()">
                    <lucide-icon name="bot" class="w-4 h-4 flex-none"></lucide-icon>
                    <span *ngIf="!isCollapsed()" class="truncate">Agent Configuration</span>
                </a>
                 <a class="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-black/5 transition-colors" [class.justify-center]="isCollapsed()">
                    <lucide-icon name="wrench" class="w-4 h-4 flex-none"></lucide-icon>
                    <span *ngIf="!isCollapsed()" class="truncate">System Integrations</span>
                </a>
            </div>
          </div>
          
          <!-- Section: Help & Adoption -->
          <div>
            <h3 *ngIf="!isCollapsed()" class="px-3 mb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider truncate">Help & Adoption</h3>
            <div class="space-y-0.5">
                <a class="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-black/5 transition-colors" [class.justify-center]="isCollapsed()">
                    <lucide-icon name="book-open" class="w-4 h-4 flex-none"></lucide-icon>
                    <span *ngIf="!isCollapsed()" class="truncate">How to Work with Agents</span>
                </a>
                 <a class="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-black/5 transition-colors" [class.justify-center]="isCollapsed()">
                    <lucide-icon name="info" class="w-4 h-4 flex-none"></lucide-icon>
                    <span *ngIf="!isCollapsed()" class="truncate">Explainibility Guide</span>
                </a>
                 <a class="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-black/5 transition-colors" [class.justify-center]="isCollapsed()">
                    <lucide-icon name="check-circle" class="w-4 h-4 flex-none"></lucide-icon>
                    <span *ngIf="!isCollapsed()" class="truncate">Best Practices</span>
                </a>
                 <a class="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-black/5 transition-colors" [class.justify-center]="isCollapsed()">
                    <lucide-icon name="help-circle" class="w-4 h-4 flex-none"></lucide-icon>
                    <span *ngIf="!isCollapsed()" class="truncate">FAQs</span>
                </a>
            </div>
          </div>
          
          <div class="h-12"><!-- Spacer --></div>

       </nav>

       <!-- Footer (expanded only) -->
       <div *ngIf="!isCollapsed()" class="p-3 border-t border-gray-200/60 w-full flex flex-col gap-2 z-40 sticky bottom-0 bg-[#f9f9f9]">
           <a class="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-black/5 transition-colors font-medium text-black" title="User Profile">
               <div class="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px]">V</div>
               <span class="truncate">Vikramaditya</span>
           </a>
       </div>
    </aside>
  `,
    styles: [`
    :host {
        display: block;
        height: 100%;
    }
  `]
})
export class AppSidebarComponent {
    private layoutService = inject(LayoutService);
    isCollapsed = this.layoutService.isSidebarCollapsed;

    toggleSidebar() {
        this.layoutService.toggleSidebar();
    }
}
