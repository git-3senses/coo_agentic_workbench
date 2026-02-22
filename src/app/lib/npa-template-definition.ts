/**
 * NPA Template Definition — Part C + Appendices
 * ──────────────────────────────────────────────
 * Mirrors the official "NPA Template (RMG OR Version Jun 2025)" — 20-page
 * Confluence document used by DBS for New Product Approvals.
 *
 * Part A (Basic Product Info) and Part B (Sign-off Parties) are handled
 * outside of this template editor.  This tree covers:
 *   • Part C  — Sections I–VII  (product detail completed by Proposing Unit)
 *   • Appendices 1–6            (entity, IP, financial crime, risk data, trading, 3rd-party)
 *
 * Each leaf node maps to one or more atomic `field_key` values stored in
 * `npa_form_data`.  The Doc View renderer walks this tree to produce the
 * hierarchical document layout; the Form View continues to use the flat
 * NpaSection[]/NpaField[] arrays unchanged.
 */

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

export type TemplateNodeType =
  | 'part'           // Part C wrapper
  | 'section'        // Roman numeral section (I, II, III…)
  | 'topic'          // Numbered topic within a section (1, 2, 3…)
  | 'sub_question'   // Lettered sub-question (a, b, c…)
  | 'detail'         // Numbered sub-detail (1.1, 1.2…)
  | 'table'          // Structured table (risk matrix, entity table)
  | 'appendix';      // Appendix 1–6

export interface TableRowMapping {
  rowLabel: string;
  fieldKey: string;
}

export interface TemplateNode {
  /** Unique node ID following a dotted path: 'PC.I.1.a' */
  id: string;
  /** Node type — drives CSS and indentation in the renderer */
  type: TemplateNodeType;
  /** Display label, e.g. "Product Specifications (Basic Information)" */
  label: string;
  /** Pre-computed numbering string: "I", "1", "a)", "1.1", "Appendix 1" */
  numbering: string;
  /** Italic guidance / instructional text from the official template */
  guidance?: string;
  /** Atomic field_keys whose values render under this node */
  fieldKeys?: string[];
  /** Child nodes (recursion) */
  children?: TemplateNode[];
  /** For table-type nodes: column header labels */
  tableColumns?: string[];
  /** For table-type nodes: row label → field_key mapping */
  tableFieldMapping?: TableRowMapping[];
}

// ────────────────────────────────────────────────────────────
// Part C — Product Information to be Completed by Proposing Unit
// ────────────────────────────────────────────────────────────

export const NPA_PART_C_TEMPLATE: TemplateNode = {
  id: 'PART_C',
  type: 'part',
  label: 'Part C: Product Information to be Completed by Proposing Unit',
  numbering: '',
  children: [

    // ═══════════════════════════════════════════════════════
    // I  Product Specifications (Basic Information)
    // ═══════════════════════════════════════════════════════
    {
      id: 'PC.I',
      type: 'section',
      label: 'Product Specifications (Basic Information)',
      numbering: 'I',
      children: [

        // ── 1. Description ────────────────────────────────
        {
          id: 'PC.I.1',
          type: 'topic',
          label: 'Description',
          numbering: '1',
          children: [
            {
              id: 'PC.I.1.a',
              type: 'sub_question',
              label: 'Purpose or Rationale for Proposal',
              numbering: 'a)',
              guidance: 'Describe the purpose or rationale for the proposal — what are the benefits to customers or BU/SU? Set out what problem it aims to solve. The summary should address the problem statement or articulate the value proposition.',
              fieldKeys: ['business_rationale']
            },
            {
              id: 'PC.I.1.b',
              type: 'sub_question',
              label: 'Scope and Parameters of Product/Service',
              numbering: 'b)',
              guidance: 'Describe the scope and parameters including: Role of PU (manufacturer, distributor, principal, agent); Product Features (currency denomination, funded vs unfunded, tenor, repricing info); Product Life Cycle.',
              fieldKeys: ['product_name', 'product_type', 'underlying_asset', 'tenor', 'product_role', 'funding_type', 'product_maturity', 'product_lifecycle']
            },
            {
              id: 'PC.I.1.c',
              type: 'sub_question',
              label: 'Expected Transaction Volume and Revenue per Annum',
              numbering: 'c)',
              guidance: 'Provide revenue estimate by year, gross and net of transfer pricing.',
              fieldKeys: ['notional_amount', 'revenue_year1', 'revenue_year2', 'revenue_year3']
            },
            {
              id: 'PC.I.1.d',
              type: 'sub_question',
              label: 'Business Model',
              numbering: 'd)',
              guidance: 'Highlight how the product/service (including SPV/SPE if applicable) sources revenue for DBS. Include revenue streams, gross margin split, and target ROI.',
              fieldKeys: ['target_roi']
            },
            {
              id: 'PC.I.1.e',
              type: 'sub_question',
              label: 'Special Purpose Vehicles (SPV)',
              numbering: 'e)',
              guidance: 'Highlight any SPVs involved including the Arranger, country of incorporation, and responsibility for booking/monitoring.',
              fieldKeys: ['spv_details']
            }
          ]
        },

        // ── 2. Target Customer ────────────────────────────
        {
          id: 'PC.I.2',
          type: 'topic',
          label: 'Target Customer',
          numbering: '2',
          guidance: 'Describe the target customer segments, any regulatory restrictions or limitations, target customer profile (annual turnover, geographic scope), and customer suitability criteria.',
          fieldKeys: ['customer_segments']
        },

        // ── 3. Commercialization Approach ─────────────────
        {
          id: 'PC.I.3',
          type: 'topic',
          label: 'Commercialization Approach',
          numbering: '3',
          children: [
            {
              id: 'PC.I.3.a',
              type: 'sub_question',
              label: 'Channel Availability',
              numbering: 'a)',
              guidance: 'Specify which channels will sell this product (e.g. DBS Bank, DBSV, etc.) and, if more than one entity/location, include the rationale.',
              fieldKeys: ['distribution_channels']
            },
            {
              id: 'PC.I.3.b',
              type: 'sub_question',
              label: 'Sales Suitability',
              numbering: 'b)',
              guidance: 'Document the customer onboarding process and suitability assessment. Describe how qualified customers have access to the product/service.',
              fieldKeys: ['sales_suitability']
            },
            {
              id: 'PC.I.3.c',
              type: 'sub_question',
              label: 'Marketing & Communication',
              numbering: 'c)',
              guidance: 'Describe the marketing and communication plan for the product/service.',
              fieldKeys: ['marketing_plan']
            }
          ]
        },

        // ── 4. Conditions Imposed by PAC ──────────────────
        {
          id: 'PC.I.4',
          type: 'topic',
          label: 'Conditions Imposed by Product Approval Committee (PAC)',
          numbering: '4',
          guidance: 'For New-to-Group product/service, list any conditions imposed by the PAC.',
          fieldKeys: ['pac_reference']
        },

        // ── 5. External Parties ───────────────────────────
        {
          id: 'PC.I.5',
          type: 'topic',
          label: 'Involvement of External Parties in the Initiative',
          numbering: '5',
          guidance: 'Provide details of all external parties involved in the end-to-end process. Include Risk Profiling ID reference as per the Risk Data Assessment Sourcing Principles (RASP) baseline. Is any commercially related data (e.g. "green", "bond", "sustainable", "ESG") being utilized?',
          fieldKeys: ['ip_considerations']
        }
      ]
    },

    // ═══════════════════════════════════════════════════════
    // II  Operational & Technology Information
    // ═══════════════════════════════════════════════════════
    {
      id: 'PC.II',
      type: 'section',
      label: 'Operational & Technology Information',
      numbering: 'II',
      children: [

        // ── 1. Operational Information ────────────────────
        {
          id: 'PC.II.1',
          type: 'topic',
          label: 'Operational Information',
          numbering: '1',
          children: [
            {
              id: 'PC.II.1.a',
              type: 'sub_question',
              label: 'Operating Model',
              numbering: 'a)',
              guidance: 'Provide details on how trading parties are involved in the end-to-end process. Describe functional responsibilities between Front Office, Middle Office, Back Office, Operations, and any third parties, including additional requirements (e.g. collateral management).',
              fieldKeys: ['front_office_model', 'middle_office_model', 'back_office_model']
            },
            {
              id: 'PC.II.1.b',
              type: 'sub_question',
              label: 'Booking Process in Operations',
              numbering: 'b)',
              guidance: 'Provide details of end-to-end transaction flow — front-to-back settlement, accounting, valuation, including exception and manual handling.',
              fieldKeys: ['booking_legal_form', 'booking_family', 'booking_typology', 'portfolio_allocation', 'confirmation_process', 'reconciliation']
            }
          ]
        },

        // ── 2. Technical Platform ─────────────────────────
        {
          id: 'PC.II.2',
          type: 'topic',
          label: 'Technical Platform',
          numbering: '2',
          children: [
            {
              id: 'PC.II.2.a',
              type: 'sub_question',
              label: 'System Requirements',
              numbering: 'a)',
              guidance: 'Does the proposal involve new changes to application systems, technology solutions, and/or IT infrastructure? If yes, describe the scope and integration.',
              fieldKeys: ['tech_requirements', 'booking_system']
            },
            {
              id: 'PC.II.2.b',
              type: 'sub_question',
              label: 'Front Office / Internet Facing System',
              numbering: 'b)',
              guidance: 'Describe the front office or internet-facing system for impact analysis. Include details of system changes.',
              fieldKeys: ['valuation_model']
            },
            {
              id: 'PC.II.2.c',
              type: 'sub_question',
              label: 'Back End / Supporting Systems',
              numbering: 'c)',
              guidance: 'Describe back-end and supporting systems for impact analysis. Include details of systems and any manual work-around.',
              fieldKeys: ['settlement_method']
            }
          ]
        },

        // ── 3. Information Security ───────────────────────
        {
          id: 'PC.II.3',
          type: 'topic',
          label: 'Information Security',
          numbering: '3',
          guidance: 'Does the proposal involve any system or major system enhancements? Describe any requirements related to information security. Are there any deviations from ISS policies?',
          fieldKeys: ['iss_deviations', 'pentest_status']
        },

        // ── 4. Technology Resiliency ──────────────────────
        {
          id: 'PC.II.4',
          type: 'topic',
          label: 'Technology Resiliency',
          numbering: '4',
          guidance: 'Describe external party risk management (include GRC ID), system design and recovery details (RTO/RPO), and DR testing plan.',
          fieldKeys: ['hsm_required']
        },

        // ── 5. Business Continuity Management ─────────────
        {
          id: 'PC.II.5',
          type: 'topic',
          label: 'Business Continuity Management',
          numbering: '5',
          guidance: 'Describe BIA considerations, updated BCP requirements, and any additional continuity measures.',
          fieldKeys: ['tech_requirements']
        }
      ]
    },

    // ═══════════════════════════════════════════════════════
    // III  Pricing Model Details
    // ═══════════════════════════════════════════════════════
    {
      id: 'PC.III',
      type: 'section',
      label: 'Pricing Model Details',
      numbering: 'III',
      children: [
        {
          id: 'PC.III.1',
          type: 'topic',
          label: 'Pricing Model Validation / Assurance',
          numbering: '1',
          guidance: 'Is there a requirement for pricing model validation? If yes, has pricing model assurance been done?',
          fieldKeys: ['pricing_methodology', 'roae_analysis', 'pricing_assumptions', 'bespoke_adjustments']
        },
        {
          id: 'PC.III.2',
          type: 'topic',
          label: 'Model Name and Validation Date',
          numbering: '2',
          guidance: 'State the model name, validation date, and any model restrictions approved by risk team. Refer to the Risk Data Assessment tool.',
          fieldKeys: ['pricing_model_name', 'model_validation_date']
        },
        {
          id: 'PC.III.3',
          type: 'topic',
          label: 'Standardised Initial Margin Model (SIMM) Treatment',
          numbering: '3',
          guidance: 'Describe the SIMM sensitivities and margin treatment for this product.',
          fieldKeys: ['simm_treatment']
        }
      ]
    },

    // ═══════════════════════════════════════════════════════
    // IV  Risk Analysis
    // ═══════════════════════════════════════════════════════
    {
      id: 'PC.IV',
      type: 'section',
      label: 'Risk Analysis',
      numbering: 'IV',
      children: [

        // ── A. Operational Risk ───────────────────────────
        {
          id: 'PC.IV.A',
          type: 'topic',
          label: 'Operational Risk',
          numbering: 'A',
          children: [
            {
              id: 'PC.IV.A.1',
              type: 'sub_question',
              label: 'Legal & Compliance Considerations',
              numbering: '1',
              guidance: 'Address regulatory compliance, licensing requirements, cross-border regulations, legal documentation requirements, and any sanctions or AML considerations.',
              fieldKeys: ['legal_opinion', 'primary_regulation', 'secondary_regulations', 'regulatory_reporting', 'sanctions_check']
            },
            {
              id: 'PC.IV.A.2',
              type: 'sub_question',
              label: 'Finance and Tax',
              numbering: '2',
              guidance: 'Describe the accounting treatment (Trading Book vs Banking Book, Fair Value, On/Off Balance Sheet) and tax considerations across jurisdictions.',
              fieldKeys: ['tax_impact']
            }
          ]
        },

        // ── B. Market & Liquidity ─────────────────────────
        {
          id: 'PC.IV.B',
          type: 'topic',
          label: 'Market & Liquidity',
          numbering: 'B',
          children: [
            {
              id: 'PC.IV.B.1',
              type: 'sub_question',
              label: 'Market Risk',
              numbering: '1',
              guidance: 'If applicable, complete the market risk factor table. Indicate the relevant pricing parameters, sensitivity reports, VaR capture, and stress capture for each risk factor.',
              fieldKeys: ['market_risk', 'risk_classification']
            },
            {
              id: 'PC.IV.B.1.table',
              type: 'table',
              label: 'Market Risk Factor Matrix',
              numbering: '',
              tableColumns: ['Risk Factor', 'Applicable?', 'Sensitivity Reports?', 'Captured in VaR?', 'Captured in Stress?'],
              tableFieldMapping: [
                { rowLabel: 'IR Delta', fieldKey: 'mrf_ir_delta' },
                { rowLabel: 'IR Vega', fieldKey: 'mrf_ir_vega' },
                { rowLabel: 'FX Delta', fieldKey: 'mrf_fx_delta' },
                { rowLabel: 'FX Vega', fieldKey: 'mrf_fx_vega' },
                { rowLabel: 'Equity Delta', fieldKey: 'mrf_eq_delta' },
                { rowLabel: 'Commodity', fieldKey: 'mrf_commodity' },
                { rowLabel: 'Credit', fieldKey: 'mrf_credit' },
                { rowLabel: 'Correlation', fieldKey: 'mrf_correlation' }
              ]
            },
            {
              id: 'PC.IV.B.2',
              type: 'sub_question',
              label: 'Funding / Liquidity Risk',
              numbering: '2',
              guidance: 'Describe how the product will be captured in the existing liquidity risk metrics. Indicate what the corporate risk liquidity cost is. Identify if there is any contingent cash flow driven by market events.',
              fieldKeys: ['liquidity_risk']
            },
            {
              id: 'PC.IV.B.3',
              type: 'sub_question',
              label: 'Market Risk Regulatory Capital',
              numbering: '3',
              guidance: 'Confirm trading book assignment. Describe capital requirements and model validation procedures.',
              fieldKeys: ['regulatory_capital', 'var_capture']
            }
          ]
        },

        // ── C. Credit Risk ────────────────────────────────
        {
          id: 'PC.IV.C',
          type: 'topic',
          label: 'Credit Risk',
          numbering: 'C',
          children: [
            {
              id: 'PC.IV.C.1',
              type: 'sub_question',
              label: 'Potential Risks',
              numbering: '1',
              guidance: 'Identify the primary sources of credit risk. Do they require new credit limit types or credit support?',
              fieldKeys: ['credit_risk']
            },
            {
              id: 'PC.IV.C.2',
              type: 'sub_question',
              label: 'Risk Mitigation',
              numbering: '2',
              guidance: 'Describe the risk mitigation measures, collateral frameworks, and how they have been stress-tested.',
              fieldKeys: ['counterparty_default']
            },
            {
              id: 'PC.IV.C.3',
              type: 'sub_question',
              label: 'Limits to Cover Exposure',
              numbering: '3',
              guidance: 'Describe limits to cover exposure and the party responsible for monitoring. Are there appropriate models for verification, monitoring, and measurement?',
              fieldKeys: ['stress_scenarios']
            },
            {
              id: 'PC.IV.C.4',
              type: 'sub_question',
              label: 'Collateral Requirements',
              numbering: '4',
              guidance: 'If the transaction is to be collateralized, describe the collateral management and monitoring process. Is the acceptable collateral risk-rated based on Core Credit Risk Policy?',
              fieldKeys: ['custody_risk']
            },
            {
              id: 'PC.IV.C.5',
              type: 'sub_question',
              label: 'Credit Risk Capital Calculation',
              numbering: '5',
              guidance: 'For portfolios under Standardized Approach, state PFE Standards. For portfolios under Internal Model Approach, describe EAD and regulatory capital.',
              fieldKeys: ['counterparty_rating']
            },
            {
              id: 'PC.IV.C.6',
              type: 'sub_question',
              label: 'Regulatory Considerations',
              numbering: '6',
              guidance: 'Describe any regulatory considerations for credit risk including large exposure rules and concentration limits.',
              fieldKeys: []
            },
            {
              id: 'PC.IV.C.7',
              type: 'sub_question',
              label: 'Counterparty Credit Risk',
              numbering: '7',
              guidance: 'Describe the counterparty credit risk assessment framework.',
              fieldKeys: []
            }
          ]
        },

        // ── D. Reputational Risk ──────────────────────────
        {
          id: 'PC.IV.D',
          type: 'topic',
          label: 'Reputational Risk',
          numbering: 'D',
          guidance: 'Evaluate and provide an assessment of the reputational risk exposure. Does the new product involve changes that could negatively impact the Bank\'s reputation? Include ESG assessment.',
          fieldKeys: ['reputational_risk', 'esg_assessment']
        }
      ]
    },

    // ═══════════════════════════════════════════════════════
    // V  Data Management
    // ═══════════════════════════════════════════════════════
    {
      id: 'PC.V',
      type: 'section',
      label: 'Data Management',
      numbering: 'V',
      children: [
        {
          id: 'PC.V.1',
          type: 'topic',
          label: 'Design for Data (D4D) and Data Management Requirements',
          numbering: '1',
          guidance: 'Describe D4D requirements including data governance, ownership, stewardship, quality monitoring, and GDPR/privacy compliance.',
          fieldKeys: ['data_privacy', 'data_retention', 'gdpr_compliance', 'data_ownership']
        },
        {
          id: 'PC.V.2',
          type: 'topic',
          label: 'PURE (Purposeful, Unsurprising, Respectful, Explainable) Principles',
          numbering: '2',
          guidance: 'Provide the PURE assessment ID and describe compliance with each principle.',
          fieldKeys: ['pure_assessment_id']
        },
        {
          id: 'PC.V.3',
          type: 'topic',
          label: 'Risk Data Aggregation and Reporting Requirements',
          numbering: '3',
          guidance: 'Describe risk data aggregation capabilities and automated regulatory reporting.',
          fieldKeys: ['reporting_requirements']
        }
      ]
    },

    // ═══════════════════════════════════════════════════════
    // VI  Other Risk Identification and Mitigation
    // ═══════════════════════════════════════════════════════
    {
      id: 'PC.VI',
      type: 'section',
      label: 'Other Risk Identification and Mitigation',
      numbering: 'VI',
      guidance: 'Are there other risk identifications and mitigations which have not been described in sections I–V? If so, describe them here.',
      fieldKeys: ['operational_risk']
    },

    // ═══════════════════════════════════════════════════════
    // VII  Additional Information for Trading Products
    // ═══════════════════════════════════════════════════════
    {
      id: 'PC.VII',
      type: 'section',
      label: 'Additional Information for Trading Products / Instruments',
      numbering: 'VII',
      guidance: 'If the new product involves a trading product/instrument, please complete the additional risk assessment in Appendix 5.',
      fieldKeys: []
    }
  ]
};


// ────────────────────────────────────────────────────────────
// Appendices
// ────────────────────────────────────────────────────────────

export const NPA_APPENDICES_TEMPLATE: TemplateNode[] = [

  // ═══════════════════════════════════════════════════════
  // Appendix 1: Entity/Location Information
  // ═══════════════════════════════════════════════════════
  {
    id: 'APP.1',
    type: 'appendix',
    label: 'Entity/Location Information',
    numbering: 'Appendix 1',
    children: [
      {
        id: 'APP.1.table',
        type: 'table',
        label: 'Entity/Location Matrix',
        numbering: '',
        tableColumns: ['Function', 'Legal Entity', 'Location'],
        tableFieldMapping: [
          { rowLabel: 'Sales / Origination', fieldKey: 'booking_entity' },
          { rowLabel: 'Booking', fieldKey: 'booking_entity' },
          { rowLabel: 'Risk Taking', fieldKey: 'counterparty' },
          { rowLabel: 'Processing', fieldKey: 'settlement_method' }
        ]
      }
    ]
  },

  // ═══════════════════════════════════════════════════════
  // Appendix 2: Intellectual Property (IP)
  // ═══════════════════════════════════════════════════════
  {
    id: 'APP.2',
    type: 'appendix',
    label: 'Intellectual Property ("IP")',
    numbering: 'Appendix 2',
    children: [
      {
        id: 'APP.2.A',
        type: 'topic',
        label: 'Part A — DBS IP',
        numbering: 'A',
        guidance: 'Does the new product/service create or incorporate the use of any IP that is owned or to be owned by DBS (whether newly created or existing)?',
        fieldKeys: ['ip_considerations']
      },
      {
        id: 'APP.2.B',
        type: 'topic',
        label: 'Part B — Third Party IP',
        numbering: 'B',
        guidance: 'Does the new product/service create or incorporate the use of any IP that is owned or to be owned by a third party (whether newly created or existing)?',
        fieldKeys: []
      }
    ]
  },

  // ═══════════════════════════════════════════════════════
  // Appendix 3: Financial Crime Risk Areas
  // ═══════════════════════════════════════════════════════
  {
    id: 'APP.3',
    type: 'appendix',
    label: 'Financial Crime Risk Areas',
    numbering: 'Appendix 3',
    guidance: 'Please complete both Parts A and B of this section. Identify relevant financial crime risk areas (money laundering, terrorism financing, sanctions, fraud, bribery & corruption).',
    fieldKeys: ['aml_assessment', 'terrorism_financing', 'sanctions_assessment', 'fraud_risk', 'bribery_corruption']
  },

  // ═══════════════════════════════════════════════════════
  // Appendix 4: Risk Data Aggregation and Reporting
  // ═══════════════════════════════════════════════════════
  {
    id: 'APP.4',
    type: 'appendix',
    label: 'Risk Data Aggregation and Reporting Requirements',
    numbering: 'Appendix 4',
    guidance: 'Describe risk data aggregation compliance with regulatory requirements relating to Risk Data Aggregation and Reporting.',
    fieldKeys: ['reporting_requirements']
  },

  // ═══════════════════════════════════════════════════════
  // Appendix 5: Additional Info for Trading Products
  // ═══════════════════════════════════════════════════════
  {
    id: 'APP.5',
    type: 'appendix',
    label: 'Additional Information for Trading Products / Instruments',
    numbering: 'Appendix 5',
    children: [
      {
        id: 'APP.5.1',
        type: 'topic',
        label: 'Customers',
        numbering: '1',
        guidance: 'Describe revenue sharing, cost allocation, and capital allocation.',
        fieldKeys: ['customer_segments']
      },
      {
        id: 'APP.5.2',
        type: 'topic',
        label: 'Product Information',
        numbering: '2',
        guidance: 'Is the product to be hedge-fund purposes? Clarify what is being hedged and provide a brief description of any underlying transactions.',
        fieldKeys: ['product_type', 'underlying_asset']
      },
      {
        id: 'APP.5.3',
        type: 'topic',
        label: 'Collateral and Pledged Assets',
        numbering: '3',
        guidance: 'Describe collateral types, custody systems, and risk mitigation.',
        fieldKeys: ['custody_risk', 'collateral_types']
      },
      {
        id: 'APP.5.4',
        type: 'topic',
        label: 'Valuation and Funding',
        numbering: '4',
        guidance: 'Describe valuation models and funding sources.',
        fieldKeys: ['valuation_model', 'valuation_method', 'funding_source']
      },
      {
        id: 'APP.5.5',
        type: 'topic',
        label: 'Additional Finance Considerations',
        numbering: '5',
        guidance: 'Describe booking schema, lifecycle management, and cross-product integration.',
        fieldKeys: ['booking_schema']
      },
      {
        id: 'APP.5.6',
        type: 'topic',
        label: 'Technology Considerations',
        numbering: '6',
        guidance: 'Describe architecture, security, and scalability requirements.',
        fieldKeys: ['tech_requirements']
      },
      {
        id: 'APP.5.7',
        type: 'topic',
        label: 'Regulatory Considerations',
        numbering: '7',
        guidance: 'Describe the compliance framework, regulatory reporting, and monitoring.',
        fieldKeys: ['regulatory_reporting']
      }
    ]
  },

  // ═══════════════════════════════════════════════════════
  // Appendix 6: Third-Party Platforms Risk Assessment
  // ═══════════════════════════════════════════════════════
  {
    id: 'APP.6',
    type: 'appendix',
    label: 'Use of Third-Party Hosted Communication or Media Channels/Platforms — Risk Assessment',
    numbering: 'Appendix 6',
    guidance: 'This appendix is only applicable if the PU intends to use a third-party hosted communication or media channel/platform. Complete the preliminary risk assessment and information security assessment.',
    fieldKeys: []
  }
];


// ────────────────────────────────────────────────────────────
// Field Registry — AUTOFILL Classification
// ────────────────────────────────────────────────────────────
//
// Every field_key is classified into one of 4 fill strategies:
//
// RULE   — Deterministic: Can be resolved via DB lookup, product config,
//          or simple business rules WITHOUT calling an LLM.
//          Examples: product_name (from NPA record), booking_entity (from
//          org chart), regulatory_reporting (from jurisdiction lookup table).
//          → Filled by Express endpoint: GET /api/npas/:id/prefill
//
// COPY   — Template Copy: Value can be copied from a similar previously-
//          approved NPA and adapted slightly. The LLM reviews and optionally
//          tweaks the copied value but the baseline comes from DB.
//          → Filled by Express endpoint + LLM delta pass
//
// LLM    — Analytical: Requires LLM reasoning over product context,
//          risk documents, and regulatory knowledge. Cannot be derived
//          from simple lookups.
//          → Filled by Dify Chatflow LLM nodes
//
// MANUAL — Human-only: Requires human judgment, sign-off, or input that
//          an AI should not auto-fill (legal attestations, manager names,
//          specific internal reference numbers).
//          → Left empty with guidance; user must fill manually
//

export type FieldFillStrategy = 'RULE' | 'COPY' | 'LLM' | 'MANUAL';

export interface FieldRegistryEntry {
  /** The field_key as stored in npa_form_data */
  key: string;
  /** Human-readable label */
  label: string;
  /** Which autofill strategy to use */
  strategy: FieldFillStrategy;
  /** For RULE: name of the lookup source (e.g., 'npa_record', 'org_chart', 'jurisdiction_table') */
  ruleSource?: string;
  /** For COPY: which section of a similar NPA to copy from */
  copySection?: string;
  /** For LLM: the prompt category (e.g., 'risk_analysis', 'product_description', 'compliance') */
  llmCategory?: string;
  /** Template node ID where this field appears (e.g., 'PC.I.1.a') */
  nodeId?: string;
}

/**
 * Master Field Registry — classifies all 87 field_keys by fill strategy.
 *
 * Distribution:
 *   RULE   ~30 fields — deterministic from DB/config
 *   COPY   ~15 fields — baseline from similar NPA
 *   LLM    ~30 fields — requires AI reasoning
 *   MANUAL ~12 fields — human-only
 */
export const NPA_FIELD_REGISTRY: FieldRegistryEntry[] = [

  // ═══════ SECTION I: Product Specifications ═══════

  // RULE — straight from NPA record or product config
  { key: 'product_name',       label: 'Product Name',                strategy: 'RULE',   ruleSource: 'npa_record',       nodeId: 'PC.I.1.b' },
  { key: 'product_type',       label: 'Product Type',                strategy: 'RULE',   ruleSource: 'npa_record',       nodeId: 'PC.I.1.b' },
  { key: 'underlying_asset',   label: 'Underlying Asset',            strategy: 'RULE',   ruleSource: 'npa_record',       nodeId: 'PC.I.1.b' },
  { key: 'tenor',              label: 'Tenor',                       strategy: 'RULE',   ruleSource: 'npa_record',       nodeId: 'PC.I.1.b' },
  { key: 'notional_amount',    label: 'Transaction Volume (Notional)', strategy: 'RULE', ruleSource: 'npa_record',       nodeId: 'PC.I.1.c' },
  { key: 'funding_type',       label: 'Funding Type',                strategy: 'RULE',   ruleSource: 'npa_record',       nodeId: 'PC.I.1.b' },

  // COPY — from similar NPA baseline
  { key: 'product_role',       label: 'Role of Proposing Unit',      strategy: 'COPY',   copySection: 'product_specs',   nodeId: 'PC.I.1.b' },
  { key: 'product_maturity',   label: 'Product Maturity',            strategy: 'COPY',   copySection: 'product_specs',   nodeId: 'PC.I.1.b' },
  { key: 'product_lifecycle',  label: 'Product Life Cycle',          strategy: 'COPY',   copySection: 'product_specs',   nodeId: 'PC.I.1.b' },
  { key: 'distribution_channels', label: 'Distribution Channels',   strategy: 'COPY',   copySection: 'product_specs',   nodeId: 'PC.I.3.a' },
  { key: 'sales_suitability',  label: 'Sales Suitability',           strategy: 'COPY',   copySection: 'product_specs',   nodeId: 'PC.I.3.b' },

  // LLM — requires reasoning
  { key: 'business_rationale', label: 'Business Rationale',          strategy: 'LLM',    llmCategory: 'product_description', nodeId: 'PC.I.1.a' },
  { key: 'revenue_year1',      label: 'Revenue Year 1',              strategy: 'LLM',    llmCategory: 'financial_projection', nodeId: 'PC.I.1.c' },
  { key: 'revenue_year2',      label: 'Revenue Year 2',              strategy: 'LLM',    llmCategory: 'financial_projection', nodeId: 'PC.I.1.c' },
  { key: 'revenue_year3',      label: 'Revenue Year 3',              strategy: 'LLM',    llmCategory: 'financial_projection', nodeId: 'PC.I.1.c' },
  { key: 'target_roi',         label: 'Target ROI',                  strategy: 'LLM',    llmCategory: 'financial_projection', nodeId: 'PC.I.1.d' },
  { key: 'marketing_plan',     label: 'Marketing & Communication',   strategy: 'LLM',    llmCategory: 'product_description', nodeId: 'PC.I.3.c' },

  // MANUAL — human judgment required
  { key: 'customer_segments',  label: 'Target Customer Segments',    strategy: 'MANUAL',  nodeId: 'PC.I.2' },
  { key: 'pac_reference',      label: 'PAC Reference / Conditions',  strategy: 'MANUAL',  nodeId: 'PC.I.4' },
  { key: 'spv_details',        label: 'Special Purpose Vehicle Details', strategy: 'MANUAL', nodeId: 'PC.I.1.e' },
  { key: 'ip_considerations',  label: 'IP Considerations',           strategy: 'MANUAL',  nodeId: 'PC.I.5' },

  // ═══════ SECTION II: Operational & Technology ═══════

  // COPY — operational model can be copied from similar product
  { key: 'front_office_model', label: 'Front Office Operating Model', strategy: 'COPY',  copySection: 'operational',     nodeId: 'PC.II.1.a' },
  { key: 'middle_office_model', label: 'Middle Office Operating Model', strategy: 'COPY', copySection: 'operational',    nodeId: 'PC.II.1.a' },
  { key: 'back_office_model',  label: 'Back Office Operating Model',  strategy: 'COPY',  copySection: 'operational',     nodeId: 'PC.II.1.a' },
  { key: 'confirmation_process', label: 'Confirmation Process',       strategy: 'COPY',  copySection: 'operational',     nodeId: 'PC.II.1.b' },
  { key: 'reconciliation',     label: 'Reconciliation',               strategy: 'COPY',  copySection: 'operational',     nodeId: 'PC.II.1.b' },

  // RULE — from org/system config
  { key: 'booking_legal_form', label: 'Booking Legal Form',          strategy: 'RULE',   ruleSource: 'product_config',   nodeId: 'PC.II.1.b' },
  { key: 'booking_family',     label: 'Booking Family',              strategy: 'RULE',   ruleSource: 'product_config',   nodeId: 'PC.II.1.b' },
  { key: 'booking_typology',   label: 'Booking Typology',            strategy: 'RULE',   ruleSource: 'product_config',   nodeId: 'PC.II.1.b' },
  { key: 'portfolio_allocation', label: 'Portfolio Allocation',      strategy: 'RULE',   ruleSource: 'product_config',   nodeId: 'PC.II.1.b' },
  { key: 'booking_system',     label: 'Booking System',              strategy: 'RULE',   ruleSource: 'system_config',    nodeId: 'PC.II.2.a' },
  { key: 'settlement_method',  label: 'Settlement Method',           strategy: 'RULE',   ruleSource: 'product_config',   nodeId: 'PC.II.2.c' },
  { key: 'booking_entity',     label: 'Booking Entity',              strategy: 'RULE',   ruleSource: 'org_chart',        nodeId: 'APP.1' },

  // LLM — needs analysis
  { key: 'tech_requirements',  label: 'Technology Requirements',     strategy: 'LLM',    llmCategory: 'operational',     nodeId: 'PC.II.2.a' },
  { key: 'valuation_model',    label: 'Valuation Model',             strategy: 'LLM',    llmCategory: 'pricing',         nodeId: 'PC.II.2.b' },

  // MANUAL — security/BCM assessments
  { key: 'iss_deviations',     label: 'ISS Deviations',              strategy: 'MANUAL',  nodeId: 'PC.II.3' },
  { key: 'pentest_status',     label: 'Penetration Test Status',     strategy: 'MANUAL',  nodeId: 'PC.II.3' },
  { key: 'hsm_required',       label: 'HSM Required',                strategy: 'MANUAL',  nodeId: 'PC.II.4' },

  // ═══════ SECTION III: Pricing Model ═══════

  // LLM — pricing analysis needs reasoning
  { key: 'pricing_methodology', label: 'Pricing Methodology',        strategy: 'LLM',    llmCategory: 'pricing',         nodeId: 'PC.III.1' },
  { key: 'roae_analysis',      label: 'ROAE Analysis',               strategy: 'LLM',    llmCategory: 'pricing',         nodeId: 'PC.III.1' },
  { key: 'pricing_assumptions', label: 'Pricing Assumptions',        strategy: 'LLM',    llmCategory: 'pricing',         nodeId: 'PC.III.1' },
  { key: 'bespoke_adjustments', label: 'Bespoke Adjustments',        strategy: 'LLM',    llmCategory: 'pricing',         nodeId: 'PC.III.1' },
  { key: 'simm_treatment',     label: 'SIMM Treatment',              strategy: 'LLM',    llmCategory: 'pricing',         nodeId: 'PC.III.3' },

  // RULE — model metadata
  { key: 'pricing_model_name', label: 'Pricing Model Name',          strategy: 'RULE',   ruleSource: 'product_config',   nodeId: 'PC.III.2' },
  { key: 'model_validation_date', label: 'Model Validation Date',    strategy: 'RULE',   ruleSource: 'product_config',   nodeId: 'PC.III.2' },

  // ═══════ SECTION IV: Risk Analysis ═══════

  // LLM — core risk analysis
  { key: 'market_risk',        label: 'Market Risk Assessment',      strategy: 'LLM',    llmCategory: 'risk_analysis',   nodeId: 'PC.IV.B.1' },
  { key: 'risk_classification', label: 'Risk Classification',        strategy: 'LLM',    llmCategory: 'risk_analysis',   nodeId: 'PC.IV.B.1' },
  { key: 'liquidity_risk',     label: 'Funding/Liquidity Risk',      strategy: 'LLM',    llmCategory: 'risk_analysis',   nodeId: 'PC.IV.B.2' },
  { key: 'regulatory_capital', label: 'Regulatory Capital',          strategy: 'LLM',    llmCategory: 'risk_analysis',   nodeId: 'PC.IV.B.3' },
  { key: 'var_capture',        label: 'VaR Capture',                 strategy: 'LLM',    llmCategory: 'risk_analysis',   nodeId: 'PC.IV.B.3' },
  { key: 'credit_risk',        label: 'Credit Risk Assessment',      strategy: 'LLM',    llmCategory: 'risk_analysis',   nodeId: 'PC.IV.C.1' },
  { key: 'counterparty_default', label: 'Counterparty Default',      strategy: 'LLM',    llmCategory: 'risk_analysis',   nodeId: 'PC.IV.C.2' },
  { key: 'stress_scenarios',   label: 'Stress Scenarios',            strategy: 'LLM',    llmCategory: 'risk_analysis',   nodeId: 'PC.IV.C.3' },
  { key: 'counterparty_rating', label: 'Counterparty Rating',        strategy: 'LLM',    llmCategory: 'risk_analysis',   nodeId: 'PC.IV.C.5' },
  { key: 'reputational_risk',  label: 'Reputational Risk',           strategy: 'LLM',    llmCategory: 'risk_analysis',   nodeId: 'PC.IV.D' },
  { key: 'esg_assessment',     label: 'ESG Assessment',              strategy: 'LLM',    llmCategory: 'risk_analysis',   nodeId: 'PC.IV.D' },
  { key: 'operational_risk',   label: 'Operational Risk',            strategy: 'LLM',    llmCategory: 'risk_analysis',   nodeId: 'PC.VI' },

  // RULE — market risk factor matrix (table values: Yes/No per factor)
  { key: 'mrf_ir_delta',       label: 'MRF: IR Delta',               strategy: 'RULE',   ruleSource: 'product_config',   nodeId: 'PC.IV.B.1' },
  { key: 'mrf_ir_vega',        label: 'MRF: IR Vega',                strategy: 'RULE',   ruleSource: 'product_config',   nodeId: 'PC.IV.B.1' },
  { key: 'mrf_fx_delta',       label: 'MRF: FX Delta',               strategy: 'RULE',   ruleSource: 'product_config',   nodeId: 'PC.IV.B.1' },
  { key: 'mrf_fx_vega',        label: 'MRF: FX Vega',                strategy: 'RULE',   ruleSource: 'product_config',   nodeId: 'PC.IV.B.1' },
  { key: 'mrf_eq_delta',       label: 'MRF: Equity Delta',           strategy: 'RULE',   ruleSource: 'product_config',   nodeId: 'PC.IV.B.1' },
  { key: 'mrf_commodity',      label: 'MRF: Commodity',              strategy: 'RULE',   ruleSource: 'product_config',   nodeId: 'PC.IV.B.1' },
  { key: 'mrf_credit',         label: 'MRF: Credit',                 strategy: 'RULE',   ruleSource: 'product_config',   nodeId: 'PC.IV.B.1' },
  { key: 'mrf_correlation',    label: 'MRF: Correlation',            strategy: 'RULE',   ruleSource: 'product_config',   nodeId: 'PC.IV.B.1' },

  // COPY — legal/compliance (can copy structure from similar NPA)
  { key: 'legal_opinion',      label: 'Legal Opinion',               strategy: 'COPY',   copySection: 'legal',           nodeId: 'PC.IV.A.1' },
  { key: 'tax_impact',         label: 'Tax Impact',                  strategy: 'COPY',   copySection: 'legal',           nodeId: 'PC.IV.A.2' },

  // RULE — from jurisdiction lookup
  { key: 'primary_regulation', label: 'Primary Regulation',          strategy: 'RULE',   ruleSource: 'jurisdiction_table', nodeId: 'PC.IV.A.1' },
  { key: 'secondary_regulations', label: 'Secondary Regulations',    strategy: 'RULE',   ruleSource: 'jurisdiction_table', nodeId: 'PC.IV.A.1' },
  { key: 'regulatory_reporting', label: 'Regulatory Reporting',      strategy: 'RULE',   ruleSource: 'jurisdiction_table', nodeId: 'PC.IV.A.1' },
  { key: 'sanctions_check',    label: 'Sanctions Check',             strategy: 'RULE',   ruleSource: 'jurisdiction_table', nodeId: 'PC.IV.A.1' },

  // LLM — credit risk detail
  { key: 'custody_risk',       label: 'Custody Risk',                strategy: 'LLM',    llmCategory: 'risk_analysis',   nodeId: 'PC.IV.C.4' },

  // ═══════ SECTION V: Data Management ═══════

  // COPY — data governance fields follow similar patterns
  { key: 'data_privacy',       label: 'Data Privacy Assessment',     strategy: 'COPY',   copySection: 'data_mgmt',       nodeId: 'PC.V.1' },
  { key: 'data_retention',     label: 'Data Retention Policy',       strategy: 'COPY',   copySection: 'data_mgmt',       nodeId: 'PC.V.1' },
  { key: 'gdpr_compliance',    label: 'GDPR Compliance',             strategy: 'COPY',   copySection: 'data_mgmt',       nodeId: 'PC.V.1' },
  { key: 'data_ownership',     label: 'Data Ownership',              strategy: 'COPY',   copySection: 'data_mgmt',       nodeId: 'PC.V.1' },

  // MANUAL — internal reference
  { key: 'pure_assessment_id', label: 'PURE Assessment ID',          strategy: 'MANUAL',  nodeId: 'PC.V.2' },

  // LLM — aggregation/reporting analysis
  { key: 'reporting_requirements', label: 'Risk Data Aggregation & Reporting', strategy: 'LLM', llmCategory: 'compliance', nodeId: 'PC.V.3' },

  // ═══════ APPENDICES ═══════

  // RULE — entity info from org chart
  { key: 'counterparty',       label: 'Counterparty',                strategy: 'RULE',   ruleSource: 'org_chart',        nodeId: 'APP.1' },

  // LLM — financial crime assessment
  { key: 'aml_assessment',     label: 'AML Assessment',              strategy: 'LLM',    llmCategory: 'compliance',      nodeId: 'APP.3' },
  { key: 'terrorism_financing', label: 'Terrorism Financing Risk',   strategy: 'LLM',    llmCategory: 'compliance',      nodeId: 'APP.3' },
  { key: 'sanctions_assessment', label: 'Sanctions Assessment',      strategy: 'LLM',    llmCategory: 'compliance',      nodeId: 'APP.3' },
  { key: 'fraud_risk',         label: 'Fraud Risk',                  strategy: 'LLM',    llmCategory: 'compliance',      nodeId: 'APP.3' },
  { key: 'bribery_corruption', label: 'Bribery & Corruption Risk',   strategy: 'LLM',    llmCategory: 'compliance',      nodeId: 'APP.3' },

  // COPY — trading product details
  { key: 'collateral_types',   label: 'Collateral Types',            strategy: 'COPY',   copySection: 'trading',         nodeId: 'APP.5.3' },
  { key: 'valuation_method',   label: 'Valuation Method',            strategy: 'COPY',   copySection: 'trading',         nodeId: 'APP.5.4' },
  { key: 'funding_source',     label: 'Funding Source',              strategy: 'COPY',   copySection: 'trading',         nodeId: 'APP.5.4' },
  { key: 'booking_schema',     label: 'Booking Schema',              strategy: 'RULE',   ruleSource: 'product_config',   nodeId: 'APP.5.5' },
];

/**
 * Lookup helpers for the Field Registry
 */
export const FIELD_REGISTRY_MAP = new Map<string, FieldRegistryEntry>(
  NPA_FIELD_REGISTRY.map(entry => [entry.key, entry])
);

/** Get all fields for a given strategy */
export function getFieldsByStrategy(strategy: FieldFillStrategy): FieldRegistryEntry[] {
  return NPA_FIELD_REGISTRY.filter(f => f.strategy === strategy);
}

/** Get field keys grouped by strategy — used by Express prefill endpoint */
export function getFieldKeysByStrategy(): Record<FieldFillStrategy, string[]> {
  return {
    RULE:   NPA_FIELD_REGISTRY.filter(f => f.strategy === 'RULE').map(f => f.key),
    COPY:   NPA_FIELD_REGISTRY.filter(f => f.strategy === 'COPY').map(f => f.key),
    LLM:    NPA_FIELD_REGISTRY.filter(f => f.strategy === 'LLM').map(f => f.key),
    MANUAL: NPA_FIELD_REGISTRY.filter(f => f.strategy === 'MANUAL').map(f => f.key),
  };
}

/** Get LLM fields grouped by prompt category — used to build LLM prompts */
export function getLlmFieldsByCategory(): Record<string, FieldRegistryEntry[]> {
  const categories: Record<string, FieldRegistryEntry[]> = {};
  for (const entry of NPA_FIELD_REGISTRY) {
    if (entry.strategy === 'LLM' && entry.llmCategory) {
      if (!categories[entry.llmCategory]) {
        categories[entry.llmCategory] = [];
      }
      categories[entry.llmCategory].push(entry);
    }
  }
  return categories;
}

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

/** Recursively collect all fieldKeys from a node and its descendants */
export function collectFieldKeys(node: TemplateNode): string[] {
  let keys = [...(node.fieldKeys || [])];
  for (const child of (node.children || [])) {
    keys = keys.concat(collectFieldKeys(child));
  }
  // Deduplicate
  return [...new Set(keys)];
}

/** Flatten the template tree into a list of section-level nodes for sidebar navigation */
export function getNavSections(): { id: string; label: string; numbering: string }[] {
  const sections: { id: string; label: string; numbering: string }[] = [];

  // Part C sections
  for (const child of (NPA_PART_C_TEMPLATE.children || [])) {
    if (child.type === 'section') {
      sections.push({ id: child.id, label: child.label, numbering: child.numbering });
    }
  }

  // Appendices — use short numbering (A1, A2) for sidebar nav
  for (let i = 0; i < NPA_APPENDICES_TEMPLATE.length; i++) {
    const app = NPA_APPENDICES_TEMPLATE[i];
    sections.push({ id: app.id, label: app.label, numbering: `A${i + 1}` });
  }

  return sections;
}
