import { Component, EventEmitter, Input, Output, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedIconsModule } from '../../../shared/icons/shared-icons.module';
import { HttpClient } from '@angular/common/http';
import { Subject, Subscription } from 'rxjs';
import {
   NPA_PART_C_TEMPLATE,
   NPA_APPENDICES_TEMPLATE,
   TemplateNode,
   collectFieldKeys,
   getNavSections,
   NPA_FIELD_REGISTRY,
   FIELD_REGISTRY_MAP,
   FieldRegistryEntry
} from '../../../lib/npa-template-definition';
import { FieldLineage, NpaFieldType } from '../../../lib/npa-interfaces';
import { WorkflowStreamEvent, AutoFillField } from '../../../lib/agent-interfaces';

// Sub-components
import { NpaFieldRendererComponent } from './components/npa-field-renderer/npa-field-renderer.component';
import { NpaSectionStepperComponent } from './components/npa-section-stepper/npa-section-stepper.component';
import { NpaAgentChatComponent, FieldSuggestion } from './components/npa-agent-chat/npa-agent-chat.component';

// ────────────────────────────────────────────────────────────
// Types (exported for child components to import)
// ────────────────────────────────────────────────────────────

export type SignOffGroupId = 'BIZ' | 'TECH_OPS' | 'FINANCE' | 'RMG' | 'LCS';

export interface SignOffGroup {
   id: SignOffGroupId;
   label: string;
   shortLabel: string;
   icon: string;
   color: string;
   bgClass: string;
   textClass: string;
   borderClass: string;
   sections: string[];
}

export interface StepperSection {
   id: string;
   numbering: string;
   label: string;
   icon: string;
   fieldCount: number;
   filledCount: number;
   owner: SignOffGroupId;
   status: 'empty' | 'partial' | 'complete' | 'streaming';
   children: TemplateNode[];
}

export interface FieldState {
   key: string;
   label: string;
   value: string;
   lineage: FieldLineage;
   strategy: string;
   confidence?: number;
   source?: string;
   nodeId?: string;
   isStreaming: boolean;
   isEditing: boolean;
   type: NpaFieldType;
   placeholder?: string;
   tooltip?: string;
   required?: boolean;
   options?: string[];
   bulletItems?: string[];
   selectedOptions?: string[];
   yesNoValue?: boolean | null;
   conditionalText?: string;
   dependsOn?: { field: string; value: string };
   attachable?: boolean;
   attachedFiles?: string[];
   referenceUrl?: string;
   currencyCode?: string;
   tableColumns?: string[];
   tableData?: any[][];
   validationError?: string;
}

export interface AgentChat {
   id: SignOffGroupId;
   messages: ChatMessage[];
   isConnected: boolean;
   isStreaming: boolean;
   streamText: string;
}

export interface ChatMessage {
   role: 'user' | 'agent' | 'system';
   content: string;
   timestamp: Date;
   fieldRef?: string;
}

// ────────────────────────────────────────────────────────────
// Sign-Off Group Definitions
// ────────────────────────────────────────────────────────────

export const SIGN_OFF_GROUPS: SignOffGroup[] = [
   {
      id: 'BIZ',
      label: 'Proposing Unit (Business)',
      shortLabel: 'Business',
      icon: 'briefcase',
      color: 'blue',
      bgClass: 'bg-blue-50',
      textClass: 'text-blue-700',
      borderClass: 'border-blue-200',
      sections: ['PC.I', 'PC.VII']
   },
   {
      id: 'TECH_OPS',
      label: 'T&O + ISS',
      shortLabel: 'T&O',
      icon: 'settings',
      color: 'indigo',
      bgClass: 'bg-indigo-50',
      textClass: 'text-indigo-700',
      borderClass: 'border-indigo-200',
      sections: ['PC.II']
   },
   {
      id: 'FINANCE',
      label: 'Group Finance',
      shortLabel: 'Finance',
      icon: 'calculator',
      color: 'emerald',
      bgClass: 'bg-emerald-50',
      textClass: 'text-emerald-700',
      borderClass: 'border-emerald-200',
      sections: ['PC.III', 'PC.V']
   },
   {
      id: 'RMG',
      label: 'RMG (Market & Credit)',
      shortLabel: 'RMG',
      icon: 'shield-alert',
      color: 'rose',
      bgClass: 'bg-rose-50',
      textClass: 'text-rose-700',
      borderClass: 'border-rose-200',
      sections: ['PC.IV', 'PC.VI']
   },
   {
      id: 'LCS',
      label: 'Legal, Compliance & Secretariat',
      shortLabel: 'Legal',
      icon: 'scale',
      color: 'amber',
      bgClass: 'bg-amber-50',
      textClass: 'text-amber-700',
      borderClass: 'border-amber-200',
      sections: ['APP.1', 'APP.2', 'APP.3', 'APP.4', 'APP.5', 'APP.6']
   }
];

@Component({
   selector: 'app-npa-draft-builder',
   standalone: true,
   imports: [
      CommonModule,
      FormsModule,
      SharedIconsModule,
      NpaFieldRendererComponent,
      NpaSectionStepperComponent,
      NpaAgentChatComponent
   ],
   templateUrl: './npa-draft-builder.component.html',
   styleUrls: ['./npa-draft-builder.component.css']
})
export class NpaDraftBuilderComponent implements OnInit, OnDestroy {
   @Output() close = new EventEmitter<void>();
   @Output() onSave = new EventEmitter<any>();
   @Input() inputData: any = null;
   @Input() autofillStream: Subject<WorkflowStreamEvent> | null = null;

   @Input() set autofillParsedFields(fields: AutoFillField[] | null) {
      if (fields && fields.length > 0) {
         this.applyAutofillFields(fields);
      }
   }

   private http = inject(HttpClient);
   private cdr = inject(ChangeDetectorRef);

   // ─── Stepper State ──────────────────────────────────────────
   stepperSections: StepperSection[] = [];
   activeSectionId = 'PC.I';
   expandedSections = new Set<string>(['PC.I']);

   // ─── Field State ────────────────────────────────────────────
   fieldMap = new Map<string, FieldState>();
   sectionFieldGroups = new Map<string, { topic: string; numbering: string; guidance?: string; fields: FieldState[] }[]>();

   // ─── Agent Chat ─────────────────────────────────────────────
   signOffGroups = SIGN_OFF_GROUPS;
   activeAgentId: SignOffGroupId = 'BIZ';
   agentChats = new Map<SignOffGroupId, AgentChat>();

   // ─── Live Streaming ─────────────────────────────────────────
   isStreaming = false;
   streamingAgent: SignOffGroupId | null = null;
   liveStreamText = '';
   private liveStreamSub: Subscription | null = null;

   // ─── Auto-save ────────────────────────────────────────────
   private autoSaveTimer: ReturnType<typeof setInterval> | null = null;
   lastSavedAt: Date | null = null;
   isDirty = false;

   // ─── Completion Tracking ────────────────────────────────────
   overallProgress = 0;
   totalFields = 0;
   filledFields = 0;

   // ─── NPA Classification ──────────────────────────────────────
   npaClassification: 'New-to-Group' | 'Variation' | 'Existing' | 'NPA Lite' = 'New-to-Group';
   private readonly npaLiteExcludedSections = new Set(['PC.III', 'PC.V', 'PC.VII', 'APP.4', 'APP.5', 'APP.6']);

   // ─── Validation ──────────────────────────────────────────────
   validationErrors: { field: string; label: string; section: string }[] = [];
   showValidation = false;

   // ─── Expose to template ─────────────────────────────────────
   Math = Math;

   // ═══════════════════════════════════════════════════════════
   // Lifecycle
   // ═══════════════════════════════════════════════════════════

   ngOnInit(): void {
      if (this.inputData?.npaType) {
         this.npaClassification = this.inputData.npaType;
      }
      this.initializeSections();
      this.initializeFieldMap();
      this.initializeAgentChats();
      this.loadExistingFormData();
      this.subscribeLiveStream();
      this.startAutoSave();
   }

   ngOnDestroy(): void {
      this.liveStreamSub?.unsubscribe();
      if (this.autoSaveTimer) clearInterval(this.autoSaveTimer);
   }

   // ═══════════════════════════════════════════════════════════
   // Auto-save
   // ═══════════════════════════════════════════════════════════

   private startAutoSave(): void {
      this.autoSaveTimer = setInterval(() => {
         if (this.isDirty) this.autoSaveDraft();
      }, 30_000);
   }

   private autoSaveDraft(): void {
      const npaId = this.inputData?.npaId || this.inputData?.projectId || 'draft';
      const data: Record<string, { value: string; lineage: string }> = {};
      this.fieldMap.forEach((f, key) => {
         if (f.value && f.value.trim()) data[key] = { value: f.value, lineage: f.lineage };
      });
      try {
         sessionStorage.setItem(`_draft_builder_autosave_${npaId}`, JSON.stringify(data));
         this.lastSavedAt = new Date();
         this.isDirty = false;
         console.log(`[DraftBuilder] Auto-saved ${Object.keys(data).length} fields`);
      } catch (e) { /* quota exceeded */ }
   }

   // ═══════════════════════════════════════════════════════════
   // Initialization
   // ═══════════════════════════════════════════════════════════

   private initializeSections(): void {
      const navSections = getNavSections();
      this.stepperSections = navSections.map(ns => {
         const owner = this.getSectionOwner(ns.id);
         const icon = this.getSectionIcon(ns.id);
         const templateNode = this.getTemplateNode(ns.id);
         const allFieldKeys = templateNode ? collectFieldKeys(templateNode) : [];
         return {
            id: ns.id,
            numbering: ns.numbering,
            label: ns.label,
            icon,
            fieldCount: allFieldKeys.length,
            filledCount: 0,
            owner,
            status: 'empty' as const,
            children: templateNode?.children || []
         };
      });
   }

   private initializeFieldMap(): void {
      for (const entry of NPA_FIELD_REGISTRY) {
         const fieldState: FieldState = {
            key: entry.key,
            label: entry.label,
            value: '',
            lineage: 'MANUAL',
            strategy: entry.strategy,
            nodeId: entry.nodeId,
            isStreaming: false,
            isEditing: false,
            type: this.inferFieldType(entry),
            placeholder: entry.placeholder || this.getFieldPlaceholder(entry),
            tooltip: entry.ruleSource || entry.copySection || entry.llmCategory || '',
            required: entry.required ?? (entry.strategy !== 'MANUAL'),
            options: entry.options,
            dependsOn: entry.dependsOn,
            bulletItems: entry.fieldType === 'bullet_list' ? [''] : undefined,
            selectedOptions: (entry.fieldType === 'multiselect' || entry.fieldType === 'checkbox_group') ? [] : undefined,
            yesNoValue: entry.fieldType === 'yesno' ? null : undefined,
            currencyCode: entry.fieldType === 'currency' ? 'SGD' : undefined
         };
         this.fieldMap.set(entry.key, fieldState);
      }
      this.totalFields = this.fieldMap.size;
      this.buildSectionFieldGroups();
   }

   private buildSectionFieldGroups(): void {
      const allSections = [
         ...(NPA_PART_C_TEMPLATE.children || []),
         ...NPA_APPENDICES_TEMPLATE
      ];

      for (const section of allSections) {
         const sectionId = section.id;
         const groups: { topic: string; numbering: string; guidance?: string; fields: FieldState[] }[] = [];

         if (section.children && section.children.length > 0) {
            for (const topic of section.children) {
               const topicFields = this.collectFieldStatesFromNode(topic);
               if (topicFields.length > 0 || (topic.children && topic.children.length > 0)) {
                  const allTopicFields: FieldState[] = [...topicFields];
                  if (topic.children) {
                     for (const child of topic.children) {
                        allTopicFields.push(...this.collectFieldStatesFromNode(child));
                        if (child.children) {
                           for (const subChild of child.children) {
                              allTopicFields.push(...this.collectFieldStatesFromNode(subChild));
                           }
                        }
                     }
                  }
                  if (allTopicFields.length > 0) {
                     groups.push({
                        topic: topic.label,
                        numbering: topic.numbering,
                        guidance: topic.guidance,
                        fields: allTopicFields
                     });
                  }
               }
            }
         } else if (section.fieldKeys && section.fieldKeys.length > 0) {
            const directFields = section.fieldKeys
               .map(k => this.fieldMap.get(k))
               .filter((f): f is FieldState => !!f);
            if (directFields.length > 0) {
               groups.push({
                  topic: section.label,
                  numbering: section.numbering,
                  guidance: section.guidance,
                  fields: directFields
               });
            }
         }

         this.sectionFieldGroups.set(sectionId, groups);
      }
   }

   private collectFieldStatesFromNode(node: TemplateNode): FieldState[] {
      const fields: FieldState[] = [];
      if (node.fieldKeys) {
         for (const key of node.fieldKeys) {
            const fs = this.fieldMap.get(key);
            if (fs) fields.push(fs);
         }
      }
      if (node.tableFieldMapping) {
         for (const mapping of node.tableFieldMapping) {
            const fs = this.fieldMap.get(mapping.fieldKey);
            if (fs) fields.push(fs);
         }
      }
      return fields;
   }

   private initializeAgentChats(): void {
      for (const group of SIGN_OFF_GROUPS) {
         this.agentChats.set(group.id, {
            id: group.id,
            messages: [{
               role: 'system',
               content: `${group.label} agent ready. I can help auto-fill and review fields in sections: ${group.sections.join(', ')}.`,
               timestamp: new Date()
            }],
            isConnected: false,
            isStreaming: false,
            streamText: ''
         });
      }
   }

   private loadExistingFormData(): void {
      if (!this.inputData?.npaId && !this.inputData?.projectId) return;
      const id = this.inputData.npaId || this.inputData.projectId;

      this.http.get<any[]>(`/api/npas/${id}/form-data`).subscribe({
         next: (formData) => {
            if (!formData?.length) return;
            for (const fd of formData) {
               const field = this.fieldMap.get(fd.field_key);
               if (field) {
                  field.value = fd.field_value || '';
                  field.lineage = (fd.lineage || 'MANUAL') as FieldLineage;
                  field.confidence = fd.confidence_score;
                  field.source = fd.metadata?.sourceSnippet;
               }
            }
            this.updateProgress();
            console.log('[DraftBuilder] Loaded', formData.length, 'fields from DB');
         },
         error: (err) => console.warn('[DraftBuilder] Could not load form data:', err.message)
      });
   }

   // ═══════════════════════════════════════════════════════════
   // Live Stream (Autofill Pipeline)
   // ═══════════════════════════════════════════════════════════

   private subscribeLiveStream(): void {
      if (!this.autofillStream) return;

      this.liveStreamSub = this.autofillStream.subscribe({
         next: (event) => {
            switch (event.type) {
               case 'workflow_started':
                  this.isStreaming = true;
                  break;
               case 'text_chunk':
                  this.liveStreamText += event.text || '';
                  this.tryParseLiveFields();
                  break;
               case 'workflow_finished':
                  this.isStreaming = false;
                  if (event.outputs) this.applyWorkflowOutputs(event.outputs);
                  this.updateProgress();
                  break;
            }
         },
         error: () => { this.isStreaming = false; },
         complete: () => { this.isStreaming = false; }
      });
   }

   private tryParseLiveFields(): void {
      const text = this.liveStreamText;
      const fieldPattern = /\{\s*"field_key"\s*:\s*"([^"]+)"\s*,\s*"value"\s*:\s*"([^"]*(?:\\.[^"]*)*)"\s*(?:,\s*"lineage"\s*:\s*"([^"]*)"\s*)?(?:,\s*"confidence"\s*:\s*([\d.]+)\s*)?[^}]*\}/g;

      let match;
      while ((match = fieldPattern.exec(text)) !== null) {
         const fieldKey = match[1];
         const value = match[2].replace(/\\"/g, '"').replace(/\\n/g, '\n');
         const lineage = (match[3] || 'AUTO') as FieldLineage;
         const confidence = match[4] ? parseFloat(match[4]) : undefined;

         const field = this.fieldMap.get(fieldKey);
         if (field && !field.value) {
            field.value = value;
            field.lineage = lineage;
            field.confidence = confidence;
            field.isStreaming = false;
            this.updateSectionProgress(fieldKey);
         }
      }
   }

   private applyWorkflowOutputs(outputs: any): void {
      const filledFields = outputs.filled_fields || outputs.fields || [];
      for (const f of filledFields) {
         const key = f.field_key || f.fieldName || '';
         const field = this.fieldMap.get(key);
         if (field) {
            field.value = f.value || '';
            field.lineage = (f.lineage || 'AUTO') as FieldLineage;
            field.confidence = f.confidence ? f.confidence / 100 : undefined;
            field.source = f.source;
            field.isStreaming = false;
         }
      }
      this.updateProgress();
   }

   applyAutofillFields(fields: AutoFillField[]): void {
      for (const f of fields) {
         const key = f.fieldName || '';
         const field = this.fieldMap.get(key);
         if (field) {
            field.value = f.value || '';
            field.lineage = (f.lineage || 'AUTO') as FieldLineage;
            field.confidence = f.confidence;
            field.source = f.source;
            field.isStreaming = false;
         }
      }
      this.updateProgress();
   }

   // ═══════════════════════════════════════════════════════════
   // Child Component Event Handlers
   // ═══════════════════════════════════════════════════════════

   /** Fired by NpaFieldRendererComponent when a field value changes */
   onFieldEdited(field: FieldState): void {
      this.isDirty = true;
      // Clear validation error when user provides a value
      if (field.value && field.value.trim() !== '') {
         field.validationError = undefined;
      }
      this.updateProgress();
   }

   /** Fired by NpaFieldRendererComponent when a field is cleared */
   onFieldCleared(field: FieldState): void {
      this.updateProgress();
   }

   /** Fired by NpaFieldRendererComponent — delegates to the agent chat */
   askAgentAboutField(field: FieldState): void {
      const sectionId = field.nodeId?.split('.').slice(0, 2).join('.') || '';
      const owner = this.getSectionOwner(sectionId);
      this.activeAgentId = owner;
      // The NpaAgentChatComponent will handle the actual sending
      const chat = this.agentChats.get(owner);
      if (chat) {
         chat.messages.push({
            role: 'user',
            content: `Help me fill the "${field.label}" field. What should the value be based on the product context?`,
            timestamp: new Date()
         });
      }
   }

   /** Fired by NpaAgentChatComponent auto-fill button */
   onAutoFillSection(): void {
      // Placeholder — integrates with autofill pipeline in npa-detail
      console.log('[DraftBuilder] Auto-fill section requested for', this.activeSectionId);
   }

   /** Apply a field suggestion from agent chat (@@NPA_META@@ parsed) */
   onApplyFieldSuggestion(suggestion: FieldSuggestion): void {
      const field = this.fieldMap.get(suggestion.fieldKey);
      if (field) {
         field.value = suggestion.value;
         field.lineage = 'ADAPTED';
         field.confidence = suggestion.confidence;
         field.validationError = undefined;
         this.isDirty = true;
         this.updateProgress();
         console.log(`[DraftBuilder] Applied suggestion for ${suggestion.fieldKey}`);
      } else {
         console.warn(`[DraftBuilder] Unknown field key in suggestion: ${suggestion.fieldKey}`);
      }
   }

   // ═══════════════════════════════════════════════════════════
   // Navigation
   // ═══════════════════════════════════════════════════════════

   selectSection(sectionId: string): void {
      this.activeSectionId = sectionId;
      if (!this.expandedSections.has(sectionId)) {
         this.expandedSections.add(sectionId);
      }
      // Auto-switch agent tab to match the new section's owner
      const owner = this.getSectionOwner(sectionId);
      if (owner !== this.activeAgentId) {
         this.activeAgentId = owner;
      }
   }

   selectAgent(agentId: SignOffGroupId): void {
      this.activeAgentId = agentId;
   }

   navigateNext(): void {
      const idx = this.stepperSections.findIndex(s => s.id === this.activeSectionId);
      if (idx < this.stepperSections.length - 1) {
         this.selectSection(this.stepperSections[idx + 1].id);
      }
   }

   navigatePrev(): void {
      const idx = this.stepperSections.findIndex(s => s.id === this.activeSectionId);
      if (idx > 0) {
         this.selectSection(this.stepperSections[idx - 1].id);
      }
   }

   // ═══════════════════════════════════════════════════════════
   // Progress
   // ═══════════════════════════════════════════════════════════

   private updateProgress(): void {
      let filled = 0;
      let total = 0;
      this.fieldMap.forEach(f => {
         const sectionId = f.nodeId?.split('.').slice(0, 2).join('.') || '';
         if (!this.isSectionApplicable(sectionId)) return;
         total++;
         if (f.value && f.value.trim() !== '') filled++;
      });
      this.totalFields = total;
      this.filledFields = filled;
      this.overallProgress = total > 0 ? Math.round((filled / total) * 100) : 0;

      for (const section of this.stepperSections) {
         const groups = this.sectionFieldGroups.get(section.id) || [];
         const allFields = groups.flatMap(g => g.fields);
         section.fieldCount = allFields.length;
         section.filledCount = allFields.filter(f => f.value && f.value.trim() !== '').length;
         section.status = !this.isSectionApplicable(section.id) ? 'complete'
            : section.filledCount === 0 ? 'empty'
            : section.filledCount >= section.fieldCount ? 'complete'
            : 'partial';
      }
   }

   private updateSectionProgress(fieldKey: string): void {
      const entry = FIELD_REGISTRY_MAP.get(fieldKey);
      if (!entry?.nodeId) return;
      const sectionId = entry.nodeId.split('.').slice(0, 2).join('.');
      const section = this.stepperSections.find(s => s.id === sectionId);
      if (section) {
         const groups = this.sectionFieldGroups.get(section.id) || [];
         const allFields = groups.flatMap(g => g.fields);
         section.filledCount = allFields.filter(f => f.value && f.value.trim() !== '').length;
         section.status = section.filledCount === 0 ? 'empty'
            : section.filledCount >= section.fieldCount ? 'complete'
            : 'partial';
      }
      this.updateProgress();
   }

   // ═══════════════════════════════════════════════════════════
   // Helpers (used by template & child components)
   // ═══════════════════════════════════════════════════════════

   getActiveSection(): StepperSection | undefined {
      return this.stepperSections.find(s => s.id === this.activeSectionId);
   }

   getActiveSectionGroups(): { topic: string; numbering: string; guidance?: string; fields: FieldState[] }[] {
      return this.sectionFieldGroups.get(this.activeSectionId) || [];
   }

   getGroupForSection(sectionId: string): SignOffGroup {
      const owner = this.getSectionOwner(sectionId);
      return SIGN_OFF_GROUPS.find(g => g.id === owner) || SIGN_OFF_GROUPS[0];
   }

   getSectionOwner(sectionId: string): SignOffGroupId {
      for (const group of SIGN_OFF_GROUPS) {
         if (group.sections.includes(sectionId)) return group.id;
      }
      if (sectionId.startsWith('APP')) return 'LCS';
      return 'BIZ';
   }

   shouldShowField(field: FieldState): boolean {
      if (!field.dependsOn) return true;
      const parentField = this.fieldMap.get(field.dependsOn.field);
      if (!parentField) return true;
      return parentField.value === field.dependsOn.value;
   }

   isSectionApplicable(sectionId: string): boolean {
      if (this.npaClassification !== 'NPA Lite') return true;
      return !this.npaLiteExcludedSections.has(sectionId);
   }

   setClassification(classification: 'New-to-Group' | 'Variation' | 'Existing' | 'NPA Lite'): void {
      this.npaClassification = classification;
      this.updateProgress();
   }

   // ═══════════════════════════════════════════════════════════
   // Validation
   // ═══════════════════════════════════════════════════════════

   validateDraft(): boolean {
      this.validationErrors = [];
      // Clear previous validation errors from all fields
      this.fieldMap.forEach(field => { field.validationError = undefined; });

      this.fieldMap.forEach((field, key) => {
         if (!field.required) return;
         if (!this.isSectionApplicable(field.nodeId?.split('.').slice(0, 2).join('.') || '')) return;
         if (!field.value || field.value.trim() === '') {
            const sectionId = field.nodeId?.split('.').slice(0, 2).join('.') || 'Unknown';
            field.validationError = 'This field is required';
            this.validationErrors.push({ field: key, label: field.label, section: sectionId });
         }
      });
      this.showValidation = this.validationErrors.length > 0;
      return this.validationErrors.length === 0;
   }

   goToValidationError(error: { field: string; section: string }): void {
      this.selectSection(error.section);
      this.showValidation = false;
   }

   dismissValidation(): void {
      this.showValidation = false;
   }

   // ═══════════════════════════════════════════════════════════
   // Save
   // ═══════════════════════════════════════════════════════════

   saveDraft(skipValidation = false): void {
      if (!skipValidation) this.validateDraft();

      const fields: any[] = [];
      this.fieldMap.forEach((field, key) => {
         if (field.value && field.value.trim() !== '') {
            fields.push({
               field_key: key,
               field_value: field.value,
               lineage: field.lineage,
               confidence_score: field.confidence ? Math.round(field.confidence * 100) : null,
               metadata: {
                  sourceSnippet: field.source,
                  strategy: field.strategy,
                  fieldType: field.type
               }
            });
         }
      });
      this.onSave.emit({
         fields,
         classification: this.npaClassification,
         validationErrors: this.validationErrors.length,
         progress: this.overallProgress
      });
   }

   // ═══════════════════════════════════════════════════════════
   // Private Helpers
   // ═══════════════════════════════════════════════════════════

   private getSectionIcon(sectionId: string): string {
      const iconMap: Record<string, string> = {
         'PC.I': 'package', 'PC.II': 'settings', 'PC.III': 'calculator',
         'PC.IV': 'shield-alert', 'PC.V': 'database', 'PC.VI': 'alert-triangle',
         'PC.VII': 'bar-chart-2', 'APP.1': 'building', 'APP.2': 'key',
         'APP.3': 'shield', 'APP.4': 'pie-chart', 'APP.5': 'trending-up', 'APP.6': 'globe'
      };
      return iconMap[sectionId] || 'file-text';
   }

   private getTemplateNode(sectionId: string): TemplateNode | undefined {
      if (sectionId.startsWith('PC.')) {
         return NPA_PART_C_TEMPLATE.children?.find(c => c.id === sectionId);
      }
      return NPA_APPENDICES_TEMPLATE.find(a => a.id === sectionId);
   }

   private inferFieldType(entry: FieldRegistryEntry): NpaFieldType {
      if (entry.fieldType) return entry.fieldType;
      if (entry.key.includes('date') || entry.key.includes('_at')) return 'date';
      if (entry.key.includes('amount') || entry.key.includes('revenue') || entry.key.includes('roi')) return 'currency';
      if (entry.strategy === 'LLM') return 'textarea';
      if (entry.key.startsWith('mrf_')) return 'dropdown';
      return 'text';
   }

   private getFieldPlaceholder(entry: FieldRegistryEntry): string {
      if (entry.strategy === 'RULE') return 'Auto-populated from system';
      if (entry.strategy === 'COPY') return 'Copied from similar NPA';
      if (entry.strategy === 'LLM') return 'AI-generated content';
      return 'Enter value manually';
   }

   // ─── TrackBy Functions ────────────────────────────────────

   trackByFieldKey(_index: number, field: FieldState): string {
      return field.key;
   }

   trackByGroupTopic(_index: number, group: { topic: string }): string {
      return group.topic;
   }

   trackBySectionId(_index: number, section: StepperSection): string {
      return section.id;
   }
}
