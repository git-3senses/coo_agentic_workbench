import { Component, EventEmitter, Input, Output, inject, ChangeDetectorRef, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedIconsModule } from '../../../../../shared/icons/shared-icons.module';
import { DifyService } from '../../../../../services/dify/dify.service';
import { ChatSessionService } from '../../../../../services/chat-session.service';
import {
   SignOffGroup,
   SignOffGroupId,
   SIGN_OFF_GROUPS,
   AgentChat,
   ChatMessage,
   FieldState
} from '../../npa-draft-builder.component';

/** Parsed field suggestion from @@NPA_META@@ in agent response */
export interface FieldSuggestion {
   fieldKey: string;
   label?: string;
   value: string;
   confidence?: number;
}

@Component({
   selector: 'app-npa-agent-chat',
   standalone: true,
   imports: [CommonModule, FormsModule, SharedIconsModule],
   templateUrl: './npa-agent-chat.component.html',
   styleUrls: ['./npa-agent-chat.component.css']
})
export class NpaAgentChatComponent implements AfterViewChecked {
   @Input() signOffGroups: SignOffGroup[] = SIGN_OFF_GROUPS;
   @Input() activeAgentId: SignOffGroupId = 'BIZ';
   @Input() agentChats = new Map<SignOffGroupId, AgentChat>();
   @Input() sectionFieldGroups = new Map<string, { topic: string; numbering: string; guidance?: string; fields: FieldState[] }[]>();

   @Output() agentSelected = new EventEmitter<SignOffGroupId>();
   @Output() messageSent = new EventEmitter<{ agentId: SignOffGroupId; message: string; context: string }>();
   @Output() validateRequested = new EventEmitter<void>();
   @Output() applySuggestion = new EventEmitter<FieldSuggestion>();

   @ViewChild('chatContainer') chatContainer!: ElementRef;

   private cdr = inject(ChangeDetectorRef);
   private difyService = inject(DifyService);
   private chatSessionService = inject(ChatSessionService);
   private shouldScrollToBottom = false;

   chatInput = '';

   /** Pending field suggestions parsed from last agent response */
   pendingSuggestions: FieldSuggestion[] = [];


   /** Maps Draft Builder sign-off groups to Dify agent registry keys */
   private readonly agentIdMap: Record<SignOffGroupId, string> = {
      BIZ: 'AG_NPA_BIZ',
      TECH_OPS: 'AG_NPA_TECH_OPS',
      FINANCE: 'AG_NPA_FINANCE',
      RMG: 'AG_NPA_RMG',
      LCS: 'AG_NPA_LCS'
   };

   ngAfterViewChecked(): void {
      if (this.shouldScrollToBottom) {
         this.scrollToBottom();
         this.shouldScrollToBottom = false;
      }
   }

   selectAgent(agentId: SignOffGroupId): void {
      this.activeAgentId = agentId;
      this.pendingSuggestions = [];
      this.agentSelected.emit(agentId);
   }

   getActiveGroup(): SignOffGroup {
      return this.signOffGroups.find(g => g.id === this.activeAgentId) || this.signOffGroups[0];
   }

   getActiveAgentChat(): AgentChat | undefined {
      return this.agentChats.get(this.activeAgentId);
   }

   sendChatMessage(): void {
      if (!this.chatInput.trim()) return;
      const chat = this.agentChats.get(this.activeAgentId);
      if (!chat) return;

      const userMessage = this.chatInput.trim();
      chat.messages.push({
         role: 'user',
         content: userMessage,
         timestamp: new Date()
      });
      this.autoSaveSession(chat);
      this.chatInput = '';
      this.pendingSuggestions = [];
      this.shouldScrollToBottom = true;

      // Build context with current section fields for the agent
      const agentKey = this.agentIdMap[this.activeAgentId];
      const group = this.signOffGroups.find(g => g.id === this.activeAgentId);
      const sectionContext = this.buildAgentContext(group);

      const fullPrompt = sectionContext
         ? `[Context: Reviewing NPA sections ${group?.sections.join(', ')}]\n\n${sectionContext}\n\nUser question: ${userMessage}`
         : userMessage;

      // Use DifyService for real agent call with streaming
      chat.isStreaming = true;
      chat.streamText = '';

      this.difyService.sendMessageStreamed(fullPrompt, {}, agentKey).subscribe({
         next: (event) => {
            if (event.type === 'chunk') {
               chat.streamText += event.text || '';
               this.shouldScrollToBottom = true;
               this.cdr.detectChanges();
            }
         },
         error: (err) => {
            console.warn(`[AgentChat] Agent ${agentKey} error:`, err.message);
            chat.messages.push({
               role: 'system',
               content: `Agent ${this.getActiveGroup().shortLabel} is not connected. Create the "${this.getAgentDifyAppName()}" Chatflow app on Dify, then add the API key to server/.env as DIFY_KEY_${agentKey}.`,
               timestamp: new Date()
            });
            chat.isStreaming = false;
            chat.streamText = '';
            this.shouldScrollToBottom = true;
            this.autoSaveSession(chat);
            this.cdr.detectChanges();
         },
         complete: () => {
            if (chat.streamText.trim()) {
               // Parse @@NPA_META@@ field suggestions from response
               const { cleanText, suggestions } = this.parseNpaMeta(chat.streamText);
               chat.messages.push({
                  role: 'agent',
                  content: cleanText,
                  timestamp: new Date()
               });
               if (suggestions.length > 0) {
                  this.pendingSuggestions = suggestions;
               }
            }
            chat.isStreaming = false;
            chat.streamText = '';
            chat.isConnected = true;
            this.shouldScrollToBottom = true;
            this.autoSaveSession(chat);
            this.cdr.detectChanges();
         }
      });
   }

   /** Auto-ask the agent about a specific field */
   askAboutField(field: FieldState): void {
      this.chatInput = `Help me fill the "${field.label}" field. What should the value be based on the product context?`;
      this.sendChatMessage();
   }

   /** Apply a field suggestion from agent response */
   onApplySuggestion(suggestion: FieldSuggestion): void {
      this.applySuggestion.emit(suggestion);
      // Remove applied suggestion from pending list
      this.pendingSuggestions = this.pendingSuggestions.filter(s => s.fieldKey !== suggestion.fieldKey);
      // Add confirmation message
      const chat = this.agentChats.get(this.activeAgentId);
      if (chat) {
         chat.messages.push({
            role: 'system',
            content: `Applied suggestion for "${suggestion.label || suggestion.fieldKey}".`,
            timestamp: new Date()
         });
         this.shouldScrollToBottom = true;
         this.autoSaveSession(chat);
         this.cdr.detectChanges();
      }
   }

   /** Apply all pending suggestions */
   applyAllSuggestions(): void {
      for (const s of this.pendingSuggestions) {
         this.applySuggestion.emit(s);
      }
      const count = this.pendingSuggestions.length;
      this.pendingSuggestions = [];
      const chat = this.agentChats.get(this.activeAgentId);
      if (chat) {
         chat.messages.push({
            role: 'system',
            content: `Applied ${count} field suggestion${count > 1 ? 's' : ''}.`,
            timestamp: new Date()
         });
         this.shouldScrollToBottom = true;
         this.autoSaveSession(chat);
         this.cdr.detectChanges();
      }
   }

   private autoSaveSession(chat: AgentChat): void {
      if (!chat.messages.length) return;

      const prevSessionId = this.chatSessionService.activeSessionId();
      this.chatSessionService.setActiveSession(chat.sessionId || null);

      chat.sessionId = this.chatSessionService.saveSession(
         chat.messages.map(m => ({
            role: m.role === 'system' ? 'agent' : m.role,
            content: m.content,
            timestamp: m.timestamp
         })),
         this.agentIdMap[this.activeAgentId] || this.activeAgentId
      );

      this.chatSessionService.setActiveSession(prevSessionId);
   }


   // ─── Meta Parsing ─────────────────────────────────────

   /** Parse @@NPA_META@@{...} from agent response text */
   private parseNpaMeta(text: string): { cleanText: string; suggestions: FieldSuggestion[] } {
      const metaPattern = /@@NPA_META@@(\{[\s\S]*?\})(?:@@END_META@@)?/g;
      const suggestions: FieldSuggestion[] = [];
      let cleanText = text;

      let match: RegExpExecArray | null;
      while ((match = metaPattern.exec(text)) !== null) {
         try {
            const meta = JSON.parse(match[1]);
            // Support both single field and array of fields
            const fields = meta.fields || (meta.field_key ? [meta] : []);
            for (const f of fields) {
               if (f.field_key && f.value !== undefined) {
                  suggestions.push({
                     fieldKey: f.field_key,
                     label: f.label || f.field_key,
                     value: String(f.value),
                     confidence: f.confidence
                  });
               }
            }
         } catch (e) {
            console.warn('[AgentChat] Failed to parse @@NPA_META@@:', e);
            this.tryExtractFieldsFromBrokenJson(match[1], suggestions);
         }
         cleanText = cleanText.replace(match[0], '').trim();
      }

      return { cleanText, suggestions };
   }

   /** Fallback: extract individual field objects from malformed/truncated JSON */
   private tryExtractFieldsFromBrokenJson(jsonStr: string, suggestions: FieldSuggestion[]): void {
      const fieldPattern = /\{\s*"field_key"\s*:\s*"([^"]+)"\s*,\s*"label"\s*:\s*"([^"]*)"\s*,\s*"value"\s*:\s*"((?:[^"\\]|\\.)*)"\s*(?:,\s*"confidence"\s*:\s*([\d.]+))?\s*\}/g;
      let fieldMatch: RegExpExecArray | null;
      let recovered = 0;
      while ((fieldMatch = fieldPattern.exec(jsonStr)) !== null) {
         suggestions.push({
            fieldKey: fieldMatch[1],
            label: fieldMatch[2] || fieldMatch[1],
            value: fieldMatch[3].replace(/\\"/g, '"').replace(/\\n/g, '\n'),
            confidence: fieldMatch[4] ? parseFloat(fieldMatch[4]) : undefined
         });
         recovered++;
      }
      if (recovered > 0) {
         console.log(`[AgentChat] Fallback parser recovered ${recovered} fields from malformed JSON`);
      }
   }

   /** Get the Dify app name for the active agent (for error messages) */
   private getAgentDifyAppName(): string {
      const names: Record<SignOffGroupId, string> = {
         BIZ: 'CF_NPA_BIZ',
         TECH_OPS: 'CF_NPA_TECH_OPS',
         FINANCE: 'CF_NPA_FINANCE',
         RMG: 'CF_NPA_RMG',
         LCS: 'CF_NPA_LCS'
      };
      return names[this.activeAgentId];
   }

   /** Build a summary of current field values in the agent's sections for context */
   private buildAgentContext(group: SignOffGroup | undefined): string {
      if (!group) return '';
      const lines: string[] = [];
      for (const sectionId of group.sections) {
         const groups = this.sectionFieldGroups.get(sectionId) || [];
         for (const g of groups) {
            const filled = g.fields.filter(f => f.value && f.value.trim());
            if (filled.length > 0) {
               lines.push(`### ${g.topic}`);
               for (const f of filled) {
                  lines.push(`- **${f.label}**: ${f.value.substring(0, 200)}${f.value.length > 200 ? '...' : ''}`);
               }
            }
         }
      }
      return lines.length > 0 ? `Current field values:\n${lines.join('\n')}` : '';
   }

   private scrollToBottom(): void {
      try {
         if (this.chatContainer) {
            this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
         }
      } catch (err) { }
   }

   trackByMsgIndex(index: number, _msg: ChatMessage): number {
      return index;
   }
}
