import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApprovalItem {
    id: string;
    title: string;
    description: string;
    npa_type: string;
    current_stage: string;
    status: string;
    risk_level: string;
    notional_amount: number;
    is_cross_border: boolean;
    submitted_by: string;
    created_at: string;
    updated_at: string;
    signoffs: SignoffRecord[];
    jurisdictions: string[];
}

export interface SignoffRecord {
    id: number;
    party: string;
    department: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REWORK' | 'UNDER_REVIEW' | 'CLARIFICATION_NEEDED';
    approver_name: string | null;
    approver_email: string | null;
    decision_date: string | null;
    sla_deadline: string | null;
    sla_breached: boolean;
    comments: string | null;
    loop_back_count: number;
}

export interface LoopBack {
    id: number;
    loop_back_number: number;
    loop_back_type: string;
    initiated_by_party: string;
    initiator_name: string;
    reason: string;
    routed_to: string;
    routing_reasoning: string;
    initiated_at: string;
    resolved_at: string | null;
    delay_days: number;
    resolution_type: string | null;
}

export interface NpaComment {
    id: number;
    comment_type: string;
    comment_text: string;
    author_name: string;
    author_role: string;
    parent_comment_id: number | null;
    generated_by_ai: boolean;
    ai_agent: string | null;
    ai_confidence: number | null;
    created_at: string;
}

@Injectable({
    providedIn: 'root'
})
export class ApprovalService {
    private http = inject(HttpClient);
    private apiUrl = '/api/approvals';

    /**
     * GET all pending approval items
     */
    getPending(): Observable<ApprovalItem[]> {
        return this.http.get<ApprovalItem[]>(this.apiUrl);
    }

    /**
     * GET sign-offs for a specific NPA
     */
    getSignoffs(npaId: string): Observable<SignoffRecord[]> {
        return this.http.get<SignoffRecord[]>(`${this.apiUrl}/npas/${npaId}/signoffs`);
    }

    /**
     * GET loop-backs for a specific NPA
     */
    getLoopBacks(npaId: string): Observable<LoopBack[]> {
        return this.http.get<LoopBack[]>(`${this.apiUrl}/npas/${npaId}/loopbacks`);
    }

    /**
     * GET comments for a specific NPA
     */
    getComments(npaId: string): Observable<NpaComment[]> {
        return this.http.get<NpaComment[]>(`${this.apiUrl}/npas/${npaId}/comments`);
    }

    /**
     * POST a new comment
     */
    addComment(npaId: string, comment: { comment_type: string; comment_text: string; author_name: string; author_role: string }): Observable<any> {
        return this.http.post(`${this.apiUrl}/npas/${npaId}/comments`, comment);
    }

    /**
     * POST sign-off decision
     */
    makeDecision(npaId: string, party: string, decision: { decision: string; comments?: string; conditions_imposed?: string }): Observable<any> {
        return this.http.post(`${this.apiUrl}/npas/${npaId}/signoffs/${encodeURIComponent(party)}/decide`, decision);
    }
}
