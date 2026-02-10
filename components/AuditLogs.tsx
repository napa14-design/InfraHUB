
import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, Search, Filter, Shield, Clock, User, Download, 
  Calendar, RefreshCw, ChevronLeft, ChevronRight, Terminal, 
  Activity, AlertTriangle, CheckCircle2, Database, X 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LogEntry, UserRole, User as AppUser } from '../types';
import { logService } from '../services/logService';
import { authService } from '../services/authService';
import { exportToCSV } from '../utils/csvExport';
import { TableRowSkeleton } from './Shared/Skeleton';

// --- COMPONENTS ---

const StatCard = ({ label, value, icon: Icon, color, trend }: any) => (
  <div className="bg-white dark:bg-[#111114] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <h3 className="text-2xl font-black text-slate-900 dark:text-white font-mono">{value}</h3>
    </div>
    <div className={`p-3 rounded-lg ${color} bg-opacity-10 text-opacity-100`}>
      <Icon size={20} className={color.replace('bg-', 'text-').replace('/10', '')} />
    </div>
  </div>
);

const ActionBadge = ({ action }: { action: string }) => {
  let style = 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
  let icon = <Activity size={10} />;

  switch (action) {
    case 'CREATE':
      style = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20';
      icon = <CheckCircle2 size={10} />;
      break;
    case 'UPDATE':
      style = 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-500/20';
      icon = <RefreshCw size={10} />;
      break;
    case 'DELETE':
      style = 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-500/20';
      icon = <AlertTriangle size={10} />;
      break;
    case 'LOGIN':
    case 'AUTH':
      style = 'bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 border-purple-200 dark:border-purple-500/20';
      icon = <Shield size={10} />;
      break;
    case 'EXPORT':
        style = 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20';
        icon = <Download size={10} />;
        break;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[9px] font-bold uppercase border ${style}`}>
      {icon} {action}
    </span>
  );
};

export const AuditLogs: React.FC = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  
  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    const u = authService.getCurrentUser();
    setCurrentUser(u);
    loadData(u);
  }, []);

  const loadData = async (user: AppUser | null = currentUser) => {
    setIsLoading(true);
    // Simulate slight network delay for skeleton demo
    setTimeout(async () => {
        let data = await logService.getAll();
        
        // Filter for GESTOR: only show logs for users in their Sedes
        if (user && user.role === UserRole.GESTOR) {
            const allUsers = await authService.getAllUsers();
            const mySedes = user.sedeIds || [];
            
            // Find users that share at least one Sede with the Gestor
            const relevantUserIds = allUsers
                .filter(u => u.sedeIds?.some(s => mySedes.includes(s)))
                .map(u => u.id);
            
            // Ensure Gestor sees their own logs too
            if (!relevantUserIds.includes(user.id)) relevantUserIds.push(user.id);

            data = data.filter(log => relevantUserIds.includes(log.userId));
        }

        setLogs(data);
        setIsLoading(false);
    }, 600);
  };

  // --- FILTER LOGIC ---
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Text Search
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        log.userName.toLowerCase().includes(searchLower) || 
        log.target.toLowerCase().includes(searchLower) ||
        (log.details || '').toLowerCase().includes(searchLower) ||
        log.id.toLowerCase().includes(searchLower);

      // Dropdowns
      const matchesModule = moduleFilter === 'ALL' || log.module === moduleFilter;
      
      // Action Filter Logic (Enhanced for Groups)
      let matchesAction = true;
      if (actionFilter !== 'ALL') {
          if (actionFilter === 'LOGIN') {
              // Group LOGIN and AUTH
              matchesAction = log.action === 'LOGIN' || log.action === 'AUTH';
          } else {
              matchesAction = log.action === actionFilter;
          }
      }

      // Date Range
      let matchesDate = true;
      if (dateRange.start) {
        matchesDate = matchesDate && new Date(log.timestamp) >= new Date(dateRange.start);
      }
      if (dateRange.end) {
        // Adjust end date to include the full day
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999);
        matchesDate = matchesDate && new Date(log.timestamp) <= endDate;
      }

      return matchesSearch && matchesModule && matchesAction && matchesDate;
    });
  }, [logs, searchTerm, moduleFilter, actionFilter, dateRange]);

  // --- STATS CALCULATION ---
  const stats = useMemo(() => {
    return {
      total: filteredLogs.length,
      critical: filteredLogs.filter(l => l.action === 'DELETE').length,
      users: new Set(filteredLogs.map(l => l.userId)).size,
      modules: new Set(filteredLogs.map(l => l.module)).size
    };
  }, [filteredLogs]);

  // --- PAGINATION LOGIC ---
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleExport = async () => {
      // 1. Export Data
      exportToCSV(filteredLogs, 'Audit_Logs_Export');
      
      // 2. Log the Export Action
      if (currentUser) {
          await logService.logAction(
              currentUser, 
              'AUDIT', 
              'EXPORT', 
              'relatório CSV', 
              `Exportou ${filteredLogs.length} registros.`
          );
          // 3. Refresh list to show the new log entry
          loadData(currentUser);
      }
  };

  const clearFilters = () => {
      setSearchTerm('');
      setModuleFilter('ALL');
      setActionFilter('ALL');
      setDateRange({ start: '', end: '' });
      setCurrentPage(1);
  };

  // Extract Unique Modules for Filter
  const uniqueModules = Array.from(new Set(logs.map(l => l.module))).sort();

  // --- CONFIGURAÇÃO VISUAL DOS FILTROS DE AÇÃO ---
  const actionFiltersConfig = [
      { id: 'ALL', label: 'Todas', icon: Activity, activeClass: 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md' },
      { id: 'CREATE', label: 'criação', icon: CheckCircle2, activeClass: 'bg-emerald-600 text-white shadow-emerald-500/30 shadow-md' },
      { id: 'UPDATE', label: 'Edição', icon: RefreshCw, activeClass: 'bg-blue-600 text-white shadow-blue-500/30 shadow-md' },
      { id: 'DELETE', label: 'exclusão', icon: AlertTriangle, activeClass: 'bg-red-600 text-white shadow-red-500/30 shadow-md' },
      { id: 'LOGIN', label: 'Acesso', icon: Shield, activeClass: 'bg-purple-600 text-white shadow-purple-500/30 shadow-md' },
      { id: 'EXPORT', label: 'Exportação', icon: Download, activeClass: 'bg-amber-500 text-white shadow-amber-500/30 shadow-md' },
  ];

  return (
    <div className="relative min-h-screen space-y-6 pb-20">
      
      {/* BACKGROUND */}
      <div className="absolute inset-0 pointer-events-none -z-10 fixed">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-[#0A0A0C] dark:via-[#0D0D10] dark:to-[#0A0A0C]" />
        <div 
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] text-brand-600 dark:text-brand-500"
          style={{ backgroundImage: `linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)`, backgroundSize: '40px 40px' }}
        />
      </div>

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4">
        <div>
          <button onClick={() => navigate('/')} className="flex items-center text-slate-500 dark:text-slate-400 hover:text-brand-600 transition-colors text-xs font-mono uppercase tracking-widest mb-2">
            <ArrowLeft size={14} className="mr-1" /> Voltar ao Painel
          </button>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
            <Shield className="text-brand-600 dark:text-brand-400" size={28} />
            CONSOLE DE AUDITORIA
          </h1>
          <p className="text-sm text-slate-500 font-mono">
              {currentUser?.role === UserRole.GESTOR 
                ? 'Registro de operações da sua unidade.' 
                : 'Registro imutável de operações do sistema.'}
          </p>
        </div>
        <div className="flex gap-2">
            <button onClick={() => loadData(currentUser)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold uppercase hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-2">
                <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} /> Atualizar
            </button>
            <button onClick={handleExport} className="px-4 py-2 bg-brand-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/20">
                <Download size={16} /> CSV
            </button>
        </div>
      </div>

      {/* STATS ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Eventos Listados" value={stats.total} icon={Database} color="bg-brand-500" />
          <StatCard label="Ações críticas" value={stats.critical} icon={AlertTriangle} color="bg-red-500" />
          <StatCard label="usuários Ativos" value={stats.users} icon={User} color="bg-emerald-500" />
          <StatCard label="Módulos" value={stats.modules} icon={Terminal} color="bg-purple-500" />
      </div>

      {/* FILTER BAR - PRIMARY */}
      <div className="bg-white dark:bg-[#111114] p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col xl:flex-row gap-2">
          
          {/* Search */}
          <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                className="w-full pl-11 pr-4 py-3 bg-transparent text-sm outline-none font-mono text-slate-700 dark:text-slate-200 placeholder-slate-400"
                placeholder="Buscar ID, usuário ou Detalhes..."
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
          </div>

          <div className="h-px xl:h-auto w-full xl:w-px bg-slate-100 dark:bg-slate-800 mx-1"></div>

          {/* Date Range */}
          <div className="flex items-center gap-2 px-2">
              <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input 
                    type="date" 
                    className="pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono font-bold text-slate-600 dark:text-slate-300 outline-none focus:border-brand-500"
                    value={dateRange.start}
                    onChange={e => { setDateRange(prev => ({ ...prev, start: e.target.value })); setCurrentPage(1); }}
                  />
              </div>
              <span className="text-slate-400">-</span>
              <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input 
                    type="date" 
                    className="pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono font-bold text-slate-600 dark:text-slate-300 outline-none focus:border-brand-500"
                    value={dateRange.end}
                    onChange={e => { setDateRange(prev => ({ ...prev, end: e.target.value })); setCurrentPage(1); }}
                  />
              </div>
          </div>

          <div className="h-px xl:h-auto w-full xl:w-px bg-slate-100 dark:bg-slate-800 mx-1"></div>

          {/* Module Filter (Dropdown works better for potentially long list of modules) */}
          <div className="flex gap-2 p-2 xl:p-0 items-center">
              <select 
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold uppercase py-2 px-3 outline-none text-slate-600 dark:text-slate-300 focus:border-brand-500 min-w-[140px]"
                value={moduleFilter}
                onChange={e => { setModuleFilter(e.target.value); setCurrentPage(1); }}
              >
                  <option value="ALL">Módulos: Todos</option>
                  {uniqueModules.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              
              {(searchTerm || moduleFilter !== 'ALL' || actionFilter !== 'ALL' || dateRange.start || dateRange.end) && (
                  <button onClick={clearFilters} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Limpar Filtros">
                      <X size={16} />
                  </button>
              )}
          </div>
      </div>

      {/* FILTER BAR - ACTION TYPES (CHIPS) */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
          {actionFiltersConfig.map(f => {
              const isActive = actionFilter === f.id;
              const Icon = f.icon;
              return (
                  <button
                    key={f.id}
                    onClick={() => { setActionFilter(f.id); setCurrentPage(1); }}
                    className={`
                        flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all border
                        ${isActive 
                            ? `${f.activeClass} border-transparent` 
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-700 dark:hover:text-slate-300'}
                    `}
                  >
                      <Icon size={14} />
                      {f.label}
                  </button>
              );
          })}
      </div>

      {/* TABLE */}
      <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm flex flex-col min-h-[500px]">
          <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-sm font-mono">
                  <thead className="bg-slate-50 dark:bg-black/40 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                          <th className="px-6 py-4 text-slate-400 text-[10px] font-black uppercase tracking-widest w-48">Timestamp</th>
                          <th className="px-6 py-4 text-slate-400 text-[10px] font-black uppercase tracking-widest w-32">Módulo</th>
                          <th className="px-6 py-4 text-slate-400 text-[10px] font-black uppercase tracking-widest w-48">usuário</th>
                          <th className="px-6 py-4 text-slate-400 text-[10px] font-black uppercase tracking-widest w-32">ação</th>
                          <th className="px-6 py-4 text-slate-400 text-[10px] font-black uppercase tracking-widest">Detalhes do Evento</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                      {isLoading ? (
                          // Skeleton Loading
                          [...Array(5)].map((_, i) => (
                              <tr key={i}><td colSpan={5} className="p-0"><TableRowSkeleton /></td></tr>
                          ))
                      ) : filteredLogs.length === 0 ? (
                          <tr>
                              <td colSpan={5} className="p-12 text-center">
                                  <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-slate-300 dark:border-slate-700">
                                      <Filter size={24} className="text-slate-400 opacity-50" />
                                  </div>
                                  <p className="text-slate-500 text-xs font-mono uppercase tracking-wider">Nenhum registro encontrado</p>
                              </td>
                          </tr>
                      ) : (
                          paginatedLogs.map(log => (
                              <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors group">
                                  <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="flex flex-col">
                                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                              {new Date(log.timestamp).toLocaleDateString()}
                                          </span>
                                          <span className="text-[10px] text-slate-400">
                                              {new Date(log.timestamp).toLocaleTimeString()}
                                          </span>
                                      </div>
                                  </td>
                                  <td className="px-6 py-4">
                                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
                                          {log.module}
                                      </span>
                                  </td>
                                  <td className="px-6 py-4">
                                      <div className="flex items-center gap-2">
                                          <div className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500 uppercase">
                                              {log.userName.charAt(0)}
                                          </div>
                                          <div className="flex flex-col">
                                              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[120px]" title={log.userName}>{log.userName}</span>
                                              <span className="text-[9px] text-slate-400 uppercase">{log.userRole}</span>
                                          </div>
                                      </div>
                                  </td>
                                  <td className="px-6 py-4">
                                      <ActionBadge action={log.action} />
                                  </td>
                                  <td className="px-6 py-4">
                                      <div className="flex flex-col gap-1">
                                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">
                                              {log.target}
                                          </span>
                                          {log.details && (
                                              <span className="text-[10px] text-slate-500 dark:text-slate-500 font-mono truncate max-w-md group-hover:whitespace-normal group-hover:overflow-visible transition-all">
                                                  {log.details}
                                              </span>
                                          )}
                                      </div>
                                  </td>
                              </tr>
                          ))
                      )}
                  </tbody>
              </table>
          </div>

          {/* PAGINATION FOOTER */}
          <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#111114] p-4 flex items-center justify-between">
              <p className="text-[10px] font-mono text-slate-500 uppercase">
                  Mostrando <span className="font-bold text-slate-900 dark:text-white">{paginatedLogs.length}</span> de <span className="font-bold text-slate-900 dark:text-white">{filteredLogs.length}</span> eventos
              </p>
              
              <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-600 dark:text-slate-400"
                  >
                      <ChevronLeft size={16} />
                  </button>
                  <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 px-2">
                      PÁGINA {currentPage} / {totalPages || 1}
                  </span>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-600 dark:text-slate-400"
                  >
                      <ChevronRight size={16} />
                  </button>
              </div>
          </div>
      </div>
    </div>
  );
};
