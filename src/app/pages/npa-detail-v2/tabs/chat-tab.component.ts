import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { SharedIconsModule } from '../../../shared/icons/shared-icons.module';
import { ChatMessage } from '../models/npa-detail.models';

@Component({
  selector: 'app-chat-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, SharedIconsModule],
  templateUrl: './chat-tab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatTabComponent {
  @Input() messages: ChatMessage[] = [];
  @Output() messageSent = new EventEmitter<string>();

  chatInput = '';

  sendChat(): void {
    if (!this.chatInput.trim()) return;
    this.messageSent.emit(this.chatInput.trim());
    this.chatInput = '';
  }
}
