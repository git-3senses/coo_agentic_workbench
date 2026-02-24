import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ActivatedRoute, Router } from '@angular/router';

import { ChatInterfaceComponent } from '../../components/npa/chat-interface/chat-interface.component';
import { NpaDashboardComponent } from '../../components/npa/dashboard/npa-dashboard.component';
import { NpaDetailComponent } from './npa-detail/npa-detail.component';
import { AgentGovernanceService } from '../../services/agent-governance.service';
import { LayoutService } from '../../services/layout.service';
import { NpaService } from '../../services/npa.service';
import { DifyService } from '../../services/dify/dify.service';

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
    <div *ngIf="viewMode === 'IDEATION'" class="h-[calc(100vh-64px)] w-full border-t border-slate-200 bg-white">
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
   private npaService = inject(NpaService);
   private difyService = inject(DifyService);

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
            this.npaContext = { npaId: params['npaId'] || params['projectId'] || null };
            // Go to detail view without auto-opening the editor overlay
            this.viewMode = 'WORK_ITEM';
            this.autoOpenEditor = false;
            this.layoutService.setSidebarVisible(false);
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
      this.layoutService.setSidebarVisible(false); // Hide main sidenav in chat mode
   }

   goToDraft() {
      // MODE 2: Draft-First (Template)
      // User goes straight to the Editor. GovernanceService is available via "Check" button.
      this.viewMode = 'WORK_ITEM';
      this.autoOpenEditor = true;
      this.layoutService.setSidebarVisible(false); // Hide main sidenav in work item mode
   }

   goToDraftWithData(payload: any) {
      console.log('[NPAAgent] Transitioning to Draft with payload:', payload);

      // Transition from Chat -> Draft with pre-filled data
      if (payload?.npaId) {
         // Existing NPA (from CTA card)
         this.npaContext = payload;
         this.viewMode = 'WORK_ITEM';
         this.autoOpenEditor = false;
         this.layoutService.setSidebarVisible(false);
      } else {
         // New NPA from Ideation session
         const createData = {
            title: payload.product_name || payload.title || 'Untitled NPA',
            description: payload.product_description || payload.description || 'Draft created from ideation.',
            npa_type: payload.npa_type || 'STANDARD'
         };

         this.npaService.create(createData).subscribe({
            next: (res) => {
               const newId = res.id;
               console.log(`[NPAAgent] Created new NPA: ${newId}`);

               // Prepare any extra initial data (classification, etc)
               // Extract all data from payload to populate initial Product Attributes
               const excludeKeys = ['data', 'target_agent', 'uiRoute', 'projectId', 'intent', 'project_id', 'npaId', 'id', 'title', 'description', 'npa_type'];
               const formData: any[] = [];
               const sourceData = { ...(payload.data || {}), ...payload };

               for (const [key, value] of Object.entries(sourceData)) {
                  if (excludeKeys.includes(key) || value === null || value === undefined || value === '') continue;
                  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                     formData.push({
                        field_key: key,
                        field_value: String(value),
                        lineage: 'AUTO'
                     });
                  } else if (Array.isArray(value)) {
                     formData.push({
                        field_key: key,
                        field_value: value.join(', '),
                        lineage: 'AUTO'
                     });
                  }
               }

               // Ensure minimum fields are present
               if (!formData.find(f => f.field_key === 'risk_level')) {
                  formData.push({ field_key: 'risk_level', field_value: payload.risk_level || 'MEDIUM', lineage: 'AUTO' });
               }
               if (!formData.find(f => f.field_key === 'is_cross_border')) {
                  formData.push({ field_key: 'is_cross_border', field_value: payload.is_cross_border ? 'true' : 'false', lineage: 'AUTO' });
               }

               const updatePayload = { formData };

               this.npaService.update(newId, updatePayload).subscribe({
                  next: () => {
                     console.log(`[NPAAgent] Initial data persisted for ${newId}`);
                     // Persist classification now that we have a project_id.
                     // (Workflow may write via MCP tools when project_id is provided.)
                     const classifierInputs: Record<string, any> = {
                        agent_id: 'CLASSIFIER',
                        product_description: payload.product_description || payload.description || '',
                        product_category: payload.product_category || payload.product_type || payload.npa_type || '',
                        underlying_asset: payload.underlying_asset || payload.underlying || '',
                        notional_amount: payload.notional_amount || payload.notional || '',
                        currency: payload.currency || 'USD',
                        customer_segment: payload.customer_segment || payload.target_market || '',
                        booking_location: payload.booking_location || payload.location || 'Singapore',
                        counterparty_location: payload.counterparty_location || '',
                        is_cross_border: payload.is_cross_border || false,
                        project_id: newId
                     };
                     this.difyService.runWorkflow('CLASSIFIER', classifierInputs).subscribe({
                        next: () => console.log(`[NPAAgent] Classification workflow executed for ${newId}`),
                        error: (err) => console.warn('[NPAAgent] Classification workflow failed:', err)
                     });
                     this.npaContext = { id: newId, npaId: newId, ...payload };
                     this.viewMode = 'WORK_ITEM';
                     this.autoOpenEditor = true; // Open the draft builder immediately
                     this.layoutService.setSidebarVisible(false);
                  },
                  error: (err) => {
                     console.warn('[NPAAgent] Failed to persist initial data:', err);
                     // Proceed anyway
                     this.npaContext = { id: newId, npaId: newId, ...payload };
                     this.viewMode = 'WORK_ITEM';
                     this.autoOpenEditor = true;
                     this.layoutService.setSidebarVisible(false);
                  }
               });
            },
            error: (err) => {
               console.error('[NPAAgent] Failed to create NPA:', err);
               alert('Failed to create NPA record. Please try again.');
            }
         });
      }
   }

   goToDetail(npaId: string) {
      // Set context + view directly (avoids URL param mismatch)
      this.npaContext = { npaId };
      this.viewMode = 'WORK_ITEM';
      this.autoOpenEditor = false;
      this.layoutService.setSidebarVisible(false);
   }

   ngOnDestroy() {
      // Ensure sidebar returns if component destroyed (nav away)
      this.layoutService.setSidebarVisible(true);
      this.layoutService.setSidebarState(false); // Expand back
   }
}
