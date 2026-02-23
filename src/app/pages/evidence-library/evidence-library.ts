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
    { id: 'TSG1917', title: 'Cross-Border Callable Bull/Bear Contract (CBBC)', date: '12 Nov 2025', type: 'PRECEDENTS', score: 94, status: 'APPROVED', desc: 'Highly similar structure to the current CBBC proposal. Booked in SG with HK entity.', icon: 'git-commit' },
    { id: 'TSG1823', title: 'Structured Note linked to Crypto Basket', date: '04 Aug 2025', type: 'PRECEDENTS', score: 88, status: 'REJECTED', desc: 'Rejected by RMG due to insufficient historical volatility data on underlying basket.', icon: 'git-commit' },
    { id: 'AUD-2026-041', title: 'Q1 Regulatory Submission Log', date: '01 Mar 2026', type: 'AUDITS', score: null, status: 'SEALED', desc: 'Immutable log of MAS 656 regulatory checks performed by the Compliance Agent.', icon: 'shield-check' },
    { id: 'EXC-091A', title: 'Evergreen Cap Override - FX Forwards', date: '28 Feb 2026', type: 'EXCEPTIONS', score: null, status: 'GRANTED', desc: 'Temporary lifting of the $500M GFM cap for Q1 hedging demands.', icon: 'alert-circle' },
    { id: 'TSG1750', title: 'Vanilla IRS - Extinguishment Swap', date: '15 Jan 2025', type: 'PRECEDENTS', score: 72, status: 'APPROVED', desc: 'Standard structure used for early termination requests.', icon: 'git-commit' },
    { id: 'AUD-2025-992', title: 'Annual Model Validation Sign-offs', date: '31 Dec 2025', type: 'AUDITS', score: null, status: 'SEALED', desc: 'RMG validation certificates for 32 active pricing models.', icon: 'shield-check' }
  ];

  get filteredItems() {
    if (this.activeCategory === 'ALL') return this.evidenceItems;
    return this.evidenceItems.filter(item => item.type === this.activeCategory);
  }
}
