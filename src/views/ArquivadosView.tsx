import { useMemo, useState } from 'react';
import {
  Building2, Folder, FileText, Archive, ArchiveRestore, Trash2,
  Search, X as XIcon, ChevronDown, ChevronRight,
} from 'lucide-react';
import { Frente, Area, Processo } from '../lib/types';
import { Card, Badge, EmptyState } from '../components/ui';
import ThreeDotMenu, { ThreeDotMenuItem } from '../components/ThreeDotMenu';
import { useToast } from '../components/Toast';
import { supabase } from '../lib/supabase';
import { getEtapaLabel, getStatusLabel, STATUS_PROCESSO } from '../lib/constants';

interface Props {
  frentes: Frente[];
  areas: Area[];
  processos: Processo[];
  loading: boolean;
  onRefresh: () => void;
  onOpenProcesso: (id: string) => void;
}

type Section = 'empresas' | 'setores' | 'processos';

export default function ArquivadosView({
  frentes, areas, processos, loading, onRefresh, onOpenProcesso,
}: Props) {
  const { notify } = useToast();
  const [search, setSearch] = useState('');
  const [openSections, setOpenSections] = useState<Record<Section, boolean>>({
    empresas: true, setores: true, processos: true,
  });

  function toggleSection(s: Section) {
    setOpenSections((prev) => ({ ...prev, [s]: !prev[s] }));
  }

  const searchLower = search.toLowerCase().trim();

  const empresasArquivadas = useMemo(
    () => frentes.filter((f) => f.arquivado && (!searchLower || f.nome.toLowerCase().includes(searchLower))),
    [frentes, searchLower],
  );
  const setoresArquivados = useMemo(
    () => areas.filter((a) => a.arquivado && (!searchLower || a.nome.toLowerCase().includes(searchLower))),
    [areas, searchLower],
  );
  const processosArquivados = useMemo(
    () => processos.filter((p) => p.arquivado && (!searchLower || p.nome.toLowerCase().includes(searchLower))),
    [processos, searchLower],
  );

  const totalGeral = empresasArquivadas.length + setoresArquivados.length + processosArquivados.length;

  async function restaurarEmpresa(f: Frente) {
    const { error } = await supabase.from('frentes').update({ arquivado: false }).eq('id', f.id);
    if (error) return notify('error', 'Erro ao desarquivar empresa');
    notify('success', 'Empresa restaurada');
    onRefresh();
  }
  async function restaurarSetor(a: Area) {
    const { error } = await supabase.from('areas').update({ arquivado: false }).eq('id', a.id);
    if (error) return notify('error', 'Erro ao desarquivar setor');
    notify('success', 'Setor restaurado');
    onRefresh();
  }
  async function restaurarProcesso(p: Processo) {
    const { error } = await supabase.from('processos').update({ arquivado: false }).eq('id', p.id);
    if (error) return notify('error', 'Erro ao desarquivar processo');
    notify('success', 'Processo restaurado');
    onRefresh();
  }
  async function excluirEmpresa(f: Frente) {
    if (!confirm(`Excluir permanentemente a empresa "${f.nome}"? Esta ação não pode ser desfeita.`)) return;
    const { error } = await supabase.from('frentes').delete().eq('id', f.id);
    if (error) return notify('error', 'Erro ao excluir empresa');
    notify('success', 'Empresa excluída');
    onRefresh();
  }
  async function excluirSetor(a: Area) {
    if (!confirm(`Excluir permanentemente o setor "${a.nome}"?`)) return;
    const { error } = await supabase.from('areas').delete().eq('id', a.id);
    if (error) return notify('error', 'Erro ao excluir setor');
    notify('success', 'Setor excluído');
    onRefresh();
  }
  async function excluirProcesso(p: Processo) {
    if (!confirm(`Excluir permanentemente o processo "${p.nome}"?`)) return;
    const { error } = await supabase.from('processos').delete().eq('id', p.id);
    if (error) return notify('error', 'Erro ao excluir processo');
    notify('success', 'Processo excluído');
    onRefresh();
  }

  return (
    <div className="mx-auto max-w-5xl px-8 py-8 animate-fade-in">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-elevated">
          <Archive className="h-5 w-5 text-tertiary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-primary">Arquivados</h1>
          <p className="mt-0.5 text-sm text-tertiary">
            {totalGeral === 0
              ? 'Nenhum item arquivado'
              : `${totalGeral} item(ns) arquivado(s) — você pode restaurar ou excluir aqui`}
          </p>
        </div>
      </div>

      {/* Search */}
      {totalGeral > 0 && (
        <div className="relative mb-4 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tertiary" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar nos arquivados..."
            className="w-full rounded-lg border border-default bg-surface py-2 pl-9 pr-9 text-sm text-primary placeholder:text-tertiary focus:border-brand-primary focus:outline-none transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded text-tertiary hover:bg-hover-state hover:text-primary"
            >
              <XIcon className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {totalGeral === 0 && !loading && (
        <Card className="p-12">
          <EmptyState
            icon={Archive}
            title="Tudo limpo por aqui"
            description="Itens arquivados (empresas, setores ou processos) aparecem aqui. Você pode restaurar para a tela principal ou excluir permanentemente."
          />
        </Card>
      )}

      {/* Empresas */}
      {empresasArquivadas.length > 0 && (
        <ArchiveSection
          title="Empresas"
          icon={Building2}
          count={empresasArquivadas.length}
          open={openSections.empresas}
          onToggle={() => toggleSection('empresas')}
        >
          {empresasArquivadas.map((f) => (
            <ArchiveRow
              key={f.id}
              icon={<Building2 className="h-5 w-5" style={{ color: f.cor || '#9100E2' }} />}
              title={f.nome}
              subtitle={f.descricao || undefined}
              rightMenu={[
                { label: 'Restaurar', icon: ArchiveRestore, onClick: () => restaurarEmpresa(f) },
                { label: 'Excluir permanentemente', icon: Trash2, onClick: () => excluirEmpresa(f), danger: true, divider: true },
              ]}
            />
          ))}
        </ArchiveSection>
      )}

      {/* Setores */}
      {setoresArquivados.length > 0 && (
        <ArchiveSection
          title="Setores"
          icon={Folder}
          count={setoresArquivados.length}
          open={openSections.setores}
          onToggle={() => toggleSection('setores')}
        >
          {setoresArquivados.map((a) => {
            const frente = frentes.find((f) => f.id === a.frente_id);
            return (
              <ArchiveRow
                key={a.id}
                icon={<Folder className="h-5 w-5 text-amber-400" />}
                title={a.nome}
                subtitle={frente ? `Empresa: ${frente.nome}` : undefined}
                rightMenu={[
                  { label: 'Restaurar', icon: ArchiveRestore, onClick: () => restaurarSetor(a) },
                  { label: 'Excluir permanentemente', icon: Trash2, onClick: () => excluirSetor(a), danger: true, divider: true },
                ]}
              />
            );
          })}
        </ArchiveSection>
      )}

      {/* Processos */}
      {processosArquivados.length > 0 && (
        <ArchiveSection
          title="Processos"
          icon={FileText}
          count={processosArquivados.length}
          open={openSections.processos}
          onToggle={() => toggleSection('processos')}
        >
          {processosArquivados.map((p) => (
            <ArchiveRow
              key={p.id}
              icon={<FileText className="h-5 w-5 text-brand-light" />}
              title={p.nome}
              subtitle={p.frente?.nome ? `Empresa: ${p.frente.nome}` : undefined}
              badges={
                <>
                  <Badge color="brand">{getEtapaLabel(p.etapa)}</Badge>
                  <Badge color={STATUS_PROCESSO.find((s) => s.value === p.status)?.color}>
                    {getStatusLabel(p.status)}
                  </Badge>
                </>
              }
              onClick={() => onOpenProcesso(p.id)}
              rightMenu={[
                { label: 'Abrir', icon: ChevronRight, onClick: () => onOpenProcesso(p.id) },
                { label: 'Restaurar', icon: ArchiveRestore, onClick: () => restaurarProcesso(p) },
                { label: 'Excluir permanentemente', icon: Trash2, onClick: () => excluirProcesso(p), danger: true, divider: true },
              ]}
            />
          ))}
        </ArchiveSection>
      )}
    </div>
  );
}

// ============== Sub-componentes ==============

function ArchiveSection({
  title, icon: Icon, count, open, onToggle, children,
}: {
  title: string;
  icon: any;
  count: number;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card className="mb-4 overflow-hidden">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-hover-state transition-colors"
      >
        {open ? <ChevronDown className="h-4 w-4 text-tertiary" /> : <ChevronRight className="h-4 w-4 text-tertiary" />}
        <Icon className="h-4 w-4 text-tertiary" />
        <h2 className="text-sm font-semibold text-primary">{title}</h2>
        <span className="rounded-full bg-elevated px-2 py-0.5 text-[10px] font-medium text-tertiary">{count}</span>
      </button>
      {open && <div className="divide-y divide-subtle border-t border-subtle">{children}</div>}
    </Card>
  );
}

function ArchiveRow({
  icon, title, subtitle, badges, onClick, rightMenu,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  badges?: React.ReactNode;
  onClick?: () => void;
  rightMenu: ThreeDotMenuItem[];
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="group flex items-center gap-3 px-5 py-3 hover:bg-hover-state transition-colors">
      <button
        onClick={onClick}
        disabled={!onClick}
        className={`flex flex-1 items-center gap-3 text-left min-w-0 ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
      >
        <div className="flex-shrink-0">{icon}</div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-primary">{title}</p>
          {subtitle && <p className="truncate text-xs text-tertiary">{subtitle}</p>}
        </div>
        {badges && <div className="flex items-center gap-1.5 flex-shrink-0">{badges}</div>}
      </button>
      <ThreeDotMenu open={menuOpen} onOpenChange={setMenuOpen} items={rightMenu} />
    </div>
  );
}
