import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Plus, X, Loader2 } from 'lucide-react';
import { Stakeholder } from '../lib/types';

export interface StakeholderAutocompleteProps {
  /** Id do stakeholder atualmente vinculado (null = vazio). */
  value: string | null;
  /** Lista completa de stakeholders pra sugerir. */
  stakeholders: Stakeholder[];
  /** Texto que vai aparecer no input. Se null, mostra placeholder. */
  placeholder?: string;
  /** Disabled. */
  disabled?: boolean;
  /** Largura total (padrão: w-full). */
  className?: string;
  /**
   * Usuário escolheu um stakeholder EXISTENTE na lista.
   * O pai deve fazer o vínculo (upsert em processo_stakeholders).
   */
  onSelect: (stakeholderId: string) => void;
  /**
   * Usuário digitou um nome novo que não existe na lista.
   * O pai deve criar o stakeholder e depois fazer o vínculo.
   * Recebe o nome já normalizado (trim).
   * Deve resolver com o id do stakeholder criado (ou existente, se o pai detectar duplicata case-insensitive).
   */
  onCreate: (name: string) => Promise<string | null> | string | null;
  /** Removeu o stakeholder vinculado. */
  onClear: () => void;
}

/**
 * Input de stakeholder com autocomplete + criação on-the-fly.
 *
 * Comportamento:
 *  - Modo "selecionado": mostra pill com o nome + X para limpar.
 *  - Modo "digitando": input livre com dropdown de matches.
 *    - Enter / clique em item existente → onSelect(id)
 *    - Enter / clique em "Criar 'X'" (mostrado só se não existe match exato) → onCreate(name)
 *  - Esc fecha o dropdown.
 *  - Click fora fecha o dropdown.
 *  - Portal no body pra escapar de qualquer overflow/transform.
 */
export default function StakeholderAutocomplete({
  value, stakeholders, placeholder, disabled, className = '',
  onSelect, onCreate, onClear,
}: StakeholderAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const [creating, setCreating] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const current = value ? stakeholders.find((s) => s.id === value) : null;

  const trimmed = query.trim();
  const lower = trimmed.toLowerCase();

  // Filtra matches — case-insensitive, limite 8.
  const matches = useMemo(() => {
    const list = lower
      ? stakeholders.filter((s) => s.nome.toLowerCase().includes(lower))
      : stakeholders.slice(0, 8);
    return list.slice(0, 8);
  }, [stakeholders, lower]);

  const hasExactMatch = matches.some((s) => s.nome.toLowerCase() === lower);
  const showCreate = trimmed.length > 0 && !hasExactMatch;

  // Itens finais do dropdown: matches + opcional "Criar X".
  const items: Array<
    | { kind: 'existing'; id: string; nome: string }
    | { kind: 'create'; nome: string }
  > = useMemo(() => {
    const out: Array<{ kind: 'existing'; id: string; nome: string } | { kind: 'create'; nome: string }> =
      matches.map((s) => ({ kind: 'existing', id: s.id, nome: s.nome }));
    if (showCreate) out.push({ kind: 'create', nome: trimmed });
    return out;
  }, [matches, showCreate, trimmed]);

  // Recalcula posição do popover (portal no body) ao abrir/digitar/resize.
  function recalcPos() {
    const r = containerRef.current?.getBoundingClientRect();
    if (!r) return;
    setPos({ top: r.bottom + 4, left: r.left, width: r.width });
  }
  useEffect(() => {
    if (!open) return;
    recalcPos();
    window.addEventListener('resize', recalcPos);
    window.addEventListener('scroll', recalcPos, true);
    return () => {
      window.removeEventListener('resize', recalcPos);
      window.removeEventListener('scroll', recalcPos, true);
    };
  }, [open]);

  // Click outside fecha.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      const t = e.target as Node;
      if (containerRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const menuRef = useRef<HTMLDivElement>(null);

  // Reset highlight quando a lista muda.
  useEffect(() => {
    setHighlighted(0);
  }, [query, matches.length]);

  async function commit(item: typeof items[number] | undefined) {
    if (creating) return;
    const target = item ?? items[highlighted];
    if (!target) return;
    setOpen(false);
    if (target.kind === 'existing') {
      onSelect(target.id);
    } else {
      setCreating(true);
      try {
        await onCreate(target.nome);
      } finally {
        setCreating(false);
      }
    }
    setQuery('');
  }

  // Modo "selecionado" — quando tem value, mostra pill (a menos que esteja editando).
  if (current && !open) {
    return (
      <div ref={containerRef} className={`relative ${className}`}>
        <div className="flex items-center gap-2 rounded-lg border border-default bg-elevated px-3 py-2 text-sm">
          <span className="flex-1 truncate text-primary">{current.nome}</span>
          <button
            type="button"
            onClick={() => {
              onClear();
              // Foca o input pra editar imediatamente.
              setTimeout(() => inputRef.current?.focus(), 0);
            }}
            disabled={disabled}
            className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-tertiary transition-colors hover:bg-hover-state hover:text-red-400 disabled:opacity-50"
            aria-label="Remover"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // Modo "digitando" — input com dropdown.
  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setOpen(false);
              setQuery('');
            } else if (e.key === 'ArrowDown') {
              e.preventDefault();
              setOpen(true);
              setHighlighted((h) => Math.min(items.length - 1, h + 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setHighlighted((h) => Math.max(0, h - 1));
            } else if (e.key === 'Enter') {
              e.preventDefault();
              if (items.length === 0) return;
              commit(items[highlighted]);
            } else if (e.key === 'Tab') {
              setOpen(false);
            }
          }}
          placeholder={placeholder ?? 'Digite um nome...'}
          disabled={disabled || creating}
          autoComplete="off"
          className="w-full rounded-lg border border-default bg-elevated py-2 pl-3 pr-9 text-sm text-primary placeholder:text-tertiary focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary/50 transition-colors disabled:opacity-50"
        />
        <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-tertiary">
          {creating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </div>
      </div>

      {open && pos && typeof document !== 'undefined' && (matches.length > 0 || showCreate) &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            style={{
              position: 'fixed',
              top: pos.top,
              left: pos.left,
              width: pos.width,
              zIndex: 9999,
            }}
            className="max-h-72 overflow-y-auto rounded-xl border border-default bg-surface shadow-2xl animate-scale-in"
          >
            {matches.map((s, i) => {
              const idx = i;
              const isHl = idx === highlighted;
              return (
                <button
                  key={s.id}
                  type="button"
                  role="option"
                  aria-selected={isHl}
                  onMouseEnter={() => setHighlighted(idx)}
                  onClick={() => commit({ kind: 'existing', id: s.id, nome: s.nome })}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                    isHl ? 'bg-brand-primary/10 text-brand-light' : 'text-secondary hover:bg-hover-state'
                  }`}
                >
                  <span className="truncate">{s.nome}</span>
                  {s.tipo && s.tipo !== 'outro' && (
                    <span className="ml-auto text-[10px] uppercase tracking-wider text-tertiary">{s.tipo}</span>
                  )}
                </button>
              );
            })}
            {showCreate && (() => {
              const idx = matches.length;
              const isHl = idx === highlighted;
              return (
                <button
                  type="button"
                  role="option"
                  aria-selected={isHl}
                  onMouseEnter={() => setHighlighted(idx)}
                  onClick={() => commit({ kind: 'create', nome: trimmed })}
                  className={`flex w-full items-center gap-2 border-t border-subtle px-3 py-2 text-left text-sm transition-colors ${
                    isHl ? 'bg-brand-primary/10 text-brand-light' : 'text-brand-light hover:bg-hover-state'
                  }`}
                >
                  <Plus className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">Criar <strong>"{trimmed}"</strong></span>
                </button>
              );
            })()}
          </div>,
          document.body,
        )
      }
    </div>
  );
}
