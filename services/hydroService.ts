
import { User, UserRole, HydroCertificado, HydroCloroEntry, HydroFiltro, HydroPoco, HydroCisterna, HydroCaixa, HydroSettings, HydroReservatorio } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { MOCK_HYDRO_CERTIFICADOS, MOCK_HYDRO_FILTROS, MOCK_HYDRO_RESERVATORIOS } from '../constants';
import { logService } from './logService';
import { authService } from './authService';
import { notificationService } from './notificationService';

// Cache em memória para Cloro quando offline/mock
let MOCK_CLORO_CACHE: HydroCloroEntry[] = [];

// Track created URLs to avoid memory leaks
const CREATED_BLOB_URLS: string[] = [];

const cleanupBlobUrls = () => {
    CREATED_BLOB_URLS.forEach(url => URL.revokeObjectURL(url));
    CREATED_BLOB_URLS.length = 0;
};

// Expose cleanup if needed globally, but mostly handled internally or on unmount via useEffect in components if possible.
// Since services are singletons, we rely on uploading over old blobs.

const mapCertificadoFromDB = (db: any): HydroCertificado => ({
    id: db.id,
    sedeId: db.sede_id,
    parceiro: db.parceiro,
    status: db.status,
    semestre: db.semestre,
    validadeSemestre: db.validade_semestre,
    dataAnalise: db.data_analise,
    validade: db.validade,
    linkMicro: db.link_micro,
    linkFisico: db.link_fisico,
    empresa: db.empresa,
    agendamento: db.agendamento,
    observacao: db.observacao
});

const mapCertificadoToDB = (app: HydroCertificado) => ({
    id: app.id,
    sede_id: app.sedeId,
    parceiro: app.parceiro,
    status: app.status,
    semestre: app.semestre,
    validade_semestre: app.validadeSemestre,
    data_analise: app.dataAnalise,
    validade: app.validade,
    link_micro: app.linkMicro,
    link_fisico: app.linkFisico,
    empresa: app.empresa,
    agendamento: app.agendamento,
    observacao: app.observacao
});

const mapCloroFromDB = (db: any): HydroCloroEntry => ({
    id: db.id,
    sedeId: db.sede_id,
    date: db.date,
    cl: db.cl,
    ph: db.ph,
    medidaCorretiva: db.medida_corretiva,
    responsavel: db.responsavel,
    photoUrl: db.photo_url
});

const mapCloroToDB = (app: HydroCloroEntry) => ({
    id: app.id,
    sede_id: app.sedeId,
    date: app.date,
    cl: app.cl,
    ph: app.ph,
    medida_corretiva: app.medidaCorretiva,
    responsavel: app.responsavel,
    photo_url: app.photoUrl
});

const mapFiltroFromDB = (db: any): HydroFiltro => ({
    id: db.id,
    sedeId: db.sede_id,
    patrimonio: db.patrimonio,
    bebedouro: db.bebedouro,
    local: db.local,
    dataTroca: db.data_troca,
    proximaTroca: db.proxima_troca
});

const mapFiltroToDB = (app: HydroFiltro) => ({
    id: app.id,
    sede_id: app.sedeId,
    patrimonio: app.patrimonio,
    bebedouro: app.bebedouro,
    local: app.local,
    data_troca: app.dataTroca,
    proxima_troca: app.proximaTroca
});

const mapReservatorioFromDB = (db: any): HydroReservatorio => ({
    id: db.id,
    sedeId: db.sede_id,
    tipo: db.tipo,
    local: db.local,
    responsavel: db.responsavel,
    dataUltimaLimpeza: db.data_ultima_limpeza,
    proximaLimpeza: db.proxima_limpeza,
    situacaoLimpeza: db.situacao_limpeza,
    bairro: db.bairro,
    referenciaBomba: db.referencia_bomba,
    fichaOperacional: db.ficha_operacional,
    dadosFicha: db.dados_ficha, 
    ultimaTrocaFiltro: db.ultima_troca_filtro,
    proximaTrocaFiltro: db.proxima_troca_filtro,
    situacaoFiltro: db.situacao_filtro,
    refil: db.refil,
    numCelulas: db.num_celulas,
    capacidade: db.capacidade,
    previsaoLimpeza1: db.previsao_limpeza_1,
    dataLimpeza1: db.data_limpeza_1,
    previsaoLimpeza2: db.previsao_limpeza_2,
    dataLimpeza2: db.data_limpeza_2
});

const mapReservatorioToDB = (app: any) => ({
    id: app.id,
    sede_id: app.sedeId,
    tipo: app.tipo,
    local: app.local,
    responsavel: app.responsavel,
    data_ultima_limpeza: app.dataUltimaLimpeza,
    proxima_limpeza: app.proximaLimpeza,
    situacao_limpeza: app.situacaoLimpeza,
    bairro: app.bairro,
    referencia_bomba: app.referenciaBomba,
    ficha_operacional: app.fichaOperacional,
    dados_ficha: app.dadosFicha,
    ultima_troca_filtro: app.ultimaTrocaFiltro,
    proxima_troca_filtro: app.proximaTrocaFiltro,
    situacao_filtro: app.situacaoFiltro,
    refil: app.refil,
    num_celulas: app.numCelulas,
    capacidade: app.capacidade,
    previsao_limpeza_1: app.previsaoLimpeza1,
    data_limpeza_1: app.dataLimpeza1,
    previsao_limpeza_2: app.previsaoLimpeza2,
    data_limpeza_2: app.dataLimpeza2
});

const mapSettingsFromDB = (db: any): HydroSettings => ({
    validadeCertificadoMeses: db.validade_certificado_meses,
    validadeFiltroMeses: db.validade_filtro_meses,
    validadeLimpezaCaixa: db.validade_limpeza_caixa || db.validade_limpeza_meses || 6,
    validadeLimpezaCisterna: db.validade_limpeza_cisterna || db.validade_limpeza_meses || 6,
    validadeLimpezaPoco: db.validade_limpeza_poco || db.validade_limpeza_meses || 6,
    cloroMin: db.cloro_min,
    cloroMax: db.cloro_max,
    phMin: db.ph_min,
    phMax: db.ph_max
});

const mapSettingsToDB = (app: HydroSettings) => ({
    id: 'default',
    validade_certificado_meses: app.validadeCertificadoMeses,
    validade_filtro_meses: app.validadeFiltroMeses,
    validade_limpeza_caixa: app.validadeLimpezaCaixa,
    validade_limpeza_cisterna: app.validadeLimpezaCisterna,
    validade_limpeza_poco: app.validadeLimpezaPoco,
    validade_limpeza_meses: app.validadeLimpezaCaixa, 
    cloro_min: app.cloroMin,
    cloro_max: app.cloroMax,
    ph_min: app.phMin,
    ph_max: app.phMax
});

const filterByScope = <T extends { sedeId: string }>(data: T[], user: User): T[] => {
  if (user.role === UserRole.ADMIN) return data;
  const userSedes = user.sedeIds || [];
  return data.filter(item => {
      const itemSede = item.sedeId ? item.sedeId : ''; 
      if (!itemSede) return false;
      return userSedes.includes(itemSede);
  });
};

const getCurrentUserForLog = () => {
    return authService.getCurrentUser();
}

export const hydroService = {
  // Clean up function exposed for app lifecycle management if needed
  cleanupBlobUrls: cleanupBlobUrls,

  uploadPhoto: async (file: File | Blob): Promise<string | null> => {
      if (!isSupabaseConfigured()) {
          const url = URL.createObjectURL(file);
          CREATED_BLOB_URLS.push(url); // Track for cleanup
          return url;
      }
      
      const fileExt = file instanceof File ? file.name.split('.').pop() : 'jpg';
      const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
          .from('hydro-cloro-images')
          .upload(fileName, file, {
              contentType: 'image/jpeg',
              upsert: false
          });
      
      if (error) {
          console.error("Erro upload:", error);
          throw error;
      }
      
      const { data: publicData } = supabase.storage
          .from('hydro-cloro-images')
          .getPublicUrl(fileName);
          
      return publicData.publicUrl;
  },

  getCertificados: async (user: User): Promise<HydroCertificado[]> => {
    try {
        if (!isSupabaseConfigured()) throw new Error("Mock");
        const { data, error } = await supabase.from('hydro_certificados').select('*');
        if (error) throw error;
        const mapped = (data || []).map(mapCertificadoFromDB);
        return filterByScope(mapped, user);
    } catch (e) {
        return filterByScope(MOCK_HYDRO_CERTIFICADOS, user);
    }
  },
  saveCertificado: async (item: HydroCertificado) => {
    if (isSupabaseConfigured()) {
        const { error } = await supabase.from('hydro_certificados').upsert(mapCertificadoToDB(item));
        if (error) throw error;
    }
    const u = getCurrentUserForLog();
    if(u) {
        logService.logAction(u, 'HYDROSYS', 'UPDATE', `Certificado ${item.parceiro}`, `Status: ${item.status}`);
        if (item.status === 'VIGENTE') await notificationService.resolveAlert(item.id);
        await notificationService.checkSystemStatus(u);
        notificationService.notifyRefresh();
    }
  },
  deleteCertificado: async (id: string) => {
    if (isSupabaseConfigured()) await supabase.from('hydro_certificados').delete().eq('id', id);
    const u = getCurrentUserForLog();
    if(u) logService.logAction(u, 'HYDROSYS', 'DELETE', `Certificado ID ${id}`);
    await notificationService.resolveAlert(id);
    notificationService.notifyRefresh();
  },

  getCloro: async (user: User): Promise<HydroCloroEntry[]> => {
    try {
        if (!isSupabaseConfigured()) throw new Error("Mock");
        const { data, error } = await supabase.from('hydro_cloro').select('*');
        if (error) throw error;
        const mapped = (data || []).map(mapCloroFromDB);
        return filterByScope(mapped, user);
    } catch (e) {
        return filterByScope(MOCK_CLORO_CACHE, user);
    }
  },
  saveCloro: async (entry: HydroCloroEntry) => {
    if (isSupabaseConfigured()) {
        const { error } = await supabase.from('hydro_cloro').upsert(mapCloroToDB(entry));
        if (error) throw error;
    } else {
        const idx = MOCK_CLORO_CACHE.findIndex(e => e.id === entry.id);
        if (idx >= 0) MOCK_CLORO_CACHE[idx] = entry;
        else MOCK_CLORO_CACHE.push(entry);
    }
    
    const u = getCurrentUserForLog();
    if(u) logService.logAction(u, 'HYDROSYS', 'CREATE', `Medição Cloro`, `Sede: ${entry.sedeId}, Data Ref: ${entry.date}, CL: ${entry.cl}, pH: ${entry.ph} ${entry.photoUrl ? '(Com Foto)' : ''}`);
  },

  getFiltros: async (user: User): Promise<HydroFiltro[]> => {
    try {
        if (!isSupabaseConfigured()) throw new Error("Mock");
        const { data, error } = await supabase.from('hydro_filtros').select('*');
        if (error) throw error;
        const mapped = (data || []).map(mapFiltroFromDB);
        return filterByScope(mapped, user);
    } catch (e) {
        return filterByScope(MOCK_HYDRO_FILTROS, user);
    }
  },
  saveFiltro: async (item: HydroFiltro) => {
    if (isSupabaseConfigured()) {
        const { error } = await supabase.from('hydro_filtros').upsert(mapFiltroToDB(item));
        if (error) throw error;
    }
    const u = getCurrentUserForLog();
    if(u) {
        logService.logAction(u, 'HYDROSYS', 'UPDATE', `Filtro ${item.patrimonio}`);
        await notificationService.resolveAlert(item.id);
        await notificationService.checkSystemStatus(u);
        notificationService.notifyRefresh();
    }
  },
  deleteFiltro: async (id: string) => {
    if (isSupabaseConfigured()) await supabase.from('hydro_filtros').delete().eq('id', id);
    const u = getCurrentUserForLog();
    if(u) logService.logAction(u, 'HYDROSYS', 'DELETE', `Filtro ID ${id}`);
    await notificationService.resolveAlert(id);
    notificationService.notifyRefresh();
  },

  getPocos: async (user: User): Promise<HydroPoco[]> => {
    try {
        if (!isSupabaseConfigured()) throw new Error("Mock");
        const { data, error } = await supabase.from('hydro_reservatorios').select('*').eq('tipo', 'POCO');
        if (error) throw error;
        const mapped = (data || []).map(mapReservatorioFromDB);
        return filterByScope(mapped as HydroPoco[], user);
    } catch (e) {
        return filterByScope(MOCK_HYDRO_RESERVATORIOS.filter(r => r.tipo === 'POCO'), user);
    }
  },
  savePoco: async (item: HydroPoco) => {
    if (isSupabaseConfigured()) {
        const { error } = await supabase.from('hydro_reservatorios').upsert(mapReservatorioToDB({ ...item, tipo: 'POCO' }));
        if (error) throw error;
    }
    const u = getCurrentUserForLog();
    if(u) {
        let details = `Poço ${item.local}`;
        
        // Se tiver Ficha Técnica, cria um resumo rico para o log (Histórico Legível)
        if (item.dadosFicha) {
            details = `FICHA TÉCNICA - LIMPEZA REALIZADA\n` +
                      `Data Término: ${item.dadosFicha.terminoLimpeza}\n` +
                      `Bomba: ${item.dadosFicha.marcaBomba} ${item.dadosFicha.modeloBomba} (${item.dadosFicha.potenciaBomba}cv)\n` +
                      `Profundidade Bomba: ${item.dadosFicha.profundidadeBomba}m\n` +
                      `Pré-Limpeza: N.E ${item.dadosFicha.preLimpeza.nivelEstatico}m / Vazão ${item.dadosFicha.preLimpeza.vazao}\n` +
                      `Pós-Limpeza: N.E ${item.dadosFicha.posLimpeza.nivelEstatico}m / Vazão ${item.dadosFicha.posLimpeza.vazao}\n` +
                      `Obs: ${item.dadosFicha.observacoes}`;
        }

        logService.logAction(u, 'HYDROSYS', 'UPDATE', `Poço ${item.local}`, details);
        if(item.situacaoLimpeza === 'DENTRO DO PRAZO') await notificationService.resolveAlert(item.id);
        await notificationService.checkSystemStatus(u);
        notificationService.notifyRefresh();
    }
  },

  getCisternas: async (user: User): Promise<HydroCisterna[]> => {
    try {
        if (!isSupabaseConfigured()) throw new Error("Mock");
        const { data, error } = await supabase.from('hydro_reservatorios').select('*').eq('tipo', 'CISTERNA');
        if (error) throw error;
        const mapped = (data || []).map(mapReservatorioFromDB);
        return filterByScope(mapped as HydroCisterna[], user);
    } catch (e) {
        return filterByScope(MOCK_HYDRO_RESERVATORIOS.filter(r => r.tipo === 'CISTERNA'), user);
    }
  },
  saveCisterna: async (item: HydroCisterna) => {
    if (isSupabaseConfigured()) await supabase.from('hydro_reservatorios').upsert(mapReservatorioToDB({ ...item, tipo: 'CISTERNA' }));
    const u = getCurrentUserForLog();
    if(u) {
        logService.logAction(u, 'HYDROSYS', 'UPDATE', `Cisterna ${item.local}`);
        if(item.situacaoLimpeza === 'DENTRO DO PRAZO') await notificationService.resolveAlert(item.id);
        await notificationService.checkSystemStatus(u);
        notificationService.notifyRefresh();
    }
  },

  getCaixas: async (user: User): Promise<HydroCaixa[]> => {
    try {
        if (!isSupabaseConfigured()) throw new Error("Mock");
        const { data, error } = await supabase.from('hydro_reservatorios').select('*').eq('tipo', 'CAIXA');
        if (error) throw error;
        const mapped = (data || []).map(mapReservatorioFromDB);
        return filterByScope(mapped as HydroCaixa[], user);
    } catch (e) {
        return filterByScope(MOCK_HYDRO_RESERVATORIOS.filter(r => r.tipo === 'CAIXA'), user);
    }
  },
  saveCaixa: async (item: HydroCaixa) => {
    if (isSupabaseConfigured()) await supabase.from('hydro_reservatorios').upsert(mapReservatorioToDB({ ...item, tipo: 'CAIXA' }));
    const u = getCurrentUserForLog();
    if(u) {
        logService.logAction(u, 'HYDROSYS', 'UPDATE', `Caixa ${item.local}`);
        if(item.situacaoLimpeza === 'DENTRO DO PRAZO') await notificationService.resolveAlert(item.id);
        await notificationService.checkSystemStatus(u);
        notificationService.notifyRefresh();
    }
  },

  getSettings: async (): Promise<HydroSettings> => {
    try {
        if (!isSupabaseConfigured()) throw new Error("Mock");
        const { data } = await supabase.from('hydro_settings').select('*').single();
        if (data) return mapSettingsFromDB(data);
        throw new Error("No settings");
    } catch (e) {
        return {
            validadeCertificadoMeses: 6,
            validadeFiltroMeses: 6,
            validadeLimpezaCaixa: 6,
            validadeLimpezaCisterna: 6,
            validadeLimpezaPoco: 12,
            cloroMin: 1.0,
            cloroMax: 3.0,
            phMin: 7.4,
            phMax: 7.6
        };
    }
  },

  saveSettings: async (settings: HydroSettings) => {
    if (isSupabaseConfigured()) await supabase.from('hydro_settings').upsert(mapSettingsToDB(settings));
    const u = getCurrentUserForLog();
    if(u) logService.logAction(u, 'HYDROSYS', 'UPDATE', `Configurações Gerais`, `Padrões Atualizados`);
  }
};
