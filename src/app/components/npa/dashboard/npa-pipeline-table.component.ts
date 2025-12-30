import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { RouterModule } from '@angular/router';

export interface NPAPipelineItem {
    id: string;
    name: string;
    productType: string;
    businessUnit: string;
    currentStage: string;
    status: 'on-track' | 'at-risk' | 'blocked' | 'completed';
    daysInStage: number;
    owner: string;
    lastUpdated: string;
}

@Component({
    selector: 'app-npa-pipeline-table',
    standalone: true,
    imports: [CommonModule, LucideAngularModule, RouterModule],
    template: `
    <div class="rounded-xl border border-border/50 bg-card text-card-foreground shadow-sm">
      <div class="p-6 pb-3">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold flex items-center gap-2">
            <lucide-icon name="file-text" class="w-5 h-5 text-muted-foreground"></lucide-icon>
            NPA Pipeline
          </h3>
          <button class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-3">
            View All NPAs
          </button>
        </div>
      </div>
      <div class="p-6 pt-0">
        <div class="w-full overflow-auto">
          <table class="w-full caption-bottom text-sm">
            <thead class="[&_tr]:border-b">
              <tr class="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th class="h-10 px-2 text-left align-middle font-medium text-muted-foreground">NPA ID</th>
                <th class="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Product Name</th>
                <th class="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Type</th>
                <th class="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Business Unit</th>
                <th class="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Current Stage</th>
                <th class="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Status</th>
                <th class="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Days in Stage</th>
                <th class="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Owner</th>
                <th class="h-10 px-2 text-left align-middle font-medium text-muted-foreground w-[50px]"></th>
              </tr>
            </thead>
            <tbody class="[&_tr:last-child]:border-0">
              <tr *ngFor="let item of mockPipelineData" 
                  class="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted group">
                <td class="p-2 align-middle font-medium">
                  <a (click)="onViewDetail.emit(item.id)" class="text-primary hover:underline cursor-pointer">
                    {{ item.id }}
                  </a>
                </td>
                <td class="p-2 align-middle">{{ item.name }}</td>
                <td class="p-2 align-middle">
                  <span class="text-xs text-muted-foreground">{{ item.productType }}</span>
                </td>
                <td class="p-2 align-middle">
                  <span class="text-xs">{{ item.businessUnit }}</span>
                </td>
                <td class="p-2 align-middle">
                  <div class="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground border-border/50">
                    {{ item.currentStage }}
                  </div>
                </td>
                <td class="p-2 align-middle">
                   <div [ngClass]="getStatusClasses(item.status)" class="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 gap-1 border-transparent">
                      <lucide-icon [name]="getStatusIcon(item.status)" class="w-3 h-3"></lucide-icon>
                      {{ getStatusLabel(item.status) }}
                   </div>
                </td>
                <td class="p-2 align-middle">
                  <span [ngClass]="getDaysClasses(item.daysInStage)">
                     {{ item.daysInStage }}d
                  </span>
                </td>
                <td class="p-2 align-middle">
                  <span class="text-sm text-muted-foreground">{{ item.owner }}</span>
                </td>
                <td class="p-2 align-middle">
                   <button (click)="onViewDetail.emit(item.id)" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-8 w-8 opacity-0 group-hover:opacity-100">
                      <lucide-icon name="arrow-right" class="w-4 h-4"></lucide-icon>
                   </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class NpaPipelineTableComponent {
    @Output() onViewDetail = new EventEmitter<string>();

    mockPipelineData: NPAPipelineItem[] = [
        {
            id: 'NPA210921',
            name: 'Simple Option on Crypto Loan',
            productType: 'Structured Product',
            businessUnit: 'Treasury & Markets',
            currentStage: 'Sign-Off',
            status: 'at-risk',
            daysInStage: 5,
            owner: 'Michael Chen',
            lastUpdated: '2024-01-15 10:32'
        },
        {
            id: 'NPA210918',
            name: 'Green Bond Framework',
            productType: 'Fixed Income',
            businessUnit: 'Corporate Banking',
            currentStage: 'Review',
            status: 'on-track',
            daysInStage: 2,
            owner: 'Sarah Wong',
            lastUpdated: '2024-01-15 09:15'
        },
        {
            id: 'NPA210915',
            name: 'FX Accumulator - USD/SGD',
            productType: 'FX Derivatives',
            businessUnit: 'Treasury & Markets',
            currentStage: 'Preparing for Launch',
            status: 'on-track',
            daysInStage: 1,
            owner: 'James Liu',
            lastUpdated: '2024-01-15 11:00'
        },
        {
            id: 'NPA210910',
            name: 'Multi-Currency Deposit',
            productType: 'Deposit',
            businessUnit: 'Consumer Banking',
            currentStage: 'Launched',
            status: 'completed',
            daysInStage: 0,
            owner: 'Amanda Lee',
            lastUpdated: '2024-01-14 16:30'
        },
        {
            id: 'NPA210905',
            name: 'ESG-Linked Trade Finance',
            productType: 'Trade Finance',
            businessUnit: 'Institutional Banking',
            currentStage: 'Sign-Off',
            status: 'blocked',
            daysInStage: 8,
            owner: 'Robert Tan',
            lastUpdated: '2024-01-13 14:00'
        }
    ];

    getStatusClasses(status: string): string {
        const config: Record<string, string> = {
            'on-track': 'bg-[hsl(var(--status-completed-bg))] text-[hsl(var(--status-completed))]',
            'at-risk': 'bg-amber-500/10 text-amber-600',
            'blocked': 'bg-[hsl(var(--status-exception-bg))] text-[hsl(var(--status-exception))]',
            'completed': 'bg-[hsl(var(--status-completed-bg))] text-[hsl(var(--status-completed))]'
        };
        return config[status] || '';
    }

    getStatusIcon(status: string): string {
        const config: Record<string, string> = {
            'on-track': 'check-circle-2',
            'at-risk': 'alert-triangle',
            'blocked': 'alert-triangle',
            'completed': 'check-circle-2'
        };
        return config[status] || 'circle';
    }

    getStatusLabel(status: string): string {
        const config: Record<string, string> = {
            'on-track': 'On Track',
            'at-risk': 'At Risk',
            'blocked': 'Blocked',
            'completed': 'Completed'
        };
        return config[status] || status;
    }

    getDaysClasses(days: number): string {
        if (days > 7) return 'text-[hsl(var(--status-exception))] font-medium';
        if (days > 5) return 'text-amber-600 font-medium';
        return 'text-sm';
    }
}
