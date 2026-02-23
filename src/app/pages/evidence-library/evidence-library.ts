import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedIconsModule } from '../../shared/icons/shared-icons.module';

@Component({
  selector: 'app-evidence-library',
  standalone: true,
  imports: [CommonModule, SharedIconsModule],
  templateUrl: './evidence-library.html',
  styleUrl: './evidence-library.css',
})
export class EvidenceLibraryComponent {
  activeCategory: 'ALL' | 'PRECEDENTS' | 'AUDITS' | 'EXCEPTIONS' = 'ALL';

  evidenceItems = [
    { id: 'TSG1917', title: 'Exchange-Listed IR Options', date: '12 Nov 2025', type: 'PRECEDENTS', score: 99, status: 'APPROVED', desc: 'US Exchange-listed Interest Rate Futures and Options. Grandfathered product with T&M HK precedent. Track: No NPA Required. Model validation already completed.', icon: 'git-commit' },
    { id: 'TSG2042', title: 'NAFMII Repo Agreement', date: '04 Oct 2025', type: 'PRECEDENTS', score: 85, status: 'APPROVED', desc: 'Pledged Bond Repo in CIBM. Classification: NTG. Cross-border settlement via DBS China. Track: Full NPA.', icon: 'git-commit' },
    { id: 'TSG2055', title: 'Nikko AM-ICBC SG China Bond ETF', date: '19 Sep 2025', type: 'PRECEDENTS', score: 78, status: 'REJECTED', desc: 'Nikko AM-ICBC SG China Bond ETF subscription. Classification: Deal-specific. Requires individual deal approval rather than standing NPA.', icon: 'git-commit' },
    { id: 'TSG2339', title: 'Swap Connect Platform', date: '05 Aug 2025', type: 'PRECEDENTS', score: 92, status: 'APPROVED', desc: 'Interest Rate Swaps via Swap Connect platform (cross-border HK ↔ China). ISDA with novation to HKEx OTC Clear. Track: Full NPA.', icon: 'git-commit' },
    { id: 'TSG2543', title: 'Multi-Asset Complex Structured Product', date: '22 Jul 2025', type: 'PRECEDENTS', score: 65, status: 'REJECTED', desc: 'Complex structured product across multiple asset classes. Triggered multiple SOP reviews; rejected due to prolonged clearance timelines.', icon: 'git-commit' },
    { id: 'AUD-2026-041', title: 'Q1 Regulatory Submission Log', date: '01 Mar 2026', type: 'AUDITS', score: null, status: 'SEALED', desc: 'Immutable log of MAS 656 regulatory checks performed by the Compliance Agent.', icon: 'shield-check' },
    { id: 'EXC-091A', title: 'Evergreen Cap Override - FX Forwards', date: '28 Feb 2026', type: 'EXCEPTIONS', score: null, status: 'GRANTED', desc: 'Temporary lifting of the $500M GFM cap for Q1 hedging demands.', icon: 'alert-circle' },
    { id: 'AUD-2025-992', title: 'Annual Model Validation Sign-offs', date: '31 Dec 2025', type: 'AUDITS', score: null, status: 'SEALED', desc: 'RMG validation certificates for 32 active pricing models.', icon: 'shield-check' }
  ];

  get filteredItems() {
    if (this.activeCategory === 'ALL') return this.evidenceItems;
    return this.evidenceItems.filter(item => item.type === this.activeCategory);
  }
}
