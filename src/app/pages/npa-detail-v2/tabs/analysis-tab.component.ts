import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { SharedIconsModule } from '../../../shared/icons/shared-icons.module';
import { ClassificationResult, RiskAssessment, MLPrediction } from '../../../lib/agent-interfaces';
import { getStatusColor, getRatingColor, getScoreBarWidth } from '../models/npa-detail.models';

@Component({
  selector: 'app-analysis-tab',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, SharedIconsModule],
  templateUrl: './analysis-tab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnalysisTabComponent {
  @Input() classification!: ClassificationResult;
  @Input() risk!: RiskAssessment;
  @Input() mlPrediction!: MLPrediction;

  getStatusColor = getStatusColor;
  getRatingColor = getRatingColor;
  getScoreBarWidth = getScoreBarWidth;
}
