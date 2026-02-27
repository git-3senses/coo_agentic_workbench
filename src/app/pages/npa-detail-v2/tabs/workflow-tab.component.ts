import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { SharedIconsModule } from '../../../shared/icons/shared-icons.module';
import { WorkflowStage, getWorkflowIcon, getWorkflowColor } from '../models/npa-detail.models';

@Component({
  selector: 'app-workflow-tab',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, SharedIconsModule],
  templateUrl: './workflow-tab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkflowTabComponent {
  @Input() stages: WorkflowStage[] = [];

  getWorkflowIcon = getWorkflowIcon;
  getWorkflowColor = getWorkflowColor;
}
