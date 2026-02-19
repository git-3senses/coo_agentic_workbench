import { Component, Input, OnChanges } from '@angular/core';
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
                  {{ result.fieldsFilled + result.fieldsAdapted }}
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

      <!-- Source NPA & Template Info -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-4" *ngIf="result.sourceNpa || result.templateId">
        <div class="flex items-center gap-4 flex-wrap">
          <div *ngIf="result.sourceNpa" class="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-100">
            <lucide-icon name="file-search" class="w-4 h-4 text-blue-500"></lucide-icon>
            <span class="text-xs text-blue-700">Source: <span class="font-semibold">{{ result.sourceNpa }}</span></span>
            <span *ngIf="result.sourceSimilarity" class="text-[10px] text-blue-500">({{ (result.sourceSimilarity! * 100).toFixed(0) }}% match)</span>
          </div>
          <div *ngIf="result.templateId" class="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
            <lucide-icon name="layout-template" class="w-4 h-4 text-slate-500"></lucide-icon>
            <span class="text-xs text-slate-700">Template: <span class="font-semibold">{{ result.templateId }}</span></span>
          </div>
          <div *ngIf="result.npaLiteSubtype" class="flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded-lg border border-purple-100">
            <lucide-icon name="zap" class="w-4 h-4 text-purple-500"></lucide-icon>
            <span class="text-xs text-purple-700">NPA Lite: <span class="font-semibold">{{ result.npaLiteSubtype }}</span></span>
          </div>
          <div *ngIf="result.validityMonths" class="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-100">
            <lucide-icon name="calendar" class="w-4 h-4 text-emerald-500"></lucide-icon>
            <span class="text-xs text-emerald-700">Validity: <span class="font-semibold">{{ result.validityMonths }} months</span></span>
          </div>
        </div>
      </div>

      <!-- Validation Warnings -->
      <div class="space-y-2" *ngIf="result.validationWarnings && result.validationWarnings.length > 0">
        <div *ngFor="let w of result.validationWarnings"
             class="flex items-start gap-3 p-3 rounded-lg border"
             [ngClass]="w.severity === 'HARD_STOP' ? 'bg-red-50 border-red-200' : w.severity === 'IMPORTANT' ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'">
          <lucide-icon [name]="w.severity === 'HARD_STOP' ? 'alert-octagon' : w.severity === 'IMPORTANT' ? 'alert-triangle' : 'info'"
                       class="w-4 h-4 mt-0.5 flex-shrink-0"
                       [ngClass]="w.severity === 'HARD_STOP' ? 'text-red-500' : w.severity === 'IMPORTANT' ? 'text-amber-500' : 'text-blue-500'"></lucide-icon>
          <div class="text-xs">
            <span class="font-semibold"
                  [ngClass]="w.severity === 'HARD_STOP' ? 'text-red-700' : w.severity === 'IMPORTANT' ? 'text-amber-700' : 'text-blue-700'">
              {{ w.severity }}
            </span>
            <span class="text-slate-600 ml-1">{{ w.warning }}</span>
            <span *ngIf="w.documentSection" class="text-slate-400 ml-1">({{ w.documentSection }})</span>
          </div>
        </div>
      </div>

      <!-- Notional Flags & Cross-Border -->
      <div class="grid grid-cols-2 gap-3" *ngIf="result.notionalFlags || result.crossBorderFlags">
        <!-- Notional Flags -->
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-4" *ngIf="result.notionalFlags">
          <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            <lucide-icon name="dollar-sign" class="w-3.5 h-3.5 inline-block mr-1 -mt-0.5"></lucide-icon>
            Notional Flags
          </h4>
          <div class="space-y-1.5">
            <div class="flex items-center gap-2 text-xs" *ngIf="result.notionalFlags!.roaeAnalysisNeeded">
              <span class="w-2 h-2 rounded-full bg-amber-400"></span>
              <span class="text-slate-600">ROAE Analysis Required (&gt;$20M)</span>
            </div>
            <div class="flex items-center gap-2 text-xs" *ngIf="result.notionalFlags!.financeVpRequired">
              <span class="w-2 h-2 rounded-full bg-orange-400"></span>
              <span class="text-slate-600">Finance VP Approval (&gt;$50M)</span>
            </div>
            <div class="flex items-center gap-2 text-xs" *ngIf="result.notionalFlags!.cfoApprovalRequired">
              <span class="w-2 h-2 rounded-full bg-red-400"></span>
              <span class="text-slate-600">CFO Pre-Approval (&gt;$100M)</span>
            </div>
            <div class="flex items-center gap-2 text-xs" *ngIf="result.notionalFlags!.mlrReviewRequired">
              <span class="w-2 h-2 rounded-full bg-blue-400"></span>
              <span class="text-slate-600">MLR Review Required</span>
            </div>
            <div class="text-[10px] text-slate-400 italic" *ngIf="!result.notionalFlags!.roaeAnalysisNeeded && !result.notionalFlags!.financeVpRequired && !result.notionalFlags!.cfoApprovalRequired && !result.notionalFlags!.mlrReviewRequired">
              No threshold flags triggered
            </div>
          </div>
        </div>

        <!-- Cross-Border Flags -->
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-4" *ngIf="result.crossBorderFlags">
          <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            <lucide-icon name="globe" class="w-3.5 h-3.5 inline-block mr-1 -mt-0.5"></lucide-icon>
            Cross-Border
          </h4>
          <div *ngIf="result.crossBorderFlags!.isCrossBorder; else noCrossBorder">
            <div class="flex flex-wrap gap-1.5 mb-2">
              <span *ngFor="let sop of result.crossBorderFlags!.mandatorySignoffs"
                    class="px-2 py-0.5 text-[10px] bg-orange-50 text-orange-700 border border-orange-200 rounded-md font-medium">
                {{ sop }}
              </span>
            </div>
            <div class="space-y-1" *ngIf="result.crossBorderFlags!.additionalRequirements?.length">
              <p *ngFor="let req of result.crossBorderFlags!.additionalRequirements" class="text-[10px] text-slate-500">
                + {{ req }}
              </p>
            </div>
          </div>
          <ng-template #noCrossBorder>
            <p class="text-[10px] text-slate-400 italic">Single-jurisdiction (no cross-border override)</p>
          </ng-template>
        </div>
      </div>

      <!-- Document Structure -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-4" *ngIf="result.documentStructure">
        <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          <lucide-icon name="book-open" class="w-3.5 h-3.5 inline-block mr-1 -mt-0.5"></lucide-icon>
          Document Structure
        </h4>
        <div class="grid grid-cols-3 gap-2 text-center mb-3">
          <div class="p-2 rounded-lg border"
               [ngClass]="result.documentStructure!.partAComplete ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'">
            <p class="text-xs font-semibold" [ngClass]="result.documentStructure!.partAComplete ? 'text-green-700' : 'text-red-700'">Part A</p>
            <p class="text-[10px]" [ngClass]="result.documentStructure!.partAComplete ? 'text-green-500' : 'text-red-500'">
              {{ result.documentStructure!.partAComplete ? 'Complete' : 'Incomplete' }}
            </p>
          </div>
          <div class="p-2 rounded-lg border"
               [ngClass]="result.documentStructure!.partBComplete ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'">
            <p class="text-xs font-semibold" [ngClass]="result.documentStructure!.partBComplete ? 'text-green-700' : 'text-red-700'">Part B</p>
            <p class="text-[10px]" [ngClass]="result.documentStructure!.partBComplete ? 'text-green-500' : 'text-red-500'">
              {{ result.documentStructure!.partBComplete ? 'Complete' : 'Incomplete' }}
            </p>
          </div>
          <div class="p-2 rounded-lg bg-blue-50 border border-blue-200">
            <p class="text-xs font-semibold text-blue-700">Part C</p>
            <p class="text-[10px] text-blue-500">{{ result.documentStructure!.partCSectionsFilled.length || 0 }}/7 Sections</p>
          </div>
        </div>
        <div class="flex flex-wrap gap-1.5" *ngIf="result.documentStructure!.appendicesRequired?.length">
          <span class="text-[10px] text-slate-400 mr-1">Appendices:</span>
          <span *ngFor="let app of result.documentStructure!.appendicesRequired"
                class="px-2 py-0.5 text-[10px] rounded-md font-medium"
                [ngClass]="isAppendixFilled(app) ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'">
            {{ app }} {{ isAppendixFilled(app) ? '(filled)' : '(pending)' }}
          </span>
        </div>
      </div>

      <!-- Manual Fields with Smart Help -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-4" *ngIf="result.manualFields && result.manualFields.length > 0">
        <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          <lucide-icon name="pen-tool" class="w-3.5 h-3.5 inline-block mr-1 -mt-0.5"></lucide-icon>
          Manual Input Required ({{ result.manualFields.length }} fields)
        </h4>
        <div class="space-y-2">
          <div *ngFor="let mf of result.manualFields"
               class="flex items-start gap-3 p-2.5 bg-red-50 rounded-lg border border-red-100">
            <lucide-icon name="edit-3" class="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0"></lucide-icon>
            <div class="flex-1 min-w-0">
              <p class="text-xs font-medium text-red-700">{{ mf.label }}</p>
              <p class="text-[10px] text-slate-500">{{ mf.reason }}</p>
              <p *ngIf="mf.smartHelp" class="text-[10px] text-blue-500 mt-0.5">
                <lucide-icon name="lightbulb" class="w-3 h-3 inline-block -mt-0.5 mr-0.5"></lucide-icon>
                {{ mf.smartHelp }}
              </p>
            </div>
            <span *ngIf="mf.documentSection" class="text-[10px] text-slate-400 flex-shrink-0">{{ mf.documentSection }}</span>
          </div>
        </div>
      </div>

      <!-- Field Lineage Badges -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          <lucide-icon name="layers" class="w-3.5 h-3.5 inline-block mr-1 -mt-0.5"></lucide-icon>
          Field Lineage ({{ result.fields.length }} fields)
        </h4>
        <div class="flex flex-wrap gap-2">
          <div *ngFor="let field of result.fields"
               class="group relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border cursor-default"
               [ngClass]="getLineageBadgeClass(field.lineage)">
            <lucide-icon [name]="getLineageIcon(field.lineage)" class="w-3 h-3"></lucide-icon>
            {{ field.fieldName }}
            <!-- Tooltip on hover -->
            <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 bg-slate-800 text-white text-[10px] rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none max-w-xs">
              <span *ngIf="field.source" class="block">Source: {{ field.source }}</span>
              <span *ngIf="field.confidence" class="block">Confidence: {{ (field.confidence! * 100).toFixed(0) }}%</span>
              <span *ngIf="field.documentSection" class="block">Section: {{ field.documentSection }}</span>
              <span class="block truncate">Value: {{ field.value }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- PIR Requirement -->
      <div class="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg border border-indigo-200" *ngIf="result.pirRequired">
        <lucide-icon name="clipboard-check" class="w-4 h-4 text-indigo-500 flex-shrink-0"></lucide-icon>
        <span class="text-xs text-indigo-700">Post-Implementation Review (PIR) required within 6 months of launch</span>
      </div>

    </div>
  `
})
export class AutofillSummaryComponent implements OnChanges {
    @Input() result!: AutoFillSummary;

    ngOnChanges(): void {
        // Recalculate when result changes
    }

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

    isAppendixFilled(appendix: string): boolean {
        if (!this.result?.documentStructure?.appendicesAutoFilled) return false;
        return this.result.documentStructure.appendicesAutoFilled.includes(appendix);
    }
}
