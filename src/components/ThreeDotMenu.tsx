import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { LucideIcon, MoreVertical } from 'lucide-react';

export interface ThreeDotMenuItem {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  danger?: boolean;
  divider?: boolean;
}

interface Props {
  /** Aberto? controlado pelo pai. */
  open: boolean;
  /** Chamado quando o menu deve abrir/fechar. */
  onOpenChange: (open: boolean) => void;
  /** Itens do menu. */
  items: ThreeDotMenuItem[];
  /** Tamanho do botão (h w em tailwind). Default: h-7 w-7. */
  buttonSize?: 'sm' | 'md';
  /** Classes adicionais no botão gatilho. */
  buttonClassName?: string;
  /** Largura do popover em rem. Default: 11rem (w-44). */
  menuWidth?: string;
  /** Alinhamento preferido do menu em relação ao botão. */
  align?: 'right' | 'left';
  /** Optional ID for tests. */
  id?: string;
}

/**
 * Menu 3-pontinhos que SEMPRE escapa de qualquer container.
 *
 * Estratégia em 2 camadas:
 *  1. O popover é renderizado via `createPortal` direto no `document.body`.
 *     Isso garante que ele não é filho de NENHUM ancestor — então nada de
 *     `overflow:hidden`, `transform`, `filter`, `contain` ou `will-change`
 *     em um card-pai pode clipar ou criar um containing block que prenda
 *     o menu.
 *  2. Usa `position: fixed` (referente à viewport, já que está no body)
 *     com coordenadas calculadas via `getBoundingClientRect` no momento
 *     da abertura. Re-calcula em resize e scroll.
 *
 * Bônus: ajusta horizontalmente se passar da largura da viewport.
 */
export default function ThreeDotMenu({
  open,
  onOpenChange,
  items,
  buttonSize = 'sm',
  buttonClassName = '',
  menuWidth = '11rem',
  align = 'right',
  id,
}: Props) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  // Recalcula posição ao abrir e em resize/scroll.
  useLayoutEffect(() => {
    if (!open) return;
    function place() {
      const r = btnRef.current?.getBoundingClientRect();
      if (!r) return;
      const menuW = parseFloat(menuWidth) * 16; // rem -> px (assumindo 16px base)
      const gap = 4;
      const top = r.bottom + gap;
      let left: number;
      if (align === 'right') {
        left = r.right - menuW;
      } else {
        left = r.left;
      }
      // Clamp horizontalmente para não escapar da viewport.
      const vw = window.innerWidth;
      const margin = 8;
      if (left < margin) left = margin;
      if (left + menuW > vw - margin) left = vw - margin - menuW;
      setPos({ top, left });
    }
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, align, menuWidth]);

  // Click-outside + ESC para fechar.
  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      const t = e.target as Node;
      if (btnRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      onOpenChange(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onOpenChange(false);
    }
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onOpenChange]);

  // Fecha o menu automaticamente se a página for scrollada manualmente.
  useEffect(() => {
    if (!open) return;
    const onWheel = () => onOpenChange(false);
    window.addEventListener('wheel', onWheel, { passive: true });
    return () => window.removeEventListener('wheel', onWheel);
  }, [open, onOpenChange]);

  const sizeClass = buttonSize === 'sm' ? 'h-7 w-7' : 'h-8 w-8';
  const iconClass = buttonSize === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';

  // Popover via portal: vive no body, fora de QUALQUER ancestor.
  const popover = open && pos && typeof document !== 'undefined'
    ? createPortal(
        <div
          ref={menuRef}
          role="menu"
          style={{
            position: 'fixed',
            top: pos.top,
            left: pos.left,
            width: menuWidth,
            // Z altíssimo: acima de sidebar, modal, etc.
            zIndex: 9999,
          }}
          className="rounded-xl border border-default bg-surface shadow-2xl animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          {items.map((it, i) => {
            const isFirst = i === 0 || items[i - 1]?.divider;
            const isLast = i === items.length - 1;
            const radius = isFirst ? 'rounded-t-xl' : isLast && !it.divider ? 'rounded-b-xl' : '';
            return (
              <div key={`${i}-${it.label}`}>
                {it.divider && <div className="my-1 border-t border-subtle" />}
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onOpenChange(false);
                    it.onClick();
                  }}
                  className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-sm transition-colors ${
                    it.danger
                      ? 'text-red-400 hover:bg-red-500/10'
                      : 'text-secondary hover:bg-hover-state'
                  } ${radius}`}
                >
                  {it.icon && <it.icon className="h-4 w-4" />}
                  <span className="truncate">{it.label}</span>
                </button>
              </div>
            );
          })}
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOpenChange(!open);
        }}
        className={`flex ${sizeClass} flex-shrink-0 items-center justify-center rounded-lg text-tertiary transition-colors hover:bg-elevated hover:text-primary ${buttonClassName}`}
        aria-haspopup="menu"
        aria-expanded={open}
        id={id}
      >
        <MoreVertical className={iconClass} />
      </button>
      {popover}
    </>
  );
}
