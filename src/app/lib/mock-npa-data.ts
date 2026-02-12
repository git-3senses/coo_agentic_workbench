import { NpaProject, NpaSection } from './npa-interfaces';
import { GOLDEN_NPA_SECTIONS } from './npa-golden-template-data';

export const MOCK_PROJECTS: NpaProject[] = [
    {
        id: 'NPA-2024-001',
        title: 'Digital Asset Custody Expansion',
        description: 'Proposal to expand digital asset custody services to institutional clients in Hong Kong.',
        submittedBy: 'Sarah Jenkins',
        submittedDate: new Date('2024-02-10'),
        type: 'NPA',
        npaType: 'New-to-Group',
        riskLevel: 'HIGH',
        isCrossBorder: true,
        jurisdictions: ['Singapore', 'Hong Kong'],
        notional: 50000000,
        stage: 'PENDING_SIGN_OFFS',
        requiredSignOffs: ['RMG-Credit', 'Legal & Compliance', 'T&O-Tech', 'Group Tax'],
        signOffMatrix: {
            'RMG-Credit': { party: 'RMG-Credit', status: 'APPROVED', approverName: 'David Lee', approvedDate: new Date('2024-02-12'), loopBackCount: 0 },
            'Legal & Compliance': { party: 'Legal & Compliance', status: 'PENDING', loopBackCount: 0 },
            'T&O-Tech': { party: 'T&O-Tech', status: 'PENDING', loopBackCount: 0 },
            'Group Tax': { party: 'Group Tax', status: 'PENDING', loopBackCount: 0 }
        }
    },
    {
        id: 'NPA-2024-002',
        title: 'Project Phoenix - AI Credit Scoring',
        description: 'Implementation of ML-based credit scoring model for SME lending.',
        submittedBy: 'Mike Chen',
        submittedDate: new Date('2024-02-15'),
        type: 'NPA',
        npaType: 'Variation',
        riskLevel: 'MEDIUM',
        isCrossBorder: false,
        notional: 12000000,
        stage: 'RETURNED_TO_MAKER',
        requiredSignOffs: ['RMG-Credit', 'RMG-Market'],
        signOffMatrix: {
            'RMG-Credit': { party: 'RMG-Credit', status: 'REWORK_REQUIRED', comments: 'Model validation report missing section 4.2', loopBackCount: 1 },
            'RMG-Market': { party: 'RMG-Market', status: 'PENDING', loopBackCount: 0 }
        }
    },
    {
        id: 'DCE-2024-045',
        title: 'Vendor API Integration - Market Data',
        description: 'Onboarding new market data provider for real-time FX rates.',
        submittedBy: 'Jessica Wu',
        submittedDate: new Date('2024-02-18'),
        type: 'DCE',
        riskLevel: 'LOW',
        isCrossBorder: false,
        notional: 500000,
        stage: 'PENDING_CHECKER',
        requiredSignOffs: [],
        signOffMatrix: {}
    },
    {
        id: 'NPA-2024-003',
        title: 'Vietnam Bond Trading Desk',
        description: 'Establishment of new trading desk for Vietnamese Government Bonds.',
        submittedBy: 'Sarah Jenkins',
        submittedDate: new Date('2024-02-05'),
        type: 'NPA',
        npaType: 'New-to-Group',
        riskLevel: 'HIGH',
        isCrossBorder: true,
        jurisdictions: ['Singapore', 'Vietnam'],
        notional: 100000000, // 100M
        stage: 'PENDING_FINAL_APPROVAL',
        requiredSignOffs: ['RMG-Credit', 'Group Finance', 'T&O-Ops', 'Legal & Compliance'],
        signOffMatrix: {
            'RMG-Credit': { party: 'RMG-Credit', status: 'APPROVED', approverName: 'David Lee', loopBackCount: 0 },
            'Group Finance': { party: 'Group Finance', status: 'APPROVED', approverName: 'Amanda Low', loopBackCount: 0 },
            'T&O-Ops': { party: 'T&O-Ops', status: 'APPROVED', approverName: 'Raj Patel', loopBackCount: 0 },
            'Legal & Compliance': { party: 'Legal & Compliance', status: 'APPROVED_CONDITIONAL', conditions: ['Subject to local counsel opinion on enforceability'], approverName: 'James Tan', loopBackCount: 0 }
        },
        postLaunchConditions: [
            { condition: 'Quarterly volume review with Risk', owner: 'RMG-Credit', status: 'PENDING' }
        ]
    },
    {
        id: 'NPA-2024-004',
        title: 'Retail Wealth App - Lite Version',
        description: 'Simplified wealth management app for mass market segment.',
        submittedBy: 'Mike Chen',
        submittedDate: new Date('2024-02-20'),
        type: 'NPA',
        npaType: 'NPA Lite',
        riskLevel: 'LOW',
        isCrossBorder: false,
        notional: 0,
        stage: 'DRAFT',
        requiredSignOffs: [], // Not determined yet
        signOffMatrix: {}
    }
];

export const MOCK_NPA_SECTIONS: NpaSection[] = GOLDEN_NPA_SECTIONS;
