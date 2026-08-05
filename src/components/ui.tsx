import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

export function Badge({
  children,
  color = 'slate',
  className = '',
}: {
  children: ReactNode;
  color?: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium status-${color} ${className}`}
    >
      {children}
    </span>
  );
}

export function IconButton({
  icon: Icon,
  onClick,
  label,
  className = '',
}: {
  icon: LucideIcon;
  onClick?: () => void;
  label: string;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`flex h-8 w-8 items-center justify-center rounded-lg text-secondary transition-colors hover:bg-hover-state hover:text-primary ${className}`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  className = '',
  type = 'button',
  disabled = false,
}: {
  children?: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  icon?: LucideIcon;
  className?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
}) {
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-500 transition-colors',
    secondary: 'bg-elevated text-primary border border-default hover:bg-hover-state transition-colors',
    ghost: 'text-secondary hover:bg-hover-state hover:text-primary transition-colors',
    danger: 'bg-red-600/90 text-white hover:bg-red-500 transition-colors',
  };
  const sizes = {
    sm: 'h-8 px-3 text-xs gap-1.5',
    md: 'h-9 px-4 text-sm gap-2',
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {Icon && <Icon className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />}
      {children}
    </button>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-subtle bg-surface ${className}`}>{children}</div>
  );
}

export function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const sizes = {
    sm: 'h-6 w-6 text-[10px]',
    md: 'h-8 w-8 text-xs',
    lg: 'h-10 w-10 text-sm',
  };
  const colors = ['bg-blue-600/30 text-blue-300', 'bg-emerald-600/30 text-emerald-300', 'bg-amber-600/30 text-amber-300', 'bg-purple-600/30 text-purple-300', 'bg-cyan-600/30 text-cyan-300', 'bg-rose-600/30 text-rose-300'];
  const colorIndex = name.charCodeAt(0) % colors.length;
  return (
    <div className={`flex items-center justify-center rounded-full font-semibold ${colors[colorIndex]} ${sizes[size]}`}>
      {initials}
    </div>
  );
}

export function ProgressBar({ value, className = '' }: { value: number; className?: string }) {
  return (
    <div className={`h-1.5 w-full overflow-hidden rounded-full bg-elevated ${className}`}>
      <div
        className="h-full rounded-full bg-blue-500 transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-elevated">
        <Icon className="h-6 w-6 text-tertiary" />
      </div>
      <div>
        <p className="text-sm font-medium text-primary">{title}</p>
        {description && <p className="mt-1 text-xs text-tertiary">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  width = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  if (!open) return null;
  const widths = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 animate-fade-in" onClick={onClose}>
      <div
        className={`mt-[10vh] w-full ${widths[width]} rounded-2xl border border-default bg-surface shadow-2xl animate-scale-in`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-subtle px-6 py-4">
          <h2 className="text-base font-semibold text-primary">{title}</h2>
          <button onClick={onClose} className="text-tertiary transition-colors hover:text-primary">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

export function Input({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-xs font-medium text-secondary">
          {label} {required && <span className="text-red-400">*</span>}
        </span>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-default bg-elevated px-3 py-2 text-sm text-primary placeholder:text-tertiary focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-colors"
      />
    </label>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-xs font-medium text-secondary">{label}</span>}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full resize-none rounded-lg border border-default bg-elevated px-3 py-2 text-sm text-primary placeholder:text-tertiary focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-colors"
      />
    </label>
  );
}

export function Select({
  label,
  value,
  onChange,
  options,
  required = false,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  required?: boolean;
}) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-xs font-medium text-secondary">
          {label} {required && <span className="text-red-400">*</span>}
        </span>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-default bg-elevated px-3 py-2 text-sm text-primary focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-colors"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
