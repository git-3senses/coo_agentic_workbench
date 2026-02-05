import { Injectable, inject } from '@angular/core';
import { Observable, of, map, delay } from 'rxjs';
import { DifyService } from './dify.service';

export interface AgentCapability {
    id: string;
    name: string;
    description: string;
    icon: string; // Lucide icon name
    stats: {
        label: string;
        value: string;
    };
    actionLabel: string;
    color: 'blue' | 'purple' | 'amber' | 'green' | 'red' | 'indigo';
    status: 'active' | 'beta' | 'maintenance';
}

export interface AgentWorkItem {
    id: string;
    agentName: string;
    operation: string;
    status: 'running' | 'completed' | 'waiting';
    duration: string;
    color: 'blue' | 'purple' | 'amber' | 'green' | 'red' | 'fuchsia';
}

export interface HealthMetrics {
    status: 'healthy' | 'degraded' | 'down';
    latency: number;
    uptime: number; // Percentage
    activeAgents: number;
    totalDecisions: number;
}

@Injectable({
    providedIn: 'root'
})
export class DifyAgentService {
    private difyBase = inject(DifyService);

    getCapabilities(): Observable<AgentCapability[]> {
        // Mock Data - In real implementation, this could come from a Dify configuration or config file
        return of([
            {
                id: 'create_npa',
                name: 'Create New NPA',
                description: 'Guides you through 10 questions to build a complete NPA with 78% auto-fill.',
                icon: 'file-edit',
                stats: { label: 'Creates', value: '1,248' },
                actionLabel: 'Start',
                color: 'blue',
                status: 'active'
            },
            {
                id: 'find_similar',
                name: 'Find Similar NPAs',
                description: 'Search 1,784 historical records by semantic similarity using vector embeddings.',
                icon: 'sparkles',
                stats: { label: 'Match Rate', value: '94%' },
                actionLabel: 'Search',
                color: 'purple',
                status: 'active'
            },
            {
                id: 'predict_outcome',
                name: 'Predict Outcome',
                description: 'ML precision forecasts on approval likelihood, timeline, and potential bottlenecks.',
                icon: 'trending-up',
                stats: { label: 'Accuracy', value: '92%' },
                actionLabel: 'Predict',
                color: 'amber',
                status: 'active'
            },
            {
                id: 'policy_qa',
                name: 'Policy Q&A',
                description: 'Ask anything about MAS regulations and internal DBS policies. Citations included.',
                icon: 'book-open',
                stats: { label: 'Docs', value: '200+' },
                actionLabel: 'Ask',
                color: 'green',
                status: 'active'
            },
            // === GAPS FILLED BELOW ===
            {
                id: 'auto_fill',
                name: 'Template Auto-Fill',
                description: 'Upload term sheets or RFPs to automatically populate the 47-field NPA template.',
                icon: 'zap',
                stats: { label: 'Coverage', value: '78%' },
                actionLabel: 'Upload',
                color: 'indigo',
                status: 'active'
            },
            {
                id: 'classify_route',
                name: 'Classify & Route',
                description: 'Determine if product is NTG, Variation, or Existing and assign approval track.',
                icon: 'git-branch',
                stats: { label: 'Confidence', value: '88%' },
                actionLabel: 'Classify',
                color: 'red',
                status: 'active'
            },
            {
                id: 'validate_docs',
                name: 'Validate Documents',
                description: 'Check completeness and compliance of uploaded documents before submission.',
                icon: 'shield-check',
                stats: { label: 'Catch Rate', value: '89%' },
                actionLabel: 'Validate',
                color: 'blue',
                status: 'beta'
            },
            {
                id: 'historical_analysis',
                name: 'Historical Analysis',
                description: 'Understand past decisions and approval reasoning for 1,784+ NPAs.',
                icon: 'history',
                stats: { label: 'Records', value: '1.7k' },
                actionLabel: 'Analyze',
                color: 'purple',
                status: 'active'
            }
        ] as AgentCapability[]).pipe(delay(500)); // Simulate network
    }

    getActiveWorkItems(): Observable<AgentWorkItem[]> {
        return of([
            { id: 'JOB-992', agentName: 'TemplateAutoFill', operation: 'Parsing "Term_Sheet_FX.pdf"', status: 'running', duration: '1.2s', color: 'blue' },
            { id: 'JOB-991', agentName: 'Classification', operation: 'Classifying TSG2025-041', status: 'completed', duration: '450ms', color: 'purple' },
            { id: 'JOB-990', agentName: 'Orchestration', operation: 'Handing off to Human (Ops)', status: 'waiting', duration: '12m', color: 'amber' },
            { id: 'JOB-989', agentName: 'KB Search', operation: 'Indexing "MAS_Guidelines.pdf"', status: 'completed', duration: '890ms', color: 'fuchsia' },
            { id: 'JOB-988', agentName: 'Prohibited List', operation: 'Scanning "Sanctions.csv"', status: 'running', duration: '2.1s', color: 'red' }
        ] as AgentWorkItem[]).pipe(delay(300));
    }

    getAgentHealth(): Observable<HealthMetrics> {
        return of({
            status: 'healthy',
            latency: 42,
            uptime: 99.9,
            activeAgents: 8,
            totalDecisions: 14529
        } as HealthMetrics).pipe(delay(200));
    }
}
