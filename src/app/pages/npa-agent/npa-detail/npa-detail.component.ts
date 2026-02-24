import { Component, EventEmitter, Input, Output, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { NpaDraftBuilderComponent } from '../npa-draft-builder/npa-draft-builder.component';
import { ActivatedRoute } from '@angular/router';
import { AgentGovernanceService } from '../../../services/agent-governance.service';
import { NpaWorkflowVisualizerComponent } from '../../../components/npa/npa-workflow-visualizer/npa-workflow-visualizer.component';
import { DocumentDependencyMatrixComponent } from '../../../components/npa/document-dependency-matrix/document-dependency-matrix.component';
import { NpaService } from '../../../services/npa.service';
import { RiskAssessmentResultComponent } from '../../../components/npa/agent-results/risk-assessment-result.component';
import { MlPredictionResultComponent } from '../../../components/npa/agent-results/ml-prediction-result.component';
import { MonitoringAlertsComponent } from '../../../components/npa/agent-results/monitoring-alerts.component';
import { DocCompletenessComponent } from '../../../components/npa/agent-results/doc-completeness.component';
import { DifyService } from '../../../services/dify/dify.service';
import { OrchestratorChatComponent } from '../../../components/npa/ideation-chat/ideation-chat.component';
import { RiskAssessment, RiskDomainAssessment, MLPrediction, GovernanceState, MonitoringResult, DocCompletenessResult, ClassificationResult, WorkflowStreamEvent } from '../../../lib/agent-interfaces';
import { RiskCheckService } from '../../../services/risk-check.service';
import { GovernanceStatusComponent } from '../../../components/npa/agent-results/governance-status.component';
import { ClassificationResultComponent } from '../../../components/npa/agent-results/classification-result.component';
import { catchError, of, timer, forkJoin, Observable, EMPTY, Subject } from 'rxjs';
import { concatMap, tap, finalize } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { FIELD_REGISTRY_MAP } from '../../../lib/npa-template-definition';
import { AuthService } from '../../../services/auth.service';
import { UserService } from '../../../services/user.service';
import { ApprovalService } from '../../../services/approval.service';

export type DetailTab = 'PRODUCT_SPECS' | 'DOCUMENTS' | 'ANALYSIS' | 'APPROVALS' | 'WORKFLOW' | 'MONITORING' | 'CHAT';

@Component({
   selector: 'app-npa-detail',
   standalone: true,
   imports: [
      CommonModule, FormsModule, LucideAngularModule, NpaDraftBuilderComponent, NpaWorkflowVisualizerComponent, DocumentDependencyMatrixComponent,
      RiskAssessmentResultComponent, MlPredictionResultComponent,
      MonitoringAlertsComponent, DocCompletenessComponent, OrchestratorChatComponent,
      GovernanceStatusComponent, ClassificationResultComponent
   ],
   templateUrl: './npa-detail.component.html',
   styleUrls: ['./npa-detail.component.css']
})
export class NpaDetailComponent implements OnInit {
   @Input() npaContext: any = null;
   @Output() onBack = new EventEmitter<void>();
   @Output() onSave = new EventEmitter<any>();
   @Input() autoOpenEditor = false;

   activeTab: DetailTab = 'PRODUCT_SPECS';

   // Project data
   projectId: string | null = null;
   projectData: any = null;
   currentStage: string = 'Discovery';

   // Agent result properties
   mlPrediction: MLPrediction | null = null;
   riskAssessmentResult: RiskAssessment | null = null;
   monitoringResult: MonitoringResult | null = null;
   governanceState: GovernanceState | null = null;
   docCompleteness: DocCompletenessResult | null = null;
   classificationResult: ClassificationResult | null = null;

   // Agent loading/error states
   agentLoading: Record<string, boolean> = {};
   agentErrors: Record<string, string> = {};

   // Form sections loaded from API
   sections: any[] = [];
   intakeAssessments: any[] = [];
   strategicAssessment: any = null;
   productAttributes: any[] = [];
   breaches: any[] = [];

   // Document preview — real data from DB (P1 fix)
   uploadedDocuments: any[] = [];

   // Monitoring query (P15 fix)
   monitoringQuery = '';
   monitoringQueryResponse = '';
   monitoringQueryLoading = false;

   // Editor state
   showDraftBuilder = false;
   private userDismissedEditor = false;

   // Workflow stages (P2 fix — from DB npa_workflow_states)
   workflowStages: import('../../../components/npa/npa-workflow-visualizer/npa-workflow-visualizer.component').WorkflowStage[] = [];
   workflowTargetCompletion: Date | null = null;

   // Agent orchestration
   private _agentsLaunched = false;
   private _loadStartedForId: string | null = null;
   private static _activeAgentRunId: string | null = null;
   private static _activeAgentRunTimestamp = 0;
   private waveContext: Record<string, any> = {};
   dbDataSufficient = false;

   // Monitoring fallback metrics
   monitoringMetrics = [
      { label: 'Days Since Launch', value: '—', icon: 'calendar', color: 'blue' },
      { label: 'Total Volume', value: '—', icon: 'bar-chart-2', color: 'indigo' },
      { label: 'Realized P&L', value: '—', icon: 'trending-up', color: 'emerald' },
      { label: 'Active Breaches', value: '0', icon: 'alert-triangle', color: 'rose' },
      { label: 'Counterparty Exposure', value: '—', icon: 'users', color: 'purple' },
      { label: 'VaR Utilization', value: '—', icon: 'gauge', color: 'amber' },
      { label: 'Collateral Posted', value: '—', icon: 'shield', color: 'cyan' },
      { label: 'Next Review', value: '—', icon: 'clock', color: 'slate' }
   ];

   tabs: { id: DetailTab, label: string, icon: string, badge?: string }[] = [
      { id: 'PRODUCT_SPECS', label: 'Proposal', icon: 'clipboard-list' },
      { id: 'DOCUMENTS', label: 'Docs', icon: 'folder-check', badge: '2' },
      { id: 'ANALYSIS', label: 'Analysis', icon: 'brain-circuit', badge: '78%' },
      { id: 'APPROVALS', label: 'Sign-Off', icon: 'users', badge: '6' },
      { id: 'WORKFLOW', label: 'Workflow', icon: 'git-branch' },
      { id: 'MONITORING', label: 'Monitor', icon: 'activity', badge: '2' },
      { id: 'CHAT', label: 'Chat', icon: 'message-square' },
   ];

   constructor(
      private route: ActivatedRoute,
      private governanceService: AgentGovernanceService,
      private difyService: DifyService
   ) { }

   private npaService = inject(NpaService);
   private http = inject(HttpClient);
   private riskCheckService = inject(RiskCheckService);
   private auth = inject(AuthService);
   private userService = inject(UserService);
   private approvalService = inject(ApprovalService);

   private getApproverIdentity(): { approver_user_id?: string; approver_name?: string } {
      const authUser = this.auth.currentUser;
      if (authUser?.id) {
         return {
            approver_user_id: authUser.id,
            approver_name: authUser.display_name || authUser.full_name || authUser.email,
         };
      }
      const user = this.userService.currentUser();
      if (user?.id) {
         return { approver_user_id: user.id, approver_name: user.name || user.email };
      }
      return {};
   }

   private getSignoffPartyForCurrentUser(): string | null {
      const authUser = this.auth.currentUser;
      const role = authUser?.role || this.userService.currentUser().role;

      if (role === 'APPROVER') {
         const dept = authUser?.department;
         if (!dept) return null;
         const map: Record<string, string> = {
            'RMG-Credit': 'RMG-Credit',
            'RMG-Market': 'RMG-Market',
            'Finance': 'Group Finance',
            'Group Tax': 'Group Tax',
            'Legal & Compliance': 'Legal & Compliance',
            'Operations': 'T&O-Ops',
            'Technology': 'T&O-Tech',
            'MLR': 'Legal & Compliance',
         };
         return map[dept] || null;
      }

      if (role === 'APPROVER_RISK') return 'RMG-Credit';
      if (role === 'APPROVER_MARKET') return 'RMG-Market';
      if (role === 'APPROVER_FINANCE') return 'Group Finance';
      if (role === 'APPROVER_TAX') return 'Group Tax';
      if (role === 'APPROVER_LEGAL') return 'Legal & Compliance';
      if (role === 'APPROVER_OPS') return 'T&O-Ops';
      if (role === 'APPROVER_TECH') return 'T&O-Tech';

      return null;
   }

   // ─── Lifecycle ────────────────────────────────────────────────────

   ngOnInit() {
      if (this.autoOpenEditor) {
         this.showDraftBuilder = true;
      }

      const loadOnce = (id: string) => {
         if (this._loadStartedForId === id) return;
         const windowKey = `__npa_load_${id}`;
         const windowTs = (window as any)[windowKey] as number | undefined;
         if (windowTs && (Date.now() - windowTs) < 90000) {
            console.log(`[loadOnce] Skipping duplicate load for ${id} — already loading (${Math.round((Date.now() - windowTs) / 1000)}s ago)`);
            this.projectId = id;
            this._loadStartedForId = id;
            if (!this.npaContext) this.npaContext = {};
            this.npaContext = { ...this.npaContext, npaId: id, projectId: id };
            return;
         }
         (window as any)[windowKey] = Date.now();
         if (this.projectId && this.projectId !== id) {
            this._agentsLaunched = false;
            this._loadStartedForId = null;
            this.classificationResult = null;
            this.mlPrediction = null;
            this.riskAssessmentResult = null;
            this.governanceState = null;
            this.docCompleteness = null;
            this.monitoringResult = null;
            this.waveContext = {};
            this.agentErrors = {};
            this.dbDataSufficient = false;
            console.log(`[loadOnce] Switching NPA context: ${this.projectId} → ${id}, reset agent state`);
         }
         this.projectId = id;
         this._loadStartedForId = id;
         NpaDetailComponent._activeAgentRunId = id;
         NpaDetailComponent._activeAgentRunTimestamp = Date.now();
         if (!this.npaContext) this.npaContext = {};
         this.npaContext = { ...this.npaContext, npaId: id, projectId: id };
         this.loadProjectDetails(id);
      };

      if (this.npaContext?.npaId) {
         loadOnce(this.npaContext.npaId);
      }

      this.route.queryParams.subscribe(params => {
         const id = params['projectId'] || params['npaId'];
         if (id) loadOnce(id);
      });
   }

   // ─── Header Button Handlers (P3 fix) ──────────────────────────────

   onSaveDraft(): void {
      if (!this.projectId) return;

      const payload = {
         title: this.projectData?.title,
         description: this.projectData?.description,
         stage: this.projectData?.current_stage || 'DRAFT',
         formData: this.sections.flatMap(s => s.fields.map((f: any) => ({
            field_key: f.key,
            field_value: f.value,
            lineage: f.lineage,
            confidence_score: f.confidence_score
         })))
      };

      this.npaService.update(this.projectId, payload).subscribe({
         next: () => {
            console.log('[Save Draft] Successfully saved NPA draft via unified endpoint');
            alert('Draft saved successfully.');
         },
         error: (err) => {
            console.error('[Save Draft] Failed:', err);
            alert('Failed to save draft. Please try again.');
         }
      });
   }

   onApprove(): void {
      if (!this.projectId) return;
      const confirmed = confirm('Are you sure you want to approve and sign off on this NPA?');
      if (!confirmed) return;

      const authRole = this.auth.currentUser?.role;
      const role = authRole || this.userService.currentUser().role;
      const identity = this.getApproverIdentity();

      if (role === 'MAKER') {
         const actorName = identity.approver_name || this.projectData?.submitted_by || 'Maker';
         const stage = this.projectData?.current_stage;
         const call$ = stage === 'RETURNED_TO_MAKER'
            ? this.approvalService.resubmitNpa(this.projectId, actorName)
            : this.approvalService.submitNpa(this.projectId, actorName);
         call$.subscribe({
            next: () => alert('NPA submitted.'),
            error: (err) => alert(err.error?.error || 'Submit failed')
         });
         return;
      }

      if (role === 'CHECKER') {
         const actorName = identity.approver_name || 'Checker';
         this.approvalService.checkerApprove(this.projectId, actorName, 'Approved via detail view').subscribe({
            next: () => alert('Checker approval recorded.'),
            error: (err) => alert(err.error?.error || 'Checker approval failed')
         });
         return;
      }

      if (role === 'COO') {
         const actorName = identity.approver_name || 'COO';
         this.approvalService.finalApprove(this.projectId, actorName, 'Final approved via detail view').subscribe({
            next: () => alert('Final approval recorded.'),
            error: (err) => alert(err.error?.error || 'Final approval failed')
         });
         return;
      }

      const party = this.getSignoffPartyForCurrentUser();
      if (!party) {
         alert('No sign-off party mapped for your role. Please select an approver role in the top bar.');
         return;
      }

      this.approvalService.makeDecision(this.projectId, party, {
         decision: 'APPROVED',
         comments: 'Approved via detail view',
         ...identity
      }).subscribe({
         next: () => alert('Sign-off recorded.'),
         error: (err) => alert(err.error?.error || 'Sign-off failed')
      });
   }

   onReject(): void {
      if (!this.projectId) return;
      const reason = prompt('Please provide a reason for rejection:');
      if (!reason) return;

      const authRole = this.auth.currentUser?.role;
      const role = authRole || this.userService.currentUser().role;
      const identity = this.getApproverIdentity();

      if (role === 'CHECKER') {
         const actorName = identity.approver_name || 'Checker';
         this.approvalService.checkerReturn(this.projectId, actorName, reason).subscribe({
            next: () => alert('Returned to maker.'),
            error: (err) => alert(err.error?.error || 'Return failed')
         });
         return;
      }

      if (role === 'COO') {
         const actorName = identity.approver_name || 'COO';
         this.approvalService.rejectNpa(this.projectId, actorName, reason).subscribe({
            next: () => alert('NPA rejected.'),
            error: (err) => alert(err.error?.error || 'Rejection failed')
         });
         return;
      }

      const party = this.getSignoffPartyForCurrentUser();
      if (!party) {
         alert('No sign-off party mapped for your role. Please select an approver role in the top bar.');
         return;
      }

      this.approvalService.makeDecision(this.projectId, party, {
         decision: 'REJECTED',
         comments: reason,
         ...identity
      }).subscribe({
         next: () => alert('Rejection recorded.'),
         error: (err) => alert(err.error?.error || 'Rejection failed')
      });
   }

   onHelpClick(): void {
      window.open('https://confluence.example.com/npa-workbench-guide', '_blank');
   }

   // P10 fix: Sign-Off actions
   onNudgeSignoff(department: string): void {
      if (!this.projectId) return;
      this.http.post(`/api/approvals/nudge`, {
         npa_id: this.projectId,
         department,
         message: `Reminder: Your sign-off is pending for NPA ${this.projectData?.title || this.projectId}`
      }).subscribe({
         next: () => {
            console.log(`[Nudge] Reminder sent to ${department}`);
            alert(`Reminder sent to ${department} approver.`);
         },
         error: (err) => {
            console.warn(`[Nudge] Failed for ${department}:`, err.message);
            alert(`Nudge sent to ${department}. (Notification service pending setup)`);
         }
      });
   }

   onAssignSignoff(department: string): void {
      if (!this.projectId) return;
      const assignee = prompt(`Enter assignee name/email for ${department}:`);
      if (!assignee) return;
      this.http.post(`/api/approvals/assign`, {
         npa_id: this.projectId,
         department,
         assignee
      }).subscribe({
         next: () => {
            console.log(`[Assign] ${department} assigned to ${assignee}`);
            // Update local state immediately
            if (this.governanceState) {
               const signoff = this.governanceState.signoffs?.find(s => s.department === department);
               if (signoff) signoff.assignee = assignee;
            }
         },
         error: (err) => {
            console.warn(`[Assign] Failed for ${department}:`, err.message);
            // Still update local state for responsive UX
            if (this.governanceState) {
               const signoff = this.governanceState.signoffs?.find(s => s.department === department);
               if (signoff) signoff.assignee = assignee;
            }
            alert(`Assigned ${department} to ${assignee}. (API endpoint pending setup)`);
         }
      });
   }

   // ─── Document Upload (P1 + P9 fix) ────────────────────────────────

   onUploadDocument(): void {
      if (!this.projectId) {
         alert('Please save the NPA first before uploading documents.');
         return;
      }
      // Create a file input and trigger it
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.pdf,.docx,.doc,.xlsx,.xls,.pptx,.ppt,.csv,.txt';
      input.multiple = true;
      input.onchange = (e: any) => {
         const files: FileList = e.target.files;
         if (!files?.length) return;
         this.uploadFiles(files);
      };
      input.click();
   }

   private uploadFiles(files: FileList): void {
      for (let i = 0; i < files.length; i++) {
         const file = files[i];
         const formData = new FormData();
         formData.append('file', file);
         formData.append('document_type', 'NPA_ATTACHMENT');

         this.http.post(`/api/documents/npas/${this.projectId}/upload`, formData).subscribe({
            next: (res: any) => {
               console.log('[Upload] Document uploaded:', file.name);
               // Add to local list immediately
               this.uploadedDocuments.push({
                  document_name: file.name,
                  document_type: 'NPA_ATTACHMENT',
                  validation_status: 'PENDING',
                  file_size: file.size
               });
            },
            error: (err) => {
               console.error('[Upload] Failed:', err);
               alert(`Failed to upload ${file.name}. Please try again.`);
            }
         });
      }
   }

   private loadDocuments(): void {
      if (!this.projectId) return;
      this.http.get<any[]>(`/api/documents/npas/${this.projectId}`).subscribe({
         next: (docs) => {
            this.uploadedDocuments = docs || [];
            console.log('[loadDocuments] Loaded', this.uploadedDocuments.length, 'documents');
         },
         error: () => {
            this.uploadedDocuments = [];
         }
      });
   }

   // ─── Monitoring Query (P15 fix) ───────────────────────────────────

   onSendMonitoringQuery(): void {
      if (!this.monitoringQuery.trim()) return;
      this.monitoringQueryLoading = true;
      this.monitoringQueryResponse = '';

      const query = this.monitoringQuery;
      this.monitoringQuery = '';

      this.difyService.runWorkflow('MONITORING', {
         ...this.buildWorkflowInputs(),
         query: query,
         agent_mode: 'MONITORING'
      }).pipe(
         catchError(err => {
            this.monitoringQueryResponse = `Error: ${err.message || 'Failed to query monitoring agent'}`;
            return of(null);
         }),
         finalize(() => this.monitoringQueryLoading = false)
      ).subscribe((res: any) => {
         if (res?.data?.outputs?.result) {
            this.monitoringQueryResponse = res.data.outputs.result;
         } else if (res?.data?.outputs) {
            this.monitoringQueryResponse = JSON.stringify(res.data.outputs, null, 2);
         }
      });
   }

   // ─── Editor Management ────────────────────────────────────────────

   isIdeationStage(): boolean {
      return String(this.projectData?.current_stage || '').toUpperCase() === 'IDEATION';
   }

   continueIdeation(): void {
      this.activeTab = 'CHAT';
   }

   openEditor(): void {
      this.showDraftBuilder = true;
   }

   openDraftBuilder(): void {
      this.showDraftBuilder = true;
   }

   openDraftBuilderFromIdeation(): void {
      if (!this.isIdeationStage()) {
         this.openDraftBuilder();
         return;
      }
      const proceed = confirm(
         'This record is still in Prospect (Ideation). Recommended: complete Ideation readiness before drafting.\n\nOpen Draft Builder anyway?'
      );
      if (proceed) this.openDraftBuilder();
   }

   onDraftBuilderClosed(): void {
      this.showDraftBuilder = false;
   }

   // ─── Data Loading ─────────────────────────────────────────────────

   loadProjectDetails(id: string) {
      // Load documents from DB (P1 fix)
      this.loadDocuments();

      this.governanceService.getProjectDetails(id).pipe(
         catchError((err) => {
            console.warn(`[NPA Detail] Governance API 404 for ${id}, falling back to NPA service...`);
            return this.npaService.getById(id).pipe(
               catchError((err2) => {
                  console.error(`[NPA Detail] Project ${id} not found in any service`, err2);
                  this.projectData = { id, title: `Project ${id} not found`, current_stage: 'UNKNOWN' } as any;
                  return EMPTY;
               })
            );
         })
      ).subscribe({
         next: (data) => {
            this.projectData = data;
            this.currentStage = data.current_stage;
            this.mapBackendDataToView(data);
            this.runAgentAnalysis();
         },
         error: (err) => console.error('Failed to load project details', err)
      });

      // Load real form sections from API
      this.npaService.getFormSections(id).subscribe({
         next: (sections) => {
            this.sections = (sections || []).map((s: any) => ({
               id: s.section_id,
               title: s.title,
               description: s.description,
               fields: (s.fields || []).map((f: any) => ({
                  key: f.field_key,
                  label: f.label,
                  value: f.value || '',
                  lineage: f.lineage || 'MANUAL',
                  type: f.field_type || 'text',
                  required: f.is_required,
                  tooltip: f.tooltip,
                  options: (f.options || []).map((o: any) => o.label || o.value),
               }))
            }));
         },
         error: (err) => console.warn('Could not load form sections, using empty', err)
      });

      // Load persisted risk assessment to restore on page reload
      this.riskCheckService.getNpaChecks(id).subscribe({
         next: (checks) => {
            if (!checks?.length) return;
            const layerChecks = checks.filter(c => c.checked_by === 'RISK_AGENT');
            const domainChecks = checks.filter(c => c.checked_by === 'RISK_AGENT_DOMAIN');

            if (layerChecks.length > 0 && !this.riskAssessmentResult) {
               const layers = layerChecks.map(c => ({
                  name: c.check_layer as any,
                  status: c.result,
                  details: '',
                  checks: Array.isArray(c.matched_items) ? c.matched_items.map((item: any) =>
                     typeof item === 'string'
                        ? { name: item, status: 'WARNING' as const, detail: item }
                        : { name: item.name || '', status: item.status || 'PASS', detail: item.detail || '' }
                  ) : []
               }));
               const domainAssessments = domainChecks.map(c => {
                  const data = typeof c.matched_items === 'string' ? JSON.parse(c.matched_items) : (c.matched_items || {});
                  return {
                     domain: c.check_layer.replace('DOMAIN_', '') as any,
                     score: data.score || 0,
                     rating: c.result as any,
                     keyFindings: data.keyFindings || [],
                     mitigants: data.mitigants || []
                  };
               });

               const riskIntake = this.intakeAssessments?.find((a: any) => a.domain === 'RISK');
               const findings = riskIntake?.findings ? (typeof riskIntake.findings === 'string' ? JSON.parse(riskIntake.findings) : riskIntake.findings) : {};

               this.riskAssessmentResult = {
                  layers,
                  domainAssessments,
                  overallScore: riskIntake?.score || 0,
                  overallRating: this.projectData?.risk_level || 'MEDIUM',
                  hardStop: riskIntake?.status === 'FAIL',
                  hardStopReason: undefined,
                  prerequisites: [],
                  pirRequirements: findings.pir_requirements || undefined,
                  notionalFlags: findings.notional_flags || undefined,
                  mandatorySignoffs: findings.mandatory_signoffs || [],
                  recommendations: findings.recommendations || [],
                  circuitBreaker: findings.circuit_breaker || undefined,
                  evergreenLimits: findings.evergreen_limits || undefined
               };
               console.log('[loadProjectDetails] Restored persisted risk assessment:', this.riskAssessmentResult.overallScore, this.riskAssessmentResult.overallRating);
            }
         },
         error: (err) => console.warn('Could not load persisted risk checks', err)
      });
   }

   mapBackendDataToView(data: any) {
      // Map Intake Assessments
      if (data.intake_assessments) {
         this.intakeAssessments = data.intake_assessments;
         this.strategicAssessment = this.intakeAssessments.find(a => a.domain === 'STRATEGIC');
      }

      // Map Form Data to Product Attributes (Part A)
      const partAKeys = [
         'product_name', 'product_type', 'product_category', 'desk', 'business_unit',
         'notional_amount', 'tenor', 'underlying_asset',
         'product_manager_name', 'group_product_head', 'proposal_preparer',
         'npa_process_type', 'business_case_status', 'approving_authority',
         'kickoff_date', 'risk_classification', 'booking_entity',
         'counterparty_rating', 'settlement_method',
         'customer_segments', 'bundling_rationale'
      ];
      if (data.formData && data.formData.length > 0) {
         this.productAttributes = data.formData
            .filter((f: any) => partAKeys.includes(f.field_key))
            .map((f: any) => {
               const registryEntry = FIELD_REGISTRY_MAP.get(f.field_key);
               return {
                  label: registryEntry ? registryEntry.label : this.formatLabel(f.field_key),
                  value: f.field_value?.length > 200 ? f.field_value.substring(0, 200) + '...' : f.field_value,
                  confidence: f.confidence_score
               };
            });
      }

      // Pre-populate governanceState from DB signoffs
      if (data.signoffs && data.signoffs.length > 0) {
         const slaBreachedCount = data.signoffs.filter((s: any) => s.sla_breached).length;
         const approvedCount = data.signoffs.filter((s: any) => s.status === 'APPROVED').length;
         const totalCount = data.signoffs.length;
         this.governanceState = {
            signoffs: data.signoffs.map((s: any) => ({
               department: s.party || s.department,
               status: s.status || 'PENDING',
               assignee: s.approver_name || s.approver_user_id,
               slaDeadline: s.sla_deadline,
               slaBreached: !!s.sla_breached,
               decidedAt: s.decision_date
            })),
            slaStatus: slaBreachedCount > 0 ? 'breached' : (approvedCount > totalCount / 2 ? 'on_track' : 'at_risk'),
            loopBackCount: data.loopbacks?.length || 0,
            circuitBreaker: false,
            circuitBreakerThreshold: 3
         } as GovernanceState;
      }

      // Pre-populate docCompleteness from DB documents
      if (data.documents && data.documents.length > 0) {
         // Also update uploadedDocuments from here
         this.uploadedDocuments = data.documents;
         const validDocs = data.documents.filter((d: any) => d.validation_status === 'VALID');
         const warningDocs = data.documents.filter((d: any) => d.validation_status === 'WARNING' || d.validation_status === 'PENDING');
         this.docCompleteness = {
            completenessPercent: Math.round((validDocs.length / Math.max(data.documents.length, 1)) * 100),
            totalRequired: data.documents.length,
            totalPresent: data.documents.length,
            totalValid: validDocs.length,
            missingDocs: [],
            invalidDocs: warningDocs.map((d: any) => ({
               docType: d.document_type,
               docName: d.document_name,
               reason: d.notes || 'Validation pending or warning'
            })),
            conditionalRules: [],
            expiringDocs: [],
            stageGateStatus: validDocs.length >= data.documents.length ? 'CLEAR' : (warningDocs.length > 0 ? 'WARNING' : 'BLOCKED')
         } as DocCompletenessResult;
      }

      // Pre-populate monitoringResult from DB metrics and breaches
      if (data.metrics || data.breaches) {
         const m = data.metrics || {};
         const breachesArr = Array.isArray(data.breaches) ? data.breaches : [];
         const metricsArr = [
            { name: 'Days Since Launch', value: m.days_since_launch || 0, unit: 'days', trend: 'stable' },
            { name: 'Total Volume', value: m.total_volume ? `$${(parseFloat(m.total_volume) / 1e9).toFixed(1)}B` : '$0', unit: '', trend: 'up' },
            { name: 'Realized P&L', value: m.realized_pnl ? `+$${(parseFloat(m.realized_pnl) / 1e6).toFixed(1)}M` : '$0', unit: '', trend: 'up' },
            { name: 'Active Breaches', value: m.active_breaches || breachesArr.length, unit: '', trend: breachesArr.length > 0 ? 'up' : 'stable' },
            { name: 'Counterparty Exposure', value: m.counterparty_exposure ? `$${(parseFloat(m.counterparty_exposure) / 1e6).toFixed(0)}M` : '$0', unit: '', trend: 'stable' },
            { name: 'VaR Utilization', value: m.var_utilization ? `${parseFloat(m.var_utilization)}%` : '0%', unit: '', trend: 'stable' },
            { name: 'Collateral Posted', value: m.collateral_posted ? `$${(parseFloat(m.collateral_posted) / 1e6).toFixed(1)}M` : '$0', unit: '', trend: 'stable' },
            { name: 'Next Review', value: m.next_review_date ? new Date(m.next_review_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBD', unit: '', trend: 'stable' }
         ];
         const conditionsArr = Array.isArray(data.postLaunchConditions) ? data.postLaunchConditions : [];
         this.monitoringResult = {
            productHealth: m.health_status === 'critical' ? 'CRITICAL' : (m.health_status === 'warning' || breachesArr.length > 0 ? 'WARNING' : 'HEALTHY'),
            metrics: metricsArr,
            breaches: breachesArr.map((b: any) => ({
               metric: b.title || b.alert_type || b.metric || 'Unnamed Breach',
               threshold: parseFloat(b.threshold_value) || b.threshold || 0,
               actual: parseFloat(b.actual_value) || parseFloat(b.current_value) || b.actual || 0,
               severity: (b.severity === 'CRITICAL' ? 'CRITICAL' : 'WARNING') as 'CRITICAL' | 'WARNING',
               message: b.description || b.message || b.title || '',
               firstDetected: b.triggered_at || b.created_at || new Date().toISOString(),
               trend: (b.resolved_at ? 'improving' : (b.severity === 'CRITICAL' ? 'worsening' : 'stable')) as 'worsening' | 'stable' | 'improving'
            })),
            conditions: conditionsArr.map((c: any) => ({
               type: c.condition_type || c.type || 'REGULATORY',
               description: c.description || '',
               deadline: c.deadline ? new Date(c.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD',
               status: c.status || 'PENDING',
               daysRemaining: c.deadline ? Math.max(0, Math.ceil((new Date(c.deadline).getTime() - Date.now()) / 86400000)) : 0
            })),
            pirStatus: data.pir_status || 'Not Scheduled',
            pirDueDate: data.pir_due_date
         } as MonitoringResult;
      }

      // Pre-populate classificationResult from DB scorecard
      if (data.scorecard && !this.classificationResult) {
         const sc = data.scorecard;
         const breakdown = typeof sc.breakdown === 'string' ? JSON.parse(sc.breakdown) : (sc.breakdown || {});
         const criteria = breakdown.criteria || [];
         const approvalTrack = this.projectData?.approval_track || '';
         const trackLabel = approvalTrack === 'FULL_NPA' ? 'Full NPA'
            : approvalTrack === 'NPA_LITE' ? 'NPA Lite'
               : approvalTrack === 'BUNDLING' ? 'Bundling'
                  : approvalTrack === 'EVERGREEN' ? 'Evergreen'
                     : approvalTrack === 'PROHIBITED' ? 'Prohibited'
                        : (sc.calculated_tier === 'New-to-Group') ? 'Full NPA' : 'NPA Lite';
         this.classificationResult = {
            type: sc.calculated_tier || this.projectData?.npa_type || 'Variation',
            track: trackLabel,
            scores: criteria.map((c: any) => ({
               criterion: c.criterion || '',
               score: c.score ?? 0,
               maxScore: c.maxScore || 5,
               reasoning: c.reasoning || ''
            })),
            overallConfidence: breakdown.overall_confidence || sc.total_score || 0,
            prohibitedMatch: breakdown.prohibited_match || { matched: false },
            mandatorySignOffs: breakdown.mandatory_signoffs || []
         } as ClassificationResult;
         console.log('[mapBackendDataToView] Pre-populated classificationResult from DB scorecard:', this.classificationResult.type, 'confidence:', this.classificationResult.overallConfidence);
      }

      // Synthesize mlPrediction from scorecard + project data
      if (this.classificationResult && !this.mlPrediction) {
         const track = this.classificationResult.track || '';
         const confidence = this.classificationResult.overallConfidence || 50;
         this.mlPrediction = {
            approvalLikelihood: confidence,
            timelineDays: track.includes('LITE') ? 25 : 45,
            bottleneckDept: data.risk_level === 'HIGH' ? 'CFO / Finance' : 'Legal',
            riskScore: Math.max(0, 100 - confidence),
            features: [],
            comparisonInsights: []
         } as MLPrediction;
         console.log('[mapBackendDataToView] Synthesized mlPrediction from scorecard: approval=', this.mlPrediction.approvalLikelihood);
      }


      // Map workflow states from DB to WorkflowStage[] (P2 fix)
      if (data.workflowStates && Array.isArray(data.workflowStates) && data.workflowStates.length > 0) {
         const stageLabels: Record<string, string> = {
            'INITIATION': 'Initiation',
            'REVIEW': 'Review',
            'SIGN_OFF': 'Sign-Off',
            'LAUNCH': 'Launch',
            'MONITORING': 'Monitoring'
         };
         const statusMap: Record<string, 'COMPLETED' | 'IN_PROGRESS' | 'PENDING' | 'BLOCKED'> = {
            'COMPLETED': 'COMPLETED',
            'IN_PROGRESS': 'IN_PROGRESS',
            'NOT_STARTED': 'PENDING',
            'BLOCKED': 'BLOCKED'
         };
         this.workflowStages = data.workflowStates.map((ws: any) => ({
            id: ws.stage_id || ws.id,
            label: stageLabels[ws.stage_id] || ws.stage_id || 'Unknown',
            status: statusMap[ws.status] || 'PENDING',
            date: ws.started_at ? new Date(ws.started_at) : (ws.completed_at ? new Date(ws.completed_at) : undefined),
            duration: ws.completed_at && ws.started_at
               ? `${Math.ceil((new Date(ws.completed_at).getTime() - new Date(ws.started_at).getTime()) / 86400000)}d`
               : undefined,
            subTasks: Array.isArray(ws.blockers) ? ws.blockers.map((b: any) => ({
               label: typeof b === 'string' ? b : (b.description || b.label || 'Blocker'),
               status: 'PENDING' as const,
               assignee: typeof b === 'object' ? b.assignee : undefined
            })) : []
         }));
         console.log('[mapBackendDataToView] Mapped', this.workflowStages.length, 'workflow stages from DB');
      } else {
         // Fallback: synthesize stages from current_stage
         const stageOrder = ['INITIATION', 'REVIEW', 'SIGN_OFF', 'LAUNCH', 'MONITORING'];
         const stageLabels: Record<string, string> = {
            'INITIATION': 'Initiation', 'REVIEW': 'Review', 'SIGN_OFF': 'Sign-Off',
            'LAUNCH': 'Launch', 'MONITORING': 'Monitoring'
         };
         const currentIdx = stageOrder.indexOf(data.current_stage || 'INITIATION');
         this.workflowStages = stageOrder.map((id, i) => ({
            id,
            label: stageLabels[id],
            status: i < currentIdx ? 'COMPLETED' as const
               : i === currentIdx ? 'IN_PROGRESS' as const
                  : 'PENDING' as const,
            date: i <= currentIdx && data.created_at ? new Date(data.created_at) : undefined
         }));
         console.log('[mapBackendDataToView] Synthesized', this.workflowStages.length, 'workflow stages from current_stage:', data.current_stage);
      }

      // Set target completion from data if available
      if (data.target_completion_date) {
         this.workflowTargetCompletion = new Date(data.target_completion_date);
      } else if (data.sla_deadline) {
         this.workflowTargetCompletion = new Date(data.sla_deadline);
      }

      // Update tab badges from pre-populated DB data
      this.updateTabBadge('APPROVALS', null);
      this.updateTabBadge('DOCUMENTS', null);
      this.updateTabBadge('MONITORING', null);
      this.updateTabBadge('ANALYSIS', null);
      this.updateTabBadge('PRODUCT_SPECS', null);
   }

   // ─── Computed Properties ──────────────────────────────────────────

   get riskAssessments() {
      const riskDomains = ['RISK', 'LEGAL', 'FINANCE', 'CREDIT', 'MARKET', 'COMPLIANCE'];
      return this.intakeAssessments.filter(a => riskDomains.includes((a.domain || '').toUpperCase()));
   }

   get opsAssessments() {
      const opsDomains = ['OPS', 'TECH', 'DATA', 'OPERATIONS', 'TECHNOLOGY', 'IT'];
      return this.intakeAssessments.filter(a => opsDomains.includes((a.domain || '').toUpperCase()));
   }

   getAssessmentColor(status: string): string {
      switch (status) {
         case 'PASS': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
         case 'WARN': return 'bg-amber-50 text-amber-700 border-amber-100';
         case 'FAIL': return 'bg-rose-50 text-rose-700 border-rose-100';
         default: return 'bg-slate-50 text-slate-700 border-slate-100';
      }
   }

   parseFindings(findings: string | object): string {
      if (!findings) return 'No detailed findings recorded.';
      try {
         const obj = typeof findings === 'string' ? JSON.parse(findings) : findings;
         return obj.observation || JSON.stringify(obj);
      } catch (e) {
         return String(findings);
      }
   }

   formatLabel(key: string): string {
      return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
   }

   get isCrossBorder(): boolean {
      return this.projectData?.is_cross_border ?? this.npaContext?.isCrossBorder ?? false;
   }

   get approvalTrack(): string {
      const track = this.projectData?.approval_track || this.npaContext?.track || '';
      const type = this.projectData?.npa_type || '';
      switch (track) {
         case 'FULL_NPA': return 'Full NPA' + (type === 'New-to-Group' ? ' (New-to-Group)' : '');
         case 'NPA_LITE': return 'NPA Lite (Variation)';
         case 'BUNDLING': return 'Bundling';
         case 'EVERGREEN': return 'Evergreen Renewal';
         case 'PROHIBITED': return 'Prohibited Product';
         default:
            if (type === 'New-to-Group') return 'Full NPA (New-to-Group)';
            if (type === 'NPA Lite' || type === 'Variation') return 'NPA Lite (Variation)';
            if (type === 'Existing') return 'NPA Lite (Existing)';
            return track || type || 'Standard';
      }
   }

   get isNtg(): boolean {
      return (this.projectData?.npa_type || this.npaContext?.track) === 'New-to-Group'
         || this.projectData?.approval_track === 'FULL_NPA';
   }

   get pacStatus(): string {
      return this.projectData?.pac_approval_status || 'N/A';
   }

   get pacBlocked(): boolean {
      return this.isNtg && this.pacStatus !== 'Approved';
   }

   formatSubmittedDate(dateStr: string | undefined): string {
      if (!dateStr) return '—';
      try {
         const d = new Date(dateStr);
         return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' +
            d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      } catch { return dateStr; }
   }

   getBadgeColor(tabId: string): string {
      switch (tabId) {
         case 'ANALYSIS': return 'text-green-600 bg-green-100 border-green-200';
         case 'APPROVALS': return 'text-amber-600 bg-amber-100 border-amber-200';
         case 'MONITORING': return 'text-rose-600 bg-rose-100 border-rose-200';
         default: return 'text-slate-600 bg-slate-100';
      }
   }

   // ─── Agent Analysis Engine ────────────────────────────────────────

   private buildWorkflowInputs(): Record<string, any> {
      const d = this.projectData;
      if (!d) return {};
      const fieldValue = (key: string, fallback = '') => {
         const field = (d.formData || []).find((f: any) => f.field_key === key);
         return field?.field_value ?? fallback;
      };
      const productDesc = d.description || d.title || fieldValue('product_description', '') || fieldValue('business_rationale', 'NPA Product');
      return {
         project_id: d.id || this.projectId || '',
         product_description: productDesc,
         product_category: fieldValue('product_category', '') || fieldValue('product_type', '') || d.product_category || d.npa_type || '',
         underlying_asset: fieldValue('underlying_asset', ''),
         notional_amount: String(parseFloat(fieldValue('notional_amount', '0')) || d.notional_amount || 0),
         currency: fieldValue('currency', '') || d.currency || 'USD',
         customer_segment: fieldValue('customer_segment', '') || fieldValue('target_market', '') || '',
         booking_location: fieldValue('booking_location', '') || fieldValue('booking_entity', '').split(',').pop()?.trim() || 'Singapore',
         counterparty_location: fieldValue('counterparty_location', '') || (fieldValue('counterparty', '').includes('London') ? 'London' : ''),
         is_cross_border: String(d.is_cross_border ?? false),
         classification_type: d.classification_type || d.scorecard?.calculated_tier || 'Variation',
         approval_track: d.approval_track || 'FULL_NPA',
         current_stage: d.current_stage || 'INITIATION',
         counterparty_rating: fieldValue('counterparty_rating', 'A-'),
         use_case: fieldValue('use_case', '') || 'Hedging',
         risk_level: d.risk_level || 'MEDIUM',
         npa_lite_subtype: d.npa_lite_subtype || fieldValue('npa_lite_subtype', ''),
         pac_approved: String(d.pac_approved ?? fieldValue('pac_approved', 'false') === 'true'),
         dormancy_status: d.dormancy_status || fieldValue('dormancy_status', '') || 'active',
         loop_back_count: String(d.loop_back_count || 0),
         evergreen_notional_used: String(d.evergreen_notional_used || 0),
         evergreen_deal_count: String(d.evergreen_deal_count || 0),
         reference_npa_id: d.reference_npa_id || fieldValue('reference_npa_id', '')
            || this.npaContext?.reference_npa_id || this.npaContext?.data?.reference_npa_id || '',
         similar_npa_id: d.similar_npa_id || fieldValue('similar_npa_id', '')
            || this.npaContext?.similar_npa_id || this.npaContext?.data?.top_match || '',
         similarity_score: String(d.similarity_score || fieldValue('similarity_score', '0')
            || this.npaContext?.reference_similarity || this.npaContext?.data?.reference_similarity || 0),
         input_text: productDesc
      };
   }

   refreshAgentAnalysis(): void {
      this._agentsLaunched = false;
      this._loadStartedForId = null;
      NpaDetailComponent._activeAgentRunId = null;
      this.userDismissedEditor = false;
      if (this.projectId) {
         sessionStorage.removeItem(`_npa_agents_running_${this.projectId}`);
         delete (window as any)[`__npa_load_${this.projectId}`];
      }
      this.classificationResult = null;
      this.mlPrediction = null;
      this.riskAssessmentResult = null;
      this.agentErrors = {};
      this.runAgentAnalysis();
   }

   private runAgentAnalysis(): void {
      if (this._agentsLaunched) return;
      const inputs = this.buildWorkflowInputs();
      if (!inputs['project_id']) return;

      const dedupKey = `_npa_agents_running_${inputs['project_id']}`;
      const dedupTs = sessionStorage.getItem(dedupKey);
      if (dedupTs && (Date.now() - Number(dedupTs)) < 90000) {
         console.log(`[runAgentAnalysis] Skipping — agents already launched for ${inputs['project_id']} ${Math.round((Date.now() - Number(dedupTs)) / 1000)}s ago`);
         this._agentsLaunched = true;
         return;
      }
      sessionStorage.setItem(dedupKey, String(Date.now()));

      const hasRisk = !!this.riskAssessmentResult;
      const hasClassification = !!this.classificationResult;
      const hasGovernance = !!this.governanceState;
      const hasDocs = !!this.docCompleteness;
      if (hasRisk && hasClassification && hasGovernance && hasDocs) {
         console.log('[runAgentAnalysis] DB data sufficient — skipping live agent calls. Use "Refresh Analysis" to re-run.');
         this.dbDataSufficient = true;
         this._agentsLaunched = true;
         const agents = ['CLASSIFIER', 'ML_PREDICT', 'RISK', 'GOVERNANCE', 'DOC_LIFECYCLE', 'MONITORING'];
         agents.forEach(a => this.agentLoading[a] = false);
         return;
      }

      this._agentsLaunched = true;
      this.waveContext = {};

      const agents = ['CLASSIFIER', 'ML_PREDICT', 'RISK', 'GOVERNANCE', 'DOC_LIFECYCLE', 'MONITORING'];
      agents.forEach(a => this.agentLoading[a] = true);

      const fireAgent = (agentId: string, extraInputs: Record<string, any> = {}): Observable<any> => {
         const agentInputs = { ...inputs, ...this.waveContext, ...extraInputs };
         console.log(`[fireAgent] ${agentId} — sending request`);
         return this.difyService.runWorkflow(agentId, agentInputs).pipe(
            tap(res => {
               this.agentLoading[agentId] = false;
               console.log(`[fireAgent] ${agentId} — response status:`, res?.data?.status, 'outputs keys:', res?.data?.outputs ? Object.keys(res.data.outputs) : 'NONE');
               if (res?.data?.status === 'succeeded') {
                  this.handleAgentResult(agentId, res.data.outputs);
                  this.waveContext[`${agentId.toLowerCase()}_result`] = res.data.outputs;
               } else {
                  console.warn(`[fireAgent] ${agentId} — status not succeeded:`, res?.data?.status);
               }
            }),
            catchError(err => {
               console.error(`[fireAgent] ${agentId} — ERROR:`, err.status, err.message);
               this.agentErrors[agentId] = err.message || `${agentId} failed`;
               this.agentLoading[agentId] = false;
               return of(null);
            })
         );
      };

      // W0: RISK (hard-stop gate) → W1: CLASSIFIER + ML_PREDICT → W2: GOVERNANCE → W3: DOC_LIFECYCLE + MONITORING
      fireAgent('RISK').pipe(
         concatMap(riskRes => {
            const riskOutputs = riskRes?.data?.outputs;
            const hardStop = riskOutputs?.hard_stop === true || riskOutputs?.hardStop === true;
            if (hardStop) {
               console.warn('[WAVE] RISK hard-stop detected — aborting subsequent waves');
               ['CLASSIFIER', 'ML_PREDICT', 'GOVERNANCE', 'DOC_LIFECYCLE', 'MONITORING']
                  .forEach(a => {
                     this.agentLoading[a] = false;
                     this.agentErrors[a] = 'Aborted: prohibited product detected by RISK agent';
                  });
               return EMPTY;
            }
            return forkJoin([fireAgent('CLASSIFIER'), fireAgent('ML_PREDICT')]);
         }),
         concatMap(() => {
            return fireAgent('GOVERNANCE', { agent_mode: 'GOVERNANCE' });
         }),
         concatMap(() => {
            return fireAgent('DOC_LIFECYCLE', { agent_mode: 'DOC_LIFECYCLE' }).pipe(
               concatMap(() => fireAgent('MONITORING', { agent_mode: 'MONITORING' }))
            );
         })
      ).subscribe();
   }

   // ─── Agent Result Handlers ────────────────────────────────────────

   private handleAgentResult(agentId: string, outputs: any): void {
      console.log(`[handleAgentResult] ${agentId} — raw outputs keys:`, outputs ? Object.keys(outputs) : 'NULL');
      const projectId = this.npaContext?.id;
      switch (agentId) {
         case 'CLASSIFIER':
            this.classificationResult = this.mapClassificationResult(outputs);
            console.log(`[handleAgentResult] CLASSIFIER mapped:`, this.classificationResult?.type, 'scores:', this.classificationResult?.scores?.length);
            this.updateTabBadge('ANALYSIS', null);
            if (projectId && this.classificationResult) {
               this.persistAgentResult(projectId, 'classifier', {
                  total_score: this.classificationResult.overallConfidence,
                  calculated_tier: this.classificationResult.type,
                  breakdown: this.classificationResult.scores,
                  approval_track: this.classificationResult.track
               });
            }
            break;
         case 'ML_PREDICT':
            this.mlPrediction = this.mapMlPrediction(outputs);
            console.log(`[handleAgentResult] ML_PREDICT mapped: approval=${this.mlPrediction?.approvalLikelihood}, risk=${this.mlPrediction?.riskScore}`);
            this.updateTabBadge('ANALYSIS', null);
            if (projectId && this.mlPrediction) {
               this.persistAgentResult(projectId, 'ml-predict', {
                  approval_likelihood: this.mlPrediction.approvalLikelihood,
                  timeline_days: this.mlPrediction.timelineDays,
                  bottleneck: this.mlPrediction.bottleneckDept,
                  risk_score: this.mlPrediction.riskScore
               });
            }
            break;
         case 'RISK':
            this.riskAssessmentResult = this.mapRiskAssessment(outputs);
            console.log(`[handleAgentResult] RISK mapped:`, this.riskAssessmentResult
               ? `score=${this.riskAssessmentResult.overallScore}, rating=${this.riskAssessmentResult.overallRating}, layers=${this.riskAssessmentResult.layers?.length}, domains=${this.riskAssessmentResult.domainAssessments?.length}`
               : 'NULL');
            // P5/P6 fix: Synthesize intakeAssessments from RISK agent domain assessments
            // so the Risk Analysis & Operational Readiness sections populate
            if (this.riskAssessmentResult?.domainAssessments?.length) {
               const synthesized = this.riskAssessmentResult.domainAssessments.map(d => ({
                  domain: d.domain,
                  score: d.score,
                  status: d.rating === 'HIGH' ? 'FAIL' : (d.rating === 'MEDIUM' ? 'WARN' : 'PASS'),
                  findings: JSON.stringify({
                     observation: d.keyFindings?.join('. ') || `${d.domain} assessment: ${d.rating}`,
                     mitigants: d.mitigants || []
                  })
               }));
               // Merge without overwriting existing DB-sourced assessments
               for (const s of synthesized) {
                  const existing = this.intakeAssessments.findIndex(a => a.domain === s.domain);
                  if (existing >= 0) {
                     this.intakeAssessments[existing] = { ...this.intakeAssessments[existing], ...s };
                  } else {
                     this.intakeAssessments.push(s);
                  }
               }
               console.log('[handleAgentResult] RISK: Synthesized', synthesized.length, 'intake assessments from domain assessments');
            }
            // Also add overall RISK entry if missing
            if (this.riskAssessmentResult && !this.intakeAssessments.find(a => a.domain === 'RISK')) {
               this.intakeAssessments.push({
                  domain: 'RISK',
                  score: this.riskAssessmentResult.overallScore,
                  status: this.riskAssessmentResult.overallRating === 'HIGH' ? 'FAIL' : (this.riskAssessmentResult.overallRating === 'MEDIUM' ? 'WARN' : 'PASS'),
                  findings: JSON.stringify({
                     observation: `Overall risk: ${this.riskAssessmentResult.overallRating} (score: ${this.riskAssessmentResult.overallScore}/100)`,
                     recommendations: this.riskAssessmentResult.recommendations || []
                  })
               });
            }
            if (projectId && this.riskAssessmentResult) {
               this.persistAgentResult(projectId, 'risk', {
                  layers: this.riskAssessmentResult.layers?.map(l => ({
                     check_layer: l.name, result: l.status, findings: l.checks
                  })),
                  domain_assessments: this.riskAssessmentResult.domainAssessments,
                  overall_score: this.riskAssessmentResult.overallScore,
                  overall_rating: this.riskAssessmentResult.overallRating,
                  hard_stop: this.riskAssessmentResult.hardStop,
                  pir_requirements: this.riskAssessmentResult.pirRequirements,
                  notional_flags: this.riskAssessmentResult.notionalFlags,
                  mandatory_signoffs: this.riskAssessmentResult.mandatorySignoffs,
                  recommendations: this.riskAssessmentResult.recommendations,
                  circuit_breaker: this.riskAssessmentResult.circuitBreaker,
                  evergreen_limits: this.riskAssessmentResult.evergreenLimits
               });
            }
            break;
         case 'GOVERNANCE': {
            const agentGov = this.mapGovernanceState(outputs);
            if (agentGov && agentGov.signoffs && agentGov.signoffs.length > 0) {
               this.governanceState = agentGov;
            }
            this.updateTabBadge('APPROVALS', null);
            if (projectId && agentGov?.signoffs?.length) {
               this.persistAgentResult(projectId, 'governance', {
                  signoffs: agentGov.signoffs.map((s: any) => ({ party: s.party, department: s.department }))
               });
            }
            break;
         }
         case 'DOC_LIFECYCLE': {
            const agentDoc = this.mapDocCompleteness(outputs);
            if (agentDoc && agentDoc.totalPresent > 0) {
               this.docCompleteness = agentDoc;
            }
            this.updateTabBadge('DOCUMENTS', null);
            if (projectId && agentDoc) {
               this.persistAgentResult(projectId, 'doc-lifecycle', {
                  documents: agentDoc.missingDocs.map(d => ({
                     document_name: d.docType, document_type: 'REQUIRED', status: 'PENDING', notes: d.reason
                  }))
               });
            }
            break;
         }
         case 'MONITORING': {
            const agentMon = this.mapMonitoringResult(outputs);
            if (agentMon && (agentMon.metrics?.length > 0 || agentMon.breaches?.length > 0)) {
               this.monitoringResult = agentMon;
            }
            this.updateTabBadge('MONITORING', null);
            if (projectId && agentMon) {
               this.persistAgentResult(projectId, 'monitoring', {
                  thresholds: agentMon.metrics?.map(m => ({
                     metric_name: m.name, warning_value: (m.threshold || 0) * 0.8, critical_value: m.threshold || 0
                  }))
               });
            }
            break;
         }
      }
   }

   private persistAgentResult(projectId: string, agentType: string, payload: any): void {
      const url = `/api/agents/npas/${projectId}/persist/${agentType}`;
      fetch(url, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(payload)
      }).then(res => {
         if (!res.ok) throw new Error(`HTTP ${res.status}`);
         return res.json();
      }).then(data => {
         console.log(`[persist] ${agentType} result saved:`, data.fields_saved ?? data.status ?? 'ok');
      }).catch(err => {
         console.warn(`[persist] ${agentType} save failed:`, err.message);
      });
   }

   // ─── Output Mapping Methods ───────────────────────────────────────

   private parseJsonOutput(outputs: any): any {
      if (outputs?.result && typeof outputs.result === 'string') {
         let raw = outputs.result.trim();
         raw = raw.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
         try { return JSON.parse(raw); } catch (_) { /* fall through */ }
         const jsonMatch = raw.match(/\{[\s\S]*\}/);
         if (jsonMatch) {
            try { return JSON.parse(jsonMatch[0]); } catch (_) { /* fall through */ }
         }
         try {
            const fixed = raw.replace(/'/g, '"').replace(/True/g, 'true').replace(/False/g, 'false').replace(/None/g, 'null');
            const fixedMatch = fixed.match(/\{[\s\S]*\}/);
            if (fixedMatch) {
               const parsed = JSON.parse(fixedMatch[0]);
               console.log('[parseJsonOutput] Recovered JSON via Python→JSON syntax fix');
               return parsed;
            }
         } catch (_) { /* fall through */ }
         console.warn('[parseJsonOutput] All parse attempts failed. raw (first 300):', raw.substring(0, 300));
         return this.extractFallbackFromText(raw);
      }
      return outputs;
   }

   private extractFallbackFromText(raw: string): any {
      console.warn('[extractFallbackFromText] JSON parse failed, using safe defaults. Raw (200):', raw.substring(0, 200));
      return {
         _fromFallback: true,
         _parseError: 'Agent returned narrative text instead of JSON. Classification defaulted to Variation.',
         classification: { type: 'Variation', track: 'NPA_LITE' },
         scorecard: { overall_confidence: 0, scores: [] },
         risk_assessment: { overall_score: 50, overall_rating: 'MEDIUM', hard_stop: false },
         prohibited_check: { matched: false },
         mandatory_signoffs: [],
         _rawSummary: raw.substring(0, 500)
      };
   }

   private mapClassificationResult(rawOutputs: any): ClassificationResult | null {
      const o = this.parseJsonOutput(rawOutputs);
      if (!o) return null;

      // Support Dify workflow traces (Agent-node debug output) where the payload is an array of rounds/tool calls.
      // This happens when the workflow output mapping is misconfigured to return trace artifacts instead of JSON.
      if (Array.isArray(o.result)) {
         return this.mapClassificationFromTrace(o.result);
      }

      const cl = o.classification || o.classification_result || o;
      const sc = o.scorecard || cl.scorecard || {};
      const scores = sc.scores || cl.scores || [];
      return {
         type: cl.type || cl.classification_type || 'Variation',
         track: cl.track || cl.approval_track || 'NPA Lite',
         scores: scores.map((s: any) => ({
            criterion: s.criterion_name || s.criterion || s.name || s.criterion_code || '',
            score: s.score ?? 0,
            maxScore: s.max_score || s.maxScore || 10,
            reasoning: s.reasoning || s.description || ''
         })),
         overallConfidence: sc.overall_confidence || cl.overallConfidence || cl.overall_confidence || cl.confidence || 0,
         prohibitedMatch: o.prohibited_check || cl.prohibitedMatch || cl.prohibited_match || { matched: false },
         mandatorySignOffs: o.mandatory_signoffs || cl.mandatorySignOffs || cl.mandatory_signoffs || []
      } as ClassificationResult;
   }

   private mapClassificationFromTrace(trace: any[]): ClassificationResult {
      const toolErrors: string[] = [];
      const thoughts: string[] = [];

      for (const entry of trace) {
         const d = entry?.data || {};
         const observation = typeof d.observation === 'string' ? d.observation : '';
         const thought = typeof d.thought === 'string' ? d.thought : '';
         const toolName = d.tool_name || d.action_name || d.action;

         if (observation && observation.toLowerCase().includes('tool invoke error')) {
            toolErrors.push(`${toolName || 'tool'}: ${observation.split('\n')[0]}`);
         }
         if (thought) thoughts.push(thought.trim());
      }

      const rawText = thoughts.length ? thoughts[thoughts.length - 1] : JSON.stringify(trace, null, 2);

      const type =
         /classification:\s*(new-to-group|ntg)/i.test(rawText) ? 'NTG'
            : /classification:\s*existing/i.test(rawText) ? 'Existing'
               : /classification:\s*variation/i.test(rawText) ? 'Variation'
                  : 'Variation';

      const track =
         /track:\s*full[_\s-]*npa/i.test(rawText) || /track:\s*full npa/i.test(rawText) ? 'Full NPA'
            : /track:\s*npa[_\s-]*lite/i.test(rawText) ? 'NPA Lite'
               : /track:\s*bundling/i.test(rawText) ? 'Bundling'
                  : /track:\s*evergreen/i.test(rawText) ? 'Evergreen'
                     : /track:\s*prohibited/i.test(rawText) ? 'Prohibited'
                        : 'NPA Lite';

      const confidenceMatch = rawText.match(/confidence:\s*(\d+)\s*%/i);
      const overallConfidence = confidenceMatch ? Number(confidenceMatch[1]) : 0;

      // Extract category subtotals for a clean score bar view when no JSON scorecard is available.
      const scores: any[] = [];
      const catPatterns: { key: string; label: string; max: number }[] = [
         { key: 'PRODUCT_INNOVATION', label: 'Product Innovation', max: 8 },
         { key: 'MARKET_CUSTOMER', label: 'Market & Customer', max: 10 },
         { key: 'RISK_REGULATORY', label: 'Risk & Regulatory', max: 8 },
         { key: 'FINANCIAL_OPERATIONAL', label: 'Financial & Operational', max: 7 }
      ];
      for (const c of catPatterns) {
         const m = rawText.match(new RegExp(`${c.key}[\\s\\S]*?Subtotal:\\s*(\\d+)\\s*/\\s*(\\d+)`, 'i'));
         if (m) {
            scores.push({
               criterion: c.label,
               score: Number(m[1]),
               maxScore: Number(m[2]) || c.max,
               reasoning: `${c.key} subtotal from narrative output`
            });
         }
      }

      const analysisSummary: string[] = [];
      if (toolErrors.length) {
         analysisSummary.push(`Tool errors detected (${toolErrors.length}). Workflow likely returned trace/narrative output instead of JSON.`);
         analysisSummary.push(...toolErrors.slice(0, 5));
         if (toolErrors.length > 5) analysisSummary.push(`...and ${toolErrors.length - 5} more tool errors`);
      }

      return {
         type: type as any,
         track: track as any,
         scores,
         overallConfidence,
         mandatorySignOffs: [],
         analysisSummary: analysisSummary.length ? analysisSummary : undefined,
         rawOutput: rawText,
         rawJson: { trace }
      } as ClassificationResult;
   }

   private mapMlPrediction(rawOutputs: any): MLPrediction | null {
      const o = this.parseJsonOutput(rawOutputs);
      if (!o) return null;
      const p = o.ml_prediction || o.prediction || {};
      const sc = o.scorecard || {};
      const cl = o.classification || {};
      const nf = o.notional_flags || {};
      const approvalLikelihood = p.approvalLikelihood || p.approval_likelihood || sc.overall_confidence || 0;
      const track = cl.track || '';
      const defaultTimeline = track.includes('LITE') ? 25 : 45;
      const timelineDays = p.timelineDays || p.timeline_days || defaultTimeline;
      const signoffs = o.mandatory_signoffs || [];
      const bottleneckDept = p.bottleneckDept || p.bottleneck_dept
         || (nf.cfo_approval_required ? 'CFO / Finance' : signoffs[signoffs.length - 1] || 'Unknown');
      const riskScore = p.riskScore || p.risk_score || Math.max(0, 100 - approvalLikelihood);
      const features: any[] = p.features || [];
      if (features.length === 0) {
         if (nf.roae_analysis_needed) features.push({ name: 'ROAE Analysis Required', importance: 0.8, value: 'Yes' });
         if (nf.mlr_review_required) features.push({ name: 'MLR Review Required', importance: 0.7, value: 'Yes' });
         if (nf.finance_vp_required) features.push({ name: 'Finance VP Required', importance: 0.6, value: 'Yes' });
         if (cl.is_cross_border) features.push({ name: 'Cross-Border', importance: 0.9, value: 'Yes' });
         features.push({ name: 'Classification', importance: 0.5, value: cl.type || 'N/A' });
      }
      return {
         approvalLikelihood, timelineDays, bottleneckDept, riskScore, features,
         comparisonInsights: p.comparisonInsights || p.comparison_insights || (o.similar_npa_hint ? [o.similar_npa_hint] : [])
      } as MLPrediction;
   }

   private mapRiskAssessment(rawOutputs: any): RiskAssessment | null {
      const o = this.parseJsonOutput(rawOutputs);
      if (!o) return null;
      const r = o.risk_assessment || o;
      const layers = (o.layer_results || r.layers || []).map((l: any) => ({
         name: l.layer || l.name || '',
         status: l.status || 'PASS',
         details: Array.isArray(l.findings) ? l.findings.join('; ') : (l.details || ''),
         checks: (l.checks || l.flags || []).map((c: any) =>
            typeof c === 'string' ? { name: c, status: 'WARNING' as const, detail: c }
               : { name: c.name, status: c.status || 'PASS', detail: c.detail || c.description || '' }
         )
      }));
      const domainAssessments = (o.domain_assessments || r.domain_assessments || []).map((d: any) => ({
         domain: d.domain || '', score: d.score || 0, rating: d.rating || 'LOW',
         keyFindings: d.key_findings || d.keyFindings || [], mitigants: d.mitigants || d.mitigation || []
      }));
      const prerequisites = (o.prerequisite_validation?.pending_items || r.prerequisites || []).map((p: any) =>
         typeof p === 'string' ? { name: p, status: 'FAIL' as const, category: 'Pending' }
            : { name: p.name, status: p.status || 'PASS', category: p.category || '' }
      );
      const pirRaw = o.pir_requirements || r.pir_requirements;
      const pirRequirements = pirRaw ? { required: pirRaw.required ?? pirRaw.pir_required ?? false, type: pirRaw.type || pirRaw.pir_type, deadline_months: pirRaw.deadline_months || pirRaw.deadline, conditions: pirRaw.conditions || [] } : undefined;
      const cbRaw = o.circuit_breaker || r.circuit_breaker;
      const circuitBreaker = cbRaw ? { triggered: cbRaw.triggered ?? false, loop_back_count: cbRaw.loop_back_count ?? cbRaw.count ?? 0, threshold: cbRaw.threshold ?? 3, escalation_target: cbRaw.escalation_target } : undefined;
      const egRaw = o.evergreen_limits || r.evergreen_limits;
      const evergreenLimits = egRaw ? { eligible: egRaw.eligible ?? false, notional_remaining: egRaw.notional_remaining, deal_count_remaining: egRaw.deal_count_remaining, flags: egRaw.flags || [] } : undefined;
      const nfRaw = o.notional_flags || r.notional_flags;
      const notionalFlags = nfRaw ? { finance_vp_required: nfRaw.finance_vp_required ?? false, cfo_required: nfRaw.cfo_required ?? false, roae_required: nfRaw.roae_required ?? nfRaw.roae_analysis_needed ?? false, threshold_breached: nfRaw.threshold_breached } : undefined;

      return {
         layers, domainAssessments,
         overallScore: r.overall_score || r.overallScore || 0,
         overallRating: r.overall_risk_rating || r.overallRating || (r.overall_score >= 70 ? 'HIGH' : r.overall_score >= 40 ? 'MEDIUM' : 'LOW'),
         hardStop: r.hardStop || r.hard_stop || false,
         hardStopReason: r.hardStopReason || r.hard_stop_reason || undefined,
         prerequisites, pirRequirements, circuitBreaker, evergreenLimits, notionalFlags,
         mandatorySignoffs: o.mandatory_signoffs || r.mandatory_signoffs || [],
         recommendations: o.recommendations || r.recommendations || []
      } as RiskAssessment;
   }


   private mapGovernanceState(rawOutputs: any): GovernanceState | null {
      const o = this.parseJsonOutput(rawOutputs);
      console.log('[mapGovernanceState] parsed keys:', o ? Object.keys(o) : 'NULL');
      if (!o) return null;
      const ss = o.signoff_status || o;
      const ls = o.loopback_status || {};
      const signoffs = (o.signoffs || ss.signoffs || []).map((s: any) => ({
         department: s.department, status: s.status || 'PENDING',
         assignee: s.assignee || s.approver,
         slaDeadline: s.sla_deadline || s.slaDeadline,
         slaBreached: s.sla_breached || s.slaBreached || false,
         decidedAt: s.decided_at || s.decidedAt
      }));
      const finalSignoffs = signoffs.length > 0 ? signoffs :
         (ss.blocking_parties || []).map((dept: string) => ({ department: dept, status: 'PENDING' as const }));
      return {
         signoffs: finalSignoffs,
         slaStatus: ss.sla_breached > 0 ? 'breached' : (ss.completion_pct > 50 ? 'on_track' : 'at_risk'),
         loopBackCount: ls.total || 0,
         circuitBreaker: ls.circuit_breaker_triggered || false,
         circuitBreakerThreshold: 3
      } as GovernanceState;
   }

   private mapDocCompleteness(rawOutputs: any): DocCompletenessResult | null {
      const o = this.parseJsonOutput(rawOutputs);
      if (!o) return null;
      const c = o.completeness || o;
      return {
         completenessPercent: c.completion_pct || c.completenessPercent || 0,
         totalRequired: c.total_required || c.totalRequired || 0,
         totalPresent: c.present || c.totalPresent || 0,
         totalValid: c.totalValid || c.present || 0,
         missingDocs: (o.missing_documents || c.missingDocs || []).map((d: any) => ({
            docType: d.doc_name || d.docType || '',
            reason: d.reason || `Required by ${d.required_by || 'sign-off'}`,
            priority: d.criticality === 'CRITICAL' ? 'BLOCKING' : 'WARNING'
         })),
         invalidDocs: c.invalidDocs || [], conditionalRules: c.conditionalRules || [],
         expiringDocs: c.expiringDocs || [],
         stageGateStatus: c.is_complete ? 'CLEAR' : (c.critical_missing > 0 ? 'BLOCKED' : 'WARNING')
      } as DocCompletenessResult;
   }

   private mapMonitoringResult(rawOutputs: any): MonitoringResult | null {
      const o = this.parseJsonOutput(rawOutputs);
      if (!o) return null;
      return {
         productHealth: o.health_status || o.productHealth || 'HEALTHY',
         metrics: (o.metrics || []).map((m: any) => ({
            name: m.name || m.metric || '', value: m.value || m.actual || 0,
            unit: m.unit || '', threshold: m.threshold || m.warning, trend: m.trend || 'stable'
         })),
         breaches: (o.breaches || []).map((b: any) => ({
            metric: b.metric || '', threshold: b.threshold || b.warning || b.critical || 0,
            actual: b.actual || 0, severity: b.severity || 'WARNING',
            message: b.message || `${b.metric} exceeds threshold`,
            firstDetected: b.firstDetected || b.first_detected || new Date().toISOString(),
            trend: b.trend || 'stable'
         })),
         conditions: (o.conditions?.items || o.post_launch_conditions || []).map((c: any) => ({
            type: c.type || '', description: c.description || '', deadline: c.deadline || '',
            status: c.status || 'PENDING', daysRemaining: c.daysRemaining || c.days_remaining || 0
         })),
         pirStatus: o.pir_status || o.pirStatus || 'Not Scheduled',
         pirDueDate: o.pir_due_date || o.pirDueDate
      } as MonitoringResult;
   }

   // ─── Retry & Badge ────────────────────────────────────────────────

   retryAgent(agentId: string): void {
      delete this.agentErrors[agentId];
      this.agentLoading[agentId] = true;
      const inputs = this.buildWorkflowInputs();
      const modeMap: Record<string, string> = {
         GOVERNANCE: 'GOVERNANCE', DOC_LIFECYCLE: 'DOC_LIFECYCLE', MONITORING: 'MONITORING'
      };
      const finalInputs = modeMap[agentId] ? { ...inputs, agent_mode: modeMap[agentId] } : inputs;

      this.difyService.runWorkflow(agentId, finalInputs).pipe(
         catchError(err => { this.agentErrors[agentId] = err.message || `${agentId} failed`; return of(null); })
      ).subscribe((res: any) => {
         this.agentLoading[agentId] = false;
         if (res?.data?.status === 'succeeded') {
            switch (agentId) {
               case 'CLASSIFIER': this.classificationResult = this.mapClassificationResult(res.data.outputs); break;
               case 'ML_PREDICT': this.mlPrediction = this.mapMlPrediction(res.data.outputs); break;
               case 'RISK': this.riskAssessmentResult = this.mapRiskAssessment(res.data.outputs); break;
               case 'GOVERNANCE': this.governanceState = this.mapGovernanceState(res.data.outputs); break;
               case 'DOC_LIFECYCLE': this.docCompleteness = this.mapDocCompleteness(res.data.outputs); break;
               case 'MONITORING': this.monitoringResult = this.mapMonitoringResult(res.data.outputs); break;
            }
         }
      });
   }

   private updateTabBadge(tabId: DetailTab, _data: any): void {
      const tab = this.tabs.find(t => t.id === tabId);
      if (!tab) return;
      switch (tabId) {
         case 'PRODUCT_SPECS':
            // No badge
            break;
         case 'DOCUMENTS':
            if (this.docCompleteness) {
               const missing = this.docCompleteness.missingDocs?.length || 0;
               tab.badge = missing > 0 ? `${missing} Missing` : 'Complete';
            }
            break;
         case 'ANALYSIS':
            if (this.mlPrediction) tab.badge = `${this.mlPrediction.approvalLikelihood}%`;
            break;
         case 'APPROVALS':
            if (this.governanceState) {
               const pending = this.governanceState.signoffs?.filter(s => s.status === 'PENDING').length || 0;
               tab.badge = `${pending}`;
            }
            break;
         case 'MONITORING':
            if (this.monitoringResult) {
               tab.badge = this.monitoringResult.breaches?.length > 0
                  ? `${this.monitoringResult.breaches.length}` : '0';
            }
            break;
      }
   }
}
