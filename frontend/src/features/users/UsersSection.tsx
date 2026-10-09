import { isCancel } from 'axios';
import { useEffect, useState } from 'react';
import { ROLE_LABELS, STATUS_LABELS } from '../../lib/labels';
import { useDebouncedValue } from '../../lib/useDebouncedValue';
import type { Role, UsersPage, UserStatus } from '../../types/api';
import { fetchUsers } from './usersApi';
import { UsersTable } from './UsersTable';

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;
const FILTER_CLASSES =
  'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200';

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
    <section className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold">Usuarios</h2>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <label htmlFor="user-search" className="sr-only">
            Buscar usuarios por nombre o email
          </label>
          <input
            id="user-search"
            type="search"
            value={searchInput}
            onChange={(event) => {
              setSearchInput(event.target.value);
              setPage(1);
            }}
            placeholder="Buscar por nombre o email…"
            className={`${FILTER_CLASSES} sm:w-64`}
          />
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
            className={FILTER_CLASSES}
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
            className={FILTER_CLASSES}
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
        <p role="alert" className="m-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          No se pudieron cargar los usuarios.
        </p>
      )}

      {!error && !result && loading && (
        <p className="p-8 text-center text-sm text-slate-500" aria-busy="true">
          Cargando usuarios…
        </p>
      )}

      {!error && result && users.length === 0 && !loading && (
        <p className="p-8 text-center text-sm text-slate-500">
          {search || role || status ? 'Sin resultados con estos filtros.' : 'No hay usuarios.'}
        </p>
      )}

      {result && users.length > 0 && (
        // Keep the previous rows on screen (dimmed) while the next page or search loads.
        <div className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
          <UsersTable users={users} />
        </div>
      )}

      {meta && (
        <nav
          aria-label="Paginación"
          className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm"
        >
          <p className="text-slate-500">
            {meta.total} {meta.total === 1 ? 'usuario' : 'usuarios'} · Página {meta.page} de {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => current - 1)}
              disabled={page <= 1}
              className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => setPage((current) => current + 1)}
              disabled={page >= totalPages}
              className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </nav>
      )}
    </section>
  );
}
