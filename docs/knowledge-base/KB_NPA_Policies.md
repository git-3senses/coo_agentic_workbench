# KB_NPA_Policies.md
## Complete NPA Policies & Procedures (Consolidated from 6 Policy Documents)

**Document Version:** 1.0  
**Last Updated:** December 31, 2025  
**Purpose:** Consolidated policy reference for LLM agents covering ALL NPA policies, procedures, and governance

---

## Table of Contents

1. [Policy Overview & Scope](#1-policy-overview--scope)
2. [Product Definitions & Classifications](#2-product-definitions--classifications)
3. [NPA Lifecycle (5 Stages)](#3-npa-lifecycle-5-stages)
4. [Initiation & Kick-Off Requirements](#4-initiation--kick-off-requirements)
5. [Review & Sign-Off Process](#5-review--sign-off-process)
6. [Approval Authority](#6-approval-authority)
7. [Regulatory Clearance & UAT](#7-regulatory-clearance--uat)
8. [Launch & Validity Period](#8-launch--validity-period)
9. [Post-Implementation Review (PIR)](#9-post-implementation-review-pir)
10. [Escalation Procedures](#10-escalation-procedures)
11. [Record Maintenance](#11-record-maintenance)
12. [GFM-Specific Procedures](#12-gfm-specific-procedures)
13. [Evergreen Product Framework](#13-evergreen-product-framework)
14. [Governance Forums](#14-governance-forums)
15. [Policy Deviations](#15-policy-deviations)

---

## 1. Policy Overview & Scope

### 1.1 Purpose

**New Product Approval (NPA) Policy establishes:**
- Controls and governance for introducing new products/services across DBS Group
- Standards for changes to existing products/services
- Risk assessment and sign-off requirements

**Scope:**
- **Applicable to:** ALL Business Units (BUs), Support Units (SUs), branches, subsidiaries in ALL locations
- **Geographic:** Singapore, Hong Kong, London, India, and all other DBS locations
- **Product Types:** Financial products, services, initiatives (principal, agent, intermediary, advisor roles)

### 1.2 Regulatory Primacy Rule

**If DBS policy differs from regulatory requirements:**
- **The STRICTER requirement prevails** (always more conservative)
- RMG-OR (Risk Management Group - Operational Risk) must be notified

**Examples:**
- MAS requires 30-day approval timeline, DBS policy requires 20 days → Use 20 days
- Local regulation allows 2-year validity, DBS allows 1 year → Use 1 year

---

## 2. Product Definitions & Classifications

### 2.1 What is a "New Product/Service"?

**Definition:**  
Any product or service DBS Group intends to offer as principal, agent, intermediary, or advisor.

**Three Main Categories:**

---

### 2.1.1 New-to-Group (NTG)

**Definition:**  
Product/service DBS Group has NEVER done before.

**Criteria (ANY triggers NTG classification):**

**Category A: New Businesses/Products**
- New businesses, initiatives, products, financial instruments, services
- **Example:** Credit Default Swaps (CDS) - DBS has never traded CDS → NTG
- **Example:** Cryptocurrency derivatives - DBS has never offered crypto products → NTG

**Category B: New Roles**
- New roles within business/product group
- **Roles:** Origination, trading as principal, distribution, agency, custodian, operating an exchange, providing operations support
- **Example:** DBS distributes FX Options, but never traded as principal → NTG
- **Example:** First time acting as custodian for mutual funds → NTG

**Category C: New Channels/Segments**
- New distribution channels
- New customer segments
- New exchange memberships
- New markets/geographies
- **Example:** First mobile app distribution (previously only branch) → NTG
- **Example:** First retail offering (previously only institutional) → NTG
- **Example:** First Singapore Exchange (SGX) membership for futures → NTG
- **Example:** First product in Vietnam market → NTG

**NTG Mandatory Requirements:**
1. **PAC Approval REQUIRED** (Product Approval Committee) - BEFORE NPA submission
2. **Full NPA Process** (never NPA Lite)
3. **All Sign-Off Parties** (Credit, Finance, Legal, MLR, Operations, Technology, Compliance)
4. **PIR Mandatory** (within 6 months of launch, even without conditions)
5. **Validity:** 1 year (extendable ONCE for +6 months with unanimous SOP consent + COO approval)

---

### 2.1.2 Variation

**Definition:**  
Modification to existing product/service that **alters risk profile** for customer and/or bank.

**Criteria (ANY triggers Variation classification):**

**Variation Type 1: Bundling/Combination**
- Bundling or combination of existing products
- Can be by one unit OR jointly with another unit
- **Example:** FX Option + Deposit → Dual Currency Deposit (DCD)
- **Example:** Loan + Interest Rate Swap (cross-product structure)

**Variation Type 2: Cross-Book Structures**
- Product structures crossing banking vs trading books
- **Example:** Banking book loan combined with trading book derivative

**Variation Type 3: Accounting Treatment Change**
- Features/structures potentially changing accounting treatment
- **Example:** Accrual accounting → Mark-to-market accounting
- **Action Required:** **Consult Group Finance when in doubt**

**Variation Type 4: Manual Workarounds**
- Products requiring significant offline/manual adjustments
- **Example:** System can't calculate, requires manual Excel calculations
- **Example:** Manual settlement reconciliation needed

**Variation Type 5: Sustainability Features**
- Products with sustainability focus, features, labels
- **Example:** "Green" deposits, "Green" bonds, "ESG" loans
- **Example:** Products linked to UN Sustainable Development Goals (SDGs)

**Variation Type 6: Advanced/Innovative Technology**
- Use of advanced/innovative technology for existing products
- New or significant changes to business operating model
- **Example:** Collaboration with fintech companies
- **Example:** Blockchain-based settlement for FX trades
- **Example:** AI/ML-driven pricing algorithms

**Variation Type 7: New Communication Channels**
- New third-party hosted communication/media channels/platforms
- Channels not previously risk-assessed
- **Example:** Social media platforms (WeChat, WhatsApp) for marketing
- **Example:** Third-party chatbots for customer service

**Variation Approval Track:**
- **If High Risk** (accounting change, manual workarounds, innovative tech) → **Full NPA**
- **If Low/Medium Risk** → **NPA Lite**

---

### 2.1.3 Existing

**Definition:**  
Products/services already approved elsewhere in DBS, but new to specific context.

**Three Sub-Types:**

**Existing Type A: New to Location/Entity/Branch/Unit**
- Product approved and launched by another BU/SU/location/entity
- Same product, different location/entity
- **Example:** FX Forward approved in Singapore, now launching in Hong Kong
- **Example:** Product approved for DBS Bank Ltd (Singapore), now launching in DBSH (Hong Kong entity)

**Existing Type B: Dormant Products**
- Product previously approved but **no transactions in last 12 months**
- Considered dormant, requires reactivation
- **Example:** Product last traded Feb 2024, now Dec 2025 (22 months dormant)

**Existing Type C: Expired Products**
- Approved products not launched within validity period
- Validity expired, requires reactivation
- **Example:** Approved Jan 2024 (1-year validity), not launched by Jan 2025, now expired

**Existing Approval Track:**
- **If dormant <3 years** → **NPA Lite (Fast-Track, 48-hour notice)**
- **If dormant ≥3 years** → **Full Assessment** by GFM COO
- **If expired, no variations** → **NPA Lite**
- **If expired WITH variations** → **Full NPA** (treat as NTG)

---

### 2.1.4 Exclusions (NOT Considered New Products)

**The following are EXCLUDED from NPA definition:**

**Exclusion 1: Organizational Changes**
- Change management initiatives (org structure, transfer of responsibilities)
- NO change to product/service itself
- **Example:** Desk reorganization, team reporting line changes

**Exclusion 2: System Changes**
- New system implementations OR enhancements
- NO change to product/service supported by system
- **Example:** Upgrading Murex version (no product change)

**Exclusion 3: Process Re-Engineering**
- Process changes NOT triggered by new product/variation
- **Example:** Improving settlement efficiency (no product change)

**Exclusion 4: New Legal Entities**
- New operating/legal entities via incorporation or acquisition
- Covered under separate governance/approval process
- **Example:** Acquiring a new subsidiary (not NPA, separate governance)

---

## 3. NPA Lifecycle (5 Stages)

### Stage 1: Product Development & Business Case

**Activities:**

**Product Ideation:**
- Initial product concept development
- Identify market opportunity, customer need

**Early Engagement:**
- **CRITICAL:** Hold discussions with sign-off parties EARLY (before formal NPA)
- Purpose: Mutual understanding of product and key risks
- Incorporate sign-off party inputs BEFORE first draft
- **Benefit:** Reduces loop-backs, saves 3-5 days later

**Business Case Preparation:**
- Proposing unit prepares business case detailing:
  - Rationale (why this product?)
  - Costs (development, operations, technology)
  - Benefits (revenue, strategic positioning)
  - Key risks (credit, market, operational, reputational)
  - Mitigants (how risks will be managed)
- Present to unit management for initial approval

**PAC Approval (NTG Products ONLY):**
- **If NTG:** Proposing unit submits to Product Approval Committee (PAC)
- **PAC Composition:** GFM COO, Group Risk Head, CFO, CRO
- **PAC Decision:** Strategic go/no-go approval
- **ONLY AFTER PAC approval** can NPA process begin
- **If non-NTG:** Skip PAC, proceed to NPA

**Designated Governance Committees:**
- If applicable, obtain approval from designated committees
- **Example:** Technology Governance Committee for tech-heavy products

---

### Stage 2: NPA Process (Due Diligence, Review, Sign-Off, Approval)

**Activities:**

**Initiation:**
- Proposing unit assesses product classification (NTG/Variation/Existing)
- If in doubt → Engage Group BU/SU COO for classification decision
- Organize NPA kick-off meeting with sign-off parties

**Due Diligence:**
- Proposing unit performs comprehensive due diligence:
  - Product specifications (features, structure, pricing)
  - Risk assessment (credit, market, operational, legal, compliance, reputational)
  - Operational requirements (systems, processes, settlement)
  - Technology requirements (booking, reporting, interfaces)
  - Data management (fields, reporting, PURE principles)
  - Legal documentation (ISDA, client agreements, regulatory filings)

**Review & Sign-Off:**
- Engage relevant support units for risk assessment
- Sign-off parties review NPA and provide sign-off
- **Who signs off:** Based on product type, notional, risk (see KB_NPA_Approval_Matrix)
- **Parallel approvals** (all sign-off parties review simultaneously)

**Approval:**
- After ALL sign-offs received → Group BU/SU COO approves
- NPA moves to "Approved" state

---

### Stage 3: Regulatory Clearance & UAT

**Activities:**

**Regulatory Clearance:**
- Obtain regulatory approval/notification (if required)
- **Example:** MAS notification for new derivative product
- **Example:** CFTC registration for US swaps

**User Acceptance Testing (UAT):**
- Test product in UAT environment
- Validate system booking, pricing, settlement, reporting
- Identify and fix issues BEFORE launch

**Critical Rule:**
- NPA sign-offs are SEPARATE from regulatory clearance and UAT
- Can proceed with both **SIMULTANEOUSLY** (parallel)
- BUT: Launch cannot occur until:
  - ALL NPA sign-offs received
  - ALL regulatory clearances obtained
  - ALL UAT issues resolved
  - Re-approvals obtained if material changes from UAT/regulatory feedback

---

### Stage 4: Launch

**Activities:**

**Product Launch:**
- Product goes live and starts trading
- **Launch Date Definition (TWO options):**
  - **Option 1:** Date product first marketed AND resulted in sale/offer
  - **Option 2:** First trade date
  - **NOT Launch:** Merely indicating DBS interest to customer (not yet launched)

**Post-Launch Monitoring:**
- Proposing unit monitors product performance
- Track trading volume, revenue, operational issues, customer feedback

---

### Stage 5: Post-Implementation Review (PIR) & Ongoing Review

**Activities:**

**PIR (Mandatory for Specific Products):**
- **Who:** ALL NTG products, ALL products with post-launch conditions
- **When:** Within 6 months of launch (no later than)
- **Purpose:**
  - Confirm NPA requirements adhered to
  - Address issues not identified before launch
  - Ensure post-launch conditions satisfied
  - Assess performance vs original expectations
  - Capture lessons learned

**Ongoing Reviews:**
- Proposing unit performs periodic reviews:
  - Product performance reviews
  - Risk forum discussions
  - Issue identification and resolution

---

## 4. Initiation & Kick-Off Requirements

### 4.1 Classification Assessment

**Before initiating NPA:**
- Proposing unit assesses product classification (NTG/Variation/Existing)
- **If uncertain:** Engage Group BU/SU COO for decision
- **GFM-Specific:** GFM COO consults GFM NPA Governance Forum for classification

### 4.2 Cross-Border Mandatory Sign-Offs

**If NPA involves cross-border booking:**
- **MANDATORY sign-off parties (NON-NEGOTIABLE):**
  1. Finance (Group Product Control)
  2. RMG-Credit
  3. RMG-Market & Liquidity Risk (MLR)
  4. Technology
  5. Operations

**Cross-Border Definition:**
- Different booking locations/entities
- **Example:** Singapore desk books in Hong Kong entity
- **Example:** London desk books deal in Singapore books

### 4.3 NPA Kick-Off Meeting

**Proposing unit organizes kick-off meeting with sign-off parties:**

**Agenda:**
- Present product overview (features, structure, target customers)
- Discuss risks and issues
- Agree on timeline for due diligence and sign-off
- Clarify sign-off party requirements (what they need to review)

**Timeline Agreement:**
- Proposing unit and sign-off parties mutually agree on timeline
- **If extension needed:** Revised timeline must be mutually agreed

---

## 5. Review & Sign-Off Process

### 5.1 Designated Staff (Assistants to Sign-Off Parties)

**Sign-off parties may appoint designated staff:**
- **Role:** Assist in review of NPA/NPA Lite
- **NOT replacement:** Sign-off party retains ultimate responsibility
- **Example:** Finance VP appoints Senior Analyst to perform detailed review, VP reviews and approves

### 5.2 Sign-Off Party Responsibilities

**Sign-off parties must:**
1. Review NPA comprehensively (product, risks, mitigants)
2. Assess if product aligns with risk appetite
3. Identify conditions (if any) to impose
4. Provide timely sign-off (within SLA, default 48 hours)
5. Engage in loop-back discussions (if clarifications needed)

### 5.3 NPA Champion Roles

**Proposing Unit NPA Champion:**
- **Appointed by:** Proposing unit (or GFM COO for GFM products)
- **Role:** Manage end-to-end risk due diligence, ensure alignment with NPA requirements

**Sign-Off Party NPA Champion:**
- **Appointed by:** Sign-off party
- **Role:** Facilitate timely review and sign-off within their unit

---

## 6. Approval Authority

### 6.1 Approving Authority

**Final Approval:**
- **Group BU/SU Chief Operating Officer (COO)**
- **OR** COO's delegate (must be at least VP level)
- **OR** Party appointed by Group Head of proposing unit

**Overseas Locations:**
- Local approval MUST be obtained per local regulations
- THEN obtain Group BU/SU COO approval
- **Local approval FIRST, Group approval SECOND**

### 6.2 GFM-Specific Approval

**For GFM products:**
- **GFM COO** is approving authority
- GFM COO consults **GFM NPA Governance Forum** for:
  - Product classification decision
  - Appropriate NPA type (Full NPA vs NPA Lite)
  - Relevant sign-off parties selection
  - Final approval for new product

**GFM NPA Governance Forum:**
- **Chairperson:** GFM COO
- **Members:** Regional COO heads, RMG-MLR Head, RMG-Credit Head, GFM Ops Head, Group Tech Head, Finance Head, GFM Legal Head
- **Frequency:** Monthly (cancelled if no NPAs to review)
- **Quorum:** Chairperson (or delegate) + 50% of members
- **Decision:** Majority vote (Chairperson has casting vote if tied)

---

## 7. Regulatory Clearance & UAT

### 7.1 Separate Processes

**NPA process is SEPARATE from regulatory clearance and UAT:**
- Can proceed **in parallel** (simultaneously)
- NPA sign-offs NOT conditional on regulatory clearance/UAT
- BUT: Launch CANNOT occur until BOTH complete

### 7.2 Issue Resolution

**Proposing unit MUST ensure:**
- **All issues/conditions** from regulatory clearance process addressed BEFORE launch
- **All issues/conditions** from UAT sign-off process addressed BEFORE launch
- **Re-approvals obtained** if material changes required based on regulatory/UAT feedback

**Example:**
```
UAT identifies: "System cannot book cross-border FX Option with HK entity"
→ Technology proposes solution: "Book in Singapore entity, inter-company transfer"
→ Legal must re-approve (tax treatment change)
→ Technology re-approves (solution validated)
→ THEN product can launch
```

---

## 8. Launch & Validity Period

### 8.1 Validity Period

**Standard Validity:**
- **ALL NPA approvals valid for 1 YEAR** from approval date
- **Exception:** Evergreen products (3 years - GFM deviation)

**If not launched within validity period:**
- NPA expires
- To reactivate expired product → Engage Group BU/SU COO
- COO decides NPA requirements (may require new NPA or NPA Lite)

### 8.2 Extension Rules

**ONE extension allowed:**
- Can extend for **+6 months** (total 18 months)
- **Extension ONCE ONLY** (cannot extend again after first extension)

**Extension Conditions (ALL must be met):**
1. **No variation** to product features (must be identical to approved NPA)
2. **No alteration** to risk profile (customer or bank)
3. **No change** to operating model or basis of sign-off
4. **Unanimous consensus** from ALL original sign-off parties
5. **Group BU/SU COO approval**

**Extension Process:**
```
Step 1: Proposing unit requests extension (before validity expires)
Step 2: Request sent to ALL original sign-off parties
Step 3: ALL must consent (unanimous)
Step 4: Group BU/SU COO reviews and approves
Step 5: Validity extended by +6 months
```

### 8.3 GFM Deviation - Treasury & Markets

**Deviation Holder:** Treasury & Markets, Singapore and locations
**Section:** 2.7 Launch and Validity of Approval
**Effective Date:** 21 Feb 2023
**Deviation:** Specific validity rules for T&M products (refer to GFM SOP)

---

## 9. Post-Implementation Review (PIR)

### 9.1 PIR Mandatory Triggers

**PIR is MANDATORY for:**

**Trigger 1: ALL New-to-Group (NTG) Products**
- Even if NO conditions imposed
- ALL original sign-off parties must participate
- **Timeline:** Within 6 months of launch

**Trigger 2: ALL Products with Post-Launch Conditions**
- If ANY sign-off party imposed conditions
- **Example:** "Approve subject to daily collateral mark-to-market"
- Sign-off parties who imposed conditions MUST sign-off PIR
- **Timeline:** Within 6 months of launch

**Trigger 3: Reactivated Expired NTG (No Changes)**
- Even if classified as NPA Lite
- Treated as "extension" of original Full NPA
- PIR requirements from original NPA still apply
- **Timeline:** Within 6 months of reactivation launch

**Trigger 4: New to Location/Entity Referencing NTG**
- **If** PIR not completed for referenced NTG product → PIR required
- **If** PIR completed for referenced NTG product → PIR not required

### 9.2 PIR Exemptions

**PIR NOT required for:**

**Exemption 1: Non-NTG without Conditions**
- Full NPA (non-NTG) with NO conditions imposed
- **Example:** Variation product, all approvers approved without conditions

**Exemption 2: NPA Lite without Conditions**
- NPA Lite with NO conditions imposed
- **Exception:** If original product was NTG (then PIR required per Trigger 3)

### 9.3 PIR Timeline & Tracking

**Timeline:**
- **Initiate:** Within 6 months of launch
- **Completion:** Sign-off parties review and approve PIR

**Proposing Unit Responsibilities:**
1. Monitor post-implementation issues
2. Track ALL post-launch conditions
3. Ensure ALL conditions satisfied
4. Initiate PIR on timely basis (within 6 months)
5. Submit PIR report to sign-off parties

**Sign-Off Party Responsibilities:**
1. Review PIR report
2. Validate conditions satisfied
3. Assess performance vs expectations
4. Sign-off on PIR once satisfied

### 9.4 PIR Content Requirements

**PIR report must include:**

**Section 1: Actual vs Projected Performance**
- Trading volume (projected vs actual)
- Revenue (projected vs actual)
- Customer uptake (projected vs actual)
- **Example:** Projected 100 deals, actual 60 deals (60% of projection)

**Section 2: Post-Launch Issues**
- Operational issues encountered
- System issues
- Customer complaints
- Regulatory findings
- **How resolved:** Actions taken to address issues

**Section 3: Conditions Compliance**
- List ALL conditions imposed by sign-off parties
- Status of EACH condition (satisfied/not satisfied)
- Evidence of compliance
- **Example:** "Condition: Daily collateral mark-to-market. Status: Implemented, daily process operational since launch."

**Section 4: Lessons Learned**
- What went well?
- What would you change?
- Recommendations for future similar products

**Section 5: Risk Assessment Update**
- Any NEW risks identified post-launch?
- Any risk mitigants that didn't work as expected?
- Updated risk profile

### 9.5 Group Audit Review

**Group Audit will:**
- Include new products in audit risk assessment
- Conduct PIR(s) where necessary (independent audit)
- Validate proposing unit's PIR findings

---

## 10. Escalation Procedures

### 10.1 Escalation Trigger 1: Unauthorized Product Launch

**Scenario:**  
Product launched or transacted WITHOUT undergoing NPA process

**Action:**
1. **Initiating unit** (who discovered unauthorized launch):
   - Initiate NPA process **without delay**
   - Escalate to:
     - Group BU/SU COO of unit that launched product
     - RMG-OR (or RMG-OR at entities/overseas locations)

2. **Documentation:**
   - Document incident (when launched, why NPA skipped, impact)
   - Root cause analysis

3. **Remediation:**
   - Complete NPA process retroactively
   - Implement controls to prevent recurrence

### 10.2 Escalation Trigger 2: Unresolved/Contentious Issues

**Scenario:**  
Unresolved or contentious issues between proposing unit and sign-off parties

**Examples:**
- Sign-off party rejects, proposing unit disagrees
- Sign-off parties give conflicting feedback
- Approval timeline disputes

**Escalation Path:**
```
Level 1: Unit NPA Champion (attempt to resolve)
  ↓ (if unresolved)
Level 2: Group BU/SU COO
  ↓ (if unresolved)
Level 3: Location Head (if location-specific)
  ↓ (if unresolved)
Level 4: Relevant risk/control committees (e.g., GFM NPA Governance Forum)
```

### 10.3 Escalation Trigger 3: Non-Compliance with Conditions

**Scenario:**  
- Non-fulfillment of conditions imposed
- Non-compliance with conditions
- Delays in condition satisfaction
- Delays in PIR review/sign-off

**Escalation:**
- Escalate to Group BU/SU COO
- Escalate to Location Head
- Escalate to relevant risk/control committees

### 10.4 Escalation Trigger 4: Reputational Risk

**Scenario:**  
Issue exposes Group to higher reputational risk

**Escalation:**
- Group BU/SU COO + Group Compliance + RMG-OR
- Bring concerns to Product Approval Committee (PAC)
- **Example:** Product involves controversial counterparty (sanctioned entity)

---

## 11. Record Maintenance

### 11.1 Documentation Requirements

**Proposing unit MUST keep ALL relevant documents:**
- NPA submission (all versions, including drafts)
- Business case
- Sign-off party reviews and approvals
- Conditions imposed
- PIR report (if applicable)
- Ongoing review records

**Storage:**
- **Location:** Bank's operational risk management system (centralized)
- **Retention:** Per DBS record retention policy

### 11.2 Assessment Documentation

**"No NPA Required" Assessments:**
- If unit assesses product does NOT require NPA (excluded per Section 2.1.4)
- Document assessment and rationale
- Store in operational risk management system
- **Purpose:** Audit trail, regulatory demonstration

---

## 12. GFM-Specific Procedures

### 12.1 GFM NPA Classifications

**GFM uses 4 classification types:**

**1. Full NPA (New-to-Group)**
- Product DBS Group has never done before
- Requires PAC approval
- All sign-off parties engaged

**2. Full NPA (Non-NTG)**
- Significant variation to existing product
- High risk/complexity
- All sign-off parties engaged (no PAC)

**3. NPA Lite**
- Low/medium risk variation
- Existing product (new to location/entity)
- Dormant/expired product (<3 years)
- Reduced sign-off parties

**4. Evergreen**
- Pre-approved standard products
- Auto-approved if within limits
- 3-year validity (GFM deviation)

### 12.2 GFM Clearance Types

**Based on risk/complexity:**

**Type 1: Full Review**
- Complex products requiring comprehensive due diligence
- Cross-border products
- High notional (>$50M)
- NTG products

**Type 2: Standard Review**
- Moderate complexity
- Variations to existing products
- Standard sign-off parties

**Type 3: Fast-Track (NPA Lite)**
- Low risk/complexity
- Existing products (new to location)
- Dormant <3 years
- 48-hour no-objection notice

**Type 4: Evergreen (Auto-Approval)**
- Pre-approved standard products
- Within Evergreen limits
- Same-day approval (log-only)

---

## 13. Evergreen Product Framework

### 13.1 Evergreen Definition

**Evergreen products are:**
- Pre-approved standard/vanilla products
- Approved for **3 years** (vs standard 1 year)
- Auto-approved when within limits
- **No sign-off parties required** (log-only process)

**GFM Deviation:**
- Section 2.7 Launch and Validity of Approval
- Evergreen products: 3-year validity (vs standard 1-year)

### 13.2 Evergreen Eligibility Criteria (ALL Must Be Met)

**Criterion 1: Product on Approved Evergreen List**
- Product explicitly approved by GFM NPA Governance Forum
- Appears on centralized Evergreen list (maintained by COO Office)

**Criterion 2: Product Characteristics**
- **No significant changes** since last approval/trade
- **Back-to-back basis** (hedged trades)
- **Vanilla in nature** (foundation product, all variants built upon it)
- **Liquidity management** products (including DBS Group Holdings)
- **Exchange products** hedging customer trades
- **ABS deals** (origination to meet client demand)

**Criterion 3: Validity Active**
- Evergreen approval is within 3-year validity
- **If expired:** Must reactivate through NPA process
- **After reactivation:** Automatically maintains Evergreen status for another 3 years

**Criterion 4: Live Transactions**
- Product has live transactions in system at time of review
- **OR** Evergreen validity has NOT expired

**Criterion 5: PIR Completed (if NTG)**
- If original product was NTG, PIR must be completed
- **Cannot be Evergreen** until PIR satisfactorily completed

**Criterion 6: Within Limits (see Section 13.3)**

### 13.3 Evergreen Limits

**Evergreen products can trade ONLY if within ALL limits:**

| Limit Type | Scope | Currency | Cap |
|------------|-------|----------|-----|
| **Total Notional** | Aggregated GFM-wide | USD | $500,000,000 |
| **Total Notional (Tenor >10Y)** | Aggregated GFM-wide (sub-limit) | USD | $250,000,000 |
| **Deals Cap (Non-Retail)** | Per NPA | Deals Count | 10 |
| **Deals Cap (Retail)** | Per NPA | Deals Count | 20 |
| **Retail Transaction Size** | Per trade | USD | $25,000,000 |
| **Retail Aggregate Notional** | Aggregated all retail products (sub-limit) | USD | $100,000,000 |

**Limit Enforcement:**
```
BEFORE trade execution:
  - Check: Aggregate notional + this trade <= $500M?
  - Check: Deal count for this NPA + 1 <= cap (10 or 20)?
  - Check: If retail, transaction size <= $25M?
  - Check: If retail, aggregate retail notional + this trade <= $100M?
  - Check: If tenor >10Y, aggregate >10Y notional + this trade <= $250M?
  
  IF (ALL checks PASS):
    → Execute trade (Evergreen auto-approved)
    → Update limits utilization
    → Initiate NPA Lite reactivation process (parallel, post-trade)
  
  ELSE (ANY check FAILS):
    → Downgrade to NPA Lite (NOT Evergreen auto-approval)
    → Notify proposing unit: "Evergreen limit breached, proceeding as NPA Lite"
    → Specify which limit breached
```

**Limit Waivers:**
- **Liquidity management products:** Notional cap and deal count cap WAIVED (exigency nature)
- **Additional trades:** May be permitted with GFM COO approval + justification

**Limit Counting Rules:**
- **Customer leg only:** Only customer-facing leg counts (exclude back-to-back hedge leg)
- **Bond issuance:** Deal count = tranche number (number of client-facing deals)

**Limit Monitoring:**
- **Responsible:** SG GFM COE-NPA team (centrally manages limits)
- **Pre-Trade Check:** Front office checks centralized worksheet before trade
- **Trade Submission:** Sales/traders send deal details to GFM COD SG - COE NPA email
- **Update:** SG NPA team updates limits worksheet within 30 minutes
- **Sanity Check:** Location COO Office confirms trade details correct (30 min)

### 13.4 Evergreen Exclusions (NOT Eligible)

**The following are OUT OF SCOPE for Evergreen:**

**Exclusion 1: Deal-by-Deal Approval Products**
- Products requiring individual approval per deal
- **Example:** TSG2132 Flexi Start IRS (non-standard structure)

**Exclusion 2: Long Dormant Products**
- Products dormant or expired for **>3 years**
- Require full assessment, cannot be Evergreen

**Exclusion 3: Joint-Unit NPAs**
- NPAs involving multiple business units
- Evergreen approved for GFM ONLY (single-unit products)

### 13.5 Evergreen Approval Process

**Step 1: Working Group Assessment**
- Proposing unit requests Evergreen eligibility assessment
- NPA Working Group reviews:
  - Product characteristics (vanilla, back-to-back, etc.)
  - Historical performance (live transactions, PIR status)
  - Compliance with Evergreen criteria
- Working Group endorses if eligible

**Step 2: Forum Approval**
- Endorsed NPAs presented to GFM NPA Governance Forum
- Forum reviews and formally approves Evergreen status
- Product added to centralized Evergreen list

**Step 3: Location Requirements (if applicable)**
- Locations clear local support units
- Locations clear local GFM Head + Country Head (if local regulations require)
- Location COO Office checks and approves before Forum submission

**Step 4: Disagreement Resolution**
- If disagreement on Evergreen eligibility → GFM COO decides
- If necessary → Escalate to NPA Governance Forum for additional discussion/justification

### 13.6 Evergreen Annual Review

**Frequency:** Annual (once per year)

**Purpose:**
1. Remove expired Evergreen products from approved list
2. Validate NPAs on list remain eligible (interim check, no validity change)
3. Early termination if event necessitates removal

**Scope:**
- ALL approved Evergreen products with active status
- Products expired >3 years AND not reactivated → **REMOVED** from list

**Sign-Off:**
- Same working group that originally approved the list
- Re-validates eligibility, signs off on updated list

**Reactivated Products:**
- Evergreen products reactivated through NPA process → **Automatically maintain Evergreen status**
- New validity: NPA approval date + 3 years OR last transaction date during validity + 3 years
- **No need** to submit for working group assessment again

---

## 14. Governance Forums

### 14.1 Product Approval Committee (PAC)

**Composition:**
- GFM COO
- Group Risk Head
- CFO
- CRO
- Senior management

**Purpose:**
- Strategic approval for **NTG products ONLY**
- Go/no-go decision at strategic level

**When Required:**
- **ALL** New-to-Group products (before NPA submission)
- **NOT required** for location/entity-level NPAs (Group requirement only)

**Decision:**
- PAC approves → Proposing unit can initiate NPA process
- PAC rejects → Product cannot proceed

### 14.2 GFM NPA Governance Forum

**Composition:**
- **Chairman:** GFM COO
- **Members:**
  - Regional Head of GFM-COO OFFICE
  - Head of GFM-BMS, Greater China
  - Head of RMG-MLR
  - Head of RMG-Credit-FIRM
  - Head of RMG-GFM-Credit
  - Head of GFM Operations
  - Head of Group Technology
  - Head of Group Operations
  - Head of Finance - Group Product Control
  - Head of GFM Legal and Compliance

**Observers:**
- RMG-OR (consultative, no vote)
- RMG-TR (consultative, no vote)

**Purpose:**
1. Facilitate GFM NPA process and procedural decisions
2. Review urgent approval requests
3. Resolve escalated issues
4. Review NPA sign-off status
5. Decide product classification (NTG/Variation/Existing)
6. Decide NPA type (Full NPA/NPA Lite/Evergreen)
7. Decide sign-off parties
8. Provide final approval for new products

**Meeting Frequency:**
- **Regular:** Monthly (cancelled if no NPAs to review)
- **Ad-Hoc:** As needed for urgent matters

**Decision-Making:**
- **Quorum:** Chairperson (or delegate) + 50% of other members
- **Voting:** Majority vote
- **Tie-Breaker:** Chairperson has casting vote
- **Email Approval:** Email approvals by majority (including Chairperson) = valid

**Escalation:**
- Unresolved matters → Escalate to GFM Business Control Committee (GFM BCC)

**Secretariat:**
- GFM-COO OFFICE NPA Team provides secretariat support
- Meeting materials circulated before meeting
- Minutes circulated via email, presented at next Forum meeting

### 14.3 GFM NPA Working Group

**Composition:**
- PU NPA Champion (appointed by GFM COO)
- Sign-off party NPA Champions (appointed by each sign-off party)
- GFM Data Steward (centralized)

**Responsibilities:**

**PU NPA Champion:**
- Manage end-to-end risk due diligence
- Ensure alignment with NPA requirements
- Coordinate with sign-off parties
- Track NPA progress, conditions, PIR

**Sign-off Party NPA Champion:**
- Facilitate timely review and sign-off within their unit
- Point of contact for proposing unit

**GFM Data Steward:**
- Centrally assess product adherence to:
  - Risk Data Aggregation and Reporting Policy
  - PURE principles (Purposeful, Unsurprising, Respectful, Explainable)
  - Data Management Policy and relevant Standards
- Provide sign-off for data management section in NPA template

---

## 15. Policy Deviations

### 15.1 Current Approved Deviations

**Deviation 1: Priority Sector Lending (PSL), India**
- **Section:** 2.5 Approval
- **Effective Date:** 29 Jul 2020
- **Deviation:** Specific approval authority for PSL products in India

**Deviation 2: Treasury & Markets, Singapore and Locations**
- **Section:** 2.7 Launch and Validity of Approval
- **Effective Date:** 21 Feb 2023
- **Deviation:**
  - Evergreen products: 3-year validity (vs standard 1-year)
  - Evergreen limits and caps framework
  - Evergreen auto-approval process

### 15.2 Deviation Request Process

**If unit requires policy deviation:**

**Step 1: Justification**
- Document business rationale for deviation
- Demonstrate why standard policy insufficient
- Assess risks of deviation

**Step 2: Approval**
- Submit to RMG-OR (Head of RMG-OR approves deviations)
- Specify: Section being deviated, requesting unit/location, effective date

**Step 3: Documentation**
- Approved deviations documented in Appendix 4 of NPA Standard
- Communicated to all stakeholders

---

## END OF KB_NPA_Policies.md

**This document consolidates 6 policy PDFs into one LLM-interpretable knowledge base.**

**Key Features:**
- ✅ Complete product definitions (NTG, Variation, Existing, Exclusions)
- ✅ 5-stage NPA lifecycle with detailed activities
- ✅ Initiation, review, sign-off, approval processes
- ✅ Launch, validity, extension rules
- ✅ Comprehensive PIR requirements (mandatory triggers, exemptions, content)
- ✅ Escalation procedures (4 trigger types)
- ✅ Record maintenance requirements
- ✅ GFM-specific procedures (classifications, clearance types)
- ✅ Complete Evergreen framework (eligibility, limits, approval, annual review)
- ✅ Governance forums (PAC, GFM NPA Governance Forum, Working Group)
- ✅ Policy deviations (current and request process)

**Total Length:** ~18,000 words | ~32 KB

**Usage:** Upload to Dify KB, link to ALL agents (especially Classification Router, Governance Agent, Product Ideation Agent, Template Auto-Fill Agent)
