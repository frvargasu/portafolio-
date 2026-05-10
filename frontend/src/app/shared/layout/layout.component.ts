import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/services/auth.service';

interface NavItem {
  icon: string;
  label: string;
  route: string;
  adminOnly?: boolean;
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatIconModule,
    MatButtonModule
  ],
  template: `
    <div class="app-container">

      <!-- Mobile top bar -->
      <header class="mobile-topbar">
        <button class="hamburger-btn" (click)="toggleMobileMenu()">
          <mat-icon>{{ mobileMenuOpen() ? 'close' : 'menu' }}</mat-icon>
        </button>
        <div class="mobile-logo">
          <mat-icon>settings</mat-icon>
          <span>Inventario</span>
        </div>
        <div class="mobile-avatar">
          {{ authService.currentUser()?.nombre?.charAt(0) || 'A' }}
        </div>
      </header>

      <!-- Overlay for mobile -->
      <div class="mobile-overlay" [class.visible]="mobileMenuOpen()" (click)="closeMobileMenu()"></div>

      <!-- Sidebar -->
      <aside class="sidebar" [class.collapsed]="!sidenavOpened()" [class.mobile-open]="mobileMenuOpen()">
        <div class="sidebar-header">
          <div class="logo">
            <mat-icon>settings</mat-icon>
            @if (sidenavOpened()) {
              <span class="logo-text">Inventario</span>
            }
          </div>
          <button class="toggle-btn" (click)="toggleSidenav()">
            <mat-icon>{{ sidenavOpened() ? 'chevron_left' : 'chevron_right' }}</mat-icon>
          </button>
        </div>

        <nav class="nav-menu">
          @for (item of navItems; track item.route) {
            @if (!item.adminOnly || authService.isAdmin()) {
            <a 
              class="nav-item" 
              [routerLink]="item.route" 
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: item.route === '/dashboard' }"
              (click)="closeMobileMenu()">
              <mat-icon>{{ item.icon }}</mat-icon>
              @if (sidenavOpened()) {
                <span>{{ item.label }}</span>
              }
            </a>
            }
          }
        </nav>

        <div class="sidebar-footer">
          <div class="user-info">
            <div class="user-avatar">
              {{ authService.currentUser()?.nombre?.charAt(0) || 'A' }}
            </div>
            @if (sidenavOpened()) {
              <div class="user-details">
                <span class="user-name">{{ authService.currentUser()?.nombre || 'Usuario' }}</span>
                <span class="user-role">{{ authService.currentUser()?.rol || 'Admin' }}</span>
              </div>
            }
          </div>
          <button class="logout-btn" (click)="logout()">
            <mat-icon>logout</mat-icon>
            @if (sidenavOpened()) {
              <span>Salir</span>
            }
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .app-container {
      display: flex;
      height: 100vh;
      background: #f8fafc;
    }

    .sidebar {
      width: 200px;
      background: linear-gradient(180deg, #1e1b4b 0%, #312e81 100%);
      display: flex;
      flex-direction: column;
      transition: width 0.3s ease;
      overflow: hidden;

      &.collapsed {
        width: 70px;
      }
    }

    .sidebar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 10px;
      color: white;

      mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
      }

      .logo-text {
        font-size: 18px;
        font-weight: 600;
        white-space: nowrap;
      }
    }

    .toggle-btn {
      background: rgba(255, 255, 255, 0.1);
      border: none;
      border-radius: 6px;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: white;
      transition: background 0.2s;

      &:hover {
        background: rgba(255, 255, 255, 0.2);
      }

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }

    .nav-menu {
      flex: 1;
      padding: 16px 8px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      color: rgba(255, 255, 255, 0.7);
      text-decoration: none;
      border-radius: 8px;
      transition: all 0.2s;
      white-space: nowrap;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        flex-shrink: 0;
      }

      span {
        font-size: 14px;
        font-weight: 500;
      }

      &:hover {
        background: rgba(255, 255, 255, 0.1);
        color: white;
      }

      &.active {
        background: linear-gradient(135deg, #818cf8 0%, #a78bfa 100%);
        color: white;
        box-shadow: 0 4px 12px rgba(129, 140, 248, 0.4);
      }
    }

    .sidebar-footer {
      padding: 16px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }

    .user-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 14px;
      flex-shrink: 0;
    }

    .user-details {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .user-name {
      color: white;
      font-size: 14px;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-role {
      color: rgba(255, 255, 255, 0.6);
      font-size: 12px;
    }

    .logout-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      padding: 10px;
      background: rgba(239, 68, 68, 0.2);
      border: none;
      border-radius: 8px;
      color: #fca5a5;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 14px;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      &:hover {
        background: rgba(239, 68, 68, 0.3);
        color: #fecaca;
      }
    }

    .main-content {
      flex: 1;
      overflow-y: auto;
      padding: 24px;
    }

    .sidebar.collapsed {
      .nav-item {
        justify-content: center;
        padding: 12px;
      }

      .user-info {
        justify-content: center;
      }

      .logout-btn {
        padding: 10px;
      }
    }

    /* ── Mobile top bar ── */
    .mobile-topbar {
      display: none;
    }

    /* ── Mobile overlay ── */
    .mobile-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 999;
      &.visible {
        display: block;
      }
    }

    @media (max-width: 768px) {
      .app-container {
        flex-direction: column;
      }

      /* Top bar */
      .mobile-topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 16px;
        height: 56px;
        background: linear-gradient(90deg, #1e1b4b 0%, #312e81 100%);
        position: sticky;
        top: 0;
        z-index: 998;
        flex-shrink: 0;
      }

      .hamburger-btn {
        background: rgba(255, 255, 255, 0.1);
        border: none;
        border-radius: 8px;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: white;
        transition: background 0.2s;
        &:hover { background: rgba(255, 255, 255, 0.2); }
        mat-icon { font-size: 22px; width: 22px; height: 22px; }
      }

      .mobile-logo {
        display: flex;
        align-items: center;
        gap: 8px;
        color: white;
        font-size: 18px;
        font-weight: 600;
        mat-icon { font-size: 22px; width: 22px; height: 22px; }
      }

      .mobile-avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 600;
        font-size: 14px;
      }

      /* Sidebar as overlay drawer */
      .sidebar {
        position: fixed;
        top: 0;
        left: 0;
        height: 100vh;
        width: 260px !important;
        z-index: 1000;
        transform: translateX(-100%);
        transition: transform 0.3s ease;
        box-shadow: 4px 0 24px rgba(0, 0, 0, 0.3);

        &.mobile-open {
          transform: translateX(0);
        }

        /* Always show labels inside mobile drawer */
        .nav-item {
          justify-content: flex-start !important;
          padding: 14px 16px !important;
          gap: 12px;
          span { display: inline !important; }
        }

        .user-info { justify-content: flex-start !important; }

        .logout-btn {
          padding: 12px !important;
          justify-content: center;
          gap: 8px;
          span { display: inline !important; }
        }

        /* Keep toggle btn hidden on mobile */
        .toggle-btn { display: none; }

        /* Always show logo text */
        .logo-text { display: inline !important; }
      }

      .main-content {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        height: calc(100vh - 56px);
      }
    }
  `]
})
export class LayoutComponent {
  sidenavOpened = signal(true);
  mobileMenuOpen = signal(false);

  navItems: NavItem[] = [
    { icon: 'dashboard', label: 'Dashboard', route: '/dashboard' },
    { icon: 'inventory', label: 'Productos', route: '/productos' },
    { icon: 'category', label: 'Categorías', route: '/categorias' },
    { icon: 'local_shipping', label: 'Proveedores', route: '/proveedores' },
    { icon: 'attach_money', label: 'Ventas', route: '/ventas' },
    { icon: 'point_of_sale', label: 'Nueva Venta', route: '/pos' },
    { icon: 'manage_accounts', label: 'Usuarios', route: '/usuarios', adminOnly: true },
    { icon: 'lock', label: 'Mi contraseña', route: '/usuarios/cambiar-password' }
  ];

  constructor(public authService: AuthService) {}

  toggleSidenav(): void {
    this.sidenavOpened.set(!this.sidenavOpened());
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.set(!this.mobileMenuOpen());
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  logout(): void {
    this.authService.logout();
  }
}
