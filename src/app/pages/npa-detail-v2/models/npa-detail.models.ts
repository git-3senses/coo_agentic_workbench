/**
 * NPA Detail V2 — Page-Level Models & Utility Functions
 * ──────────────────────────────────────────────────────
 * Interfaces for the 7 tabs, helper colour/icon maps,
 * and formatting utilities used across all child components.
 *
 * Draft-builder-specific models live in:
 *   src/app/components/draft-builder/models/draft.models.ts
 */

// ─── Tab Definitions ────────────────────────────────────────────

export type DetailTab =
  | 'PROPOSAL'
  | 'DOCUMENTS'
  | 'ANALYSIS'
  | 'SIGNOFF'
  | 'WORKFLOW'
  | 'MONITOR'
  | 'CHAT';

export interface TabDef {
  id: DetailTab;
  label: string;
  icon: string;
  badge?: number | string;
  badgeColor?: string;
}

// ─── Workflow ───────────────────────────────────────────────────

export interface WorkflowStage {
  id: string;
  label: string;
  status: 'completed' | 'active' | 'pending' | 'blocked';
  date?: string;
  assignee?: string;
}

// ─── Chat ───────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  agentName?: string;
  text: string;
  timestamp: string;
}

// ─── Documents ──────────────────────────────────────────────────

export interface DocumentItem {
  name: string;
  type: string;
  category: string;
  status: 'Valid' | 'Expired' | 'Expiring' | string;
  uploadedBy: string;
  date: string;
  size: string;
  pages: number;
}

export interface MissingDocItem {
  name: string;
  category: string;
  reason: string;
  priority: 'BLOCKING' | 'WARNING';
}

// ─── Proposal ───────────────────────────────────────────────────

export interface KeyTerm {
  label: string;
  value: string;
}

export interface IntakeChecklistItem {
  item: string;
  done: boolean;
}

export interface ProjectData {
  id: string;
  displayId?: string;
  title: string;
  productType: string;
  approvalTrack: string;
  submittedBy: string;
  submittedDate: string;
  currentStage: string;
  department: string;
  businessUnit: string;
  region: string;
  currency: string;
  notionalAmount: number;
  tenor: string;
  crossBorder: boolean;
  ntg: boolean;
  pacStatus: string;
  proposalSummary: string;
  keyTerms: KeyTerm[];
  intakeChecklist: IntakeChecklistItem[];
}

// ─── Draft Progress (page-level summary) ────────────────────────

export interface DraftProgressSummary {
  filled: number;
  total: number;
  required: number;
  requiredFilled: number;
}


// ═══════════════════════════════════════════════════════════════
// Utility Functions — Colour / Icon Maps
// ═══════════════════════════════════════════════════════════════

/** Status badge colours (PASS / FAIL / WARNING / APPROVED / PENDING / etc.) */
export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    PASS:     'text-emerald-600 bg-emerald-50 border-emerald-200',
    FAIL:     'text-red-600 bg-red-50 border-red-200',
    WARNING:  'text-amber-600 bg-amber-50 border-amber-200',
    APPROVED: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    PENDING:  'text-amber-700 bg-amber-50 border-amber-200',
    REJECTED: 'text-red-700 bg-red-50 border-red-200',
    REWORK:   'text-orange-700 bg-orange-50 border-orange-200',
    Valid:    'text-emerald-700 bg-emerald-50 border-emerald-200',
    Expired:  'text-red-700 bg-red-50 border-red-200',
    Expiring: 'text-amber-700 bg-amber-50 border-amber-200',
    BLOCKING: 'text-red-600 bg-red-50 border-red-200',
    PRESENT:  'text-emerald-600 bg-emerald-50 border-emerald-200',
    MISSING:  'text-red-600 bg-red-50 border-red-200',
    CLEAR:    'text-emerald-600',
    BLOCKED:  'text-red-600',
  };
  return map[status] || 'text-slate-600 bg-slate-50 border-slate-200';
}

/** Risk rating pill colours (LOW / MEDIUM / HIGH / CRITICAL) */
export function getRatingColor(rating: string): string {
  const map: Record<string, string> = {
    LOW:      'text-emerald-700 bg-emerald-100 border-emerald-300',
    MEDIUM:   'text-amber-700 bg-amber-100 border-amber-300',
    HIGH:     'text-orange-700 bg-orange-100 border-orange-300',
    CRITICAL: 'text-red-700 bg-red-100 border-red-300',
  };
  return map[rating] || 'text-slate-600 bg-slate-100 border-slate-300';
}

/** Product health indicator (HEALTHY / WARNING / CRITICAL) */
export function getHealthColor(health: string): string {
  const map: Record<string, string> = {
    HEALTHY:  'text-emerald-700 bg-emerald-50',
    WARNING:  'text-amber-700 bg-amber-50',
    CRITICAL: 'text-red-700 bg-red-50',
  };
  return map[health] || 'text-slate-700 bg-slate-50';
}

/** Format number as USD currency (no decimals) */
export function formatCurrency(val: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(val);
}

/** Trend line icon */
export function getTrendIcon(trend: string): string {
  const map: Record<string, string> = {
    up: 'trending-up',
    down: 'trending-down',
    stable: 'minus-circle',
    worsening: 'trending-up',
    improving: 'trending-down',
  };
  return map[trend] || 'circle';
}

/** Trend line colour */
export function getTrendColor(trend: string): string {
  if (trend === 'up' || trend === 'worsening') return 'text-red-500';
  if (trend === 'down' || trend === 'improving') return 'text-emerald-500';
  return 'text-slate-400';
}

/** Workflow stage icon */
export function getWorkflowIcon(status: string): string {
  const map: Record<string, string> = {
    completed: 'check-circle',
    active: 'loader-2',
    pending: 'circle',
    blocked: 'x-circle',
  };
  return map[status] || 'circle';
}

/** Workflow stage colour */
export function getWorkflowColor(status: string): string {
  const map: Record<string, string> = {
    completed: 'text-emerald-500',
    active: 'text-blue-500 animate-spin',
    pending: 'text-slate-300',
    blocked: 'text-red-400',
  };
  return map[status] || 'text-slate-300';
}

/** Score bar width as percentage string */
export function getScoreBarWidth(score: number, max: number): string {
  return `${(score / max) * 100}%`;
}

/** Document status icon */
export function getDocIcon(status: string): string {
  const map: Record<string, string> = {
    Valid: 'check-circle',
    Expired: 'x-circle',
    Expiring: 'alert-triangle',
  };
  return map[status] || 'file-text';
}

/** Document status icon colour */
export function getDocIconColor(status: string): string {
  const map: Record<string, string> = {
    Valid: 'text-emerald-500',
    Expired: 'text-red-500',
    Expiring: 'text-amber-500',
  };
  return map[status] || 'text-slate-400';
}

/** Document completeness bar colour */
export function getDocBarColor(pct: number): string {
  if (pct >= 80) return 'bg-emerald-500';
  if (pct >= 50) return 'bg-amber-500';
  return 'bg-red-500';
}

/** Section owner badge colour */
export function getOwnerColor(owner: string): string {
  const map: Record<string, string> = {
    BIZ:      'bg-blue-100 text-blue-700',
    TECH_OPS: 'bg-indigo-100 text-indigo-700',
    FINANCE:  'bg-emerald-100 text-emerald-700',
    RMG:      'bg-rose-100 text-rose-700',
    LCS:      'bg-amber-100 text-amber-700',
  };
  return map[owner] || 'bg-slate-100 text-slate-700';
}

/** Section owner display label */
export function getOwnerLabel(owner: string): string {
  const map: Record<string, string> = {
    BIZ:      'Business',
    TECH_OPS: 'Tech & Ops',
    FINANCE:  'Finance',
    RMG:      'Risk Mgmt',
    LCS:      'Legal & Compl.',
  };
  return map[owner] || owner;
}

/** Lineage badge colour */
export function getLineageBadge(lineage: string): string {
  const map: Record<string, string> = {
    MANUAL:  'bg-slate-100 text-slate-600',
    AUTO:    'bg-blue-100 text-blue-700',
    ADAPTED: 'bg-purple-100 text-purple-700',
  };
  return map[lineage] || 'bg-slate-100 text-slate-600';
}

/** Fill strategy icon */
export function getStrategyIcon(strategy: string): string {
  const map: Record<string, string> = {
    RULE:   'zap',
    COPY:   'copy-plus',
    LLM:    'sparkles',
    MANUAL: 'pencil',
  };
  return map[strategy] || 'pencil';
}

/** Fill strategy display label */
export function getStrategyLabel(strategy: string): string {
  const map: Record<string, string> = {
    RULE:   'Auto (Rule)',
    COPY:   'Copied from Ref',
    LLM:    'AI Generated',
    MANUAL: 'Manual Entry',
  };
  return map[strategy] || strategy;
}

/** Word count helper */
export function getWordCount(text: string): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}
