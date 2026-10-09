import { isCancel } from 'axios';
import { useEffect, useState } from 'react';
import { ROLE_LABELS, STATUS_LABELS } from '../../lib/labels';
import { useDebouncedValue } from '../../lib/useDebouncedValue';
import type { Role, UsersPage, UserStatus } from '../../types/api';
import { fetchUsers } from './usersApi';
import { UsersTable } from './UsersTable';

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;
const CONTROL =
  'rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-sm outline-none transition focus:border-neutral-900 focus:ring-4 focus:ring-neutral-900/5';
const PAGER_BUTTON =
  'rounded-lg border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent';

export function UsersSection() {
  const [searchInput, setSearchInput] = useState('');
  const [role, setRole] = useState<Role | ''>('');
  const [status, setStatus] = useState<UserStatus | ''>('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<UsersPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // The request only follows the debounced text, so typing fast sends one call.
  const search = useDebouncedValue(searchInput.trim(), SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    // Aborting on cleanup means a slow, stale response can never overwrite a newer one.
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    fetchUsers({ search, page, pageSize: PAGE_SIZE, role, status }, controller.signal)
      .then((data) => {
        setResult(data);
        setLoading(false);
      })
      .catch((fetchError: unknown) => {
        if (isCancel(fetchError)) return;
        setError(true);
        setLoading(false);
      });
    return () => controller.abort();
  }, [search, page, role, status]);

  const users = result?.data ?? [];
  const meta = result?.meta;
  const totalPages = Math.max(meta?.totalPages ?? 1, 1);

  return (
    <section
      className="overflow-hidden rounded-2xl border border-neutral-200 bg-white animate-fade-up"
      style={{ animationDelay: '320ms' }}
    >
      <div className="flex flex-col gap-3 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold tracking-tight">Usuarios</h2>
          {loading && result && (
            <span
              role="status"
              aria-label="Actualizando"
              className="size-3.5 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-700"
            />
          )}
        </div>
        <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
          <label htmlFor="user-search" className="sr-only">
            Buscar usuarios por nombre o email
          </label>
          <div className="relative sm:w-64">
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400"
            >
              <circle cx="9" cy="9" r="5.5" />
              <path d="m13.5 13.5 3 3" />
            </svg>
            <input
              id="user-search"
              type="search"
              value={searchInput}
              onChange={(event) => {
                setSearchInput(event.target.value);
                setPage(1);
              }}
              placeholder="Buscar por nombre o email"
              className={`${CONTROL} w-full pl-9`}
            />
          </div>
          <label htmlFor="user-role" className="sr-only">
            Filtrar por rol
          </label>
          <select
            id="user-role"
            value={role}
            onChange={(event) => {
              setRole(event.target.value as Role | '');
              setPage(1);
            }}
            className={CONTROL}
          >
            <option value="">Todos los roles</option>
            {(Object.keys(ROLE_LABELS) as Role[]).map((value) => (
              <option key={value} value={value}>
                {ROLE_LABELS[value]}
              </option>
            ))}
          </select>
          <label htmlFor="user-status" className="sr-only">
            Filtrar por estado
          </label>
          <select
            id="user-status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as UserStatus | '');
              setPage(1);
            }}
            className={CONTROL}
          >
            <option value="">Todos los estados</option>
            {(Object.keys(STATUS_LABELS) as UserStatus[]).map((value) => (
              <option key={value} value={value}>
                {STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="mx-5 mb-5 animate-fade-in rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm text-neutral-700"
        >
          No se pudieron cargar los usuarios.
        </p>
      )}

      {!error && !result && loading && (
        <div className="space-y-px" aria-busy="true">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="mx-5 mb-3 h-11 animate-pulse rounded-lg bg-neutral-100" />
          ))}
        </div>
      )}

      {!error && result && users.length === 0 && !loading && (
        <p className="animate-fade-in px-5 py-12 text-center text-sm text-neutral-500">
          {search || role || status ? 'Sin resultados con estos filtros.' : 'No hay usuarios.'}
        </p>
      )}

      {result && users.length > 0 && (
        // Keep the previous rows on screen (dimmed) while the next page or search loads.
        <div className={`border-t border-neutral-200 transition-opacity ${loading ? 'opacity-50' : ''}`}>
          <UsersTable users={users} />
        </div>
      )}

      {meta && (
        <nav
          aria-label="Paginación"
          className="flex items-center justify-between border-t border-neutral-200 px-5 py-3 text-sm"
        >
          <p className="text-neutral-500">
            {meta.total} {meta.total === 1 ? 'usuario' : 'usuarios'} · Página {meta.page} de {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => current - 1)}
              disabled={page <= 1}
              className={PAGER_BUTTON}
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => setPage((current) => current + 1)}
              disabled={page >= totalPages}
              className={PAGER_BUTTON}
            >
              Siguiente
            </button>
          </div>
        </nav>
      )}
    </section>
  );
}
