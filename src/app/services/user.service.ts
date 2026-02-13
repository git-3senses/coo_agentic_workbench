import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export type UserRole =
  | 'MAKER'
  | 'CHECKER'
  | 'APPROVER_RISK'    // RMG-Credit
  | 'APPROVER_MARKET'  // RMG-Market (New)
  | 'APPROVER_FINANCE' // Group Finance
  | 'APPROVER_TAX'     // Group Tax (New)
  | 'APPROVER_LEGAL'   // Legal & Compliance (New)
  | 'APPROVER_OPS'     // T&O-Ops
  | 'APPROVER_TECH'    // T&O-Tech
  | 'COO'              // Final Approval
  | 'ADMIN';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  avatarUrl?: string; // Optional
  email: string;
  department?: string;
  jobTitle?: string;
}

// Map DB department → frontend granular approver role
const DEPARTMENT_ROLE_MAP: Record<string, UserRole> = {
  'RMG-Credit': 'APPROVER_RISK',
  'RMG-Market': 'APPROVER_MARKET',
  'Finance': 'APPROVER_FINANCE',
  'Group Tax': 'APPROVER_TAX',
  'Legal & Compliance': 'APPROVER_LEGAL',
  'Operations': 'APPROVER_OPS',
  'Technology': 'APPROVER_TECH',
  'MLR': 'APPROVER_LEGAL',
  'Product Control': 'CHECKER',
  'COO Office': 'COO',
};

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);

  // --- STATE ---
  private _currentUser = signal<UserProfile>(this.getDefaultUser());
  private _allUsers = signal<UserProfile[]>([]);
  private _loaded = signal(false);

  // Public read-only signals
  currentUser = this._currentUser.asReadonly();
  allUsers = this._allUsers.asReadonly();
  loaded = this._loaded.asReadonly();

  // Derived State (Selectors)
  isMaker = computed(() => this.currentUser().role === 'MAKER');
  isApprover = computed(() => this.currentUser().role.startsWith('APPROVER_'));
  isAdmin = computed(() => this.currentUser().role === 'ADMIN');

  constructor() {
    this.loadUsers();
  }

  // --- ACTIONS ---

  switchRole(role: UserRole) {
    const users = this._allUsers();
    // Find a user matching this role from real DB users
    const match = users.find(u => u.role === role);
    if (match) {
      this._currentUser.set(match);
      console.log(`[UserService] Switched to role: ${role}`, match);
    } else {
      // Fallback: create a synthetic user for this role if no DB user
      this._currentUser.set({ ...this._currentUser(), role });
      console.log(`[UserService] Switched to role: ${role} (no DB user found)`);
    }
  }

  // --- DATA LOADING FROM /api/users ---

  private loadUsers() {
    this.http.get<any[]>('/api/users').subscribe({
      next: (dbUsers) => {
        const mapped: UserProfile[] = dbUsers.map(u => ({
          id: u.id,
          name: u.display_name || u.full_name,
          email: u.email,
          role: this.mapDbRole(u.role, u.department),
          department: u.department,
          jobTitle: u.job_title,
        }));

        this._allUsers.set(mapped);
        this._loaded.set(true);

        // Set initial current user to first MAKER from DB
        const maker = mapped.find(u => u.role === 'MAKER');
        if (maker) {
          this._currentUser.set(maker);
        }

        console.log(`[UserService] Loaded ${mapped.length} users from DB`);
      },
      error: (err) => {
        console.warn('[UserService] Failed to load users from API, using fallback', err);
        // Keep default user as fallback — service still works offline
      }
    });
  }

  /**
   * Map DB role + department to frontend granular role
   * DB has: MAKER, CHECKER, APPROVER, COO, ADMIN
   * Frontend needs: APPROVER_RISK, APPROVER_FINANCE, etc.
   */
  private mapDbRole(dbRole: string, department: string): UserRole {
    if (dbRole === 'MAKER') return 'MAKER';
    if (dbRole === 'CHECKER') return 'CHECKER';
    if (dbRole === 'COO') return 'COO';
    if (dbRole === 'ADMIN') return 'ADMIN';
    if (dbRole === 'APPROVER') {
      return DEPARTMENT_ROLE_MAP[department] || 'APPROVER_RISK';
    }
    return 'MAKER'; // default
  }

  private getDefaultUser(): UserProfile {
    return { id: 'USR-001', name: 'Sarah Lim', role: 'MAKER', email: 'sarah.lim@dbs.com' };
  }
}
