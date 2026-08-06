import { useState, useEffect, FormEvent } from 'react';
import { LogIn, Mail, Lock, Eye, EyeOff, AlertCircle, ArrowLeft, Sparkles } from 'lucide-react';
import { useAuth } from '../lib/auth';

export default function LoginPage() {
  const { signIn, resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'login' | 'forgot'>('login');
  const [forgotSent, setForgotSent] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // dispara a animação de entrada
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    if (mode === 'login') {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error);
        setSubmitting(false);
      }
    } else {
      const { error } = await resetPassword(email);
      if (error) {
        setError(error);
        setSubmitting(false);
      } else {
        setForgotSent(true);
        setSubmitting(false);
      }
    }
  }

  return (
    <div className="relative flex h-screen items-center justify-center overflow-hidden bg-base">
      {/* ===== Camada de fundo animada ===== */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* gradient base */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0030] via-base to-[#0a0014]" />

        {/* blobs de cor (animados) */}
        <div
          className="absolute -left-32 -top-32 h-[480px] w-[480px] rounded-full opacity-40 blur-3xl"
          style={{
            background: 'radial-gradient(circle, #9100E2 0%, transparent 70%)',
            animation: 'float-1 18s ease-in-out infinite',
          }}
        />
        <div
          className="absolute -right-40 top-1/3 h-[520px] w-[520px] rounded-full opacity-35 blur-3xl"
          style={{
            background: 'radial-gradient(circle, #E30294 0%, transparent 70%)',
            animation: 'float-2 22s ease-in-out infinite',
          }}
        />
        <div
          className="absolute -bottom-40 left-1/3 h-[420px] w-[420px] rounded-full opacity-30 blur-3xl"
          style={{
            background: 'radial-gradient(circle, #FF7401 0%, transparent 70%)',
            animation: 'float-3 25s ease-in-out infinite',
          }}
        />
        <div
          className="absolute right-1/4 top-10 h-[300px] w-[300px] rounded-full opacity-25 blur-3xl"
          style={{
            background: 'radial-gradient(circle, #D78FFF 0%, transparent 70%)',
            animation: 'float-4 20s ease-in-out infinite',
          }}
        />

        {/* grade sutil */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        {/* vinheta */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_30%,_rgba(0,0,0,0.6)_100%)]" />
      </div>

      {/* ===== Conteúdo ===== */}
      <div
        className={`relative z-10 w-full max-w-sm transition-all duration-700 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <div className="mb-8 text-center">
          {/* marca minimal — só o ícone, sem imagem */}
          <div className="relative mx-auto mb-4 inline-flex">
            <div
              className="absolute inset-0 rounded-full blur-xl"
              style={{
                background: 'radial-gradient(circle, rgba(145,0,226,0.4) 0%, transparent 70%)',
                animation: 'pulse-glow 3s ease-in-out infinite',
              }}
            />
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-primary to-brand-magenta shadow-lg shadow-brand-primary/30">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-primary">
            Workflow RPA
          </h1>
          <p className="mt-1 text-sm text-tertiary">
            {mode === 'login' ? 'Entre com sua conta' : 'Recupere sua senha'}
          </p>
        </div>

        <div className="rounded-2xl border border-subtle/60 bg-surface/70 p-6 shadow-2xl backdrop-blur-xl">
          {forgotSent ? (
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                <Mail className="h-5 w-5" />
              </div>
              <p className="text-sm text-primary">Email de recuperação enviado</p>
              <p className="mt-1 text-xs text-tertiary">
                Confira a caixa de entrada de <strong>{email}</strong> e siga o link para redefinir.
              </p>
              <button
                onClick={() => { setMode('login'); setForgotSent(false); }}
                className="mt-4 flex items-center gap-1.5 text-xs text-tertiary hover:text-secondary transition-colors mx-auto"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Voltar para o login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-secondary">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tertiary" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    autoComplete="email"
                    className="w-full rounded-lg border border-default bg-elevated/60 py-2.5 pl-10 pr-3 text-sm text-primary placeholder:text-tertiary focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary/50 transition-colors"
                  />
                </div>
              </div>

              {mode === 'login' && (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-secondary">Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tertiary" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="w-full rounded-lg border border-default bg-elevated/60 py-2.5 pl-10 pr-10 text-sm text-primary placeholder:text-tertiary focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary/50 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-tertiary hover:text-secondary transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />
                  <p className="text-xs text-red-300">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg bg-brand-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-deep disabled:opacity-50"
              >
                {/* shine effect no hover */}
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                {submitting ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <LogIn className="h-4 w-4" />
                )}
                {mode === 'login' ? 'Entrar' : 'Enviar link de recuperação'}
              </button>

              <div className="flex items-center justify-between pt-1 text-xs">
                {mode === 'login' ? (
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setError(null); }}
                    className="text-tertiary hover:text-brand-light transition-colors"
                  >
                    Esqueci minha senha
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setError(null); }}
                    className="flex items-center gap-1 text-tertiary hover:text-secondary transition-colors"
                  >
                    <ArrowLeft className="h-3 w-3" /> Voltar
                  </button>
                )}
              </div>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-[11px] text-tertiary">
          Acesso restrito · Workflow RPA © 2026
        </p>
      </div>

      {/* keyframes injetados no <head> via style tag */}
      <style>{`
        @keyframes float-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(80px, 60px) scale(1.1); }
        }
        @keyframes float-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-100px, 40px) scale(1.15); }
        }
        @keyframes float-3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(60px, -80px) scale(0.95); }
        }
        @keyframes float-4 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-50px, 70px) scale(1.08); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.5; transform: scale(0.95); }
          50% { opacity: 0.85; transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}
