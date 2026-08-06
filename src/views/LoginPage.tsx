import { useState, FormEvent } from 'react';
import { Sparkles, LogIn, Mail, Lock, Eye, EyeOff, AlertCircle, ArrowLeft } from 'lucide-react';
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
      // se sucesso, o onAuthStateChange já cuida de redirecionar
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
    <div className="flex h-screen items-center justify-center bg-base p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-primary to-brand-secondary">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-primary">Workflow RPA</h1>
          <p className="mt-1 text-sm text-tertiary">
            {mode === 'login' ? 'Entre com sua conta' : 'Recupere sua senha'}
          </p>
        </div>

        <div className="rounded-2xl border border-subtle bg-surface p-6 shadow-2xl">
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
                    className="w-full rounded-lg border border-default bg-elevated py-2.5 pl-10 pr-3 text-sm text-primary placeholder:text-tertiary focus:border-brand-primary focus:outline-none transition-colors"
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
                      className="w-full rounded-lg border border-default bg-elevated py-2.5 pl-10 pr-10 text-sm text-primary placeholder:text-tertiary focus:border-brand-primary focus:outline-none transition-colors"
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
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-brand-primary to-brand-secondary py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
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
                    className="text-tertiary hover:text-secondary transition-colors"
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
    </div>
  );
}
