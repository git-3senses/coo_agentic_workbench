import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ActivatedRoute, Router } from '@angular/router';

import { ChatInterfaceComponent } from '../../components/npa/chat-interface/chat-interface.component';
import { NpaDashboardComponent } from '../../components/npa/dashboard/npa-dashboard.component';
import { NpaDetailComponent } from './npa-detail/npa-detail.component';
import { AgentGovernanceService } from '../../services/agent-governance.service';
import { LayoutService } from '../../services/layout.service';

@Component({
   selector: 'app-npa-agent',
   standalone: true,
   imports: [
      CommonModule,
      LucideAngularModule,
      ChatInterfaceComponent,
      NpaDashboardComponent,
      NpaDetailComponent
   ],
   template: `
    <!-- VIEW 1: Dashboard (Landing Page) -->
    <div *ngIf="viewMode === 'DASHBOARD'" class="h-full w-full overflow-y-auto scrollbar-hide">
        <app-npa-dashboard
            (navigateToCreate)="goToCreate()"
            (navigateToDraft)="goToDraft()"
            (navigateToDetail)="goToDetail($event)">
        </app-npa-dashboard>
    </div>

    <!-- VIEW 2: Chat Interface (Agent-First Mode) -->
    <div *ngIf="viewMode === 'IDEATION'" class="h-[calc(100vh-64px)] w-full border-t border-gray-200 bg-white">
       <app-chat-interface
           (onBack)="goToDashboard()"
           (onComplete)="goToDraftWithData($event)">
       </app-chat-interface>
    </div>

    <!-- VIEW 3: Work Item / Template (Draft-First Mode) -->
    <div *ngIf="viewMode === 'WORK_ITEM'" class="h-full w-full">
        <app-npa-detail
            [npaContext]="npaContext"
            [autoOpenEditor]="autoOpenEditor"
            (onBack)="goToDashboard()">
        </app-npa-detail>
    </div>
   `
})
export class NPAAgentComponent implements OnInit, OnDestroy {
   private layoutService = inject(LayoutService);
   private route = inject(ActivatedRoute);
   private router = inject(Router);
   private governanceService = inject(AgentGovernanceService);

   viewMode: 'DASHBOARD' | 'IDEATION' | 'WORK_ITEM' = 'DASHBOARD';

   autoOpenEditor = false;
   npaContext: any = null;

   constructor() {
      console.log('NPAAgentComponent Initialized. viewMode:', this.viewMode);
   }

   ngOnInit() {
      this.route.queryParams.subscribe(params => {
         if (params['mode'] === 'create') {
            this.goToCreate();
         } else if (params['mode'] === 'detail') {
            this.npaContext = { npaId: params['npaId'] || null };
            this.goToDraft();
         }
      });
   }

   goToDashboard() {
      this.viewMode = 'DASHBOARD';
      this.autoOpenEditor = false;
      this.npaContext = null;
      this.layoutService.setSidebarVisible(true);
   }

   goToCreate() {
      // MODE 1: Agent-First (Conversational)
      // Directly enter the Chat Interface. The Agent will handle Readiness checks.
      this.viewMode = 'IDEATION';
      this.layoutService.setSidebarVisible(true);
      this.layoutService.setSidebarState(true); // Collapse sidebar
   }

   goToDraft() {
      // MODE 2: Draft-First (Template)
      // User goes straight to the Editor. GovernanceService is available via "Check" button.
      this.viewMode = 'WORK_ITEM';
      this.autoOpenEditor = true;
      this.layoutService.setSidebarVisible(true);
      this.layoutService.setSidebarState(true); // Collapse sidebar
   }

   goToDraftWithData(payload: any) {
      // Transition from Chat -> Draft with pre-filled data
      this.npaContext = payload;
      this.goToDraft();
   }

   goToDetail(npaId: string) {
      this.router.navigate([], {
         relativeTo: this.route,
         queryParams: { mode: 'detail', projectId: npaId },
         queryParamsHandling: 'merge'
      });
   }

   ngOnDestroy() {
      // Ensure sidebar returns if component destroyed (nav away)
      this.layoutService.setSidebarVisible(true);
      this.layoutService.setSidebarState(false); // Expand back
   }
}
