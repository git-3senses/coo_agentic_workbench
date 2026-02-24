import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { SharedIconsModule } from '../../shared/icons/shared-icons.module';
import { DifyService, StreamEvent } from '../../services/dify/dify.service';

type ChatMsg = { role: 'user' | 'agent'; content: string; streaming?: boolean; ts: number };

@Component({
  selector: 'app-knowledge-doc',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedIconsModule],
  template: `
  <div class="h-full w-full flex flex-col bg-slate-50">
    <!-- Header -->
    <header class="flex-none bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <button (click)="router.navigate(['/knowledge/base'])"
          class="p-2 rounded-lg hover:bg-slate-100 text-slate-600">
          <lucide-icon name="arrow-left" class="w-5 h-5"></lucide-icon>
        </button>
        <div>
          <div class="text-xs text-slate-500">Knowledge & Evidence / Knowledge Base</div>
          <div class="text-lg font-bold text-slate-900 leading-tight">{{ doc?.title || docId }}</div>
          <div class="text-xs text-slate-500 mt-0.5">{{ doc?.doc_type || '' }} <span *ngIf="doc?.display_date">• {{ doc.display_date }}</span></div>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <input #fileInput type="file" accept="application/pdf"
          class="hidden" (change)="onUploadFile($event)">
        <button (click)="fileInput.click()"
          class="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold">
          <lucide-icon name="upload" class="w-4 h-4"></lucide-icon>
          Upload PDF
        </button>
        <button *ngIf="doc?.source_url" (click)="openSource()"
          class="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold">
          <lucide-icon name="external-link" class="w-4 h-4"></lucide-icon>
          Open Source
        </button>
      </div>
    </header>

    <!-- Split view -->
    <div class="flex-1 min-h-0 flex">
      <!-- Left: PDF -->
      <section class="w-1/2 min-w-0 border-r border-slate-200 bg-white flex flex-col">
        <div class="flex-none px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <div class="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <lucide-icon name="file-text" class="w-4 h-4 text-slate-500"></lucide-icon>
            Document Viewer
          </div>
          <div class="text-xs text-slate-500" *ngIf="doc?.filename">{{ doc.filename }}</div>
        </div>

        <div class="flex-1 min-h-0">
          <div *ngIf="!pdfUrl && !doc?.source_url" class="h-full flex items-center justify-center text-center p-8">
            <div class="max-w-sm">
              <div class="w-12 h-12 rounded-xl bg-slate-100 mx-auto flex items-center justify-center mb-4">
                <lucide-icon name="help-circle" class="w-6 h-6 text-slate-500"></lucide-icon>
              </div>
              <div class="text-sm font-semibold text-slate-800">No PDF uploaded yet</div>
              <div class="text-xs text-slate-500 mt-1">Upload a PDF to view it here and chat against it.</div>
            </div>
          </div>

          <iframe *ngIf="pdfUrl" class="w-full h-full" [src]="pdfUrl"></iframe>

          <div *ngIf="!pdfUrl && doc?.source_url" class="h-full flex items-center justify-center text-center p-8">
            <div class="max-w-sm">
              <div class="w-12 h-12 rounded-xl bg-slate-100 mx-auto flex items-center justify-center mb-4">
                <lucide-icon name="link2" class="w-6 h-6 text-slate-500"></lucide-icon>
              </div>
              <div class="text-sm font-semibold text-slate-800">External official source</div>
              <div class="text-xs text-slate-500 mt-1">Some government sites block embedding. Use “Open Source”.</div>
            </div>
          </div>
        </div>
      </section>

      <!-- Right: Chat -->
      <section class="w-1/2 min-w-0 bg-white flex flex-col">
        <div class="flex-none px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <div class="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <lucide-icon name="message-square" class="w-4 h-4 text-slate-500"></lucide-icon>
            Ask an Agent
          </div>
          <div class="flex items-center gap-2">
            <label class="text-xs text-slate-500">Agent</label>
            <select [(ngModel)]="selectedAgent"
              class="text-xs border border-slate-200 rounded-md px-2 py-1 bg-white">
              <option value="KB_SEARCH">KB Search</option>
              <option value="DILIGENCE">Diligence</option>
              <option value="MASTER_COO">Master COO</option>
            </select>
          </div>
        </div>

        <div class="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
          <div *ngFor="let m of messages"
            class="max-w-[92%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap"
            [class.ml-auto]="m.role==='user'"
            [class.bg-slate-900]="m.role==='user'"
            [class.text-white]="m.role==='user'"
            [class.bg-slate-50]="m.role==='agent'"
            [class.text-slate-800]="m.role==='agent'">
            <div [class.opacity-80]="m.streaming">{{ m.content }}</div>
          </div>

          <div *ngIf="isThinking" class="text-xs text-slate-500 flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            Agent is thinking…
          </div>
        </div>

        <div class="flex-none border-t border-slate-200 p-3">
          <div class="flex items-end gap-2">
            <textarea [(ngModel)]="userInput" rows="2"
              (keydown.enter)="onEnter($event)"
              placeholder="Ask questions about this document…"
              class="flex-1 resize-none border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"></textarea>
            <button (click)="send()" [disabled]="!userInput.trim() || isThinking"
              class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-semibold">
              Send
            </button>
          </div>
          <div class="text-[11px] text-slate-400 mt-2">
            Tip: Upload the same PDF into your Dify Dataset for best grounded answers.
          </div>
        </div>
      </section>
    </div>
  </div>
  `
})
export class KnowledgeDocComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  router = inject(Router);
  private http = inject(HttpClient);
  private sanitizer = inject(DomSanitizer);
  private dify = inject(DifyService);

  docId = '';
  doc: any = null;
  pdfUrl: SafeResourceUrl | null = null;
  private objectUrl: string | null = null;

  selectedAgent: 'KB_SEARCH' | 'DILIGENCE' | 'MASTER_COO' = 'KB_SEARCH';
  messages: ChatMsg[] = [];
  userInput = '';
  isThinking = false;

  ngOnInit() {
    this.docId = String(this.route.snapshot.paramMap.get('id') || '');
    this.loadDoc();
  }

  ngOnDestroy(): void {
    this.revokeObjectUrl();
  }

  private revokeObjectUrl(): void {
    if (this.objectUrl) {
      try { URL.revokeObjectURL(this.objectUrl); } catch { /* ignore */ }
      this.objectUrl = null;
    }
  }

  private loadDoc() {
    this.http.get<any>(`/api/kb/${encodeURIComponent(this.docId)}`).subscribe({
      next: (doc) => {
        this.doc = doc;
        // Important: do NOT iframe directly to /api/kb/:id/file because the Authorization
        // header from our JWT interceptor is not attached to <iframe> requests.
        // Instead, fetch as a blob via HttpClient (auth header included), then display
        // using a safe object URL.
        if (doc?.file_path) this.loadPdfBlob();
        else {
          this.revokeObjectUrl();
          this.pdfUrl = null;
        }
      },
      error: () => {
        this.doc = null;
        this.revokeObjectUrl();
        this.pdfUrl = null;
      }
    });
  }

  private loadPdfBlob(): void {
    const url = `/api/kb/${encodeURIComponent(this.docId)}/file`;
    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        this.revokeObjectUrl();
        this.objectUrl = URL.createObjectURL(blob);
        this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.objectUrl);
      },
      error: (err) => {
        this.revokeObjectUrl();
        this.pdfUrl = null;
        const msg = err?.error?.error || err?.message || 'Failed to load PDF';
        this.messages.push({
          role: 'agent',
          content: `Document viewer error: ${String(msg)}\n\nIf this is a permissions issue, please log in again and retry.`,
          ts: Date.now()
        });
      }
    });
  }

  openSource() {
    if (!this.doc?.source_url) return;
    window.open(String(this.doc.source_url), '_blank', 'noopener,noreferrer');
  }

  onEnter(ev: Event) {
    const kev = ev as KeyboardEvent;
    if (kev.shiftKey) return;
    kev.preventDefault();
    this.send();
  }

  send() {
    const q = this.userInput.trim();
    if (!q || this.isThinking) return;
    this.userInput = '';

    const docTitle = this.doc?.title || this.docId;
    const contextPrefix =
      `Context (KB doc): ${docTitle} (doc_id: ${this.docId}). ` +
      `Answer strictly based on the document content available in the KB; if not found, say what is missing.`;

    this.messages.push({ role: 'user', content: q, ts: Date.now() });
    const agentMsg: ChatMsg = { role: 'agent', content: '', streaming: true, ts: Date.now() };
    this.messages.push(agentMsg);

    this.isThinking = true;

    const inputs = { kb_doc_id: this.docId, kb_doc_title: docTitle };
    const obs = this.dify.sendMessageStreamed(`${contextPrefix}\n\nUser question: ${q}`, inputs, this.selectedAgent);

    let sub: any;
    sub = obs.subscribe({
      next: (evt: StreamEvent) => {
        if (evt.type === 'chunk') {
          agentMsg.content += evt.text;
        } else if (evt.type === 'done') {
          agentMsg.content = evt.response.answer || agentMsg.content || '(no answer)';
          agentMsg.streaming = false;
          this.isThinking = false;
          sub?.unsubscribe?.();
        }
      },
      error: (e: any) => {
        agentMsg.content = `Error contacting agent: ${e?.message || 'unknown error'}`;
        agentMsg.streaming = false;
        this.isThinking = false;
        sub?.unsubscribe?.();
      }
    });
  }

  onUploadFile(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    if (!file) return;

    const form = new FormData();
    form.append('file', file);
    form.append('doc_id', this.docId || '');
    form.append('title', this.doc?.title || file.name.replace(/\.pdf$/i, ''));
    form.append('description', this.doc?.description || '');
    form.append('doc_type', this.doc?.doc_type || 'REGULATORY');
    form.append('ui_category', this.doc?.ui_category || '');
    form.append('agent_target', this.doc?.agent_target || '');
    form.append('icon_name', this.doc?.icon_name || 'file-text');
    form.append('display_date', this.doc?.display_date || '');
    form.append('visibility', this.doc?.visibility || 'INTERNAL');
    if (this.doc?.source_url) form.append('source_url', String(this.doc.source_url));

    this.http.post<any>('/api/kb/upload', form).subscribe({
      next: () => {
        input.value = '';
        this.loadDoc();
      },
      error: () => {
        input.value = '';
        alert('Upload failed. Ensure you are logged in and the server has multer installed.');
      }
    });
  }
}
