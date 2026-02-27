import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { SharedIconsModule } from '../../../shared/icons/shared-icons.module';
import { ProjectData, DraftProgressSummary, formatCurrency } from '../models/npa-detail.models';

@Component({
  selector: 'app-proposal-tab',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, SharedIconsModule],
  templateUrl: './proposal-tab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProposalTabComponent {
  @Input() project!: ProjectData;
  @Input() draftProgress!: DraftProgressSummary;

  @Output() openDraft = new EventEmitter<void>();

  formatCurrency = formatCurrency;
}
