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
  const [repeatThreshold, setRepeatThreshold] = useState('3');
  const [repeatWindow, setRepeatWindow] = useState('30');
  const [query, setQuery] = useState('');

  const needle = query.trim().toLowerCase();
  const canSubmit = name.trim().length > 0 && adminEmail.trim().length > 0 && !props.creating;

  return (
    <div data-vid="b9equtf"
      className="flex w-full flex-1 flex-col gap-4 bg-background p-4 text-foreground md:p-6"
      data-agent-id="screen:organizations"
    >
      <header data-vid="qw49vei" className="flex flex-wrap items-start justify-between gap-3">
        <div data-vid="mhoxztl" className="min-w-0">
          <h1 data-vid="fvjldtz" className="m-0 text-2xl font-semibold">Organizations</h1>
          <p data-vid="a7ad26n" className="m-0 mt-1 max-w-prose text-sm text-muted-foreground">
            Every customer organization on the platform, with its status and first administrator.
          </p>
        </div>
        <Button data-vid="e9phoup" type="button" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'New organization'}
        </Button>
      </header>

      {showForm ? (
        <form data-vid="pjm2r1t"
          className="grid gap-3 rounded-lg border border-border bg-card p-4 text-card-foreground md:grid-cols-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!canSubmit) return;
            props.onCreate({
              name: name.trim(),
              adminEmail: adminEmail.trim(),
              operatorType,
              status: 'ONBOARDING',
              repeatThreshold: Number(repeatThreshold),
              repeatWindow: Number(repeatWindow),
            });
            setName('');
            setAdminEmail('');
            setShowForm(false);
          }}
        >
          <label data-vid="03vs70y" className="flex flex-col gap-1 text-sm">
            Name
            <input data-vid="0f1jbnb" className={FIELD} value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label data-vid="ehgxyva" className="flex flex-col gap-1 text-sm">
            First administrator email
            <input data-vid="gqpm41l"
              className={FIELD}
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              required
            />
          </label>
          <label data-vid="y4wlhpr" className="flex flex-col gap-1 text-sm">
            Operator type
            <select data-vid="lhmxjov" className={FIELD} value={operatorType} onChange={(e) => setOperatorType(e.target.value)}>
              <option data-vid="9egqzco" value="airline">Airline</option>
              <option data-vid="7y8ruhh" value="mro">MRO</option>
            </select>
          </label>
          <label data-vid="f87nobo" className="flex flex-col gap-1 text-sm">
            Repeat defect threshold (occurrences)
            <input data-vid="kd22qkp"
              className={FIELD}
              type="number"
              min={1}
              step={1}
              value={repeatThreshold}
              onChange={(e) => setRepeatThreshold(e.target.value)}
              required
            />
          </label>
          <label data-vid="qnsugsy" className="flex flex-col gap-1 text-sm">
            Repeat look-back window (days)
            <input data-vid="22y2fse"
              className={FIELD}
              type="number"
              min={1}
              step={1}
              value={repeatWindow}
              onChange={(e) => setRepeatWindow(e.target.value)}
              required
            />
          </label>
          <div data-vid="0vx8txn" className="flex items-end">
            <Button data-vid="7z8edgs" type="submit" disabled={!canSubmit}>
              {props.creating ? 'Creating…' : 'Create organization'}
            </Button>
          </div>
        </form>
      ) : null}

      {props.actionError !== null ? (
        <p data-vid="zt6aznl" role="alert" className="m-0 rounded-md bg-status-danger-bg p-3 text-sm text-status-danger-ink">
          {props.actionError}
        </p>
      ) : null}

      <input data-vid="fh12l7o"
        className={FIELD}
        placeholder="Search organizations"
        aria-label="Search organizations"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {props.organizations.length === 0 ? (
        <div data-vid="66b6lfp" className="rounded-lg border border-dashed border-border p-8 text-center">
          <h2 data-vid="z5e30dt" className="m-0 text-base font-semibold">No organizations yet</h2>
          <p data-vid="po2nn1u" className="m-0 mt-1 text-sm text-muted-foreground">
            Create the first organization to start onboarding a customer.
          </p>
        </div>
      ) : (
        <ul data-vid="98dhb0l" className="m-0 flex list-none flex-col gap-3 p-0">
          {props.organizations.map((org) =>
            needle === '' ||
            org.name.toLowerCase().includes(needle) ||
            org.adminEmail.toLowerCase().includes(needle) ? (
              <li data-vid="7o2cqfx"
                key={org.id}
                className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 text-card-foreground md:flex-row md:items-center md:justify-between"
                data-agent-row="Organization"
              >
                <div data-vid="r87vll6" className="min-w-0">
                  <div data-vid="ia6go9v" className="flex flex-wrap items-center gap-2">
                    <span data-vid="yv8wfxs" className="truncate font-semibold">{org.name}</span>
                    <span data-vid="b4cltsz"
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[org.status] ?? ''}`}
                    >
                      {STATUS_LABEL[org.status] ?? org.status}
                    </span>
                  </div>
                  <p data-vid="w996zeg" className="m-0 mt-1 truncate text-sm text-muted-foreground">
                    {org.operatorType === 'mro' ? 'MRO' : 'Airline'} ·{' '}
                    {org.adminEmail !== '' ? `First admin: ${org.adminEmail}` : 'No administrator invited'}
                  </p>
                </div>
                <div data-vid="5sliiue" className="flex shrink-0 gap-2">
                  {org.status !== 'ACTIVE' ? (
                    <Button data-vid="18k0fbe"
                      type="button"
                      size="sm"
                      disabled={props.busyId === org.id}
                      onClick={() => props.onChangeStatus(org.id, 'ACTIVE')}
                    >
                      {org.status === 'SUSPENDED' ? 'Reactivate' : 'Activate'}
                    </Button>
                  ) : null}
                  {org.status !== 'SUSPENDED' ? (
                    <Button data-vid="g53zmo2"
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
