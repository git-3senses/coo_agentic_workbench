import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedIconsModule } from '../../../shared/icons/shared-icons.module';
import { ClassificationResult } from '../../../lib/agent-interfaces';

@Component({
    selector: 'app-classification-result',
    standalone: true,
    imports: [CommonModule, SharedIconsModule],
    template: `
    <div class="space-y-5" *ngIf="result">

      <!-- Prohibited Hard Stop Banner -->
      <div *ngIf="result.prohibitedMatch?.matched"
           class="w-full bg-red-600 text-white rounded-lg p-4 flex items-center gap-3 shadow-lg animate-pulse">
        <lucide-icon name="shield-alert" class="w-6 h-6 flex-shrink-0"></lucide-icon>
        <div>
          <p class="font-bold text-lg">HARD STOP — Prohibited Product</p>
          <p class="text-sm text-red-100">
            Matched: {{ result.prohibitedMatch!.item }} (Layer: {{ result.prohibitedMatch!.layer }})
          </p>
        </div>
      </div>

      <!-- Header Row: Type Badge + Track Badge + Confidence -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div class="flex items-center justify-between mb-5">
          <div class="flex items-center gap-3">
            <!-- Type Badge -->
            <span class="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide"
                  [ngClass]="getTypeBadgeClass(result.type)">
              <lucide-icon name="git-branch" class="w-3.5 h-3.5 inline-block mr-1 -mt-0.5"></lucide-icon>
              {{ result.type }}
            </span>
            <!-- Track Badge -->
            <span class="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide"
                  [ngClass]="getTrackBadgeClass(result.track)">
              <lucide-icon name="target" class="w-3.5 h-3.5 inline-block mr-1 -mt-0.5"></lucide-icon>
              {{ result.track }}
            </span>
          </div>

          <!-- Confidence -->
          <div class="flex items-center gap-2 text-sm">
            <lucide-icon name="gauge" class="w-4 h-4 text-slate-400"></lucide-icon>
            <span class="text-slate-500 font-medium">Confidence</span>
            <span class="font-bold text-lg"
                  [ngClass]="{
                    'text-green-600': result.overallConfidence >= 80,
                    'text-amber-600': result.overallConfidence >= 50 && result.overallConfidence < 80,
                    'text-red-600': result.overallConfidence < 50
                  }">
              {{ result.overallConfidence }}%
            </span>
          </div>
        </div>

        <!-- 7-Criteria Score Bars -->
        <div class="space-y-3">
          <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Classification Criteria
          </h4>
          <div *ngFor="let score of result.scores" class="group">
            <div class="flex items-center justify-between mb-1">
              <span class="text-sm font-medium text-slate-700">{{ score.criterion }}</span>
              <span class="text-xs font-mono text-slate-500">
                {{ score.score }}/{{ score.maxScore }}
              </span>
            </div>
            <div class="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div class="h-full rounded-full transition-all duration-500"
                   [ngClass]="getScoreBarColor(score.score, score.maxScore)"
                   [style.width.%]="(score.score / score.maxScore) * 100">
              </div>
            </div>
            <p class="text-xs text-slate-400 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              {{ score.reasoning }}
            </p>
          </div>
        </div>
      </div>

      <!-- Mandatory Sign-offs -->
      <div *ngIf="result.mandatorySignOffs.length > 0"
           class="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          <lucide-icon name="clipboard-check" class="w-3.5 h-3.5 inline-block mr-1 -mt-0.5"></lucide-icon>
          Mandatory Sign-offs Required
        </h4>
        <div class="flex flex-wrap gap-2">
          <span *ngFor="let dept of result.mandatorySignOffs"
                class="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
            {{ dept }}
          </span>
        </div>
      </div>
    </div>
  `
})
export class ClassificationResultComponent {
    @Input() result!: ClassificationResult;

    getTypeBadgeClass(type: string): string {
        switch (type) {
            case 'NTG': return 'bg-orange-100 text-orange-700 border border-orange-200';
            case 'Variation': return 'bg-blue-100 text-blue-700 border border-blue-200';
            case 'Existing': return 'bg-green-100 text-green-700 border border-green-200';
            default: return 'bg-slate-100 text-slate-700 border border-slate-200';
        }
    }

    getTrackBadgeClass(track: string): string {
        switch (track) {
            case 'Full NPA': return 'bg-red-100 text-red-700 border border-red-200';
            case 'NPA Lite': return 'bg-blue-100 text-blue-700 border border-blue-200';
            case 'Evergreen': return 'bg-green-100 text-green-700 border border-green-200';
            case 'Prohibited': return 'bg-red-200 text-red-900 border border-red-300';
            default: return 'bg-slate-100 text-slate-700 border border-slate-200';
        }
    }

    getScoreBarColor(score: number, maxScore: number): string {
        const pct = (score / maxScore) * 100;
        if (pct >= 75) return 'bg-green-500';
        if (pct >= 50) return 'bg-amber-500';
        return 'bg-red-500';
    }
}
