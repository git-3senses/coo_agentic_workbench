-- Migration 009: Add Knowledge Base + Evidence Library tables (Feb 23, 2026)
-- Safe to run multiple times (CREATE TABLE IF NOT EXISTS + UPSERT seed).

CREATE TABLE IF NOT EXISTS knowledge_documents (
  doc_id        VARCHAR(64) PRIMARY KEY,
  category      VARCHAR(20) NOT NULL,          -- UNIVERSAL | AGENT | WORKFLOW
  title         VARCHAR(255) NOT NULL,
  description   TEXT NOT NULL,
  doc_type      VARCHAR(40) NULL,             -- PDF | Docs | Sheet | Database (display)
  display_date  VARCHAR(32) NULL,             -- e.g. "Oct 2025", "Live"
  agent_target  VARCHAR(50) NULL,             -- e.g. Ideation, Finance
  icon_name     VARCHAR(50) NULL,             -- lucide icon name
  last_updated  TIMESTAMP NULL DEFAULT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_kd_category (category),
  INDEX idx_kd_agent (agent_target)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS evidence_library (
  record_id       VARCHAR(64) PRIMARY KEY,
  title           VARCHAR(255) NOT NULL,
  description     TEXT NOT NULL,
  evidence_type   VARCHAR(20) NOT NULL,       -- PRECEDENTS | AUDITS | EXCEPTIONS
  status          VARCHAR(20) NOT NULL,       -- APPROVED | REJECTED | SEALED | GRANTED
  relevance_score INT NULL,                   -- percent (0-100)
  event_date      DATE NULL,
  display_date    VARCHAR(32) NULL,           -- e.g. "12 Nov 2025"
  icon_name       VARCHAR(50) NULL,           -- lucide icon name
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_el_type (evidence_type),
  INDEX idx_el_status (status),
  INDEX idx_el_date (event_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── Seed: Knowledge Base ────────────────────────────────────────────────
INSERT INTO knowledge_documents
  (doc_id, category, title, description, doc_type, display_date, agent_target, icon_name, last_updated)
VALUES
  ('DBS_10_S_0012_GR', 'UNIVERSAL', 'DBS Group NPA Policy & Standard',
    'Overarching global policy (RMG-OR). Defines NTG vs Variation vs Existing classifications and standard 1-year validity.',
    'PDF', 'Oct 2025', NULL, 'file-text', '2025-10-01'),
  ('GFM_SOP_v2.3', 'UNIVERSAL', 'GFM NPA Standard Operating Procedures',
    'Stricter GFM-specific rules. Dictates mandatory 5 sign-offs for cross-border deals and 3-loop-back circuit breaker.',
    'Docs', 'Jan 2026', NULL, 'book-open', '2026-01-01'),
  ('SANCTIONS_2026', 'UNIVERSAL', 'Global Prohibited & Sanctions List',
    'OFAC, UN, EU sanctions list plus internal prohibited products. \"Hard Stop\" reference for Ideation Agent.',
    'Database', 'Live', NULL, 'alert-triangle', '2026-01-01'),
  ('REG_MATRIX_Q1', 'UNIVERSAL', 'Regulatory & License Mapping Matrix',
    'Matrix of allowed activities per jurisdiction (MAS in SG, HKMA in HK, FCA in UK).',
    'Sheet', 'Feb 2026', NULL, 'map', '2026-02-01'),
  ('NPA_ARCHIVE_DB', 'UNIVERSAL', 'Historical NPA Master Archive',
    'Indexed database of all past NPA documents (1,784+ records) for similarity searches.',
    'Database', 'Live', NULL, 'archive', '2026-02-01'),
  ('DBS_LIQ_POL', 'UNIVERSAL', 'DBS Group Holdings Liquidity Policy',
    'Enterprise-wide liquidity requirements affecting GFM funding and capital products.',
    'PDF', 'Dec 2025', NULL, 'droplet', '2025-12-01'),
  ('D4D_PURE_v1', 'UNIVERSAL', 'GFM Data Management Policy (PURE)',
    'Design for Data (D4D) standards for ensuring Risk Data Aggregation and Reporting compliance.',
    'Docs', 'Nov 2025', NULL, 'database', '2025-11-01'),
  ('PAC_CHARTER_26', 'UNIVERSAL', 'Product Approval Committee Charter',
    'Group PAC mandate for approving New-To-Group (NTG) products before the NPA process begins.',
    'PDF', 'Jan 2026', NULL, 'users', '2026-01-01'),
  ('EXT_PLATFORM_STDS', 'UNIVERSAL', 'External Platform Review Standards',
    'Checklists and risk controls for connecting GFM product flows to third-party vendor platforms.',
    'Sheet', 'Aug 2025', NULL, 'monitor-speaker', '2025-08-01'),
  ('ESG_FRAMEWORK', 'UNIVERSAL', 'DBS Group Sustainability Framework',
    'Definitions and criteria for classifying products as \"Green\", \"Social\", or \"Sustainable\".',
    'PDF', 'May 2025', NULL, 'leaf', '2025-05-01'),

  ('KB_AGENT_001', 'AGENT', 'NPA Decision Matrix / Classification Tree',
    'Ontological decision tree for NTG vs. Variation vs. Existing mapping.',
    NULL, NULL, 'Ideation', 'git-branch', '2026-02-01'),
  ('KB_AGENT_002', 'AGENT', 'Evergreen Eligibility Master List',
    'Constantly maintained list of products eligible for the 3-year Evergreen track.',
    NULL, NULL, 'Ideation', 'list-checks', '2026-02-01'),
  ('KB_AGENT_003', 'AGENT', 'Evergreen Usage Tracker API',
    'Real-time tracker of current Evergreen notional usage against the $500M GFM-wide cap.',
    NULL, NULL, 'Ideation', 'activity', '2026-02-01'),
  ('KB_AGENT_004', 'AGENT', 'Approved FX Bundles List',
    'Catalog of 28+ pre-approved FX derivative bundles (KIKO, Boosted KO Forward) bypassing arbitration.',
    NULL, NULL, 'Ideation', 'package', '2026-02-01'),
  ('KB_AGENT_005', 'AGENT', 'Cross-Border Booking Rulebook',
    'Legal implications for cross-location trades (e.g., SG booking with HK entity).',
    NULL, NULL, 'Regulatory', 'globe', '2026-02-01'),
  ('KB_AGENT_006', 'AGENT', 'Third-Party Comm Channels Risk Matrix',
    'Classification matrix (High/Low impact) for using WhatsApp, WeChat, external sites.',
    NULL, NULL, 'Compliance', 'message-square', '2026-02-01'),
  ('KB_AGENT_007', 'AGENT', 'Standard Legal Template Library',
    'Approved boilerplate clauses for ISDA, GMRA, NAFMII, and CSA agreements.',
    NULL, NULL, 'Legal', 'scale', '2026-02-01'),
  ('KB_AGENT_008', 'AGENT', 'Financial Crime Risk Guidelines (Appx 3)',
    'Questionnaires and compliance standards for AML, CFT, and Fraud assessment.',
    NULL, NULL, 'Compliance', 'shield-alert', '2026-02-01'),
  ('KB_AGENT_009', 'AGENT', 'Accounting Treatment Standards',
    'Rules determining Trading Book vs Banking Book, FVPL vs FVOCI.',
    NULL, NULL, 'Finance', 'calculator', '2026-02-01'),
  ('KB_AGENT_010', 'AGENT', 'ROAE Sensitivity Analysis Templates',
    'Required calculation templates for any product with a notional >$20M.',
    NULL, NULL, 'Finance', 'trending-up', '2026-02-01'),
  ('KB_AGENT_011', 'AGENT', 'Global Tax Protocol Database',
    'Guidelines on withholding taxes, VAT, and transfer pricing implications per jurisdiction.',
    NULL, NULL, 'Finance', 'landmark', '2026-02-01'),
  ('KB_AGENT_012', 'AGENT', 'Approved Pricing Models Registry',
    'Mathematically validated pricing models and their specific validation expiry dates.',
    NULL, NULL, 'Market Risk', 'bar-chart-2', '2026-02-01'),
  ('KB_AGENT_013', 'AGENT', 'Risk Metric Thresholds',
    'Acceptable tolerances for VaR, IR/FX Delta, Vega, LCR, and NSFR impacts.',
    NULL, NULL, 'Market Risk', 'thermometer', '2026-02-01'),
  ('KB_AGENT_014', 'AGENT', 'Credit Exposure (PCE/SACCR) Methodologies',
    'Standard formulas for pre-settlement and counterparty credit risk calculations.',
    NULL, NULL, 'Credit Risk', 'percent', '2026-02-01'),
  ('KB_AGENT_015', 'AGENT', 'Eligible Collateral Master List',
    'Basel-eligible HQLA and acceptable collateral haircut matrices.',
    NULL, NULL, 'Credit Risk', 'shield-check', '2026-02-01'),
  ('KB_AGENT_016', 'AGENT', 'System Booking Schemas & Typologies',
    'Mapping of standard products to Murex/Mini/FA typologies.',
    NULL, NULL, 'Tech & Ops', 'server', '2026-02-01'),
  ('KB_AGENT_017', 'AGENT', 'BCM Standards (BIA/RTO/RPO)',
    'Rules for required RTO/RPO limits and Business Impact Analysis generation.',
    NULL, NULL, 'Tech & Ops', 'hard-drive', '2026-02-01'),

  ('KB_WF_001', 'WORKFLOW', 'SOP SLA Matrix',
    'Turnaround times for paths (e.g., 48 hours for Impending Deal, targets for Full NPA).',
    NULL, NULL, NULL, 'clock', '2026-02-01'),
  ('KB_WF_002', 'WORKFLOW', 'PIR Playbook',
    'Rules for triggering PIRs (6 months post-launch), tracking conditions, and repeating failed PIRs.',
    NULL, NULL, NULL, 'clipboard-check', '2026-02-01'),
  ('KB_WF_003', 'WORKFLOW', 'Governance Hierarchy & Escalation Paths',
    'Contact mapping for GFM COO Office, PAC, and Forum routing.',
    NULL, NULL, NULL, 'network', '2026-02-01'),
  ('KB_WF_004', 'WORKFLOW', 'Bundling Arbitration Team Charter',
    'Arbitration rules when a bundle fails one of the 8 safety conditions.',
    NULL, NULL, NULL, 'gavel', '2026-02-01'),
  ('KB_WF_005', 'WORKFLOW', 'Fast-Track Dormant Reactivation Rules',
    'Requirements to bypass NPA Lite for products dormant under 3 years with no variations.',
    NULL, NULL, NULL, 'zap', '2026-02-01')
ON DUPLICATE KEY UPDATE
  category=VALUES(category),
  title=VALUES(title),
  description=VALUES(description),
  doc_type=VALUES(doc_type),
  display_date=VALUES(display_date),
  agent_target=VALUES(agent_target),
  icon_name=VALUES(icon_name),
  last_updated=VALUES(last_updated),
  updated_at=CURRENT_TIMESTAMP;

-- ─── Seed: Evidence Library ───────────────────────────────────────────────
INSERT INTO evidence_library
  (record_id, title, description, evidence_type, status, relevance_score, event_date, display_date, icon_name)
VALUES
  ('TSG1917', 'Exchange-Listed IR Options',
    'US Exchange-listed Interest Rate Futures and Options. Grandfathered product with T&M HK precedent. Track: No NPA Required. Model validation already completed.',
    'PRECEDENTS', 'APPROVED', 99, '2025-11-12', '12 Nov 2025', 'git-commit'),
  ('TSG2042', 'NAFMII Repo Agreement',
    'Pledged Bond Repo in CIBM. Classification: NTG. Cross-border settlement via DBS China. Track: Full NPA.',
    'PRECEDENTS', 'APPROVED', 85, '2025-10-04', '04 Oct 2025', 'git-commit'),
  ('TSG2055', 'Nikko AM-ICBC SG China Bond ETF',
    'Nikko AM-ICBC SG China Bond ETF subscription. Classification: Deal-specific. Requires individual deal approval rather than standing NPA.',
    'PRECEDENTS', 'REJECTED', 78, '2025-09-19', '19 Sep 2025', 'git-commit'),
  ('TSG2339', 'Swap Connect Platform',
    'Interest Rate Swaps via Swap Connect platform (cross-border HK ↔ China). ISDA with novation to HKEx OTC Clear. Track: Full NPA.',
    'PRECEDENTS', 'APPROVED', 92, '2025-08-05', '05 Aug 2025', 'git-commit'),
  ('TSG2543', 'Multi-Asset Complex Structured Product',
    'Complex structured product across multiple asset classes. Triggered multiple SOP reviews; rejected due to prolonged clearance timelines.',
    'PRECEDENTS', 'REJECTED', 65, '2025-07-22', '22 Jul 2025', 'git-commit'),
  ('AUD-2026-041', 'Q1 Regulatory Submission Log',
    'Immutable log of MAS 656 regulatory checks performed by the Compliance Agent.',
    'AUDITS', 'SEALED', NULL, '2026-03-01', '01 Mar 2026', 'shield-check'),
  ('EXC-091A', 'Evergreen Cap Override - FX Forwards',
    'Temporary lifting of the $500M GFM cap for Q1 hedging demands.',
    'EXCEPTIONS', 'GRANTED', NULL, '2026-02-28', '28 Feb 2026', 'alert-circle'),
  ('AUD-2025-992', 'Annual Model Validation Sign-offs',
    'RMG validation certificates for 32 active pricing models.',
    'AUDITS', 'SEALED', NULL, '2025-12-31', '31 Dec 2025', 'shield-check')
ON DUPLICATE KEY UPDATE
  title=VALUES(title),
  description=VALUES(description),
  evidence_type=VALUES(evidence_type),
  status=VALUES(status),
  relevance_score=VALUES(relevance_score),
  event_date=VALUES(event_date),
  display_date=VALUES(display_date),
  icon_name=VALUES(icon_name),
  updated_at=CURRENT_TIMESTAMP;

