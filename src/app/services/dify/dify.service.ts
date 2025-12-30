import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay, map } from 'rxjs';

export interface DifyAgentResponse {
    answer: string;
    metadata?: {
        agent_action?: 'ROUTE_WORK_ITEM' | 'ASK_CLARIFICATION' | 'STOP_PROCESS';
        payload?: any;
    };
}

@Injectable({
    providedIn: 'root'
})
export class DifyService {
    private useMockDify = true; // Toggle for Dev
    private conversationId: string | null = null;

    // Mock State for determining flow
    private conversationStep = 0;

    constructor(private http: HttpClient) { }

    sendMessage(query: string, userContext: any = {}): Observable<DifyAgentResponse> {
        if (this.useMockDify) {
            return this.mockDifyLogic(query);
        }

        // Real API Call (Placeholder)
        return this.http.post<any>('/api/dify/chat-messages', {
            query,
            inputs: userContext,
            conversation_id: this.conversationId,
            user: 'user-123'
        }).pipe(
            map(res => ({
                answer: res.answer,
                metadata: res.metadata
            }))
        );
    }

    // --- MOCK LOGIC (Simulating the Thinking Dify Agent) ---
    private mockDifyLogic(query: string): Observable<DifyAgentResponse> {
        const lower = query.toLowerCase();
        let response: DifyAgentResponse = { answer: "I didn't understand that." };

        // Step 0: Greeting -> Discovery
        if (this.conversationStep === 0) {
            this.conversationStep++;
            return of({
                answer: "Hello! I'm the Product Ideation Agent. \n\nI can help you classify and route your product proposal. Briefly describe the product structure, underlying asset, and payout logic."
            }).pipe(delay(1000));
        }

        // Step 1: User Describes Product -> Check Classification & Ask Cross-Border
        if (this.conversationStep === 1) {
            this.conversationStep++;

            // Simulating "Thinking" about Classification
            if (lower.includes('crypto')) {
                return of({
                    answer: "⚠️ **Stop**. My analysis detects this as a **New-to-Group (NTG)** product (Crypto Asset Class). \n\nYou cannot proceed with an NPA yet. You must obtain **PAC (Product Approval Committee)** approval first.",
                    metadata: { agent_action: 'STOP_PROCESS' }
                } as DifyAgentResponse).pipe(delay(2000));
            }

            return of({
                answer: "I've analyzed your description. \n\n*   **Classification**: Variation / Existing\n*   **Similar NPA**: Found 'TSG1917' (Active)\n\nOne critical check before we proceed: **Will this product involve booking across multiple locations (Cross-Border)?**"
            }).pipe(delay(2000));
        }

        // Step 2: User Answers Cross-Border -> Final Routing
        if (this.conversationStep === 2) {
            const isCrossBorder = lower.includes('yes') || lower.includes('hk') || lower.includes('london');

            let answer = "Thanks. I've finalized the configuration.\n\n";
            answer += "### Summary\n";
            answer += "*   **Track**: NPA Lite (Variation)\n";
            answer += `*   **Cross-Border**: ${isCrossBorder ? '✅ YES' : 'NO'}\n`;

            if (isCrossBorder) {
                answer += "*   **Mandatory Sign-Offs Added**: Finance, Credit, MLR, Tech, Ops\n";
            }
            answer += "\nI have prepared the Work Item shell. Please click below to generate it.";

            return of({
                answer: answer,
                metadata: {
                    agent_action: 'ROUTE_WORK_ITEM',
                    payload: {
                        track: 'NPA_LITE',
                        isCrossBorder: isCrossBorder,
                        mandatorySignOffs: isCrossBorder ? ['FINANCE', 'CREDIT', 'MLR', 'TECH', 'OPS'] : []
                    }
                }
            } as DifyAgentResponse).pipe(delay(2500));
        }

        return of({ answer: "I've already completed this analysis. Please reset if you want to start over." } as DifyAgentResponse).pipe(delay(500));
    }

    reset() {
        this.conversationStep = 0;
    }
}
