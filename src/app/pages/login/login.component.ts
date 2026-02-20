import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

interface UserOption {
    id: string;
    full_name: string;
    role: string;
    department: string;
    email: string;
}

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule],
    template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4 font-sans">
      <div class="w-full max-w-md">

        <!-- Logo + Title -->
        <div class="text-center mb-8">
          <div class="w-16 h-16 bg-dbs-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-600/30">
            <lucide-icon name="shield-check" class="w-8 h-8 text-white"></lucide-icon>
          </div>
          <h1 class="text-2xl font-bold text-white tracking-tight">COO Agentic Workbench</h1>
          <p class="text-sm text-blue-200/60 mt-1">NPA Multi-Agent Command Center</p>
        </div>

        <!-- Login Card -->
        <div class="bg-white rounded-2xl shadow-2xl p-8">
          <h2 class="text-lg font-bold text-slate-900 mb-1">Sign In</h2>
          <p class="text-sm text-slate-500 mb-6">Select your role to continue</p>

          <!-- User List -->
          <div class="space-y-2 max-h-72 overflow-y-auto pr-1">
            <button *ngFor="let user of users"
                    (click)="selectUser(user)"
                    class="w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left"
                    [ngClass]="selectedUser?.id === user.id
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'">
              <div class="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold"
                   [ngClass]="{
                     'bg-emerald-100 text-emerald-700': user.role === 'MAKER',
                     'bg-amber-100 text-amber-700': user.role === 'CHECKER',
                     'bg-blue-100 text-blue-700': user.role === 'APPROVER',
                     'bg-purple-100 text-purple-700': user.role === 'COO',
                     'bg-red-100 text-red-700': user.role === 'ADMIN'
                   }">
                {{ getInitials(user.full_name) }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-semibold text-slate-900 truncate">{{ user.full_name }}</div>
                <div class="text-xs text-slate-500 truncate">{{ user.department }} &middot; {{ user.role }}</div>
              </div>
              <lucide-icon *ngIf="selectedUser?.id === user.id" name="check-circle" class="w-5 h-5 text-blue-600 flex-none"></lucide-icon>
            </button>
          </div>

          <!-- Login Button -->
          <button (click)="login()"
                  [disabled]="!selectedUser || loading"
                  class="w-full mt-6 px-4 py-3 bg-dbs-primary text-white rounded-xl font-semibold text-sm hover:bg-dbs-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            <lucide-icon *ngIf="loading" name="loader-2" class="w-4 h-4 animate-spin"></lucide-icon>
            {{ loading ? 'Signing in...' : 'Sign In as ' + (selectedUser?.full_name || '...') }}
          </button>

          <div *ngIf="error" class="mt-3 text-sm text-red-600 text-center">{{ error }}</div>
        </div>

        <p class="text-center text-xs text-blue-200/40 mt-6">Demo Mode &mdash; No password required</p>
      </div>
    </div>
    `,
    styles: [`:host { display: block; }`]
})
export class LoginComponent implements OnInit {
    private http = inject(HttpClient);
    private auth = inject(AuthService);
    private router = inject(Router);

    users: UserOption[] = [];
    selectedUser: UserOption | null = null;
    loading = false;
    error = '';

    ngOnInit() {
        if (this.auth.isLoggedIn) {
            this.router.navigate(['/']);
            return;
        }
        this.http.get<UserOption[]>('/api/users').subscribe({
            next: (users) => this.users = users,
            error: () => this.users = []
        });
    }

    getInitials(name: string): string {
        return name.split(' ').map(n => n.charAt(0)).join('').slice(0, 2);
    }

    selectUser(user: UserOption) {
        this.selectedUser = user;
        this.error = '';
    }

    login() {
        if (!this.selectedUser) return;
        this.loading = true;
        this.error = '';
        this.auth.login(this.selectedUser.id).subscribe({
            next: () => {
                this.loading = false;
                this.router.navigate(['/']);
            },
            error: (err) => {
                this.loading = false;
                this.error = err.error?.error || 'Login failed';
            }
        });
    }
}
