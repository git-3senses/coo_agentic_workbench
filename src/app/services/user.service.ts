import { Injectable, signal, computed } from '@angular/core';

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
}

@Injectable({
  providedIn: 'root'
})
export class UserService {

  // --- STATE ---

  // We strive to use Signals for modern Angular state management
  private _currentUser = signal<UserProfile>(this.getInitialUser());

  // Public read-only signal
  currentUser = this._currentUser.asReadonly();

  // Derived State (Selectors)
  isMaker = computed(() => this.currentUser().role === 'MAKER');
  isApprover = computed(() => this.currentUser().role.startsWith('APPROVER_'));
  isAdmin = computed(() => this.currentUser().role === 'ADMIN');


  // --- ACTIONS ---

  switchRole(role: UserRole) {
    // Mock User Switching for Demo Purpose
    const user = this.getMockUserForRole(role);
    this._currentUser.set(user);
    console.log(`Switched to role: ${role}`, user);
  }

  // --- HELPERS ---

  private getInitialUser(): UserProfile {
    return this.getMockUserForRole('MAKER'); // Default start as Maker
  }

  private getMockUserForRole(role: UserRole): UserProfile {
    switch (role) {
      case 'MAKER': return { id: 'u1', name: 'Sarah Jenkins', role: 'MAKER', email: 'sarah.j@dbs.com' };
      case 'CHECKER': return { id: 'u2', name: 'Rajiv Kumar', role: 'CHECKER', email: 'rajiv.k@dbs.com' };

      // Functional Approvers
      case 'APPROVER_RISK': return { id: 'u3', name: 'David Lee', role: 'APPROVER_RISK', email: 'david.lee@dbs.com' };
      case 'APPROVER_MARKET': return { id: 'u3b', name: 'Lisa Wong', role: 'APPROVER_MARKET', email: 'lisa.w@dbs.com' };
      case 'APPROVER_FINANCE': return { id: 'u4', name: 'Amanda Low', role: 'APPROVER_FINANCE', email: 'amanda.l@dbs.com' };
      case 'APPROVER_TAX': return { id: 'u4b', name: 'Simon Tan', role: 'APPROVER_TAX', email: 'simon.t@dbs.com' };
      case 'APPROVER_LEGAL': return { id: 'u5b', name: 'James Tan', role: 'APPROVER_LEGAL', email: 'james.t@dbs.com' };
      case 'APPROVER_OPS': return { id: 'u5', name: 'Raj Patel', role: 'APPROVER_OPS', email: 'raj.p@dbs.com' };
      case 'APPROVER_TECH': return { id: 'u6', name: 'Mei Lin', role: 'APPROVER_TECH', email: 'mei.l@dbs.com' };

      case 'COO': return { id: 'u7', name: 'Vikramaditya', role: 'COO', email: 'vikram@dbs.com' };
      case 'ADMIN': return { id: 'u0', name: 'Admin User', role: 'ADMIN', email: 'admin@dbs.com' };
      default: return { id: 'u1', name: 'Sarah Jenkins', role: 'MAKER', email: 'sarah.j@dbs.com' };
    }
  }
}
