import { Injectable, signal } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class LayoutService {
    isSidebarCollapsed = signal(false);
    isSidebarVisible = signal(true);

    toggleSidebar() {
        this.isSidebarCollapsed.update(v => !v);
    }

    setSidebarState(collapsed: boolean) {
        this.isSidebarCollapsed.set(collapsed);
    }

    setSidebarVisible(visible: boolean) {
        this.isSidebarVisible.set(visible);
    }
}
