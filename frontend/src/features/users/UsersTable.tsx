import { ROLE_LABELS, STATUS_LABELS } from '../../lib/labels';
import type { UserListItem, UserStatus } from '../../types/api';

const STATUS_STYLES: Record<UserStatus, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  INACTIVE: 'bg-slate-100 text-slate-600 ring-slate-200',
  SUSPENDED: 'bg-red-50 text-red-700 ring-red-200',
};

const dateFormat = new Intl.DateTimeFormat('es', { dateStyle: 'medium' });

function formatDate(iso: string | null): string {
  return iso ? dateFormat.format(new Date(iso)) : 'Nunca';
}

export function UsersTable({ users }: { users: UserListItem[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[40rem] text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">Usuario</th>
            <th scope="col" className="px-4 py-3 font-medium">Rol</th>
            <th scope="col" className="px-4 py-3 font-medium">Estado</th>
            <th scope="col" className="px-4 py-3 font-medium">Alta</th>
            <th scope="col" className="px-4 py-3 font-medium">Último acceso</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-slate-50">
              <td className="px-4 py-3">
                <p className="font-medium text-slate-900">{user.name}</p>
                <p className="text-slate-500">{user.email}</p>
              </td>
              <td className="px-4 py-3 text-slate-700">{ROLE_LABELS[user.role]}</td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[user.status]}`}
                >
                  {STATUS_LABELS[user.status]}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-700">{formatDate(user.createdAt)}</td>
              <td className="px-4 py-3 text-slate-700">{formatDate(user.lastLoginAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
