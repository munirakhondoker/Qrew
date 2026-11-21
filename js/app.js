/**
 * Qrew - Multi-Tenant Workspace Router & Controller
 * Supports 3 Isolated Workspace Levels:
 * 1. Platform (Global Platform Governance)
 * 2. Tenant Workspace (Organization Namespace)
 * 3. Office Workspace (Physical Branch Workplace)
 */

document.addEventListener('DOMContentLoaded', () => {
  // Application State
  const AppState = {
    activeWorkspace: 'platform', // 'platform' | 'tenant' | 'office' | 'office-config' | 'department' | 'member'
    currentRoute: 'platform/overview',
    currentView: 'overview',
    routeParams: {},
    sidebarCollapsed: false,
    selectedRoleLevel: 'platform',
    selectedRoleId: 'role_plt_owner',
    currentTenantId: 'ten_sst',
    currentOfficeId: 'off_ctg_port',
    currentDeptId: 'dept_ctg_ops',
    currentMemberId: 'usr_nusrat'
  };

  // Tenant Domain Helper
  const getTenantDomain = (tenantId) => {
    const targetId = (!tenantId || tenantId === 'ten_ctg') ? (AppState.currentTenantId || 'ten_sst') : tenantId;
    const tenant = (typeof QrewStore !== 'undefined' && QrewStore.getTenantById) ? (QrewStore.getTenantById(targetId) || QrewStore.getTenants()[0]) : null;
    if (tenant && tenant.domain) return tenant.domain;
    return 'sst.com';
  };

  // DOM Elements
  const DOM = {
    mainContent: document.getElementById('main-content'),
    breadcrumbs: document.getElementById('breadcrumbs'),
    sidebar: document.getElementById('sidebar'),
    sidebarHeader: document.getElementById('sidebar-header'),
    sidebarBrandLogo: document.getElementById('sidebar-brand-logo'),
    sidebarBrandName: document.getElementById('sidebar-brand-name'),
    sidebarBrandBadge: document.getElementById('sidebar-brand-badge'),
    sidebarContextPicker: document.getElementById('sidebar-context-picker'),
    sidebarContextLabel: document.getElementById('sidebar-context-label'),
    sidebarContextSelect: document.getElementById('sidebar-context-select'),
    sidebarNav: document.getElementById('sidebar-nav'),
    sidebarToggle: document.getElementById('sidebar-toggle-btn'),
    mobileMenuBtn: document.getElementById('mobile-menu-btn'),
    wsTabs: document.getElementById('workspace-tabs'),
    wsTabPlatform: document.getElementById('ws-tab-platform'),
    wsTabTenant: document.getElementById('ws-tab-tenant'),
    wsTabOffice: document.getElementById('ws-tab-office'),
    wsTabConfig: document.getElementById('ws-tab-config'),
    wsTabDepartment: document.getElementById('ws-tab-department'),
    wsTabMember: document.getElementById('ws-tab-member'),
    userDropdownTrigger: document.getElementById('user-profile-trigger'),
    userDropdownMenu: document.getElementById('user-dropdown-menu'),
    notificationsTrigger: document.getElementById('notifications-trigger'),
    notificationsPopover: document.getElementById('notifications-popover')
  };

  // ==========================================
  // Router & Route Parsing
  // ==========================================
  const parseHash = () => {
    const rawHash = window.location.hash.slice(1) || 'landing';
    const [pathPart, queryString] = rawHash.split('?');
    const params = {};

    if (queryString) {
      const searchParams = new URLSearchParams(queryString);
      for (const [key, value] of searchParams.entries()) {
        params[key] = value;
      }
    }

    if (pathPart === 'landing' || pathPart === '') {
      return { workspace: 'landing', view: 'landing', path: 'landing', params };
    }

    if (pathPart === 'tenant-landing' || pathPart.startsWith('tenant-landing/')) {
      return { workspace: 'tenant-landing', view: 'landing', path: 'tenant-landing', params };
    }

    let workspace = 'platform';
    let view = 'overview';

    // Normalize legacy & new paths
    if (pathPart === 'super-admin' || pathPart.startsWith('super-admin/')) {
      workspace = 'super-admin';
      if (pathPart.startsWith('super-admin/')) {
        view = pathPart.replace('super-admin/', '') || 'permission-catalog';
      } else {
        view = 'permission-catalog';
      }
    } else if (pathPart === 'office-config' || pathPart.startsWith('office-config/')) {
      workspace = 'office-config';
      if (pathPart.startsWith('office-config/')) {
        view = pathPart.replace('office-config/', '') || 'invoice-templates';
      } else {
        view = 'invoice-templates';
      }
    } else if (pathPart === 'department' || pathPart.startsWith('department/')) {
      workspace = 'department';
      if (pathPart.startsWith('department/')) {
        view = pathPart.replace('department/', '') || 'overview';
      } else {
        view = 'overview';
      }
    } else if (pathPart === 'member' || pathPart.startsWith('member/')) {
      workspace = 'member';
      if (pathPart.startsWith('member/')) {
        view = pathPart.replace('member/', '') || 'overview';
      } else {
        view = 'overview';
      }
    } else if (pathPart.startsWith('tenant/') || pathPart === 'tenant-details' || pathPart === 'tenant-overview' || pathPart === 'tenant-offices' || pathPart === 'tenant-members' || pathPart === 'tenant-roles' || pathPart === 'tenant-settings' || pathPart === 'tenant') {
      workspace = 'tenant';
      if (pathPart.startsWith('tenant/')) {
        view = pathPart.replace('tenant/', '') || 'overview';
      } else if (pathPart === 'tenant-details' || pathPart === 'tenant-overview') {
        view = 'overview';
      } else if (pathPart === 'tenant-offices') {
        view = 'offices';
      } else if (pathPart === 'tenant-members') {
        view = 'members';
      } else if (pathPart === 'tenant-roles') {
        view = 'roles';
      } else if (pathPart === 'tenant-settings') {
        view = 'settings';
      } else {
        view = 'overview';
      }
    } else if (pathPart.startsWith('office-admin/') || pathPart === 'office-admin' || pathPart === 'office-admin-overview' || pathPart === 'office-admin-staff' || pathPart === 'office-admin-departments' || pathPart === 'office-admin-roles' || pathPart === 'office-admin-activity' || pathPart === 'office-admin-invoice' || pathPart === 'office-admin-staffs-management') {
      workspace = 'office-admin';
      if (pathPart.startsWith('office-admin/')) {
        view = pathPart.replace('office-admin/', '') || 'overview';
      } else if (pathPart === 'office-admin-staff' || pathPart === 'office-admin-staffs-management') {
        view = 'staffs-management';
      } else if (pathPart === 'office-admin-invoice') {
        view = 'invoice';
      } else {
        view = 'overview';
      }
    } else if (pathPart.startsWith('office/') || pathPart === 'office-details' || pathPart === 'office-overview' || pathPart === 'office-staff' || pathPart === 'office-roles' || pathPart === 'office-activity' || pathPart === 'office-departments' || pathPart === 'office' || pathPart === 'office-dashboard' || pathPart === 'office-clients' || pathPart === 'office-files' || pathPart === 'office-financials' || pathPart === 'office-staffs') {
      workspace = 'office';
      if (pathPart.startsWith('office/')) {
        view = pathPart.replace('office/', '') || 'dashboard';
      } else if (pathPart === 'office-clients') {
        view = 'clients';
      } else if (pathPart === 'office-files') {
        view = 'files';
      } else if (pathPart === 'office-financials') {
        view = 'financials';
      } else if (pathPart === 'office-staffs' || pathPart === 'office-staff') {
        view = 'staffs';
      } else {
        view = 'dashboard';
      }
    } else {
      workspace = 'platform';
      if (pathPart.startsWith('platform/')) {
        view = pathPart.replace('platform/', '') || 'overview';
      } else if (pathPart === 'tenants') {
        view = 'tenants';
      } else if (pathPart === 'platform-users' || pathPart === 'platform-access') {
        view = 'platform-access';
      } else if (pathPart === 'roles-permissions' || pathPart === 'platform-roles' || pathPart === 'permission-access') {
        view = 'permission-access';
      } else if (pathPart === 'template-defaults' || pathPart === 'templates-defaults') {
        view = 'template-defaults';
      } else if (pathPart === 'plans-entitlements') {
        view = 'plans-entitlements';
      } else if (pathPart === 'usage-analytics') {
        view = 'usage-analytics';
      } else if (pathPart === 'audit-logs' || pathPart === 'audit-log') {
        view = 'audit-log';
      } else if (pathPart === 'support-access') {
        view = 'support-access';
      } else if (pathPart === 'system-health') {
        view = 'system-health';
      } else if (pathPart === 'platform-settings') {
        view = 'platform-settings';
      } else {
        view = 'overview';
      }
    }

    return { workspace, view, path: pathPart, params };
  };

  // ==========================================
  // Six Dashboard Color Identity System
  // Centralized theme configuration tokens
  // ==========================================
  const PANEL_THEMES = {
    'platform': {
      name: 'Platform Admin Panel',
      primaryAccent: '#9E5334',
      lightAccent: '#F5EAE4',
      hoverAccent: '#EBD8CD'
    },
    'super-admin': {
      name: 'Super Admin',
      primaryAccent: '#713B2B',
      lightAccent: '#F2E7E1',
      hoverAccent: '#E3CEBF'
    },
    'tenant': {
      name: 'Tenant Workspace',
      primaryAccent: '#B77942',
      lightAccent: '#F8EFE3',
      hoverAccent: '#EEDCC8'
    },
    'office': {
      name: 'Office Workspace',
      primaryAccent: '#65734B',
      lightAccent: '#EEF0E5',
      hoverAccent: '#D8DDC7'
    },
    'office-admin': {
      name: 'Office Admin Panel',
      primaryAccent: '#A34F43',
      lightAccent: '#F6E9E6',
      hoverAccent: '#EBCBCA'
    },
    'office-config': {
      name: 'Office Config',
      primaryAccent: '#78618A',
      lightAccent: '#F0EBF4',
      hoverAccent: '#DFD3EB'
    }
  };

  const applyPanelTheme = (workspace) => {
    const theme = PANEL_THEMES[workspace] || PANEL_THEMES['platform'];
    document.body.setAttribute('data-workspace', workspace);
    // Remove previous ws-* classes and add current one
    document.body.classList.remove('ws-platform', 'ws-super-admin', 'ws-tenant', 'ws-office', 'ws-office-admin', 'ws-office-config');
    document.body.classList.add(`ws-${workspace}`);

    // Centralized CSS variable application for real-time reactivity without reload
    document.documentElement.style.setProperty('--panel-accent', theme.primaryAccent);
    document.documentElement.style.setProperty('--panel-accent-light', theme.lightAccent);
    document.documentElement.style.setProperty('--panel-accent-hover', theme.hoverAccent);
  };

  const navigateTo = (hash) => {
    window.location.hash = hash.startsWith('#') ? hash : '#' + hash;
  };

  const handleRouteChange = () => {
    const route = parseHash();
    AppState.activeWorkspace = route.workspace;
    AppState.currentView = route.view;
    AppState.currentRoute = route.path;
    AppState.routeParams = route.params;

    // Apply dashboard-specific color identity
    applyPanelTheme(route.workspace);

    if (route.workspace === 'landing' || route.workspace === 'tenant-landing') {
      document.body.classList.add('landing-mode');
      if (route.params.id) {
        AppState.currentTenantId = route.params.id;
      }
      dispatchView();
      return;
    } else {
      document.body.classList.remove('landing-mode');
    }

    // Update active IDs if present in params
    if (route.params.id) {
      AppState.currentTenantId = route.params.id;
    }
    if (route.params.tenantId) {
      AppState.currentTenantId = route.params.tenantId;
    }
    if (route.params.officeId) {
      AppState.currentOfficeId = route.params.officeId;
    }
    if (route.params.deptId) {
      AppState.currentDeptId = route.params.deptId;
    }
    if (route.params.userId || route.params.memberId) {
      AppState.currentMemberId = route.params.userId || route.params.memberId;
    }

    // Ensure fallback valid IDs
    const tenants = QrewStore.getTenants();
    if (!AppState.currentTenantId && tenants.length > 0) {
      AppState.currentTenantId = tenants[0].id;
    }
    const currentTenantOffices = QrewStore.getOfficesByTenant(AppState.currentTenantId);
    if ((!AppState.currentOfficeId || !currentTenantOffices.some(o => o.id === AppState.currentOfficeId)) && currentTenantOffices.length > 0) {
      AppState.currentOfficeId = currentTenantOffices[0].id;
    }
    const currentDepts = QrewStore.getDepartments(AppState.currentOfficeId);
    if ((!AppState.currentDeptId || !currentDepts.some(d => d.id === AppState.currentDeptId)) && currentDepts.length > 0) {
      AppState.currentDeptId = currentDepts[0].id;
    }
    if (!AppState.currentMemberId) {
      AppState.currentMemberId = 'usr_nusrat';
    }

    // Update Topbar Workspace Pills
    updateWorkspaceTabsUI();

    // Update Topbar Domain Badge (Platform vs. Tenant Panel)
    updateTopbarDomainBadge();

    // Synchronize Topbar User Profile dynamically based on active workspace/panel
    syncHeaderUserProfile();

    // Re-render Dynamic Navigation Sidebar
    renderSidebar();

    // Synchronize Topbar Landing Button (Platform vs. Tenant Landing)
    syncTopbarLandingBtn();

    // Close mobile drawer on route change
    if (DOM.sidebar.classList.contains('mobile-open')) {
      DOM.sidebar.classList.remove('mobile-open');
    }

    // Dispatch view renderer
    dispatchView();
  };

  // ==========================================
  // Workspace UI & Sidebar Renderers
  // ==========================================

  const updateWorkspaceTabsUI = () => {
    // Topbar Tabs Active State
    if (DOM.wsTabPlatform) DOM.wsTabPlatform.classList.toggle('active', AppState.activeWorkspace === 'platform');
    if (DOM.wsTabTenant) DOM.wsTabTenant.classList.toggle('active', AppState.activeWorkspace === 'tenant');
    if (DOM.wsTabOffice) DOM.wsTabOffice.classList.toggle('active', AppState.activeWorkspace === 'office');
    if (DOM.wsTabConfig) DOM.wsTabConfig.classList.toggle('active', AppState.activeWorkspace === 'office-config');
    if (DOM.wsTabDepartment) DOM.wsTabDepartment.classList.toggle('active', AppState.activeWorkspace === 'department');
    if (DOM.wsTabMember) DOM.wsTabMember.classList.toggle('active', AppState.activeWorkspace === 'member');
  };

  const renderSidebar = () => {
    const ws = AppState.activeWorkspace;
    const view = AppState.currentView;
    const tenant = QrewStore.getTenantById(AppState.currentTenantId) || QrewStore.getTenants()[0];
    const office = QrewStore.getOfficeById(AppState.currentOfficeId) || (tenant ? QrewStore.getOfficesByTenant(tenant.id)[0] : null);

    // 1. Sidebar Header (Brand Monogram & Titles)
    const brandWrapperEl = document.getElementById('brand-wrapper');
    if (ws === 'platform') {
      DOM.sidebarBrandLogo.textContent = 'Q';
      DOM.sidebarBrandLogo.style.backgroundColor = 'var(--panel-accent, var(--color-accent))';
      DOM.sidebarBrandName.textContent = 'Qrew';
      DOM.sidebarBrandBadge.textContent = 'Platform Admin';
      DOM.sidebarContextPicker.style.display = 'none';
      if (brandWrapperEl) brandWrapperEl.title = 'Go to Platform Landing Page (qrew.com)';
    } else if (ws === 'super-admin') {
      DOM.sidebarBrandLogo.textContent = 'Q';
      DOM.sidebarBrandLogo.style.backgroundColor = 'var(--panel-accent, var(--color-accent))';
      DOM.sidebarBrandName.textContent = 'Qrew';
      DOM.sidebarBrandBadge.textContent = 'Super Admin';
      DOM.sidebarContextPicker.style.display = 'none';
      if (brandWrapperEl) brandWrapperEl.title = 'Go to Platform Landing Page (qrew.com)';
    } else if (ws === 'office-config') {
      DOM.sidebarBrandLogo.textContent = '⚙';
      DOM.sidebarBrandLogo.style.backgroundColor = 'var(--panel-accent, var(--color-accent))';
      DOM.sidebarBrandName.textContent = office ? office.name : 'Office Config';
      DOM.sidebarBrandBadge.textContent = 'Configuration Centre';
      if (brandWrapperEl) brandWrapperEl.title = 'Go to Platform Landing Page (qrew.com)';

      DOM.sidebarContextPicker.style.display = 'flex';
      DOM.sidebarContextLabel.textContent = 'Configure Office Branch';
      const allOffices = [];
      QrewStore.getTenants().forEach(t => {
        QrewStore.getOfficesByTenant(t.id).forEach(o => {
          allOffices.push({ ...o, tenantName: t.name });
        });
      });
      DOM.sidebarContextSelect.innerHTML = allOffices.map(o => `
        <option value="${o.id}" ${office && o.id === office.id ? 'selected' : ''}>${QrewUI.escapeHtml(o.name)}</option>
      `).join('');
      DOM.sidebarContextSelect.onchange = (e) => {
        AppState.currentOfficeId = e.target.value;
        const targetOffice = QrewStore.getOfficeById(AppState.currentOfficeId);
        if (targetOffice) AppState.currentTenantId = targetOffice.tenantId;
        navigateTo(`#office-config?tenantId=${AppState.currentTenantId}&officeId=${AppState.currentOfficeId}`);
      };
    } else if (ws === 'department') {
      const dept = QrewStore.getDepartmentById(AppState.currentDeptId) || (office ? QrewStore.getDepartments(office.id)[0] : null) || { name: 'Department', code: 'DEP' };
      DOM.sidebarBrandLogo.textContent = dept.code || 'D';
      DOM.sidebarBrandLogo.style.backgroundColor = 'var(--color-accent)';
      DOM.sidebarBrandName.textContent = dept.name;
      DOM.sidebarBrandBadge.textContent = 'Department Workspace';

      DOM.sidebarContextPicker.style.display = 'flex';
      DOM.sidebarContextLabel.textContent = `Departments (${office ? office.name : ''})`;
      const deptsInOffice = office ? QrewStore.getDepartments(office.id) : [];
      DOM.sidebarContextSelect.innerHTML = deptsInOffice.map(d => `
        <option value="${d.id}" ${d.id === dept.id ? 'selected' : ''}>${QrewUI.escapeHtml(d.name)} [${d.code}]</option>
      `).join('');
      DOM.sidebarContextSelect.onchange = (e) => {
        AppState.currentDeptId = e.target.value;
        navigateTo(`#department/overview?deptId=${AppState.currentDeptId}`);
      };
    } else if (ws === 'member') {
      const memberUser = QrewStore.getUserById(AppState.currentMemberId) || { name: 'Staff Member', email: '', platformRole: 'Staff' };
      DOM.sidebarBrandLogo.textContent = memberUser.name ? memberUser.name.charAt(0).toUpperCase() : 'M';
      DOM.sidebarBrandLogo.style.backgroundColor = 'var(--color-accent)';
      DOM.sidebarBrandName.textContent = memberUser.name;
      DOM.sidebarBrandBadge.textContent = 'Member Workspace';
      DOM.sidebarContextPicker.style.display = 'none';
    } else if (ws === 'tenant') {
      const initial = tenant ? tenant.name.charAt(0).toUpperCase() : 'T';
      DOM.sidebarBrandLogo.textContent = initial;
      DOM.sidebarBrandLogo.style.backgroundColor = 'var(--panel-accent, var(--color-warning))';
      DOM.sidebarBrandName.textContent = tenant ? tenant.name : 'Tenant';
      DOM.sidebarBrandBadge.textContent = 'Tenant Workspace';
      if (brandWrapperEl) brandWrapperEl.title = `Go to ${tenant ? tenant.name : 'Tenant'} Landing Page (${getTenantDomain(AppState.currentTenantId)})`;

      // Tenant Context Picker
      DOM.sidebarContextPicker.style.display = 'flex';
      DOM.sidebarContextLabel.textContent = 'Active Organization';
      const allTenants = QrewStore.getTenants();
      DOM.sidebarContextSelect.innerHTML = allTenants.map(t => `
        <option value="${t.id}" ${t.id === tenant.id ? 'selected' : ''}>${QrewUI.escapeHtml(t.name)}</option>
      `).join('');
      DOM.sidebarContextSelect.onchange = (e) => {
        AppState.currentTenantId = e.target.value;
        const offices = QrewStore.getOfficesByTenant(AppState.currentTenantId);
        if (offices.length > 0) AppState.currentOfficeId = offices[0].id;
        navigateTo(`#tenant/${AppState.currentView}?id=${AppState.currentTenantId}`);
      };
    } else if (ws === 'office') {
      const initial = tenant ? tenant.name.charAt(0).toUpperCase() : 'S';
      DOM.sidebarBrandLogo.textContent = initial;
      DOM.sidebarBrandLogo.style.backgroundColor = 'var(--panel-accent, var(--color-info))';
      DOM.sidebarBrandName.textContent = tenant ? tenant.name : 'SST';
      DOM.sidebarBrandBadge.textContent = office ? office.name : 'Chittagong Port Office';
      if (brandWrapperEl) brandWrapperEl.title = `Go to ${tenant ? tenant.name : 'Tenant'} Landing Page (${getTenantDomain(AppState.currentTenantId)})`;

      // Office Context Picker
      DOM.sidebarContextPicker.style.display = 'flex';
      DOM.sidebarContextLabel.textContent = `Offices (${tenant ? tenant.name : ''})`;
      const officesInTenant = tenant ? QrewStore.getOfficesByTenant(tenant.id) : [];
      DOM.sidebarContextSelect.innerHTML = officesInTenant.length > 0 ? officesInTenant.map(o => `
        <option value="${o.id}" ${office && o.id === office.id ? 'selected' : ''}>${QrewUI.escapeHtml(o.name)}</option>
      `).join('') : '<option disabled selected>No offices created</option>';
      DOM.sidebarContextSelect.onchange = (e) => {
        AppState.currentOfficeId = e.target.value;
        navigateTo(`#office/overview?tenantId=${tenant.id}&officeId=${AppState.currentOfficeId}`);
      };
    } else if (ws === 'office-admin') {
      const initial = tenant ? tenant.name.charAt(0).toUpperCase() : 'S';
      DOM.sidebarBrandLogo.textContent = initial;
      DOM.sidebarBrandLogo.style.backgroundColor = 'var(--panel-accent, var(--color-accent))';
      DOM.sidebarBrandName.textContent = tenant ? tenant.name : 'SST';
      DOM.sidebarBrandBadge.textContent = office ? office.name : 'Chittagong Port Office';
      if (brandWrapperEl) brandWrapperEl.title = `Go to ${tenant ? tenant.name : 'Tenant'} Landing Page (${getTenantDomain(AppState.currentTenantId)})`;

      // Office Context Picker
      DOM.sidebarContextPicker.style.display = 'flex';
      DOM.sidebarContextLabel.textContent = `Branch Admin (${tenant ? tenant.name : ''})`;
      const officesInTenant = tenant ? QrewStore.getOfficesByTenant(tenant.id) : [];
      DOM.sidebarContextSelect.innerHTML = officesInTenant.length > 0 ? officesInTenant.map(o => `
        <option value="${o.id}" ${office && o.id === office.id ? 'selected' : ''}>${QrewUI.escapeHtml(o.name)}</option>
      `).join('') : '<option disabled selected>No offices created</option>';
      DOM.sidebarContextSelect.onchange = (e) => {
        AppState.currentOfficeId = e.target.value;
        navigateTo(`#office-admin/${AppState.currentView || 'overview'}?tenantId=${tenant.id}&officeId=${AppState.currentOfficeId}`);
      };
    }

    // 2. Dynamic Navigation Items for Workspace
    if (ws === 'platform') {
      DOM.sidebarNav.innerHTML = `
        <div class="nav-section">
          <div class="nav-section-title">Platform Admin</div>
          <a class="nav-item ${view === 'overview' ? 'active' : ''}" href="#platform/overview">
            <span class="nav-icon">${QrewUI.getIcon('overview')}</span>
            <span class="nav-label">Overview</span>
          </a>
          <a class="nav-item ${view === 'tenants' ? 'active' : ''}" href="#platform/tenants">
            <span class="nav-icon">${QrewUI.getIcon('tenants')}</span>
            <span class="nav-label">Tenants</span>
          </a>
          <a class="nav-item ${view === 'platform-access' ? 'active' : ''}" href="#platform/platform-access">
            <span class="nav-icon">${QrewUI.getIcon('users')}</span>
            <span class="nav-label">Platform Access</span>
          </a>
          <a class="nav-item ${view === 'permission-access' ? 'active' : ''}" href="#platform/permission-access">
            <span class="nav-icon">${QrewUI.getIcon('shield')}</span>
            <span class="nav-label">Permission Access</span>
          </a>
          <a class="nav-item ${view === 'template-defaults' ? 'active' : ''}" href="#platform/template-defaults">
            <span class="nav-icon">${QrewUI.getIcon('layers')}</span>
            <span class="nav-label">Template & Defaults</span>
          </a>
          <a class="nav-item ${view === 'plans-entitlements' ? 'active' : ''}" href="#platform/plans-entitlements">
            <span class="nav-icon">${QrewUI.getIcon('dollar')}</span>
            <span class="nav-label">Plans and Entitlements</span>
          </a>
          <a class="nav-item ${view === 'usage-analytics' ? 'active' : ''}" href="#platform/usage-analytics">
            <span class="nav-icon">${QrewUI.getIcon('activity')}</span>
            <span class="nav-label">Usage & Analytics</span>
          </a>
          <a class="nav-item ${view === 'audit-log' || view === 'audit-logs' ? 'active' : ''}" href="#platform/audit-log">
            <span class="nav-icon">${QrewUI.getIcon('audit')}</span>
            <span class="nav-label">Audit log</span>
          </a>
          <a class="nav-item ${view === 'support-access' ? 'active' : ''}" href="#platform/support-access">
            <span class="nav-icon">${QrewUI.getIcon('users')}</span>
            <span class="nav-label">Support Access</span>
          </a>
          <a class="nav-item ${view === 'system-health' ? 'active' : ''}" href="#platform/system-health">
            <span class="nav-icon">${QrewUI.getIcon('activity')}</span>
            <span class="nav-label">System Health and Incidents</span>
          </a>
          <a class="nav-item ${view === 'platform-settings' ? 'active' : ''}" href="#platform/platform-settings">
            <span class="nav-icon">${QrewUI.getIcon('settings')}</span>
            <span class="nav-label">Platform settings</span>
          </a>
        </div>
        <div class="nav-section" style="margin-top:16px;">
          <div class="nav-section-title">Super Administration</div>
          <a class="nav-item" href="#super-admin/permission-catalog" style="color:var(--color-accent);font-weight:600;">
            <span class="nav-icon">${QrewUI.getIcon('shield')}</span>
            <span class="nav-label">Super Admin &rarr;</span>
          </a>
        </div>
      `;
    } else if (ws === 'super-admin') {
      DOM.sidebarNav.innerHTML = `
        <div class="nav-section">
          <div class="nav-section-title">Super Admin</div>
          <a class="nav-item ${view === 'permission-catalog' ? 'active' : ''}" href="#super-admin/permission-catalog">
            <span class="nav-icon">${QrewUI.getIcon('shield')}</span>
            <span class="nav-label">Permission Catalog</span>
          </a>
          <a class="nav-item ${view === 'platform-settings' || view === 'platform-setting' ? 'active' : ''}" href="#super-admin/platform-settings">
            <span class="nav-icon">${QrewUI.getIcon('settings')}</span>
            <span class="nav-label">Platform Setting</span>
          </a>
        </div>
        <div class="nav-section" style="margin-top:16px;">
          <a class="nav-item" href="#platform/overview" style="color:var(--color-accent);font-weight:600;">
            <span class="nav-icon">${QrewUI.getIcon('chevronLeft')}</span>
            <span class="nav-label">&larr; Platform Admin</span>
          </a>
        </div>
      `;
    } else if (ws === 'office-config') {
      const tenantId = tenant ? tenant.id : AppState.currentTenantId;
      const officeId = office ? office.id : AppState.currentOfficeId;
      DOM.sidebarNav.innerHTML = `
        <div class="nav-section">
          <div class="nav-section-title">Office Config</div>
          <a class="nav-item ${view === 'invoice-templates' ? 'active' : ''}" href="#office-config/invoice-templates?tenantId=${tenantId}&officeId=${officeId}">
            <span class="nav-icon">${QrewUI.getIcon('invoice')}</span>
            <span class="nav-label">Invoice Templates</span>
          </a>
          <a class="nav-item ${view === 'roles-permissions' || view === 'roles' ? 'active' : ''}" href="#office-config/roles-permissions?tenantId=${tenantId}&officeId=${officeId}">
            <span class="nav-icon">${QrewUI.getIcon('shield')}</span>
            <span class="nav-label">Roles and Permissions</span>
          </a>
          <a class="nav-item ${view === 'customize-fields' ? 'active' : ''}" href="#office-config/customize-fields?tenantId=${tenantId}&officeId=${officeId}">
            <span class="nav-icon">${QrewUI.getIcon('settings')}</span>
            <span class="nav-label">Customize fields</span>
          </a>
          <a class="nav-item ${view === 'plans-entitlements' || view === 'plans' ? 'active' : ''}" href="#office-config/plans-entitlements?tenantId=${tenantId}&officeId=${officeId}">
            <span class="nav-icon">${QrewUI.getIcon('layers')}</span>
            <span class="nav-label">Plans and Entitlement</span>
          </a>
        </div>
        <div class="nav-section" style="margin-top:16px;">
          <div class="nav-section-title">Platform</div>
          <a class="nav-item" href="#landing" style="color:var(--color-accent);font-weight:600;">
            <span class="nav-icon">${QrewUI.getIcon('chevronLeft')}</span>
            <span class="nav-label">&larr; Qrew Landing Page</span>
          </a>
        </div>
      `;
    } else if (ws === 'department') {
      const deptId = AppState.currentDeptId;
      DOM.sidebarNav.innerHTML = `
        <div class="nav-section">
          <div class="nav-section-title">Department Hub</div>
          <a class="nav-item ${view === 'overview' ? 'active' : ''}" href="#department/overview?deptId=${deptId}">
            <span class="nav-icon">${QrewUI.getIcon('overview')}</span>
            <span class="nav-label">Overview & KPIs</span>
          </a>
          <a class="nav-item ${view === 'members' ? 'active' : ''}" href="#department/members?deptId=${deptId}">
            <span class="nav-icon">${QrewUI.getIcon('users')}</span>
            <span class="nav-label">Staff Roster</span>
          </a>
          <a class="nav-item ${view === 'queue' ? 'active' : ''}" href="#department/queue?deptId=${deptId}">
            <span class="nav-icon">${QrewUI.getIcon('audit')}</span>
            <span class="nav-label">Operational Queue</span>
          </a>
        </div>
      `;
    } else if (ws === 'member') {
      const memberUser = QrewStore.getUserById(AppState.currentMemberId) || { id: 'usr_nusrat' };
      DOM.sidebarNav.innerHTML = `
        <div class="nav-section">
          <div class="nav-section-title">My Workspace</div>
          <a class="nav-item active" href="#member/overview?userId=${memberUser.id}">
            <span class="nav-icon">${QrewUI.getIcon('users')}</span>
            <span class="nav-label">Schedule & Tasks</span>
          </a>
        </div>
      `;
    } else if (ws === 'tenant') {
      const tenantId = tenant ? tenant.id : AppState.currentTenantId;
      DOM.sidebarNav.innerHTML = `
        <div class="nav-section">
          <div class="nav-section-title">Tenant Workspace</div>
          <a class="nav-item ${view === 'overview' ? 'active' : ''}" href="#tenant/overview?id=${tenantId}">
            <span class="nav-icon">${QrewUI.getIcon('overview')}</span>
            <span class="nav-label">Overview</span>
          </a>
          <a class="nav-item ${view === 'offices' ? 'active' : ''}" href="#tenant/offices?id=${tenantId}">
            <span class="nav-icon">${QrewUI.getIcon('offices')}</span>
            <span class="nav-label">Offices</span>
          </a>
          <a class="nav-item ${view === 'members' ? 'active' : ''}" href="#tenant/members?id=${tenantId}">
            <span class="nav-icon">${QrewUI.getIcon('users')}</span>
            <span class="nav-label">Members</span>
          </a>
          <a class="nav-item ${view === 'roles' ? 'active' : ''}" href="#tenant/roles?id=${tenantId}">
            <span class="nav-icon">${QrewUI.getIcon('roles')}</span>
            <span class="nav-label">Tenant Roles</span>
          </a>
          <a class="nav-item ${view === 'settings' ? 'active' : ''}" href="#tenant/settings?id=${tenantId}">
            <span class="nav-icon">${QrewUI.getIcon('settings')}</span>
            <span class="nav-label">Settings</span>
          </a>
        </div>
        <div class="nav-section" style="margin-top:16px;">
          <div class="nav-section-title">Platform</div>
          <a class="nav-item" href="#landing" style="color:var(--panel-accent, var(--color-accent));font-weight:600;">
            <span class="nav-icon">${QrewUI.getIcon('chevronLeft')}</span>
            <span class="nav-label">&larr; Qrew Landing Page</span>
          </a>
        </div>
      `;
    } else if (ws === 'office') {
      const tenantId = tenant ? tenant.id : AppState.currentTenantId;
      const officeId = office ? office.id : AppState.currentOfficeId;
      DOM.sidebarNav.innerHTML = `
        <div class="nav-section">
          <div class="nav-section-title">Office</div>
          <a class="nav-item ${view === 'dashboard' || view === 'overview' ? 'active' : ''}" href="#office/dashboard?tenantId=${tenantId}&officeId=${officeId}">
            <span class="nav-icon">${QrewUI.getIcon('overview')}</span>
            <span class="nav-label">Dashboard</span>
          </a>
          <a class="nav-item ${view === 'clients' ? 'active' : ''}" href="#office/clients?tenantId=${tenantId}&officeId=${officeId}">
            <span class="nav-icon">${QrewUI.getIcon('users')}</span>
            <span class="nav-label">Clients</span>
          </a>
          <a class="nav-item ${view === 'files' ? 'active' : ''}" href="#office/files?tenantId=${tenantId}&officeId=${officeId}">
            <span class="nav-icon">${QrewUI.getIcon('file')}</span>
            <span class="nav-label">Files</span>
          </a>
          <a class="nav-item ${view === 'financials' ? 'active' : ''}" href="#office/financials?tenantId=${tenantId}&officeId=${officeId}">
            <span class="nav-icon">${QrewUI.getIcon('dollar')}</span>
            <span class="nav-label">Financials</span>
          </a>
          <a class="nav-item ${view === 'staffs' || view === 'staff' ? 'active' : ''}" href="#office/staffs?tenantId=${tenantId}&officeId=${officeId}">
            <span class="nav-icon">${QrewUI.getIcon('users')}</span>
            <span class="nav-label">Staffs</span>
          </a>
        </div>
        <div class="nav-section" style="margin-top:16px;">
          <div class="nav-section-title">Management</div>
          <a class="nav-item" href="#office-admin/overview?tenantId=${tenantId}&officeId=${officeId}" style="color:var(--color-accent);font-weight:600;">
            <span class="nav-icon">${QrewUI.getIcon('settings')}</span>
            <span class="nav-label">Office Admin Panel &rarr;</span>
          </a>
        </div>
        <div class="nav-section" style="margin-top:16px;">
          <div class="nav-section-title">Platform</div>
          <a class="nav-item" href="#landing" style="color:var(--color-accent);font-weight:600;">
            <span class="nav-icon">${QrewUI.getIcon('chevronLeft')}</span>
            <span class="nav-label">&larr; Qrew Landing Page</span>
          </a>
        </div>
      `;
    } else if (ws === 'office-admin') {
      const tenantId = tenant ? tenant.id : AppState.currentTenantId;
      const officeId = office ? office.id : AppState.currentOfficeId;
      DOM.sidebarNav.innerHTML = `
        <div class="nav-section">
          <div class="nav-section-title">Office Admin</div>
          <a class="nav-item ${view === 'overview' ? 'active' : ''}" href="#office-admin/overview?tenantId=${tenantId}&officeId=${officeId}">
            <span class="nav-icon">${QrewUI.getIcon('overview')}</span>
            <span class="nav-label">Overview</span>
          </a>
          <a class="nav-item ${view === 'invoice' ? 'active' : ''}" href="#office-admin/invoice?tenantId=${tenantId}&officeId=${officeId}">
            <span class="nav-icon">${QrewUI.getIcon('invoice')}</span>
            <span class="nav-label">Invoice</span>
          </a>
          <a class="nav-item ${view === 'staffs-management' || view === 'staff' ? 'active' : ''}" href="#office-admin/staffs-management?tenantId=${tenantId}&officeId=${officeId}">
            <span class="nav-icon">${QrewUI.getIcon('users')}</span>
            <span class="nav-label">Staffs Management</span>
          </a>
        </div>
        <div class="nav-section" style="margin-top:16px;">
          <div class="nav-section-title">Platform</div>
          <a class="nav-item" href="#landing" style="color:var(--color-accent);font-weight:600;">
            <span class="nav-icon">${QrewUI.getIcon('chevronLeft')}</span>
            <span class="nav-label">&larr; Qrew Landing Page</span>
          </a>
        </div>
      `;
    }

    // Automatically equip every navigation item with tooltips & accessibility labels
    DOM.sidebarNav.querySelectorAll('.nav-item').forEach(item => {
      const labelEl = item.querySelector('.nav-label');
      if (labelEl) {
        const text = labelEl.textContent.trim().replace(/^[←→\s]+|[←→\s]+$/g, '');
        item.setAttribute('title', text);
        item.setAttribute('data-tooltip', text);
        item.setAttribute('aria-label', text);
      }
    });
  };

  // Synchronize Topbar Domain Badge (Platform vs. Office Config vs. Tenant vs. Office Workspace)
  const updateTopbarDomainBadge = () => {
    const domainTextEl = document.getElementById('topbar-domain-text');
    const domainDotEl = document.querySelector('.topbar-domain-dot');
    if (!domainTextEl) return;

    if (AppState.activeWorkspace === 'platform' || AppState.activeWorkspace === 'super-admin') {
      domainTextEl.textContent = 'app.qrew.com/admin';
      if (domainDotEl) domainDotEl.style.backgroundColor = 'var(--panel-accent)';
    } else if (AppState.activeWorkspace === 'office-config') {
      domainTextEl.textContent = 'app.qrew.com/office config';
      if (domainDotEl) domainDotEl.style.backgroundColor = 'var(--panel-accent)';
    } else if (AppState.activeWorkspace === 'tenant') {
      const tenant = QrewStore.getTenantById(AppState.currentTenantId) || QrewStore.getTenants()[0];
      const tenantName = (tenant && tenant.name) ? tenant.name.toLowerCase() : 'sst';
      domainTextEl.textContent = `app.${tenantName}.com`;
      if (domainDotEl) domainDotEl.style.backgroundColor = 'var(--panel-accent)';
    } else {
      // Branch Office Workspaces (Facility Hub vs. Office Administration)
      const office = QrewStore.getOfficeById(AppState.currentOfficeId);
      const isMongla = office && (office.id === 'off_mgl_port' || (office.name && office.name.toLowerCase().includes('mongla')));
      const baseDomain = isMongla ? 'sst.mgl.com' : 'sst.ctg.com';

      if (AppState.activeWorkspace === 'office-admin') {
        domainTextEl.textContent = `${baseDomain}/admin`;
      } else {
        domainTextEl.textContent = baseDomain;
      }
      if (domainDotEl) domainDotEl.style.backgroundColor = 'var(--panel-accent)';
    }
  };

  // Breadcrumbs Updater (removed from topbar per design specification)
  const updateBreadcrumbs = () => {};

  // ==========================================
  // Panel-Scoped User Profile Definition
  // Dynamically assigns role, persona name, email, and avatar per workspace/panel
  // ==========================================
  const getPanelUserInfo = () => {
    const ws = AppState.activeWorkspace;
    const tenant = (typeof QrewStore !== 'undefined' && QrewStore.getTenantById)
      ? (QrewStore.getTenantById(AppState.currentTenantId) || QrewStore.getTenants()[0])
      : null;

    let overrides = {};
    try {
      overrides = JSON.parse(localStorage.getItem('qrew_panel_user_overrides') || '{}');
    } catch (e) {}

    let defaultInfo;
    if (ws === 'platform') {
      defaultInfo = {
        name: 'Sakib',
        role: 'Platform Admin',
        email: 'sakib@qrew.io',
        avatar: 'S',
        avatarBg: 'var(--panel-accent)'
      };
    } else if (ws === 'super-admin') {
      defaultInfo = {
        name: 'Sakib',
        role: 'Super Admin',
        email: 'sakib@qrew.io',
        avatar: 'S',
        avatarBg: 'var(--panel-accent)'
      };
    } else if (ws === 'tenant') {
      const ownerName = (tenant && tenant.ownerName) ? tenant.ownerName : 'Rafiqul Islam';
      const ownerEmail = (tenant && tenant.ownerEmail) ? tenant.ownerEmail : 'rafiq@sst.com';
      defaultInfo = {
        name: ownerName,
        role: 'Tenant Admin',
        email: ownerEmail,
        avatar: ownerName.charAt(0).toUpperCase(),
        avatarBg: 'var(--panel-accent)'
      };
    } else if (ws === 'office-admin') {
      defaultInfo = {
        name: 'Jack Rahman',
        role: 'Office Admin',
        email: 'jack@sst.com',
        avatar: 'J',
        avatarBg: 'var(--panel-accent)'
      };
    } else if (ws === 'office') {
      defaultInfo = {
        name: 'Jack Rahman',
        role: 'Office Manager',
        email: 'jack@sst.com',
        avatar: 'J',
        avatarBg: 'var(--panel-accent)'
      };
    } else if (ws === 'office-config') {
      defaultInfo = {
        name: 'Jack Rahman',
        role: 'Office Admin',
        email: 'jack@sst.com',
        avatar: 'J',
        avatarBg: 'var(--panel-accent)'
      };
    } else if (ws === 'department') {
      const dept = (typeof QrewStore !== 'undefined' && QrewStore.getDepartmentById)
        ? QrewStore.getDepartmentById(AppState.currentDeptId)
        : null;
      const leadName = dept ? (dept.leadName || 'Jack Rahman') : 'Jack Rahman';
      defaultInfo = {
        name: leadName,
        role: 'Department Lead',
        email: 'lead@sst.com',
        avatar: leadName.charAt(0).toUpperCase(),
        avatarBg: 'var(--color-accent)'
      };
    } else if (ws === 'member') {
      const member = (typeof QrewStore !== 'undefined' && QrewStore.getUserById)
        ? QrewStore.getUserById(AppState.currentMemberId)
        : null;
      const memName = (member && member.name) ? member.name : 'Nusrat Jahan';
      const memEmail = (member && member.email) ? member.email : 'nusrat@sst.com';
      defaultInfo = {
        name: memName,
        role: 'Office Staff',
        email: memEmail,
        avatar: memName.charAt(0).toUpperCase(),
        avatarBg: 'var(--color-text-muted)'
      };
    } else {
      defaultInfo = {
        name: 'Sakib',
        role: 'Platform Admin',
        email: 'sakib@qrew.io',
        avatar: 'S',
        avatarBg: 'var(--color-dark)'
      };
    }

    if (overrides && overrides[ws]) {
      return { ...defaultInfo, ...overrides[ws] };
    }
    return defaultInfo;
  };

  // Synchronize Topbar User Profile dynamically based on active workspace/panel
  const syncHeaderUserProfile = () => {
    const user = getPanelUserInfo();
    const avatarEl = document.getElementById('topbar-user-avatar');
    const nameEl = document.getElementById('topbar-user-name');
    const roleEl = document.getElementById('topbar-user-role');
    const titleEl = document.getElementById('dropdown-user-title');
    const emailEl = document.getElementById('dropdown-user-email');
    const dropdownRoleEl = document.getElementById('dropdown-user-role');

    if (avatarEl) {
      avatarEl.textContent = user.avatar || user.name.charAt(0).toUpperCase();
      avatarEl.style.backgroundColor = user.avatarBg || 'var(--color-dark)';
    }
    if (nameEl) nameEl.textContent = user.name;
    if (roleEl) roleEl.textContent = user.role;
    if (titleEl) titleEl.textContent = user.name;
    if (emailEl) emailEl.textContent = user.email;
    if (dropdownRoleEl) dropdownRoleEl.textContent = user.role;
  };

  // Synchronize Topbar Landing Button (Removed per UI design)
  const syncTopbarLandingBtn = () => {};

  // Blank Titled Page Renderer (Strictly displays title and keeps page blank per spec)
  const renderBlankTitledPage = (title) => {
    DOM.mainContent.innerHTML = `
      <div class="page-header" style="margin-bottom: 24px;">
        <div class="page-title-group">
          <h1 class="page-title" style="font-size: 24px; font-weight: 700; color: var(--color-text-primary); margin: 0;">${QrewUI.escapeHtml(title)}</h1>
        </div>
      </div>
    `;
  };

  // Tenant Settings View (Domain edit, Company name edit, Plan brought)
  const renderTenantSettings = (tenantId) => {
    const tenant = QrewStore.getTenantById(tenantId) || QrewStore.getTenants()[0];
    const currentDomain = getTenantDomain(tenant.id);
    const planName = tenant.plan || 'Enterprise Governance Mesh';
    const planBroughtDate = tenant.createdAt || '2026-09-12';

    DOM.mainContent.innerHTML = `
      <div class="page-header" style="margin-bottom: 24px;">
        <div class="page-title-group">
          <h1 class="page-title" style="font-size: 24px; font-weight: 700; color: var(--color-text-primary); margin: 0;">Settings</h1>
          <p class="page-subtitle" style="font-size: 14px; color: var(--color-text-muted); margin-top: 4px;">Manage organization profile, primary domain routing, and active subscription plan.</p>
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 24px; max-width: 760px;">
        <!-- Company Profile & Name Edit -->
        <div class="card" style="background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 8px; padding: 24px;">
          <h2 style="font-size: 16px; font-weight: 600; color: var(--color-text-primary); margin: 0 0 16px 0;">Company Profile</h2>
          <form id="tenant-company-form" style="display: flex; flex-direction: column; gap: 16px;">
            <div>
              <label for="tenant-name-input" style="display: block; font-size: 13px; font-weight: 500; color: var(--color-text-primary); margin-bottom: 6px;">Company Name</label>
              <input type="text" id="tenant-name-input" class="form-input" value="${QrewUI.escapeHtml(tenant.name)}" required style="width: 100%; padding: 8px 12px; border: 1px solid var(--color-border); border-radius: 6px; background: var(--color-bg); color: var(--color-text-primary); font-size: 14px;">
            </div>
            <div>
              <label for="tenant-owner-name" style="display: block; font-size: 13px; font-weight: 500; color: var(--color-text-primary); margin-bottom: 6px;">Account Owner</label>
              <input type="text" id="tenant-owner-name" class="form-input" value="${QrewUI.escapeHtml(tenant.ownerName || 'Rafiqul Islam')}" readonly style="width: 100%; padding: 8px 12px; border: 1px solid var(--color-border); border-radius: 6px; background: var(--color-surface); color: var(--color-text-muted); font-size: 14px; cursor: not-allowed;">
            </div>
            <div>
              <label for="tenant-owner-email" style="display: block; font-size: 13px; font-weight: 500; color: var(--color-text-primary); margin-bottom: 6px;">Owner Email</label>
              <input type="email" id="tenant-owner-email" class="form-input" value="${QrewUI.escapeHtml(tenant.ownerEmail || 'rafiq@sst.com')}" readonly style="width: 100%; padding: 8px 12px; border: 1px solid var(--color-border); border-radius: 6px; background: var(--color-surface); color: var(--color-text-muted); font-size: 14px; cursor: not-allowed;">
            </div>
            <div style="display: flex; justify-content: flex-end; margin-top: 8px;">
              <button type="submit" class="btn btn-primary" style="background: var(--color-accent); color: #fff; padding: 8px 16px; border-radius: 6px; border: none; font-weight: 600; cursor: pointer;">Save Company Changes</button>
            </div>
          </form>
        </div>

        <!-- Domain Configuration -->
        <div class="card" style="background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 8px; padding: 24px;">
          <h2 style="font-size: 16px; font-weight: 600; color: var(--color-text-primary); margin: 0 0 16px 0;">Domain Configuration</h2>
          <form id="tenant-domain-form" style="display: flex; flex-direction: column; gap: 16px;">
            <div>
              <label for="tenant-domain-input" style="display: block; font-size: 13px; font-weight: 500; color: var(--color-text-primary); margin-bottom: 6px;">Custom Domain</label>
              <div style="display: flex; align-items: center; gap: 8px;">
                <input type="text" id="tenant-domain-input" class="form-input" value="${QrewUI.escapeHtml(currentDomain)}" required style="flex: 1; padding: 8px 12px; border: 1px solid var(--color-border); border-radius: 6px; background: var(--color-bg); color: var(--color-text-primary); font-size: 14px;">
                <span class="badge badge-active" style="display: inline-flex; align-items: center; gap: 4px; padding: 6px 10px; border-radius: 4px; font-size: 12px;"><span class="badge-dot"></span>SSL Active</span>
              </div>
              <p style="font-size: 12px; color: var(--color-text-muted); margin-top: 4px;">Tenant landing and workspace traffic will resolve to this domain.</p>
            </div>
            <div style="display: flex; justify-content: flex-end; margin-top: 8px;">
              <button type="submit" class="btn btn-primary" style="background: var(--color-accent); color: #fff; padding: 8px 16px; border-radius: 6px; border: none; font-weight: 600; cursor: pointer;">Save Domain Settings</button>
            </div>
          </form>
        </div>

        <!-- Plan Brought & Subscription Details -->
        <div class="card" style="background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 8px; padding: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
            <div>
              <h2 style="font-size: 16px; font-weight: 600; color: var(--color-text-primary); margin: 0 0 4px 0;">Plan Brought</h2>
              <p style="font-size: 13px; color: var(--color-text-muted); margin: 0;">Subscription license and tier entitlement tier</p>
            </div>
            <span class="badge badge-active" style="display: inline-flex; align-items: center; gap: 4px; padding: 6px 12px; border-radius: 4px; font-size: 12px;"><span class="badge-dot"></span>Active Subscription</span>
          </div>

          <div style="background: var(--color-bg); border: 1px solid var(--color-border); border-radius: 6px; padding: 16px; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 16px;">
            <div>
              <div style="font-size: 12px; color: var(--color-text-muted); margin-bottom: 2px;">Plan Name</div>
              <div style="font-size: 15px; font-weight: 600; color: var(--color-text-primary);">${QrewUI.escapeHtml(planName)}</div>
            </div>
            <div>
              <div style="font-size: 12px; color: var(--color-text-muted); margin-bottom: 2px;">Billing Frequency</div>
              <div style="font-size: 15px; font-weight: 600; color: var(--color-text-primary);">Annual ($1,200/mo)</div>
            </div>
            <div>
              <div style="font-size: 12px; color: var(--color-text-muted); margin-bottom: 2px;">Provisioned On</div>
              <div style="font-size: 15px; font-weight: 600; color: var(--color-text-primary);">${QrewUI.escapeHtml(planBroughtDate)}</div>
            </div>
            <div>
              <div style="font-size: 12px; color: var(--color-text-muted); margin-bottom: 2px;">Offices Entitlement</div>
              <div style="font-size: 15px; font-weight: 600; color: var(--color-text-primary);">Unlimited Branches</div>
            </div>
          </div>

          <div style="font-size: 13px; color: var(--color-text-muted); line-height: 1.6;">
            <div style="font-weight: 600; color: var(--color-text-primary); margin-bottom: 4px;">Included Entitlements:</div>
            <ul style="margin: 0; padding-left: 20px;">
              <li>Unlimited Branch Facilities & Department Hierarchies</li>
              <li>Multi-tiered Role-Based Access Control (RBAC)</li>
              <li>Real-time Operations Mesh & Facility Shift Handover</li>
              <li>Complete Audit Trail Log Retention (365 Days)</li>
              <li>Enterprise Priority Support & 99.99% Uptime Guarantee</li>
            </ul>
          </div>
        </div>
      </div>
    `;

    // Hook up forms
    const companyForm = document.getElementById('tenant-company-form');
    if (companyForm) {
      companyForm.onsubmit = (e) => {
        e.preventDefault();
        const newName = document.getElementById('tenant-name-input').value.trim();
        if (!newName) return;
        QrewStore.updateTenant(tenant.id, { name: newName });
        QrewUI.showToast('Company name updated successfully', 'success');
        renderSidebar();
        renderTenantSettings(tenant.id);
      };
    }

    const domainForm = document.getElementById('tenant-domain-form');
    if (domainForm) {
      domainForm.onsubmit = (e) => {
        e.preventDefault();
        const newDomain = document.getElementById('tenant-domain-input').value.trim();
        if (!newDomain) return;
        QrewStore.updateTenant(tenant.id, { domain: newDomain });
        QrewUI.showToast('Custom domain updated successfully', 'success');
        updateTopbarDomainBadge();
        renderSidebar();
        renderTenantSettings(tenant.id);
      };
    }
  };

  // Dispatcher for View Rendering
  const dispatchView = () => {
    const ws = AppState.activeWorkspace;
    const view = AppState.currentView;

    if (ws === 'landing') {
      renderLandingPage();
      return;
    }

    if (ws === 'tenant-landing') {
      renderTenantLandingPage(AppState.currentTenantId);
      return;
    }

    if (ws === 'super-admin') {
      switch (view) {
        case 'permission-catalog':
          renderBlankTitledPage('Permission Catalog');
          break;
        case 'platform-settings':
        case 'platform-setting':
          renderBlankTitledPage('Platform Setting');
          break;
        default:
          renderBlankTitledPage('Permission Catalog');
      }
      return;
    }

    if (ws === 'office-config') {
      switch (view) {
        case 'invoice-templates':
          renderBlankTitledPage('Invoice Templates');
          break;
        case 'roles-permissions':
        case 'roles':
          renderBlankTitledPage('Roles and Permissions');
          break;
        case 'customize-fields':
          renderBlankTitledPage('Customize fields');
          break;
        case 'plans-entitlements':
        case 'plans':
          renderBlankTitledPage('Plans and Entitlement');
          break;
        default:
          renderBlankTitledPage('Invoice Templates');
      }
      return;
    }

    if (ws === 'department') {
      renderDepartmentWorkspace(AppState.currentDeptId);
      return;
    }

    if (ws === 'member') {
      renderMemberWorkspace(AppState.currentMemberId);
      return;
    }

    if (ws === 'platform') {
      switch (view) {
        case 'overview':
          renderPlatformOverview();
          break;
        case 'tenants':
          renderPlatformTenants();
          break;
        case 'platform-access':
          renderBlankTitledPage('Platform Access');
          break;
        case 'permission-access':
          renderBlankTitledPage('Permission Access');
          break;
        case 'template-defaults':
        case 'templates-defaults':
          renderBlankTitledPage('Template & Defaults');
          break;
        case 'plans-entitlements':
          renderBlankTitledPage('Plans and Entitlements');
          break;
        case 'usage-analytics':
          renderBlankTitledPage('Usage & Analytics');
          break;
        case 'audit-log':
        case 'audit-logs':
          renderBlankTitledPage('Audit log');
          break;
        case 'support-access':
          renderBlankTitledPage('Support Access');
          break;
        case 'system-health':
          renderBlankTitledPage('System Health and Incidents');
          break;
        case 'platform-settings':
          renderBlankTitledPage('Platform settings');
          break;
        default:
          renderPlatformOverview();
      }
    } else if (ws === 'tenant') {
      const tenantId = AppState.currentTenantId;
      switch (view) {
        case 'overview':
          renderTenantOverview(tenantId);
          break;
        case 'offices':
          renderTenantOffices(tenantId);
          break;
        case 'members':
          renderTenantMembers(tenantId);
          break;
        case 'roles':
          renderTenantRoles(tenantId);
          break;
        case 'settings':
          renderTenantSettings(tenantId);
          break;
        default:
          renderTenantOverview(tenantId);
      }
    } else if (ws === 'office') {
      switch (view) {
        case 'dashboard':
        case 'overview':
          renderBlankTitledPage('Dashboard');
          break;
        case 'clients':
          renderBlankTitledPage('Clients');
          break;
        case 'files':
          renderBlankTitledPage('Files');
          break;
        case 'financials':
          renderBlankTitledPage('Financials');
          break;
        case 'staffs':
        case 'staff':
          renderBlankTitledPage('Staffs');
          break;
        default:
          renderBlankTitledPage('Dashboard');
      }
    } else if (ws === 'office-admin') {
      switch (view) {
        case 'overview':
          renderBlankTitledPage('Overview');
          break;
        case 'invoice':
          renderBlankTitledPage('Invoice');
          break;
        case 'staffs-management':
        case 'staff':
          renderBlankTitledPage('Staffs Management');
          break;
        default:
          renderBlankTitledPage('Overview');
      }
    }
  };

  // ==========================================
  // LANDING PAGE (Qrew.com)
  // ==========================================
  const showPersonasModal = () => {
    QrewUI.openModal({
      title: '1-Click Persona Login',
      bodyHtml: `
        <p style="font-size:13.5px;color:var(--color-text-muted);margin-bottom:20px;">
          Select any persona to jump directly into their contextual workspace experience.
        </p>
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:14px;">
          <!-- Persona 1 -->
          <div style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--radius-md);padding:16px;display:flex;flex-direction:column;gap:10px;">
            <div style="display:flex;align-items:center;gap:12px;">
              <div class="persona-avatar" style="background-color:var(--color-accent);width:38px;height:38px;font-size:15px;">S</div>
              <div>
                <div style="font-weight:700;font-size:14px;color:var(--color-text-primary);">Sakib</div>
                <span class="persona-role-badge badge-role platform" style="font-size:10px;">Platform Owner</span>
              </div>
            </div>
            <p style="font-size:12px;color:var(--color-text-muted);margin:0;line-height:1.4;">Global infrastructure, tenants CRUD, platform audit visibility.</p>
            <button class="btn btn-primary btn-sm" onclick="QrewStore.setCurrentUser('usr_sakib');QrewUI.closeModal();location.hash='#platform/overview';" style="margin-top:auto;width:100%;">
              Enter as Platform Owner
            </button>
          </div>

          <!-- Persona 2 -->
          <div style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--radius-md);padding:16px;display:flex;flex-direction:column;gap:10px;">
            <div style="display:flex;align-items:center;gap:12px;">
              <div class="persona-avatar" style="background-color:var(--color-warning);width:38px;height:38px;font-size:15px;">R</div>
              <div>
                <div style="font-weight:700;font-size:14px;color:var(--color-text-primary);">Rafiqul Islam</div>
                <span class="persona-role-badge badge-role tenant" style="font-size:10px;">Tenant Admin</span>
              </div>
            </div>
            <p style="font-size:12px;color:var(--color-text-muted);margin:0;line-height:1.4;">SST organization, branch offices CRUD, member pool.</p>
            <button class="btn btn-primary btn-sm" onclick="QrewStore.setCurrentUser('usr_rafiqul');QrewUI.closeModal();location.hash='#tenant/overview?id=ten_sst';" style="margin-top:auto;width:100%;">
              Enter as Tenant Admin
            </button>
          </div>

          <!-- Persona 3 -->
          <div style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--radius-md);padding:16px;display:flex;flex-direction:column;gap:10px;">
            <div style="display:flex;align-items:center;gap:12px;">
              <div class="persona-avatar" style="background-color:var(--color-info);width:38px;height:38px;font-size:15px;">J</div>
              <div>
                <div style="font-weight:700;font-size:14px;color:var(--color-text-primary);">Jack Rahman</div>
                <span class="persona-role-badge badge-role office" style="font-size:10px;">Office Supervisor</span>
              </div>
            </div>
            <p style="font-size:12px;color:var(--color-text-muted);margin:0;line-height:1.4;">Chittagong Port Office, departments, and on-site staff deployment.</p>
            <button class="btn btn-primary btn-sm" onclick="QrewStore.setCurrentUser('usr_jack');QrewUI.closeModal();location.hash='#office/overview?tenantId=ten_sst&officeId=off_ctg_port';" style="margin-top:auto;width:100%;">
              Enter as Office Admin
            </button>
          </div>

          <!-- Persona 4 -->
          <div style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--radius-md);padding:16px;display:flex;flex-direction:column;gap:10px;">
            <div style="display:flex;align-items:center;gap:12px;">
              <div class="persona-avatar" style="background-color:var(--color-text-muted);width:38px;height:38px;font-size:15px;">N</div>
              <div>
                <div style="font-weight:700;font-size:14px;color:var(--color-text-primary);">Nusrat Jahan</div>
                <span class="persona-role-badge" style="background:#EFECE6;color:var(--color-text-primary);border:1px solid var(--color-border);font-size:10px;">Office Staff</span>
              </div>
            </div>
            <p style="font-size:12px;color:var(--color-text-muted);margin:0;line-height:1.4;">Chittagong Port member, daily operational duties & personal tasks.</p>
            <button class="btn btn-primary btn-sm" onclick="QrewStore.setCurrentUser('usr_nusrat');QrewUI.closeModal();location.hash='#member/overview?userId=usr_nusrat';" style="margin-top:auto;width:100%;">
              Enter as Member
            </button>
          </div>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary" onclick="QrewUI.closeModal()">Close</button>
      `
    });
  };

  // Expose helpers globally
  window.showPersonasModal = showPersonasModal;

  const renderLandingPage = () => {
    DOM.mainContent.innerHTML = `
      <div class="landing-page">
        <!-- Sticky Header -->
        <header class="landing-navbar">
          <div class="landing-container landing-navbar-inner">
            <a href="#landing" class="landing-brand">
              <div class="landing-brand-logo">Q</div>
              <span class="landing-brand-title">Qrew</span>
              <span class="badge" style="background:var(--color-surface);border:1px solid var(--color-border);font-size:10.5px;color:var(--color-text-muted);">Mesh v2.0</span>
            </a>

            <!-- Central Platform Domain -->
            <div class="landing-domain-badge">
              <span class="landing-domain-dot"></span>
              <span>app.qrew.com</span>
            </div>

            <!-- Workspace Context Tabs on Main Landing Header -->
            <div class="workspace-tabs" role="tablist" aria-label="Workspaces">
              <a href="#platform/overview" class="workspace-tab" role="tab" title="Platform Admin">
                <span class="ws-tab-indicator platform"></span>
                <span class="ws-tab-text">Platform Admin</span>
              </a>
              <a href="#tenant/overview?id=ten_sst" class="workspace-tab" role="tab" title="Tenant Admin Panel">
                <span class="ws-tab-indicator tenant"></span>
                <span class="ws-tab-text">Tenant</span>
              </a>
              <a href="#office/overview?tenantId=ten_sst&officeId=off_ctg_port" class="workspace-tab" role="tab" title="Office Workspace">
                <span class="ws-tab-indicator office"></span>
                <span class="ws-tab-text">Office</span>
              </a>
              <a href="#office-config?tenantId=ten_sst&officeId=off_ctg_port" class="workspace-tab" role="tab" title="Office Configuration Centre">
                <span class="ws-tab-indicator config"></span>
                <span class="ws-tab-text">Office Config</span>
              </a>
            </div>
          </div>
        </header>

        <!-- Hero Section -->
        <section class="landing-hero">
          <div class="landing-container">
            <div class="landing-badge">
              <span class="landing-badge-dot"></span>
              <span>Enterprise Hierarchical Governance • 4-Tier RBAC Architecture</span>
            </div>
            <h1 class="landing-hero-title">
              Hierarchical Multi-Tenant Access Control &amp; Operations Mesh
            </h1>
            <p class="landing-hero-subtitle">
              Enterprise governance engineered for complex operational hierarchies.
              Strictly decouple global platform administration, organizational tenants, physical office branches, and operational departments.
            </p>

            <div class="landing-cta-group">
              <a href="#platform/overview" class="btn btn-primary landing-btn-lg" style="display:inline-flex;align-items:center;gap:8px;">
                <span>Launch Demo Platform</span>
                ${QrewUI.getIcon('arrowRight')}
              </a>
              <button class="btn btn-secondary landing-btn-lg" onclick="window.showPersonasModal()">
                Explore Personas
              </button>
            </div>

            <!-- Quick Stats Ribbon -->
            <div class="hero-ribbon">
              <div class="hero-ribbon-item">
                <div class="hero-ribbon-val">4 Isolated Tiers</div>
                <div class="hero-ribbon-label">Platform → Tenant → Office → Dept</div>
              </div>
              <div class="hero-ribbon-item">
                <div class="hero-ribbon-val">Zero Frameworks</div>
                <div class="hero-ribbon-label">Semantic HTML5, CSS3 &amp; Vanilla JS</div>
              </div>
              <div class="hero-ribbon-item">
                <div class="hero-ribbon-val">Tamper-Evident</div>
                <div class="hero-ribbon-label">Chronological audit activity trail</div>
              </div>
              <div class="hero-ribbon-item">
                <div class="hero-ribbon-val">Contextual RBAC</div>
                <div class="hero-ribbon-label">Strict tier permission isolation</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    `;
  };

  // ==========================================
  // DEDICATED TENANT LANDING PAGE (ctg.sst.com / sst.com)
  // ==========================================
  const renderTenantLandingPage = (tenantId) => {
    const tenant = QrewStore.getTenantById(tenantId) || QrewStore.getTenants()[0];
    const domain = getTenantDomain(tenant.id);
    const offices = QrewStore.getOfficesByTenant(tenant.id);
    const members = QrewStore.getTenantMembers(tenant.id);

    DOM.mainContent.innerHTML = `
      <div class="landing-page">
        <!-- Tenant Sticky Header -->
        <header class="landing-navbar">
          <div class="landing-container landing-navbar-inner">
            <div style="display:flex;align-items:center;gap:12px;">
              <a href="#tenant-landing?id=${tenant.id}" class="landing-brand">
                <div class="landing-brand-logo" style="background-color:var(--color-warning);">${tenant.name.charAt(0)}</div>
                <span class="landing-brand-title">${QrewUI.escapeHtml(tenant.name)}</span>
              </a>
              <span class="tenant-domain-pill">${domain}</span>
            </div>

            <div style="display:flex;align-items:center;gap:10px;">
              <a href="#landing" class="btn btn-secondary btn-sm" title="Return to Qrew Global SaaS Landing">
                ← Qrew Platform
              </a>
              <a href="#tenant/overview?id=${tenant.id}" class="btn btn-primary btn-sm">
                Tenant Admin Panel →
              </a>
            </div>
          </div>
        </header>

        <!-- Tenant Hero Section -->
        <section class="tenant-landing-hero">
          <div class="landing-container">
            <div class="landing-badge">
              <span class="landing-badge-dot"></span>
              <span>Tenant Namespace: ${domain} • Autonomous Organization Operations</span>
            </div>
            <h1 class="landing-hero-title">
              ${QrewUI.escapeHtml(tenant.name)} Operations Portal
            </h1>
            <p class="landing-hero-subtitle">
              Dedicated corporate organization portal for ${QrewUI.escapeHtml(tenant.name)}. Overseeing ${offices.length} physical branch facilities and ${members.length} verified organization members under the ${domain} namespace.
            </p>

            <div class="landing-cta-group">
              <a href="#tenant/overview?id=${tenant.id}" class="btn btn-primary landing-btn-lg" style="display:inline-flex;align-items:center;gap:8px;">
                <span>Open Tenant Admin Panel</span>
                ${QrewUI.getIcon('arrowRight')}
              </a>
              <a href="#tenant/offices?id=${tenant.id}" class="btn btn-secondary landing-btn-lg">
                Manage Offices Directory
              </a>
              <a href="#member/overview?userId=usr_nusrat" class="btn btn-secondary landing-btn-lg">
                Staff Workspace
              </a>
            </div>

            <!-- Organization Metrics Ribbon -->
            <div class="hero-ribbon">
              <div class="hero-ribbon-item">
                <div class="hero-ribbon-val">${offices.length} Branches</div>
                <div class="hero-ribbon-label">Physical Office Facilities</div>
              </div>
              <div class="hero-ribbon-item">
                <div class="hero-ribbon-val">${members.length} Members</div>
                <div class="hero-ribbon-label">Verified Personnel Pool</div>
              </div>
              <div class="hero-ribbon-item">
                <div class="hero-ribbon-val">${tenant.status}</div>
                <div class="hero-ribbon-label">Organization Lifecycle</div>
              </div>
              <div class="hero-ribbon-item">
                <div class="hero-ribbon-val">Tier-3 Scoping</div>
                <div class="hero-ribbon-label">Strict Multi-Tenant Isolation</div>
              </div>
            </div>
          </div>
        </section>

        <!-- Branch Offices Showcase Section -->
        <section style="padding:48px 0 64px;">
          <div class="landing-container">
            <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:24px;flex-wrap:wrap;gap:12px;">
              <div>
                <div class="landing-eyebrow" style="color:var(--color-accent);font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:0.8px;">Physical Deployment</div>
                <h2 style="font-size:24px;font-weight:800;color:var(--color-text-primary);margin:4px 0 0;">Branch Office Facilities</h2>
                <p style="font-size:13.5px;color:var(--color-text-muted);margin:4px 0 0;">Select a physical office branch below to access its operational workspace or management panel.</p>
              </div>
              <div>
                <a href="#tenant/offices?id=${tenant.id}" class="btn btn-secondary btn-sm">
                  ${QrewUI.getIcon('plus')} Provision New Office
                </a>
              </div>
            </div>

            <div class="tenant-branch-grid">
              ${offices.map(o => {
                const depts = QrewStore.getDepartments(o.id);
                const staff = QrewStore.getOfficeStaff(o.id);
                return `
                  <div class="tenant-branch-card">
                    <div class="tenant-branch-header">
                      <div>
                        <div class="tenant-branch-title">${QrewUI.escapeHtml(o.name)}</div>
                        <div class="tenant-branch-location">${QrewUI.escapeHtml(o.location)}</div>
                      </div>
                      ${QrewUI.statusBadge(o.status)}
                    </div>

                    <div class="tenant-branch-stats">
                      <div>
                        <strong>${depts.length}</strong> <span style="color:var(--color-text-muted);">Departments</span>
                      </div>
                      <div>
                        <strong>${staff.length}</strong> <span style="color:var(--color-text-muted);">Deployed Staff</span>
                      </div>
                      <div class="active-shift-badge">
                        <span>●</span> Shift: Morning
                      </div>
                    </div>

                    <div class="tenant-branch-actions">
                      <a href="#office/overview?tenantId=${tenant.id}&officeId=${o.id}" class="btn btn-primary btn-sm" style="flex:1;text-align:center;">
                        Office Workspace →
                      </a>
                      <a href="#office-admin/overview?tenantId=${tenant.id}&officeId=${o.id}" class="btn btn-secondary btn-sm" title="Office Admin Panel">
                        Admin ⚙
                      </a>
                      <a href="#office-config?tenantId=${tenant.id}&officeId=${o.id}" class="btn btn-secondary btn-sm" title="Facility Specs & Shifts">
                        Config
                      </a>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </section>
      </div>
    `;
  };

  // ==========================================
  // 1. PLATFORM WORKSPACE VIEWS
  // ==========================================

  // --- Platform: Overview ---
  const renderPlatformOverview = () => {
    DOM.mainContent.innerHTML = `
      <div class="page-header" style="margin-bottom: 24px;">
        <div class="page-title-group">
          <h1 class="page-title" style="font-size: 24px; font-weight: 700; color: var(--color-text-primary); margin: 0;">Platform Dashboard</h1>
        </div>
      </div>
    `;
  };

  // --- Platform: Tenants ---
  const platformTenantTreeState = {
    isRootExpanded: true,
    expandedTenants: new Set(['ten_sst']),
    searchTerm: '',
    statusFilter: 'All'
  };

  const renderPlatformTenants = () => {
    updateBreadcrumbs([
      { label: 'Platform', hash: '#platform/overview' },
      { label: 'Tenants', hash: '#platform/tenants' }
    ]);

    const allTenants = QrewStore.getTenants();
    // Default expand all tenants inside root so folder hierarchy is fully visible
    if (platformTenantTreeState.expandedTenants.size === 0 && allTenants.length > 0) {
      allTenants.forEach(t => platformTenantTreeState.expandedTenants.add(t.id));
    }

    const totalOfficesCount = allTenants.reduce((sum, t) => sum + (QrewStore.getOfficesByTenant(t.id) || []).length, 0);
    const totalMembersCount = allTenants.reduce((sum, t) => sum + (QrewStore.getTenantMembers(t.id) || []).length, 0);

    const renderTreeNodes = () => {
      const filter = (platformTenantTreeState.searchTerm || '').toLowerCase().trim();
      const status = platformTenantTreeState.statusFilter || 'All';
      const treeListEl = document.getElementById('tenants-tree-list');
      const statsBadgeEl = document.getElementById('tenants-stats-badge');
      if (!treeListEl) return;

      let filteredTenants = allTenants.filter(t => {
        const tenantOffices = QrewStore.getOfficesByTenant(t.id) || [];
        const matchesSearch = !filter || (
          t.name.toLowerCase().includes(filter) ||
          t.id.toLowerCase().includes(filter) ||
          (t.ownerName && t.ownerName.toLowerCase().includes(filter)) ||
          tenantOffices.some(o => 
            o.name.toLowerCase().includes(filter) || 
            o.id.toLowerCase().includes(filter) || 
            (o.location && o.location.toLowerCase().includes(filter))
          )
        );
        const matchesStatus = status === 'All' || t.status === status;
        return matchesSearch && matchesStatus;
      });

      if (statsBadgeEl) {
        statsBadgeEl.textContent = `${filteredTenants.length} Tenant${filteredTenants.length === 1 ? '' : 's'} • ${totalOfficesCount} Offices`;
      }

      // Auto-expand root and matching tenants if searching
      if (filter) {
        platformTenantTreeState.isRootExpanded = true;
        filteredTenants.forEach(t => platformTenantTreeState.expandedTenants.add(t.id));
      }

      const isRootExpanded = platformTenantTreeState.isRootExpanded;

      treeListEl.innerHTML = `
        <div class="tree-root-folder-card">
          <!-- Level 1: Root Folder (Tenants) -->
          <div class="tree-tenant-row root-folder-row ${isRootExpanded ? 'expanded' : ''}" id="root-tenants-row" role="button" tabindex="0" aria-expanded="${isRootExpanded ? 'true' : 'false'}" aria-label="Tenants Root Folder">
            <div class="tree-tenant-left">
              <span class="tree-chevron" aria-hidden="true">${QrewUI.getIcon('chevronRight')}</span>
              <span class="tree-folder-icon" style="background-color:var(--panel-accent);color:#fff;" aria-hidden="true">
                ${isRootExpanded ? QrewUI.getIcon('folderOpen') : QrewUI.getIcon('folderClosed')}
              </span>
              <div class="tree-tenant-name-group">
                <span class="tree-tenant-title">Tenants</span>
                <span class="tree-id-badge" title="Root Directory">root_directory</span>
              </div>
            </div>

            <div class="tree-tenant-meta">
              <span class="tree-meta-item" title="Total Organizations in Mesh">
                <span class="tree-meta-icon">${QrewUI.getIcon('layers')}</span>
                <span class="tree-meta-label">Organizations:</span>
                <strong style="color:var(--color-text-primary);">${filteredTenants.length}</strong>
              </span>
              <span class="tree-meta-divider" aria-hidden="true">•</span>
              <span class="tree-meta-badge" title="Total Facilities">
                ${totalOfficesCount} office${totalOfficesCount === 1 ? '' : 's'}
              </span>
              <span class="tree-meta-divider" aria-hidden="true">•</span>
              <span class="tree-meta-item" title="Total Active Members" style="color:var(--color-text-muted);">
                ${totalMembersCount} member${totalMembersCount === 1 ? '' : 's'}
              </span>
              <span class="tree-meta-divider" aria-hidden="true">•</span>
              <span class="tree-meta-item">
                ${QrewUI.statusBadge('Active')}
              </span>
            </div>

            <div class="tree-actions-wrap" onclick="event.stopPropagation()">
              <button class="btn btn-secondary btn-sm" id="btn-root-create-tenant" title="Provision New Organization">
                ${QrewUI.getIcon('plus')} New Tenant
              </button>
            </div>
          </div>

          <!-- Level 2: Tenants Under Root -->
          ${isRootExpanded ? `
            <div class="tree-branch-container root-branch">
              ${filteredTenants.length === 0 ? `
                <div style="padding:20px 24px;background:var(--color-surface-white);border:1px dashed var(--color-border);border-radius:var(--radius-md);text-align:center;">
                  <span style="color:var(--color-text-muted);font-size:13px;">
                    ${filter ? `No organizations match "${QrewUI.escapeHtml(filter)}"` : 'No tenant organizations found.'}
                  </span>
                </div>
              ` : filteredTenants.map(t => {
                const tenantOffices = QrewStore.getOfficesByTenant(t.id) || [];
                const tenantMembers = QrewStore.getTenantMembers(t.id) || [];
                const isTenantExpanded = platformTenantTreeState.expandedTenants.has(t.id);

                const filteredOffices = filter
                  ? tenantOffices.filter(o => 
                      o.name.toLowerCase().includes(filter) || 
                      o.id.toLowerCase().includes(filter) || 
                      (o.location && o.location.toLowerCase().includes(filter))
                    )
                  : tenantOffices;

                return `
                  <div class="tree-subfolder-card" data-tenant-id="${t.id}">
                    <!-- Tenant Row (e.g. SST) -->
                    <div class="tree-tenant-row subfolder-row ${isTenantExpanded ? 'expanded' : ''}" data-tenant-id="${t.id}" role="button" tabindex="0" aria-expanded="${isTenantExpanded ? 'true' : 'false'}" aria-label="Tenant Organization ${QrewUI.escapeHtml(t.name)}">
                      <div class="tree-tenant-left">
                        <span class="tree-chevron" aria-hidden="true">${QrewUI.getIcon('chevronRight')}</span>
                        <span class="tree-folder-icon" aria-hidden="true">
                          ${isTenantExpanded ? QrewUI.getIcon('folderOpen') : QrewUI.getIcon('folderClosed')}
                        </span>
                        <div class="tree-tenant-name-group">
                          <span class="tree-tenant-title">${QrewUI.escapeHtml(t.name)}</span>
                          <span class="tree-id-badge" title="Tenant Organization Identifier">${t.id}</span>
                        </div>
                      </div>

                      <div class="tree-tenant-meta">
                        <span class="tree-meta-item" title="Organization Account Owner">
                          <span class="tree-meta-icon">${QrewUI.getIcon('users')}</span>
                          <span class="tree-meta-label">Owner:</span>
                          <strong style="color:var(--color-text-primary);">${QrewUI.escapeHtml(t.ownerName || 'Rafiqul Islam')}</strong>
                        </span>
                        <span class="tree-meta-divider" aria-hidden="true">•</span>
                        <span class="tree-meta-badge" title="Total Offices">
                          ${tenantOffices.length} office${tenantOffices.length === 1 ? '' : 's'}
                        </span>
                        <span class="tree-meta-divider" aria-hidden="true">•</span>
                        <span class="tree-meta-item" title="Total Organization Members" style="color:var(--color-text-muted);">
                          ${tenantMembers.length} member${tenantMembers.length === 1 ? '' : 's'}
                        </span>
                        <span class="tree-meta-divider" aria-hidden="true">•</span>
                        <span class="tree-meta-item">
                          ${QrewUI.statusBadge(t.status)}
                        </span>
                        <span class="tree-meta-divider" aria-hidden="true">•</span>
                        <span class="tree-meta-date" title="Organization Created Date">
                          Est. ${t.createdAt || '2026-09-12'}
                        </span>
                      </div>

                      <div class="tree-actions-wrap" onclick="event.stopPropagation()">
                        <button class="action-icon-btn edit-tenant-btn" data-id="${t.id}" title="Edit Organization Details" aria-label="Edit Tenant Organization">
                          ${QrewUI.getIcon('edit')}
                        </button>
                        <div class="tree-action-dropdown-wrap">
                          <button class="action-icon-btn tree-dropdown-trigger" data-dropdown="platform-tenant-menu-${t.id}" title="More Actions" aria-label="More Organization Actions">
                            ${QrewUI.getIcon('moreHorizontal')}
                          </button>
                          <div class="tree-action-menu" id="platform-tenant-menu-${t.id}">
                            <a href="#tenant/overview?id=${t.id}" class="tree-action-item">
                              ${QrewUI.getIcon('overview')} <span>Open Tenant Workspace</span>
                            </a>
                            <button class="tree-action-item edit-tenant-btn" data-id="${t.id}">
                              ${QrewUI.getIcon('edit')} <span>Edit Organization</span>
                            </button>
                            <button class="tree-action-item toggle-tenant-btn" data-id="${t.id}" data-status="${t.status}">
                              ${QrewUI.getIcon('power')} <span>${t.status === 'Active' ? 'Suspend Organization' : 'Activate Organization'}</span>
                            </button>
                            <div class="tree-action-divider"></div>
                            <button class="tree-action-item danger delete-tenant-btn" data-id="${t.id}" data-name="${QrewUI.escapeHtml(t.name)}">
                              ${QrewUI.getIcon('trash')} <span>Delete Organization</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Level 3: Child Offices Under Tenant -->
                    ${isTenantExpanded ? `
                      <div class="tree-branch-container nested-offices-branch">
                        ${filteredOffices.length === 0 ? `
                          <div style="padding:14px 18px;background:var(--color-surface-white);border:1px dashed var(--color-border);border-radius:var(--radius-md);display:flex;align-items:center;justify-content:space-between;">
                            <span style="color:var(--color-text-muted);font-size:12.5px;">
                              ${filter ? `No offices match "${QrewUI.escapeHtml(filter)}"` : 'No offices created yet under this organization.'}
                            </span>
                            <button class="btn btn-secondary btn-sm create-office-tenant-btn" data-tenant-id="${t.id}">
                              ${QrewUI.getIcon('plus')} Add Office
                            </button>
                          </div>
                        ` : filteredOffices.map(off => `
                          <div class="tree-office-item" data-id="${off.id}">
                            <!-- Group 1: Office Identity -->
                            <div class="tree-office-identity">
                              <div class="tree-office-icon-wrap" aria-hidden="true" title="Facility Branch">
                                ${QrewUI.getIcon('building2') || QrewUI.getIcon('building')}
                              </div>
                              <div class="tree-office-title-wrap">
                                <a href="#office/overview?tenantId=${t.id}&officeId=${off.id}" class="tree-office-name" title="Open Branch Facility Workspace">
                                  ${QrewUI.escapeHtml(off.name)}
                                </a>
                                <span class="tree-id-badge" title="Branch Office Identifier">${off.id}</span>
                              </div>
                            </div>

                            <!-- Group 2: Office Metadata -->
                            <div class="tree-office-meta">
                              <span class="tree-office-location" title="Branch Physical Location">
                                ${QrewUI.getIcon('mapPin')}
                                <span>${QrewUI.escapeHtml(off.location || 'Location Not Specified')}</span>
                              </span>
                              <span class="tree-meta-divider" aria-hidden="true">•</span>
                              <span class="tree-office-staff-badge" title="Deployed Staff Members">
                                ${QrewUI.getIcon('users')}
                                <span>${off.staffCount} staff member${off.staffCount === 1 ? '' : 's'}</span>
                              </span>
                              <span class="tree-meta-divider" aria-hidden="true">•</span>
                              <span class="tree-office-status">
                                ${QrewUI.statusBadge(off.status)}
                              </span>
                            </div>

                            <!-- Group 3: Office Actions -->
                            <div class="tree-office-actions" onclick="event.stopPropagation()">
                              <div class="tree-action-dropdown-wrap">
                                <button class="action-icon-btn tree-dropdown-trigger" data-dropdown="platform-office-menu-${off.id}" title="More Office Actions" aria-label="More Office Actions">
                                  ${QrewUI.getIcon('moreHorizontal')}
                                </button>
                                <div class="tree-action-menu" id="platform-office-menu-${off.id}">
                                  <a href="#office/overview?tenantId=${t.id}&officeId=${off.id}" class="tree-action-item" title="Open Branch Hub">
                                    ${QrewUI.getIcon('building')} <span>Open Branch Hub</span>
                                  </a>
                                  <a href="#office-admin/overview?tenantId=${t.id}&officeId=${off.id}" class="tree-action-item" title="Open Office Administration">
                                    ${QrewUI.getIcon('shield')} <span>Office Admin</span>
                                  </a>
                                  <a href="#office-config?tenantId=${t.id}&officeId=${off.id}" class="tree-action-item" title="Configure Facility Specs, Shift Templates & Custom Fields">
                                    ${QrewUI.getIcon('settings')} <span>Configure Facility Specs</span>
                                  </a>
                                  <button class="tree-action-item edit-office-btn" data-id="${off.id}">
                                    ${QrewUI.getIcon('edit')} <span>Edit Office Details</span>
                                  </button>
                                  <button class="tree-action-item toggle-office-btn" data-id="${off.id}" data-status="${off.status}">
                                    ${QrewUI.getIcon('power')} <span>${off.status === 'Active' ? 'Suspend Office' : 'Activate Office'}</span>
                                  </button>
                                  <div class="tree-action-divider"></div>
                                  <button class="tree-action-item danger delete-office-btn" data-id="${off.id}" data-name="${QrewUI.escapeHtml(off.name)}" data-tenant-id="${t.id}">
                                    ${QrewUI.getIcon('trash')} <span>Delete Office Branch</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        `).join('')}
                      </div>
                    ` : ''}
                  </div>
                `;
              }).join('')}
            </div>
          ` : ''}
        </div>
      `;

      // Wire Event Handlers
      // Dropdown toggle triggers
      treeListEl.querySelectorAll('.tree-dropdown-trigger').forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          const targetMenuId = btn.dataset.dropdown;
          const targetMenu = document.getElementById(targetMenuId);
          const wasOpen = targetMenu && targetMenu.classList.contains('show');
          
          document.querySelectorAll('.tree-action-menu.show').forEach(m => m.classList.remove('show'));
          
          if (!wasOpen && targetMenu) {
            targetMenu.classList.add('show');
          }
        };
      });

      // Level 1 Root Row expansion
      const rootRow = document.getElementById('root-tenants-row');
      if (rootRow) {
        rootRow.onclick = () => {
          platformTenantTreeState.isRootExpanded = !platformTenantTreeState.isRootExpanded;
          renderTreeNodes();
        };
        rootRow.onkeydown = (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            rootRow.click();
          }
        };
      }

      const btnRootCreate = document.getElementById('btn-root-create-tenant');
      if (btnRootCreate) {
        btnRootCreate.onclick = (e) => {
          e.stopPropagation();
          openCreateTenantModal();
        };
      }

      // Level 2 Tenant Row expansion (click & keyboard)
      treeListEl.querySelectorAll('.tree-tenant-row.subfolder-row').forEach(row => {
        row.onclick = () => {
          const tid = row.dataset.tenantId;
          if (platformTenantTreeState.expandedTenants.has(tid)) {
            platformTenantTreeState.expandedTenants.delete(tid);
          } else {
            platformTenantTreeState.expandedTenants.add(tid);
          }
          renderTreeNodes();
        };

        row.onkeydown = (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            row.click();
          }
        };
      });

      const closeOpenMenus = () => {
        document.querySelectorAll('.tree-action-menu.show').forEach(m => m.classList.remove('show'));
      };

      treeListEl.querySelectorAll('.edit-tenant-btn').forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          closeOpenMenus();
          openEditTenantModal(btn.dataset.id);
        };
      });

      treeListEl.querySelectorAll('.toggle-tenant-btn').forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          closeOpenMenus();
          handleToggleTenantStatus(btn.dataset.id, btn.dataset.status);
        };
      });

      treeListEl.querySelectorAll('.delete-tenant-btn').forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          closeOpenMenus();
          handleDeleteTenant(btn.dataset.id, btn.dataset.name);
        };
      });

      treeListEl.querySelectorAll('.edit-office-btn').forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          closeOpenMenus();
          openEditOfficeModal(btn.dataset.id);
        };
      });

      treeListEl.querySelectorAll('.toggle-office-btn').forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          closeOpenMenus();
          handleToggleOfficeStatus(btn.dataset.id, btn.dataset.status);
        };
      });

      treeListEl.querySelectorAll('.delete-office-btn').forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          closeOpenMenus();
          handleDeleteOffice(btn.dataset.id, btn.dataset.name, btn.dataset.tenantId);
        };
      });

      treeListEl.querySelectorAll('.create-office-tenant-btn').forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          closeOpenMenus();
          openCreateOfficeModal(btn.dataset.tenantId);
        };
      });
    };

    DOM.mainContent.innerHTML = `
      <div class="page-header" style="margin-bottom:20px;">
        <div class="page-title-group">
          <h1 class="page-title">Tenant Management</h1>
          <p class="page-subtitle">Provision, inspect, and configure organizations running on Qrew.</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary" id="btn-create-tenant">
            ${QrewUI.getIcon('plus')} Create Tenant
          </button>
        </div>
      </div>

      <div class="tree-view-wrapper">
        <!-- Tree Toolbar -->
        <div class="tree-toolbar">
          <div class="tree-toolbar-left" style="display:flex;align-items:center;gap:12px;flex:1;max-width:540px;">
            <div class="tree-search-wrap" style="flex:1;">
              <span class="tree-search-icon">${QrewUI.getIcon('search')}</span>
              <input type="text" class="tree-search-input" id="tenant-tree-search" placeholder="Search offices, IDs, or locations..." value="${QrewUI.escapeHtml(platformTenantTreeState.searchTerm)}">
            </div>
            <select class="select-filter" id="tenant-tree-status-filter" style="min-width:130px;height:34px;padding:4px 10px;font-size:12.5px;">
              <option value="All" ${platformTenantTreeState.statusFilter === 'All' ? 'selected' : ''}>All Statuses</option>
              <option value="Active" ${platformTenantTreeState.statusFilter === 'Active' ? 'selected' : ''}>Active</option>
              <option value="Suspended" ${platformTenantTreeState.statusFilter === 'Suspended' ? 'selected' : ''}>Suspended</option>
            </select>
          </div>

          <div class="tree-toolbar-actions">
            <span class="tree-meta-badge" id="tenants-stats-badge" style="background:var(--color-surface);color:var(--color-text-muted);border:1px solid var(--color-border);font-size:12px;padding:5px 10px;">
              ${allTenants.length} Tenant${allTenants.length === 1 ? '' : 's'} • ${totalOfficesCount} Offices
            </span>
          </div>
        </div>

        <!-- Tree Nodes List -->
        <div class="tree-root-list" id="tenants-tree-list"></div>
      </div>
    `;

    document.getElementById('btn-create-tenant').onclick = openCreateTenantModal;

    const searchInput = document.getElementById('tenant-tree-search');
    const statusFilter = document.getElementById('tenant-tree-status-filter');

    if (searchInput) {
      searchInput.oninput = (e) => {
        platformTenantTreeState.searchTerm = e.target.value;
        renderTreeNodes();
      };
    }

    if (statusFilter) {
      statusFilter.onchange = (e) => {
        platformTenantTreeState.statusFilter = e.target.value;
        renderTreeNodes();
      };
    }

    renderTreeNodes();
  };

  // --- Platform: Platform Users ---
  const renderPlatformUsers = () => {
    updateBreadcrumbs([
      { label: 'Platform', hash: '#platform/overview' },
      { label: 'Platform Users', hash: '#platform/users' }
    ]);

    const allUsers = QrewStore.getPlatformUsers();
    let currentRoleFilter = 'All';
    let currentStatusFilter = 'All';
    let searchQuery = '';

    const filterAndRender = () => {
      let filtered = allUsers.filter(u => {
        const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              u.id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = currentRoleFilter === 'All' || u.platformRole === currentRoleFilter;
        const matchesStatus = currentStatusFilter === 'All' || u.status === currentStatusFilter;
        return matchesSearch && matchesRole && matchesStatus;
      });

      const tbody = document.getElementById('users-tbody');
      if (!tbody) return;

      if (filtered.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7">
              ${QrewUI.emptyState({
                title: 'No users found',
                description: 'Try adjusting your search criteria or role filters.'
              })}
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = filtered.map(u => `
        <tr>
          <td>
            <div style="display:flex;align-items:center;gap:10px;">
              <div class="user-avatar" style="width:28px;height:28px;font-size:11px;">
                ${u.name.split(' ').map(n=>n[0]).join('').substring(0, 2).toUpperCase()}
              </div>
              <div>
                <strong>${QrewUI.escapeHtml(u.name)}</strong>
              </div>
            </div>
          </td>
          <td>${QrewUI.escapeHtml(u.email)}</td>
          <td>${QrewUI.roleBadge(u.platformRole, 'platform')}</td>
          <td>${u.tenantCount} organizations</td>
          <td>${QrewUI.statusBadge(u.status)}</td>
          <td>${u.createdAt}</td>
          <td>
            <div class="table-actions">
              <button class="btn btn-secondary btn-sm view-user-btn" data-id="${u.id}">
                View Profile
              </button>
              <button class="action-icon-btn edit-user-role-btn" data-id="${u.id}" data-role="${u.platformRole}" title="Assign Platform Role">
                ${QrewUI.getIcon('roles')}
              </button>
              <button class="action-icon-btn toggle-user-status-btn" data-id="${u.id}" data-status="${u.status}" title="${u.status === 'Active' ? 'Deactivate' : 'Activate'}">
                ${QrewUI.getIcon('power')}
              </button>
            </div>
          </td>
        </tr>
      `).join('');

      tbody.querySelectorAll('.view-user-btn').forEach(btn => {
        btn.onclick = () => openUserDetailsModal(btn.dataset.id);
      });
      tbody.querySelectorAll('.edit-user-role-btn').forEach(btn => {
        btn.onclick = () => openEditPlatformRoleModal(btn.dataset.id, btn.dataset.role);
      });
      tbody.querySelectorAll('.toggle-user-status-btn').forEach(btn => {
        btn.onclick = () => handleToggleUserStatus(btn.dataset.id, btn.dataset.status);
      });
    };

    DOM.mainContent.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <h1 class="page-title">Platform Users</h1>
          <p class="page-subtitle">Global user accounts and platform-level credentials.</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary" id="btn-create-platform-user">
            ${QrewUI.getIcon('plus')} Add Platform User
          </button>
        </div>
      </div>

      <div class="notice-box" style="margin-bottom:16px;">
        ${QrewUI.getIcon('info')}
        <div>
          <strong>Role Separation Notice:</strong> Platform roles (Platform Owner, Admin, User) control access to this global admin portal.
          They are strictly decoupled from tenant-level and office-level roles. A Platform Owner cannot be assigned the Tenant Admin role.
        </div>
      </div>

      <!-- Toolbar -->
      <div class="table-toolbar">
        <div class="filter-group">
          <div class="search-input-wrap">
            <span class="search-icon">${QrewUI.getIcon('search')}</span>
            <input type="text" class="search-input" id="user-search" placeholder="Search users by name, email, or ID...">
          </div>
          <select class="select-filter" id="user-role-filter">
            <option value="All">All Platform Roles</option>
            <option value="Platform Owner">Platform Owner</option>
            <option value="Platform Admin">Platform Admin</option>
            <option value="Platform User">Platform User</option>
          </select>
          <select class="select-filter" id="user-status-filter">
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      <!-- Table -->
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>User Name</th>
              <th>Email</th>
              <th>Platform Role</th>
              <th>Tenant Memberships</th>
              <th>Status</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="users-tbody"></tbody>
        </table>
      </div>
    `;

    document.getElementById('btn-create-platform-user').onclick = openCreatePlatformUserModal;
    document.getElementById('user-search').oninput = (e) => {
      searchQuery = e.target.value;
      filterAndRender();
    };
    document.getElementById('user-role-filter').onchange = (e) => {
      currentRoleFilter = e.target.value;
      filterAndRender();
    };
    document.getElementById('user-status-filter').onchange = (e) => {
      currentStatusFilter = e.target.value;
      filterAndRender();
    };

    filterAndRender();
  };

  // --- Platform: Platform Roles ---
  const renderPlatformRoles = () => {
    updateBreadcrumbs([
      { label: 'Platform', hash: '#platform/overview' },
      { label: 'Platform Roles', hash: '#platform/roles' }
    ]);

    const platformRoles = QrewStore.getRoles('platform');
    let currentRole = platformRoles.find(r => r.id === AppState.selectedRoleId) || platformRoles[0];

    DOM.mainContent.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <h1 class="page-title">Platform Roles</h1>
          <p class="page-subtitle">Platform-level access control roles and global administrative capabilities.</p>
        </div>
      </div>

      <div class="notice-box" style="margin-bottom:20px;">
        ${QrewUI.getIcon('info')}
        <div>
          <strong>Strict Level Isolation:</strong> Platform roles manage system-wide assets and tenant provisioning.
          <em>Governance Rule: A Platform Owner cannot hold the Tenant Admin role.</em>
        </div>
      </div>

      <!-- Roles Grid -->
      <div class="roles-grid">
        ${platformRoles.map(role => {
          const assignedCount = QrewStore.getAssignedCountForRole(role.name, 'platform');
          const isSelected = role.id === currentRole.id;
          return `
            <div class="role-card ${isSelected ? 'selected' : ''}" data-roleid="${role.id}">
              <div class="role-card-header">
                <div>
                  <h3 class="role-card-title">${QrewUI.escapeHtml(role.name)}</h3>
                  <div style="margin-top:4px;">${QrewUI.roleBadge(role.name, 'platform')}</div>
                </div>
                <div style="font-size:11px;font-weight:600;color:var(--color-accent);">
                  ${role.permissions.length} perms
                </div>
              </div>
              <p class="role-card-desc">${QrewUI.escapeHtml(role.description)}</p>
              <div class="role-card-meta">
                <span>Assigned Members:</span>
                <strong>${assignedCount} users</strong>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Permissions Inspector -->
      <div class="permissions-matrix-card">
        <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--color-border-subtle);padding-bottom:16px;">
          <div>
            <h3 style="font-size:16px;font-weight:600;color:var(--color-text-primary);">
              Permissions for "${QrewUI.escapeHtml(currentRole.name)}"
            </h3>
            <p style="font-size:12.5px;color:var(--color-text-muted);">
              Granular capabilities authorized for this platform-level role.
            </p>
          </div>
          <button class="btn btn-secondary btn-sm" id="btn-verify-plt-perms">
            ${QrewUI.getIcon('check')} Verify Permissions
          </button>
        </div>

        <div class="permission-groups-grid">
          <div class="permission-group-card">
            <div class="permission-group-title">
              <span>Platform Core</span>
              <span class="id-badge">platform_*</span>
            </div>
            <div class="permission-list">
              ${['platform_read', 'platform_crud'].map(perm => `
                <label class="permission-item">
                  <input type="checkbox" class="permission-checkbox" ${currentRole.permissions.includes(perm) ? 'checked' : ''} disabled>
                  <span>${perm}</span>
                </label>
              `).join('')}
            </div>
          </div>

          <div class="permission-group-card">
            <div class="permission-group-title">
              <span>Tenant Provisioning</span>
              <span class="id-badge">tenant_*</span>
            </div>
            <div class="permission-list">
              ${['tenant_create', 'tenant_read', 'tenant_update', 'tenant_delete'].map(perm => `
                <label class="permission-item">
                  <input type="checkbox" class="permission-checkbox" ${currentRole.permissions.includes(perm) ? 'checked' : ''} disabled>
                  <span>${perm}</span>
                </label>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    DOM.mainContent.querySelectorAll('.role-card').forEach(card => {
      card.onclick = () => {
        AppState.selectedRoleId = card.dataset.roleid;
        renderPlatformRoles();
      };
    });

    const verifyBtn = document.getElementById('btn-verify-plt-perms');
    if (verifyBtn) {
      verifyBtn.onclick = () => {
        QrewUI.showToast(`Role capabilities verified for ${currentRole.name}.`, 'success');
      };
    }
  };

  // --- Platform: Audit Logs ---
  const renderPlatformAuditLogs = () => {
    updateBreadcrumbs([
      { label: 'Platform', hash: '#platform/overview' },
      { label: 'Audit Logs', hash: '#platform/audit-logs' }
    ]);

    const allLogs = QrewStore.getAuditLogs();
    let actionFilter = 'All';
    let resourceFilter = 'All';
    let searchQuery = '';

    const filterAndRenderTable = () => {
      let filtered = allLogs.filter(log => {
        const matchesSearch = log.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              log.resourceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              log.id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesAction = actionFilter === 'All' || log.action === actionFilter;
        const matchesResource = resourceFilter === 'All' || log.resourceType === resourceFilter;
        return matchesSearch && matchesAction && matchesResource;
      });

      const tbody = document.getElementById('audit-tbody');
      if (!tbody) return;

      if (filtered.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7">
              ${QrewUI.emptyState({
                title: 'No matching audit records',
                description: 'No events match the provided search filters.'
              })}
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = filtered.map(log => `
        <tr>
          <td><span class="id-badge">${log.id}</span></td>
          <td>
            <strong>${QrewUI.escapeHtml(log.actor)}</strong>
          </td>
          <td>${QrewUI.actionBadge(log.action)}</td>
          <td>${QrewUI.escapeHtml(log.resourceType)}</td>
          <td><span class="id-badge">${QrewUI.escapeHtml(log.resourceId)}</span></td>
          <td>${QrewUI.escapeHtml(log.description)}</td>
          <td style="white-space:nowrap;font-size:12px;color:var(--color-text-muted);">${log.timestamp}</td>
        </tr>
      `).join('');
    };

    DOM.mainContent.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <h1 class="page-title">Platform Audit Logs</h1>
          <p class="page-subtitle">Tamper-evident chronological activity trail of all tenant and access control actions across the platform.</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="table-toolbar">
        <div class="filter-group">
          <div class="search-input-wrap">
            <span class="search-icon">${QrewUI.getIcon('search')}</span>
            <input type="text" class="search-input" id="audit-search" placeholder="Search actor, resource ID, or description...">
          </div>
          <select class="select-filter" id="audit-action-filter">
            <option value="All">All Actions</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="STATUS_CHANGE">STATUS_CHANGE</option>
            <option value="ADD_MEMBER">ADD_MEMBER</option>
            <option value="ASSIGN_ROLE">ASSIGN_ROLE</option>
          </select>
          <select class="select-filter" id="audit-resource-filter">
            <option value="All">All Resource Types</option>
            <option value="Tenant">Tenant</option>
            <option value="Office">Office</option>
            <option value="Tenant Member">Tenant Member</option>
            <option value="Office Staff">Office Staff</option>
            <option value="Platform User">Platform User</option>
          </select>
        </div>
        <div style="font-size:12.5px;color:var(--color-text-muted);">
          Sorted by newest-first
        </div>
      </div>

      <!-- Table -->
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Log ID</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Resource Type</th>
              <th>Resource ID</th>
              <th>Description</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody id="audit-tbody"></tbody>
        </table>
      </div>
    `;

    document.getElementById('audit-search').oninput = (e) => {
      searchQuery = e.target.value;
      filterAndRenderTable();
    };
    document.getElementById('audit-action-filter').onchange = (e) => {
      actionFilter = e.target.value;
      filterAndRenderTable();
    };
    document.getElementById('audit-resource-filter').onchange = (e) => {
      resourceFilter = e.target.value;
      filterAndRenderTable();
    };

    filterAndRenderTable();
  };

  // ==========================================
  // 2. TENANT WORKSPACE VIEWS
  // ==========================================

  // --- Tenant: Overview ---
  const renderTenantOverview = (tenantId) => {
    const tenant = QrewStore.getTenantById(tenantId);
    if (!tenant) {
      renderTenantNotFound(tenantId);
      return;
    }

    updateBreadcrumbs([
      { label: 'Platform', hash: '#platform/overview' },
      { label: tenant.name, hash: `#tenant-landing?id=${tenant.id}` },
      { label: 'Overview', hash: `#tenant/overview?id=${tenant.id}` }
    ]);

    DOM.mainContent.innerHTML = `
      <!-- Tenant Overview Header Card -->
      <div class="detail-header-card">
        <div>
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:6px;">
            <h1 class="page-title" style="margin:0;">${QrewUI.escapeHtml(tenant.name)}</h1>
            ${QrewUI.statusBadge(tenant.status)}
          </div>
          <p class="page-subtitle">Organization tenant workspace in Qrew multi-tenant mesh</p>
        </div>

        <div class="page-actions">
          <button class="btn btn-secondary" id="btn-edit-tenant-header">
            ${QrewUI.getIcon('edit')} Edit Tenant
          </button>
          <button class="btn btn-outline" id="btn-toggle-tenant-header">
            ${tenant.status === 'Active' ? 'Suspend Tenant' : 'Activate Tenant'}
          </button>
        </div>

        <div class="detail-meta-grid">
          <div class="meta-item">
            <span class="meta-label">Tenant ID</span>
            <span class="meta-value"><span class="id-badge">${tenant.id}</span></span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Tenant Owner</span>
            <span class="meta-value">${QrewUI.escapeHtml(tenant.ownerName)}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Owner Email</span>
            <span class="meta-value">${QrewUI.escapeHtml(tenant.ownerEmail)}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Total Offices</span>
            <span class="meta-value">${tenant.officeCount}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Total Members</span>
            <span class="meta-value">${tenant.memberCount}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Created Date</span>
            <span class="meta-value">${tenant.createdAt}</span>
          </div>
        </div>
      </div>

      <!-- Quick Metrics -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">Branch Offices</span>
            <div class="metric-icon-wrap">${QrewUI.getIcon('offices')}</div>
          </div>
          <div class="metric-value-row">
            <div class="metric-value">${tenant.offices.length}</div>
            <div class="metric-subtext">Active locations</div>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">Organization Members</span>
            <div class="metric-icon-wrap">${QrewUI.getIcon('users')}</div>
          </div>
          <div class="metric-value-row">
            <div class="metric-value">${tenant.members.length}</div>
            <div class="metric-subtext">Verified personnel</div>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">Tenant Admin</span>
            <div class="metric-icon-wrap" style="color:var(--color-warning);">${QrewUI.getIcon('roles')}</div>
          </div>
          <div class="metric-value-row">
            <div style="font-size:16px;font-weight:700;">${QrewUI.escapeHtml(tenant.ownerName)}</div>
            <div class="metric-subtext">Scoped admin</div>
          </div>
        </div>
      </div>

      <!-- Quick Lists Grid -->
      <div class="dashboard-grid">
        <!-- Offices Quick Preview -->
        <div class="card">
          <div class="card-header">
            <div>
              <h2 class="card-title">Branch Offices</h2>
              <p class="card-subtitle">Facilities operating under ${QrewUI.escapeHtml(tenant.name)}</p>
            </div>
          </div>
          <div class="table-wrapper" style="border:none;box-shadow:none;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Office Name</th>
                  <th>Location</th>
                  <th>Staff</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${tenant.offices.map(o => `
                  <tr>
                    <td>
                      <a href="#office/overview?tenantId=${tenant.id}&officeId=${o.id}" class="table-row-link">
                        <strong>${QrewUI.escapeHtml(o.name)}</strong>
                      </a>
                    </td>
                    <td>${QrewUI.escapeHtml(o.location)}</td>
                    <td>${o.staffCount} staff</td>
                    <td>${QrewUI.statusBadge(o.status)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Members Quick Preview -->
        <div class="card">
          <div class="card-header">
            <div>
              <h2 class="card-title">Tenant Members</h2>
              <p class="card-subtitle">Verified users in organization</p>
            </div>
          </div>
          <div class="card-body">
            <div style="display:flex;flex-direction:column;gap:8px;">
              ${tenant.members.map(m => `
                <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;background:var(--color-surface);border-radius:var(--radius-sm);border:1px solid var(--color-border-subtle);">
                  <div>
                    <strong>${QrewUI.escapeHtml(m.user.name)}</strong>
                    <div style="font-size:11px;color:var(--color-text-muted);">${QrewUI.escapeHtml(m.user.email)}</div>
                  </div>
                  ${QrewUI.roleBadge(m.tenantRole, 'tenant')}
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-edit-tenant-header').onclick = () => openEditTenantModal(tenant.id);
    document.getElementById('btn-toggle-tenant-header').onclick = () => handleToggleTenantStatus(tenant.id, tenant.status);
  };

  // --- Tenant: Offices (Tree-View Hierarchical Explorer) ---
  let treeState = {
    expandedTenants: new Set(),
    searchTerm: ''
  };

  const renderTenantOffices = (tenantId) => {
    const tenant = QrewStore.getTenantById(tenantId) || QrewStore.getTenants()[0];
    if (!tenant) return renderTenantNotFound(tenantId);

    updateBreadcrumbs([
      { label: 'Platform', hash: '#platform/overview' },
      { label: tenant.name, hash: `#tenant-landing?id=${tenant.id}` },
      { label: 'Offices', hash: `#tenant/offices?id=${tenant.id}` }
    ]);

    // Ensure the current active tenant is expanded by default
    if (!treeState.expandedTenants.has(tenant.id) && treeState.expandedTenants.size === 0) {
      treeState.expandedTenants.add(tenant.id);
    }

    const allTenants = QrewStore.getTenants();
    const totalOfficesCount = allTenants.reduce((sum, t) => sum + (QrewStore.getOfficesByTenant(t.id) || []).length, 0);

    const renderTreeNodes = () => {
      const filter = (treeState.searchTerm || '').toLowerCase().trim();
      const treeListEl = document.getElementById('tree-root-list');
      if (!treeListEl) return;

      treeListEl.innerHTML = allTenants.map(t => {
        const tenantOffices = QrewStore.getOfficesByTenant(t.id) || [];
        const tenantMembers = QrewStore.getTenantMembers(t.id) || [];

        // Filter child offices if search term provided
        const filteredOffices = filter
          ? tenantOffices.filter(o => 
              o.name.toLowerCase().includes(filter) || 
              o.id.toLowerCase().includes(filter) || 
              (o.location && o.location.toLowerCase().includes(filter))
            )
          : tenantOffices;

        // Auto-expand if search matches offices inside this tenant
        if (filter && filteredOffices.length > 0) {
          treeState.expandedTenants.add(t.id);
        }

        const isExpanded = treeState.expandedTenants.has(t.id);

        return `
          <div class="tree-tenant-card" data-tenant-id="${t.id}">
            <!-- Tenant Root Folder Row -->
            <div class="tree-tenant-row ${isExpanded ? 'expanded' : ''}" data-tenant-id="${t.id}" role="button" tabindex="0" aria-expanded="${isExpanded ? 'true' : 'false'}" aria-label="Tenant Organization ${QrewUI.escapeHtml(t.name)}">
              <div class="tree-tenant-left">
                <span class="tree-chevron" aria-hidden="true">${QrewUI.getIcon('chevronRight')}</span>
                <span class="tree-folder-icon" aria-hidden="true">
                  ${isExpanded ? QrewUI.getIcon('folderOpen') : QrewUI.getIcon('folderClosed')}
                </span>
                <div class="tree-tenant-name-group">
                  <span class="tree-tenant-title">${QrewUI.escapeHtml(t.name)}</span>
                  <span class="tree-id-badge" title="Tenant Organization Identifier">${t.id}</span>
                </div>
              </div>

              <div class="tree-tenant-meta">
                <span class="tree-meta-item" title="Organization Account Owner">
                  <span class="tree-meta-icon">${QrewUI.getIcon('users')}</span>
                  <span class="tree-meta-label">Owner:</span>
                  <strong style="color:var(--color-text-primary);">${QrewUI.escapeHtml(t.ownerName || 'Rafiqul Islam')}</strong>
                </span>
                <span class="tree-meta-divider" aria-hidden="true">•</span>
                <span class="tree-meta-badge" title="Total Offices">
                  ${tenantOffices.length} office${tenantOffices.length === 1 ? '' : 's'}
                </span>
                <span class="tree-meta-divider" aria-hidden="true">•</span>
                <span class="tree-meta-item" title="Total Organization Members" style="color:var(--color-text-muted);">
                  ${tenantMembers.length} member${tenantMembers.length === 1 ? '' : 's'}
                </span>
                <span class="tree-meta-divider" aria-hidden="true">•</span>
                <span class="tree-meta-item">
                  ${QrewUI.statusBadge(t.status)}
                </span>
                <span class="tree-meta-divider" aria-hidden="true">•</span>
                <span class="tree-meta-date" title="Organization Created Date">
                  Est. ${t.createdAt || '2026-09-12'}
                </span>
              </div>

              <div class="tree-actions-wrap" onclick="event.stopPropagation()">
                <button class="action-icon-btn edit-tenant-btn" data-id="${t.id}" title="Edit Organization Details" aria-label="Edit Tenant Organization">
                  ${QrewUI.getIcon('edit')}
                </button>
                <div class="tree-action-dropdown-wrap">
                  <button class="action-icon-btn tree-dropdown-trigger" data-dropdown="tenant-menu-${t.id}" title="More Actions" aria-label="More Organization Actions">
                    ${QrewUI.getIcon('moreHorizontal')}
                  </button>
                  <div class="tree-action-menu" id="tenant-menu-${t.id}">
                    <button class="tree-action-item edit-tenant-btn" data-id="${t.id}">
                      ${QrewUI.getIcon('edit')} <span>Edit Organization</span>
                    </button>
                    <button class="tree-action-item toggle-tenant-btn" data-id="${t.id}" data-status="${t.status}">
                      ${QrewUI.getIcon('power')} <span>${t.status === 'Active' ? 'Suspend Organization' : 'Activate Organization'}</span>
                    </button>
                    <div class="tree-action-divider"></div>
                    <button class="tree-action-item danger delete-tenant-btn" data-id="${t.id}" data-name="${QrewUI.escapeHtml(t.name)}">
                      ${QrewUI.getIcon('trash')} <span>Delete Organization</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Child Offices Tree Branch -->
            ${isExpanded ? `
              <div class="tree-branch-container">
                ${filteredOffices.length === 0 ? `
                  <div style="padding:16px 20px;background:var(--color-surface-white);border:1px dashed var(--color-border);border-radius:var(--radius-md);display:flex;align-items:center;justify-content:space-between;">
                    <div style="display:flex;align-items:center;gap:10px;">
                      <span style="color:var(--color-text-muted);font-size:13px;">
                        ${filter ? `No offices match "${QrewUI.escapeHtml(filter)}"` : 'No offices created yet under this organization.'}
                      </span>
                    </div>
                    <button class="btn btn-secondary btn-sm create-office-tenant-btn" data-tenant-id="${t.id}">
                      ${QrewUI.getIcon('plus')} Add Office
                    </button>
                  </div>
                ` : filteredOffices.map(off => `
                  <div class="tree-office-item" data-id="${off.id}">
                    <!-- Group 1: Office Identity -->
                    <div class="tree-office-identity">
                      <div class="tree-office-icon-wrap" aria-hidden="true" title="Facility Branch">
                        ${QrewUI.getIcon('building2') || QrewUI.getIcon('building')}
                      </div>
                      <div class="tree-office-title-wrap">
                        <a href="#office/overview?tenantId=${t.id}&officeId=${off.id}" class="tree-office-name" title="Open Branch Facility Workspace">
                          ${QrewUI.escapeHtml(off.name)}
                        </a>
                        <span class="tree-id-badge" title="Branch Office Identifier">${off.id}</span>
                      </div>
                    </div>

                    <!-- Group 2: Office Metadata -->
                    <div class="tree-office-meta">
                      <span class="tree-office-location" title="Branch Physical Location">
                        ${QrewUI.getIcon('mapPin')}
                        <span>${QrewUI.escapeHtml(off.location || 'Location Not Specified')}</span>
                      </span>
                      <span class="tree-meta-divider" aria-hidden="true">•</span>
                      <span class="tree-office-staff-badge" title="Deployed Staff Members">
                        ${QrewUI.getIcon('users')}
                        <span>${off.staffCount} staff member${off.staffCount === 1 ? '' : 's'}</span>
                      </span>
                      <span class="tree-meta-divider" aria-hidden="true">•</span>
                      <span class="tree-office-status">
                        ${QrewUI.statusBadge(off.status)}
                      </span>
                    </div>

                    <!-- Group 3: Office Actions -->
                    <div class="tree-office-actions" onclick="event.stopPropagation()">
                      <div class="tree-action-dropdown-wrap">
                        <button class="action-icon-btn tree-dropdown-trigger" data-dropdown="office-menu-${off.id}" title="More Office Actions" aria-label="More Office Actions">
                          ${QrewUI.getIcon('moreHorizontal')}
                        </button>
                        <div class="tree-action-menu" id="office-menu-${off.id}">
                          <a href="#office/overview?tenantId=${t.id}&officeId=${off.id}" class="tree-action-item" title="Open Branch Hub">
                            ${QrewUI.getIcon('building')} <span>Open Branch Hub</span>
                          </a>
                          <a href="#office-admin/overview?tenantId=${t.id}&officeId=${off.id}" class="tree-action-item" title="Open Office Administration">
                            ${QrewUI.getIcon('shield')} <span>Office Admin</span>
                          </a>
                          <a href="#office-config?tenantId=${t.id}&officeId=${off.id}" class="tree-action-item" title="Configure Facility Specs, Shift Templates & Custom Fields">
                            ${QrewUI.getIcon('settings')} <span>Configure Facility Specs</span>
                          </a>
                          <button class="tree-action-item edit-office-btn" data-id="${off.id}">
                            ${QrewUI.getIcon('edit')} <span>Edit Office Details</span>
                          </button>
                          <button class="tree-action-item toggle-office-btn" data-id="${off.id}" data-status="${off.status}">
                            ${QrewUI.getIcon('power')} <span>${off.status === 'Active' ? 'Suspend Office' : 'Activate Office'}</span>
                          </button>
                          <div class="tree-action-divider"></div>
                          <button class="tree-action-item danger delete-office-btn" data-id="${off.id}" data-name="${QrewUI.escapeHtml(off.name)}" data-tenant-id="${t.id}">
                            ${QrewUI.getIcon('trash')} <span>Delete Office Branch</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            ` : ''}
          </div>
        `;
      }).join('');

      // Wire Event Handlers
      // Dropdown toggle triggers
      treeListEl.querySelectorAll('.tree-dropdown-trigger').forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          const targetMenuId = btn.dataset.dropdown;
          const targetMenu = document.getElementById(targetMenuId);
          const wasOpen = targetMenu && targetMenu.classList.contains('show');
          
          // Close all open menus first
          document.querySelectorAll('.tree-action-menu.show').forEach(m => m.classList.remove('show'));
          
          if (!wasOpen && targetMenu) {
            targetMenu.classList.add('show');
          }
        };
      });

      // Tenant Row expansion (click & keyboard)
      treeListEl.querySelectorAll('.tree-tenant-row').forEach(row => {
        row.onclick = () => {
          const tid = row.dataset.tenantId;
          if (treeState.expandedTenants.has(tid)) {
            treeState.expandedTenants.delete(tid);
          } else {
            treeState.expandedTenants.add(tid);
          }
          renderTreeNodes();
        };

        row.onkeydown = (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            row.click();
          }
        };
      });

      const closeOpenMenus = () => {
        document.querySelectorAll('.tree-action-menu.show').forEach(m => m.classList.remove('show'));
      };

      treeListEl.querySelectorAll('.edit-tenant-btn').forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          closeOpenMenus();
          openEditTenantModal(btn.dataset.id);
        };
      });

      treeListEl.querySelectorAll('.toggle-tenant-btn').forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          closeOpenMenus();
          handleToggleTenantStatus(btn.dataset.id, btn.dataset.status);
        };
      });

      treeListEl.querySelectorAll('.delete-tenant-btn').forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          closeOpenMenus();
          handleDeleteTenant(btn.dataset.id, btn.dataset.name);
        };
      });

      treeListEl.querySelectorAll('.edit-office-btn').forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          closeOpenMenus();
          openEditOfficeModal(btn.dataset.id);
        };
      });

      treeListEl.querySelectorAll('.toggle-office-btn').forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          closeOpenMenus();
          handleToggleOfficeStatus(btn.dataset.id, btn.dataset.status);
        };
      });

      treeListEl.querySelectorAll('.delete-office-btn').forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          closeOpenMenus();
          handleDeleteOffice(btn.dataset.id, btn.dataset.name, btn.dataset.tenantId || tenant.id);
        };
      });

      treeListEl.querySelectorAll('.create-office-tenant-btn').forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          closeOpenMenus();
          openCreateOfficeModal(btn.dataset.tenantId);
        };
      });
    };

    DOM.mainContent.innerHTML = `
      <div class="page-header" style="margin-bottom:20px;">
        <div class="page-title-group">
          <h1 class="page-title">Branch & Facility Offices</h1>
          <p class="page-subtitle">Hierarchical tree view of organization facilities, offices, and operational branches.</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary" id="btn-create-office">
            ${QrewUI.getIcon('plus')} Create Office
          </button>
        </div>
      </div>

      <div class="tree-view-wrapper">
        <!-- Tree Toolbar -->
        <div class="tree-toolbar">
          <div class="tree-search-wrap">
            <span class="tree-search-icon">${QrewUI.getIcon('search')}</span>
            <input type="text" class="tree-search-input" id="tree-search-input" placeholder="Search offices, IDs, or locations..." value="${QrewUI.escapeHtml(treeState.searchTerm)}">
          </div>

          <div class="tree-toolbar-actions">
            <span class="tree-meta-badge" style="background:var(--color-surface);color:var(--color-text-muted);border:1px solid var(--color-border);font-size:12px;padding:5px 10px;">
              ${allTenants.length} Tenant${allTenants.length === 1 ? '' : 's'} • ${totalOfficesCount} Offices
            </span>
          </div>
        </div>

        <!-- Tree Nodes List -->
        <div class="tree-root-list" id="tree-root-list"></div>
      </div>
    `;

    renderTreeNodes();

    // Toolbar Search Listener
    const searchInput = document.getElementById('tree-search-input');
    if (searchInput) {
      searchInput.oninput = (e) => {
        treeState.searchTerm = e.target.value;
        renderTreeNodes();
      };
    }

    document.getElementById('btn-create-office').onclick = () => openCreateOfficeModal(tenant.id);
  };

  // --- Tenant: Members ---
  const renderTenantMembers = (tenantId) => {
    const tenant = QrewStore.getTenantById(tenantId);
    if (!tenant) return renderTenantNotFound(tenantId);

    updateBreadcrumbs([
      { label: 'Platform', hash: '#platform/overview' },
      { label: tenant.name, hash: `#tenant-landing?id=${tenant.id}` },
      { label: 'Members', hash: `#tenant/members?id=${tenant.id}` }
    ]);

    const members = QrewStore.getTenantMembers(tenant.id);

    DOM.mainContent.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <h1 class="page-title">Tenant Members</h1>
          <p class="page-subtitle">Users verified with organization membership in ${QrewUI.escapeHtml(tenant.name)}.</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary" id="btn-add-tenant-member">
            ${QrewUI.getIcon('plus')} Add Member
          </button>
        </div>
      </div>

      <div class="notice-box" style="margin-bottom:16px;">
        ${QrewUI.getIcon('info')}
        <div>
          <strong>Qrew Membership & Access Governance:</strong> Tenant members hold scoped organization roles.
          <strong>A Platform Owner cannot be assigned as a Tenant Admin</strong> to enforce architectural separation between global infrastructure governance and tenant administration.
        </div>
      </div>

      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Member Name</th>
              <th>Email</th>
              <th>Tenant Role</th>
              <th>Status</th>
              <th>Joined Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${members.length === 0 ? `
              <tr>
                <td colspan="6">
                  ${QrewUI.emptyState({
                    title: 'No members in this tenant',
                    description: 'Add members to this organization to allow office assignments and access.'
                  })}
                </td>
              </tr>
            ` : members.map(m => `
              <tr>
                <td>
                  <strong>${QrewUI.escapeHtml(m.user.name)}</strong>
                </td>
                <td>${QrewUI.escapeHtml(m.user.email)}</td>
                <td>${QrewUI.roleBadge(m.tenantRole, 'tenant')}</td>
                <td>${QrewUI.statusBadge(m.status)}</td>
                <td>${m.joinedAt}</td>
                <td>
                  <div class="table-actions">
                    <button class="btn btn-secondary btn-sm change-tenant-role-btn" data-userid="${m.userId}" data-currentrole="${m.tenantRole}">
                      Change Role
                    </button>
                    <button class="action-icon-btn danger remove-tenant-member-btn" data-userid="${m.userId}" data-name="${m.user.name}" title="Remove Member">
                      ${QrewUI.getIcon('trash')}
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    document.getElementById('btn-add-tenant-member').onclick = () => openAddTenantMemberModal(tenant.id);
    DOM.mainContent.querySelectorAll('.change-tenant-role-btn').forEach(btn => {
      btn.onclick = () => openChangeTenantRoleModal(tenant.id, btn.dataset.userid, btn.dataset.currentrole);
    });
    DOM.mainContent.querySelectorAll('.remove-tenant-member-btn').forEach(btn => {
      btn.onclick = () => handleRemoveTenantMember(tenant.id, btn.dataset.userid, btn.dataset.name);
    });
  };

  // --- Tenant: Tenant Roles ---
  const renderTenantRoles = (tenantId) => {
    const tenant = QrewStore.getTenantById(tenantId);
    if (!tenant) return renderTenantNotFound(tenantId);

    updateBreadcrumbs([
      { label: 'Platform', hash: '#platform/overview' },
      { label: tenant.name, hash: `#tenant-landing?id=${tenant.id}` },
      { label: 'Tenant Roles', hash: `#tenant/roles?id=${tenant.id}` }
    ]);

    const tenantRoles = QrewStore.getRoles('tenant');
    let currentRole = tenantRoles.find(r => r.id === AppState.selectedRoleId) || tenantRoles[0];

    DOM.mainContent.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <h1 class="page-title">Tenant Roles</h1>
          <p class="page-subtitle">Roles and permissions controlling organizational administration within ${QrewUI.escapeHtml(tenant.name)}.</p>
        </div>
      </div>

      <div class="notice-box" style="margin-bottom:20px;">
        ${QrewUI.getIcon('info')}
        <div>
          <strong>Tenant Scope:</strong> Tenant roles are confined strictly to ${QrewUI.escapeHtml(tenant.name)}.
          They govern office creation and member access within this organization namespace.
        </div>
      </div>

      <!-- Roles Grid -->
      <div class="roles-grid">
        ${tenantRoles.map(role => {
          const assignedCount = tenant.members.filter(m => m.tenantRole === role.name).length;
          const isSelected = role.id === currentRole.id;
          return `
            <div class="role-card ${isSelected ? 'selected' : ''}" data-roleid="${role.id}">
              <div class="role-card-header">
                <div>
                  <h3 class="role-card-title">${QrewUI.escapeHtml(role.name)}</h3>
                  <div style="margin-top:4px;">${QrewUI.roleBadge(role.name, 'tenant')}</div>
                </div>
                <div style="font-size:11px;font-weight:600;color:var(--color-accent);">
                  ${role.permissions.length} perms
                </div>
              </div>
              <p class="role-card-desc">${QrewUI.escapeHtml(role.description)}</p>
              <div class="role-card-meta">
                <span>In this Tenant:</span>
                <strong>${assignedCount} members</strong>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Permissions Inspector -->
      <div class="permissions-matrix-card">
        <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--color-border-subtle);padding-bottom:16px;">
          <div>
            <h3 style="font-size:16px;font-weight:600;color:var(--color-text-primary);">
              Permissions for "${QrewUI.escapeHtml(currentRole.name)}"
            </h3>
            <p style="font-size:12.5px;color:var(--color-text-muted);">
              Granular capabilities authorized for this tenant role.
            </p>
          </div>
          <button class="btn btn-secondary btn-sm" id="btn-verify-ten-perms">
            ${QrewUI.getIcon('check')} Verify Permissions
          </button>
        </div>

        <div class="permission-groups-grid">
          <div class="permission-group-card">
            <div class="permission-group-title">
              <span>Tenant Resource</span>
              <span class="id-badge">tenant_*</span>
            </div>
            <div class="permission-list">
              ${['tenant_create', 'tenant_read', 'tenant_update', 'tenant_delete'].map(perm => `
                <label class="permission-item">
                  <input type="checkbox" class="permission-checkbox" ${currentRole.permissions.includes(perm) ? 'checked' : ''} disabled>
                  <span>${perm}</span>
                </label>
              `).join('')}
            </div>
          </div>

          <div class="permission-group-card">
            <div class="permission-group-title">
              <span>Office Operations</span>
              <span class="id-badge">office_*</span>
            </div>
            <div class="permission-list">
              ${['office_create', 'office_read', 'office_update', 'office_delete'].map(perm => `
                <label class="permission-item">
                  <input type="checkbox" class="permission-checkbox" ${currentRole.permissions.includes(perm) ? 'checked' : ''} disabled>
                  <span>${perm}</span>
                </label>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    DOM.mainContent.querySelectorAll('.role-card').forEach(card => {
      card.onclick = () => {
        AppState.selectedRoleId = card.dataset.roleid;
        renderTenantRoles(tenantId);
      };
    });

    const verifyBtn = document.getElementById('btn-verify-ten-perms');
    if (verifyBtn) {
      verifyBtn.onclick = () => {
        QrewUI.showToast(`Capabilities verified for ${currentRole.name}.`, 'success');
      };
    }
  };

  // ==========================================
  // 4. OFFICE CONFIGURATION CENTRE (Interface 4)
  // ==========================================
  const renderOfficeConfigCentre = (tenantId, officeId) => {
    let office = QrewStore.getOfficeById(officeId);
    if (!office) {
      const allOffices = tenantId ? QrewStore.getOfficesByTenant(tenantId) : [];
      if (allOffices.length > 0) {
        office = allOffices[0];
      } else {
        const firstTenant = QrewStore.getTenants()[0];
        const firstOffices = firstTenant ? QrewStore.getOfficesByTenant(firstTenant.id) : [];
        office = firstOffices[0];
      }
    }
    if (!office) {
      DOM.mainContent.innerHTML = `
        <div class="empty-state">
          <div class="empty-title">No Facility Available</div>
          <div class="empty-desc">Create an office branch under a tenant to configure its facility parameters.</div>
          <a href="#tenant/offices?id=${tenantId || 'ten_sst'}" class="btn btn-primary" style="margin-top:12px;">Create Branch Office</a>
        </div>
      `;
      return;
    }

    const tenant = QrewStore.getTenantById(office.tenantId) || { name: 'Tenant Organization', id: office.tenantId };
    const config = QrewStore.getOfficeConfig(office.id);
    const departments = QrewStore.getDepartments(office.id);

    DOM.mainContent.innerHTML = `
      <div class="page-header" style="margin-bottom:16px;">
        <div class="page-title-group">
          <div style="font-size:12px;color:var(--color-text-muted);margin-bottom:4px;display:flex;align-items:center;gap:6px;">
            <a href="#platform/overview" style="color:var(--color-text-muted);text-decoration:none;">Platform Standards</a>
            <span>/</span>
            <a href="#tenant-landing?id=${tenant.id}" style="color:var(--color-text-muted);text-decoration:none;">${QrewUI.escapeHtml(tenant.name)}</a>
            <span>/</span>
            <span style="color:var(--color-text-primary);font-weight:600;">Office Configuration Centre</span>
          </div>
          <h1 class="page-title" style="display:flex;align-items:center;gap:10px;">
            <span>${QrewUI.escapeHtml(office.name)}</span>
            <span class="badge" style="background:var(--color-surface);border:1px solid var(--color-border);font-size:11px;color:var(--color-accent);font-family:var(--font-mono);">${config.code}</span>
          </h1>
          <p class="page-subtitle">Configure physical plant specifications, access control tiers, operating shifts, and provision facility departments.</p>
        </div>
        <div class="page-actions">
          <a href="#tenant-landing?id=${tenant.id}" class="btn btn-secondary">
            &larr; ${QrewUI.escapeHtml(tenant.name)} Landing
          </a>
          <a href="#office/overview?tenantId=${tenant.id}&officeId=${office.id}" class="btn btn-secondary">
            &larr; Branch Hub
          </a>
          <button class="btn btn-secondary" id="btn-edit-office-specs">
            ${QrewUI.getIcon('settings')} Edit Facility Specs
          </button>
          <a href="#office-admin/overview?tenantId=${tenant.id}&officeId=${office.id}" class="btn btn-primary" id="btn-deploy-to-office">
            ${QrewUI.getIcon('arrowRight')} Deploy to Office Admin
          </a>
        </div>
      </div>

      <div class="config-layout">
        <!-- Dual Governance Linkage Banner (Tier 2 Platform Blueprint <-> Tier 3 Tenant Branch Specs) -->
        <div class="card" style="margin-bottom:14px;background:var(--color-surface);border:1px solid var(--color-border);padding:14px 18px;">
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
            <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
              <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--color-text-muted);">Dual Governance:</span>
              <div style="display:inline-flex;align-items:center;gap:6px;background:var(--color-bg);padding:4px 10px;border-radius:4px;border:1px solid var(--color-border);font-size:12px;">
                <span class="ws-tab-indicator platform" style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#9E5334;"></span>
                <span style="color:var(--color-text-muted);">Tier 2 Platform Standard:</span>
                <a href="#platform/overview" style="color:var(--color-accent);font-weight:600;text-decoration:none;">Infrastructure Blueprint</a>
              </div>
              <div style="display:inline-flex;align-items:center;gap:6px;background:var(--color-bg);padding:4px 10px;border-radius:4px;border:1px solid var(--color-border);font-size:12px;">
                <span class="ws-tab-indicator tenant" style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#B45309;"></span>
                <span style="color:var(--color-text-muted);">Tier 3 Tenant Owner:</span>
                <a href="#tenant-landing?id=${tenant.id}" style="color:var(--color-accent);font-weight:600;text-decoration:none;">${QrewUI.escapeHtml(tenant.name)} (${getTenantDomain(tenant.id)})</a>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:11.5px;color:var(--color-text-muted);">Configuration feeds into:</span>
              <a href="#office-admin/overview?tenantId=${tenant.id}&officeId=${office.id}" class="btn btn-secondary btn-sm" style="font-size:11.5px;padding:3px 9px;">
                Office Admin Panel &rarr;
              </a>
            </div>
          </div>
        </div>

        <!-- Target Facility Quick Switcher Buttons -->
        <div class="config-banner-card" style="padding:12px 18px;">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <span style="font-size:11.5px;font-weight:700;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:0.04em;margin-right:4px;">Switch Facility:</span>
            ${(tenant ? QrewStore.getOfficesByTenant(tenant.id) : []).map(o => `
              <button class="btn btn-sm ${o.id === office.id ? 'btn-primary' : 'btn-secondary'} switch-facility-btn" data-id="${o.id}">
                ${QrewUI.escapeHtml(o.name)}
              </button>
            `).join('')}
          </div>
          <div style="display:flex;align-items:center;gap:14px;font-size:12.5px;color:var(--color-text-muted);">
            <span>Governing Tenant: <strong style="color:var(--color-text-primary);">${QrewUI.escapeHtml(tenant.name)}</strong></span>
            <span>Status: ${QrewUI.statusBadge(office.status)}</span>
          </div>
        </div>

        <!-- Facility Specifications Card -->
        <div class="card">
          <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <h2 class="card-title" style="font-size:15.5px;">1. Facility Infrastructure & Security Tier</h2>
              <p class="card-subtitle">Building codes, security classification, square footage, and emergency contacts.</p>
            </div>
            <span class="badge badge-role platform" style="font-size:11px;">${QrewUI.escapeHtml(config.tier)}</span>
          </div>
          <div class="card-body">
            <div class="config-specs-grid">
              <div class="config-spec-item">
                <span class="config-spec-label">Facility Code</span>
                <span class="config-spec-val">${QrewUI.escapeHtml(config.code)}</span>
              </div>
              <div class="config-spec-item">
                <span class="config-spec-label">Security Tier</span>
                <span class="config-spec-val">${QrewUI.escapeHtml(config.tier)}</span>
              </div>
              <div class="config-spec-item">
                <span class="config-spec-label">Total Floor Area</span>
                <span class="config-spec-val">${QrewUI.escapeHtml(config.floorArea)}</span>
              </div>
              <div class="config-spec-item">
                <span class="config-spec-label">Max Occupancy</span>
                <span class="config-spec-val">${config.maxOccupancy} Personnel</span>
              </div>
              <div class="config-spec-item">
                <span class="config-spec-label">Access Control Mode</span>
                <span class="config-spec-val">${QrewUI.escapeHtml(config.accessControlMode)}</span>
              </div>
              <div class="config-spec-item">
                <span class="config-spec-label">Primary Dispatch Phone</span>
                <span class="config-spec-val">${QrewUI.escapeHtml(config.primaryContact)}</span>
              </div>
              <div class="config-spec-item">
                <span class="config-spec-label">Emergency Safety Contact</span>
                <span class="config-spec-val">${QrewUI.escapeHtml(config.emergencyContact)}</span>
              </div>
              <div class="config-spec-item">
                <span class="config-spec-label">Physical Location</span>
                <span class="config-spec-val" style="font-size:13px;font-family:inherit;">${QrewUI.escapeHtml(office.location)}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Operational Shift Configurations -->
        <div class="card">
          <div class="card-header">
            <h2 class="card-title" style="font-size:15.5px;">2. Operational Shifts & Check-In Window</h2>
            <p class="card-subtitle">Standard shift rosters enforced at physical access portals and employee timeclocks.</p>
          </div>
          <div class="card-body">
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
              <div>
                <span style="font-size:12px;color:var(--color-text-muted);display:block;margin-bottom:6px;">Operating Window Mode: <strong style="color:var(--color-text-primary);">${QrewUI.escapeHtml(config.operatingHours)}</strong></span>
                <div class="config-shifts-wrap">
                  ${(config.shifts || []).map(shift => `
                    <div class="config-shift-chip">
                      <span class="config-shift-dot"></span>
                      <span>${QrewUI.escapeHtml(shift)}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
              <div style="background:var(--color-bg);border:1px solid var(--color-border);padding:10px 16px;border-radius:var(--radius-sm);font-size:12.5px;">
                <span style="color:var(--color-text-muted);">Check-In Grace Period:</span>
                <strong style="color:var(--color-accent);margin-left:6px;">${QrewUI.escapeHtml(config.checkInGrace)}</strong>
              </div>
            </div>
          </div>
        </div>

        <!-- Department Provisioning UI -->
        <div class="card">
          <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
            <div>
              <h2 class="card-title" style="font-size:15.5px;">3. Provisioned Facility Departments</h2>
              <p class="card-subtitle">Operational divisions provisioned at this office branch. Staff and shifts are grouped within these units.</p>
            </div>
            <button class="btn btn-primary btn-sm" id="btn-provision-dept">
              ${QrewUI.getIcon('plus')} Provision Department
            </button>
          </div>
          <div class="card-body" style="padding:0;">
            <div class="table-wrapper" style="border:none;border-radius:0;">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Department</th>
                    <th>Code</th>
                    <th>Department Lead</th>
                    <th>Target Capacity</th>
                    <th>Status</th>
                    <th>Department Workspace</th>
                    <th style="text-align:right;">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${departments.length === 0 ? `
                    <tr>
                      <td colspan="7">
                        ${QrewUI.emptyState({
                          title: 'No Departments Provisioned',
                          description: 'Provision departments (e.g. Operations, Fleet, Security) to enable departmental workflows.'
                        })}
                      </td>
                    </tr>
                  ` : departments.map(d => {
                    const deptMembers = QrewStore.getDepartmentMembers(d.id);
                    return `
                      <tr>
                        <td>
                          <strong>${QrewUI.escapeHtml(d.name)}</strong>
                          ${d.description ? `<div style="font-size:11.5px;color:var(--color-text-muted);margin-top:2px;">${QrewUI.escapeHtml(d.description)}</div>` : ''}
                        </td>
                        <td><span class="id-badge">${QrewUI.escapeHtml(d.code)}</span></td>
                        <td>
                          <div style="display:flex;align-items:center;gap:6px;">
                            <span style="width:20px;height:20px;border-radius:50%;background:var(--color-surface);border:1px solid var(--color-border);display:inline-flex;align-items:center;justify-content:center;font-size:10px;font-weight:600;color:var(--color-accent);">${d.leadName.charAt(0)}</span>
                            <span>${QrewUI.escapeHtml(d.leadName)}</span>
                          </div>
                        </td>
                        <td>
                          <span style="font-weight:600;">${deptMembers.length}</span> / ${d.capacity} staff
                        </td>
                        <td>${QrewUI.statusBadge(d.status)}</td>
                        <td>
                          <a href="#department/overview?deptId=${d.id}" class="btn btn-secondary btn-sm" style="font-size:11.5px;padding:3px 8px;gap:5px;display:inline-flex;align-items:center;" title="Open Department Workspace">
                            <span>Open Workspace</span>
                            <span style="font-size:10px;">&rarr;</span>
                          </a>
                        </td>
                        <td style="text-align:right;">
                          <div class="table-actions" style="justify-content:flex-end;">
                            <button class="action-icon-btn edit-dept-btn" data-id="${d.id}" title="Edit Department Settings">
                              ${QrewUI.getIcon('edit')}
                            </button>
                            <button class="action-icon-btn danger delete-dept-btn" data-id="${d.id}" data-name="${QrewUI.escapeHtml(d.name)}" title="Deprovision Department">
                              ${QrewUI.getIcon('trash')}
                            </button>
                          </div>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Flow Transition Callout (Connecting 4 to 5) -->
        <div class="config-banner-card" style="background:var(--color-bg);border:1.5px dashed var(--color-border);">
          <div class="config-banner-info">
            <div class="config-banner-title">
              ${QrewUI.getIcon('arrowRight')}
              <span>Next Step in Flow: Deploy to Office Admin Panel</span>
            </div>
            <div class="config-banner-meta">
              Now that facility parameters and departments are configured, manage on-site staff, shifts, and daily operations in the Office Admin Panel.
            </div>
          </div>
          <div class="config-banner-actions">
            <a href="#office/overview?tenantId=${tenant.id}&officeId=${office.id}" class="btn btn-primary">
              Launch ${QrewUI.escapeHtml(office.name)} Admin &rarr;
            </a>
          </div>
        </div>
      </div>
    `;

    // Event Bindings
    DOM.mainContent.querySelectorAll('.switch-facility-btn').forEach(btn => {
      btn.onclick = () => {
        AppState.currentOfficeId = btn.dataset.id;
        const targetOffice = QrewStore.getOfficeById(AppState.currentOfficeId);
        if (targetOffice) AppState.currentTenantId = targetOffice.tenantId;
        navigateTo(`#office-config?tenantId=${AppState.currentTenantId}&officeId=${AppState.currentOfficeId}`);
      };
    });

    const editSpecsBtn = document.getElementById('btn-edit-office-specs');
    if (editSpecsBtn) {
      editSpecsBtn.onclick = () => openEditOfficeSpecsModal(office.id);
    }

    const provisionDeptBtn = document.getElementById('btn-provision-dept');
    if (provisionDeptBtn) {
      provisionDeptBtn.onclick = () => openCreateDepartmentModal(office.id);
    }

    DOM.mainContent.querySelectorAll('.edit-dept-btn').forEach(btn => {
      btn.onclick = () => openEditDepartmentModal(btn.dataset.id);
    });

    DOM.mainContent.querySelectorAll('.delete-dept-btn').forEach(btn => {
      btn.onclick = () => handleDeleteDepartment(btn.dataset.id, btn.dataset.name);
    });
  };

  const openEditOfficeSpecsModal = (officeId) => {
    const office = QrewStore.getOfficeById(officeId);
    if (!office) return;
    const config = QrewStore.getOfficeConfig(officeId);

    QrewUI.openModal({
      title: `Edit Facility Specifications: ${office.name}`,
      bodyHtml: `
        <form id="edit-specs-form">
          <div class="form-group">
            <label class="form-label" for="spec-code">Facility Code *</label>
            <input type="text" id="spec-code" class="form-input" value="${QrewUI.escapeHtml(config.code)}" required>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="spec-tier">Security &amp; Facility Tier</label>
              <select id="spec-tier" class="form-input">
                <option value="Tier 1 Headquarters" ${config.tier === 'Tier 1 Headquarters' ? 'selected' : ''}>Tier 1 Headquarters</option>
                <option value="Tier 1 Regional Hub" ${config.tier === 'Tier 1 Regional Hub' ? 'selected' : ''}>Tier 1 Regional Hub</option>
                <option value="Tier 2 Corporate Office" ${config.tier === 'Tier 2 Corporate Office' ? 'selected' : ''}>Tier 2 Corporate Office</option>
                <option value="Tier 2 Regional Hub" ${config.tier === 'Tier 2 Regional Hub' ? 'selected' : ''}>Tier 2 Regional Hub</option>
                <option value="Tier 3 Satellite Office" ${config.tier === 'Tier 3 Satellite Office' ? 'selected' : ''}>Tier 3 Satellite Office</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="spec-floors">Floor Area</label>
              <input type="text" id="spec-floors" class="form-input" value="${QrewUI.escapeHtml(config.floorArea)}">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="spec-occupancy">Max Occupancy Capacity</label>
              <input type="number" id="spec-occupancy" class="form-input" value="${config.maxOccupancy}" min="1">
            </div>
            <div class="form-group">
              <label class="form-label" for="spec-access-mode">Access Control Mechanism</label>
              <select id="spec-access-mode" class="form-input">
                <option value="Biometric + Smart Card" ${config.accessControlMode === 'Biometric + Smart Card' ? 'selected' : ''}>Biometric + Smart Card</option>
                <option value="Biometric Facial Recognition" ${config.accessControlMode === 'Biometric Facial Recognition' ? 'selected' : ''}>Biometric Facial Recognition</option>
                <option value="Smart Card RFID" ${config.accessControlMode === 'Smart Card RFID' ? 'selected' : ''}>Smart Card RFID</option>
                <option value="PIN Keypad + Keycard" ${config.accessControlMode === 'PIN Keypad + Keycard' ? 'selected' : ''}>PIN Keypad + Keycard</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="spec-primary-phone">Primary Dispatch Phone</label>
              <input type="text" id="spec-primary-phone" class="form-input" value="${QrewUI.escapeHtml(config.primaryContact)}">
            </div>
            <div class="form-group">
              <label class="form-label" for="spec-emergency-phone">Emergency Safety Contact</label>
              <input type="text" id="spec-emergency-phone" class="form-input" value="${QrewUI.escapeHtml(config.emergencyContact)}">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="spec-operating-hours">Operating Window Mode</label>
              <input type="text" id="spec-operating-hours" class="form-input" value="${QrewUI.escapeHtml(config.operatingHours)}">
            </div>
            <div class="form-group">
              <label class="form-label" for="spec-grace">Check-In Grace Period</label>
              <input type="text" id="spec-grace" class="form-input" value="${QrewUI.escapeHtml(config.checkInGrace)}">
            </div>
          </div>
        </form>
      `,
      footerHtml: `
        <button class="btn btn-secondary" onclick="QrewUI.closeModal()">Cancel</button>
        <button class="btn btn-primary" id="btn-save-specs">Save Specifications</button>
      `,
      onOpen: (modalEl) => {
        const form = modalEl.querySelector('#edit-specs-form');
        const saveBtn = modalEl.querySelector('#btn-save-specs');
        saveBtn.onclick = () => {
          if (!form.checkValidity()) {
            form.reportValidity();
            return;
          }
          const updates = {
            code: document.getElementById('spec-code').value.trim(),
            tier: document.getElementById('spec-tier').value,
            floorArea: document.getElementById('spec-floors').value.trim(),
            maxOccupancy: parseInt(document.getElementById('spec-occupancy').value, 10) || 50,
            accessControlMode: document.getElementById('spec-access-mode').value,
            primaryContact: document.getElementById('spec-primary-phone').value.trim(),
            emergencyContact: document.getElementById('spec-emergency-phone').value.trim(),
            operatingHours: document.getElementById('spec-operating-hours').value.trim(),
            checkInGrace: document.getElementById('spec-grace').value.trim()
          };
          QrewStore.saveOfficeConfig(officeId, updates);
          QrewUI.closeModal();
          QrewUI.showToast('Facility specifications updated successfully.', 'success');
          renderOfficeConfigCentre(office.tenantId, officeId);
        };
      }
    });
  };

  const openCreateDepartmentModal = (officeId) => {
    const office = QrewStore.getOfficeById(officeId);
    if (!office) return;

    QrewUI.openModal({
      title: `Provision New Department: ${office.name}`,
      bodyHtml: `
        <form id="create-dept-form">
          <div class="form-group">
            <label class="form-label" for="dept-name">Department Name *</label>
            <input type="text" id="dept-name" class="form-input" placeholder="e.g. Container Port Operations" required>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="dept-code">Department Code (2-5 uppercase chars) *</label>
              <input type="text" id="dept-code" class="form-input" placeholder="e.g. OPS" maxlength="5" required>
            </div>
            <div class="form-group">
              <label class="form-label" for="dept-capacity">Target Capacity (Staff Count) *</label>
              <input type="number" id="dept-capacity" class="form-input" value="15" min="1" max="500" required>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label" for="dept-lead">Department Supervisor / Lead Name</label>
            <input type="text" id="dept-lead" class="form-input" placeholder="e.g. Rafiqul Islam">
          </div>
          <div class="form-group">
            <label class="form-label" for="dept-desc">Department Description &amp; Scope</label>
            <textarea id="dept-desc" class="form-input" rows="2" placeholder="Brief outline of operations and responsibilities..."></textarea>
          </div>
        </form>
      `,
      footerHtml: `
        <button class="btn btn-secondary" onclick="QrewUI.closeModal()">Cancel</button>
        <button class="btn btn-primary" id="btn-submit-dept">Provision Department</button>
      `,
      onOpen: (modalEl) => {
        const form = modalEl.querySelector('#create-dept-form');
        const submitBtn = modalEl.querySelector('#btn-submit-dept');
        submitBtn.onclick = () => {
          if (!form.checkValidity()) {
            form.reportValidity();
            return;
          }
          const name = document.getElementById('dept-name').value.trim();
          const code = document.getElementById('dept-code').value.trim().toUpperCase();
          const capacity = parseInt(document.getElementById('dept-capacity').value, 10) || 10;
          const leadName = document.getElementById('dept-lead').value.trim() || 'Unassigned';
          const description = document.getElementById('dept-desc').value.trim();

          QrewStore.createDepartment({
            officeId,
            name,
            code,
            capacity,
            leadName,
            description,
            status: 'Active'
          });

          QrewUI.closeModal();
          QrewUI.showToast(`Department "${name}" provisioned successfully.`, 'success');
          renderOfficeConfigCentre(office.tenantId, officeId);
        };
      }
    });
  };

  const openEditDepartmentModal = (deptId) => {
    const dept = QrewStore.getDepartmentById(deptId);
    if (!dept) return;

    QrewUI.openModal({
      title: `Edit Department: ${dept.name}`,
      bodyHtml: `
        <form id="edit-dept-form">
          <div class="form-group">
            <label class="form-label" for="edit-dept-name">Department Name *</label>
            <input type="text" id="edit-dept-name" class="form-input" value="${QrewUI.escapeHtml(dept.name)}" required>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="edit-dept-code">Department Code *</label>
              <input type="text" id="edit-dept-code" class="form-input" value="${QrewUI.escapeHtml(dept.code)}" maxlength="5" required>
            </div>
            <div class="form-group">
              <label class="form-label" for="edit-dept-capacity">Target Capacity *</label>
              <input type="number" id="edit-dept-capacity" class="form-input" value="${dept.capacity}" min="1" required>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="edit-dept-lead">Department Supervisor / Lead</label>
              <input type="text" id="edit-dept-lead" class="form-input" value="${QrewUI.escapeHtml(dept.leadName)}">
            </div>
            <div class="form-group">
              <label class="form-label" for="edit-dept-status">Status</label>
              <select id="edit-dept-status" class="form-input">
                <option value="Active" ${dept.status === 'Active' ? 'selected' : ''}>Active</option>
                <option value="Suspended" ${dept.status === 'Suspended' ? 'selected' : ''}>Suspended</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label" for="edit-dept-desc">Description &amp; Scope</label>
            <textarea id="edit-dept-desc" class="form-input" rows="2">${QrewUI.escapeHtml(dept.description || '')}</textarea>
          </div>
        </form>
      `,
      footerHtml: `
        <button class="btn btn-secondary" onclick="QrewUI.closeModal()">Cancel</button>
        <button class="btn btn-primary" id="btn-save-dept">Save Changes</button>
      `,
      onOpen: (modalEl) => {
        const form = modalEl.querySelector('#edit-dept-form');
        const saveBtn = modalEl.querySelector('#btn-save-dept');
        saveBtn.onclick = () => {
          if (!form.checkValidity()) {
            form.reportValidity();
            return;
          }
          const updates = {
            name: document.getElementById('edit-dept-name').value.trim(),
            code: document.getElementById('edit-dept-code').value.trim().toUpperCase(),
            capacity: parseInt(document.getElementById('edit-dept-capacity').value, 10) || 10,
            leadName: document.getElementById('edit-dept-lead').value.trim() || 'Unassigned',
            status: document.getElementById('edit-dept-status').value,
            description: document.getElementById('edit-dept-desc').value.trim()
          };
          QrewStore.updateDepartment(deptId, updates);
          QrewUI.closeModal();
          QrewUI.showToast(`Department "${updates.name}" updated.`, 'success');
          if (AppState.activeWorkspace === 'office-config') {
            renderOfficeConfigCentre(AppState.currentTenantId, AppState.currentOfficeId);
          } else if (AppState.activeWorkspace === 'office') {
            renderOfficeDepartments(AppState.currentTenantId, AppState.currentOfficeId);
          }
        };
      }
    });
  };

  const handleDeleteDepartment = (deptId, deptName) => {
    QrewUI.confirmDialog({
      title: `Deprovision Department`,
      message: `Are you sure you want to deprovision "${deptName}"? Any team member allocations under this department will be unassigned.`,
      confirmText: 'Deprovision Department',
      confirmClass: 'btn-danger',
      onConfirm: () => {
        QrewStore.deleteDepartment(deptId);
        QrewUI.showToast(`Department "${deptName}" deprovisioned.`, 'success');
        if (AppState.activeWorkspace === 'office-config') {
          renderOfficeConfigCentre(AppState.currentTenantId, AppState.currentOfficeId);
        } else if (AppState.activeWorkspace === 'office') {
          renderOfficeDepartments(AppState.currentTenantId, AppState.currentOfficeId);
        }
      }
    });
  };

  // ==========================================
  // 3. OFFICE WORKSPACE VIEWS (Branch Facility Hub)
  // ==========================================

  // --- Office: Workspace (Branch Facility Hub - Interface 5a) ---
  const renderOfficeWorkspace = (tenantId, officeId) => {
    let office = QrewStore.getOfficeById(officeId);
    if (!office) {
      const allOffices = tenantId ? QrewStore.getOfficesByTenant(tenantId) : [];
      if (allOffices.length > 0) office = allOffices[0];
      else return renderOfficeNotFound(officeId);
    }

    const tenant = office.tenant || QrewStore.getTenantById(tenantId) || { name: 'Tenant Organization', id: tenantId };
    const departments = QrewStore.getDepartments(office.id);
    const config = QrewStore.getOfficeConfig(office.id);
    const activeShift = (config && config.shifts && config.shifts.length > 0) ? config.shifts[0] : { name: 'Morning', hours: '08:00 - 16:00', status: 'Active' };

    updateBreadcrumbs([
      { label: 'Platform', hash: '#platform/overview' },
      { label: tenant.name, hash: `#tenant-landing?id=${tenant.id}` },
      { label: office.name, hash: `#office/overview?tenantId=${tenant.id}&officeId=${office.id}` },
      { label: 'Branch Hub', hash: `#office/overview?tenantId=${tenant.id}&officeId=${office.id}` }
    ]);

    DOM.mainContent.innerHTML = `
      <!-- Office Facility Overview Card -->
      <div class="detail-header-card">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:16px;">
          <div>
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:6px;flex-wrap:wrap;">
              <h1 class="page-title" style="margin:0;">${QrewUI.escapeHtml(office.name)}</h1>
              ${QrewUI.statusBadge(office.status)}
              <span class="active-shift-badge">
                <span class="shift-live-dot"></span>
                Active Shift: ${activeShift.name} (${activeShift.hours})
              </span>
            </div>
            <p class="page-subtitle">On-site branch facility operated by <strong>${QrewUI.escapeHtml(tenant.name)}</strong> (${getTenantDomain(tenant.id)})</p>
          </div>

          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <a href="#tenant-landing?id=${tenant.id}" class="btn btn-secondary">
              &larr; ${QrewUI.escapeHtml(tenant.name)} Landing
            </a>
            <a href="#office-config?tenantId=${tenant.id}&officeId=${office.id}" class="btn btn-secondary">
              ${QrewUI.getIcon('settings')} Facility Specs
            </a>
            <a href="#office-admin/overview?tenantId=${tenant.id}&officeId=${office.id}" class="btn btn-primary" style="font-weight:600;">
              Office Admin Panel ⚙
            </a>
          </div>
        </div>

        <div class="detail-meta-grid" style="margin-top:16px;">
          <div class="meta-item">
            <span class="meta-label">Branch Facility ID</span>
            <span class="meta-value"><span class="id-badge">${office.id}</span></span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Governing Organization</span>
            <span class="meta-value">
              <a href="#tenant-landing?id=${tenant.id}" style="color:var(--color-accent);font-weight:600;text-decoration:none;">
                ${QrewUI.escapeHtml(tenant.name)}
              </a>
            </span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Physical Location</span>
            <span class="meta-value">${QrewUI.escapeHtml(office.location)}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Security Tier</span>
            <span class="meta-value"><span class="governance-tier-pill">${config.tier || 'Tier 2'}</span></span>
          </div>
          <div class="meta-item">
            <span class="meta-label">On-Duty Personnel</span>
            <span class="meta-value">${office.staff.length} Deployed</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Operating Units</span>
            <span class="meta-value">${departments.length} Departments</span>
          </div>
        </div>
      </div>

      <!-- Direct Office Admin Gateway Callout -->
      <div class="card" style="margin-bottom:20px;background:var(--color-surface);border:1px solid var(--color-border);padding:14px 18px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:14px;">
        <div style="display:flex;align-items:center;gap:14px;">
          <div style="width:40px;height:40px;border-radius:6px;background:var(--color-accent);color:#fff;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;box-shadow:0 2px 4px rgba(158,83,52,0.25);">⚙</div>
          <div>
            <div style="font-weight:700;font-size:14px;color:var(--color-text-primary);display:flex;align-items:center;gap:8px;">
              <span>Branch Office Administration</span>
              <span class="badge" style="background:var(--color-accent);color:#fff;font-size:10px;padding:2px 6px;">Managerial Panel</span>
            </div>
            <div style="font-size:12.5px;color:var(--color-text-muted);margin-top:2px;">Deploy verified staff from tenant pool, provision operating departments, configure branch roles, and review audit trail.</div>
          </div>
        </div>
        <a href="#office-admin/overview?tenantId=${tenant.id}&officeId=${office.id}" class="btn btn-primary" style="font-weight:600;display:inline-flex;align-items:center;gap:8px;padding:8px 16px;">
          <span>Enter Office Admin Page</span>
          <span>&rarr;</span>
        </a>
      </div>

      <!-- Quick Operational Metrics -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">Current Shift</span>
            <div class="metric-icon-wrap" style="color:var(--color-accent);">${QrewUI.getIcon('activity')}</div>
          </div>
          <div class="metric-value-row">
            <div class="metric-value" style="font-size:18px;">${activeShift.name}</div>
            <div class="metric-subtext">${activeShift.hours}</div>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">Active Departments</span>
            <div class="metric-icon-wrap">${QrewUI.getIcon('department')}</div>
          </div>
          <div class="metric-value-row">
            <div class="metric-value">${departments.length}</div>
            <div class="metric-subtext">Operational units</div>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">Staff On-Site</span>
            <div class="metric-icon-wrap">${QrewUI.getIcon('users')}</div>
          </div>
          <div class="metric-value-row">
            <div class="metric-value">${office.staff.length}</div>
            <div class="metric-subtext">Verified personnel</div>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">Branch Governance</span>
            <div class="metric-icon-wrap" style="color:var(--color-success);">${QrewUI.getIcon('check')}</div>
          </div>
          <div class="metric-value-row">
            <div class="metric-value" style="font-size:16px;">Compliant</div>
            <div class="metric-subtext">Mesh synchronized</div>
          </div>
        </div>
      </div>

      <!-- Branch Operational Departments Directory (Interface 5a -> 6 Link) -->
      <div class="card" style="margin-bottom:20px;">
        <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
          <div>
            <h2 class="card-title">Branch Operational Departments</h2>
            <p class="card-subtitle">Active operational units deployed at this facility — select a department to open its task workspace</p>
          </div>
          <a href="#office-admin/departments?tenantId=${tenant.id}&officeId=${office.id}" class="btn btn-secondary btn-sm">
            Manage Departments in Admin &rarr;
          </a>
        </div>
        <div class="table-wrapper" style="border:none;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Department</th>
                <th>Code</th>
                <th>Supervisor / Lead</th>
                <th>Staffing Level</th>
                <th>Status</th>
                <th style="text-align:right;">Department Workspace</th>
              </tr>
            </thead>
            <tbody>
              ${departments.length === 0 ? `
                <tr><td colspan="6"><div style="padding:16px;text-align:center;color:var(--color-text-muted);font-size:13px;">No departments provisioned for this facility yet. <a href="#office-config?tenantId=${tenant.id}&officeId=${office.id}">Provision in Configuration Centre</a></div></td></tr>
              ` : departments.map(d => {
                const dMembers = QrewStore.getDepartmentMembers(d.id);
                return `
                  <tr>
                    <td><strong>${QrewUI.escapeHtml(d.name)}</strong></td>
                    <td><span class="id-badge">${QrewUI.escapeHtml(d.code)}</span></td>
                    <td>${QrewUI.escapeHtml(d.leadName)}</td>
                    <td><span style="font-weight:600;">${dMembers.length}</span> / ${d.capacity} staff</td>
                    <td>${QrewUI.statusBadge(d.status)}</td>
                    <td style="text-align:right;">
                      <a href="#department/overview?deptId=${d.id}" class="btn btn-primary btn-sm" style="font-size:12px;padding:4px 10px;gap:6px;display:inline-flex;align-items:center;">
                        <span>Open Workspace</span>
                        <span>&rarr;</span>
                      </a>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- On-Site Staff Directory (Read-only operational directory) -->
      <div class="card">
        <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
          <div>
            <h2 class="card-title">On-Site Staff Directory</h2>
            <p class="card-subtitle">Active personnel deployed to this facility from parent organization</p>
          </div>
          <a href="#office-admin/staff?tenantId=${tenant.id}&officeId=${office.id}" class="btn btn-secondary btn-sm">
            ${QrewUI.getIcon('settings')} Staff Deployment &rarr;
          </a>
        </div>
        <div class="table-wrapper" style="border:none;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Staff Name</th>
                <th>Email</th>
                <th>Branch Role</th>
                <th>Status</th>
                <th>Assigned Date</th>
                <th style="text-align:right;">Member Workspace</th>
              </tr>
            </thead>
            <tbody>
              ${office.staff.map(s => `
                <tr>
                  <td><strong>${QrewUI.escapeHtml(s.user.name)}</strong></td>
                  <td>${QrewUI.escapeHtml(s.user.email)}</td>
                  <td>${QrewUI.roleBadge(s.officeRole, 'office')}</td>
                  <td>${QrewUI.statusBadge(s.status)}</td>
                  <td>${s.assignedAt}</td>
                  <td style="text-align:right;">
                    <a href="#member/overview?userId=${s.user.id}" class="btn btn-secondary btn-sm" style="font-size:11.5px;padding:3px 8px;" title="View Personal Member Workspace">
                      Member View &rarr;
                    </a>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  };

  // --- Office: Admin Overview (Interface 5b) ---
  const renderOfficeAdminOverview = (tenantId, officeId) => {
    let office = QrewStore.getOfficeById(officeId);
    if (!office) {
      const allOffices = tenantId ? QrewStore.getOfficesByTenant(tenantId) : [];
      if (allOffices.length > 0) office = allOffices[0];
      else return renderOfficeNotFound(officeId);
    }

    const tenant = office.tenant || QrewStore.getTenantById(tenantId) || { name: 'Tenant Organization', id: tenantId };
    const departments = QrewStore.getDepartments(office.id);
    const tenantMembers = QrewStore.getTenantMembers(tenant.id);
    const assignedUserIds = new Set(office.staff.map(s => s.user.id));
    const availablePool = tenantMembers.filter(m => !assignedUserIds.has(m.user.id));

    updateBreadcrumbs([
      { label: 'Platform', hash: '#platform/overview' },
      { label: tenant.name, hash: `#tenant-landing?id=${tenant.id}` },
      { label: office.name, hash: `#office/overview?tenantId=${tenant.id}&officeId=${office.id}` },
      { label: 'Office Admin', hash: `#office-admin/overview?tenantId=${tenant.id}&officeId=${office.id}` }
    ]);

    DOM.mainContent.innerHTML = `
      <!-- Office Admin Header Card -->
      <div class="detail-header-card">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:16px;">
          <div>
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:6px;flex-wrap:wrap;">
              <h1 class="page-title" style="margin:0;">Office Admin: ${QrewUI.escapeHtml(office.name)}</h1>
              <span class="badge" style="background:var(--color-accent);color:#fff;font-size:11px;font-weight:600;padding:3px 8px;border-radius:4px;">Administration</span>
            </div>
            <p class="page-subtitle">Managerial governance, staff deployment, and department provisioning for <strong>${QrewUI.escapeHtml(tenant.name)}</strong></p>
          </div>

          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <a href="#tenant-landing?id=${tenant.id}" class="btn btn-secondary">
              &larr; ${QrewUI.escapeHtml(tenant.name)} Landing
            </a>
            <a href="#office/overview?tenantId=${tenant.id}&officeId=${office.id}" class="btn btn-secondary">
              &larr; Return to Branch Hub
            </a>
            <a href="#office-config?tenantId=${tenant.id}&officeId=${office.id}" class="btn btn-secondary">
              ${QrewUI.getIcon('settings')} Facility Specs
            </a>
          </div>
        </div>

        <div class="detail-meta-grid" style="margin-top:16px;">
          <div class="meta-item">
            <span class="meta-label">Branch Office ID</span>
            <span class="meta-value"><span class="id-badge">${office.id}</span></span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Parent Organization</span>
            <span class="meta-value">
              <a href="#tenant-landing?id=${tenant.id}" style="color:var(--color-accent);font-weight:600;text-decoration:none;">
                ${QrewUI.escapeHtml(tenant.name)}
              </a>
            </span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Assigned Staff</span>
            <span class="meta-value">${office.staff.length} Personnel</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Available Tenant Pool</span>
            <span class="meta-value"><strong style="color:var(--color-accent);">${availablePool.length}</strong> verified candidates</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Departments</span>
            <span class="meta-value">${departments.length} Units</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Operational Status</span>
            <span class="meta-value">${QrewUI.statusBadge(office.status)}</span>
          </div>
        </div>
      </div>

      <!-- Strict Scoping Notice -->
      <div class="notice-box" style="margin-bottom:20px;">
        ${QrewUI.getIcon('info')}
        <div>
          <strong>Strict Tenant Pool Scoping:</strong> Branch managers can only deploy staff who are already verified members of <strong>${QrewUI.escapeHtml(tenant.name)}</strong>.
          Recruiting unverified external individuals at the branch office level is prohibited by platform governance.
        </div>
      </div>

      <!-- Admin Metrics -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">Assigned Branch Staff</span>
            <div class="metric-icon-wrap">${QrewUI.getIcon('users')}</div>
          </div>
          <div class="metric-value-row">
            <div class="metric-value">${office.staff.length}</div>
            <div class="metric-subtext">On-site deployed</div>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">Verified Pool Available</span>
            <div class="metric-icon-wrap" style="color:var(--color-accent);">${QrewUI.getIcon('plus')}</div>
          </div>
          <div class="metric-value-row">
            <div class="metric-value">${availablePool.length}</div>
            <div class="metric-subtext">Ready for deployment</div>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">Provisioned Departments</span>
            <div class="metric-icon-wrap">${QrewUI.getIcon('department')}</div>
          </div>
          <div class="metric-value-row">
            <div class="metric-value">${departments.length}</div>
            <div class="metric-subtext">Operational units</div>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">Admin Role Perms</span>
            <div class="metric-icon-wrap">${QrewUI.getIcon('roles')}</div>
          </div>
          <div class="metric-value-row">
            <div class="metric-value">3 Roles</div>
            <div class="metric-subtext">Manager, Supv, Staff</div>
          </div>
        </div>
      </div>

      <!-- Staff Deployment Section -->
      <div class="card" style="margin-bottom:20px;">
        <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
          <div>
            <h2 class="card-title">Staff Deployment from Verified Tenant Pool</h2>
            <p class="card-subtitle">Deploy verified members of ${QrewUI.escapeHtml(tenant.name)} to on-site roles at this branch facility</p>
          </div>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-primary btn-sm" id="btn-admin-deploy-staff">
              ${QrewUI.getIcon('plus')} Deploy Staff from Pool
            </button>
            <a href="#office-admin/staff?tenantId=${tenant.id}&officeId=${office.id}" class="btn btn-secondary btn-sm">
              Full Staff Management &rarr;
            </a>
          </div>
        </div>
        <div class="table-wrapper" style="border:none;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Personnel</th>
                <th>Email</th>
                <th>Branch Role</th>
                <th>Assigned Date</th>
                <th>Status</th>
                <th style="text-align:right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${office.staff.slice(0, 5).map(s => `
                <tr>
                  <td><strong>${QrewUI.escapeHtml(s.user.name)}</strong></td>
                  <td>${QrewUI.escapeHtml(s.user.email)}</td>
                  <td>${QrewUI.roleBadge(s.officeRole, 'office')}</td>
                  <td>${s.assignedAt}</td>
                  <td>${QrewUI.statusBadge(s.status)}</td>
                  <td style="text-align:right;">
                    <a href="#member/overview?userId=${s.user.id}" class="btn btn-secondary btn-sm" style="font-size:11px;padding:3px 8px;">
                      View Member &rarr;
                    </a>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Department Setup Section -->
      <div class="card">
        <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
          <div>
            <h2 class="card-title">Department Setup & Provisioning</h2>
            <p class="card-subtitle">Manage branch operational departments, leadership assignments, and capacity limits</p>
          </div>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-primary btn-sm" id="btn-admin-add-dept">
              ${QrewUI.getIcon('plus')} Add Department
            </button>
            <a href="#office-admin/departments?tenantId=${tenant.id}&officeId=${office.id}" class="btn btn-secondary btn-sm">
              All Departments &rarr;
            </a>
          </div>
        </div>
        <div class="table-wrapper" style="border:none;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Department Name</th>
                <th>Code</th>
                <th>Lead / Supervisor</th>
                <th>Capacity</th>
                <th>Status</th>
                <th style="text-align:right;">Manage</th>
              </tr>
            </thead>
            <tbody>
              ${departments.slice(0, 4).map(d => `
                <tr>
                  <td><strong>${QrewUI.escapeHtml(d.name)}</strong></td>
                  <td><span class="id-badge">${QrewUI.escapeHtml(d.code)}</span></td>
                  <td>${QrewUI.escapeHtml(d.leadName)}</td>
                  <td>${d.capacity} Personnel</td>
                  <td>${QrewUI.statusBadge(d.status)}</td>
                  <td style="text-align:right;">
                    <a href="#department/overview?deptId=${d.id}" class="btn btn-secondary btn-sm" style="font-size:11.5px;padding:3px 8px;">
                      Workspace &rarr;
                    </a>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Bind Deploy Staff modal button
    const deployBtn = document.getElementById('btn-admin-deploy-staff');
    if (deployBtn) {
      deployBtn.addEventListener('click', () => {
        openAddOfficeStaffModal(office.id);
      });
    }

    // Bind Add Department modal button
    const addDeptBtn = document.getElementById('btn-admin-add-dept');
    if (addDeptBtn) {
      addDeptBtn.addEventListener('click', () => {
        openCreateDepartmentModal(office.id);
      });
    }
  };

  // Backward compatibility alias
  const renderOfficeOverview = renderOfficeWorkspace;

  // --- Office: Departments (Interface 5) ---
  const renderOfficeDepartments = (tenantId, officeId) => {
    const office = QrewStore.getOfficeById(officeId);
    if (!office) return renderOfficeNotFound(officeId);

    const tenant = office.tenant || QrewStore.getTenantById(tenantId);
    const departments = QrewStore.getDepartments(office.id);

    DOM.mainContent.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <div style="font-size:12px;color:var(--color-text-muted);margin-bottom:4px;display:flex;align-items:center;gap:6px;">
            <a href="#tenant-landing?id=${tenant.id}" style="color:var(--color-text-muted);text-decoration:none;">${QrewUI.escapeHtml(tenant.name)}</a>
            <span>/</span>
            <a href="#office-admin/overview?tenantId=${tenant.id}&officeId=${office.id}" style="color:var(--color-text-muted);text-decoration:none;">${QrewUI.escapeHtml(office.name)} (Admin)</a>
            <span>/</span>
            <span style="color:var(--color-text-primary);font-weight:600;">Departments Setup</span>
          </div>
          <h1 class="page-title">Branch Operational Departments</h1>
          <p class="page-subtitle">Departments established at ${QrewUI.escapeHtml(office.name)}. Staff allocations and daily task queues run within these units.</p>
        </div>
        <div class="page-actions">
          <a href="#tenant-landing?id=${tenant.id}" class="btn btn-secondary">
            &larr; ${QrewUI.escapeHtml(tenant.name)} Landing
          </a>
          <a href="#office/overview?tenantId=${tenant.id}&officeId=${office.id}" class="btn btn-secondary">
            &larr; Branch Hub
          </a>
          <a href="#office-config?tenantId=${tenant.id}&officeId=${office.id}" class="btn btn-secondary">
            ${QrewUI.getIcon('settings')} Facility Specs &amp; Config
          </a>
          <button class="btn btn-primary" id="btn-office-provision-dept">
            ${QrewUI.getIcon('plus')} Provision Department
          </button>
        </div>
      </div>

      <div class="card">
        <div class="card-body" style="padding:0;">
          <div class="table-wrapper" style="border:none;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Department Name</th>
                  <th>Code</th>
                  <th>Department Supervisor</th>
                  <th>Staff Roster</th>
                  <th>Status</th>
                  <th>Department Workspace</th>
                  <th style="text-align:right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${departments.length === 0 ? `
                  <tr>
                    <td colspan="7">
                      ${QrewUI.emptyState({
                        title: 'No Departments Established',
                        description: 'Provision departments (e.g. Operations, Logistics, Security) to enable departmental rosters.'
                      })}
                    </td>
                  </tr>
                ` : departments.map(d => {
                  const dMembers = QrewStore.getDepartmentMembers(d.id);
                  return `
                    <tr>
                      <td>
                        <strong>${QrewUI.escapeHtml(d.name)}</strong>
                        ${d.description ? `<div style="font-size:11.5px;color:var(--color-text-muted);margin-top:2px;">${QrewUI.escapeHtml(d.description)}</div>` : ''}
                      </td>
                      <td><span class="id-badge">${QrewUI.escapeHtml(d.code)}</span></td>
                      <td>
                        <div style="display:flex;align-items:center;gap:6px;">
                          <span style="width:20px;height:20px;border-radius:50%;background:var(--color-surface);border:1px solid var(--color-border);display:inline-flex;align-items:center;justify-content:center;font-size:10px;font-weight:600;color:var(--color-accent);">${d.leadName.charAt(0)}</span>
                          <span>${QrewUI.escapeHtml(d.leadName)}</span>
                        </div>
                      </td>
                      <td>
                        <span style="font-weight:600;">${dMembers.length}</span> / ${d.capacity} personnel
                      </td>
                      <td>${QrewUI.statusBadge(d.status)}</td>
                      <td>
                        <a href="#department/overview?deptId=${d.id}" class="btn btn-secondary btn-sm" style="font-size:11.5px;padding:3px 8px;gap:5px;display:inline-flex;align-items:center;" title="Open Department Workspace">
                          <span>Enter Hub</span>
                          <span style="font-size:10px;">&rarr;</span>
                        </a>
                      </td>
                      <td style="text-align:right;">
                        <div class="table-actions" style="justify-content:flex-end;">
                          <button class="action-icon-btn edit-dept-btn" data-id="${d.id}" title="Edit Department">
                            ${QrewUI.getIcon('edit')}
                          </button>
                          <button class="action-icon-btn danger delete-dept-btn" data-id="${d.id}" data-name="${QrewUI.escapeHtml(d.name)}" title="Deprovision Department">
                            ${QrewUI.getIcon('trash')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    const provisionBtn = document.getElementById('btn-office-provision-dept');
    if (provisionBtn) {
      provisionBtn.onclick = () => openCreateDepartmentModal(office.id);
    }

    DOM.mainContent.querySelectorAll('.edit-dept-btn').forEach(btn => {
      btn.onclick = () => openEditDepartmentModal(btn.dataset.id);
    });

    DOM.mainContent.querySelectorAll('.delete-dept-btn').forEach(btn => {
      btn.onclick = () => handleDeleteDepartment(btn.dataset.id, btn.dataset.name);
    });
  };

  // --- Office: Staff ---
  const renderOfficeStaff = (tenantId, officeId) => {
    const office = QrewStore.getOfficeById(officeId);
    if (!office) return renderOfficeNotFound(officeId);

    const tenant = office.tenant || QrewStore.getTenantById(tenantId);

    updateBreadcrumbs([
      { label: 'Platform', hash: '#platform/overview' },
      { label: tenant.name, hash: `#tenant-landing?id=${tenant.id}` },
      { label: office.name, hash: `#office-admin/overview?tenantId=${tenant.id}&officeId=${office.id}` },
      { label: 'Staff Deployment', hash: `#office-admin/staff?tenantId=${tenant.id}&officeId=${office.id}` }
    ]);

    DOM.mainContent.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <div style="font-size:12px;color:var(--color-text-muted);margin-bottom:4px;display:flex;align-items:center;gap:6px;">
            <a href="#tenant-landing?id=${tenant.id}" style="color:var(--color-text-muted);text-decoration:none;">${QrewUI.escapeHtml(tenant.name)}</a>
            <span>/</span>
            <a href="#office-admin/overview?tenantId=${tenant.id}&officeId=${office.id}" style="color:var(--color-text-muted);text-decoration:none;">${QrewUI.escapeHtml(office.name)} (Admin)</a>
            <span>/</span>
            <span style="color:var(--color-text-primary);font-weight:600;">Staff Deployment</span>
          </div>
          <h1 class="page-title">Assigned Office Staff</h1>
          <p class="page-subtitle">Operational personnel deployed on-site at ${QrewUI.escapeHtml(office.name)} from the verified tenant pool.</p>
        </div>
        <div class="page-actions">
          <a href="#tenant-landing?id=${tenant.id}" class="btn btn-secondary">
            &larr; ${QrewUI.escapeHtml(tenant.name)} Landing
          </a>
          <a href="#office/overview?tenantId=${tenant.id}&officeId=${office.id}" class="btn btn-secondary">
            &larr; Branch Hub
          </a>
          <button class="btn btn-primary" id="btn-add-office-staff">
            ${QrewUI.getIcon('plus')} Deploy Staff from Pool
          </button>
        </div>
      </div>

      <!-- Business Rule Callout -->
      <div class="notice-box" style="margin-bottom:20px;">
        ${QrewUI.getIcon('info')}
        <div>
          <strong>Enforced Business Rule:</strong> Only users who already belong to parent tenant 
          (<strong>${QrewUI.escapeHtml(tenant.name)}</strong>) can be assigned as staff in this office.
          A single user can hold different office roles across different branches.
        </div>
      </div>

      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Staff Name</th>
              <th>Email</th>
              <th>Office Role</th>
              <th>Status</th>
              <th>Assigned Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${office.staff.length === 0 ? `
              <tr>
                <td colspan="6">
                  ${QrewUI.emptyState({
                    title: 'No staff members assigned',
                    description: `Select from verified members of ${tenant.name} to assign to this office.`
                  })}
                </td>
              </tr>
            ` : office.staff.map(s => `
              <tr>
                <td><strong>${QrewUI.escapeHtml(s.user.name)}</strong></td>
                <td>${QrewUI.escapeHtml(s.user.email)}</td>
                <td>${QrewUI.roleBadge(s.officeRole, 'office')}</td>
                <td>${QrewUI.statusBadge(s.status)}</td>
                <td>${s.assignedAt}</td>
                <td>
                  <div class="table-actions">
                    <button class="btn btn-secondary btn-sm change-office-role-btn" data-userid="${s.userId}" data-currentrole="${s.officeRole}">
                      Change Role
                    </button>
                    <button class="action-icon-btn danger remove-office-staff-btn" data-userid="${s.userId}" data-name="${s.user.name}" title="Remove Staff">
                      ${QrewUI.getIcon('trash')}
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    document.getElementById('btn-add-office-staff').onclick = () => openAddOfficeStaffModal(office.id);
    DOM.mainContent.querySelectorAll('.change-office-role-btn').forEach(btn => {
      btn.onclick = () => openChangeOfficeRoleModal(office.id, btn.dataset.userid, btn.dataset.currentrole);
    });
    DOM.mainContent.querySelectorAll('.remove-office-staff-btn').forEach(btn => {
      btn.onclick = () => handleRemoveOfficeStaff(office.id, btn.dataset.userid, btn.dataset.name);
    });
  };

  // --- Office: Roles & Permissions ---
  const renderOfficeRoles = (tenantId, officeId) => {
    const office = QrewStore.getOfficeById(officeId);
    if (!office) return renderOfficeNotFound(officeId);

    const tenant = office.tenant || QrewStore.getTenantById(tenantId);

    updateBreadcrumbs([
      { label: 'Platform', hash: '#platform/overview' },
      { label: tenant.name, hash: `#tenant-landing?id=${tenant.id}` },
      { label: office.name, hash: `#office-admin/overview?tenantId=${tenant.id}&officeId=${office.id}` },
      { label: 'Roles & Permissions', hash: `#office-admin/roles?tenantId=${tenant.id}&officeId=${office.id}` }
    ]);

    const officeRoles = QrewStore.getRoles('office');
    let currentRole = officeRoles.find(r => r.id === AppState.selectedRoleId) || officeRoles[0];

    DOM.mainContent.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <div style="font-size:12px;color:var(--color-text-muted);margin-bottom:4px;display:flex;align-items:center;gap:6px;">
            <a href="#tenant-landing?id=${tenant.id}" style="color:var(--color-text-muted);text-decoration:none;">${QrewUI.escapeHtml(tenant.name)}</a>
            <span>/</span>
            <a href="#office-admin/overview?tenantId=${tenant.id}&officeId=${office.id}" style="color:var(--color-text-muted);text-decoration:none;">${QrewUI.escapeHtml(office.name)} (Admin)</a>
            <span>/</span>
            <span style="color:var(--color-text-primary);font-weight:600;">Roles & Permissions</span>
          </div>
          <h1 class="page-title">Office Roles & Permissions</h1>
          <p class="page-subtitle">Roles and permissions controlling physical facility operations for ${QrewUI.escapeHtml(office.name)}.</p>
        </div>
        <div class="page-actions">
          <a href="#tenant-landing?id=${tenant.id}" class="btn btn-secondary">
            &larr; ${QrewUI.escapeHtml(tenant.name)} Landing
          </a>
          <a href="#office/overview?tenantId=${tenant.id}&officeId=${office.id}" class="btn btn-secondary">
            &larr; Branch Hub
          </a>
          <a href="#office-admin/overview?tenantId=${tenant.id}&officeId=${office.id}" class="btn btn-secondary">
            Office Admin &rarr;
          </a>
        </div>
      </div>

      <div class="notice-box" style="margin-bottom:20px;">
        ${QrewUI.getIcon('info')}
        <div>
          <strong>Office Scoping:</strong> These roles apply specifically within this branch office.
          A staff member may hold Office Manager here while being a regular Office Staff member at another branch.
        </div>
      </div>

      <!-- Roles Grid -->
      <div class="roles-grid">
        ${officeRoles.map(role => {
          const assignedCount = office.staff.filter(s => s.officeRole === role.name).length;
          const isSelected = role.id === currentRole.id;
          return `
            <div class="role-card ${isSelected ? 'selected' : ''}" data-roleid="${role.id}">
              <div class="role-card-header">
                <div>
                  <h3 class="role-card-title">${QrewUI.escapeHtml(role.name)}</h3>
                  <div style="margin-top:4px;">${QrewUI.roleBadge(role.name, 'office')}</div>
                </div>
                <div style="font-size:11px;font-weight:600;color:var(--color-accent);">
                  ${role.permissions.length} perms
                </div>
              </div>
              <p class="role-card-desc">${QrewUI.escapeHtml(role.description)}</p>
              <div class="role-card-meta">
                <span>In this Office:</span>
                <strong>${assignedCount} staff</strong>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Permissions Inspector -->
      <div class="permissions-matrix-card">
        <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--color-border-subtle);padding-bottom:16px;">
          <div>
            <h3 style="font-size:16px;font-weight:600;color:var(--color-text-primary);">
              Permissions for "${QrewUI.escapeHtml(currentRole.name)}"
            </h3>
            <p style="font-size:12.5px;color:var(--color-text-muted);">
              Operational capabilities authorized on-site at this office branch.
            </p>
          </div>
          <button class="btn btn-secondary btn-sm" id="btn-verify-off-perms">
            ${QrewUI.getIcon('check')} Verify Permissions
          </button>
        </div>

        <div class="permission-groups-grid">
          <div class="permission-group-card">
            <div class="permission-group-title">
              <span>Branch Access</span>
              <span class="id-badge">office_*</span>
            </div>
            <div class="permission-list">
              ${['office_read', 'office_update'].map(perm => `
                <label class="permission-item">
                  <input type="checkbox" class="permission-checkbox" ${currentRole.permissions.includes(perm) ? 'checked' : ''} disabled>
                  <span>${perm}</span>
                </label>
              `).join('')}
            </div>
          </div>

          <div class="permission-group-card">
            <div class="permission-group-title">
              <span>Office Staff Management</span>
              <span class="id-badge">office_*_off_mem</span>
            </div>
            <div class="permission-list">
              ${['office_create_off_mem', 'office_read_off_mem', 'office_update_off_mem', 'office_del_off_mem'].map(perm => `
                <label class="permission-item">
                  <input type="checkbox" class="permission-checkbox" ${currentRole.permissions.includes(perm) ? 'checked' : ''} disabled>
                  <span>${perm}</span>
                </label>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    DOM.mainContent.querySelectorAll('.role-card').forEach(card => {
      card.onclick = () => {
        AppState.selectedRoleId = card.dataset.roleid;
        renderOfficeRoles(tenantId, officeId);
      };
    });

    const verifyBtn = document.getElementById('btn-verify-off-perms');
    if (verifyBtn) {
      verifyBtn.onclick = () => {
        QrewUI.showToast(`Capabilities verified for ${currentRole.name}.`, 'success');
      };
    }
  };

  // --- Office: Activity ---
  const renderOfficeActivity = (tenantId, officeId) => {
    const office = QrewStore.getOfficeById(officeId);
    if (!office) return renderOfficeNotFound(officeId);

    const tenant = office.tenant || QrewStore.getTenantById(tenantId);

    updateBreadcrumbs([
      { label: 'Platform', hash: '#platform/overview' },
      { label: tenant.name, hash: `#tenant-landing?id=${tenant.id}` },
      { label: office.name, hash: `#office-admin/overview?tenantId=${tenant.id}&officeId=${office.id}` },
      { label: 'Activity', hash: `#office-admin/activity?tenantId=${tenant.id}&officeId=${office.id}` }
    ]);

    const officeLogs = QrewStore.getAuditLogsByOffice(officeId);

    DOM.mainContent.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <div style="font-size:12px;color:var(--color-text-muted);margin-bottom:4px;display:flex;align-items:center;gap:6px;">
            <a href="#tenant-landing?id=${tenant.id}" style="color:var(--color-text-muted);text-decoration:none;">${QrewUI.escapeHtml(tenant.name)}</a>
            <span>/</span>
            <a href="#office-admin/overview?tenantId=${tenant.id}&officeId=${office.id}" style="color:var(--color-text-muted);text-decoration:none;">${QrewUI.escapeHtml(office.name)} (Admin)</a>
            <span>/</span>
            <span style="color:var(--color-text-primary);font-weight:600;">Activity Audit</span>
          </div>
          <h1 class="page-title">Office Activity Trail</h1>
          <p class="page-subtitle">Chronological log of staff assignments, roster updates, and status modifications for ${QrewUI.escapeHtml(office.name)}.</p>
        </div>
        <div class="page-actions">
          <a href="#tenant-landing?id=${tenant.id}" class="btn btn-secondary">
            &larr; ${QrewUI.escapeHtml(tenant.name)} Landing
          </a>
          <a href="#office/overview?tenantId=${tenant.id}&officeId=${office.id}" class="btn btn-secondary">
            &larr; Branch Hub
          </a>
          <a href="#office-admin/overview?tenantId=${tenant.id}&officeId=${office.id}" class="btn btn-secondary">
            Office Admin &rarr;
          </a>
        </div>
      </div>

      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Log ID</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Resource</th>
              <th>Description</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            ${officeLogs.length === 0 ? `
              <tr>
                <td colspan="6">
                  ${QrewUI.emptyState({
                    title: 'No activity logged for this office yet',
                    description: 'Actions performed within this branch will be recorded in this audit feed.'
                  })}
                </td>
              </tr>
            ` : officeLogs.map(log => `
              <tr>
                <td><span class="id-badge">${log.id}</span></td>
                <td><strong>${QrewUI.escapeHtml(log.actor)}</strong></td>
                <td>${QrewUI.actionBadge(log.action)}</td>
                <td><span class="id-badge">${QrewUI.escapeHtml(log.resourceId)}</span></td>
                <td>${QrewUI.escapeHtml(log.description)}</td>
                <td style="white-space:nowrap;font-size:12px;color:var(--color-text-muted);">${log.timestamp}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  };

  // Helpers for Not Found
  const renderTenantNotFound = (tenantId) => {
    DOM.mainContent.innerHTML = `
      <div class="card" style="padding:32px;">
        ${QrewUI.emptyState({
          title: 'Tenant Organization Not Found',
          description: `The tenant "${tenantId}" does not exist in the database.`,
          actionHtml: `<a href="#platform/tenants" class="btn btn-primary">Return to Tenants Directory</a>`
        })}
      </div>
    `;
  };

  const renderOfficeNotFound = (officeId) => {
    DOM.mainContent.innerHTML = `
      <div class="card" style="padding:32px;">
        ${QrewUI.emptyState({
          title: 'Office Branch Not Found',
          description: `The office "${officeId}" was not found.`,
          actionHtml: `<a href="#platform/overview" class="btn btn-primary">Return to Platform Overview</a>`
        })}
      </div>
    `;
  };

  // ==========================================
  // 6. DEPARTMENT WORKSPACE (Interface 6)
  // ==========================================
  const renderDepartmentWorkspace = (deptId) => {
    let dept = QrewStore.getDepartmentById(deptId);
    if (!dept) {
      const allDepts = QrewStore.getDepartments();
      dept = allDepts[0];
    }
    if (!dept) {
      DOM.mainContent.innerHTML = `
        <div class="empty-state">
          <div class="empty-title">Department Not Found</div>
          <div class="empty-desc">Provision a department in the Office Configuration Centre first.</div>
        </div>
      `;
      return;
    }

    const office = QrewStore.getOfficeById(dept.officeId) || { name: 'Office Branch', id: dept.officeId };
    const tenant = QrewStore.getTenantById(office.tenantId) || { name: 'Tenant Organization', id: office.tenantId };
    const deptMembers = QrewStore.getDepartmentMembers(dept.id);
    const tasks = QrewStore.getTasksByDepartment(dept.id);
    const onDutyCount = deptMembers.filter(m => m.status === 'On Duty').length;
    const pendingTasksCount = tasks.filter(t => t.status !== 'Completed').length;

    DOM.mainContent.innerHTML = `
      <!-- Department Header -->
      <div class="dept-header-card">
        <div class="dept-header-left">
          <div class="dept-badge-icon">${QrewUI.escapeHtml(dept.code)}</div>
          <div class="dept-title-group">
            <div class="dept-breadcrumb">
              <a href="#tenant-landing?id=${tenant.id}" style="color:var(--color-text-muted);text-decoration:none;">${QrewUI.escapeHtml(tenant.name)}</a>
              <span>/</span>
              <a href="#office/overview?tenantId=${tenant.id}&officeId=${office.id}" style="color:var(--color-text-muted);text-decoration:none;">${QrewUI.escapeHtml(office.name)}</a>
              <span>/</span>
              <span style="color:var(--color-text-primary);font-weight:600;">Department Hub</span>
            </div>
            <h2>${QrewUI.escapeHtml(dept.name)}</h2>
            <div style="font-size:12.5px;color:var(--color-text-muted);display:flex;align-items:center;gap:12px;margin-top:2px;">
              <span>Supervisor: <strong style="color:var(--color-text-primary);">${QrewUI.escapeHtml(dept.leadName)}</strong></span>
              <span>Status: ${QrewUI.statusBadge(dept.status)}</span>
            </div>
          </div>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <a href="#tenant-landing?id=${tenant.id}" class="btn btn-secondary btn-sm">
            &larr; ${QrewUI.escapeHtml(tenant.name)} Landing
          </a>
          <button class="btn btn-secondary btn-sm" id="btn-add-dept-task">
            ${QrewUI.getIcon('plus')} Add Task to Queue
          </button>
          <button class="btn btn-primary btn-sm" id="btn-assign-dept-member">
            ${QrewUI.getIcon('users')} Assign Staff
          </button>
        </div>
      </div>

      <!-- Department KPIs -->
      <div class="dept-kpi-row" style="margin:20px 0;">
        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">Assigned Personnel</span>
            <div class="metric-icon-wrap">${QrewUI.getIcon('users')}</div>
          </div>
          <div class="metric-value-row">
            <div class="metric-value">${deptMembers.length}</div>
            <div class="metric-subtext">Capacity: ${dept.capacity} staff</div>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">Active On Duty</span>
            <div class="metric-icon-wrap" style="color:var(--color-success);">${QrewUI.getIcon('check')}</div>
          </div>
          <div class="metric-value-row">
            <div class="metric-value">${onDutyCount}</div>
            <div class="metric-subtext">Currently on shift</div>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">Queue Backlog</span>
            <div class="metric-icon-wrap" style="color:var(--color-accent);">${QrewUI.getIcon('audit')}</div>
          </div>
          <div class="metric-value-row">
            <div class="metric-value">${pendingTasksCount}</div>
            <div class="metric-subtext">Tasks pending execution</div>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">Shift Coverage</span>
            <div class="metric-icon-wrap">${QrewUI.getIcon('overview')}</div>
          </div>
          <div class="metric-value-row">
            <div class="metric-value">100%</div>
            <div class="metric-subtext">Rotations active</div>
          </div>
        </div>
      </div>

      <!-- Staff Roster & Member Workspace Link -->
      <div class="card" style="margin-bottom:20px;">
        <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
          <div>
            <h2 class="card-title">Department Personnel Roster</h2>
            <p class="card-subtitle">Staff assigned to this department with specialized operational roles</p>
          </div>
          <span class="badge" style="background:var(--color-surface);border:1px solid var(--color-border);font-size:11.5px;">${deptMembers.length} Active Staff</span>
        </div>
        <div class="table-wrapper" style="border:none;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Personnel Name</th>
                <th>Email</th>
                <th>Department Role</th>
                <th>Assigned Shift</th>
                <th>Duty Status</th>
                <th style="text-align:right;">Member Workspace</th>
              </tr>
            </thead>
            <tbody>
              ${deptMembers.length === 0 ? `
                <tr>
                  <td colspan="6">
                    ${QrewUI.emptyState({
                      title: 'No Personnel Assigned',
                      description: 'Assign staff members to this department to build the operational team.'
                    })}
                  </td>
                </tr>
              ` : deptMembers.map(m => `
                <tr>
                  <td>
                    <div style="display:flex;align-items:center;gap:10px;">
                      <div class="user-avatar" style="width:28px;height:28px;font-size:11px;">${m.user.name.charAt(0)}</div>
                      <strong>${QrewUI.escapeHtml(m.user.name)}</strong>
                    </div>
                  </td>
                  <td>${QrewUI.escapeHtml(m.user.email)}</td>
                  <td>${QrewUI.roleBadge(m.deptRole, 'office')}</td>
                  <td>${QrewUI.escapeHtml(m.shift)}</td>
                  <td>${QrewUI.statusBadge(m.status === 'On Duty' ? 'Active' : 'Suspended')}</td>
                  <td style="text-align:right;">
                    <a href="#member/overview?userId=${m.userId}" class="btn btn-secondary btn-sm" style="font-size:11.5px;padding:3px 8px;gap:5px;display:inline-flex;align-items:center;" title="Launch Personal Workspace for ${QrewUI.escapeHtml(m.user.name)}">
                      <span>Personal Workspace</span>
                      <span style="font-size:10px;">&rarr;</span>
                    </a>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Operational Queue & Daily Assignments -->
      <div class="card">
        <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
          <div>
            <h2 class="card-title">Daily Operational Task Queue</h2>
            <p class="card-subtitle">Assigned tasks and field duties running across the current operational window</p>
          </div>
          <button class="btn btn-secondary btn-sm" id="btn-quick-add-task">
            ${QrewUI.getIcon('plus')} New Task
          </button>
        </div>
        <div class="card-body">
          <div class="dept-queue-grid">
            ${tasks.length === 0 ? `
              <div style="padding:24px;text-align:center;color:var(--color-text-muted);font-size:13px;">
                No operational tasks currently in queue. Add the first task above.
              </div>
            ` : tasks.map(t => `
              <div class="dept-task-card">
                <div class="dept-task-left">
                  <button class="member-checklist-checkbox toggle-task-btn" data-id="${t.id}" title="Toggle status" style="${t.status === 'Completed' ? 'background:var(--color-accent);border-color:var(--color-accent);color:#fff;' : ''}">
                    ${t.status === 'Completed' ? QrewUI.getIcon('check') : ''}
                  </button>
                  <div>
                    <div class="dept-task-title" style="${t.status === 'Completed' ? 'text-decoration:line-through;opacity:0.7;' : ''}">${QrewUI.escapeHtml(t.title)}</div>
                    <div class="dept-task-meta">
                      <span>Category: <strong>${QrewUI.escapeHtml(t.category)}</strong></span>
                      <span style="margin:0 6px;">•</span>
                      <span>Due: <strong>${QrewUI.escapeHtml(t.dueTime)}</strong></span>
                    </div>
                  </div>
                </div>
                <div class="dept-task-actions">
                  <span class="badge ${t.priority === 'High' ? 'badge-role platform' : 'badge-role tenant'}" style="font-size:10.5px;">${t.priority}</span>
                  ${QrewUI.statusBadge(t.status === 'Completed' ? 'Active' : 'Suspended')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    // Event Bindings
    const addTaskBtn = document.getElementById('btn-add-dept-task');
    if (addTaskBtn) addTaskBtn.onclick = () => openCreateDeptTaskModal(dept.id);

    const quickAddBtn = document.getElementById('btn-quick-add-task');
    if (quickAddBtn) quickAddBtn.onclick = () => openCreateDeptTaskModal(dept.id);

    const assignStaffBtn = document.getElementById('btn-assign-dept-member');
    if (assignStaffBtn) assignStaffBtn.onclick = () => openAssignDeptMemberModal(dept.id);

    DOM.mainContent.querySelectorAll('.toggle-task-btn').forEach(btn => {
      btn.onclick = () => {
        const updated = QrewStore.toggleTaskStatus(btn.dataset.id);
        if (updated) {
          QrewUI.showToast(`Task status updated to ${updated.status}.`, 'success');
          renderDepartmentWorkspace(dept.id);
        }
      };
    });
  };

  const openCreateDeptTaskModal = (deptId) => {
    const dept = QrewStore.getDepartmentById(deptId);
    if (!dept) return;

    QrewUI.openModal({
      title: `Add Operational Task to ${dept.name}`,
      bodyHtml: `
        <form id="create-dept-task-form">
          <div class="form-group">
            <label class="form-label" for="task-title">Task Description / Duty *</label>
            <input type="text" id="task-title" class="form-input" placeholder="e.g. Inspect dock container crane safety seal" required>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="task-category">Category *</label>
              <select id="task-category" class="form-input">
                <option value="Inspection">Inspection</option>
                <option value="Compliance">Compliance</option>
                <option value="Dispatch">Dispatch</option>
                <option value="Security">Security</option>
                <option value="Reporting">Reporting</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="task-priority">Priority *</label>
              <select id="task-priority" class="form-input">
                <option value="High">High</option>
                <option value="Normal" selected>Normal</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="task-due">Due Time</label>
              <input type="text" id="task-due" class="form-input" value="03:00 PM">
            </div>
            <div class="form-group">
              <label class="form-label" for="task-assignee">Assign To Member</label>
              <select id="task-assignee" class="form-input">
                ${QrewStore.getDepartmentMembers(deptId).map(m => `
                  <option value="${m.userId}">${QrewUI.escapeHtml(m.user.name)} (${m.deptRole})</option>
                `).join('')}
              </select>
            </div>
          </div>
        </form>
      `,
      footerHtml: `
        <button class="btn btn-secondary" onclick="QrewUI.closeModal()">Cancel</button>
        <button class="btn btn-primary" id="btn-submit-dept-task">Queue Task</button>
      `,
      onOpen: (modalEl) => {
        const form = modalEl.querySelector('#create-dept-task-form');
        const submitBtn = modalEl.querySelector('#btn-submit-dept-task');
        submitBtn.onclick = () => {
          if (!form.checkValidity()) {
            form.reportValidity();
            return;
          }
          const title = document.getElementById('task-title').value.trim();
          const category = document.getElementById('task-category').value;
          const priority = document.getElementById('task-priority').value;
          const dueTime = document.getElementById('task-due').value.trim();
          const userId = document.getElementById('task-assignee').value || 'usr_nusrat';

          QrewStore.createMemberTask(userId, deptId, title, priority, dueTime, category);
          QrewUI.closeModal();
          QrewUI.showToast('Task added to department operational queue.', 'success');
          renderDepartmentWorkspace(deptId);
        };
      }
    });
  };

  const openAssignDeptMemberModal = (deptId) => {
    const dept = QrewStore.getDepartmentById(deptId);
    if (!dept) return;
    const office = QrewStore.getOfficeById(dept.officeId);
    const officeStaff = office ? QrewStore.getOfficeStaff(office.id) : [];

    QrewUI.openModal({
      title: `Assign Staff to ${dept.name}`,
      bodyHtml: `
        <form id="assign-dept-member-form">
          <div class="form-group">
            <label class="form-label" for="dm-user">Select Office Staff Member *</label>
            <select id="dm-user" class="form-input" required>
              ${officeStaff.length === 0 ? `
                <option disabled selected>No staff assigned to office branch</option>
              ` : officeStaff.map(s => `
                <option value="${s.userId}">${QrewUI.escapeHtml(s.user.name)} (${s.officeRole})</option>
              `).join('')}
            </select>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="dm-role">Department Role *</label>
              <select id="dm-role" class="form-input">
                <option value="Department Lead">Department Lead</option>
                <option value="Senior Specialist">Senior Specialist</option>
                <option value="Operations Specialist" selected>Operations Specialist</option>
                <option value="Field Operator">Field Operator</option>
                <option value="Support Technician">Support Technician</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="dm-shift">Shift Rotation</label>
              <select id="dm-shift" class="form-input">
                <option value="Morning (08:00 - 16:00)" selected>Morning (08:00 - 16:00)</option>
                <option value="Evening (14:00 - 22:00)">Evening (14:00 - 22:00)</option>
                <option value="Night (22:00 - 06:00)">Night (22:00 - 06:00)</option>
              </select>
            </div>
          </div>
        </form>
      `,
      footerHtml: `
        <button class="btn btn-secondary" onclick="QrewUI.closeModal()">Cancel</button>
        <button class="btn btn-primary" id="btn-submit-dm">Assign to Department</button>
      `,
      onOpen: (modalEl) => {
        const form = modalEl.querySelector('#assign-dept-member-form');
        const submitBtn = modalEl.querySelector('#btn-submit-dm');
        submitBtn.onclick = () => {
          if (!form.checkValidity()) {
            form.reportValidity();
            return;
          }
          const userId = document.getElementById('dm-user').value;
          const role = document.getElementById('dm-role').value;
          const shift = document.getElementById('dm-shift').value;

          QrewStore.addDepartmentMember(deptId, userId, role, shift);
          QrewUI.closeModal();
          QrewUI.showToast('Staff member assigned to department roster.', 'success');
          renderDepartmentWorkspace(deptId);
        };
      }
    });
  };

  // ==========================================
  // 7. OFFICE MEMBER WORKSPACE (Interface 7)
  // ==========================================
  const renderMemberWorkspace = (userId) => {
    let user = QrewStore.getUserById(userId) || QrewStore.getCurrentUser();
    if (!user) user = QrewStore.getUsers()[0];

    // Find the member's office and department affiliations
    const officeStaffEntry = (QrewStore.data.officeStaff || []).find(os => os.userId === user.id) || {
      officeId: 'off_ctg_port',
      tenantId: 'ten_sst',
      officeRole: 'Office Staff'
    };
    const office = QrewStore.getOfficeById(officeStaffEntry.officeId) || { name: 'Chittagong Port Office', id: 'off_ctg_port' };
    const tenant = QrewStore.getTenantById(officeStaffEntry.tenantId) || { name: 'SST', id: 'ten_sst' };

    const deptMemberEntry = (QrewStore.data.departmentMembers || []).find(dm => dm.userId === user.id);
    const dept = deptMemberEntry ? QrewStore.getDepartmentById(deptMemberEntry.deptId) : QrewStore.getDepartments(office.id)[0] || { name: 'Port Operations', code: 'OPS', id: 'dept_ctg_ops' };

    const tasks = QrewStore.getMemberTasks(user.id);
    const activities = QrewStore.getMemberActivities(user.id);
    const completedTasksCount = tasks.filter(t => t.status === 'Completed').length;

    DOM.mainContent.innerHTML = `
      <div class="member-workspace-layout">
        <!-- Hero Profile & Status Card -->
        <div class="member-hero-card">
          <div class="member-identity">
            <div class="member-large-avatar">${user.name.charAt(0)}</div>
            <div class="member-identity-info">
              <div style="font-size:12px;color:var(--color-text-muted);margin-bottom:3px;display:flex;align-items:center;gap:6px;">
                <a href="#tenant-landing?id=${tenant.id}" style="color:var(--color-text-muted);text-decoration:none;">${QrewUI.escapeHtml(tenant.name)}</a>
                <span>/</span>
                <a href="#office/overview?tenantId=${tenant.id}&officeId=${office.id}" style="color:var(--color-text-muted);text-decoration:none;">${QrewUI.escapeHtml(office.name)}</a>
                <span>/</span>
                <a href="#department/overview?deptId=${dept.id}" style="color:var(--color-text-muted);text-decoration:none;">${QrewUI.escapeHtml(dept.name)}</a>
              </div>
              <h2>${QrewUI.escapeHtml(user.name)}</h2>
              <div class="member-identity-tags">
                <span class="badge badge-role office">${deptMemberEntry ? deptMemberEntry.deptRole : officeStaffEntry.officeRole}</span>
                <span class="badge" style="background:var(--color-surface);border:1px solid var(--color-border);font-size:11.5px;color:var(--color-text-primary);font-family:var(--font-mono);">${dept.code} Division</span>
                <span style="font-size:12.5px;color:var(--color-text-muted);">${QrewUI.escapeHtml(user.email)}</span>
              </div>
            </div>
          </div>
          <div class="member-shift-indicator">
            <div style="display:flex;flex-direction:column;gap:2px;">
              <span style="font-size:11px;text-transform:uppercase;letter-spacing:0.04em;color:var(--color-text-muted);font-weight:600;">Today's Assigned Shift</span>
              <strong style="font-size:13.5px;color:var(--color-text-primary);">${deptMemberEntry ? deptMemberEntry.shift : 'Morning (08:00 - 16:00)'}</strong>
            </div>
            <div style="border-left:1px solid var(--color-border);padding-left:12px;margin-left:6px;">
              <span class="badge badge-active" style="font-size:11px;"><span class="badge-dot"></span>Checked In</span>
            </div>
          </div>
        </div>

        <!-- Quick Switch Member Buttons -->
        <div class="config-banner-card" style="padding:12px 18px;">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <span style="font-size:11.5px;font-weight:700;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:0.04em;margin-right:4px;">Switch Member:</span>
            ${QrewStore.getUsers().slice(0, 5).map(u => `
              <button class="btn btn-sm ${u.id === user.id ? 'btn-primary' : 'btn-secondary'} switch-member-btn" data-id="${u.id}">
                ${QrewUI.escapeHtml(u.name)}
              </button>
            `).join('')}
          </div>
          <div style="display:flex;align-items:center;gap:10px;">
            <a href="#tenant-landing?id=${tenant.id}" class="btn btn-secondary btn-sm">
              &larr; ${QrewUI.escapeHtml(tenant.name)} Landing
            </a>
            <a href="#department/overview?deptId=${dept.id}" class="btn btn-secondary btn-sm">
              &larr; Return to Department Hub
            </a>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:2fr 1fr;gap:20px;">
          <!-- Left Column: Today's Tasks -->
          <div class="card">
            <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
              <div>
                <h2 class="card-title">My Today's Assigned Duties</h2>
                <p class="card-subtitle">${completedTasksCount} of ${tasks.length} duties completed today</p>
              </div>
              <button class="btn btn-primary btn-sm" id="btn-add-member-task">
                ${QrewUI.getIcon('plus')} Add Task
              </button>
            </div>
            <div class="card-body">
              <div style="display:flex;flex-direction:column;gap:10px;">
                ${tasks.length === 0 ? `
                  <div style="padding:24px;text-align:center;color:var(--color-text-muted);font-size:13px;">
                    No duties currently assigned for this shift. Add one above.
                  </div>
                ` : tasks.map(t => `
                  <div class="member-checklist-item ${t.status === 'Completed' ? 'completed' : ''}">
                    <button class="member-checklist-checkbox member-toggle-task" data-id="${t.id}" title="Toggle completion">
                      ${t.status === 'Completed' ? QrewUI.getIcon('check') : ''}
                    </button>
                    <div class="member-checklist-content">
                      <div class="member-checklist-title">${QrewUI.escapeHtml(t.title)}</div>
                      <div class="member-checklist-sub">
                        <span>Category: <strong>${QrewUI.escapeHtml(t.category)}</strong></span>
                        <span style="margin:0 5px;">•</span>
                        <span>Due: <strong>${QrewUI.escapeHtml(t.dueTime)}</strong></span>
                      </div>
                    </div>
                    <span class="badge ${t.priority === 'High' ? 'badge-role platform' : 'badge-role tenant'}" style="font-size:10px;">${t.priority}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- Right Column: Team & Activity -->
          <div style="display:flex;flex-direction:column;gap:20px;">
            <!-- Department Contacts -->
            <div class="card">
              <div class="card-header">
                <h2 class="card-title" style="font-size:14.5px;">My Department &amp; Team</h2>
                <p class="card-subtitle">${QrewUI.escapeHtml(dept.name)} Division</p>
              </div>
              <div class="card-body">
                <div style="display:flex;flex-direction:column;gap:10px;">
                  <div class="member-contact-card">
                    <div class="member-contact-avatar">L</div>
                    <div style="flex:1;">
                      <div style="font-size:13px;font-weight:600;color:var(--color-text-primary);">${QrewUI.escapeHtml(dept.leadName)}</div>
                      <div style="font-size:11px;color:var(--color-text-muted);">Department Supervisor</div>
                    </div>
                  </div>
                  <div class="member-contact-card">
                    <div class="member-contact-avatar">M</div>
                    <div style="flex:1;">
                      <div style="font-size:13px;font-weight:600;color:var(--color-text-primary);">${QrewUI.escapeHtml(office.name)}</div>
                      <div style="font-size:11px;color:var(--color-text-muted);">Dispatch Desk (${officeStaffEntry.officeRole})</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Activity Feed -->
            <div class="card">
              <div class="card-header">
                <h2 class="card-title" style="font-size:14.5px;">Activity &amp; Timeclock</h2>
                <p class="card-subtitle">Recent shift events</p>
              </div>
              <div class="card-body">
                <div style="display:flex;flex-direction:column;gap:12px;">
                  ${activities.length === 0 ? `
                    <div style="font-size:12.5px;color:var(--color-text-muted);text-align:center;padding:12px;">No shift activity recorded yet.</div>
                  ` : activities.slice(0, 4).map(a => `
                    <div style="display:flex;gap:10px;font-size:12.5px;">
                      <div style="width:6px;height:6px;border-radius:50%;background:var(--color-accent);margin-top:6px;flex-shrink:0;"></div>
                      <div>
                        <div style="font-weight:600;color:var(--color-text-primary);">${QrewUI.escapeHtml(a.title)}</div>
                        <div style="color:var(--color-text-muted);font-size:11.5px;">${QrewUI.escapeHtml(a.description)}</div>
                        <div style="font-size:10.5px;color:var(--color-text-muted);margin-top:2px;">${a.timestamp}</div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Event Bindings
    DOM.mainContent.querySelectorAll('.switch-member-btn').forEach(btn => {
      btn.onclick = () => {
        AppState.currentMemberId = btn.dataset.id;
        navigateTo(`#member/overview?userId=${AppState.currentMemberId}`);
      };
    });

    const addMemberTaskBtn = document.getElementById('btn-add-member-task');
    if (addMemberTaskBtn) {
      addMemberTaskBtn.onclick = () => openCreateMemberTaskModal(user.id, dept.id);
    }

    DOM.mainContent.querySelectorAll('.member-toggle-task').forEach(btn => {
      btn.onclick = () => {
        const updated = QrewStore.toggleTaskStatus(btn.dataset.id);
        if (updated) {
          QrewUI.showToast(`Task "${updated.title}" marked as ${updated.status}.`, 'success');
          renderMemberWorkspace(user.id);
        }
      };
    });
  };

  const openCreateMemberTaskModal = (userId, deptId) => {
    QrewUI.openModal({
      title: 'Add Duty to My Daily Checklist',
      bodyHtml: `
        <form id="create-my-task-form">
          <div class="form-group">
            <label class="form-label" for="my-task-title">Duty Description *</label>
            <input type="text" id="my-task-title" class="form-input" placeholder="e.g. Conduct daily dock equipment audit" required>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="my-task-category">Category</label>
              <select id="my-task-category" class="form-input">
                <option value="Operations">Operations</option>
                <option value="Inspection">Inspection</option>
                <option value="Compliance">Compliance</option>
                <option value="Safety">Safety</option>
                <option value="Reporting">Reporting</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="my-task-priority">Priority</label>
              <select id="my-task-priority" class="form-input">
                <option value="High">High</option>
                <option value="Normal" selected>Normal</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label" for="my-task-due">Due Time</label>
            <input type="text" id="my-task-due" class="form-input" value="Today, 04:30 PM">
          </div>
        </form>
      `,
      footerHtml: `
        <button class="btn btn-secondary" onclick="QrewUI.closeModal()">Cancel</button>
        <button class="btn btn-primary" id="btn-save-my-task">Add Duty</button>
      `,
      onOpen: (modalEl) => {
        const form = modalEl.querySelector('#create-my-task-form');
        const submitBtn = modalEl.querySelector('#btn-save-my-task');
        submitBtn.onclick = () => {
          if (!form.checkValidity()) {
            form.reportValidity();
            return;
          }
          const title = document.getElementById('my-task-title').value.trim();
          const category = document.getElementById('my-task-category').value;
          const priority = document.getElementById('my-task-priority').value;
          const dueTime = document.getElementById('my-task-due').value.trim();

          QrewStore.createMemberTask(userId, deptId, title, priority, dueTime, category);
          QrewUI.closeModal();
          QrewUI.showToast('Duty added to your checklist.', 'success');
          renderMemberWorkspace(userId);
        };
      }
    });
  };

  // ==========================================
  // Modal Handlers & Actions
  // ==========================================

  // --- Create Tenant Modal ---
  const openCreateTenantModal = () => {
    QrewUI.openModal({
      title: 'Create New Tenant Organization',
      bodyHtml: `
        <div class="notice-box" style="margin-bottom:12px;">
          ${QrewUI.getIcon('info')}
          <div>
            <strong>Separation of Duties:</strong> The tenant owner is automatically provisioned as Tenant Admin. A Platform Owner (such as Sakib) cannot be assigned as a Tenant Owner or Tenant Admin.
          </div>
        </div>
        <form id="create-tenant-form">
          <div class="form-group">
            <label class="form-label">Tenant / Organization Name <span class="required">*</span></label>
            <input type="text" class="form-input" id="new-tenant-name" placeholder="e.g. Acme Corporation" required>
            <span class="form-hint">A unique namespace will be established for this tenant.</span>
          </div>
          <div class="form-group" style="margin-top:14px;">
            <label class="form-label">Owner Full Name <span class="required">*</span></label>
            <input type="text" class="form-input" id="new-tenant-owner" placeholder="e.g. Sarah Jenkins" required>
          </div>
          <div class="form-group" style="margin-top:14px;">
            <label class="form-label">Owner Email Address <span class="required">*</span></label>
            <input type="email" class="form-input" id="new-tenant-email" placeholder="e.g. sarah@acme.com" required>
            <span class="form-hint">Owner will automatically be assigned as Tenant Admin. Must not be a Platform Owner.</span>
          </div>
        </form>
      `,
      footerHtml: `
        <button class="btn btn-secondary" onclick="QrewUI.closeModal()">Cancel</button>
        <button class="btn btn-primary" id="btn-submit-create-tenant">Create Tenant</button>
      `,
      onOpen: (modalEl) => {
        const submitBtn = modalEl.querySelector('#btn-submit-create-tenant');
        submitBtn.onclick = () => {
          const name = modalEl.querySelector('#new-tenant-name').value.trim();
          const ownerName = modalEl.querySelector('#new-tenant-owner').value.trim();
          const ownerEmail = modalEl.querySelector('#new-tenant-email').value.trim();

          if (!name || !ownerName || !ownerEmail) {
            alert('Please fill out all required fields.');
            return;
          }

          try {
            const newTenant = QrewStore.createTenant({ name, ownerName, ownerEmail });
            AppState.currentTenantId = newTenant.id;
            QrewUI.closeModal();
            QrewUI.showToast(`Tenant "${newTenant.name}" successfully created!`, 'success');
            handleRouteChange();
          } catch (err) {
            alert(err.message);
          }
        };
      }
    });
  };

  // --- Edit Tenant Modal ---
  const openEditTenantModal = (tenantId) => {
    const tenant = QrewStore.getTenantById(tenantId);
    if (!tenant) return;

    QrewUI.openModal({
      title: `Edit Tenant: ${tenant.name}`,
      bodyHtml: `
        <form id="edit-tenant-form">
          <div class="form-group">
            <label class="form-label">Tenant Name <span class="required">*</span></label>
            <input type="text" class="form-input" id="edit-tenant-name" value="${QrewUI.escapeHtml(tenant.name)}" required>
          </div>
          <div class="form-group" style="margin-top:14px;">
            <label class="form-label">Tenant Status</label>
            <select class="form-select" id="edit-tenant-status">
              <option value="Active" ${tenant.status === 'Active' ? 'selected' : ''}>Active</option>
              <option value="Suspended" ${tenant.status === 'Suspended' ? 'selected' : ''}>Suspended</option>
            </select>
          </div>
        </form>
      `,
      footerHtml: `
        <button class="btn btn-secondary" onclick="QrewUI.closeModal()">Cancel</button>
        <button class="btn btn-primary" id="btn-submit-edit-tenant">Save Changes</button>
      `,
      onOpen: (modalEl) => {
        modalEl.querySelector('#btn-submit-edit-tenant').onclick = () => {
          const name = modalEl.querySelector('#edit-tenant-name').value.trim();
          const status = modalEl.querySelector('#edit-tenant-status').value;
          if (!name) return;

          QrewStore.updateTenant(tenantId, { name, status });
          QrewUI.closeModal();
          QrewUI.showToast(`Tenant "${name}" updated.`, 'success');
          handleRouteChange();
        };
      }
    });
  };

  // --- Toggle Tenant Status ---
  const handleToggleTenantStatus = (tenantId, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
    const actionVerb = newStatus === 'Active' ? 'activate' : 'suspend';

    QrewUI.confirmDialog({
      title: `${newStatus === 'Active' ? 'Activate' : 'Suspend'} Tenant`,
      message: `Are you sure you want to ${actionVerb} this tenant? Suspended tenants and their offices cannot access operational endpoints.`,
      confirmText: `${newStatus === 'Active' ? 'Activate' : 'Suspend'}`,
      confirmClass: newStatus === 'Active' ? 'btn-primary' : 'btn-danger',
      onConfirm: () => {
        QrewStore.updateTenant(tenantId, { status: newStatus });
        QrewUI.showToast(`Tenant status updated to ${newStatus}.`, 'success');
        handleRouteChange();
      }
    });
  };

  // --- Delete Tenant Organization (Platform Scope) ---
  const handleDeleteTenant = (tenantId, tenantName) => {
    QrewUI.confirmDialog({
      title: 'Delete Tenant Organization',
      message: `Permanently delete organization "${tenantName}"? This will delete all branch offices, memberships, and staff assignments.`,
      confirmText: 'Delete Tenant',
      confirmClass: 'btn-danger',
      onConfirm: () => {
        try {
          QrewStore.deleteTenant(tenantId);
          QrewUI.showToast(`Tenant "${tenantName}" deleted.`, 'success');
          const remaining = QrewStore.getTenants();
          AppState.currentTenantId = remaining.length > 0 ? remaining[0].id : '';
          const remainingOffices = AppState.currentTenantId ? QrewStore.getOfficesByTenant(AppState.currentTenantId) : [];
          AppState.currentOfficeId = remainingOffices.length > 0 ? remainingOffices[0].id : '';
          handleRouteChange();
        } catch (e) {
          QrewUI.showToast(e.message, 'error');
        }
      }
    });
  };

  // --- Create Office Modal ---
  const openCreateOfficeModal = (tenantId) => {
    const tenant = QrewStore.getTenantById(tenantId);
    if (!tenant) return;

    QrewUI.openModal({
      title: `Create Office for ${tenant.name}`,
      bodyHtml: `
        <form id="create-office-form">
          <div class="form-group">
            <label class="form-label">Office / Branch Name <span class="required">*</span></label>
            <input type="text" class="form-input" id="new-office-name" placeholder="e.g. Downtown Regional Office" required>
          </div>
          <div class="form-group" style="margin-top:14px;">
            <label class="form-label">Location / Address</label>
            <input type="text" class="form-input" id="new-office-location" placeholder="e.g. 450 Market Street, Suite 800">
          </div>
        </form>
      `,
      footerHtml: `
        <button class="btn btn-secondary" onclick="QrewUI.closeModal()">Cancel</button>
        <button class="btn btn-primary" id="btn-submit-create-office">Create Office</button>
      `,
      onOpen: (modalEl) => {
        modalEl.querySelector('#btn-submit-create-office').onclick = () => {
          const name = modalEl.querySelector('#new-office-name').value.trim();
          const location = modalEl.querySelector('#new-office-location').value.trim();
          if (!name) return;

          try {
            const office = QrewStore.createOffice(tenantId, { name, location });
            AppState.currentOfficeId = office.id;
            QrewUI.closeModal();
            QrewUI.showToast(`Office "${office.name}" created under ${tenant.name}!`, 'success');
            handleRouteChange();
          } catch (e) {
            alert(e.message);
          }
        };
      }
    });
  };

  // --- Edit Office Modal ---
  const openEditOfficeModal = (officeId) => {
    const office = QrewStore.getOfficeById(officeId);
    if (!office) return;

    QrewUI.openModal({
      title: `Edit Office: ${office.name}`,
      bodyHtml: `
        <form>
          <div class="form-group">
            <label class="form-label">Office Name <span class="required">*</span></label>
            <input type="text" class="form-input" id="edit-office-name" value="${QrewUI.escapeHtml(office.name)}" required>
          </div>
          <div class="form-group" style="margin-top:14px;">
            <label class="form-label">Location / Address</label>
            <input type="text" class="form-input" id="edit-office-loc" value="${QrewUI.escapeHtml(office.location || '')}">
          </div>
          <div class="form-group" style="margin-top:14px;">
            <label class="form-label">Office Status</label>
            <select class="form-select" id="edit-office-status">
              <option value="Active" ${office.status === 'Active' ? 'selected' : ''}>Active</option>
              <option value="Suspended" ${office.status === 'Suspended' ? 'selected' : ''}>Suspended</option>
            </select>
          </div>
        </form>
      `,
      footerHtml: `
        <button class="btn btn-secondary" onclick="QrewUI.closeModal()">Cancel</button>
        <button class="btn btn-primary" id="btn-submit-edit-office">Save Changes</button>
      `,
      onOpen: (modalEl) => {
        modalEl.querySelector('#btn-submit-edit-office').onclick = () => {
          const name = modalEl.querySelector('#edit-office-name').value.trim();
          const location = modalEl.querySelector('#edit-office-loc').value.trim();
          const status = modalEl.querySelector('#edit-office-status').value;
          if (!name) return;

          QrewStore.updateOffice(officeId, { name, location, status }, AppState.currentTenantId);
          QrewUI.closeModal();
          QrewUI.showToast(`Office "${name}" updated.`, 'success');
          handleRouteChange();
        };
      }
    });
  };

  // --- Toggle Office Status ---
  const handleToggleOfficeStatus = (officeId, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
    QrewUI.confirmDialog({
      title: `${newStatus === 'Active' ? 'Activate' : 'Suspend'} Office`,
      message: `Change office status to "${newStatus}"?`,
      confirmText: `${newStatus === 'Active' ? 'Activate' : 'Suspend'}`,
      confirmClass: newStatus === 'Active' ? 'btn-primary' : 'btn-danger',
      onConfirm: () => {
        QrewStore.updateOffice(officeId, { status: newStatus }, AppState.currentTenantId);
        QrewUI.showToast(`Office marked as ${newStatus}.`, 'success');
        handleRouteChange();
      }
    });
  };

  // --- Delete Office Branch (Tenant Scope) ---
  const handleDeleteOffice = (officeId, officeName, tenantId) => {
    QrewUI.confirmDialog({
      title: 'Delete Office Branch',
      message: `Permanently delete branch office "${officeName}"? All staff assignments for this office will be revoked.`,
      confirmText: 'Delete Office',
      confirmClass: 'btn-danger',
      onConfirm: () => {
        try {
          QrewStore.deleteOffice(officeId, tenantId);
          QrewUI.showToast(`Office "${officeName}" deleted.`, 'success');
          const remaining = QrewStore.getOfficesByTenant(tenantId);
          AppState.currentOfficeId = remaining.length > 0 ? remaining[0].id : '';
          handleRouteChange();
        } catch (e) {
          QrewUI.showToast(e.message, 'error');
        }
      }
    });
  };

  // --- Add Tenant Member Modal ---
  const openAddTenantMemberModal = (tenantId) => {
    const tenant = QrewStore.getTenantById(tenantId);
    const allUsers = QrewStore.getPlatformUsers();
    const existingMemberUserIds = tenant.members.map(m => m.userId);
    const nonMemberUsers = allUsers.filter(u => !existingMemberUserIds.includes(u.id));

    QrewUI.openModal({
      title: `Add Member to ${tenant.name}`,
      bodyHtml: `
        <div class="notice-box" style="margin-bottom:12px;">
          ${QrewUI.getIcon('info')}
          <div>
            <strong>Access Rule:</strong> A Platform Owner cannot be assigned as a Tenant Admin. Platform governance remains decoupled from tenant administration.
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Select Existing Platform User</label>
          <select class="form-select" id="new-member-user-id">
            <option value="">-- Choose User (or type email below) --</option>
            ${nonMemberUsers.map(u => `
              <option value="${u.id}" data-role="${u.platformRole}">${QrewUI.escapeHtml(u.name)} (${QrewUI.escapeHtml(u.email)}) [${u.platformRole}]</option>
            `).join('')}
          </select>
        </div>

        <div style="text-align:center;font-size:11px;color:var(--color-text-muted);margin:4px 0;">— OR INVITE NEW USER —</div>

        <div class="form-group">
          <label class="form-label">New User Name</label>
          <input type="text" class="form-input" id="new-member-custom-name" placeholder="e.g. Asif Mahmud">
        </div>

        <div class="form-group" style="margin-top:10px;">
          <label class="form-label">New User Email</label>
          <input type="email" class="form-input" id="new-member-custom-email" placeholder="e.g. asif@company.com">
        </div>

        <div class="form-group" style="margin-top:14px;">
          <label class="form-label">Tenant Role <span class="required">*</span></label>
          <select class="form-select" id="new-member-role">
            <option value="Tenant Member">Tenant Member</option>
            <option value="Tenant Manager">Tenant Manager</option>
            <option value="Tenant Admin" id="opt-tenant-admin">Tenant Admin</option>
          </select>
          <span class="form-hint" id="role-restriction-hint" style="color:var(--color-warning);display:none;">Platform Owners cannot be assigned the Tenant Admin role.</span>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary" onclick="QrewUI.closeModal()">Cancel</button>
        <button class="btn btn-primary" id="btn-submit-add-tenant-member">Add Member</button>
      `,
      onOpen: (modalEl) => {
        const userSelect = modalEl.querySelector('#new-member-user-id');
        const roleSelect = modalEl.querySelector('#new-member-role');
        const optAdmin = modalEl.querySelector('#opt-tenant-admin');
        const hintEl = modalEl.querySelector('#role-restriction-hint');

        const updateRoleOptions = () => {
          const selectedOpt = userSelect.options[userSelect.selectedIndex];
          const isPlatformOwner = selectedOpt && selectedOpt.dataset.role === 'Platform Owner';
          if (isPlatformOwner) {
            optAdmin.disabled = true;
            hintEl.style.display = 'block';
            if (roleSelect.value === 'Tenant Admin') {
              roleSelect.value = 'Tenant Member';
            }
          } else {
            optAdmin.disabled = false;
            hintEl.style.display = 'none';
          }
        };

        userSelect.onchange = updateRoleOptions;

        modalEl.querySelector('#btn-submit-add-tenant-member').onclick = () => {
          const userId = userSelect.value;
          const name = modalEl.querySelector('#new-member-custom-name').value.trim();
          const email = modalEl.querySelector('#new-member-custom-email').value.trim();
          const tenantRole = roleSelect.value;

          if (!userId && !email) {
            alert('Please select an existing user or enter a valid email.');
            return;
          }

          try {
            QrewStore.addTenantMember(tenantId, { userId, name, email, tenantRole });
            QrewUI.closeModal();
            QrewUI.showToast(`Member added to ${tenant.name}!`, 'success');
            handleRouteChange();
          } catch (e) {
            alert(e.message);
          }
        };
      }
    });
  };

  // --- Change Tenant Member Role ---
  const openChangeTenantRoleModal = (tenantId, userId, currentRole) => {
    const user = QrewStore.data.users.find(u => u.id === userId);
    const isPlatformOwner = user && user.platformRole === 'Platform Owner';

    QrewUI.openModal({
      title: `Change Tenant Role: ${user ? user.name : ''}`,
      bodyHtml: `
        ${isPlatformOwner ? `
          <div class="notice-box" style="margin-bottom:12px;">
            ${QrewUI.getIcon('alert')}
            <div>
              <strong>Role Restriction:</strong> "${user.name}" is a Platform Owner. A Platform Owner cannot be assigned the Tenant Admin role.
            </div>
          </div>
        ` : ''}
        <div class="form-group">
          <label class="form-label">Select New Tenant Role</label>
          <select class="form-select" id="change-tenant-role-select">
            <option value="Tenant Member" ${currentRole === 'Tenant Member' ? 'selected' : ''}>Tenant Member</option>
            <option value="Tenant Manager" ${currentRole === 'Tenant Manager' ? 'selected' : ''}>Tenant Manager</option>
            <option value="Tenant Admin" ${currentRole === 'Tenant Admin' ? 'selected' : ''} ${isPlatformOwner ? 'disabled' : ''}>
              Tenant Admin ${isPlatformOwner ? '(Restricted for Platform Owner)' : ''}
            </option>
          </select>
          <span class="form-hint">Applies scoped access control inside this tenant.</span>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary" onclick="QrewUI.closeModal()">Cancel</button>
        <button class="btn btn-primary" id="btn-submit-change-tenant-role">Update Role</button>
      `,
      onOpen: (modalEl) => {
        modalEl.querySelector('#btn-submit-change-tenant-role').onclick = () => {
          const newRole = modalEl.querySelector('#change-tenant-role-select').value;
          try {
            QrewStore.updateTenantMemberRole(tenantId, userId, newRole);
            QrewUI.closeModal();
            QrewUI.showToast(`Tenant role updated to ${newRole}.`, 'success');
            handleRouteChange();
          } catch (e) {
            alert(e.message);
          }
        };
      }
    });
  };

  // --- Remove Tenant Member ---
  const handleRemoveTenantMember = (tenantId, userId, name) => {
    QrewUI.confirmDialog({
      title: 'Remove Tenant Member',
      message: `Are you sure you want to remove "${name}" from this tenant? Business rule cascade: They will also be removed from any offices in this tenant!`,
      confirmText: 'Remove Member',
      confirmClass: 'btn-danger',
      onConfirm: () => {
        QrewStore.removeTenantMember(tenantId, userId);
        QrewUI.showToast(`Removed "${name}" from tenant and child offices.`, 'success');
        handleRouteChange();
      }
    });
  };

  // --- Add Office Staff Modal ---
  const openAddOfficeStaffModal = (officeId) => {
    const office = QrewStore.getOfficeById(officeId);
    if (!office) return;

    const tenant = office.tenant || QrewStore.getTenantById(office.tenantId) || { name: 'Parent Tenant' };
    const tenantMembers = QrewStore.getTenantMembers(office.tenantId);
    const assignedUserIds = new Set(office.staff.map(s => s.user.id));
    const availableMembers = tenantMembers.filter(m => !assignedUserIds.has(m.user.id));

    QrewUI.openModal({
      title: `Deploy Staff from Tenant Pool (${office.name})`,
      bodyHtml: `
        <form id="add-office-staff-form" onsubmit="return false;">
          <div class="notice-box" style="margin-bottom:14px;padding:8px 12px;font-size:12px;">
            ${QrewUI.getIcon('info')}
            <div>
              <strong>Strict Scoping:</strong> Candidates are strictly constrained to verified members of 
              <strong>${QrewUI.escapeHtml(tenant.name)}</strong>.
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Select Verified Member <span class="required">*</span></label>
            ${availableMembers.length === 0 ? `
              <div style="padding:10px;background:var(--color-surface);border:1px solid var(--color-border);border-radius:4px;font-size:12.5px;color:var(--color-text-muted);">
                All verified members of ${QrewUI.escapeHtml(tenant.name)} are already deployed to this branch. <a href="#tenant/members?id=${office.tenantId}">Onboard more members in Tenant Workspace &rarr;</a>
              </div>
            ` : `
              <select class="form-select" id="assign-staff-member-select" required>
                <option value="">-- Choose verified member from tenant pool --</option>
                ${availableMembers.map(m => `
                  <option value="${m.user.id}">
                    ${QrewUI.escapeHtml(m.user.name)} (${QrewUI.escapeHtml(m.user.email)}) — ${m.tenantRole}
                  </option>
                `).join('')}
              </select>
            `}
          </div>

          <div class="form-group" style="margin-top:14px;">
            <label class="form-label">Assign Office Role <span class="required">*</span></label>
            <select class="form-select" id="assign-staff-role" required>
              <option value="Office Staff" selected>Office Staff</option>
              <option value="Office Supervisor">Office Supervisor</option>
              <option value="Office Manager">Office Manager</option>
            </select>
            <span class="form-hint">Controls permissions on-site at this specific office branch.</span>
          </div>
        </form>
      `,
      footerHtml: `
        <button class="btn btn-secondary" onclick="QrewUI.closeModal()">Cancel</button>
        <button class="btn btn-primary" id="btn-submit-add-staff" ${availableMembers.length === 0 ? 'disabled' : ''}>Deploy to Office</button>
      `,
      onOpen: (modalEl) => {
        const selectEl = modalEl.querySelector('#assign-staff-member-select');
        if (selectEl) selectEl.focus();

        const submitBtn = modalEl.querySelector('#btn-submit-add-staff');
        if (submitBtn) {
          submitBtn.onclick = () => {
            if (availableMembers.length === 0) return;
            const selectEl = modalEl.querySelector('#assign-staff-member-select');
            const userId = selectEl ? selectEl.value : null;
            const officeRole = modalEl.querySelector('#assign-staff-role').value;

            if (!userId) {
              QrewUI.showToast('Please select a verified member from the tenant pool.', 'error');
              return;
            }

            const selectedMember = availableMembers.find(m => m.user.id === userId);
            const name = selectedMember ? selectedMember.user.name : '';
            const email = selectedMember ? selectedMember.user.email : '';

            try {
              const result = QrewStore.addOfficeStaff(officeId, { userId, name, email, officeRole });
              QrewUI.closeModal();
              QrewUI.showToast(`"${result.user ? result.user.name : name}" deployed as ${officeRole}!`, 'success');
              handleRouteChange();
            } catch (e) {
              QrewUI.showToast(e.message, 'error');
            }
          };
        }
      }
    });
  };

  // --- Change Office Staff Role ---
  const openChangeOfficeRoleModal = (officeId, userId, currentRole) => {
    QrewUI.openModal({
      title: 'Change Office Staff Role',
      bodyHtml: `
        <div class="form-group">
          <label class="form-label">Select Office Role</label>
          <select class="form-select" id="change-office-role-select">
            <option value="Office Staff" ${currentRole === 'Office Staff' ? 'selected' : ''}>Office Staff</option>
            <option value="Office Supervisor" ${currentRole === 'Office Supervisor' ? 'selected' : ''}>Office Supervisor</option>
            <option value="Office Manager" ${currentRole === 'Office Manager' ? 'selected' : ''}>Office Manager</option>
          </select>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary" onclick="QrewUI.closeModal()">Cancel</button>
        <button class="btn btn-primary" id="btn-submit-change-office-role">Update Role</button>
      `,
      onOpen: (modalEl) => {
        modalEl.querySelector('#btn-submit-change-office-role').onclick = () => {
          const newRole = modalEl.querySelector('#change-office-role-select').value;
          QrewStore.updateOfficeStaffRole(officeId, userId, newRole);
          QrewUI.closeModal();
          QrewUI.showToast(`Office role updated to ${newRole}.`, 'success');
          handleRouteChange();
        };
      }
    });
  };

  // --- Remove Office Staff ---
  const handleRemoveOfficeStaff = (officeId, userId, name) => {
    QrewUI.confirmDialog({
      title: 'Remove Office Staff',
      message: `Are you sure you want to remove "${name}" from this office roster? They will still remain a member of the parent tenant.`,
      confirmText: 'Remove Staff',
      confirmClass: 'btn-danger',
      onConfirm: () => {
        QrewStore.removeOfficeStaff(officeId, userId);
        QrewUI.showToast(`Removed "${name}" from office roster.`, 'success');
        handleRouteChange();
      }
    });
  };

  // --- Create Platform User Modal ---
  const openCreatePlatformUserModal = () => {
    QrewUI.openModal({
      title: 'Add Platform User',
      bodyHtml: `
        <form id="create-user-form">
          <div class="form-group">
            <label class="form-label">Full Name <span class="required">*</span></label>
            <input type="text" class="form-input" id="new-user-name" placeholder="e.g. Tariq Rahman" required>
          </div>
          <div class="form-group" style="margin-top:14px;">
            <label class="form-label">Email Address <span class="required">*</span></label>
            <input type="email" class="form-input" id="new-user-email" placeholder="e.g. tariq@qrew.io" required>
          </div>
          <div class="form-group" style="margin-top:14px;">
            <label class="form-label">Platform Role <span class="required">*</span></label>
            <select class="form-select" id="new-user-role">
              <option value="Platform User">Platform User (Standard)</option>
              <option value="Platform Admin">Platform Admin</option>
              <option value="Platform Owner">Platform Owner</option>
            </select>
          </div>
        </form>
      `,
      footerHtml: `
        <button class="btn btn-secondary" onclick="QrewUI.closeModal()">Cancel</button>
        <button class="btn btn-primary" id="btn-submit-create-user">Create User</button>
      `,
      onOpen: (modalEl) => {
        modalEl.querySelector('#btn-submit-create-user').onclick = () => {
          const name = modalEl.querySelector('#new-user-name').value.trim();
          const email = modalEl.querySelector('#new-user-email').value.trim();
          const platformRole = modalEl.querySelector('#new-user-role').value;

          if (!name || !email) {
            alert('Please provide name and email.');
            return;
          }

          try {
            const user = QrewStore.createPlatformUser({ name, email, platformRole });
            QrewUI.closeModal();
            QrewUI.showToast(`User "${user.name}" created!`, 'success');
            handleRouteChange();
          } catch (e) {
            alert(e.message);
          }
        };
      }
    });
  };

  // --- View User Details Modal ---
  const openUserDetailsModal = (userId) => {
    const details = QrewStore.getUserDetails(userId);
    if (!details) return;

    QrewUI.openModal({
      title: `User Profile: ${details.name}`,
      bodyHtml: `
        <div style="display:flex;align-items:center;gap:14px;padding-bottom:16px;border-bottom:1px solid var(--color-border-subtle);">
          <div class="user-avatar" style="width:44px;height:44px;font-size:16px;">
            ${details.name.split(' ').map(n=>n[0]).join('').substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h3 style="font-size:16px;font-weight:600;color:var(--color-text-primary);margin:0;">${QrewUI.escapeHtml(details.name)}</h3>
            <p style="font-size:12.5px;color:var(--color-text-muted);">${QrewUI.escapeHtml(details.email)}</p>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px;">
          <div>
            <span class="meta-label">Platform Role</span>
            <div>${QrewUI.roleBadge(details.platformRole, 'platform')}</div>
          </div>
          <div>
            <span class="meta-label">Account Status</span>
            <div>${QrewUI.statusBadge(details.status)}</div>
          </div>
        </div>

        <div style="margin-top:20px;">
          <h4 style="font-size:13px;font-weight:600;margin-bottom:8px;color:var(--color-text-primary);">
            Tenant Memberships (${details.tenantMemberships.length})
          </h4>
          ${details.tenantMemberships.length === 0 ? `
            <p style="font-size:12px;color:var(--color-text-muted);">Not currently enrolled in any tenant organizations.</p>
          ` : `
            <div style="display:flex;flex-direction:column;gap:6px;">
              ${details.tenantMemberships.map(tm => `
                <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;background:var(--color-surface);border-radius:var(--radius-sm);border:1px solid var(--color-border);">
                  <strong style="font-size:12.5px;">${QrewUI.escapeHtml(tm.tenantName)}</strong>
                  ${QrewUI.roleBadge(tm.tenantRole, 'tenant')}
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <div style="margin-top:20px;">
          <h4 style="font-size:13px;font-weight:600;margin-bottom:8px;color:var(--color-text-primary);">
            Office Staff Assignments (${details.officeAssignments.length})
          </h4>
          ${details.officeAssignments.length === 0 ? `
            <p style="font-size:12px;color:var(--color-text-muted);">No active branch office assignments.</p>
          ` : `
            <div style="display:flex;flex-direction:column;gap:6px;">
              ${details.officeAssignments.map(os => `
                <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;background:var(--color-surface);border-radius:var(--radius-sm);border:1px solid var(--color-border);">
                  <div>
                    <div style="font-size:12.5px;font-weight:600;">${QrewUI.escapeHtml(os.officeName)}</div>
                    <div style="font-size:11px;color:var(--color-text-muted);">${QrewUI.escapeHtml(os.tenantName)}</div>
                  </div>
                  ${QrewUI.roleBadge(os.officeRole, 'office')}
                </div>
              `).join('')}
            </div>
          `}
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary" onclick="QrewUI.closeModal()">Close</button>
      `
    });
  };

  // --- Edit Platform Role Modal ---
  const openEditPlatformRoleModal = (userId, currentRole) => {
    QrewUI.openModal({
      title: 'Assign Platform Role',
      bodyHtml: `
        <div class="form-group">
          <label class="form-label">Platform Role</label>
          <select class="form-select" id="edit-plt-role-select">
            <option value="Platform User" ${currentRole === 'Platform User' ? 'selected' : ''}>Platform User</option>
            <option value="Platform Admin" ${currentRole === 'Platform Admin' ? 'selected' : ''}>Platform Admin</option>
            <option value="Platform Owner" ${currentRole === 'Platform Owner' ? 'selected' : ''}>Platform Owner</option>
          </select>
          <span class="form-hint">Controls administrative rights across the entire Qrew deployment.</span>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary" onclick="QrewUI.closeModal()">Cancel</button>
        <button class="btn btn-primary" id="btn-submit-plt-role">Update Role</button>
      `,
      onOpen: (modalEl) => {
        modalEl.querySelector('#btn-submit-plt-role').onclick = () => {
          const platformRole = modalEl.querySelector('#edit-plt-role-select').value;
          try {
            QrewStore.updatePlatformUser(userId, { platformRole });
            QrewUI.closeModal();
            QrewUI.showToast(`Platform role updated to ${platformRole}.`, 'success');
            handleRouteChange();
          } catch (err) {
            alert(err.message);
          }
        };
      }
    });
  };

  // --- Toggle Platform User Status ---
  const handleToggleUserStatus = (userId, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    QrewUI.confirmDialog({
      title: `${newStatus === 'Active' ? 'Activate' : 'Deactivate'} User Account`,
      message: `Change user status to "${newStatus}"?`,
      confirmText: `${newStatus === 'Active' ? 'Activate' : 'Deactivate'}`,
      confirmClass: newStatus === 'Active' ? 'btn-primary' : 'btn-danger',
      onConfirm: () => {
        QrewStore.updatePlatformUser(userId, { status: newStatus });
        QrewUI.showToast(`User status set to ${newStatus}.`, 'success');
        handleRouteChange();
      }
    });
  };

  // --- Edit Profile Settings Modal ---
  const openEditProfileModal = () => {
    DOM.userDropdownMenu.classList.remove('show');
    const user = getPanelUserInfo();

    QrewUI.openModal({
      title: 'Edit Profile Settings',
      bodyHtml: `
        <div style="display:flex;align-items:center;gap:14px;padding-bottom:16px;border-bottom:1px solid var(--color-border-subtle);">
          <div class="user-avatar" style="width:48px;height:48px;font-size:18px;font-weight:700;background-color:${user.avatarBg || 'var(--color-dark)'};">
            ${QrewUI.escapeHtml(user.avatar || user.name.charAt(0).toUpperCase())}
          </div>
          <div>
            <h3 style="font-size:16px;font-weight:600;color:var(--color-text-primary);margin:0;">${QrewUI.escapeHtml(user.name)}</h3>
            <div style="margin-top:4px;"><span class="badge" style="background:var(--color-surface);color:var(--color-accent);border:1px solid var(--color-border);font-size:11px;font-weight:600;padding:2px 8px;border-radius:4px;">${QrewUI.escapeHtml(user.role)}</span></div>
          </div>
        </div>

        <form id="edit-profile-form" style="display:flex;flex-direction:column;gap:14px;margin-top:14px;">
          <div class="form-group">
            <label class="form-label">Full Name <span class="required">*</span></label>
            <input type="text" class="form-input" id="profile-edit-name" value="${QrewUI.escapeHtml(user.name)}" required>
          </div>

          <div class="form-group">
            <label class="form-label">Email Address <span class="required">*</span></label>
            <input type="email" class="form-input" id="profile-edit-email" value="${QrewUI.escapeHtml(user.email)}" required>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:6px;">
            <div class="form-group">
              <label class="form-label">Active Panel Role</label>
              <input type="text" class="form-input" value="${QrewUI.escapeHtml(user.role)}" disabled style="background:var(--color-surface);color:var(--color-text-muted);cursor:not-allowed;">
              <span class="form-hint">Role scoped to active panel</span>
            </div>
            <div class="form-group">
              <label class="form-label">Account Status</label>
              <input type="text" class="form-input" value="Active" disabled style="background:var(--color-surface);color:var(--color-text-muted);cursor:not-allowed;">
              <span class="form-hint">Operational</span>
            </div>
          </div>
        </form>
      `,
      footerHtml: `
        <button class="btn btn-secondary" onclick="QrewUI.closeModal()">Cancel</button>
        <button class="btn btn-primary" id="btn-save-profile">Save Changes</button>
      `,
      onOpen: (modalEl) => {
        const nameInput = modalEl.querySelector('#profile-edit-name');
        nameInput.focus();

        modalEl.querySelector('#btn-save-profile').onclick = () => {
          const name = modalEl.querySelector('#profile-edit-name').value.trim();
          const email = modalEl.querySelector('#profile-edit-email').value.trim();

          if (!name || !email) {
            alert('Please provide your name and email address.');
            return;
          }

          try {
            const ws = AppState.activeWorkspace;
            let overrides = {};
            try {
              overrides = JSON.parse(localStorage.getItem('qrew_panel_user_overrides') || '{}');
            } catch (e) {}
            overrides[ws] = { name, email, avatar: name.charAt(0).toUpperCase() };
            localStorage.setItem('qrew_panel_user_overrides', JSON.stringify(overrides));

            if (ws === 'platform' || ws === 'super-admin') {
              try { QrewStore.updateCurrentUser({ name, email }); } catch (e) {}
            }

            syncHeaderUserProfile();
            QrewUI.closeModal();
            QrewUI.showToast('Profile updated successfully!', 'success');
          } catch (err) {
            alert(err.message);
          }
        };
      }
    });
  };

  // ==========================================
  // Workspace Switcher Tab Clicks
  // ==========================================
  if (DOM.wsTabPlatform) {
    DOM.wsTabPlatform.onclick = () => {
      AppState.activeWorkspace = 'platform';
      navigateTo('#platform/overview');
    };
  }

  if (DOM.wsTabTenant) {
    DOM.wsTabTenant.onclick = () => {
      AppState.activeWorkspace = 'tenant';
      const tenantId = AppState.currentTenantId || (QrewStore.getTenants()[0] ? QrewStore.getTenants()[0].id : '');
      navigateTo(`#tenant/overview?id=${tenantId}`);
    };
  }

  if (DOM.wsTabOffice) {
    DOM.wsTabOffice.onclick = () => {
      AppState.activeWorkspace = 'office';
      const tenantId = AppState.currentTenantId || (QrewStore.getTenants()[0] ? QrewStore.getTenants()[0].id : '');
      const offices = QrewStore.getOfficesByTenant(tenantId);
      const officeId = AppState.currentOfficeId || (offices[0] ? offices[0].id : '');
      navigateTo(`#office/overview?tenantId=${tenantId}&officeId=${officeId}`);
    };
  }

  if (DOM.wsTabConfig) {
    DOM.wsTabConfig.onclick = () => {
      AppState.activeWorkspace = 'office-config';
      const tenantId = AppState.currentTenantId || (QrewStore.getTenants()[0] ? QrewStore.getTenants()[0].id : 'ten_sst');
      const offices = QrewStore.getOfficesByTenant(tenantId);
      const officeId = AppState.currentOfficeId || (offices[0] ? offices[0].id : 'off_ctg_port');
      navigateTo(`#office-config?tenantId=${tenantId}&officeId=${officeId}`);
    };
  }

  if (DOM.wsTabDepartment) {
    DOM.wsTabDepartment.onclick = () => {
      AppState.activeWorkspace = 'department';
      const depts = QrewStore.getDepartments(AppState.currentOfficeId);
      const deptId = AppState.currentDeptId || (depts[0] ? depts[0].id : 'dept_ctg_ops');
      navigateTo(`#department/overview?deptId=${deptId}`);
    };
  }

  if (DOM.wsTabMember) {
    DOM.wsTabMember.onclick = () => {
      AppState.activeWorkspace = 'member';
      const userId = AppState.currentMemberId || 'usr_nusrat';
      navigateTo(`#member/overview?userId=${userId}`);
    };
  }

  // ==========================================
  // Global Shell Event Listeners
  // ==========================================

  // ==========================================
  // React State Hook Pattern for Sidebar (Requirement 10)
  // Provides reactive state, subscriber notifications, and persistence.
  // ==========================================
  function useReactSidebarState(initialState) {
    let state = initialState;
    const subscribers = [];

    const getState = () => state;

    const setState = (action) => {
      const nextState = typeof action === 'function' ? action(state) : action;
      if (nextState !== state) {
        state = nextState;
        subscribers.forEach(callback => callback(state));
      }
    };

    const subscribe = (callback) => {
      subscribers.push(callback);
      return () => {
        const idx = subscribers.indexOf(callback);
        if (idx !== -1) subscribers.splice(idx, 1);
      };
    };

    return [getState, setState, subscribe];
  }

  // Determine persisted preference
  const initialSidebarCollapsed = (() => {
    try {
      return localStorage.getItem('qrew_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  })();

  const [getSidebarCollapsed, setSidebarCollapsed, subscribeSidebar] = useReactSidebarState(initialSidebarCollapsed);

  // Reactive listener updating the DOM smoothly with zero page reload
  subscribeSidebar((collapsed) => {
    AppState.sidebarCollapsed = collapsed;
    if (DOM.sidebar) {
      DOM.sidebar.classList.toggle('collapsed', collapsed);
    }
    const label = collapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)';
    if (DOM.sidebarToggle) {
      DOM.sidebarToggle.setAttribute('title', label);
      DOM.sidebarToggle.setAttribute('aria-label', label);
      DOM.sidebarToggle.setAttribute('data-tooltip', label);
    }
    try {
      localStorage.setItem('qrew_sidebar_collapsed', String(collapsed));
    } catch (e) {}
  });

  // Apply initial state if already collapsed
  if (initialSidebarCollapsed) {
    AppState.sidebarCollapsed = true;
    if (DOM.sidebar) DOM.sidebar.classList.add('collapsed');
    if (DOM.sidebarToggle) {
      DOM.sidebarToggle.setAttribute('title', 'Expand sidebar (Ctrl+B)');
      DOM.sidebarToggle.setAttribute('aria-label', 'Expand sidebar (Ctrl+B)');
      DOM.sidebarToggle.setAttribute('data-tooltip', 'Expand sidebar (Ctrl+B)');
    }
  }

  // Sidebar Collapse / Expand Function
  const toggleSidebar = () => {
    setSidebarCollapsed(prev => !prev);
  };

  // Expose React state hook interface globally for component/testing integration
  window.useSidebarState = {
    getState: getSidebarCollapsed,
    setState: setSidebarCollapsed,
    toggle: toggleSidebar,
    subscribe: subscribeSidebar
  };

  if (DOM.sidebarToggle) {
    DOM.sidebarToggle.onclick = (e) => {
      e.stopPropagation();
      toggleSidebar();
    };
  }

  // Brand logo click navigation:
  // - Clicking 'Q' (Platform level) or '⚙' (Office Config) navigates to Platform Landing page (#landing)
  // - Clicking 'S' (Tenant/Office level) navigates to Tenant Landing page (#tenant-landing)
  const navigateBrandHome = (e) => {
    if (e) e.stopPropagation();
    if (AppState.activeWorkspace === 'platform' || AppState.activeWorkspace === 'super-admin' || AppState.activeWorkspace === 'office-config') {
      navigateTo('#landing');
    } else {
      const tenantId = AppState.currentTenantId || (QrewStore.getTenants()[0] ? QrewStore.getTenants()[0].id : 'ten_sst');
      navigateTo(`#tenant-landing?id=${tenantId}`);
    }
  };

  const sidebarBrandLogo = document.getElementById('sidebar-brand-logo');
  if (sidebarBrandLogo) {
    sidebarBrandLogo.onclick = navigateBrandHome;
  }

  const brandWrapper = document.getElementById('brand-wrapper');
  if (brandWrapper) {
    brandWrapper.onclick = navigateBrandHome;
  }

  const topbarDomainBadge = document.querySelector('.topbar-domain-badge');
  if (topbarDomainBadge) {
    topbarDomainBadge.title = 'Go to Qrew Landing Page';
    topbarDomainBadge.onclick = () => navigateTo('#landing');
  }

  // Keyboard shortcut: Ctrl+B or Cmd+B to toggle sidebar
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
      e.preventDefault();
      toggleSidebar();
    }
  });

  // Mobile Menu
  DOM.mobileMenuBtn.onclick = () => {
    DOM.sidebar.classList.toggle('mobile-open');
  };

  // User Profile Dropdown
  DOM.userDropdownTrigger.onclick = (e) => {
    e.stopPropagation();
    DOM.userDropdownMenu.classList.toggle('show');
    DOM.notificationsPopover.classList.remove('show');
  };

  // Notifications Popover
  DOM.notificationsTrigger.onclick = (e) => {
    e.stopPropagation();
    const isShowing = DOM.notificationsPopover.classList.contains('show');
    if (!isShowing) {
      const recentLogs = QrewStore.getAuditLogs().slice(0, 5);
      const listEl = document.getElementById('notifications-list');
      if (listEl) {
        listEl.innerHTML = recentLogs.map(l => `
          <div class="notification-item">
            <div class="notification-desc">
              <strong>${QrewUI.escapeHtml(l.actor)}</strong>: ${QrewUI.escapeHtml(l.description)}
            </div>
            <div class="notification-time">${l.timestamp}</div>
          </div>
        `).join('');
      }
    }
    DOM.notificationsPopover.classList.toggle('show');
    DOM.userDropdownMenu.classList.remove('show');
  };

  // Profile Edit Triggers
  const myProfileBtn = document.getElementById('action-my-profile');
  if (myProfileBtn) myProfileBtn.onclick = openEditProfileModal;

  const dropdownHeaderBtn = document.getElementById('dropdown-header-btn');
  if (dropdownHeaderBtn) dropdownHeaderBtn.onclick = openEditProfileModal;

  // Reset Demo Data
  const resetDemoBtn = document.getElementById('action-reset-data');
  if (resetDemoBtn) {
    resetDemoBtn.onclick = () => {
      DOM.userDropdownMenu.classList.remove('show');
      QrewUI.confirmDialog({
        title: 'Reset Demo Database',
        message: 'This will reset all localStorage state back to the initial sample seed data (SST organization).',
        confirmText: 'Reset to Defaults',
        confirmClass: 'btn-danger',
        onConfirm: () => {
          try { localStorage.removeItem('qrew_panel_user_overrides'); } catch (e) {}
          QrewStore.reset();
          syncHeaderUserProfile();
          QrewUI.showToast('Demo data restored to initial state.', 'success');
          handleRouteChange();
        }
      });
    };
  }

  // Close dropdowns when clicking outside
  document.addEventListener('click', () => {
    DOM.userDropdownMenu.classList.remove('show');
    DOM.notificationsPopover.classList.remove('show');
    document.querySelectorAll('.tree-action-menu.show').forEach(m => m.classList.remove('show'));
  });

  // Global keydown listeners
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      DOM.userDropdownMenu.classList.remove('show');
      DOM.notificationsPopover.classList.remove('show');
      document.querySelectorAll('.tree-action-menu.show').forEach(m => m.classList.remove('show'));
    }
  });

  // Hash Change Listener
  window.addEventListener('hashchange', handleRouteChange);

  // Initialize App
  syncHeaderUserProfile();
  handleRouteChange();
});
