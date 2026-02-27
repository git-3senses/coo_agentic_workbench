import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { SharedIconsModule } from '../../../shared/icons/shared-icons.module';
import { GovernanceState } from '../../../lib/agent-interfaces';
import { getStatusColor } from '../models/npa-detail.models';

@Component({
  selector: 'app-signoff-tab',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, SharedIconsModule],
  templateUrl: './signoff-tab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignoffTabComponent {
  @Input() governance!: GovernanceState;

  getStatusColor = getStatusColor;

  getSignoffProgress(): number {
    const approved = this.governance.signoffs.filter(s => s.status === 'APPROVED').length;
    return Math.round((approved / this.governance.signoffs.length) * 100);
  }
}
