import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { SharedIconsModule } from '../../../shared/icons/shared-icons.module';
import { MonitoringResult } from '../../../lib/agent-interfaces';
import { getHealthColor, getTrendIcon, getTrendColor } from '../models/npa-detail.models';

@Component({
  selector: 'app-monitor-tab',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, SharedIconsModule],
  templateUrl: './monitor-tab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonitorTabComponent {
  @Input() monitoring!: MonitoringResult;

  getHealthColor = getHealthColor;
  getTrendIcon = getTrendIcon;
  getTrendColor = getTrendColor;
}
