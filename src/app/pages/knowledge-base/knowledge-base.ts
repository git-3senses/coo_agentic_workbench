import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedIconsModule } from '../../shared/icons/shared-icons.module';

@Component({
  selector: 'app-knowledge-base',
  standalone: true,
  imports: [CommonModule, SharedIconsModule],
  templateUrl: './knowledge-base.html',
  styleUrl: './knowledge-base.css',
})
export class KnowledgeBaseComponent {
  activeTab: 'ALL' | 'UNIVERSAL' | 'AGENT' | 'WORKFLOW' = 'ALL';

  universalDocs = [
    { title: 'DBS Group NPA Policy & Standard', id: 'DBS_10_S_0012_GR', desc: 'Overarching global policy for New Product Approvals.', type: 'PDF', date: 'Oct 2025', icon: 'file-text' },
    { title: 'GFM NPA Standard Operating Procedures', id: 'GFM_SOP_v2.3', desc: 'GFM-specific rules dictating mandatory 5 sign-offs.', type: 'Docs', date: 'Jan 2026', icon: 'book-open' },
    { title: 'Global Prohibited & Sanctions List', id: 'SANCTIONS_2026', desc: 'OFAC, UN, EU sanctions and internal prohibited lists.', type: 'Database', date: 'Today', icon: 'alert-triangle' },
    { title: 'Regulatory & License Mapping Matrix', id: 'REG_MATRIX_Q1', desc: 'Activities permitted per jurisdiction (MAS, HKMA, FCA).', type: 'Sheet', date: 'Feb 2026', icon: 'map' },
    { title: 'Historical NPA Master Archive', id: 'NPA_ARCHIVE_DB', desc: 'Indexed database of all past NPA documents (1,784+).', type: 'Database', date: 'Live', icon: 'archive' }
  ];

  agentDocs = [
    { title: 'NPA Decision Matrix / Classification Tree', agent: 'Ideation', desc: 'Decision tree for NTG vs Variation classification.', icon: 'git-branch' },
    { title: 'Evergreen Eligibility Master List', agent: 'Ideation', desc: 'Products eligible for the 3-year Evergreen track.', icon: 'list-checks' },
    { title: 'Cross-Border Booking Rulebook', agent: 'Regulatory', desc: 'Legal implications for cross-location trades.', icon: 'globe' },
    { title: 'Financial Crime Risk Guidelines', agent: 'Compliance', desc: 'Standards for AML, CFT, and Fraud assessment.', icon: 'shield-alert' },
    { title: 'Accounting Treatment Standards', agent: 'Finance', desc: 'Rules for Trading Book vs Banking Book, FVPL.', icon: 'calculator' },
    { title: 'Approved Pricing Models Registry', agent: 'RMG', desc: 'Validated pricing models and expiry dates.', icon: 'bar-chart-2' },
    { title: 'System Booking Schemas', agent: 'Tech & Ops', desc: 'Mapping of products to Murex/Mini/FA typologies.', icon: 'server' }
  ];

  workflowDocs = [
    { title: 'SOP SLA Matrix', desc: 'Turnaround times for different approval paths.', icon: 'clock' },
    { title: 'PIR Playbook', desc: 'Rules for triggering Post-Implementation Reviews.', icon: 'clipboard-check' },
    { title: 'Governance Hierarchy & Escalations', desc: 'Contact mapping for COO Office and PAC.', icon: 'network' }
  ];
}
