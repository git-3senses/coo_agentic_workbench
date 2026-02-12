import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, delay } from 'rxjs/operators';
import { NpaClassification } from '../lib/npa-interfaces';

export interface ReadinessDomain {
    name: string;
    id?: string; // e.g. 'strategic'
    status: 'PASS' | 'FAIL' | 'MISSING' | 'PENDING' | 'WARNING';
    observation: string;
    score?: number;
    weight?: number;
    icon?: string;
    questions?: any[];
}

export interface ReadinessResult {
    isReady: boolean;
    score: number; // 0-100
    domains: ReadinessDomain[];
    overallAssessment: string;
    findings?: string[];
}

export interface ClassificationResult {
    tier: NpaClassification;
    reason: string;
    requiredApprovers: string[];
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    score?: number;
    breakdown?: any;
}

@Injectable({
    providedIn: 'root'
})
export class AgentGovernanceService {
    private http = inject(HttpClient);
    private apiUrl = '/api/governance';

    constructor() { }

    /**
     * CREATE Project (Initiation Phase)
     */
    createProject(title: string, description: string): Observable<{ id: string, status: string }> {
        return this.http.post<{ id: string, status: string }>(`${this.apiUrl}/projects`, {
            title,
            description
        });
    }

    /**
     * ANALYZE Readiness (Simulation of Dify Agent via Logic)
     * Returns a PREDICTION to be used in the UI.
     */
    analyzeReadiness(description: string): Observable<ReadinessResult> {
        // TODO: In future, this calls Dify Agent. For now, we simulate logic here or on backend.
        // We will stick to local simulation for speed, then SAVE to backend.

        // Simulating async delay
        return of(this.mockReadinessLogic(description)).pipe(delay(1500));
    }

    /**
     * SAVE Readiness Result to Database (Persistence)
     */
    saveReadinessAssessment(projectId: string, result: ReadinessResult): Observable<any> {
        return this.http.post(`${this.apiUrl}/readiness`, {
            projectId,
            domain: 'ALL', // Simplified for demo
            status: result.isReady ? 'PASS' : 'FAIL',
            score: result.score,
            findings: result.domains.map(d => ({ domain: d.name, status: d.status, observation: d.observation }))
        });
    }

    /**
     * ANALYZE Classification (Simulation)
     */
    analyzeClassification(description: string, jurisdiction: string = 'SG'): Observable<ClassificationResult> {
        return of(this.mockClassificationLogic(description, jurisdiction)).pipe(delay(1500));
    }

    /**
     * SAVE Classification Result to Database
     */
    saveClassification(projectId: string, result: ClassificationResult): Observable<any> {
        return this.http.post(`${this.apiUrl}/classification`, {
            projectId,
            totalScore: result.score || 0,
            calculatedTier: result.tier,
            breakdown: result.breakdown || {},
            overrideReason: null
        });
    }

    /**
     * GET All Projects (Dashboard)
     */
    getProjects(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/projects`);
    }

    /**
     * GET Project Details (Full View)
     */
    getProjectDetails(id: string): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/projects/${id}`);
    }

    // --- INTERNAL LOGIC (Moved from synchronous methods) ---

    private mockReadinessLogic(description: string): ReadinessResult {
        const domains: ReadinessDomain[] = [
            { name: 'Strategic Alignment', id: 'strategic', status: 'PASS', observation: 'Aligned with regional growth targets.' },
            { name: 'Financial Viability', id: 'financial', status: 'MISSING', observation: 'No projected revenue or cost data found.' },
            { name: 'Risk Management', id: 'risk', status: 'PASS', observation: 'Standard risk frameworks apply.' },
            { name: 'Legal & Compliance', id: 'legal', status: 'PASS', observation: 'No specific regulatory hurdles detected.' },
            { name: 'Operations', id: 'ops', status: 'PASS', observation: 'Standard settlement processes available.' },
            { name: 'Technology', id: 'tech', status: 'PASS', observation: 'Uses existing trading platforms.' },
            { name: 'Conduct & Culture', id: 'conduct', status: 'PASS', observation: 'No conduct risks identified.' }
        ];

        const text = description.toLowerCase();

        if (text.includes('crypto') || text.includes('digital asset')) {
            const risk = domains.find(d => d.id === 'risk');
            if (risk) {
                risk.status = 'FAIL';
                risk.observation = 'Digital Assets require special Risk Board approval.';
            }

            const tech = domains.find(d => d.id === 'tech');
            if (tech) {
                tech.status = 'MISSING';
                tech.observation = 'Custody solution for digital assets not defined.';
            }
        }

        if (text.includes('cross-border')) {
            const legal = domains.find(d => d.id === 'legal');
            if (legal) {
                legal.status = 'MISSING';
                legal.observation = 'Cross-border legal opinion required for target jurisdictions.';
            }
        }

        // Calculate Score
        const passCount = domains.filter(d => d.status === 'PASS').length;
        const score = Math.round((passCount / 7) * 100);

        return {
            isReady: score >= 85,
            score,
            domains,
            overallAssessment: score >= 85
                ? 'Project appears ready for initiation.'
                : 'Critical gaps detected in Financials or Risk. Please address before proceeding.'
        };
    }

    private mockClassificationLogic(description: string, jurisdiction: string): ClassificationResult {
        const text = description.toLowerCase();
        let tier: NpaClassification = 'Existing';
        let risk: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
        let reason = 'Standard product classification.';
        let approvers = ['Business Head'];
        let score = 5;

        if (text.includes('crypto') || text.includes('blockchain') || text.includes('ai driven')) {
            tier = 'New-to-Group';
            risk = 'HIGH';
            reason = 'Complex or Novel Product Structure detected.';
            approvers = ['Group CRO', 'Group CFO', 'Board Risk Committee'];
            score = 18;
        } else if (text.includes('cross-border') || jurisdiction !== 'SG') {
            tier = 'Variation';
            risk = 'MEDIUM';
            reason = 'Existing product extended to new jurisdiction.';
            approvers = ['Regional Head', 'Legal', 'Compliance'];
            score = 12;
        } else if (text.includes('vanilla') || text.includes('enhancement')) {
            tier = 'NPA Lite';
            risk = 'LOW';
            reason = 'Minor enhancement to existing approved product.';
            approvers = ['Desk Head', 'Ops Head'];
            score = 8;
        }

        return {
            tier,
            riskLevel: risk,
            reason,
            requiredApprovers: approvers,
            score,
            breakdown: { text_match: true }
        };
    }
}
