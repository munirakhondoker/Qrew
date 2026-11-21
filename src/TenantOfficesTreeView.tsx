import React, { useState, useMemo, useEffect } from 'react';
import {
  ChevronRight,
  FolderClosed,
  FolderOpen,
  Building2,
  MapPin,
  Users,
  Settings,
  Edit2,
  Power,
  Trash2,
  Plus,
  Search,
  ArrowRight,
  CheckCircle2,
  MoreHorizontal
} from 'lucide-react';

export interface Office {
  id: string;
  name: string;
  location: string;
  staffCount: number;
  status: 'Active' | 'Suspended' | 'Pending';
}

export interface Tenant {
  id: string;
  name: string;
  ownerName: string;
  ownerEmail?: string;
  status: 'Active' | 'Suspended' | 'Pending';
  createdAt: string;
  offices: Office[];
  memberCount?: number;
}

interface TenantOfficesTreeViewProps {
  tenants?: Tenant[];
  activeTenantId?: string;
  onCreateOffice?: (tenantId: string) => void;
  onEditOffice?: (officeId: string) => void;
  onToggleOfficeStatus?: (officeId: string, currentStatus: string) => void;
  onDeleteOffice?: (officeId: string, officeName: string, tenantId: string) => void;
  onEditTenant?: (tenantId: string) => void;
  onToggleTenantStatus?: (tenantId: string, currentStatus: string) => void;
  onDeleteTenant?: (tenantId: string, tenantName: string) => void;
  onNavigateBranchHub?: (tenantId: string, officeId: string) => void;
  onNavigateOfficeAdmin?: (tenantId: string, officeId: string) => void;
  onNavigateOfficeConfig?: (tenantId: string, officeId: string) => void;
}

const DEFAULT_TENANTS: Tenant[] = [
  {
    id: 'ten_sst',
    name: 'SST',
    ownerName: 'Rafiqul Islam',
    ownerEmail: 'rafiq@sst.com',
    status: 'Active',
    createdAt: '2026-09-12',
    memberCount: 6,
    offices: [
      {
        id: 'off_ctg_port',
        name: 'Chittagong Port Office',
        location: 'Port Access Road, Chittagong',
        staffCount: 3,
        status: 'Active'
      },
      {
        id: 'off_mgl_port',
        name: 'Mongla Port Office',
        location: 'Mongla Port Area, Bagerhat, Khulna',
        staffCount: 1,
        status: 'Active'
      }
    ]
  }
];

export const TenantOfficesTreeView: React.FC<TenantOfficesTreeViewProps> = ({
  tenants = DEFAULT_TENANTS,
  activeTenantId = 'ten_sst',
  onCreateOffice,
  onEditOffice,
  onToggleOfficeStatus,
  onDeleteOffice,
  onEditTenant,
  onToggleTenantStatus,
  onDeleteTenant,
  onNavigateBranchHub,
  onNavigateOfficeAdmin,
  onNavigateOfficeConfig
}) => {
  const [expandedTenants, setExpandedTenants] = useState<Set<string>>(
    () => new Set([activeTenantId || tenants[0]?.id || ''])
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  // Close dropdowns on outside click or escape
  useEffect(() => {
    const handleGlobalClick = () => setActiveDropdownId(null);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveDropdownId(null);
    };
    window.addEventListener('click', handleGlobalClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('click', handleGlobalClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Toggle single tenant expansion
  const toggleTenant = (tenantId: string) => {
    setExpandedTenants((prev) => {
      const next = new Set(prev);
      if (next.has(tenantId)) {
        next.delete(tenantId);
      } else {
        next.add(tenantId);
      }
      return next;
    });
  };

  // Filtered tenants and offices based on search term
  const filteredTenants = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return tenants;

    return tenants.map((tenant) => {
      const tenantMatches =
        tenant.name.toLowerCase().includes(q) ||
        tenant.id.toLowerCase().includes(q) ||
        tenant.ownerName.toLowerCase().includes(q);

      const matchedOffices = tenant.offices.filter(
        (off) =>
          off.name.toLowerCase().includes(q) ||
          off.id.toLowerCase().includes(q) ||
          off.location.toLowerCase().includes(q)
      );

      if (matchedOffices.length > 0 && !expandedTenants.has(tenant.id)) {
        // Auto-expand parents of matching children
        setExpandedTenants((prev) => new Set([...prev, tenant.id]));
      }

      return {
        ...tenant,
        offices: tenantMatches ? tenant.offices : matchedOffices,
        isMatched: tenantMatches || matchedOffices.length > 0
      };
    }).filter((t) => (t as any).isMatched);
  }, [tenants, searchTerm, expandedTenants]);

  const totalOffices = useMemo(
    () => tenants.reduce((acc, t) => acc + t.offices.length, 0),
    [tenants]
  );

  return (
    <div className="w-full font-sans text-[#1F1D1A]">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1F1D1A]">
            Branch & Facility Offices
          </h1>
          <p className="text-sm text-[#7A736B] mt-1">
            Hierarchical tree view of organization facilities, physical offices, and operational branches.
          </p>
        </div>
        <div>
          <button
            onClick={() => onCreateOffice?.(activeTenantId)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#9A5B32] hover:bg-[#854D27] text-white text-sm font-semibold rounded-md shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#9A5B32]/30"
          >
            <Plus className="w-4 h-4" />
            Create Office
          </button>
        </div>
      </div>

      {/* Tree Card Container */}
      <div className="bg-white border border-[#EBE7E0] rounded-xl shadow-sm overflow-hidden">
        {/* Toolbar: Search and Controls */}
        <div className="p-3 sm:px-5 sm:py-3.5 bg-[#FAF8F5] border-b border-[#EBE7E0] flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="w-4 h-4 text-[#7A736B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search offices, IDs, or locations..."
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#EBE7E0] rounded-md text-sm text-[#1F1D1A] placeholder-[#7A736B] focus:outline-none focus:border-[#9A5B32] focus:ring-2 focus:ring-[#9A5B32]/10 transition-all"
            />
          </div>

          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center text-xs font-medium bg-[#EFECE6] text-[#7A736B] px-2.5 py-1 rounded-md border border-[#EBE7E0]">
              {tenants.length} Tenant{tenants.length !== 1 ? 's' : ''} • {totalOffices} Offices
            </span>
          </div>
        </div>

        {/* Tree Root List */}
        <div className="divide-y divide-[#EBE7E0]">
          {filteredTenants.length === 0 ? (
            <div className="p-12 text-center text-[#7A736B] text-sm">
              No matching organizations or offices found for "{searchTerm}".
            </div>
          ) : (
            filteredTenants.map((tenant) => {
              const isExpanded = expandedTenants.has(tenant.id);
              const totalTenantOffices = tenant.offices.length;

              return (
                <div key={tenant.id} className="group">
                  {/* Root Level: Tenant Row */}
                  <div
                    onClick={() => toggleTenant(tenant.id)}
                    role="button"
                    tabIndex={0}
                    aria-expanded={isExpanded}
                    aria-label={`Tenant Organization ${tenant.name}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleTenant(tenant.id);
                      }
                    }}
                    className={`flex flex-col md:flex-row md:items-center justify-between p-3.5 sm:px-5 gap-3 cursor-pointer transition-colors select-none outline-none focus-visible:ring-2 focus-visible:ring-[#9A5B32]/30 ${
                      isExpanded ? 'bg-[#FAF8F5]/50 border-l-3 border-[#9A5B32]' : 'bg-white hover:bg-[#FAF8F5]'
                    }`}
                  >
                    {/* Left: Expander, Folder Icon, Title, ID */}
                    <div className="flex items-center gap-3 min-w-[220px]">
                      <span
                        className={`text-[#7A736B] transition-transform duration-200 ${
                          isExpanded ? 'rotate-90 text-[#9A5B32]' : ''
                        }`}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </span>
                      <div
                        className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${
                          isExpanded
                            ? 'bg-[#9A5B32] text-white shadow-xs'
                            : 'bg-[#9A5B32]/10 text-[#9A5B32]'
                        }`}
                      >
                        {isExpanded ? (
                          <FolderOpen className="w-4 h-4" />
                        ) : (
                          <FolderClosed className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-[16px] text-[#1F1D1A] leading-tight">
                          {tenant.name}
                        </span>
                        <span className="font-mono text-[11px] font-medium text-[#7A736B] w-fit">
                          {tenant.id}
                        </span>
                      </div>
                    </div>

                    {/* Middle: Metadata Pills */}
                    <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs text-[#7A736B] flex-1">
                      <span className="inline-flex items-center gap-1.5" title="Account Owner">
                        <Users className="w-3.5 h-3.5 text-[#7A736B]" />
                        <span className="text-[#7A736B]">Owner:</span>
                        <strong className="text-[#1F1D1A] font-semibold">{tenant.ownerName}</strong>
                      </span>
                      <span className="text-[#EBE7E0]">•</span>
                      <span className="font-semibold bg-[#FAF8F5] text-[#1F1D1A] px-2 py-0.5 rounded border border-[#EBE7E0]">
                        {totalTenantOffices} office{totalTenantOffices !== 1 ? 's' : ''}
                      </span>
                      {tenant.memberCount !== undefined && (
                        <>
                          <span className="text-[#EBE7E0]">•</span>
                          <span>{tenant.memberCount} members</span>
                        </>
                      )}
                      <span className="text-[#EBE7E0]">•</span>
                      <span className="inline-flex items-center gap-1 font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        {tenant.status}
                      </span>
                      <span className="text-[#EBE7E0]">•</span>
                      <span className="font-mono text-[11px] text-[#7A736B]">
                        Est. {tenant.createdAt}
                      </span>
                    </div>

                    {/* Right: Tenant Action Icons */}
                    <div
                      className="flex items-center gap-1.5 self-end md:self-auto relative"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => onEditTenant?.(tenant.id)}
                        className="p-1.5 text-[#7A736B] hover:text-[#1F1D1A] hover:bg-[#FAF8F5] rounded border border-transparent hover:border-[#EBE7E0] transition-colors"
                        title="Edit Organization Details"
                        aria-label="Edit Tenant Organization"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      
                      <div className="relative">
                        <button
                          onClick={() =>
                            setActiveDropdownId(activeDropdownId === `tenant-${tenant.id}` ? null : `tenant-${tenant.id}`)
                          }
                          className="p-1.5 text-[#7A736B] hover:text-[#1F1D1A] hover:bg-[#FAF8F5] rounded border border-transparent hover:border-[#EBE7E0] transition-colors"
                          title="More Organization Actions"
                          aria-label="More Organization Actions"
                        >
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </button>

                        {activeDropdownId === `tenant-${tenant.id}` && (
                          <div className="absolute right-0 top-full mt-1.5 w-48 bg-white border border-[#EBE7E0] rounded-lg shadow-lg py-1.5 z-50 text-xs">
                            <button
                              onClick={() => {
                                setActiveDropdownId(null);
                                onEditTenant?.(tenant.id);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-[#1F1D1A] hover:bg-[#FAF8F5] hover:text-[#9A5B32] text-left transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-[#7A736B]" /> Edit Organization
                            </button>
                            <button
                              onClick={() => {
                                setActiveDropdownId(null);
                                onToggleTenantStatus?.(tenant.id, tenant.status);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-[#1F1D1A] hover:bg-[#FAF8F5] hover:text-[#9A5B32] text-left transition-colors"
                            >
                              <Power className="w-3.5 h-3.5 text-[#7A736B]" />
                              {tenant.status === 'Active' ? 'Suspend Organization' : 'Activate Organization'}
                            </button>
                            <div className="my-1 border-t border-[#EBE7E0]" />
                            <button
                              onClick={() => {
                                setActiveDropdownId(null);
                                onDeleteTenant?.(tenant.id, tenant.name);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-red-600 hover:bg-red-50 text-left transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-600" /> Delete Organization
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Child Level: Offices Tree Branch */}
                  {isExpanded && (
                    <div className="relative bg-[#FAF8F5] pl-8 sm:pl-12 pr-4 sm:pr-6 py-3 space-y-2.5">
                      {/* Vertical Tree Connector Guide Line */}
                      <div className="absolute left-6 sm:left-9 top-0 bottom-4 w-0.5 bg-[#EBE7E0]" />

                      {tenant.offices.length === 0 ? (
                        <div className="relative flex items-center justify-between p-3.5 bg-white border border-dashed border-[#EBE7E0] rounded-lg text-xs text-[#7A736B]">
                          <span>No offices created yet under this organization.</span>
                          <button
                            onClick={() => onCreateOffice?.(tenant.id)}
                            className="inline-flex items-center gap-1 font-semibold text-[#9A5B32] hover:text-[#854D27]"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add Office
                          </button>
                        </div>
                      ) : (
                        tenant.offices.map((office) => (
                          <div
                            key={office.id}
                            className="relative flex flex-col lg:flex-row lg:items-center justify-between p-3 bg-white border border-[#EBE7E0] hover:border-[#9A5B32]/35 rounded-lg shadow-2xs hover:shadow-xs transition-all gap-3 group/item"
                          >
                            {/* Horizontal Branch Connector Line */}
                            <div className="absolute -left-2 sm:-left-3 top-1/2 -translate-y-1/2 w-2 sm:w-3 h-0.5 bg-[#EBE7E0]" />

                            {/* Group 1: Office Identity */}
                            <div className="flex items-center gap-3 min-w-[230px]">
                              <div className="w-8 h-8 rounded bg-[#FAF8F5] border border-[#EBE7E0] text-[#9A5B32] flex items-center justify-center shrink-0">
                                <Building2 className="w-4 h-4" />
                              </div>
                              <div className="flex flex-col">
                                <button
                                  onClick={() => onNavigateBranchHub?.(tenant.id, office.id)}
                                  className="font-semibold text-sm text-[#1F1D1A] hover:text-[#9A5B32] transition-colors text-left leading-snug"
                                >
                                  {office.name}
                                </button>
                                <span className="font-mono text-[11px] font-medium text-[#7A736B]">
                                  {office.id}
                                </span>
                              </div>
                            </div>

                            {/* Group 2: Office Metadata */}
                            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs text-[#7A736B] flex-1">
                              <span className="inline-flex items-center gap-1 text-xs text-[#7A736B]" title="Location">
                                <MapPin className="w-3.5 h-3.5 text-[#9A5B32]" />
                                {office.location || 'Location Not Specified'}
                              </span>
                              <span className="text-[#EBE7E0]">•</span>
                              <span className="text-xs text-[#1F1D1A] bg-[#FAF8F5] px-2 py-0.5 rounded border border-[#EBE7E0]">
                                {office.staffCount} staff member{office.staffCount !== 1 ? 's' : ''}
                              </span>
                              <span className="text-[#EBE7E0]">•</span>
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                {office.status}
                              </span>
                            </div>

                            {/* Group 3: Office Action Buttons */}
                            <div className="flex items-center gap-1.5 self-end lg:self-auto shrink-0 relative">
                              {/* Secondary actions in three-dot dropdown menu */}
                              <div className="relative">
                                <button
                                  onClick={() =>
                                    setActiveDropdownId(activeDropdownId === `office-${office.id}` ? null : `office-${office.id}`)
                                  }
                                  className="p-1.5 text-[#7A736B] hover:text-[#1F1D1A] hover:bg-[#FAF8F5] rounded border border-transparent hover:border-[#EBE7E0] transition-colors"
                                  title="More Office Actions"
                                  aria-label="More Office Actions"
                                >
                                  <MoreHorizontal className="w-3.5 h-3.5" />
                                </button>

                                {activeDropdownId === `office-${office.id}` && (
                                  <div className="absolute right-0 top-full mt-1.5 w-48 bg-white border border-[#EBE7E0] rounded-lg shadow-lg py-1.5 z-50 text-xs">
                                    <button
                                      onClick={() => {
                                        setActiveDropdownId(null);
                                        onNavigateBranchHub?.(tenant.id, office.id);
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-1.5 text-[#1F1D1A] hover:bg-[#FAF8F5] hover:text-[#9A5B32] text-left transition-colors"
                                    >
                                      <Building2 className="w-3.5 h-3.5 text-[#7A736B]" /> Open Branch Hub
                                    </button>
                                    <button
                                      onClick={() => {
                                        setActiveDropdownId(null);
                                        onNavigateOfficeAdmin?.(tenant.id, office.id);
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-1.5 text-[#1F1D1A] hover:bg-[#FAF8F5] hover:text-[#9A5B32] text-left transition-colors"
                                    >
                                      <ArrowRight className="w-3.5 h-3.5 text-[#7A736B]" /> Office Admin
                                    </button>
                                    <button
                                      onClick={() => {
                                        setActiveDropdownId(null);
                                        onNavigateOfficeConfig?.(tenant.id, office.id);
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-1.5 text-[#1F1D1A] hover:bg-[#FAF8F5] hover:text-[#9A5B32] text-left transition-colors"
                                    >
                                      <Settings className="w-3.5 h-3.5 text-[#7A736B]" /> Configure Facility Specs
                                    </button>
                                    <button
                                      onClick={() => {
                                        setActiveDropdownId(null);
                                        onEditOffice?.(office.id);
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-1.5 text-[#1F1D1A] hover:bg-[#FAF8F5] hover:text-[#9A5B32] text-left transition-colors"
                                    >
                                      <Edit2 className="w-3.5 h-3.5 text-[#7A736B]" /> Edit Office Details
                                    </button>
                                    <button
                                      onClick={() => {
                                        setActiveDropdownId(null);
                                        onToggleOfficeStatus?.(office.id, office.status);
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-1.5 text-[#1F1D1A] hover:bg-[#FAF8F5] hover:text-[#9A5B32] text-left transition-colors"
                                    >
                                      <Power className="w-3.5 h-3.5 text-[#7A736B]" />
                                      {office.status === 'Active' ? 'Suspend Office' : 'Activate Office'}
                                    </button>
                                    <div className="my-1 border-t border-[#EBE7E0]" />
                                    <button
                                      onClick={() => {
                                        setActiveDropdownId(null);
                                        onDeleteOffice?.(office.id, office.name, tenant.id);
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-1.5 text-red-600 hover:bg-red-50 text-left transition-colors"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 text-red-600" /> Delete Office Branch
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default TenantOfficesTreeView;
