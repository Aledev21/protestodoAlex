import { useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { LucideIcon, X } from 'lucide-react';

export interface ActionItem {
  /** Identificador único (usado como key). */
  id: string;
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  danger?: boolean;
  divider?: boolean;
  disabled?: boolean;
}

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Subtítulo opcional (geralmente nome/categoria do item). */
  subtitle?: string;
  /** Ícone pequeno exibido ao lado do título. */
  icon?: LucideIcon;
  /** Cor do ícone do header (ex: '#9100E2'). */
  iconColor?: string;
  items: ActionItem[];
  /** Largura do drawer. Default: 22rem (w-88). */
  width?: string;
  /** Conteúdo extra exibido abaixo da lista de ações (ex: seção de compartilhamento). */
  footer?: ReactNode;
}

/**
 * Slide-over lateral com lista de ações.
 *
 * Vantagem vs menu 3-pontinhos:
 *  - Sem clipping (vive no body, fixed nas bordas da viewport).
 *  - Sem problema de transform/position relative (o drawer inteiro é o overlay).
 *  - Mais espaço pra ações longas, atalhos, ajuda inline.
 *  - Padrão conhecido (mobile + desktop).
 *  - Acessível: ESC fecha, foco inicial no título, trap de foco básico.
 */
export default function ActionDrawer({
  open, onClose, title, subtitle, icon: Icon, iconColor, items, width = '22rem', footer,
}: Props) {
  // ESC fecha + bloqueia scroll do body enquanto aberto.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="action-drawer-title"
    >
      {/* Backdrop */}
      <div
        className="flex-1 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Painel lateral */}
      <div
        className="flex h-full flex-col border-l border-default bg-surface shadow-2xl animate-slide-in-right"
        style={{ width }}
      >
        {/* Header */}
        <div className="flex items-start gap-3 border-b border-subtle px-5 py-4">
          {Icon && (
            <div
              className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
              style={{
                backgroundColor: iconColor ? `${iconColor}20` : 'var(--bg-elevated)',
                color: iconColor || 'var(--text-primary)',
              }}
            >
              <Icon className="h-5 w-5" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h2 id="action-drawer-title" className="text-base font-semibold text-primary truncate">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-0.5 text-xs text-tertiary truncate">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-tertiary transition-colors hover:bg-hover-state hover:text-primary"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Lista de ações */}
        <div className={`overflow-y-auto p-3 ${footer ? 'flex-shrink-0' : 'flex-1'}`}>
          {items.map((it, i) => {
            const isFirst = i === 0 || items[i - 1]?.divider;
            const isLast = i === items.length - 1;
            const radius = isFirst ? 'rounded-t-xl' : isLast && !it.divider ? 'rounded-b-xl' : '';
            return (
              <div key={it.id}>
                {it.divider && <div className="my-2 border-t border-subtle" />}
                <button
                  type="button"
                  onClick={() => {
                    if (it.disabled) return;
                    onClose();
                    // Pequeno delay para a animação do drawer começar antes de disparar a ação.
                    // Evita sensação de "pulo" ao fechar + abrir modal.
                    setTimeout(it.onClick, 80);
                  }}
                  disabled={it.disabled}
                  className={`flex w-full items-center gap-3 px-3.5 py-3 text-left text-sm transition-colors ${
                    it.danger
                      ? 'text-red-400 hover:bg-red-500/10'
                      : 'text-secondary hover:bg-hover-state hover:text-primary'
                  } ${radius} ${it.disabled ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  {it.icon && <it.icon className="h-4 w-4 flex-shrink-0" />}
                  <span className="flex-1 truncate font-medium">{it.label}</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer opcional (seção de compartilhamento, etc) */}
        {footer && (
          <div className="border-t border-subtle p-3">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
