
import React, { useState, useEffect } from 'react';
import { ArrowLeft, FileText, Search, Filter, Shield, Clock, User, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LogEntry } from '../types';
import { logService } from '../services/logService';
import { exportToCSV } from '../utils/csvExport';

export const AuditLogs: React.FC = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  useEffect(() => {
    const load = async () => {
        const data = await logService.getAll();
        setLogs(data);
        setFilteredLogs(data);
    };
    load();
  }, []);

  useEffect(() => {
    let result = logs;

    if (searchTerm) {
        const lower = searchTerm.toLowerCase();
        result = result.filter(l => 
            l.userName.toLowerCase().includes(lower) || 
            l.target.toLowerCase().includes(lower) ||
            l.details?.toLowerCase().includes(lower)
        );
    }

    if (moduleFilter) {
        result = result.filter(l => l.module === moduleFilter);
    }

    if (actionFilter) {
        result = result.filter(l => l.action === actionFilter);
    }

    setFilteredLogs(result);
  }, [searchTerm, moduleFilter, actionFilter, logs]);

  const handleExport = () => {
      exportToCSV(filteredLogs, 'Audit_Logs_Export');
  };

  const getActionColor = (action: string) => {
      switch(action) {
          case 'CREATE': return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20';
          case 'UPDATE': return 'text-blue-500 bg-blue-50 dark:bg-blue-900/20';
          case 'DELETE': return 'text-red-500 bg-red-50 dark:bg-red-900/20';
          case 'LOGIN': return 'text-purple-500 bg-purple-50 dark:bg-purple-900/20';
          default: return 'text-slate-500 bg-slate-50 dark:bg-slate-800';
      }
  };

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
            LOGS DE AUDITORIA
          </h1>
          <p className="text-sm text-slate-500 font-mono">Rastreamento completo de atividades do sistema.</p>
        </div>
        <button onClick={handleExport} className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <Download size={16} /> Exportar CSV
        </button>
      </div>

      {/* FILTERS */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 w-full relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand-500 font-mono"
                placeholder="Buscar por usuário, alvo ou detalhes..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
              <select 
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold uppercase p-2 outline-none"
                value={moduleFilter}
                onChange={e => setModuleFilter(e.target.value)}
              >
                  <option value="">Todos Módulos</option>
                  <option value="AUTH">Auth</option>
                  <option value="HYDROSYS">HydroSys</option>
                  <option value="ADMIN">Admin</option>
              </select>
              <select 
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold uppercase p-2 outline-none"
                value={actionFilter}
                onChange={e => setActionFilter(e.target.value)}
              >
                  <option value="">Todas Ações</option>
                  <option value="CREATE">Create</option>
                  <option value="UPDATE">Update</option>
                  <option value="DELETE">Delete</option>
                  <option value="LOGIN">Login</option>
              </select>
          </div>
      </div>

      {/* TABLE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
              <table className="w-full text-left text-sm font-mono">
                  <thead className="bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                          <th className="px-6 py-4 text-slate-500 text-xs font-bold uppercase tracking-wider">Data/Hora</th>
                          <th className="px-6 py-4 text-slate-500 text-xs font-bold uppercase tracking-wider">Usuário</th>
                          <th className="px-6 py-4 text-slate-500 text-xs font-bold uppercase tracking-wider">Módulo</th>
                          <th className="px-6 py-4 text-slate-500 text-xs font-bold uppercase tracking-wider">Ação</th>
                          <th className="px-6 py-4 text-slate-500 text-xs font-bold uppercase tracking-wider">Detalhes</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredLogs.length === 0 ? (
                          <tr><td colSpan={5} className="p-8 text-center text-slate-400">Nenhum registro encontrado.</td></tr>
                      ) : (
                          filteredLogs.map(log => (
                              <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                      <div className="flex items-center gap-2">
                                          <Clock size={14} />
                                          {new Date(log.timestamp).toLocaleString()}
                                      </div>
                                  </td>
                                  <td className="px-6 py-4">
                                      <div className="flex flex-col">
                                          <span className="font-bold text-slate-900 dark:text-white">{log.userName}</span>
                                          <span className="text-[10px] text-slate-500 uppercase">{log.userRole}</span>
                                      </div>
                                  </td>
                                  <td className="px-6 py-4">
                                      <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-bold uppercase text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                          {log.module}
                                      </span>
                                  </td>
                                  <td className="px-6 py-4">
                                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${getActionColor(log.action)}`}>
                                          {log.action}
                                      </span>
                                  </td>
                                  <td className="px-6 py-4">
                                      <div className="max-w-xs truncate">
                                          <span className="font-bold text-slate-700 dark:text-slate-300">{log.target}</span>
                                          <p className="text-xs text-slate-500 truncate" title={log.details}>{log.details}</p>
                                      </div>
                                  </td>
                              </tr>
                          ))
                      )}
                  </tbody>
              </table>
          </div>
      </div>
    </div>
  );
};
