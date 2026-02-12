# KB_NPA_Templates.md
## Complete NPA Form Templates & Field Definitions

**Document Version:** 1.0  
**Last Updated:** December 31, 2025  
**Purpose:** Comprehensive template specifications for LLM agents to auto-fill and validate NPA forms

---

## Table of Contents

1. [Template Overview & Usage](#1-template-overview--usage)
2. [Full NPA Template (Master)](#2-full-npa-template-master)
3. [NPA Lite Template (Simplified)](#3-npa-lite-template-simplified)
4. [Bundling NPA Template](#4-bundling-npa-template)
5. [Field Definitions & Validation Rules](#5-field-definitions--validation-rules)
6. [Auto-Fill Logic & Data Sources](#6-auto-fill-logic--data-sources)
7. [Template Selection Decision Tree](#7-template-selection-decision-tree)

---

## 1. Template Overview & Usage

### 1.1 Template Types

**Three Primary Templates:**

| Template Type | When to Use | Complexity | Typical Fields |
|---------------|-------------|------------|----------------|
| **Full NPA** | NTG products, High-risk variations, Cross-border, >$50M notional | High | 65+ fields |
| **NPA Lite** | Low-risk variations, Existing products (new location), Dormant <3 years | Medium | 40+ fields |
| **Bundling** | Multiple products combined (FX + IRS + Commodity) | High | 75+ fields |

### 1.2 Template Structure (All Types)

**All templates follow this structure:**

```
SECTION I: Product Specifications (Basic Information)
SECTION II: Operational & Technology Information
SECTION III: Pricing Model Details
SECTION IV: Risk Analysis
  - IV.A: Operational Risk
  - IV.B: Market, Liquidity & Counterparty Credit Risk
  - IV.C: Credit Risk
  - IV.D: Reputational Risk
SECTION V: Data Management
APPENDIX 1: Entity/Location Information
APPENDIX 2: Intellectual Property (IP)
APPENDIX 3: Financial Crime Risk Areas
APPENDIX 4: Risk Data Aggregation and Reporting Requirements
APPENDIX 5: Additional Information for Trading Products/Instruments
```

### 1.3 Auto-Fill Capabilities

**Template Auto-Fill Engine Coverage:**
- **Full NPA:** 78% average auto-fill (51/65 fields)
- **NPA Lite:** 85% average auto-fill (34/40 fields)
- **Bundling:** 70% average auto-fill (53/75 fields)

**Manual Input Always Required (cannot auto-fill):**
1. Specific counterparty name (deal-specific)
2. Exact trade date (future event)
3. Unique product features (bespoke)
4. Custom risk mitigants (judgment-based)
5. Special legal provisions (negotiated)
6. Desk-specific operational procedures (unit-specific)
7. Bespoke pricing adjustments (judgment-based)

---

## 2. Full NPA Template (Master)

### SECTION I: Product Specifications (Basic Information)

**Purpose:** Define the product and its business context

---

#### Field 1.1: NPA ID
- **Type:** Auto-generated (read-only)
- **Format:** `[DESK_CODE][YEAR]-[SEQUENCE]`
- **Example:** `TSG2025-042` (Singapore Trading Desk, 2025, 42nd NPA)
- **Auto-Fill Logic:** System generates on NPA creation
- **Validation:** Must be unique, format regex `^[A-Z]{2,4}[0-9]{4}-[0-9]{3}$`

---

#### Field 1.2: Product Name
- **Type:** Text (required)
- **Max Length:** 200 characters
- **Example:** `FX Put Option GBP/USD with Knock-Out Barrier`
- **Auto-Fill Logic:** 
  - If similar NPA found (>80% similarity) → Suggest product name
  - Pattern: `[Product Type] [Underlying] [Key Features]`
- **Guidance:** Use descriptive name that clearly identifies product structure

---

#### Field 1.3: Product Type
- **Type:** Dropdown (required)
- **Options:**
  - Foreign Exchange (FX)
    - FX Forward
    - FX Option (Vanilla)
    - FX Option (Exotic/Barrier)
    - FX Swap
    - Non-Deliverable Forward (NDF)
  - Interest Rate Derivatives
    - Interest Rate Swap (IRS)
    - Interest Rate Option (Cap/Floor/Swaption)
    - Forward Rate Agreement (FRA)
  - Credit Derivatives
    - Credit Default Swap (CDS)
    - Total Return Swap (TRS)
    - Credit-Linked Note (CLN)
  - Equity Derivatives
    - Equity Option
    - Equity Swap
    - Equity-Linked Note
  - Commodity Derivatives
    - Commodity Swap
    - Commodity Option
    - Commodity Forward
  - Fixed Income
    - Corporate Bond
    - Government Bond
    - Structured Note
  - Structured Products
    - Dual Currency Deposit (DCD)
    - Equity-Linked Deposit
    - Range Accrual Note
  - Fund Products
    - Mutual Fund
    - ETF Subscription
    - Hedge Fund Investment
  - Other (specify)
- **Auto-Fill Logic:** Classification Router Agent determines product type from Phase 0 interview
- **Validation:** Must select one primary type

---

#### Field 1.4: Product Classification
- **Type:** Dropdown (auto-filled, read-only)
- **Options:**
  - New-to-Group (NTG)
  - Variation
  - Existing - Active (referenced from another location)
  - Existing - Dormant (<3 years)
  - Existing - Dormant (≥3 years)
  - Existing - Expired (no variations)
  - Existing - Expired (with variations)
  - Existing - Evergreen
- **Auto-Fill Logic:** Classification Router Agent Stage 1 output
- **Validation:** Cannot be changed after approval

---

#### Field 1.5: Approval Track
- **Type:** Dropdown (auto-filled, read-only)
- **Options:**
  - Full NPA
  - NPA Lite
  - NPA Lite - Fast-Track (48-hour)
  - Bundling
  - Evergreen (auto-approved)
- **Auto-Fill Logic:** Classification Router Agent Stage 2 output
- **Validation:** Cannot be changed after classification

---

#### Field 1.6: Proposing Desk/Business Unit
- **Type:** Dropdown (required)
- **Options:** [Populated from org hierarchy]
  - Singapore Trading Desk
  - Hong Kong Fixed Income
  - London Derivatives
  - India Corporate Advisory
  - [etc.]
- **Auto-Fill Logic:** Current user's desk from user profile
- **Validation:** Must be valid BU code

---

#### Field 1.7: Maker (Proposing Officer)
- **Type:** User lookup (auto-filled)
- **Format:** Name, Email, Employee ID
- **Example:** `Sarah Lee, sarah.lee@dbs.com, EMP12345`
- **Auto-Fill Logic:** Current logged-in user
- **Validation:** Must be active employee

---

#### Field 1.8: NPA Champion
- **Type:** User lookup (auto-filled)
- **Format:** Name, Email, Employee ID
- **Example:** `John Tan, john.tan@dbs.com, EMP67890`
- **Auto-Fill Logic:** Desk/BU NPA Champion from org hierarchy
- **Validation:** Must be designated NPA Champion

---

#### Field 1.9: Target Customer Segment
- **Type:** Multi-select checkbox (required)
- **Options:**
  - Institutional (Banks, Asset Managers, Pension Funds)
  - Corporate (Large Cap, Mid Cap, SME)
  - High Net Worth Individuals (HNWI)
  - Private Banking (Accredited Investors)
  - Retail (Mass Market)
  - Treasury (DBS Group internal)
- **Auto-Fill Logic:** 
  - If similar NPA found → Suggest customer segment
  - If product type = structured note → Default to HNWI + Private Banking
- **Guidance:** Select ALL applicable segments
- **Validation:** At least one must be selected

---

#### Field 1.10: Business Rationale
- **Type:** Long text (required)
- **Min Length:** 100 characters
- **Max Length:** 2000 characters
- **Example:** 
  ```
  ABC Corporation (Hong Kong, A- rated) requests GBP/USD put option 
  to hedge anticipated GBP receivables from UK subsidiary sale. 
  Client expects GBP weakness vs USD over 6-month period. 
  Product allows downside protection while retaining upside if GBP strengthens.
  Estimated revenue: $150K (option premium). Strategic client relationship.
  ```
- **Auto-Fill Logic:** 
  - If similar NPA → Adapt rationale text
  - Pattern: `[Counterparty] requests [product] to [hedge/speculate] [underlying exposure]. Estimated revenue: [amount].`
- **Guidance:** Explain: (1) Customer need, (2) Product fit, (3) Revenue expectation, (4) Strategic importance

---

#### Field 1.11: Expected Transaction Volume
- **Type:** Structured input (required)
- **Sub-fields:**
  - **Volume (Deals):** Numeric
  - **Frequency:** Dropdown (Daily, Weekly, Monthly, Quarterly, Annual, One-Time)
  - **Notional per Deal (USD Equivalent):** Numeric with currency
  - **Total Aggregate Notional (Annual, USD):** Numeric (auto-calculated)
- **Example:**
  ```
  Volume: 10 deals
  Frequency: Monthly
  Notional per Deal: $7M USD equivalent
  Total Aggregate: $70M USD annually
  ```
- **Auto-Fill Logic:** 
  - If similar NPA → Copy volume assumptions
  - If Evergreen → Check against Evergreen limits ($500M cap, 10 deals cap)
- **Validation:** 
  - If Evergreen: Aggregate ≤ $500M, Deals ≤ 10/month
  - If aggregate >$100M → Escalate to CEO approval

---

#### Field 1.12: Revenue Projection
- **Type:** Structured input (required)
- **Sub-fields:**
  - **Revenue Per Deal:** Numeric (USD)
  - **Total Annual Revenue:** Numeric (USD, auto-calculated)
  - **Revenue Sources:** Multi-select (Spread, Premium, Fee, Commission, Other)
  - **ROAE (Return on Allocated Equity):** Percentage
- **Example:**
  ```
  Revenue Per Deal: $15,000
  Total Annual Revenue: $150,000 (10 deals × $15K)
  Revenue Sources: Premium (90%), Admin Fee (10%)
  ROAE: 6.8%
  ```
- **Auto-Fill Logic:** 
  - If similar NPA → Copy revenue structure
  - If ROAE not provided → Prompt user "Finance typically requires ROAE for >$20M products"
- **Validation:** 
  - If ROAE <5.0% → Warning: "Below minimum ROAE threshold, Finance may reject"
  - If notional >$50M → ROAE sensitivity analysis required (upload attachment)

---

#### Field 1.13: PAC Approval (NTG Products Only)
- **Type:** Conditional section (only visible if Product Classification = NTG)
- **Sub-fields:**
  - **PAC Approval Date:** Date picker (required for NTG)
  - **PAC Approval Reference:** Text (meeting minutes reference)
  - **PAC Conditions Imposed:** Long text (list any conditions from PAC)
- **Example:**
  ```
  PAC Approval Date: 2025-11-15
  PAC Approval Reference: PAC Meeting Minutes 2025-11-15, Item 3.2
  PAC Conditions: 
  1. Limit to institutional clients only (no retail)
  2. Maximum notional per deal: $50M
  3. PIR required within 6 months of first trade
  ```
- **Auto-Fill Logic:** N/A (manual entry after PAC meeting)
- **Validation:** 
  - If NTG → PAC approval date MUST be before NPA submission date
  - If PAC conditions → Flag for tracking in PIR

---

#### Field 1.14: Justification for NPA Lite (if NPA Lite selected)
- **Type:** Conditional long text (only visible if Approval Track = NPA Lite)
- **Min Length:** 50 characters
- **Example:**
  ```
  This is a standard FX Forward product, already approved in Singapore 
  (TSG1917). Reactivating for Hong Kong location with no variations. 
  Dormant period: 18 months (<3 years). All risk assessments completed 
  in original NPA. No new technology or operational requirements.
  ```
- **Auto-Fill Logic:** 
  - Pattern: `Standard [product type], approved in [location] ([Reference NPA ID]). [Reason for Lite track].`
- **Guidance:** Explain why Full NPA not required (reference existing approval, low risk, no variations)

---

#### Field 1.15: Involvement of External Parties
- **Type:** Structured input (required)
- **Sub-fields:**
  - **External Parties Involved?:** Yes/No radio button
  - **If Yes, specify:**
    - **Party Name:** Text
    - **Party Role:** Dropdown (Fintech Partner, Data Vendor, Third-Party Administrator, Legal Counsel, Other)
    - **Nature of Involvement:** Long text
    - **Risk Assessment Completed?:** Yes/No
- **Example:**
  ```
  External Parties Involved: Yes
  
  Party 1:
    Name: Bloomberg LP
    Role: Data Vendor
    Nature: Provides GBP/USD volatility surface for option pricing
    Risk Assessment: Yes (existing vendor, no new risks)
  
  Party 2:
    Name: Allen & Overy
    Role: Legal Counsel
    Nature: Drafted ISDA confirmation for exotic barrier feature
    Risk Assessment: Yes (approved law firm)
  ```
- **Auto-Fill Logic:** 
  - If product type = structured/exotic → Prompt: "Typically requires external legal counsel"
  - If similar NPA used external party → Suggest same party
- **Validation:** If external party = NEW vendor → RMG-OR review required

---

### SECTION II: Operational & Technology Information

**Purpose:** Define operational workflow, systems, and technology requirements

---

#### Field 2.1: Booking System
- **Type:** Multi-select checkbox (required)
- **Options:**
  - Murex (Primary trading system)
  - Calypso (Secondary system)
  - Bloomberg Terminal
  - Reuters Eikon
  - Summit (Loans system)
  - Manual (Excel-based)
  - Other (specify)
- **Auto-Fill Logic:** 
  - Based on product type:
    - FX/IRS/CDS → Murex
    - Fixed Income → Summit or Murex
    - Equity → Calypso
  - Copy from similar NPA if available
- **Validation:** At least one system must be selected

---

#### Field 2.2: Trade Capture Process
- **Type:** Dropdown (required)
- **Options:**
  - Straight-Through Processing (STP) - Fully Automated
  - Semi-Automated (Manual validation required)
  - Manual Entry (Trade-by-trade)
- **Auto-Fill Logic:** 
  - If product = standard (FX Forward, vanilla IRS) → STP
  - If product = exotic → Semi-Automated or Manual
- **Guidance:** Describe any manual steps required

---

#### Field 2.3: Valuation/Pricing Model
- **Type:** Dropdown + Text (required)
- **Dropdown Options:**
  - Black-Scholes (Options)
  - Binomial Tree (American Options)
  - Monte Carlo Simulation (Exotic Options)
  - Discounted Cash Flow (DCF)
  - Yield Curve Bootstrap (Swaps)
  - Market Quote (Exchange-Traded)
  - Proprietary Model (Specify)
  - Other (Specify)
- **Additional Text Field:** Model Description (500 chars)
- **Example:**
  ```
  Model: Black-Scholes (European Options)
  Description: Standard Black-Scholes formula with implied volatility 
  from Bloomberg GBPUSD6M HISV surface. Delta hedging daily.
  ```
- **Auto-Fill Logic:** 
  - Product type → Model mapping:
    - FX Vanilla Option → Black-Scholes
    - FX Barrier Option → Monte Carlo
    - IRS → Yield Curve Bootstrap
  - Copy from similar NPA
- **Validation:** If proprietary model → Require Model Risk review

---

#### Field 2.4: Market Data Sources
- **Type:** Multi-select checkbox + Text (required)
- **Options:**
  - Bloomberg
  - Reuters
  - ICE Data Services
  - MarkitSERV
  - Internal DBS Pricing
  - Broker Quotes
  - Other (specify)
- **Additional Text:** Specific Data Fields Required (500 chars)
- **Example:**
  ```
  Sources: Bloomberg (primary), Reuters (backup)
  Data Fields: 
  - GBP/USD spot rate (GBPUSD Curncy)
  - GBP/USD 6M implied volatility (GBPUSD6M HISV)
  - GBP/USD forward points (GBPUSD6M Curncy)
  - Risk-free rates: SOFR (USD), SONIA (GBP)
  ```
- **Auto-Fill Logic:** 
  - Product type → Data sources:
    - FX → Bloomberg spot, forward, vol
    - IRS → Bloomberg curves, LIBOR/SOFR
  - Copy from similar NPA

---

#### Field 2.5: Settlement Method
- **Type:** Structured input (required)
- **Sub-fields:**
  - **Settlement Type:** Dropdown (Physical Delivery, Cash Settlement, Net Settlement)
  - **Settlement Currency:** Dropdown (USD, EUR, GBP, SGD, HKD, etc.)
  - **Settlement Timeframe:** Dropdown (T+0, T+1, T+2, T+3, Other)
  - **Settlement Agent/System:** Text (e.g., CLS, SWIFT, Internal)
- **Example:**
  ```
  Settlement Type: Cash Settlement
  Settlement Currency: USD
  Settlement Timeframe: T+2 (2 business days after trade date)
  Settlement System: SWIFT (via DBS correspondent banks)
  ```
- **Auto-Fill Logic:** 
  - FX → CLS, T+2, Physical delivery
  - Derivatives → Cash settled, T+2
  - Copy from similar NPA
- **Validation:** If cross-border → Ensure settlement agent approved

---

#### Field 2.6: Reconciliation Process
- **Type:** Long text (required)
- **Min Length:** 100 characters
- **Example:**
  ```
  Daily reconciliation between Murex (front office) and SAP (back office).
  Operations team validates:
  1. Trade details (notional, currency pair, strike, expiry)
  2. Settlement instructions
  3. Counterparty confirmations (SWIFT MT300)
  Discrepancies escalated to Trading Desk within 24 hours.
  Monthly position reconciliation with client statements.
  ```
- **Auto-Fill Logic:** 
  - Standard reconciliation template based on product type
  - Copy from similar NPA
- **Guidance:** Describe: (1) Frequency, (2) Systems involved, (3) Validation steps, (4) Escalation process

---

#### Field 2.7: Technology Requirements
- **Type:** Structured input
- **Sub-fields:**
  - **New System Build Required?:** Yes/No
  - **If Yes, specify:**
    - **System Name:** Text
    - **Build Timeline:** Numeric (days)
    - **Technology Owner:** User lookup
  - **System Enhancements Required?:** Yes/No
  - **If Yes, specify enhancements:** Long text
  - **UAT (User Acceptance Testing) Required?:** Yes/No
  - **If Yes, UAT Timeline:** Numeric (days)
- **Example:**
  ```
  New System Build: No
  System Enhancements: Yes
    - Murex: Enable GBP/USD barrier option pricing module
    - Estimated effort: 3 days (module already exists, enable only)
  UAT Required: Yes
    - UAT Timeline: 5 days
    - Test scenarios: Barrier breach, knock-out, settlement
  ```
- **Auto-Fill Logic:** 
  - If product = standard → No build, no enhancements
  - If product = exotic → Likely enhancements, UAT required
- **Validation:** If new build >10 days → Technology sign-off mandatory

---

#### Field 2.8: Operational Dependencies
- **Type:** Long text
- **Example:**
  ```
  Dependencies:
  1. Operations Team: Barrier monitoring (intraday spot checks)
  2. Middle Office: Daily P&L reconciliation for barrier products
  3. Credit Team: Daily collateral mark-to-market (if counterparty <A-)
  4. Compliance: Monthly position reporting to MAS (MAS 610)
  ```
- **Auto-Fill Logic:** 
  - Standard dependencies based on product type
  - Copy from similar NPA
- **Guidance:** List ALL teams/functions that must act for product lifecycle

---

### SECTION III: Pricing Model Details

**Purpose:** Define pricing methodology and assumptions

---

#### Field 3.1: Pricing Methodology
- **Type:** Long text (required)
- **Min Length:** 200 characters
- **Example:**
  ```
  FX Put Option (European) priced using Black-Scholes formula:
  
  Call/Put Price = S₀ × N(d₁) - K × e^(-rT) × N(d₂)
  
  Where:
  - S₀ = Spot GBP/USD rate (1.2750)
  - K = Strike (1.2500)
  - r = Risk-free rate (SOFR 4.5%)
  - σ = Implied volatility (9.2% from Bloomberg GBPUSD6M HISV)
  - T = Time to expiry (6 months = 0.5 years)
  - N(x) = Cumulative normal distribution
  
  Greeks calculated daily:
  - Delta: Hedge ratio, rebalanced daily
  - Gamma: Curvature risk
  - Vega: Volatility sensitivity
  - Theta: Time decay
  
  Spread: 0.15% (15 basis points) on notional
  ```
- **Auto-Fill Logic:** 
  - Product type → Pricing formula:
    - FX Vanilla Option → Black-Scholes template
    - IRS → DCF template
    - CDS → ISDA CDS Model template
  - Copy from similar NPA, adapt parameters
- **Guidance:** Include: (1) Formula, (2) Key inputs, (3) Greeks, (4) Spread/margin

---

#### Field 3.2: Pricing Assumptions
- **Type:** Structured input (required)
- **Sub-fields:**
  - **Volatility Assumption:** Text + Numeric
  - **Interest Rate Curve:** Text
  - **Credit Spread (if applicable):** Numeric (bps)
  - **FX Rate Assumptions:** Text
  - **Other Key Assumptions:** Long text
- **Example:**
  ```
  Volatility: 9.2% (6-month GBP/USD implied vol, Bloomberg)
  Interest Rate Curve: SOFR (USD), SONIA (GBP), as of 2025-12-15
  Credit Spread: N/A (counterparty A-rated, no CVA adjustment)
  FX Rate: Spot 1.2750, forward points -0.0050 (6M)
  Other: Assumes no counterparty default, daily collateralization
  ```
- **Auto-Fill Logic:** Copy from similar NPA, update market data

---

#### Field 3.3: Sensitivity Analysis
- **Type:** Conditional section (required if notional >$20M)
- **Sub-fields:**
  - **Base Case Scenario:** Numeric (revenue, P&L)
  - **Stress Scenario 1 (Market Move):** Numeric
  - **Stress Scenario 2 (Volatility Change):** Numeric
  - **Best Case Scenario:** Numeric
- **Example:**
  ```
  Base Case (Current Market):
    Revenue: $15,000 per deal
    ROAE: 6.8%
  
  Stress Scenario 1 (GBP/USD +5% move):
    P&L Impact: -$120K (delta hedge cost)
    ROAE: 4.2%
  
  Stress Scenario 2 (Volatility +20%):
    Mark-to-Market: +$45K (vega positive)
    ROAE: 9.1%
  
  Best Case (Client exercises at optimal timing):
    Revenue: $22,000 per deal
    ROAE: 10.5%
  ```
- **Auto-Fill Logic:** 
  - If Finance requested sensitivity in prior NPA → Pre-populate template
  - Standard stress scenarios: ±10% underlying, ±20% volatility
- **Validation:** If notional >$50M → Sensitivity MANDATORY

---

#### Field 3.4: Pricing Data Attachments
- **Type:** File upload (optional, but recommended)
- **Accepted Formats:** PDF, Excel, Bloomberg screenshot
- **Example Files:**
  - Bloomberg volatility surface screenshot
  - Excel pricing model with formulas
  - Historical data analysis
- **Auto-Fill Logic:** 
  - If Finance SOP involved → Prompt "Finance typically requires pricing model attachment"
- **Guidance:** Upload supporting materials (Bloomberg screen, Excel calculator, etc.)

---

### SECTION IV: Risk Analysis

**Purpose:** Comprehensive risk assessment across all dimensions

---

### IV.A: Operational Risk

---

#### Field 4.1: Legal & Compliance Considerations

**Sub-field 4.1.1: Legal Documentation Required**
- **Type:** Multi-select checkbox (required)
- **Options:**
  - ISDA Master Agreement
  - Credit Support Annex (CSA)
  - GMRA (Repo Master Agreement)
  - Client Service Agreement
  - Confirmation (SWIFT, Email, Platform)
  - Prospectus/Offering Document
  - Legal Opinion (Specify jurisdiction)
  - Other (specify)
- **Example:**
  ```
  ☑ ISDA Master Agreement (2002 version)
  ☑ Credit Support Annex (CSA) - daily collateral
  ☑ Confirmation (SWIFT MT300)
  ☐ Legal Opinion
  ```
- **Auto-Fill Logic:** 
  - Product type → Documentation:
    - Derivatives → ISDA + CSA
    - Repo → GMRA
    - Structured note → Prospectus
  - Copy from similar NPA

**Sub-field 4.1.2: Regulatory Requirements**
- **Type:** Multi-select checkbox + Text (required)
- **Options:**
  - MAS Regulations (Singapore)
    - MAS Notice 610 (Regulatory Reporting)
    - MAS Notice 637 (Capital Adequacy)
    - MAS Notice 645 (Liquidity)
    - MAS Notice 1015 (Derivatives)
  - HKMA Regulations (Hong Kong)
  - FCA Regulations (UK/London)
  - CFTC Regulations (US)
  - ISDA Dodd-Frank (US Persons)
  - EMIR (EU)
  - Local Regulations (specify)
- **Additional Text:** Compliance Description (500 chars)
- **Example:**
  ```
  ☑ MAS Notice 610 (Derivatives Reporting)
  ☑ MAS Notice 1015 (Retail Distribution Restrictions)
  
  Compliance:
  - MAS 610: Daily transaction reporting to MAS TR (trade repository)
  - MAS 1015: Institutional clients only (no retail distribution)
  - ISDA Protocol: Signed by counterparty (ABC Corp)
  ```
- **Auto-Fill Logic:** 
  - Location → Regulations:
    - Singapore → MAS
    - Hong Kong → HKMA
    - London → FCA
  - Product type + location → Specific notices

**Sub-field 4.1.3: Compliance Sign-Off Required?**
- **Type:** Auto-calculated (read-only)
- **Logic:**
  - If retail distribution OR new jurisdiction OR complex structure → YES
  - Else → NO
- **Display:** "Compliance Sign-Off: [YES/NO] (auto-determined)"

---

#### Field 4.2: Finance & Tax Considerations

**Sub-field 4.2.1: Accounting Treatment**
- **Type:** Dropdown (required)
- **Options:**
  - Mark-to-Market (Fair Value through P&L)
  - Accrual Accounting
  - Hedge Accounting (Cash Flow Hedge)
  - Hedge Accounting (Fair Value Hedge)
  - Available-for-Sale (AFS)
  - Held-to-Maturity (HTM)
  - Other (specify)
- **Example:** `Mark-to-Market (Fair Value through P&L)`
- **Auto-Fill Logic:** 
  - Derivatives → Mark-to-Market
  - Loans → Accrual
  - Hedges → Hedge Accounting (if qualifying)
- **Validation:** If accounting treatment = hedge accounting → Require hedge documentation

**Sub-field 4.2.2: Tax Implications**
- **Type:** Long text (required)
- **Example:**
  ```
  Singapore Tax:
  - No withholding tax on option premium (financial instruments exempt)
  - P&L taxed at corporate rate (17%)
  
  Cross-Border (Hong Kong counterparty):
  - HK-SG tax treaty applies (Article 11: No withholding on financial services)
  - Transfer pricing: Arm's length pricing confirmed by Finance
  
  Withholding Tax: None (exempt under tax treaty)
  ```
- **Auto-Fill Logic:** 
  - Location → Tax template:
    - Singapore → Standard SG tax treatment
    - Cross-border → Tax treaty implications
  - Copy from similar NPA

**Sub-field 4.2.3: Capital Adequacy Impact**
- **Type:** Structured input (required if notional >$10M)
- **Sub-fields:**
  - **Risk-Weighted Assets (RWA):** Numeric (USD)
  - **Capital Charge:** Numeric (USD)
  - **RWA Calculation Method:** Dropdown (Standardized, IRB, Other)
- **Example:**
  ```
  RWA: $15M (based on Standardized Approach, 20% risk weight)
  Capital Charge: $1.2M (8% of RWA)
  Method: Standardized (Counterparty A-rated, 20% risk weight)
  ```
- **Auto-Fill Logic:** 
  - Notional × Risk Weight (based on counterparty rating) × 8%
  - Copy from similar NPA, adjust for notional

---

### IV.B: Market, Liquidity & Counterparty Credit Risk

---

#### Field 4.3: Market Risk

**Sub-field 4.3.1: VaR (Value at Risk)**
- **Type:** Structured input (required)
- **Sub-fields:**
  - **VaR Amount:** Numeric (USD)
  - **Confidence Level:** Dropdown (95%, 99%)
  - **Time Horizon:** Dropdown (1-day, 10-day)
  - **VaR Methodology:** Dropdown (Historical, Parametric, Monte Carlo)
- **Example:**
  ```
  VaR (1-day, 99%): $540K
  Methodology: Parametric (using 9.2% volatility, 2.33 std dev)
  Calculation: $75M × 9.2% × 2.33 / √252 = $540K
  ```
- **Auto-Fill Logic:** 
  - Notional × Volatility × Confidence Factor / √Trading Days
  - Copy from similar NPA, scale by notional
- **Validation:** If VaR >$1M → MLR sign-off mandatory

**Sub-field 4.3.2: Greeks (for Options)**
- **Type:** Conditional section (visible if product = option)
- **Sub-fields:**
  - **Delta:** Numeric (hedge ratio)
  - **Gamma:** Numeric (curvature)
  - **Vega:** Numeric (vol sensitivity)
  - **Theta:** Numeric (time decay)
  - **Rho:** Numeric (rate sensitivity)
- **Example:**
  ```
  Delta: -0.45 (45% hedge ratio, rebalanced daily)
  Gamma: 0.03 (low curvature, stable hedge)
  Vega: $45K per 1% vol change (high vol sensitivity)
  Theta: -$120 per day (time decay cost)
  Rho: $18K per 1% rate change (moderate rate risk)
  ```
- **Auto-Fill Logic:** Black-Scholes Greeks from pricing model

**Sub-field 4.3.3: Stress Testing**
- **Type:** Long text (required if notional >$20M)
- **Example:**
  ```
  Stress Scenario 1: GBP/USD crashes to 1.15 (-10%)
    P&L Impact: +$7.5M (client exercises put, DBS pays)
    Hedge P&L: +$7.35M (delta hedge profitable)
    Net Impact: -$150K (hedge slippage)
  
  Stress Scenario 2: Volatility spikes to 15% (+63%)
    Mark-to-Market: +$280K (vega positive)
    Hedge Cost: +$45K (gamma hedging)
    Net Impact: +$235K (profitable vol move)
  
  Stress Scenario 3: Counterparty default (CVA stress)
    Expected Loss: $375K (50% recovery, $75M notional)
    Mitigant: Daily collateral requirement reduces exposure to $20K
  ```
- **Auto-Fill Logic:** Standard stress scenarios template
- **Guidance:** Cover: Market crash, vol spike, counterparty default

---

#### Field 4.4: Liquidity Risk

**Sub-field 4.4.1: Liquidity Assessment**
- **Type:** Dropdown + Text (required)
- **Dropdown:**
  - Highly Liquid (Exchange-traded, tight spreads)
  - Liquid (OTC, standard products)
  - Moderately Liquid (OTC, some trading)
  - Illiquid (Bespoke, infrequent trading)
- **Text:** Liquidity Description (500 chars)
- **Example:**
  ```
  Assessment: Liquid
  Description: GBP/USD is a major currency pair with deep market liquidity.
  Vanilla put option structure actively traded OTC. Barrier options 
  slightly less liquid but executable with 2-3 market makers.
  Bid-offer spread: 2-3 bps (tight). Can exit position within 1-2 days.
  ```
- **Auto-Fill Logic:** 
  - Major CCY pairs (EUR/USD, GBP/USD) → Liquid
  - Exotic structures → Moderately Liquid or Illiquid
  - Copy from similar NPA

**Sub-field 4.4.2: Funding Requirements**
- **Type:** Structured input
- **Sub-fields:**
  - **Funding Required?:** Yes/No
  - **Funding Amount:** Numeric (USD)
  - **Funding Duration:** Numeric (days)
  - **Funding Source:** Dropdown (DBS Treasury, External, Client Collateral)
- **Example:**
  ```
  Funding Required: Yes
  Funding Amount: $75M (notional amount, upfront delivery)
  Funding Duration: 180 days (6 months to expiry)
  Funding Source: DBS Treasury (internal funding desk)
  Funding Cost: 4.5% (SOFR + 50 bps spread)
  ```
- **Auto-Fill Logic:** 
  - If physical delivery → Funding required = Yes
  - If cash-settled → Funding required = No

---

#### Field 4.5: Counterparty Credit Risk

**Sub-field 4.5.1: Counterparty Information**
- **Type:** Structured input (required)
- **Sub-fields:**
  - **Counterparty Name:** Text (manual entry required)
  - **Counterparty Type:** Dropdown (Bank, Corporation, Sovereign, Fund, HNWI)
  - **Credit Rating:** Dropdown (AAA to D, Unrated)
  - **Rating Agency:** Dropdown (S&P, Moody's, Fitch, Internal)
  - **Jurisdiction:** Dropdown (Singapore, Hong Kong, UK, US, etc.)
  - **Relationship Manager:** User lookup
- **Example:**
  ```
  Counterparty: ABC Corporation Ltd
  Type: Corporation (Manufacturing, Hong Kong)
  Credit Rating: A- (S&P), A3 (Moody's)
  Jurisdiction: Hong Kong
  Relationship Manager: Jane Wong (jane.wong@dbs.com)
  ```
- **Auto-Fill Logic:** N/A (counterparty-specific, manual entry)
- **Validation:** 
  - Counterparty must exist in CRM (C720) OR require KYC
  - If rating <BBB- → Credit sign-off mandatory (Group Risk Head level)

**Sub-field 4.5.2: Credit Exposure**
- **Type:** Structured input (required)
- **Sub-fields:**
  - **Current Exposure:** Numeric (USD, mark-to-market)
  - **Potential Future Exposure (PFE):** Numeric (USD, 99% confidence)
  - **Expected Positive Exposure (EPE):** Numeric (USD, average)
  - **Credit Valuation Adjustment (CVA):** Numeric (USD)
- **Example:**
  ```
  Current Exposure: $0 (at inception, no mark-to-market yet)
  Potential Future Exposure (PFE): $7.5M (99% confidence, worst case)
  Expected Positive Exposure (EPE): $2.1M (average over 6 months)
  CVA: $42K (credit risk charge, 2% of EPE)
  ```
- **Auto-Fill Logic:** 
  - PFE = Notional × Volatility × Confidence Factor × √Time
  - CVA = EPE × Credit Spread × (1 - Recovery Rate)
- **Validation:** If PFE >$10M → Daily collateral required

**Sub-field 4.5.3: Collateral/Mitigants**
- **Type:** Long text (required)
- **Example:**
  ```
  Credit Risk Mitigants:
  1. ISDA CSA (Credit Support Annex) - Daily collateralization
     - Threshold: $0 (collateral required from Day 1)
     - Minimum Transfer Amount: $100K
     - Eligible Collateral: Cash (USD, GBP), US Treasuries
  
  2. Netting Agreement (ISDA Master Agreement 2002)
     - All trades netted at counterparty level
     - Reduces exposure by ~40% (historical netting benefit)
  
  3. Counterparty A-rated (investment grade)
     - Low probability of default (historical PD: 0.05% per year)
     - Strong financial position, publicly listed (HKEX)
  
  Residual Risk: $20K (after collateral, worst case gap risk)
  ```
- **Auto-Fill Logic:** 
  - If counterparty <A- → Daily collateral REQUIRED
  - Standard CSA terms from template
  - Copy from similar NPA with same counterparty

---

### IV.C: Credit Risk (for Lending/Loan Products)

**Note:** This section only required if product involves lending/credit extension

---

#### Field 4.6: Credit Assessment
- **Type:** Conditional section (visible if product = loan, credit facility, repo)
- **Sub-fields:**
  - **Credit Line Available:** Numeric (USD)
  - **Credit Line Utilized:** Numeric (USD, current)
  - **Credit Line Post-Transaction:** Numeric (USD, auto-calculated)
  - **Loan-to-Value (LTV):** Percentage (if secured)
  - **Collateral Description:** Long text (if secured)
  - **Probability of Default (PD):** Percentage
  - **Loss Given Default (LGD):** Percentage
  - **Expected Loss:** Numeric (USD, auto-calculated = PD × LGD × Exposure)
- **Example:**
  ```
  Credit Line: $100M (existing facility, approved 2024)
  Utilized: $45M (current loans outstanding)
  Post-Transaction: $120M (this deal: $75M)
    ⚠ WARNING: Exceeds credit line by $20M
  
  LTV: 75% (secured by UK property portfolio, £60M value)
  Collateral: Commercial real estate, London, valued at £60M ($76M)
  
  PD: 0.5% (A- rating, 1-year horizon)
  LGD: 40% (secured loan, 60% recovery expected)
  Expected Loss: $150K (0.5% × 40% × $75M)
  ```
- **Auto-Fill Logic:** Credit data from C720 (CRM system)
- **Validation:** If credit line exceeded → Credit approval required (override)

---

### IV.D: Reputational Risk

---

#### Field 4.7: Reputational Risk Assessment
- **Type:** Long text (required)
- **Min Length:** 100 characters
- **Example:**
  ```
  Reputational Risk Assessment:
  
  1. Counterparty Reputation: POSITIVE
     - ABC Corporation: Publicly listed (HKEX), strong ESG ratings
     - No adverse media, no sanctions, no litigation history
  
  2. Product Complexity: MEDIUM
     - FX options are mainstream products, well-understood by market
     - Barrier feature adds complexity but manageable with disclosure
  
  3. Regulatory Compliance: LOW RISK
     - Full compliance with MAS 610, MAS 1015
     - Institutional client only (no retail mis-selling risk)
  
  4. Environmental/Social Considerations: N/A
     - Financial hedging product, no direct ESG impact
  
  5. Concentration Risk: LOW
     - Client represents 2% of GFM FX book (<5% threshold)
  
  Overall Assessment: LOW reputational risk
  Mitigants: Standard client disclosures, suitability assessment completed
  ```
- **Auto-Fill Logic:** 
  - Template based on product type
  - Copy from similar NPA
- **Guidance:** Cover: Counterparty reputation, product complexity, regulatory, ESG, concentration

---

### SECTION V: Data Management

**Purpose:** Define data fields, quality, and reporting requirements

---

#### Field 5.1: Data Fields Required
- **Type:** Structured table (required)
- **Columns:**
  - Field Name
  - Data Type (Text, Numeric, Date, Dropdown)
  - Mandatory? (Yes/No)
  - Source System (Murex, Manual Entry, Bloomberg)
  - Regulatory Reporting? (MAS 610, etc.)
- **Example:**
  ```
  | Field Name          | Data Type | Mandatory | Source    | Reporting  |
  |---------------------|-----------|-----------|-----------|------------|
  | Trade ID            | Text      | Yes       | Murex     | MAS 610    |
  | Notional (USD)      | Numeric   | Yes       | Murex     | MAS 610    |
  | Currency Pair       | Text      | Yes       | Manual    | MAS 610    |
  | Strike Price        | Numeric   | Yes       | Manual    | MAS 610    |
  | Expiry Date         | Date      | Yes       | Manual    | MAS 610    |
  | Counterparty LEI    | Text      | Yes       | C720      | MAS 610    |
  | Option Type         | Dropdown  | Yes       | Manual    | MAS 610    |
  | Barrier Level       | Numeric   | Yes       | Manual    | Internal   |
  | Premium (USD)       | Numeric   | Yes       | Murex     | Internal   |
  | Delta               | Numeric   | No        | Murex     | Internal   |
  ```
- **Auto-Fill Logic:** 
  - Standard data fields from product type template
  - MAS 610 mandatory fields for derivatives
  - Copy from similar NPA
- **Validation:** All MAS 610 fields must be captured

---

#### Field 5.2: Data Quality Standards
- **Type:** Long text (required)
- **Example:**
  ```
  Data Quality Standards (PURE Principles):
  
  P - Purposeful:
  - All data fields serve regulatory (MAS 610) or risk management purpose
  - No unnecessary data collection
  
  U - Unsurprising:
  - Data definitions consistent with ISDA/FpML standards
  - No custom definitions that deviate from market practice
  
  R - Respectful:
  - Client data protected per PDPA (Singapore Personal Data Protection Act)
  - Minimum necessary data collected, encrypted at rest/transit
  
  E - Explainable:
  - Data lineage documented (Murex → SAP → MAS TR)
  - Audit trail: All changes logged with user ID and timestamp
  
  Data Validation:
  - Automated checks in Murex (notional limits, date validations)
  - Daily reconciliation between systems (Murex vs SAP vs MAS TR)
  ```
- **Auto-Fill Logic:** Standard PURE template
- **Guidance:** Describe how data adheres to PURE principles

---

#### Field 5.3: Reporting Requirements
- **Type:** Multi-select checkbox + Text (required)
- **Checkboxes:**
  - MAS 610 (Derivatives Reporting) - Daily
  - MAS 637 (Capital Adequacy) - Monthly
  - MAS 645 (Liquidity) - Monthly
  - Internal Risk Reports (VaR, PnL) - Daily
  - Management Reports (Dashboard) - Weekly
  - Other (specify)
- **Additional Text:** Reporting Details (500 chars)
- **Example:**
  ```
  ☑ MAS 610: Daily reporting to MAS TR (Singapore trade repository)
  ☑ Internal Risk Reports: Daily VaR, Greeks, PnL to RMG-MLR
  ☑ Management Reports: Weekly FX Options position report to GFM COO
  
  Reporting Details:
  - MAS 610: T+1 (next business day after trade)
  - Risk Reports: 9:00 AM daily (before market open)
  - Management: Friday 5:00 PM (weekly summary)
  ```
- **Auto-Fill Logic:** 
  - Singapore + Derivatives → MAS 610 daily
  - All products → Internal risk reports
  - Copy from similar NPA

---

### APPENDIX 1: Entity/Location Information

**Purpose:** Define legal entities, booking locations, cross-border structure

---

#### Field A1.1: Booking Entity
- **Type:** Dropdown (required)
- **Options:**
  - DBS Bank Ltd (Singapore)
  - DBS Bank (Hong Kong) Limited
  - DBS Bank Ltd (London Branch)
  - DBS Bank India Limited
  - [All DBS entities from org hierarchy]
- **Example:** `DBS Bank Ltd (Singapore)`
- **Auto-Fill Logic:** User's location/desk → Default booking entity
- **Validation:** Must be valid legal entity

---

#### Field A1.2: Counterparty Entity
- **Type:** Text (manual entry required)
- **Example:** `ABC Corporation Ltd (Hong Kong)`
- **Auto-Fill Logic:** N/A (counterparty-specific)
- **Validation:** Must match legal name in CRM (C720)

---

#### Field A1.3: Cross-Border Transaction?
- **Type:** Auto-calculated (read-only)
- **Logic:**
  ```
  IF (booking_entity_location ≠ counterparty_location) 
  OR (booking_entity_location ≠ settlement_location) 
  OR (multiple_booking_entities):
    cross_border = TRUE
  ELSE:
    cross_border = FALSE
  ```
- **Display:** "Cross-Border: [YES/NO] (auto-determined)"
- **Impact:** If YES → Add Finance, Credit, Legal, MLR, Operations, Technology (mandatory)

---

#### Field A1.4: Jurisdictions Involved
- **Type:** Multi-select checkbox (auto-populated based on entities)
- **Options:**
  - Singapore (MAS)
  - Hong Kong (HKMA)
  - United Kingdom (FCA)
  - United States (CFTC, SEC)
  - India (RBI, SEBI)
  - [All jurisdictions]
- **Example:**
  ```
  ☑ Singapore (MAS) - Booking location
  ☑ Hong Kong (HKMA) - Counterparty location
  ```
- **Auto-Fill Logic:** Booking entity + Counterparty entity → Jurisdictions
- **Display:** Auto-selected based on entities (read-only)

---

#### Field A1.5: Transfer Pricing (if Cross-Border)
- **Type:** Conditional section (visible if Cross-Border = YES)
- **Sub-fields:**
  - **Transfer Pricing Method:** Dropdown (Arm's Length, Cost Plus, TNMM, Other)
  - **Transfer Pricing Description:** Long text
  - **Finance Approval:** Checkbox (Finance must confirm TP acceptable)
- **Example:**
  ```
  Method: Arm's Length (market-based pricing)
  Description: Transaction priced at mid-market rate + standard spread (15 bps).
  Consistent with inter-company transfer pricing policy.
  No profit shifting between Singapore and Hong Kong entities.
  Finance Approval: ☑ Confirmed by Group Product Control (Mark Lee, 2025-12-20)
  ```
- **Auto-Fill Logic:** Standard transfer pricing template for cross-border
- **Validation:** If cross-border → Finance approval REQUIRED

---

### APPENDIX 2: Intellectual Property (IP)

**Purpose:** Identify proprietary models, third-party licenses, IP considerations

---

#### Field A2.1: Proprietary Models Used?
- **Type:** Yes/No radio button (required)
- **If Yes:**
  - **Model Name:** Text
  - **Model Owner:** User lookup (quant team)
  - **Model Validation Date:** Date
  - **Model Risk Review Required?:** Auto-calculated (if proprietary → YES)
- **Example:**
  ```
  Proprietary Models: No
  Rationale: Using standard Black-Scholes (public domain, not proprietary)
  ```
- **Auto-Fill Logic:** 
  - Standard models (Black-Scholes, DCF) → No
  - Custom models → Yes
- **Validation:** If proprietary → Model Risk review mandatory

---

#### Field A2.2: Third-Party IP/Licenses
- **Type:** Multi-select checkbox + Text
- **Options:**
  - Bloomberg Terminal (Market Data)
  - Reuters Eikon (Market Data)
  - MarkitSERV (Trade Processing)
  - ISDA Documentation (Standard Forms)
  - External Valuation Model (Vendor)
  - None
- **Additional Text:** License Details (500 chars)
- **Example:**
  ```
  ☑ Bloomberg Terminal: Market data license (volatility surface)
  ☑ ISDA Documentation: Standard ISDA 2002 Master Agreement
  
  License Details:
  - Bloomberg: Existing enterprise license, no additional cost
  - ISDA: Free to use (standard industry documentation)
  ```
- **Auto-Fill Logic:** 
  - If product = derivative → ISDA documentation
  - If market data source = Bloomberg → Bloomberg license
- **Validation:** Ensure all third-party IP properly licensed

---

### APPENDIX 3: Financial Crime Risk Areas

**Purpose:** AML/KYC, sanctions screening, fraud risk assessment

---

#### Field A3.1: AML/KYC Status
- **Type:** Structured input (required)
- **Sub-fields:**
  - **KYC Completed?:** Yes/No
  - **KYC Completion Date:** Date
  - **KYC Reviewer:** User lookup (Compliance)
  - **Client Risk Rating:** Dropdown (Low, Medium, High)
  - **Enhanced Due Diligence Required?:** Yes/No (if High risk)
- **Example:**
  ```
  KYC Completed: Yes
  KYC Date: 2024-03-15
  KYC Reviewer: Emily Chen (Compliance)
  Client Risk Rating: Low (corporate, A-rated, established relationship)
  Enhanced Due Diligence: No
  ```
- **Auto-Fill Logic:** Query C720 (CRM) for existing KYC status
- **Validation:** If KYC not completed → Block NPA submission

---

#### Field A3.2: Sanctions Screening
- **Type:** Auto-executed (read-only results)
- **Display:**
  ```
  Sanctions Screening: PASS ✅
  
  Screened Against:
  - OFAC SDN List (US Treasury)
  - UN Security Council Sanctions
  - EU Sanctions List
  - MAS Sanctions List (Singapore)
  - HKMA Sanctions List
  
  Counterparty: ABC Corporation Ltd (Hong Kong)
  Screening Date: 2025-12-30
  Result: NO MATCH (clear to proceed)
  
  Ultimate Beneficial Owner (UBO): John Smith (Hong Kong resident)
  UBO Screening: PASS ✅
  ```
- **Auto-Fill Logic:** Prohibited List Checker Agent executes sanctions check
- **Validation:** If FAIL → Block NPA submission (Prohibited track)

---

#### Field A3.3: Fraud Risk Assessment
- **Type:** Long text (required)
- **Example:**
  ```
  Fraud Risk Assessment:
  
  1. Client Verification: LOW RISK
     - ABC Corporation: Established client (5+ years)
     - Verified through public records (HKEX listing)
     - In-person meeting completed (2024-11-10)
  
  2. Transaction Pattern: NORMAL
     - FX options consistent with client hedging needs (UK subsidiary sale)
     - Notional ($75M) aligns with client size (annual revenue $500M)
  
  3. Payment Risk: LOW
     - Premium payment via SWIFT (standard banking channel)
     - No cash transactions, no third-party payments
  
  4. Red Flags: NONE
     - No unusual requests (pricing, structure, settlement)
     - No pressure for rushed execution
     - No changes to beneficiary accounts
  
  Overall: LOW fraud risk, proceed with standard controls
  ```
- **Auto-Fill Logic:** Standard fraud risk template
- **Guidance:** Check for: Identity verification, transaction patterns, payment methods, red flags

---

### APPENDIX 4: Risk Data Aggregation and Reporting Requirements

**Purpose:** Define regulatory reporting and risk aggregation methodologies

---

#### Field A4.1: Risk Aggregation Methodology
- **Type:** Long text (required)
- **Example:**
  ```
  Risk Aggregation Methodology:
  
  1. Position Aggregation:
     - Currency: All GBP/USD positions aggregated by desk
     - Counterparty: All ABC Corporation trades netted (ISDA netting)
     - Geography: Singapore book (DBS Bank Ltd)
  
  2. Risk Metrics:
     - VaR: Parametric, 1-day 99%, aggregated at FX Options portfolio level
     - Greeks: Delta, gamma, vega aggregated by currency pair
     - Credit Exposure: PFE aggregated by counterparty (with netting)
  
  3. Aggregation Frequency:
     - Daily: Position, VaR, Greeks (EOD)
     - Weekly: Credit exposure, concentration (Friday EOD)
     - Monthly: Capital adequacy (RWA), regulatory reporting (last day)
  
  4. Data Sources:
     - Murex (front office positions)
     - SAP (back office confirmations)
     - C720 (counterparty master data)
  
  5. Reconciliation:
     - Daily: Murex vs SAP (Operations)
     - Monthly: Murex vs MAS TR (Compliance)
  ```
- **Auto-Fill Logic:** Standard risk aggregation template for product type
- **Guidance:** Describe: Aggregation levels, metrics, frequency, sources, reconciliation

---

#### Field A4.2: Regulatory Reporting Obligations
- **Type:** Structured table (required)
- **Columns:**
  - Report Name
  - Regulator
  - Frequency
  - Data Source
  - Submission Deadline
- **Example:**
  ```
  | Report               | Regulator | Frequency | Source      | Deadline |
  |----------------------|-----------|-----------|-------------|----------|
  | MAS 610 (Derivatives)| MAS       | Daily     | Murex       | T+1      |
  | MAS 637 (Capital)    | MAS       | Monthly   | SAP Finance | 15th     |
  | MAS 645 (Liquidity)  | MAS       | Monthly   | Treasury    | 15th     |
  | HKMA Return 5A       | HKMA      | Quarterly | Group Risk  | 30 days  |
  ```
- **Auto-Fill Logic:** 
  - Location + Product type → Regulatory reports
  - Copy from similar NPA
- **Validation:** Ensure all mandatory reports identified

---

### APPENDIX 5: Additional Information for Trading Products/Instruments

**Purpose:** Trading-specific details (limits, hedge accounting, margin)

---

#### Field A5.1: Trading Limits
- **Type:** Structured input (required for trading products)
- **Sub-fields:**
  - **Desk Limit (Notional):** Numeric (USD)
  - **Desk Limit Utilized:** Numeric (USD, current)
  - **Desk Limit Post-Transaction:** Numeric (USD, auto-calculated)
  - **VaR Limit:** Numeric (USD)
  - **VaR Utilized:** Numeric (USD, current)
  - **VaR Post-Transaction:** Numeric (USD, auto-calculated)
  - **Concentration Limit (Single Counterparty):** Percentage
  - **Concentration Post-Transaction:** Percentage (auto-calculated)
- **Example:**
  ```
  Desk Limit (Notional): $500M (FX Options, Singapore Trading Desk)
  Utilized: $325M (current positions)
  Post-Transaction: $400M (this deal: $75M)
    ✅ PASS: Within limit ($400M < $500M)
  
  VaR Limit: $5M (1-day 99%, desk-wide)
  Utilized: $3.2M (current VaR)
  Post-Transaction: $3.74M (additional VaR: $540K)
    ✅ PASS: Within limit ($3.74M < $5M)
  
  Concentration (Single Counterparty): 10% max of desk book
  Post-Transaction: 8% (ABC Corp: $400M desk book, $32M exposure)
    ✅ PASS: Within limit (8% < 10%)
  ```
- **Auto-Fill Logic:** 
  - Query MINV (Limit Management System) for current limits
  - Calculate post-transaction utilization
- **Validation:** 
  - If limit exceeded → Block or require override approval
  - Display warnings if >80% utilization

---

#### Field A5.2: Hedge Accounting (if applicable)
- **Type:** Conditional section (visible if accounting treatment = hedge accounting)
- **Sub-fields:**
  - **Hedge Type:** Dropdown (Cash Flow Hedge, Fair Value Hedge, Net Investment Hedge)
  - **Hedged Item:** Text (description)
  - **Hedge Effectiveness Test:** Dropdown (Dollar-Offset, Regression, VAR Reduction)
  - **Hedge Documentation:** File upload (hedge memo)
- **Example:**
  ```
  Hedge Type: Cash Flow Hedge
  Hedged Item: Forecasted GBP receivables from UK subsidiary sale ($75M)
  Effectiveness Test: Dollar-Offset (80-125% effectiveness range)
  Hedge Documentation: Uploaded (Hedge_Memo_ABC_GBP_Receivables.pdf)
  
  Accounting Treatment:
  - Effective portion: Deferred in OCI (Other Comprehensive Income)
  - Ineffective portion: Recognized in P&L immediately
  - Quarterly effectiveness testing by Finance
  ```
- **Auto-Fill Logic:** Hedge accounting template if applicable
- **Validation:** If hedge accounting → Require Finance sign-off and hedge memo

---

#### Field A5.3: Margin/Collateral Requirements
- **Type:** Structured input (required if counterparty requires margin)
- **Sub-fields:**
  - **Initial Margin:** Numeric (USD)
  - **Variation Margin:** Dropdown (Daily, Weekly, None)
  - **Margin Call Threshold:** Numeric (USD)
  - **Eligible Collateral:** Multi-select (Cash, Treasuries, Corporate Bonds, Equities)
  - **Margin Account:** Text (account details)
- **Example:**
  ```
  Initial Margin: $7.5M (10% of notional, posted at inception)
  Variation Margin: Daily (mark-to-market adjustments)
  Margin Call Threshold: $100K (minimum transfer amount)
  Eligible Collateral: Cash (USD, GBP), US Treasuries
  Margin Account: DBS Custody Account #12345678 (held by DBS Bank Ltd)
  
  Margin Process:
  - Daily mark-to-market at 4:00 PM (Singapore time)
  - Margin call if exposure > threshold ($100K)
  - Settlement T+1 (next business day)
  - Operations team monitors daily
  ```
- **Auto-Fill Logic:** 
  - If counterparty <A- OR notional >$50M → Margin required
  - Standard margin terms from CSA template
- **Validation:** If counterparty <BBB- → Daily margin MANDATORY

---

### SECTION VI: Sign-Off Parties & Approvals

**Purpose:** Define required approvers and track sign-offs

---

#### Field 6.1: Required Sign-Off Parties
- **Type:** Auto-populated table (read-only, from Approval Matrix)
- **Columns:**
  - Department
  - Approver Level (Analyst, VP, Head, etc.)
  - Approver Name (to be assigned)
  - Sign-Off Status (Pending, Approved, Rejected, Changes Requested)
  - Sign-Off Date
  - Comments
- **Example:**
  ```
  | Department | Level     | Approver      | Status          | Date       | Comments |
  |------------|-----------|---------------|-----------------|------------|----------|
  | Credit     | VP        | [To Assign]   | Pending         | -          | -        |
  | Finance    | Head      | [To Assign]   | Pending         | -          | -        |
  | Legal      | VP        | [To Assign]   | Pending         | -          | -        |
  | MLR        | VP        | [To Assign]   | Pending         | -          | -        |
  | Operations | Head      | [To Assign]   | Pending         | -          | -        |
  | Technology | Tech Lead | [To Assign]   | Pending         | -          | -        |
  ```
- **Auto-Fill Logic:** 
  - Approval Matrix (KB_NPA_Approval_Matrix) + Classification + Notional + Cross-Border → Required approvers
  - System auto-assigns approvers from org hierarchy
- **Display:** Real-time status updates as approvals received

---

#### Field 6.2: Approval Timeline SLA
- **Type:** Auto-calculated display (read-only)
- **Display:**
  ```
  Approval Track: Full NPA
  Classification: Cross-Border + High Notional ($75M)
  Tier: Tier 3 (Large OR Cross-Border)
  
  Expected Timeline: 7 business days
  
  SLA Per Approver: 48 hours
  Approval Mode: Parallel (all approvers notified simultaneously)
  
  Estimated Completion: 2026-01-07 (assuming all on time)
  ```
- **Auto-Fill Logic:** 
  - Approval Matrix → Tier → Timeline SLA
  - Parallel mode (most common) → Timeline = slowest approver
- **Purpose:** Set user expectations for approval duration

---

#### Field 6.3: PIR (Post-Implementation Review) Requirements
- **Type:** Auto-calculated display (read-only)
- **Display:**
  ```
  PIR Required: YES
  Trigger: Product Classification = NTG
  PIR Due Date: Launch Date + 6 months
  PIR Sign-Off Parties: ALL original approvers (Credit, Finance, Legal, MLR, Ops, Tech)
  
  PIR Reminders Scheduled:
  - Launch + 5 months: "PIR due in 30 days, begin preparation"
  - Launch + 5.5 months: "PIR due in 15 days, submit draft"
  - Launch + 6 months: "PIR OVERDUE, submit immediately"
  ```
- **Auto-Fill Logic:** 
  - KB_NPA_Policies PIR rules:
    - NTG → PIR mandatory
    - Post-launch conditions → PIR mandatory
    - Otherwise → No PIR
- **Purpose:** Inform user of PIR obligations

---

#### Field 6.4: Validity Period
- **Type:** Auto-calculated display (read-only)
- **Display:**
  ```
  Validity Period: 1 year from approval date
  Extension Allowed: YES (ONE extension of +6 months permitted)
  Extension Conditions:
  - No variations to product features
  - No risk profile changes
  - Unanimous consent from ALL sign-off parties
  - Group BU/SU COO approval
  
  Validity Expiry Reminders Scheduled:
  - Approval + 11 months: "NPA expires in 30 days"
  - Approval + 11.5 months: "NPA expires in 15 days - URGENT"
  ```
- **Auto-Fill Logic:** 
  - KB_NPA_Policies validity rules:
    - Standard: 1 year
    - Evergreen: 3 years (GFM deviation)
    - Extension: Once, +6 months
- **Purpose:** Inform user of validity obligations

---

### SECTION VII: Supporting Documents

**Purpose:** Track uploaded documents and validate completeness

---

#### Field 7.1: Document Upload Checklist
- **Type:** Interactive checklist with file upload
- **Categories (10 total, from Agent-Document Mapping):**
  1. Product Specifications
  2. Operational & Technology
  3. Pricing Model
  4. Risk Analysis
  5. Data Management
  6. Entity/Location
  7. Intellectual Property
  8. Financial Crime
  9. Risk Reporting
  10. Trading Products
- **Example Display:**
  ```
  📎 Document Upload Checklist
  
  Category 1: Product Specifications ✅ 100%
    ✅ Product term sheet (uploaded: Product_Term_Sheet_GBP_Option.pdf)
    ✅ Customer request letter (uploaded: ABC_Request_Letter.pdf)
  
  Category 2: Operational & Technology ✅ 100%
    ✅ System configuration document (auto-filled in Section II)
  
  Category 3: Pricing Model ✅ 100%
    ✅ Pricing model (uploaded: Pricing_Model_Black_Scholes.xlsx)
    ✅ Bloomberg volatility screenshot (uploaded: Bloomberg_GBPUSD_Vol.png)
  
  Category 4: Risk Analysis ✅ 100%
    ✅ ROAE model (uploaded: ROAE_Sensitivity_Model.xlsx)
    ✅ Credit rating report (uploaded: SP_ABC_Corp_Rating.pdf)
    ✅ ISDA Master Agreement (uploaded: ISDA_2002_ABC_Corp.pdf)
  
  ... [continues for all 10 categories]
  
  Overall Completeness: 95% (38/40 required documents uploaded)
  ⚠️ Missing: 2 documents in Category 9 (Risk Reporting)
  ```
- **Auto-Fill Logic:** 
  - Document Checklist Agent validates completeness per category
  - ML Prediction Agent suggests missing documents
- **Validation:** 
  - Checker cannot approve if completeness <90%
  - Display warnings for missing critical documents

---

## 3. NPA Lite Template (Simplified)

**Purpose:** Simplified template for low-risk variations, existing products (new location), dormant <3 years

**Structure:** Same sections as Full NPA, but reduced fields

**Key Differences from Full NPA:**

### Reduced Fields (40 fields vs 65):

**SECTION I: Product Specifications**
- ❌ Remove: PAC Approval (not required for NPA Lite)
- ❌ Remove: Detailed Business Rationale (reduced to 100 chars)
- ✅ Keep: All identification fields (NPA ID, Product Name, Maker, etc.)
- ✅ Add: **Justification for NPA Lite** (required, explain why not Full NPA)

**SECTION II: Operational & Technology**
- ❌ Remove: Technology Requirements (assumed standard, no new build)
- ✅ Keep: Booking System, Trade Capture, Valuation Model (simplified)

**SECTION III: Pricing Model**
- ❌ Remove: Sensitivity Analysis (not required for NPA Lite unless >$20M)
- ✅ Keep: Pricing Methodology, Pricing Assumptions

**SECTION IV: Risk Analysis**
- ❌ Remove: Detailed Stress Testing (simplified to 1 scenario)
- ❌ Remove: Credit Risk section (unless lending product)
- ✅ Keep: Legal & Compliance, Finance & Tax, Market/Liquidity Risk (simplified)

**APPENDICES:**
- ❌ Remove: Appendix 2 (IP) - assumed no proprietary models
- ❌ Remove: Appendix 5 (Trading Products) - assumed standard limits
- ✅ Keep: Appendix 1 (Entity/Location), Appendix 3 (Financial Crime), Appendix 4 (Reporting)

### Auto-Fill Coverage (NPA Lite):
- **85% average auto-fill** (34/40 fields)
- Higher auto-fill because referencing existing NPA (copy/adapt approach)

### Example NPA Lite Scenario:
```
Product: FX Forward EUR/USD
Classification: Existing - Active (referenced from TSG1917, Singapore)
Location: Reactivating for Hong Kong desk
Dormant Period: 18 months (<3 years)
Justification: Standard product, no variations, approved in Singapore 2024-03-15

Approval Track: NPA Lite - Fast-Track (48-hour)
Required Approvers: Credit (Senior Analyst) + Finance (Senior Manager)
Timeline: 2 business days
```

---

## 4. Bundling NPA Template

**Purpose:** Template for bundled products (multiple products combined, e.g., FX + IRS + Commodity)

**Structure:** Enhanced Full NPA with bundling-specific sections

**Key Differences from Full NPA:**

### Additional Fields (75 fields total):

**SECTION I: Product Specifications - BUNDLING SECTION**

#### Field 1.16: Bundled Products Count
- **Type:** Numeric (read-only, auto-calculated)
- **Example:** `3 products bundled`

#### Field 1.17: Bundled Components Table
- **Type:** Structured table (required)
- **Columns:**
  - Component #
  - Product Type
  - Notional (USD)
  - Independent Tier (if standalone)
  - Individual Approvers (if standalone)
- **Example:**
  ```
  | # | Product Type       | Notional | Standalone Tier | Standalone Approvers     |
  |---|--------------------|----------|-----------------|--------------------------|
  | 1 | FX Forward         | $10M     | Tier 2          | Credit SA + Finance SM   |
  | 2 | IRS (Fixed-Float)  | $15M     | Tier 2          | Credit SA + Finance SM + MLR |
  | 3 | Commodity Forward  | $5M      | Tier 2 (Variation) | Credit SA + Finance SM |
  ```

#### Field 1.18: Aggregate Notional
- **Type:** Numeric (auto-calculated)
- **Formula:** Sum of all component notionals
- **Example:** `$30M ($10M + $15M + $5M)`

#### Field 1.19: Bundling Rationale
- **Type:** Long text (required)
- **Min Length:** 200 characters
- **Example:**
  ```
  Bundling Rationale:
  
  Client (ABC Corp) requires comprehensive hedge package for UK subsidiary acquisition:
  1. FX Forward: Hedge GBP/USD exposure on purchase price (£8M)
  2. IRS: Convert floating-rate debt to fixed (reduce interest rate risk)
  3. Commodity Forward: Hedge oil price risk (manufacturing input cost)
  
  Bundling Benefits:
  - Simplified execution (single agreement vs 3 separate NPAs)
  - Operational efficiency (one counterparty relationship, netted margin)
  - Client preference (holistic solution, pricing advantage)
  
  Hedging Relationship: All three products hedge exposures from same acquisition
  
  Economic Substance: Each product independently economically rational
  (not bundling for regulatory arbitrage)
  ```

#### Field 1.20: Bundling Approval Requirements
- **Type:** Auto-calculated display (read-only)
- **Display:**
  ```
  Bundling Approval Requirements:
  
  Step 1: Bundling Arbitration Team Review
    - Purpose: Validate bundling approach (approve as bundle OR split)
    - Timeline: 2-3 days
  
  Step 2 (if approved as bundle): Aggregate Approvers
    - Highest Tier: Tier 2 (all components Tier 2)
    - Aggregate Notional: $30M (triggers Tier 3 escalation)
    - Final Tier: Tier 3 (Finance escalates to Head of Finance)
    - Approvers: Credit SA + Finance Head + MLR SA + Legal VP (cross-border)
  
  Step 3: Bundling Team Sign-Off
    - Final approval from Bundling Arbitration Team
  
  Total Timeline: 8-10 days (Tier 3 + Bundling coordination)
  ```

#### Field 1.21: Component Interdependencies
- **Type:** Long text (required)
- **Example:**
  ```
  Component Interdependencies:
  
  1. FX Forward ↔ IRS:
     - FX hedge impacts interest rate exposure (GBP debt converted to USD)
     - IRS notional adjusted for FX-hedged amount
  
  2. IRS ↔ Commodity Forward:
     - Both hedge cash flow volatility from acquisition
     - Timing coordinated (both start after acquisition closes)
  
  3. FX Forward ↔ Commodity Forward:
     - No direct interdependency (independent hedges)
  
  Risk Interaction:
     - VaR Diversification: Aggregate VaR $1.2M (vs $1.8M if independent)
     - Netting Benefit: Margin requirement reduced by 30% with bundling
  ```

**SECTION IV: Risk Analysis - BUNDLING RISK SECTION**

#### Field 4.8: Aggregate Risk Assessment
- **Type:** Structured input (required)
- **Sub-fields:**
  - **Aggregate VaR:** Numeric (USD)
  - **Diversification Benefit:** Percentage (reduction from bundling)
  - **Aggregate PFE:** Numeric (USD)
  - **Netting Benefit:** Percentage
- **Example:**
  ```
  Aggregate VaR (1-day, 99%): $1.2M
    - Component VaR sum (independent): $1.8M
    - Diversification Benefit: 33% reduction (due to correlation <1)
  
  Aggregate PFE (99%): $18M
    - Component PFE sum (independent): $25M
    - Netting Benefit: 28% reduction (ISDA netting agreement)
  
  Rationale: Bundling REDUCES risk through diversification and netting
  ```

#### Field 4.9: Bundling-Specific Risks
- **Type:** Long text (required)
- **Example:**
  ```
  Bundling-Specific Risks:
  
  1. Execution Risk: MEDIUM
     - Challenge: Coordinating 3 simultaneous trades
     - Mitigant: Execute within 1-hour window, pre-agreed pricing
  
  2. Documentation Risk: LOW
     - Single ISDA Master Agreement covers all 3 products
     - Confirmation templates standardized
  
  3. Operational Risk: MEDIUM
     - Challenge: Settlement coordination (FX T+2, IRS T+2, Commodity T+3)
     - Mitigant: Operations team dedicated bundle coordinator
  
  4. Regulatory Risk: LOW
     - All 3 products individually compliant (no bundling-specific regulations)
  
  5. Unwind Risk: MEDIUM
     - Challenge: If client unwinds one component, affects others
     - Mitigant: Contractual clause allows component unwind (pro-rata pricing)
  ```

---

## 5. Field Definitions & Validation Rules

### Validation Types:

**1. Format Validation**
- **Regex patterns** for structured fields (NPA ID, dates, emails)
- **Example:** NPA ID must match `^[A-Z]{2,4}[0-9]{4}-[0-9]{3}$`

**2. Range Validation**
- **Numeric ranges** (notional >$0, ROAE 0-100%)
- **Date ranges** (expiry date > trade date)

**3. Business Rule Validation**
- **Cross-field validation** (if cross-border → Finance + Ops + Tech required)
- **Threshold checks** (if notional >$50M → CEO approval required)

**4. Completeness Validation**
- **Required fields** (cannot submit NPA with missing required fields)
- **Document checklist** (warn if <90% complete)

**5. Sign-Off Validation**
- **Approval matrix** (ensure correct approvers assigned)
- **SLA tracking** (warn if approaching SLA breach)

### Validation Error Messages:

**Severity Levels:**
1. **BLOCKING ERROR (Red):** Cannot proceed (e.g., missing required field)
2. **WARNING (Yellow):** Can proceed with caution (e.g., ROAE <5%)
3. **INFO (Blue):** Informational only (e.g., "Similar NPA found: TSG1917")

**Example Error Messages:**
```
❌ BLOCKING: Field "Counterparty Name" is required (cannot submit)
⚠️ WARNING: ROAE (4.2%) below minimum threshold (5.0%) - Finance may reject
ℹ️ INFO: Similar NPA found (TSG1917, 94% match) - auto-fill available
```

---

## 6. Auto-Fill Logic & Data Sources

### Auto-Fill Data Sources:

**1. User Profile**
- **Fields:** Maker, Desk/BU, Location, NPA Champion
- **Source:** User authentication session

**2. Historical NPAs (KB Search)**
- **Fields:** Product specifications, risk analysis, pricing model, operational details
- **Source:** Semantic search over 1,784+ historical NPAs
- **Matching:** Product type + notional + location + counterparty type

**3. Classification Router Agent**
- **Fields:** Product Classification, Approval Track
- **Source:** KB_NPA_Classification_Rules + KB_NPA_Approval_Matrix
- **Logic:** Two-stage classification (Product Type → Approval Track)

**4. Approval Matrix (KB)**
- **Fields:** Required Sign-Off Parties, Approver Levels, Timeline SLA
- **Source:** KB_NPA_Approval_Matrix
- **Logic:** Tier determination (notional + cross-border + risk) → Approvers

**5. Prohibited List Checker Agent**
- **Fields:** Sanctions Screening Result
- **Source:** OFAC, UN, EU, MAS sanctions lists
- **Logic:** Counterparty name + UBO name → Screening

**6. CRM System (C720)**
- **Fields:** Counterparty details, KYC status, credit rating, relationship manager
- **Source:** DBS internal CRM
- **API:** Real-time query

**7. Limit Management System (MINV)**
- **Fields:** Desk limits, VaR limits, concentration limits
- **Source:** DBS internal limit system
- **API:** Real-time query

**8. Market Data (Bloomberg/Reuters)**
- **Fields:** Pricing assumptions (spot, forward, volatility, interest rates)
- **Source:** Bloomberg Terminal (if available)
- **API:** Bloomberg API or manual upload

### Auto-Fill Workflow:

```
Step 1: User starts NPA (NPA ID auto-generated)
Step 2: Product Ideation Agent interview (gather product details)
Step 3: Classification Router Agent (classify product → approval track)
Step 4: KB Search Agent (find similar historical NPA, 80%+ similarity)
Step 5: Template Auto-Fill Engine:
  - Copy 51/65 fields from similar NPA (TSG1917)
  - Adapt: Notional, counterparty, dates (user-specific)
  - Query CRM: Counterparty details, KYC, credit rating
  - Query MINV: Desk limits, VaR limits
  - Calculate: Aggregate notional, post-transaction limits, risk metrics
Step 6: Display to user:
  - 🟢 GREEN: Auto-filled & verified (51 fields)
  - 🟡 YELLOW: Auto-filled, verify (7 fields - user should double-check)
  - ⚪ WHITE: Manual entry required (7 fields)
Step 7: User reviews, edits, submits
```

### Auto-Fill Confidence Scoring:

**High Confidence (🟢 GREEN):**
- Exact match from similar NPA (>90% similarity)
- Standard fields (desk, maker, booking system)
- Calculated fields (aggregate notional, post-transaction limits)

**Medium Confidence (🟡 YELLOW):**
- Adapted from similar NPA (80-90% similarity)
- Market data (may have changed since reference NPA)
- Risk assumptions (should validate)

**Low Confidence (⚪ WHITE):**
- No similar NPA found (<80% similarity)
- Counterparty-specific (must be entered manually)
- Future events (trade date, expiry date)

---

## 7. Template Selection Decision Tree

```
START: User initiates NPA

↓
Phase 0: Product Ideation Interview
  - Product details gathered (type, notional, counterparty, etc.)

↓
Classification Router Agent (Stage 1: Product Type)
  - NTG? Variation? Existing?

↓
Classification Router Agent (Stage 2: Approval Track)
  - Apply override rules (cross-border, notional, bundling, etc.)

↓
TEMPLATE SELECTION:

IF Approval Track = "Full NPA":
  → Use FULL NPA TEMPLATE (65 fields)
  → Auto-fill: 51/65 fields (78%)
  → Required approvers: 4-7 (based on tier)
  → Timeline: 7-12 days

ELSE IF Approval Track = "NPA Lite":
  → Use NPA LITE TEMPLATE (40 fields)
  → Auto-fill: 34/40 fields (85%)
  → Required approvers: 2-3
  → Timeline: 4-5 days

ELSE IF Approval Track = "NPA Lite - Fast-Track":
  → Use NPA LITE TEMPLATE (40 fields)
  → Auto-fill: 34/40 fields (85%)
  → Process: 48-hour no-objection notice to original approvers
  → Timeline: 2 days

ELSE IF Approval Track = "Bundling":
  → Use BUNDLING NPA TEMPLATE (75 fields)
  → Auto-fill: 53/75 fields (70%)
  → Step 1: Bundling Arbitration Team review (2-3 days)
  → Step 2: Aggregate approvers (based on bundle tier)
  → Timeline: 8-10 days

ELSE IF Approval Track = "Evergreen":
  → NO TEMPLATE REQUIRED (auto-approved if within limits)
  → Check Evergreen limits (notional cap, deal count cap)
  → IF all limits PASS:
      → Auto-approve (log-only, <1 hour)
      → Initiate NPA Lite reactivation process (parallel, post-trade)
  → IF any limit FAILS:
      → Downgrade to NPA LITE TEMPLATE (40 fields)
      → Notify user: "Evergreen limit breached, proceeding as NPA Lite"

ELSE IF Approval Track = "Prohibited":
  → HARD STOP (no template)
  → Display prohibition reason
  → Contact Compliance to override (if error)

END
```

---

## END OF KB_NPA_Templates.md

**This document provides complete NPA template specifications for LLM agents.**

**Key Features:**
- ✅ 3 primary templates (Full NPA, NPA Lite, Bundling)
- ✅ 65+ fields for Full NPA with detailed definitions
- ✅ 40+ fields for NPA Lite (simplified)
- ✅ 75+ fields for Bundling (enhanced)
- ✅ Complete field definitions, validation rules, auto-fill logic
- ✅ 10 document categories mapped to template sections
- ✅ Auto-fill coverage: 78% (Full), 85% (Lite), 70% (Bundling)
- ✅ Template selection decision tree
- ✅ Validation types & error messages
- ✅ Data sources for auto-fill (CRM, MINV, Bloomberg, Historical NPAs)

**Total Length:** ~25,000 words | ~45 KB

**Usage:** Upload to Dify KB, link to Template Auto-Fill Engine, Product Ideation Agent, Document Checklist Agent
