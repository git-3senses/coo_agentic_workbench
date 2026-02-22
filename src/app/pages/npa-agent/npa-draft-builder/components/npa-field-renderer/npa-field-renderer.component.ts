import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedIconsModule } from '../../../../../shared/icons/shared-icons.module';
import { NpaLineageBadgeComponent } from '../../../../../shared/components/npa-lineage-badge/npa-lineage-badge.component';
import { NpaStrategyBadgeComponent } from '../../../../../shared/components/npa-strategy-badge/npa-strategy-badge.component';
import { FieldState } from '../../npa-draft-builder.component';

@Component({
   selector: 'app-npa-field-renderer',
   standalone: true,
   imports: [
      CommonModule,
      FormsModule,
      SharedIconsModule,
      NpaLineageBadgeComponent,
      NpaStrategyBadgeComponent
   ],
   templateUrl: './npa-field-renderer.component.html',
   styleUrls: ['./npa-field-renderer.component.css']
})
export class NpaFieldRendererComponent {
   @Input() field!: FieldState;

   @Output() fieldEdited = new EventEmitter<FieldState>();
   @Output() fieldCleared = new EventEmitter<FieldState>();
   @Output() askAgent = new EventEmitter<FieldState>();
   @Output() fileSelected = new EventEmitter<{ field: FieldState; event: Event }>();

   // ─── Field Editing ──────────────────────────────────────────

   startEditing(): void {
      this.field.isEditing = true;
   }

   finishEditing(): void {
      this.field.isEditing = false;
      if (this.field.value && this.field.lineage !== 'MANUAL') {
         this.field.lineage = 'ADAPTED';
      }
      this.fieldEdited.emit(this.field);
   }

   clearField(): void {
      this.field.value = '';
      this.field.lineage = 'MANUAL';
      this.field.confidence = undefined;
      this.field.source = undefined;
      this.fieldCleared.emit(this.field);
   }

   onAskAgent(): void {
      this.askAgent.emit(this.field);
   }

   // ─── Bullet List ──────────────────────────────────────────────

   addBulletItem(): void {
      if (!this.field.bulletItems) this.field.bulletItems = [];
      this.field.bulletItems.push('');
      this.syncBulletToValue();
   }

   removeBulletItem(index: number): void {
      if (this.field.bulletItems) {
         this.field.bulletItems.splice(index, 1);
         this.syncBulletToValue();
      }
   }

   updateBulletItem(index: number, value: string): void {
      if (this.field.bulletItems) {
         this.field.bulletItems[index] = value;
         this.syncBulletToValue();
      }
   }

   private syncBulletToValue(): void {
      this.field.value = (this.field.bulletItems || []).filter(b => b.trim()).join('\n\u2022 ');
      if (this.field.value) this.field.value = '\u2022 ' + this.field.value;
      this.fieldEdited.emit(this.field);
   }

   // ─── Multiselect ──────────────────────────────────────────────

   toggleMultiSelectOption(option: string): void {
      if (!this.field.selectedOptions) this.field.selectedOptions = [];
      const idx = this.field.selectedOptions.indexOf(option);
      if (idx >= 0) {
         this.field.selectedOptions.splice(idx, 1);
      } else {
         this.field.selectedOptions.push(option);
      }
      this.field.value = this.field.selectedOptions.join(', ');
      this.fieldEdited.emit(this.field);
   }

   // ─── Yes / No ──────────────────────────────────────────────────

   setYesNo(value: boolean): void {
      this.field.yesNoValue = value;
      this.field.value = value ? 'Yes' : 'No';
      if (!value) this.field.conditionalText = '';
      this.fieldEdited.emit(this.field);
   }

   updateConditionalText(text: string): void {
      this.field.conditionalText = text;
      this.field.value = `${this.field.yesNoValue ? 'Yes' : 'No'} \u2014 ${text}`;
      this.fieldEdited.emit(this.field);
   }

   // ─── Checkbox Group ───────────────────────────────────────────

   toggleCheckboxOption(option: string): void {
      if (!this.field.selectedOptions) this.field.selectedOptions = [];
      const idx = this.field.selectedOptions.indexOf(option);
      if (idx >= 0) {
         this.field.selectedOptions.splice(idx, 1);
      } else {
         this.field.selectedOptions.push(option);
      }
      this.field.value = this.field.selectedOptions.join('; ');
      this.fieldEdited.emit(this.field);
   }

   // ─── File Upload ───────────────────────────────────────────────

   onFileSelect(event: Event): void {
      const input = event.target as HTMLInputElement;
      if (input.files) {
         if (!this.field.attachedFiles) this.field.attachedFiles = [];
         for (let i = 0; i < input.files.length; i++) {
            this.field.attachedFiles.push(input.files[i].name);
         }
         this.field.value = this.field.attachedFiles.join(', ');
         this.fieldEdited.emit(this.field);
      }
   }

   removeFile(index: number): void {
      if (this.field.attachedFiles) {
         this.field.attachedFiles.splice(index, 1);
         this.field.value = this.field.attachedFiles.join(', ');
         this.fieldEdited.emit(this.field);
      }
   }

   // ─── Helpers ───────────────────────────────────────────────────

   isOptionSelected(option: string): boolean {
      return (this.field.selectedOptions || []).includes(option);
   }

   trackByIndex(index: number): number {
      return index;
   }
}
