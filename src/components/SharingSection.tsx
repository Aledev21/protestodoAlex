import { useMemo, useState } from 'react';
import { Globe, Lock, Share2, X, UserPlus, Users } from 'lucide-react';
import { Profile, Visibilidade } from '../lib/types';
import { Avatar } from './ui';
import { useToast } from './Toast';
import { supabase } from '../lib/supabase';

interface Share {
  id: string;
  user_id: string;
  profile?: Profile;
}

interface Props {
  /** Tipo da entidade. Define a tabela a usar. */
  entity: 'frente' | 'area' | 'processo';
  /** Id da entidade. */
  entityId: string;
  /** Visibilidade atual. */
  visibilidade: Visibilidade;
  /** Owner (criador) — sempre mostrado com badge "Dono". */
  ownerId: string | null;
  /** Lista atual de shares. */
  shares: Share[];
  /** Lista de perfis disponíveis pra compartilhar. */
  profiles: Profile[];
  /** Usuário logado. */
  currentUserId: string | null;
  /** Refetch dos shares. */
  onSharesChange: () => void;
  /** Se o usuário atual pode editar (é o owner). */
  canEdit?: boolean;
}

/**
 * Seção de visibilidade + compartilhamento.
 * - Toggle: Compartilhar com todos (shared) / Privado (private)
 * - Lista: owner + pessoas com quem é compartilhado
 * - Adicionar: autocomplete de profiles (excluindo owner e quem já tem share)
 * - Remover: cada share tem um X
 */
export default function SharingSection({
  entity, entityId, visibilidade, ownerId, shares, profiles, currentUserId, onSharesChange, canEdit,
}: Props) {
  const { notify } = useToast();
  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);

  const table = entity === 'frente' ? 'frente_shares' : entity === 'area' ? 'area_shares' : 'processo_shares';
  const fkCol = entity === 'frente' ? 'frente_id' : entity === 'area' ? 'area_id' : 'processo_id';

  const ownerProfile = useMemo(
    () => (ownerId ? profiles.find((p) => p.id === ownerId) : null),
    [profiles, ownerId],
  );
  const sharedProfiles = useMemo(
    () => shares.map((s) => s.profile).filter(Boolean) as Profile[],
    [shares],
  );
  const allParticipantIds = new Set<string>([
    ...(ownerId ? [ownerId] : []),
    ...shares.map((s) => s.user_id),
  ]);

  const candidates = useMemo(() => {
    const lower = query.trim().toLowerCase();
    return profiles
      .filter((p) => !allParticipantIds.has(p.id))
      .filter((p) => !lower || p.email.toLowerCase().includes(lower) || (p.display_name ?? '').toLowerCase().includes(lower))
      .slice(0, 8);
  }, [profiles, query, allParticipantIds]);

  async function setVisibilidade(newVis: Visibilidade) {
    if (!canEdit) {
      notify('error', 'Só o dono pode mudar a visibilidade');
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from(entity === 'frente' ? 'frentes' : entity === 'area' ? 'areas' : 'processos')
      .update({ visibilidade: newVis })
      .eq('id', entityId);
    setSaving(false);
    if (error) {
      console.error('[SharingSection:setVisibilidade]', error.message);
      notify('error', 'Erro ao mudar visibilidade');
      return;
    }
    notify('success', newVis === 'shared' ? 'Visível para todos' : 'Agora é privado');
    // Forçar refetch geral via window event (simples) ou callback
    onSharesChange();
  }

  async function addShare(profileId: string) {
    setSaving(true);
    const { error } = await supabase.from(table).insert({ [fkCol]: entityId, user_id: profileId });
    setSaving(false);
    if (error) {
      console.error('[SharingSection:addShare]', error.message);
      notify('error', 'Erro ao adicionar compartilhamento');
      return;
    }
    setQuery('');
    setAdding(false);
    notify('success', 'Pessoa adicionada');
    onSharesChange();
  }

  async function removeShare(shareId: string) {
    setSaving(true);
    const { error } = await supabase.from(table).delete().eq('id', shareId);
    setSaving(false);
    if (error) {
      console.error('[SharingSection:removeShare]', error.message);
      notify('error', 'Erro ao remover compartilhamento');
      return;
    }
    notify('success', 'Compartilhamento removido');
    onSharesChange();
  }

  const totalParticipants = 1 + sharedProfiles.length; // owner + shares

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Share2 className="h-4 w-4 text-tertiary" />
        <p className="text-xs font-semibold uppercase tracking-wider text-tertiary">Visibilidade e compartilhamento</p>
      </div>

      {/* Toggle: shared / private */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => visibilidade !== 'shared' && setVisibilidade('shared')}
          disabled={!canEdit || saving}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
            visibilidade === 'shared'
              ? 'border-brand-primary/50 bg-brand-primary/10 text-brand-light'
              : 'border-default bg-elevated text-secondary hover:bg-hover-state'
          } ${!canEdit ? 'cursor-not-allowed opacity-60' : ''}`}
        >
          <Globe className="h-4 w-4" />
          <span>Compartilhar com todos</span>
        </button>
        <button
          type="button"
          onClick={() => visibilidade !== 'private' && setVisibilidade('private')}
          disabled={!canEdit || saving}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
            visibilidade === 'private'
              ? 'border-brand-primary/50 bg-brand-primary/10 text-brand-light'
              : 'border-default bg-elevated text-secondary hover:bg-hover-state'
          } ${!canEdit ? 'cursor-not-allowed opacity-60' : ''}`}
        >
          <Lock className="h-4 w-4" />
          <span>Privado</span>
        </button>
      </div>

      <p className="text-[11px] text-tertiary">
        {visibilidade === 'shared'
          ? 'Qualquer usuário autenticado vê este item.'
          : 'Só você e as pessoas incluídas abaixo veem este item.'}
      </p>

      {/* Lista de participantes */}
      <div className="rounded-lg border border-subtle bg-elevated/30 p-2">
        <div className="flex items-center gap-2 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-tertiary">
          <Users className="h-3 w-3" />
          {totalParticipants} {totalParticipants === 1 ? 'pessoa' : 'pessoas'} com acesso
        </div>
        <div className="space-y-1">
          {ownerProfile && (
            <ParticipantRow
              name={ownerProfile.display_name || ownerProfile.email}
              email={ownerProfile.email}
              isOwner
            />
          )}
          {sharedProfiles.map((p) => {
            const share = shares.find((s) => s.user_id === p.id);
            return (
              <ParticipantRow
                key={p.id}
                name={p.display_name || p.email}
                email={p.email}
                onRemove={canEdit && share ? () => removeShare(share.id) : undefined}
                isSelf={p.id === currentUserId}
              />
            );
          })}
        </div>

        {/* Adicionar pessoa (só se privado e pode editar) */}
        {canEdit && visibilidade === 'private' && (
          <div className="mt-2 border-t border-subtle pt-2">
            {!adding ? (
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-xs text-brand-light hover:bg-hover-state transition-colors"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Incluir pessoa
              </button>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar por email ou nome..."
                  autoFocus
                  className="w-full rounded-lg border border-default bg-base px-3 py-1.5 text-sm text-primary placeholder:text-tertiary focus:border-brand-primary focus:outline-none"
                />
                <div className="max-h-48 overflow-y-auto rounded-lg border border-subtle bg-surface">
                  {candidates.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-tertiary">Nenhum usuário disponível</p>
                  ) : (
                    candidates.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => addShare(p.id)}
                        disabled={saving}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-secondary hover:bg-hover-state transition-colors"
                      >
                        <Avatar name={p.display_name || p.email} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-primary">{p.display_name || p.email}</p>
                          <p className="truncate text-[10px] text-tertiary">{p.email}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => { setAdding(false); setQuery(''); }}
                  className="w-full rounded-lg px-2 py-1 text-xs text-tertiary hover:text-primary transition-colors"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {!canEdit && visibilidade === 'private' && (
        <p className="text-[11px] text-tertiary">Você não pode mudar a visibilidade ou incluir pessoas — só o dono.</p>
      )}
    </div>
  );
}

function ParticipantRow({
  name, email, isOwner, isSelf, onRemove,
}: {
  name: string;
  email: string;
  isOwner?: boolean;
  isSelf?: boolean;
  onRemove?: () => void;
}) {
  return (
    <div className="group flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-hover-state transition-colors">
      <Avatar name={name} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 truncate text-sm text-primary">
          {name}
          {isOwner && (
            <span className="rounded-md bg-brand-primary/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-brand-light">
              Dono
            </span>
          )}
          {isSelf && !isOwner && (
            <span className="rounded-md bg-elevated px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-tertiary">
              Você
            </span>
          )}
        </p>
        <p className="truncate text-[11px] text-tertiary">{email}</p>
      </div>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-tertiary opacity-0 transition-all hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
          aria-label="Remover"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
