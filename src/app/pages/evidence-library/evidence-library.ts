import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedIconsModule } from '../../shared/icons/shared-icons.module';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-evidence-library',
  standalone: true,
  imports: [CommonModule, SharedIconsModule],
  templateUrl: './evidence-library.html',
  styleUrl: './evidence-library.css',
})
export class EvidenceLibraryComponent implements OnInit {
  activeCategory: 'ALL' | 'PRECEDENTS' | 'AUDITS' | 'EXCEPTIONS' = 'ALL';
  private http = inject(HttpClient);

  evidenceItems: any[] = [];
  isLoading = true;

  ngOnInit() {
    this.fetchData();
  }

  fetchData() {
    this.isLoading = true;
    this.http.get<any[]>('/api/evidence').subscribe({
      next: (items) => {
        this.evidenceItems = items.map(d => ({
          ...d,
          id: d.record_id,
          type: d.evidence_type,
          icon: d.icon_name,
          date: d.display_date || (d.event_date ? new Date(d.event_date).toLocaleDateString() : 'N/A'),
          desc: d.description,
          score: d.relevance_score
        }));
        this.isLoading = false;
      },
      error: (err) => {
        console.error('[EvidenceLibrary] Failed to fetch data from database', err);
        this.isLoading = false;
      }
    });
  }

  get filteredItems() {
    if (this.activeCategory === 'ALL') return this.evidenceItems;
    return this.evidenceItems.filter(item => item.type === this.activeCategory);
  }
}
