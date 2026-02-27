import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { SharedIconsModule } from '../../../shared/icons/shared-icons.module';
import { DocCompletenessResult } from '../../../lib/agent-interfaces';
import { DocumentItem, MissingDocItem, getStatusColor, getDocIcon, getDocIconColor, getDocBarColor } from '../models/npa-detail.models';

@Component({
  selector: 'app-documents-tab',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, SharedIconsModule],
  templateUrl: './documents-tab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentsTabComponent {
  @Input() docCompleteness!: DocCompletenessResult;
  @Input() documents: DocumentItem[] = [];
  @Input() missingDocItems: MissingDocItem[] = [];

  // Internal state
  docCategories = ['Legal', 'Credit', 'Compliance', 'Financial'];
  expandedCategories: Record<string, boolean> = { Legal: true, Credit: true, Compliance: true, Financial: true };
  selectedDocIndex = 0;

  getStatusColor = getStatusColor;
  getDocIcon = getDocIcon;
  getDocIconColor = getDocIconColor;

  getDocBarColor(): string {
    return getDocBarColor(this.docCompleteness.completenessPercent);
  }

  toggleCategory(cat: string): void {
    this.expandedCategories[cat] = !this.expandedCategories[cat];
  }

  getDocsByCategory(cat: string): DocumentItem[] {
    return this.documents.filter(d => d.category === cat);
  }

  getMissingByCategory(cat: string): MissingDocItem[] {
    return this.missingDocItems.filter(d => d.category === cat);
  }

  getCategoryCount(cat: string): { present: number; total: number } {
    const present = this.documents.filter(d => d.category === cat).length;
    const missing = this.missingDocItems.filter(d => d.category === cat).length;
    return { present, total: present + missing };
  }

  selectDoc(idx: number): void {
    this.selectedDocIndex = idx;
  }

  get selectedDoc(): DocumentItem {
    return this.documents[this.selectedDocIndex] || this.documents[0];
  }
}
