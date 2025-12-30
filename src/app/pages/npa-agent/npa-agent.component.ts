import { Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

import { ChatInterfaceComponent } from '../../components/npa/chat-interface/chat-interface.component';
import { NpaDashboardComponent } from '../../components/npa/dashboard/npa-dashboard.component';
import { NpaDetailComponent } from './npa-detail/npa-detail.component';
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
            (navigateToDraft)="goToDraft()">
        </app-npa-dashboard>
    </div>

    <!-- VIEW 2: Chat Interface (Unified Template/Agent) -->
    <div *ngIf="viewMode === 'IDEATION'" class="h-[calc(100vh-64px)] w-full border-t border-gray-200 bg-white">
       <!-- Chat Interface handles its own back button and logic -->
       <app-chat-interface 
           (onBack)="goToDashboard()"
           (onComplete)="goToDraft()">
       </app-chat-interface>
    </div>

    <!-- VIEW 3: Work Item Shell (Replaced with Detail Component) -->
    <div *ngIf="viewMode === 'WORK_ITEM'" class="h-full w-full">
        <app-npa-detail (onBack)="goToDashboard()"></app-npa-detail>
    </div>
   `
})
export class NPAAgentComponent implements OnDestroy {
   private layoutService = inject(LayoutService);
   viewMode: 'DASHBOARD' | 'IDEATION' | 'WORK_ITEM' = 'DASHBOARD';

   constructor() {
      console.log('NPAAgentComponent Initialized. viewMode:', this.viewMode);
   }

   goToDashboard() {
      this.viewMode = 'DASHBOARD';
      this.layoutService.setSidebarVisible(true);
   }

   goToCreate() {
      this.viewMode = 'IDEATION';
      this.layoutService.setSidebarVisible(true);
      this.layoutService.setSidebarState(true); // Collapse
   }

   goToDraft() {
      this.viewMode = 'WORK_ITEM';
      this.layoutService.setSidebarVisible(true);
      this.layoutService.setSidebarState(true); // Collapse
   }

   ngOnDestroy() {
      // Ensure sidebar returns if component destroyed (nav away)
      this.layoutService.setSidebarVisible(true);
      this.layoutService.setSidebarState(false); // Expand back
   }
}
