import { ROLE_LABELS, STATUS_LABELS } from '../../lib/labels';
import type { UserListItem, UserStatus } from '../../types/api';

// Status is a small dot plus neutral text: the only color in the table.
const STATUS_DOT: Record<UserStatus, string> = {
  ACTIVE: 'bg-emerald-500',
  INACTIVE: 'bg-neutral-300',
  SUSPENDED: 'bg-red-400',
};

const dateFormat = new Intl.DateTimeFormat('es', { dateStyle: 'medium' });

function formatDate(iso: string | null): string {
  return iso ? dateFormat.format(new Date(iso)) : '—';
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

const TH = 'px-5 py-3 text-xs font-medium uppercase tracking-wider text-neutral-500';

export function UsersTable({ users }: { users: UserListItem[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[40rem] text-left text-sm">
        <thead className="border-b border-neutral-200">
          <tr>
            <th scope="col" className={TH}>Usuario</th>
            <th scope="col" className={TH}>Rol</th>
            <th scope="col" className={TH}>Estado</th>
            <th scope="col" className={TH}>Alta</th>
            <th scope="col" className={TH}>Último acceso</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {users.map((user, index) => (
            <tr
              key={user.id}
              className="animate-fade-in transition-colors hover:bg-neutral-50"
              style={{ animationDelay: `${index * 25}ms` }}
            >
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="grid size-8 shrink-0 place-items-center rounded-full bg-neutral-100 text-xs font-medium text-neutral-600"
                  >
                    {initials(user.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{user.name}</p>
                    <p className="truncate text-neutral-500">{user.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-5 py-3.5 text-neutral-600">{ROLE_LABELS[user.role]}</td>
              <td className="px-5 py-3.5">
                <span className="inline-flex items-center gap-2 text-neutral-700">
                  <span className={`size-1.5 rounded-full ${STATUS_DOT[user.status]}`} />
                  {STATUS_LABELS[user.status]}
                </span>
              </td>
              <td className="px-5 py-3.5 text-neutral-600">{formatDate(user.createdAt)}</td>
              <td className="px-5 py-3.5 text-neutral-600">{formatDate(user.lastLoginAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
