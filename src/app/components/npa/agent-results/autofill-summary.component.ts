import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedIconsModule } from '../../../shared/icons/shared-icons.module';
import { AutoFillSummary } from '../../../lib/agent-interfaces';

@Component({
    selector: 'app-autofill-summary',
    standalone: true,
    imports: [CommonModule, SharedIconsModule],
    template: `
    <div class="space-y-5" *ngIf="result">

      <!-- Top Row: Donut Chart + Stats -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div class="grid grid-cols-2 gap-6">

          <!-- Coverage Donut (inline SVG) -->
          <div class="flex flex-col items-center">
            <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Field Coverage
            </h4>
            <div class="relative w-36 h-36">
              <svg class="w-36 h-36 -rotate-90" viewBox="0 0 100 100">
                <!-- AUTO segment (green) -->
                <circle cx="50" cy="50" r="40" fill="none"
                        stroke="#22c55e" stroke-width="10"
                        [attr.stroke-dasharray]="getSegmentDash(autoPercent)"
                        stroke-dashoffset="0"
                        class="transition-all duration-700" />
                <!-- ADAPTED segment (yellow) -->
                <circle cx="50" cy="50" r="40" fill="none"
                        stroke="#eab308" stroke-width="10"
                        [attr.stroke-dasharray]="getSegmentDash(adaptedPercent)"
                        [attr.stroke-dashoffset]="getSegmentOffset(autoPercent)"
                        class="transition-all duration-700" />
                <!-- MANUAL segment (red) -->
                <circle cx="50" cy="50" r="40" fill="none"
                        stroke="#ef4444" stroke-width="10"
                        [attr.stroke-dasharray]="getSegmentDash(manualPercent)"
                        [attr.stroke-dashoffset]="getSegmentOffset(autoPercent + adaptedPercent)"
                        class="transition-all duration-700" />
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <span class="text-2xl font-bold text-slate-800">
                  {{ result.coveragePct }}%
                </span>
                <span class="text-[10px] text-slate-400 uppercase tracking-wider">Coverage</span>
              </div>
            </div>
            <!-- Legend -->
            <div class="flex items-center gap-4 mt-3 text-xs">
              <span class="flex items-center gap-1">
                <span class="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                Auto
              </span>
              <span class="flex items-center gap-1">
                <span class="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
                Adapted
              </span>
              <span class="flex items-center gap-1">
                <span class="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                Manual
              </span>
            </div>
          </div>

          <!-- Stats Panel -->
          <div class="flex flex-col justify-center space-y-4">
            <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
              <lucide-icon name="file-check" class="w-5 h-5 text-green-500"></lucide-icon>
              <div>
                <p class="text-xs text-slate-400">Fields Filled</p>
                <p class="text-lg font-bold text-slate-800">
                  {{ result.fieldsFilled }}
                  <span class="text-sm font-normal text-slate-400">/ {{ result.totalFields }}</span>
                </p>
              </div>
            </div>
            <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
              <lucide-icon name="clock" class="w-5 h-5 text-blue-500"></lucide-icon>
              <div>
                <p class="text-xs text-slate-400">Time Saved</p>
                <p class="text-lg font-bold text-slate-800">
                  {{ result.timeSavedMinutes }}
                  <span class="text-sm font-normal text-slate-400">minutes</span>
                </p>
              </div>
            </div>
            <div class="grid grid-cols-3 gap-2 text-center">
              <div class="p-2 rounded-lg bg-green-50 border border-green-100">
                <p class="text-lg font-bold text-green-700">{{ result.fieldsFilled }}</p>
                <p class="text-[10px] text-green-600 uppercase">Auto</p>
              </div>
              <div class="p-2 rounded-lg bg-yellow-50 border border-yellow-100">
                <p class="text-lg font-bold text-yellow-700">{{ result.fieldsAdapted }}</p>
                <p class="text-[10px] text-yellow-600 uppercase">Adapted</p>
              </div>
              <div class="p-2 rounded-lg bg-red-50 border border-red-100">
                <p class="text-lg font-bold text-red-700">{{ result.fieldsManual }}</p>
                <p class="text-[10px] text-red-600 uppercase">Manual</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- Field Lineage Badges -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          <lucide-icon name="layers" class="w-3.5 h-3.5 inline-block mr-1 -mt-0.5"></lucide-icon>
          Field Lineage
        </h4>
        <div class="flex flex-wrap gap-2">
          <div *ngFor="let field of result.fields"
               class="group relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border cursor-default"
               [ngClass]="getLineageBadgeClass(field.lineage)">
            <lucide-icon [name]="getLineageIcon(field.lineage)" class="w-3 h-3"></lucide-icon>
            {{ field.fieldName }}
            <!-- Tooltip on hover -->
            <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 bg-slate-800 text-white text-[10px] rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
              <span *ngIf="field.source" class="block">Source: {{ field.source }}</span>
              <span *ngIf="field.confidence" class="block">Confidence: {{ (field.confidence! * 100).toFixed(0) }}%</span>
              <span class="block">Value: {{ field.value }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AutofillSummaryComponent {
    @Input() result!: AutoFillSummary;

    get circumference(): number {
        return 2 * Math.PI * 40;
    }

    get autoPercent(): number {
        if (!this.result) return 0;
        return (this.result.fieldsFilled / this.result.totalFields) * 100;
    }

    get adaptedPercent(): number {
        if (!this.result) return 0;
        return (this.result.fieldsAdapted / this.result.totalFields) * 100;
    }

    get manualPercent(): number {
        if (!this.result) return 0;
        return (this.result.fieldsManual / this.result.totalFields) * 100;
    }

    getSegmentDash(percent: number): string {
        const segLen = (percent / 100) * this.circumference;
        return `${segLen} ${this.circumference}`;
    }

    getSegmentOffset(precedingPercent: number): string {
        const offset = -(precedingPercent / 100) * this.circumference;
        return `${offset}`;
    }

    getLineageBadgeClass(lineage: string): string {
        switch (lineage) {
            case 'AUTO': return 'bg-green-50 text-green-700 border-green-200';
            case 'ADAPTED': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
            case 'MANUAL': return 'bg-red-50 text-red-700 border-red-200';
            default: return 'bg-slate-50 text-slate-700 border-slate-200';
        }
    }

    getLineageIcon(lineage: string): string {
        switch (lineage) {
            case 'AUTO': return 'zap';
            case 'ADAPTED': return 'edit-2';
            case 'MANUAL': return 'pen-tool';
            default: return 'circle';
        }
    }
}
