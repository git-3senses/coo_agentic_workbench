import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { SharedIconsModule } from '../../../shared/icons/shared-icons.module';
import {
  DraftSection, DraftComment, DraftAgentMessage, ReferenceNPA,
  DraftField, AutoSaveStatus, DraftProgress,
} from '../../../components/draft-builder/models/draft.models';
import { getOwnerLabel } from '../models/npa-detail.models';
import { DraftBuilderHeaderComponent } from './draft-builder-header/draft-builder-header.component';
import { DraftBuilderFormComponent } from './draft-builder-form/draft-builder-form.component';
import { DraftSectionNavComponent } from '../../../components/draft-builder/draft-section-nav/draft-section-nav.component';
import { DraftAgentPanelComponent } from '../../../components/draft-builder/draft-agent-panel/draft-agent-panel.component';

@Component({
  selector: 'app-draft-builder-overlay',
  standalone: true,
  imports: [
    CommonModule, FormsModule, LucideAngularModule, SharedIconsModule,
    DraftBuilderHeaderComponent, DraftBuilderFormComponent,
    DraftSectionNavComponent, DraftAgentPanelComponent,
  ],
  templateUrl: './draft-builder-overlay.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DraftBuilderOverlayComponent {
  @Input() projectId = '';
  @Input() sections: DraftSection[] = [];
  @Input() comments: DraftComment[] = [];
  @Input() agentMessages: DraftAgentMessage[] = [];
  @Input() referenceNPAs: ReferenceNPA[] = [];
  @Input() selectedRefNPA: ReferenceNPA | null = null;

  @Output() closed = new EventEmitter<void>();
  @Output() commentAdded = new EventEmitter<{ fieldKey: string; text: string }>();
  @Output() commentResolved = new EventEmitter<string>();
  @Output() agentMessageSent = new EventEmitter<string>();

  activeSectionIndex = 0;
  agentPanelOpen = true;
  autoSaveStatus: AutoSaveStatus = 'saved';
  autoSaveTimer: any = null;

  ngOnInit(): void {
    this.startAutoSave();
  }

  ngOnDestroy(): void {
    this.stopAutoSave();
  }

  get activeSection(): DraftSection {
    return this.sections[this.activeSectionIndex];
  }

  setSection(idx: number): void {
    this.activeSectionIndex = idx;
  }

  prevSection(): void {
    if (this.activeSectionIndex > 0) this.activeSectionIndex--;
  }

  nextSection(): void {
    if (this.activeSectionIndex < this.sections.length - 1) this.activeSectionIndex++;
  }

  toggleAgentPanel(): void {
    this.agentPanelOpen = !this.agentPanelOpen;
  }

  markUnsaved(): void {
    this.autoSaveStatus = 'unsaved';
  }

  // ── Progress calculations ───────────────────────────────
  getAllFields(): DraftField[] {
    const all: DraftField[] = [];
    for (const sec of this.sections) {
      all.push(...sec.fields);
      if (sec.subSections) {
        for (const sub of sec.subSections) all.push(...sub.fields);
      }
    }
    return all;
  }

  getDraftProgress(): DraftProgress {
    let filled = 0, total = 0, required = 0, requiredFilled = 0;
    for (const f of this.getAllFields()) {
      total++;
      if (f.value || (f.bulletItems && f.bulletItems.length > 0)) filled++;
      if (f.required) {
        required++;
        if (f.value || (f.bulletItems && f.bulletItems.length > 0)) requiredFilled++;
      }
    }
    return { filled, total, required, requiredFilled };
  }

  getDraftIssues(): { key: string; label: string }[] {
    return this.getAllFields()
      .filter(f => f.required && !f.value && !(f.bulletItems && f.bulletItems.length > 0))
      .map(f => ({ key: f.key, label: f.label }));
  }

  jumpToField(fieldKey: string): void {
    for (let i = 0; i < this.sections.length; i++) {
      const sec = this.sections[i];
      if (sec.fields.some(f => f.key === fieldKey)) { this.activeSectionIndex = i; return; }
      if (sec.subSections) {
        for (const sub of sec.subSections) {
          if (sub.fields.some(f => f.key === fieldKey)) { this.activeSectionIndex = i; return; }
        }
      }
    }
  }

  onAgentMessageSent(text: string): void {
    this.agentMessageSent.emit(text);
  }

  // ── Auto-save ───────────────────────────────────────────
  private startAutoSave(): void {
    this.autoSaveTimer = setInterval(() => {
      this.autoSaveStatus = 'saving';
      setTimeout(() => {
        this.autoSaveStatus = 'saved';
      }, 800);
    }, 30000);
  }

  private stopAutoSave(): void {
    if (this.autoSaveTimer) clearInterval(this.autoSaveTimer);
  }
}
