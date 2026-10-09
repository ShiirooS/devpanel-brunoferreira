import { useState, type FormEvent } from 'react';
import { Navigate, useLocation } from 'react-router';
import { hasStatus } from '../../lib/http';
import { login } from './authApi';
import { useAuthStore } from './authStore';

interface LoginLocationState {
  from?: { pathname: string; search: string };
}

const INPUT =
  'mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-4 focus:ring-neutral-900/5';

function loginErrorMessage(error: unknown): string {
  // The API answers every credential failure with the same 401, and so does the UI.
  if (hasStatus(error, 401)) return 'Email o contraseña incorrectos.';
  if (hasStatus(error, 400)) return 'Revisa el formato del email y la contraseña.';
  return 'No se pudo conectar con el servidor. Inténtalo de nuevo.';
}

export function LoginPage() {
  const status = useAuthStore((state) => state.status);
  const setUser = useAuthStore((state) => state.setUser);
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (status === 'authenticated') {
    const from = (location.state as LoginLocationState | null)?.from;
    return <Navigate to={from ? from.pathname + from.search : '/'} replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      // Storing the user flips the status, and the redirect above takes over.
      setUser(await login({ email: email.trim(), password }));
    } catch (loginError) {
      setError(loginErrorMessage(loginError));
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(60rem_30rem_at_50%_-10%,var(--color-neutral-200),transparent)] px-4">
      <div className="w-full max-w-sm animate-fade-up">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="grid size-10 place-items-center rounded-xl bg-neutral-900 text-base font-semibold text-white">D</span>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight">Bienvenido a DevPanel</h1>
          <p className="mt-1.5 text-sm text-neutral-500">Inicia sesión para continuar</p>
        </div>

        <form
          className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
          onSubmit={handleSubmit}
        >
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-neutral-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              placeholder="tu@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={INPUT}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-neutral-700">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={INPUT}
            />
          </div>

          {error && (
            <p role="alert" className="animate-fade-in rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm text-neutral-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting && <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
            {submitting ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </main>
  );
}
