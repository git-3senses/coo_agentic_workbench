import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedIconsModule } from '../../../shared/icons/shared-icons.module';
import { RiskAssessment, RiskLayer } from '../../../lib/agent-interfaces';

@Component({
    selector: 'app-risk-assessment-result',
    standalone: true,
    imports: [CommonModule, SharedIconsModule],
    template: `
    <div class="space-y-5 relative" *ngIf="result">

      <!-- Hard Stop Overlay Banner -->
      <div *ngIf="result.hardStop"
           class="absolute inset-0 z-10 bg-red-600/95 rounded-xl flex flex-col items-center justify-center text-white p-8">
        <lucide-icon name="shield-alert" class="w-12 h-12 mb-3"></lucide-icon>
        <p class="text-2xl font-bold mb-2">HARD STOP</p>
        <p class="text-sm text-red-100 text-center max-w-md">
          {{ result.hardStopReason || 'This product has failed critical risk checks and cannot proceed.' }}
        </p>
      </div>

      <!-- Overall Risk Score Gauge -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <lucide-icon name="shield" class="w-4 h-4 text-slate-400"></lucide-icon>
            Overall Risk Score
          </h3>
          <span class="text-2xl font-bold"
                [ngClass]="{
                  'text-green-600': result.overallScore <= 30,
                  'text-amber-600': result.overallScore > 30 && result.overallScore <= 60,
                  'text-red-600': result.overallScore > 60
                }">
            {{ result.overallScore }}/100
          </span>
        </div>
        <div class="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
          <div class="h-full rounded-full transition-all duration-700"
               [ngClass]="{
                 'bg-green-500': result.overallScore <= 30,
                 'bg-amber-500': result.overallScore > 30 && result.overallScore <= 60,
                 'bg-red-500': result.overallScore > 60
               }"
               [style.width.%]="result.overallScore">
          </div>
        </div>
      </div>

      <!-- 4 Risk Layers Cascade -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Risk Cascade: Internal Policy &rarr; Regulatory &rarr; Sanctions &rarr; Dynamic
        </h4>
        <div class="space-y-3">
          <div *ngFor="let layer of result.layers; let i = index">
            <!-- Layer Card -->
            <div class="rounded-lg border overflow-hidden transition-all"
                 [ngClass]="getLayerBorderClass(layer.status)">
              <!-- Layer Header -->
              <div class="flex items-center justify-between px-4 py-3 cursor-pointer"
                   [ngClass]="getLayerBgClass(layer.status)"
                   (click)="toggleLayer(i)">
                <div class="flex items-center gap-3">
                  <!-- Cascade connector -->
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-mono text-slate-400 w-4 text-center">{{ i + 1 }}</span>
                    <lucide-icon [name]="getStatusIcon(layer.status)"
                                 class="w-5 h-5"
                                 [ngClass]="getStatusIconColor(layer.status)">
                    </lucide-icon>
                  </div>
                  <span class="font-semibold text-sm text-slate-800">{{ layer.name }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs font-bold uppercase px-2 py-0.5 rounded-full"
                        [ngClass]="getStatusBadgeClass(layer.status)">
                    {{ layer.status }}
                  </span>
                  <lucide-icon [name]="expandedLayers[i] ? 'chevron-up' : 'chevron-down'"
                               class="w-4 h-4 text-slate-400">
                  </lucide-icon>
                </div>
              </div>

              <!-- Layer Details (expanded) -->
              <div *ngIf="expandedLayers[i]"
                   class="px-4 py-3 bg-white border-t border-slate-100">
                <p class="text-sm text-slate-600 mb-3">{{ layer.details }}</p>
                <div class="space-y-2">
                  <div *ngFor="let check of layer.checks"
                       class="flex items-center justify-between py-1.5 px-3 rounded-md"
                       [ngClass]="{
                         'bg-green-50': check.status === 'PASS',
                         'bg-red-50': check.status === 'FAIL',
                         'bg-amber-50': check.status === 'WARNING'
                       }">
                    <div class="flex items-center gap-2">
                      <lucide-icon [name]="getStatusIcon(check.status)"
                                   class="w-4 h-4"
                                   [ngClass]="getStatusIconColor(check.status)">
                      </lucide-icon>
                      <span class="text-sm font-medium text-slate-700">{{ check.name }}</span>
                    </div>
                    <span class="text-xs text-slate-500">{{ check.detail }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Prerequisites Checklist -->
      <div *ngIf="result.prerequisites.length > 0"
           class="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          <lucide-icon name="list-checks" class="w-3.5 h-3.5 inline-block mr-1 -mt-0.5"></lucide-icon>
          Prerequisites
        </h4>
        <div class="space-y-2">
          <div *ngFor="let prereq of result.prerequisites"
               class="flex items-center gap-3 py-1.5">
            <lucide-icon [name]="prereq.status === 'PASS' ? 'check-circle-2' : 'x-circle'"
                         class="w-4 h-4"
                         [ngClass]="{
                           'text-green-500': prereq.status === 'PASS',
                           'text-red-500': prereq.status === 'FAIL'
                         }">
            </lucide-icon>
            <span class="text-sm text-slate-700">{{ prereq.name }}</span>
            <span class="text-xs text-slate-400 ml-auto px-2 py-0.5 rounded bg-slate-50 border border-slate-100">
              {{ prereq.category }}
            </span>
          </div>
        </div>
      </div>
    </div>
  `
})
export class RiskAssessmentResultComponent {
    @Input() result!: RiskAssessment;

    expandedLayers: boolean[] = [false, false, false, false];

    toggleLayer(index: number): void {
        this.expandedLayers[index] = !this.expandedLayers[index];
    }

    getStatusIcon(status: string): string {
        switch (status) {
            case 'PASS': return 'check-circle-2';
            case 'FAIL': return 'x-circle';
            case 'WARNING': return 'alert-triangle';
            default: return 'circle';
        }
    }

    getStatusIconColor(status: string): string {
        switch (status) {
            case 'PASS': return 'text-green-500';
            case 'FAIL': return 'text-red-500';
            case 'WARNING': return 'text-amber-500';
            default: return 'text-slate-400';
        }
    }

    getLayerBorderClass(status: string): string {
        switch (status) {
            case 'PASS': return 'border-green-200';
            case 'FAIL': return 'border-red-200';
            case 'WARNING': return 'border-amber-200';
            default: return 'border-slate-200';
        }
    }

    getLayerBgClass(status: string): string {
        switch (status) {
            case 'PASS': return 'bg-green-50/50';
            case 'FAIL': return 'bg-red-50/50';
            case 'WARNING': return 'bg-amber-50/50';
            default: return 'bg-slate-50';
        }
    }

    getStatusBadgeClass(status: string): string {
        switch (status) {
            case 'PASS': return 'bg-green-100 text-green-700';
            case 'FAIL': return 'bg-red-100 text-red-700';
            case 'WARNING': return 'bg-amber-100 text-amber-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    }
}
