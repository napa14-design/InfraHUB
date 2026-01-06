import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Construction } from 'lucide-react';
import { moduleService } from '../services/moduleService';

export const ModuleView: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const moduleInfo = moduleService.getAll().find(m => m.path.includes(id || ''));

  return (
    <div className="space-y-6">
      <button 
        onClick={() => navigate('/')}
        className="flex items-center text-slate-500 hover:text-brand-600 transition-colors text-sm font-medium"
      >
        <ArrowLeft size={16} className="mr-1" />
        Voltar ao Dashboard
      </button>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 min-h-[400px] flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-6 text-slate-400">
          <Construction size={32} />
        </div>
        
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          {moduleInfo ? moduleInfo.title : 'Módulo Interno'}
        </h1>
        <p className="text-slate-500 max-w-md mx-auto mb-8">
          Este é o ambiente do módulo operacional <strong>{id}</strong>. 
          Em uma aplicação real, aqui estariam as funcionalidades específicas deste sistema.
        </p>

        <div className="flex gap-3">
          <button className="px-4 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors">
            Criar Registro
          </button>
          <button className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors">
            Ver Relatórios
          </button>
        </div>
      </div>
    </div>
  );
};