import { NpaSection } from './npa-interfaces';

export const MOCK_NPA_SECTIONS: NpaSection[] = [
    {
        id: 'spec',
        title: '1. Product & Business Case',
        description: 'Core details defining the product structure and economics.',
        fields: [
            {
                key: 'name', label: 'Product Name', value: 'FX Put Option GBP/USD', lineage: 'AUTO',
                lineageMetadata: { sourceDocId: 'TSG1917', sourceSnippet: 'Product Name: FX Put Option EUR/USD', confidenceScore: 98 }
            },
            {
                key: 'type', label: 'Product Type', value: 'FX Option', lineage: 'AUTO',
                type: 'select',
                options: ['FX Forward', 'FX Option', 'FX Swap', 'IRS', 'CDS'],
                lineageMetadata: { sourceDocId: 'Classification Agent', sourceSnippet: 'Classified as FX Option based on "Put Option" keyword.', confidenceScore: 99 }
            },
            { key: 'desk', label: 'Booking Desk', value: 'Singapore FX', lineage: 'AUTO' },
            {
                key: 'bu', label: 'Business Unit', value: 'Treasury & Markets', lineage: 'AUTO',
                lineageMetadata: { sourceDocId: 'TSG1917', sourceSnippet: 'Business Unit: Treasury & Markets', confidenceScore: 100 }
            },
            {
                key: 'notional', label: 'Notional Amount', value: '$75,000,000', lineage: 'AUTO',
                lineageMetadata: { sourceDocId: 'Term Sheet', sourceSnippet: 'Notional: USD 75M', confidenceScore: 100 }
            },
            { key: 'tenor', label: 'Tenor', value: '6 Months', lineage: 'AUTO' },
            {
                key: 'counterparty', label: 'Counterparty Name', value: '', lineage: 'MANUAL', placeholder: 'Enter Legal Entity Name', required: true,
                lineageMetadata: { agentTip: 'I can search Salesforce for recent counterparties in Hong Kong.' }
            },
            { key: 'tradeDate', label: 'Trade Date', value: '', lineage: 'MANUAL', type: 'date', required: true },
            {
                key: 'rationale', label: 'Business Rationale', value: 'ABC Corporation requests GBP/USD put option to hedge GBP receivables. Estimated revenue: $150K.', lineage: 'ADAPTED', type: 'textarea',
                lineageMetadata: {
                    sourceDocId: 'TSG1917',
                    sourceSnippet: 'Client requests EUR/USD put option to hedge EUR receivables.',
                    adaptationLogic: 'Adapted currency pair and client context based on chat input.',
                    confidenceScore: 85
                }
            },
            {
                key: 'pac_approval', label: 'PAC Approval Ref', value: 'N/A (Variation)', lineage: 'AUTO',
                lineageMetadata: { sourceDocId: 'Classification Rules', sourceSnippet: 'Product Type: Variation -> No PAC Approval Required', confidenceScore: 100 }
            }
        ]
    },
    {
        id: 'ops',
        title: '2. Operational & Technology',
        description: 'Systems and processes for booking, valuation, and settlement.',
        fields: [
            {
                key: 'system', label: 'Booking System', value: 'Murex', lineage: 'AUTO',
                lineageMetadata: { sourceDocId: 'TSG1917', sourceSnippet: 'Booking System: Murex (Version 3.1)', confidenceScore: 95 }
            },
            {
                key: 'valuation', label: 'Valuation Model', value: 'Black-Scholes', lineage: 'AUTO',
                lineageMetadata: { sourceDocId: 'TSG1917', sourceSnippet: 'Valuation: Black-Scholes Standard Model', confidenceScore: 95 }
            },
            { key: 'settlement', label: 'Settlement Method', value: 'Cash (USD) via CLS', lineage: 'AUTO' },
            { key: 'conf', label: 'Confirmation Process', value: 'SWIFT MT300', lineage: 'AUTO' },
            {
                key: 'reconciliation', label: 'Reconciliation Process', value: 'Daily reconciliation between Murex (front office) and SAP (back office). Ops team validates trade details.', lineage: 'AUTO', type: 'textarea'
            },
            {
                key: 'tech_reqs', label: 'Technology Requirements', value: 'None identified. Standard product code exists in Murex.', lineage: 'AUTO', type: 'textarea'
            }
        ]
    },
    {
        id: 'pricing',
        title: '3. Pricing Model',
        description: 'Methodology for fair value and risk sensitivity.',
        fields: [
            { key: 'method', label: 'Pricing Methodology', value: 'Mid-market + bid-offer spread', lineage: 'AUTO' },
            {
                key: 'roae', label: 'ROAE Sensitivity Analysis', value: 'Sensitivity: 10bps move = $85k impact...', lineage: 'ADAPTED', type: 'textarea',
                lineageMetadata: {
                    sourceDocId: 'Finance Policy 2024',
                    sourceSnippet: 'Deals > $50M Notional require ROAE sensitivity.',
                    adaptationLogic: 'Triggered by Rule: Notional > $50M. Template inserted for user completion.',
                    confidenceScore: 90
                }
            },
            {
                key: 'pricing_assumptions', label: 'Pricing Assumptions', value: 'Vol: 9.2%, IR: SOFR, Spread: 15bps', lineage: 'AUTO', type: 'textarea',
                lineageMetadata: { sourceDocId: 'Market Data Agent', sourceSnippet: 'Current 6M GBPUSD implied vol is 9.2%.', confidenceScore: 95 }
            },
            { key: 'bespoke', label: 'Bespoke Adjustments', value: '', lineage: 'MANUAL', type: 'textarea', placeholder: 'Describe any non-standard pricing logic...' },
        ]
    },
    {
        id: 'risk',
        title: '4. Risk Assessments',
        description: 'Evaluation of market, credit, listing, and operational risks.',
        fields: [
            {
                key: 'market', label: 'Market Risk (VaR)', value: 'Moderate-to-High. Daily VaR estimated at $360k (99% confidence).', lineage: 'ADAPTED', type: 'textarea',
                lineageMetadata: {
                    sourceDocId: 'TSG1917',
                    sourceSnippet: 'Daily VaR: $180k (based on $25M Notional).',
                    adaptationLogic: 'Scaled VaR linearly from $25M -> $75M.',
                    confidenceScore: 85
                }
            },
            {
                key: 'credit', label: 'Credit Risk', value: 'Counterparty rated A- (S&P). Weekly collateral exchange required per CSA.', lineage: 'ADAPTED', type: 'textarea',
                lineageMetadata: {
                    sourceDocId: 'Credit Matrix',
                    sourceSnippet: 'Rating: BBB+ requires Daily collateral.',
                    adaptationLogic: 'Adjusted collateral frequency to Weekly based on improved Rating (A-).',
                    confidenceScore: 92
                }
            },
            {
                key: 'ops_risk', label: 'Operational Risk', value: 'Moderate. Cross-border booking (SG-HK) requires manual month-end reconciliation.', lineage: 'ADAPTED', type: 'textarea',
                lineageMetadata: {
                    sourceDocId: 'Ops Policy: Branch',
                    sourceSnippet: 'Single entity booking: Low Risk.',
                    adaptationLogic: 'Inserted Cross-Border Clause due to SG Desk + HK Counterparty.',
                    confidenceScore: 95
                }
            },
            {
                key: 'liquidity', label: 'Liquidity Risk', value: 'Liquid. GBP/USD is a major pair with deep liquidity.', lineage: 'AUTO', type: 'textarea'
            },
            {
                key: 'reputational', label: 'Reputational Risk', value: 'Low. Standard corporate hedging activity.', lineage: 'AUTO', type: 'textarea'
            }
        ]
    },
    {
        id: 'data',
        title: '5. Data Management',
        description: 'Data fields, quality standards, and reporting.',
        fields: [
            { key: 'data_fields', label: 'Required Data Fields', value: 'Trade ID, Notional, Currency Pair, Strike, Expiry, Counterparty LEI', lineage: 'AUTO', type: 'textarea' },
            { key: 'data_quality', label: 'Data Quality Standards', value: 'Adheres to PURE principles. Automated validation in Murex.', lineage: 'AUTO', type: 'textarea' },
            { key: 'reporting_reqs', label: 'Reporting Requirements', value: 'MAS 610 (Daily), Internal Risk Reports (Daily)', lineage: 'AUTO', type: 'textarea' }
        ]
    },
    {
        id: 'reg',
        title: '6. Regulatory Requirements',
        description: 'Compliance with local and international regulations.',
        fields: [
            { key: 'mas656', label: 'Applicable Regulations', value: 'MAS 656, CFTC Part 20, EMIR', lineage: 'AUTO' },
            { key: 'reporting', label: 'Reporting Obligations', value: 'DTCC SDR Reporting required within T+1', lineage: 'AUTO' },
            {
                key: 'kyc', label: 'KYC Status', value: 'Completed (2024-03-15). Risk Rating: Low.', lineage: 'AUTO',
                lineageMetadata: { sourceDocId: 'C720 CRM', sourceSnippet: 'KYC Valid until 2027-03-15', confidenceScore: 100 }
            },
            {
                key: 'sanctions', label: 'Sanctions Screening', value: 'PASS. No matches found.', lineage: 'AUTO',
                lineageMetadata: { sourceDocId: 'Prohibited List Checker', sourceSnippet: 'Screened against OFAC, UN, MAS Lists.', confidenceScore: 100 }
            }
        ]
    },
    {
        id: 'appendix',
        title: '7. Appendices (Entity & IP)',
        description: 'Booking entity, cross-border details, and IP check.',
        fields: [
            { key: 'booking_entity', label: 'Booking Entity', value: 'DBS Bank Ltd (Singapore)', lineage: 'AUTO', type: 'select', options: ['DBS Bank Ltd (Singapore)', 'DBS Bank (Hong Kong) Limited'] },
            { key: 'cross_border', label: 'Cross-Border Transaction?', value: 'YES', lineage: 'AUTO' },
            { key: 'jurisdictions', label: 'Jurisdictions Involved', value: 'Singapore (MAS), Hong Kong (HKMA)', lineage: 'AUTO' },
            { key: 'ip_check', label: 'Proprietary Models?', value: 'NO (Standard Black-Scholes)', lineage: 'AUTO' },
            { key: 'third_party_ip', label: 'Third-Party IP', value: 'Bloomberg Terminal (Market Data)', lineage: 'AUTO' }
        ]
    },
    {
        id: 'signoff',
        title: '8. Sign-Off Matrix',
        description: 'Required approvers based on product classification.',
        fields: [
            {
                key: 'parties', label: 'Required Sign-Offs', value: 'RMG-Credit, Finance (Product Control), Finance VP, Market Risk, Ops, Technology', lineage: 'ADAPTED', type: 'textarea',
                lineageMetadata: {
                    sourceDocId: 'Classification Agent',
                    sourceSnippet: 'Standard Sign-offs: Credit, Finance, MLR.',
                    adaptationLogic: 'Added "Finance VP" (Notional > $50M) and "Ops/Tech" (Cross-Border Rule).',
                    confidenceScore: 100
                }
            },
            { key: 'timeline', label: 'Est. Approval Timeline', value: '4-5 Days', lineage: 'AUTO', tooltip: 'Predicted by ML Agent' },
        ]
    },
    {
        id: 'legal',
        title: '9. Legal Considerations',
        fields: [
            { key: 'law', label: 'Governing Law', value: 'Singapore Law', lineage: 'AUTO' },
            { key: 'docs', label: 'Documentation', value: 'ISDA Master Agreement (2002)', lineage: 'AUTO' },
            { key: 'special', label: 'Special Provisions', value: '', lineage: 'MANUAL', type: 'textarea' },
        ]
    },
    {
        id: 'attachments',
        title: '10. Supporting Documents',
        description: 'Attach any relevant files, term sheets, or email approvals.',
        fields: [
            { key: 'termSheet', label: 'Final Term Sheet', value: '', lineage: 'MANUAL', type: 'file', required: true, tooltip: 'Required for approval.' },
            { key: 'riskMemo', label: 'Risk Memo', value: '', lineage: 'MANUAL', type: 'file' },
        ]
    }
];
