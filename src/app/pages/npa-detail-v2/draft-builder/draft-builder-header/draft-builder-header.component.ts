import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { SharedIconsModule } from '../../../../shared/icons/shared-icons.module';
import { AutoSaveStatus, DraftProgress } from '../../../../components/draft-builder/models/draft.models';

@Component({
  selector: 'app-draft-builder-header',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, SharedIconsModule],
  templateUrl: './draft-builder-header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DraftBuilderHeaderComponent {
  @Input() projectId = '';
  @Input() displayId = '';
  @Input() progress!: DraftProgress;
  @Input() issueCount = 0;
  @Input() autoSaveStatus: AutoSaveStatus = 'saved';

  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();
}
