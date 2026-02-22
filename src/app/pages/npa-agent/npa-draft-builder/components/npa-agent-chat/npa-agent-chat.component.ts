import { Component, EventEmitter, Input, Output, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedIconsModule } from '../../../../../shared/icons/shared-icons.module';
import { DifyService } from '../../../../../services/dify/dify.service';
import {
   SignOffGroup,
   SignOffGroupId,
   SIGN_OFF_GROUPS,
   AgentChat,
   ChatMessage,
   FieldState
} from '../../npa-draft-builder.component';

@Component({
   selector: 'app-npa-agent-chat',
   standalone: true,
   imports: [CommonModule, FormsModule, SharedIconsModule],
   templateUrl: './npa-agent-chat.component.html',
   styleUrls: ['./npa-agent-chat.component.css']
})
export class NpaAgentChatComponent {
   @Input() signOffGroups: SignOffGroup[] = SIGN_OFF_GROUPS;
   @Input() activeAgentId: SignOffGroupId = 'BIZ';
   @Input() agentChats = new Map<SignOffGroupId, AgentChat>();
   @Input() sectionFieldGroups = new Map<string, { topic: string; numbering: string; guidance?: string; fields: FieldState[] }[]>();

   @Output() agentSelected = new EventEmitter<SignOffGroupId>();
   @Output() messageSent = new EventEmitter<{ agentId: SignOffGroupId; message: string; context: string }>();
   @Output() autoFillRequested = new EventEmitter<void>();
   @Output() validateRequested = new EventEmitter<void>();

   private cdr = inject(ChangeDetectorRef);
   private difyService = inject(DifyService);

   chatInput = '';

   /** Maps Draft Builder sign-off groups to Dify agent registry keys */
   private readonly agentIdMap: Record<SignOffGroupId, string> = {
      BIZ: 'AG_NPA_BIZ',
      TECH_OPS: 'AG_NPA_TECH_OPS',
      FINANCE: 'AG_NPA_FINANCE',
      RMG: 'AG_NPA_RMG',
      LCS: 'AG_NPA_LCS'
   };

   selectAgent(agentId: SignOffGroupId): void {
      this.activeAgentId = agentId;
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
      this.chatInput = '';

      // Build context with current section fields for the agent
      const agentKey = this.agentIdMap[this.activeAgentId];
      const group = this.signOffGroups.find(g => g.id === this.activeAgentId);
      const sectionContext = this.buildAgentContext(group);

      const fullPrompt = sectionContext
         ? `[Context: Reviewing sections ${group?.sections.join(', ')}]\n\n${sectionContext}\n\nUser question: ${userMessage}`
         : userMessage;

      // Use DifyService for real agent call with streaming
      chat.isStreaming = true;
      chat.streamText = '';

      this.difyService.sendMessageStreamed(fullPrompt, {}, agentKey).subscribe({
         next: (event) => {
            if (event.type === 'chunk') {
               chat.streamText += event.text || '';
               this.cdr.detectChanges();
            }
         },
         error: (err) => {
            console.warn(`[AgentChat] Agent ${agentKey} error:`, err.message);
            chat.messages.push({
               role: 'agent',
               content: `[Agent ${agentKey} unavailable] I'll provide guidance based on my knowledge of sections ${group?.sections.join(', ')}. Please ensure the fields are filled according to the NPA template requirements. For detailed analysis, reconnect the agent.`,
               timestamp: new Date()
            });
            chat.isStreaming = false;
            chat.streamText = '';
            this.cdr.detectChanges();
         },
         complete: () => {
            if (chat.streamText.trim()) {
               chat.messages.push({
                  role: 'agent',
                  content: chat.streamText,
                  timestamp: new Date()
               });
            }
            chat.isStreaming = false;
            chat.streamText = '';
            this.cdr.detectChanges();
         }
      });
   }

   /** Auto-ask the agent about a specific field */
   askAboutField(field: FieldState): void {
      this.chatInput = `Help me fill the "${field.label}" field. What should the value be based on the product context?`;
      this.sendChatMessage();
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

   trackByMsgIndex(index: number, _msg: ChatMessage): number {
      return index;
   }
}
