
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedIconsModule } from '../../shared/icons/shared-icons.module';
import { FormsModule } from '@angular/forms';

interface ApprovalItem {
   id: string;
   title: string;
   description: string;
   submittedBy: string;
   submittedDate: Date;
   status: 'PENDING' | 'APPROVED' | 'REJECTED';
   riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
   type: 'NPA' | 'DCE' | 'Limit Breach';
}

@Component({
   selector: 'app-approval-dashboard',
   standalone: true,
   imports: [CommonModule, FormsModule, SharedIconsModule],
   // Actually, let's use the module with pick in imports to be safe and explicit.
   // imports: [CommonModule, LucideAngularModule.pick({ CheckSquare, FileBox, Users, AlertTriangle, User, Shield, Check, X, CheckCircle, XCircle }), FormsModule],
   // The above line caused issues? No, the file corruption caused issues.
   // I will use the explicit pick.
   template: `
    <div class="h-full flex flex-col bg-gray-50 font-sans text-gray-900">
      
      <!-- HEADER -->
      <div class="flex-none bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between shadow-sm z-10">
        <div>
           <h1 class="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
              <lucide-icon name="check-square" class="w-6 h-6 text-indigo-600"></lucide-icon>
              Pending Approvals
           </h1>
           <p class="text-sm text-gray-500 mt-1">Manage and sign-off on pending items requiring your attention.</p>
        </div>
        <div class="flex items-center gap-3">
           <div class="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold border border-indigo-100">
              {{ pendingCount }} Pending
           </div>
        </div>
      </div>

      <!-- MAIN CONTENT -->
      <div class="flex-1 overflow-auto p-8">
        <div class="max-w-5xl mx-auto space-y-6">

            <!-- LIST -->
            <div *ngFor="let item of items" class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group">
                <div class="p-6 flex items-start gap-6">
                   
                   <!-- ICON / TYPE -->
                   <div class="flex-none">
                      <div class="w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold shadow-sm"
                           [ngClass]="{
                             'bg-blue-50 text-blue-600': item.type === 'NPA',
                             'bg-purple-50 text-purple-600': item.type === 'DCE',
                             'bg-amber-50 text-amber-600': item.type === 'Limit Breach'
                           }">
                           <lucide-icon *ngIf="item.type === 'NPA'" name="file-box" class="w-6 h-6"></lucide-icon>
                           <lucide-icon *ngIf="item.type === 'DCE'" name="users" class="w-6 h-6"></lucide-icon>
                           <lucide-icon *ngIf="item.type === 'Limit Breach'" name="alert-triangle" class="w-6 h-6"></lucide-icon>
                      </div>
                   </div>

                   <!-- CONTENT -->
                   <div class="flex-1 min-w-0">
                      <div class="flex items-center justify-between mb-1">
                          <span class="text-xs font-bold uppercase tracking-wider text-gray-400">{{ item.type }}</span>
                          <span class="text-xs text-gray-400">{{ item.submittedDate | date:'mediumDate' }}</span>
                      </div>
                      <h3 class="text-lg font-bold text-gray-900 mb-1 leading-tight group-hover:text-indigo-600 transition-colors cursor-pointer">
                          {{ item.title }}
                      </h3>
                      <p class="text-sm text-gray-600 mb-4 line-clamp-2">{{ item.description }}</p>
                      
                      <div class="flex items-center gap-4 text-xs">
                          <div class="flex items-center gap-1.5 text-gray-500 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                              <lucide-icon name="user" class="w-3.5 h-3.5"></lucide-icon>
                              <span>{{ item.submittedBy }}</span>
                          </div>
                          <div class="flex items-center gap-1.5 px-2 py-1 rounded border"
                               [ngClass]="{
                                 'bg-green-50 text-green-700 border-green-100': item.riskLevel === 'LOW',
                                 'bg-yellow-50 text-yellow-700 border-yellow-100': item.riskLevel === 'MEDIUM',
                                 'bg-red-50 text-red-700 border-red-100': item.riskLevel === 'HIGH'
                               }">
                              <lucide-icon name="shield" class="w-3.5 h-3.5"></lucide-icon>
                              <span>{{ item.riskLevel }} Risk</span>
                          </div>
                      </div>
                   </div>

                   <!-- ACTIONS -->
                   <div class="flex-none flex flex-col gap-2 pt-1" *ngIf="item.status === 'PENDING'">
                       <button (click)="approve(item)" class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg shadow-sm w-32 transition-all flex items-center justify-center gap-2">
                           <lucide-icon name="check" class="w-4 h-4"></lucide-icon> Approve
                       </button>
                       <button (click)="reject(item)" class="px-4 py-2 bg-white hover:bg-gray-50 text-red-600 border border-red-200 hover:border-red-300 text-sm font-semibold rounded-lg shadow-sm w-32 transition-all flex items-center justify-center gap-2">
                           <lucide-icon name="x" class="w-4 h-4"></lucide-icon> Reject
                       </button>
                       <button class="px-4 py-2 text-gray-500 hover:text-gray-700 text-sm font-medium w-32 flex items-center justify-center gap-2">
                           View Details
                       </button>
                   </div>

                   <!-- STATUS BADGE (IF NOT PENDING) -->
                   <div class="flex-none flex flex-col items-end justify-center h-full" *ngIf="item.status !== 'PENDING'">
                       <div class="px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
                            [ngClass]="item.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'">
                           <lucide-icon [name]="item.status === 'APPROVED' ? 'check-circle' : 'x-circle'" class="w-5 h-5"></lucide-icon>
                           {{ item.status }}
                       </div>
                   </div>

                </div>
            </div>

            <!-- EMPTY STATE -->
            <div *ngIf="items.length === 0" class="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                 <lucide-icon name="check-circle" class="w-12 h-12 text-gray-300 mx-auto mb-4"></lucide-icon>
                 <h3 class="text-lg font-medium text-gray-900">All Caught Up!</h3>
                 <p class="text-gray-500">You have no pending approvals at this time.</p>
            </div>

        </div>
      </div>
    </div>
    `,
   styles: []
})
export class ApprovalDashboardComponent {

   items: ApprovalItem[] = [
      {
         id: 'NPA-2025-042',
         title: 'FX Put Option GBP/USD - Product Variation',
         description: 'Requesting approval for a new FX structure for Acme Corp. Classified as Variation (Medium Risk). Cross-border booking required in London entity.',
         submittedBy: 'Sarah Lim',
         submittedDate: new Date('2026-02-09T09:42:00'),
         status: 'PENDING',
         riskLevel: 'MEDIUM',
         type: 'NPA'
      },
      {
         id: 'DCE-2025-081',
         title: 'Client Onboarding - Omega Hedge Fund',
         description: 'High-risk client onboarding request awaiting MLR clearance due to complex ownership structure.',
         submittedBy: 'James Chen',
         submittedDate: new Date('2026-02-08T14:15:00'),
         status: 'PENDING',
         riskLevel: 'HIGH',
         type: 'DCE'
      },
      {
         id: 'LB-2025-012',
         title: 'VaR Limit Exception - Equities Desk',
         description: 'Temporary limit breach exception request for overnight position due to market volatility.',
         submittedBy: 'Alex Rivera',
         submittedDate: new Date('2026-02-09T08:30:00'),
         status: 'PENDING',
         riskLevel: 'LOW',
         type: 'Limit Breach'
      }
   ];

   get pendingCount() {
      return this.items.filter(i => i.status === 'PENDING').length;
   }

   approve(item: ApprovalItem) {
      if (confirm(`Approve ${item.title}?`)) {
         item.status = 'APPROVED';
      }
   }

   reject(item: ApprovalItem) {
      if (confirm(`Reject ${item.title}?`)) {
         item.status = 'REJECTED';
      }
   }
}
