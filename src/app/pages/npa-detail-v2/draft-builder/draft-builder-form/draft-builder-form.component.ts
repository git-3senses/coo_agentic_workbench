import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { SharedIconsModule } from '../../../../shared/icons/shared-icons.module';
import { DraftSection, DraftComment, SectionProgress } from '../../../../components/draft-builder/models/draft.models';
import { DraftFieldCardComponent } from '../../../../components/draft-builder/draft-field-card/draft-field-card.component';
import { getOwnerColor, getOwnerLabel } from '../../models/npa-detail.models';

@Component({
  selector: 'app-draft-builder-form',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, SharedIconsModule, DraftFieldCardComponent],
  templateUrl: './draft-builder-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DraftBuilderFormComponent {
  @Input() section!: DraftSection;
  @Input() sectionIndex = 0;
  @Input() totalSections = 0;
  @Input() comments: DraftComment[] = [];

  @Output() navigatePrev = new EventEmitter<void>();
  @Output() navigateNext = new EventEmitter<void>();
  @Output() valueChanged = new EventEmitter<void>();
  @Output() commentAdded = new EventEmitter<{ fieldKey: string; text: string }>();
  @Output() commentResolved = new EventEmitter<string>();

  // Sub-section expansion
  expandedSubSections: Record<string, boolean> = {};

  getOwnerColor = getOwnerColor;
  getOwnerLabel = getOwnerLabel;

  toggleSubSection(id: string): void {
    this.expandedSubSections[id] = !this.expandedSubSections[id];
  }

  isSubSectionExpanded(id: string): boolean {
    return this.expandedSubSections[id] !== false; // default open
  }

  getSectionProgress(): SectionProgress {
    let filled = 0, total = 0, missingRequired = 0;
    const check = (fields: { value: string; required: boolean; bulletItems?: string[] }[]) => {
      for (const f of fields) {
        total++;
        if (f.value || (f.bulletItems && f.bulletItems.length > 0)) filled++;
        else if (f.required) missingRequired++;
      }
    };
    check(this.section.fields);
    if (this.section.subSections) {
      for (const sub of this.section.subSections) check(sub.fields);
    }
    return { filled, total, missingRequired };
  }

  getFieldComments(fieldKey: string): DraftComment[] {
    return this.comments.filter(c => c.fieldKey === fieldKey);
  }

  onValueChanged(): void {
    this.valueChanged.emit();
  }

  onCommentAdded(event: { fieldKey: string; text: string }): void {
    this.commentAdded.emit(event);
  }

  onCommentResolved(commentId: string): void {
    this.commentResolved.emit(commentId);
  }
}
