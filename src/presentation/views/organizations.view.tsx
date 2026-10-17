import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { OrganizationsScreenViewModel } from '@/application/view-models/organizations.vm';

const STATUS_LABEL: Record<string, string> = {
  ONBOARDING: 'Onboarding',
  ACTIVE: 'Active',
  SUSPENDED: 'Suspended',
};

const STATUS_CLASS: Record<string, string> = {
  ONBOARDING: 'bg-status-pending-bg text-status-pending-ink',
  ACTIVE: 'bg-status-ok-bg text-status-ok-ink',
  SUSPENDED: 'bg-status-danger-bg text-status-danger-ink',
};

const FIELD =
  'h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

export function OrganizationsView(props: OrganizationsScreenViewModel) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [operatorType, setOperatorType] = useState('airline');
  const [query, setQuery] = useState('');

  const needle = query.trim().toLowerCase();
  const canSubmit = name.trim().length > 0 && adminEmail.trim().length > 0 && !props.creating;

  return (
    <div
      className="flex w-full flex-1 flex-col gap-4 bg-background p-4 text-foreground md:p-6"
      data-agent-id="screen:organizations"
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="m-0 text-2xl font-semibold">Organizations</h1>
          <p className="m-0 mt-1 max-w-prose text-sm text-muted-foreground">
            Every customer organization on the platform, with its status and first administrator.
          </p>
        </div>
        <Button type="button" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'New organization'}
        </Button>
      </header>

      {showForm ? (
        <form
          className="grid gap-3 rounded-lg border border-border bg-card p-4 text-card-foreground md:grid-cols-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!canSubmit) return;
            props.onCreate({
              name: name.trim(),
              adminEmail: adminEmail.trim(),
              operatorType,
              status: 'ONBOARDING',
            });
            setName('');
            setAdminEmail('');
            setShowForm(false);
          }}
        >
          <label className="flex flex-col gap-1 text-sm">
            Name
            <input className={FIELD} value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            First administrator email
            <input
              className={FIELD}
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Operator type
            <select className={FIELD} value={operatorType} onChange={(e) => setOperatorType(e.target.value)}>
              <option value="airline">Airline</option>
              <option value="mro">MRO</option>
            </select>
          </label>
          <div className="flex items-end">
            <Button type="submit" disabled={!canSubmit}>
              {props.creating ? 'Creating…' : 'Create organization'}
            </Button>
          </div>
        </form>
      ) : null}

      {props.actionError !== null ? (
        <p role="alert" className="m-0 rounded-md bg-status-danger-bg p-3 text-sm text-status-danger-ink">
          {props.actionError}
        </p>
      ) : null}

      <input
        className={FIELD}
        placeholder="Search organizations"
        aria-label="Search organizations"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {props.organizations.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <h2 className="m-0 text-base font-semibold">No organizations yet</h2>
          <p className="m-0 mt-1 text-sm text-muted-foreground">
            Create the first organization to start onboarding a customer.
          </p>
        </div>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {props.organizations.map((org) =>
            needle === '' ||
            org.name.toLowerCase().includes(needle) ||
            org.adminEmail.toLowerCase().includes(needle) ? (
              <li
                key={org.id}
                className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 text-card-foreground md:flex-row md:items-center md:justify-between"
                data-agent-row="Organization"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-semibold">{org.name}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[org.status] ?? ''}`}
                    >
                      {STATUS_LABEL[org.status] ?? org.status}
                    </span>
                  </div>
                  <p className="m-0 mt-1 truncate text-sm text-muted-foreground">
                    {org.operatorType === 'mro' ? 'MRO' : 'Airline'} ·{' '}
                    {org.adminEmail !== '' ? `First admin: ${org.adminEmail}` : 'No administrator invited'}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {org.status !== 'ACTIVE' ? (
                    <Button
                      type="button"
                      size="sm"
                      disabled={props.busyId === org.id}
                      onClick={() => props.onChangeStatus(org.id, 'ACTIVE')}
                    >
                      {org.status === 'SUSPENDED' ? 'Reactivate' : 'Activate'}
                    </Button>
                  ) : null}
                  {org.status !== 'SUSPENDED' ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={props.busyId === org.id}
                      onClick={() => props.onChangeStatus(org.id, 'SUSPENDED')}
                    >
                      Suspend
                    </Button>
                  ) : null}
                </div>
              </li>
            ) : null,
          )}
        </ul>
      )}
    </div>
  );
}
