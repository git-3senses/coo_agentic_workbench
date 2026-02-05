import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { LayoutService } from '../../../services/layout.service';

@Component({
  selector: 'app-top-bar',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <header class="h-16 w-full bg-[#172733] text-white flex items-center px-0 transition-all duration-300">
      
      <!-- Left: Branding & Toggle Container -->
      <!-- Matches Sidebar Width (w-64 when expanded) or shrinks/adjusts when collapsed -->
      <div class="h-full flex items-center border-r border-[#2a3b4d] transition-all duration-300 px-4"
           [ngClass]="{'w-64 justify-between': !isCollapsed(), 'w-[70px] justify-center': isCollapsed()}">
           
         <!-- Logo -->
         <div class="flex items-center justify-center select-none overflow-hidden h-full py-3" [class.w-full]="isCollapsed()">
             <img *ngIf="!isCollapsed()" src="assets/logos/Expanded_Logo.svg" alt="Mistral AI" class="h-8 max-w-[180px] object-contain">
             <img *ngIf="isCollapsed()" src="assets/logos/Collapsed_Logo.svg" alt="Mistral AI" class="h-8 w-8 object-contain">
        </div>

         <!-- Menu Toggle (Visible ONLY when Expanded) -> Pushed to right by justify-between -->
         <button *ngIf="!isCollapsed()" (click)="toggleSidebar()" class="p-1.5 hover:bg-white/10 rounded transition-colors text-gray-400 hover:text-white fade-in flex-none" title="Collapse Sidebar">
             <lucide-icon name="panel-left" class="w-5 h-5"></lucide-icon>
         </button>
      </div>

      <!-- Right Side: Navigation Helper / Search / SSO -->
      <!-- Flex-1 to take remaining space -->
      <div class="flex-1 flex items-center justify-between px-4">
          
          <!-- Middle: Workspaces (Centered relatively or just left-aligned in remaining space details) -->
          <!-- Re-aligning to match typical behavior, or keeping centered in remaining space? 
               Mistral image shows it top leftish in the content area? 
               Let's keep centered for now as per previous, or maybe move left?
               User didn't complain about workspace placement. -->
          <div class="hidden md:flex items-center gap-4 text-sm text-gray-400">

             <div class="flex items-center gap-2 hover:text-white cursor-pointer transition-colors px-2 py-1 rounded hover:bg-white/5">
                <div class="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center text-[10px] text-white">D</div>
                <span>Default Workspace</span>
                 <lucide-icon name="chevron-down" class="w-3 h-3 ml-1"></lucide-icon>
             </div>
          </div>

          <!-- Right: Search & Profile -->
          <div class="flex items-center gap-3 ml-auto">
            <div class="relative hidden sm:block">
                <lucide-icon name="search" class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500"></lucide-icon>
                <input 
                    type="text" 
                    placeholder="Search" 
                    class="h-8 w-48 bg-[#0b141c] border border-[#2a3b4d] rounded text-xs pl-8 pr-8 text-gray-200 placeholder:text-gray-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                >
                <div class="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-[10px] text-gray-600 font-mono">
                    <span>⌘</span><span>K</span>
                </div>
            </div>
            

          </div>
      </div>
    </header>
  `,
  styles: [`
    .fade-in {
        animation: fadeIn 0.3s ease-in-out;
    }
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
  `]
})
export class TopBarComponent {
  private layoutService = inject(LayoutService);
  isCollapsed = this.layoutService.isSidebarCollapsed;

  toggleSidebar() {
    this.layoutService.toggleSidebar();
  }
}
