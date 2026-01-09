
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, HelpCircle, FileText, Phone, Download, Shield } from 'lucide-react';
import { User } from '../../types';

export const PestControlHelp: React.FC<{ user: User }> = () => {
  const navigate = useNavigate();

  const DocCard = ({ title, desc }: { title: string, desc: string }) => (
      <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-cyan-500 transition-colors group cursor-pointer">
          <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:text-cyan-500 rounded-lg transition-colors">
                  <FileText size={20} />
              </div>
              <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">{title}</h4>
                  <p className="text-xs text-slate-500">{desc}</p>
              </div>
          </div>
          <Download size={16} className="text-slate-300 group-hover:text-cyan-500" />
      </div>
  );

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-[#0A0A0C] p-4 md:p-8">
       {/* Background */}
       <div className="fixed inset-0 -z-10 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-[#0A0A0C] dark:via-[#0D0D10] dark:to-[#0A0A0C]" />
       </div>

       <button onClick={() => navigate('/module/pestcontrol')} className="flex items-center text-slate-500 hover:text-amber-600 transition-colors text-xs font-mono uppercase tracking-widest mb-8">
            <ArrowLeft size={16} className="mr-2" /> Voltar
       </button>
       
       <div className="max-w-5xl mx-auto space-y-8">
           <div className="flex flex-col md:flex-row gap-6 items-start">
               {/* Left Column: Info */}
               <div className="flex-1 space-y-6">
                   <h1 className="text-3xl font-black text-slate-900 dark:text-white font-mono flex items-center gap-3">
                       <HelpCircle className="text-cyan-600" /> CENTRAL DE AJUDA
                   </h1>
                   
                   <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                       <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-900 dark:text-white uppercase font-mono text-sm tracking-wider">
                           <Shield size={18} className="text-amber-500"/> Procedimentos de Segurança
                       </h3>
                       <ul className="space-y-4 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                           <li className="flex gap-3">
                               <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0"></span>
                               <span><strong>Ventilação:</strong> Manter ambientes ventilados por no mínimo 2 horas após aplicação de fumacê.</span>
                           </li>
                           <li className="flex gap-3">
                               <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0"></span>
                               <span><strong>Isolamento:</strong> Áreas com aplicação de pó químico devem ser isoladas e sinalizadas.</span>
                           </li>
                           <li className="flex gap-3">
                               <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0"></span>
                               <span><strong>EPIs:</strong> O acompanhamento técnico exige uso de máscara e óculos de proteção.</span>
                           </li>
                       </ul>
                   </div>

                   <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                       <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-900 dark:text-white uppercase font-mono text-sm tracking-wider">
                           <Phone size={18} className="text-red-500"/> Emergência
                       </h3>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30">
                               <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-1">Intoxicação (ANVISA)</p>
                               <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">0800 722 6001</p>
                           </div>
                           <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Suporte Interno</p>
                               <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">Ramal 1020</p>
                           </div>
                       </div>
                   </div>
               </div>

               {/* Right Column: Docs */}
               <div className="w-full md:w-80 space-y-4">
                   <h3 className="font-bold text-slate-900 dark:text-white uppercase font-mono text-sm tracking-wider pl-1">
                       Documentação Técnica
                   </h3>
                   <div className="space-y-3">
                       <DocCard title="Manual Operacional" desc="POP-001: Dedetização Geral" />
                       <DocCard title="FISPQ - Racumin" desc="Ficha de Segurança Química" />
                       <DocCard title="FISPQ - K-Othrine" desc="Ficha de Segurança Química" />
                       <DocCard title="Cronograma Anual" desc="Calendário 2025" />
                   </div>
                   
                   <div className="p-4 bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-100 dark:border-cyan-900/30 rounded-xl text-center mt-6">
                       <p className="text-xs text-cyan-800 dark:text-cyan-300 font-bold">Precisa de um documento específico?</p>
                       <button className="mt-2 text-xs text-cyan-600 dark:text-cyan-400 underline hover:text-cyan-800">Solicitar ao Gestor</button>
                   </div>
               </div>
           </div>
       </div>
    </div>
  );
};
