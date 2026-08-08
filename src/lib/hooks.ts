import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from './supabase';
import type {
  Frente, Processo, Automacao, Stakeholder, Cliente, Area,
  TimelineEvent, Pendencia, ChecklistItem, Comentario, Anexo, Tag, ProcessoTag, ProcessoStakeholder,
  Profile, FrenteShare, AreaShare, ProcessoShare,
} from './types';

// Generic fetch hook with safe state updates and error handling
export function useSupabaseQuery<T>(
  table: string,
  select: string,
  deps: any[] = [],
  filter?: (q: any) => any
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let q = supabase.from(table).select(select);
      if (filter) q = filter(q);
      const { data: result, error: err } = await q;
      if (!mountedRef.current) return;
      if (err) {
        console.error(`[useSupabaseQuery:${table}]`, err.message);
        setError(err.message);
      } else {
        setData((result as T[]) || []);
      }
    } catch (e: any) {
      if (mountedRef.current) {
        console.error(`[useSupabaseQuery:${table}] thrown:`, e?.message);
        setError(e?.message || 'Failed to fetch');
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    mountedRef.current = true;
    fetch();
    return () => { mountedRef.current = false; };
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

export function useFrentes() {
  const { data, loading, refetch } = useSupabaseQuery<Frente>('frentes', '*', []);
  return { frentes: data, loading, refetch };
}

export function useProcessos(filterFn?: (q: any) => any) {
  const { data, loading, refetch } = useSupabaseQuery<Processo>(
    'processos',
    `*, frente:frentes(*), cliente:clientes(*), area:areas(*), responsavel:stakeholders!processos_responsavel_id_fkey(*), automacoes(*), processo_stakeholders(stakeholder:stakeholders(*))`,
    [],
    filterFn
  );
  return { processos: data, loading, refetch };
}

export function useProcesso(id: string | null) {
  const [processo, setProcesso] = useState<Processo | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    if (!id) { setProcesso(null); setLoading(false); return; }
    setLoading(true);
    (async () => {
      try {
        const { data, error } = await supabase
          .from('processos')
          .select(`*, frente:frentes(*), cliente:clientes(*), area:areas(*), responsavel:stakeholders!processos_responsavel_id_fkey(*),
            automacoes(*, responsavel:stakeholders(*)),
            processo_stakeholders(*, stakeholder:stakeholders(*))`)
          .eq('id', id)
          .maybeSingle();
        if (!mountedRef.current) return;
        if (error) {
          console.error('[useProcesso]', error.message);
          setProcesso(null);
        } else {
          setProcesso(data as Processo);
        }
      } catch (e: any) {
        if (mountedRef.current) {
          console.error('[useProcesso] thrown:', e?.message);
          setProcesso(null);
        }
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    })();
    return () => { mountedRef.current = false; };
  }, [id]);

  return { processo, loading, setProcesso };
}

export function useAutomacao(id: string | null) {
  const [automacao, setAutomacao] = useState<Automacao | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    if (!id) { setAutomacao(null); setLoading(false); return; }
    setLoading(true);
    (async () => {
      try {
        const { data, error } = await supabase
          .from('automacoes')
          .select(`*, processo:processos(*), responsavel:stakeholders(*)`)
          .eq('id', id)
          .maybeSingle();
        if (!mountedRef.current) return;
        if (error) {
          console.error('[useAutomacao]', error.message);
          setAutomacao(null);
        } else {
          setAutomacao(data as Automacao);
        }
      } catch (e: any) {
        if (mountedRef.current) {
          console.error('[useAutomacao] thrown:', e?.message);
          setAutomacao(null);
        }
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    })();
    return () => { mountedRef.current = false; };
  }, [id]);

  return { automacao, loading, setAutomacao };
}

export function useTimeline(processoId?: string | null, automacaoId?: string | null) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    if (!processoId && !automacaoId) { setEvents([]); setLoading(false); return; }
    setLoading(true);
    (async () => {
      try {
        let q = supabase.from('timeline_events').select('*').order('data', { ascending: true }).order('created_at', { ascending: true });
        if (processoId) q = q.eq('processo_id', processoId);
        if (automacaoId) q = q.eq('automacao_id', automacaoId);
        const { data, error } = await q;
        if (!mountedRef.current) return;
        if (error) console.error('[useTimeline]', error.message);
        setEvents((data as TimelineEvent[]) || []);
      } catch (e: any) {
        if (mountedRef.current) console.error('[useTimeline] thrown:', e?.message);
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    })();
    return () => { mountedRef.current = false; };
  }, [processoId, automacaoId]);

  return { events, loading, setEvents };
}

export function usePendencias(processoId?: string | null, automacaoId?: string | null) {
  const [items, setItems] = useState<Pendencia[]>([]);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    if (!processoId && !automacaoId) { setItems([]); setLoading(false); return; }
    setLoading(true);
    (async () => {
      try {
        let q = supabase.from('pendencias').select('*').order('created_at', { ascending: false });
        if (processoId) q = q.eq('processo_id', processoId);
        if (automacaoId) q = q.eq('automacao_id', automacaoId);
        const { data, error } = await q;
        if (!mountedRef.current) return;
        if (error) console.error('[usePendencias]', error.message);
        setItems((data as Pendencia[]) || []);
      } catch (e: any) {
        if (mountedRef.current) console.error('[usePendencias] thrown:', e?.message);
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    })();
    return () => { mountedRef.current = false; };
  }, [processoId, automacaoId]);

  return { pendencias: items, loading, setPendencias: setItems };
}

export function useChecklist(processoId?: string | null, automacaoId?: string | null) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    if (!processoId && !automacaoId) { setItems([]); setLoading(false); return; }
    setLoading(true);
    (async () => {
      try {
        let q = supabase.from('checklist_items').select('*').order('ordem', { ascending: true });
        if (processoId) q = q.eq('processo_id', processoId);
        if (automacaoId) q = q.eq('automacao_id', automacaoId);
        const { data, error } = await q;
        if (!mountedRef.current) return;
        if (error) console.error('[useChecklist]', error.message);
        setItems((data as ChecklistItem[]) || []);
      } catch (e: any) {
        if (mountedRef.current) console.error('[useChecklist] thrown:', e?.message);
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    })();
    return () => { mountedRef.current = false; };
  }, [processoId, automacaoId]);

  return { items, loading, setItems };
}

export function useComentarios(processoId: string | null) {
  const [items, setItems] = useState<Comentario[]>([]);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    if (!processoId) { setItems([]); setLoading(false); return; }
    setLoading(true);
    (async () => {
      try {
        const { data, error } = await supabase
          .from('comentarios')
          .select('*')
          .eq('processo_id', processoId)
          .order('created_at', { ascending: false });
        if (!mountedRef.current) return;
        if (error) console.error('[useComentarios]', error.message);
        setItems((data as Comentario[]) || []);
      } catch (e: any) {
        if (mountedRef.current) console.error('[useComentarios] thrown:', e?.message);
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    })();
    return () => { mountedRef.current = false; };
  }, [processoId]);

  return { comentarios: items, loading, setComentarios: setItems };
}

export function useAnexos(processoId: string | null) {
  const [items, setItems] = useState<Anexo[]>([]);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    if (!processoId) { setItems([]); setLoading(false); return; }
    setLoading(true);
    (async () => {
      try {
        const { data, error } = await supabase
          .from('anexos')
          .select('*')
          .eq('processo_id', processoId)
          .order('created_at', { ascending: false });
        if (!mountedRef.current) return;
        if (error) console.error('[useAnexos]', error.message);
        setItems((data as Anexo[]) || []);
      } catch (e: any) {
        if (mountedRef.current) console.error('[useAnexos] thrown:', e?.message);
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    })();
    return () => { mountedRef.current = false; };
  }, [processoId]);

  return { anexos: items, loading, setAnexos: setItems };
}

export function useStakeholders() {
  const { data, loading, refetch } = useSupabaseQuery<Stakeholder>('stakeholders', '* order by nome', []);
  return { stakeholders: data, loading, refetch };
}

export function useClientes() {
  const { data, loading, refetch } = useSupabaseQuery<Cliente>('clientes', '* order by nome', []);
  return { clientes: data, loading, refetch };
}

export function useAreas() {
  const { data, loading, refetch } = useSupabaseQuery<Area>('areas', '* order by nome', []);
  return { areas: data, loading, refetch };
}

export function useTags() {
  const { data, loading, refetch } = useSupabaseQuery<Tag>('tags', '* order by nome', []);
  return { tags: data, loading, refetch };
}

// ============== Auth helpers ==============

export function useUser() {
  const [user, setUser] = useState<{ id: string; email: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (mounted) { setUser(u ? { id: u.id, email: u.email ?? null } : null); setLoading(false); }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user ?? null;
      setUser(u ? { id: u.id, email: u.email ?? null } : null);
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);
  return { user, loading };
}

// ============== Profiles (compartilhamento) ==============

export function useProfiles() {
  const { data, loading, refetch } = useSupabaseQuery<Profile>('profiles', '* order by email', []);
  return { profiles: data, loading, refetch };
}

// ============== Shares (compartilhamento por entidade) ==============

export function useFrenteShares(frenteId: string | null) {
  const [shares, setShares] = useState<FrenteShare[]>([]);
  const [loading, setLoading] = useState(false);
  const mountedRef = useRef(true);
  const fetch = useCallback(async () => {
    if (!frenteId) { setShares([]); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('frente_shares')
        .select('*, profile:profiles(*)')
        .eq('frente_id', frenteId)
        .order('created_at', { ascending: true });
      if (error) console.error('[useFrenteShares]', error.message);
      if (mountedRef.current) setShares((data as FrenteShare[]) || []);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [frenteId]);
  useEffect(() => {
    mountedRef.current = true;
    fetch();
    return () => { mountedRef.current = false; };
  }, [fetch]);
  return { shares, loading, refetch: fetch };
}

export function useAreaShares(areaId: string | null) {
  const [shares, setShares] = useState<AreaShare[]>([]);
  const [loading, setLoading] = useState(false);
  const mountedRef = useRef(true);
  const fetch = useCallback(async () => {
    if (!areaId) { setShares([]); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('area_shares')
        .select('*, profile:profiles(*)')
        .eq('area_id', areaId)
        .order('created_at', { ascending: true });
      if (error) console.error('[useAreaShares]', error.message);
      if (mountedRef.current) setShares((data as AreaShare[]) || []);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [areaId]);
  useEffect(() => {
    mountedRef.current = true;
    fetch();
    return () => { mountedRef.current = false; };
  }, [fetch]);
  return { shares, loading, refetch: fetch };
}

export function useProcessoShares(processoId: string | null) {
  const [shares, setShares] = useState<ProcessoShare[]>([]);
  const [loading, setLoading] = useState(false);
  const mountedRef = useRef(true);
  const fetch = useCallback(async () => {
    if (!processoId) { setShares([]); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('processo_shares')
        .select('*, profile:profiles(*)')
        .eq('processo_id', processoId)
        .order('created_at', { ascending: true });
      if (error) console.error('[useProcessoShares]', error.message);
      if (mountedRef.current) setShares((data as ProcessoShare[]) || []);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [processoId]);
  useEffect(() => {
    mountedRef.current = true;
    fetch();
    return () => { mountedRef.current = false; };
  }, [fetch]);
  return { shares, loading, refetch: fetch };
}
