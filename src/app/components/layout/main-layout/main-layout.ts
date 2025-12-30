import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { AppSidebarComponent } from '../app-sidebar/app-sidebar';
import { TopBarComponent } from '../top-bar/top-bar';
import { LayoutService } from '../../../services/layout.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, AppSidebarComponent, TopBarComponent],
  template: `
    <!-- Root Container: Dark background to match Header, creating the 'gap' effect for rounded corners -->
    <div class="h-screen flex flex-col bg-[#0e0e0e] overflow-hidden">
      <!-- Header (Full Width) -->
      <app-top-bar class="w-full h-16 z-50 flex-none relative"></app-top-bar>
      
      <!-- Body (Sidebar + Content) -->
      <div class="flex-1 flex flex-row overflow-hidden relative">
        <!-- Sidebar -->
        <!-- 'rounded-tl-2xl': Round Top-Left corner only -->
        <!-- 'overflow-hidden': Ensure content fits curve -->
        <!-- 'ml-0': Flush left -->
        <app-app-sidebar 
            *ngIf="isSidebarVisible()"
            class="flex-none h-full border-r border-border/40 transition-all duration-300 ease-in-out bg-[#f9f9f9] rounded-tl-2xl overflow-hidden"
            [ngClass]="{'w-64': !isCollapsed(), 'w-[70px]': isCollapsed()}">
        </app-app-sidebar>
        
        <!-- Content Area -->
        <!-- 'rounded-tr-2xl': Round Top-Right corner only -->
        <!-- 'overflow-hidden': Clip content -->
        <main class="flex-1 min-w-0 bg-background relative overflow-auto rounded-tr-2xl overflow-hidden bg-white">
             <!-- Note: Added bg-white to main to ensure it has a background distinct from the dark root -->
             <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: []
})
export class MainLayoutComponent {
  private layoutService = inject(LayoutService);
  isCollapsed = this.layoutService.isSidebarCollapsed;
  isSidebarVisible = this.layoutService.isSidebarVisible;
}
