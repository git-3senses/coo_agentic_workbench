import { NpaSection } from './npa-interfaces';

export const GOLDEN_NPA_SECTIONS: NpaSection[] = [
    {
        id: 'A',
        title: 'PART A: BASIC PRODUCT INFORMATION',
        description: 'Core product identification, business unit details, and process classification.',
        fields: [
            { key: 'A.1', label: 'A.1 Product Identification', value: '', lineage: 'AUTO', type: 'header' },
            { key: 'productName', label: 'Product/Service Name', value: '', lineage: 'MANUAL', required: true, placeholder: 'Full descriptive name' },
            { key: 'npaRefId', label: 'NPA Reference ID', value: '', lineage: 'AUTO', placeholder: 'System-generated (e.g. TSGxxxx)' },
            { key: 'productCategory', label: 'Product Category', value: '', lineage: 'AUTO', type: 'select', options: ['Trading', 'Banking', 'Investment', 'Custody', 'Payment'] },
            { key: 'subCategory', label: 'Sub-Category', value: '', lineage: 'AUTO', placeholder: 'Detailed classification' },

            { key: 'A.2', label: 'A.2 Business Unit Information', value: '', lineage: 'AUTO', type: 'header' },
            { key: 'proposingUnit', label: 'Proposing Unit (PU)', value: '', lineage: 'AUTO', placeholder: 'Primary business unit' },
            { key: 'locations', label: 'Locations Covered', value: '', lineage: 'MANUAL', required: true, placeholder: 'e.g., Singapore, Hong Kong' },
            { key: 'legalEntities', label: 'Legal Entities Involved', value: '', lineage: 'MANUAL', required: true, placeholder: 'e.g., DBS Bank Ltd, DBS Vickers' },
            { key: 'productManager', label: 'Product Manager Name & Team', value: '', lineage: 'AUTO' },
            { key: 'groupProductHead', label: 'Group Product Head', value: '', lineage: 'AUTO' },
            { key: 'proposalPreparer', label: 'Proposal Preparer/Lead', value: '', lineage: 'AUTO' },

            { key: 'A.3', label: 'A.3 Process Information', value: '', lineage: 'AUTO', type: 'header' },
            { key: 'processType', label: 'NPA Process Type', value: '', lineage: 'AUTO', type: 'select', options: ['Full NPA', 'NPA Lite', 'Bundling', 'Evergreen'] },
            { key: 'classification', label: 'Classification', value: '', lineage: 'AUTO', type: 'select', options: ['New-to-Group', 'Variation', 'Existing'] },
            { key: 'businessCaseApproved', label: 'Business Case Approved', value: 'No', lineage: 'MANUAL', type: 'select', options: ['Yes', 'No'] },
            { key: 'pacApprovalDate', label: 'PAC Approval Date', value: '', lineage: 'MANUAL', type: 'date' },
            { key: 'kickOffDate', label: 'NPA Kick-off Meeting Date', value: '', lineage: 'AUTO', type: 'date' },
            { key: 'targetGoLive', label: 'Target Go-Live Date', value: '', lineage: 'MANUAL', type: 'date', required: true },

            { key: 'A.4', label: 'A.4 Journey and Authority', value: '', lineage: 'AUTO', type: 'header' },
            { key: 'mtjImpact', label: 'MtJ Journey(s) Impacted', value: '', lineage: 'MANUAL', placeholder: 'Moment of Joy journeys' },
            { key: 'approvingAuthority', label: 'Approving Authority', value: '', lineage: 'AUTO' },
            { key: 'crossBorderIndicator', label: 'Cross-Border Indicator', value: 'No', lineage: 'AUTO', type: 'select', options: ['Yes', 'No'] }
        ]
    },
    {
        id: 'B',
        title: 'PART B: SIGN-OFF PARTIES MATRIX',
        description: 'Identification of required approvers and stakeholders.',
        fields: [
            { key: 'B.1', label: 'B.1 Core Sign-Off Requirements', value: '', lineage: 'AUTO', type: 'header' },
            { key: 'rmgMarket', label: 'RMG - Market & Liquidity', value: 'Required', lineage: 'AUTO', type: 'select', options: ['Required', 'Not Required'] },
            { key: 'rmgCredit', label: 'RMG - Credit Risk', value: 'Required', lineage: 'AUTO', type: 'select', options: ['Required', 'Not Required'] },
            { key: 'tno', label: 'Technology & Operations', value: 'Required', lineage: 'AUTO', type: 'select', options: ['Required', 'Not Required'] },
            { key: 'lcs', label: 'Legal, Compliance & Secretariat', value: 'Required', lineage: 'AUTO', type: 'select', options: ['Required', 'Not Required'] },
            { key: 'finance', label: 'Finance', value: 'Required', lineage: 'AUTO', type: 'select', options: ['Required', 'Not Required'] },

            { key: 'B.2', label: 'B.2 Special Approvers', value: '', lineage: 'AUTO', type: 'header' },
            { key: 'pacRequired', label: 'PAC (Product Approval Committee)', value: 'No', lineage: 'AUTO', type: 'select', options: ['Yes', 'No'] },
            { key: 'ceoRequired', label: 'CEO Approval', value: 'No', lineage: 'AUTO', type: 'select', options: ['Yes', 'No'] },
            { key: 'bundlingRequired', label: 'Bundling Team', value: 'No', lineage: 'AUTO', type: 'select', options: ['Yes', 'No'] },
            { key: 'regulatoryRequired', label: 'Local Regulators', value: 'No', lineage: 'AUTO', type: 'select', options: ['Yes', 'No'] }
        ]
    },
    {
        id: 'C',
        title: 'PART C: PRODUCT SPECIFICATIONS',
        description: 'Detailed product description, target market, and commercialization strategy.',
        fields: [
            { key: 'C.1', label: 'C.1 Product Description', value: '', lineage: 'AUTO', type: 'header' },
            { key: 'purposeRationale', label: 'Purpose and Rationale', value: '', lineage: 'MANUAL', type: 'textarea', required: true, placeholder: 'Customer problem, benefits, strategic alignment...' },

            { key: 'roleOfPU', label: 'Role of PU', value: '', lineage: 'MANUAL', placeholder: 'Manufacturer, Distributor, etc.' },
            { key: 'currencies', label: 'Currency Denomination', value: '', lineage: 'MANUAL', required: true },
            { key: 'fundingType', label: 'Funding Type', value: '', lineage: 'MANUAL', type: 'select', options: ['Funded', 'Unfunded', 'Hybrid'] },
            { key: 'tenor', label: 'Product Maturity/Tenor', value: '', lineage: 'MANUAL', required: true },
            { key: 'repricingInfo', label: 'Repricing Information', value: '', lineage: 'MANUAL' },
            { key: 'baseRate', label: 'Base Rate Type', value: '', lineage: 'MANUAL' },

            { key: 'businessModel', label: 'Business Model', value: '', lineage: 'MANUAL', type: 'textarea', placeholder: 'Revenue drivers, costs, volume, market size...' },

            { key: 'C.2', label: 'C.2 Target Customer Profile', value: '', lineage: 'AUTO', type: 'header' },
            { key: 'customerSegments', label: 'Customer Segmentation', value: '', lineage: 'MANUAL', type: 'textarea', placeholder: 'Institutional, Corporate, Private Bank...' },
            { key: 'customerRisk', label: 'Customer Risk Profile', value: '', lineage: 'MANUAL', type: 'textarea', placeholder: 'Investment objectives, risk tolerance...' },

            { key: 'C.3', label: 'C.3 Commercialization Approach', value: '', lineage: 'AUTO', type: 'header' },
            { key: 'distributionChannels', label: 'Distribution Channels', value: '', lineage: 'MANUAL', type: 'textarea', placeholder: 'Digital, RMs, Trading Desks...' },
            { key: 'salesFramework', label: 'Sales Framework', value: '', lineage: 'MANUAL', type: 'textarea', placeholder: 'Suitability, surveillance, marketing...' }
        ]
    },
    {
        id: 'D',
        title: 'PART D: OPS & TECH',
        description: 'Operating model, system infrastructure, and business continuity.',
        fields: [
            { key: 'D.1', label: 'D.1 Operating Model', value: '', lineage: 'AUTO', type: 'header' },
            { key: 'processFlow', label: 'End-to-End Process Flow', value: '', lineage: 'MANUAL', type: 'textarea', placeholder: 'Describe or attach diagram...' },

            { key: 'legalForm', label: 'Legal Form', value: '', lineage: 'AUTO' },
            { key: 'productFamily', label: 'Product Family', value: '', lineage: 'AUTO' },
            { key: 'productGroup', label: 'Product Group', value: '', lineage: 'AUTO' },
            { key: 'productType', label: 'Product Type (System Code)', value: '', lineage: 'AUTO' },
            { key: 'typology', label: 'Typology', value: '', lineage: 'AUTO' },
            { key: 'portfolio', label: 'Portfolio', value: '', lineage: 'AUTO' },

            { key: 'D.2', label: 'D.2 System Infrastructure', value: '', lineage: 'AUTO', type: 'header' },
            { key: 'frontOfficeSystem', label: 'Front Office Systems', value: '', lineage: 'AUTO' },
            { key: 'middleOfficeSystem', label: 'Middle Office Systems', value: '', lineage: 'AUTO' },
            { key: 'backOfficeSystem', label: 'Back Office Systems', value: '', lineage: 'AUTO' },

            { key: 'infoSecurity', label: 'Information Security', value: '', lineage: 'MANUAL', type: 'textarea', placeholder: 'Auth, Cryptography, Data Leakage...' },

            { key: 'D.3', label: 'D.3 Business Continuity', value: '', lineage: 'AUTO', type: 'header' },
            { key: 'bcpRequirements', label: 'BCP Requirements', value: '', lineage: 'MANUAL', type: 'textarea', placeholder: 'RTO, Impact Analysis...' }
        ]
    },
    {
        id: 'E',
        title: 'PART E: RISK ANALYSIS',
        description: 'Comprehensive risk assessment across all risk domains.',
        fields: [
            { key: 'E.1', label: 'E.1 Operational Risk', value: '', lineage: 'AUTO', type: 'header' },
            { key: 'regulatoryCompliance', label: 'Regulatory Compliance', value: '', lineage: 'MANUAL', type: 'textarea', placeholder: 'Licensing, cross-border, Banking Act...' },
            { key: 'legalDocs', label: 'Documentation Requirements', value: '', lineage: 'MANUAL', type: 'textarea', placeholder: 'ISDA, Term Sheets, Disclosures...' },
            { key: 'finCrime', label: 'Financial Crime Risk', value: '', lineage: 'MANUAL', type: 'textarea', placeholder: 'AML, Sanctions, Fraud, Bribery...' },

            { key: 'E.2', label: 'E.2 Market & Liquidity Risk', value: '', lineage: 'AUTO', type: 'header' },
            { key: 'marketRisk', label: 'Market Risk Factors', value: '', lineage: 'AUTO', type: 'textarea', placeholder: 'Delta, Vega, sensitivities...' },
            { key: 'liquidityRisk', label: 'Liquidity Risk Assessment', value: '', lineage: 'AUTO', type: 'textarea', placeholder: 'LCR, NSFR, HQLA...' },

            { key: 'E.3', label: 'E.3 Credit Risk', value: '', lineage: 'AUTO', type: 'header' },
            { key: 'creditAssessment', label: 'Credit Risk Assessment', value: '', lineage: 'AUTO', type: 'textarea', placeholder: 'Counterparty, Settlement, Country risk...' },
            { key: 'capitalReq', label: 'Credit Capital Requirements', value: '', lineage: 'AUTO', type: 'textarea', placeholder: 'RWA, IRBA vs Standardized...' },

            { key: 'E.4', label: 'E.4 Reputational Risk', value: '', lineage: 'AUTO', type: 'header' },
            { key: 'reputationalRisk', label: 'Reputational Risk Evaluation', value: '', lineage: 'MANUAL', type: 'textarea', placeholder: 'ESG, Market perception, Fairness...' }
        ]
    },
    {
        id: 'F',
        title: 'PART F: DATA MANAGEMENT',
        description: 'Data governance, quality, and aggregation.',
        fields: [
            { key: 'F.1', label: 'F.1 Design for Data (D4D)', value: '', lineage: 'AUTO', type: 'header' },
            { key: 'dataOwnership', label: 'Data Ownership & Quality', value: '', lineage: 'MANUAL', type: 'textarea', placeholder: 'Owners, attributes, monitoring...' },
            { key: 'privacy', label: 'Privacy & Cross-Border Data', value: '', lineage: 'MANUAL', type: 'textarea', placeholder: 'GDPR, PURE principles...' },

            { key: 'F.2', label: 'F.2 Risk Data Aggregation', value: '', lineage: 'AUTO', type: 'header' },
            { key: 'dataAggregation', label: 'Data Aggregation Capabilities', value: '', lineage: 'AUTO', type: 'textarea', placeholder: 'Reporting, Stress testing, Lineage...' }
        ]
    },
    {
        id: 'G',
        title: 'PART G: APPENDICES',
        description: 'Supporting matrices and detailed assessments.',
        fields: [
            { key: 'appendix1', label: 'Appendix 1: Entity/Location Matrix', value: '', lineage: 'AUTO', type: 'file' },
            { key: 'appendix2', label: 'Appendix 2: FinCrime Assessment', value: '', lineage: 'MANUAL', type: 'file' },
            { key: 'appendix3', label: 'Appendix 3: Trading Products Info', value: '', lineage: 'AUTO', type: 'file' }
        ]
    },
    {
        id: 'H',
        title: 'PART H: VALIDATION',
        description: 'Final checks and approval workflow status.',
        fields: [
            { key: 'H.1', label: 'H.1 Completeness Checklist', value: '', lineage: 'AUTO', type: 'header' },
            { key: 'completeness', label: 'Pre-Submission Validation', value: 'Pending', lineage: 'AUTO', type: 'text', placeholder: 'System generated status' },
            { key: 'approvalWorkflow', label: 'H.2 Approval Workflow Stage', value: '1. Document Completeness Check', lineage: 'AUTO' }
        ]
    }
];
