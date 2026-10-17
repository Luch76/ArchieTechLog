import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { UserDetailScreenViewModel } from '@/application/view-models/user-detail.vm';

const FIELD =
  'h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

function formatStamp(value: string): string {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString();
}

export function UserDetailView(props: UserDetailScreenViewModel) {
  const { user } = props;
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [role, setRole] = useState(user?.role ?? '');
  const [confirmRemove, setConfirmRemove] = useState(false);

  if (user === null) {
    return (
      <div className="flex w-full flex-1 flex-col gap-3 bg-background p-6 text-foreground" data-agent-id="screen:user-detail-not-found">
        <h1 className="m-0 text-2xl font-semibold">Member not found</h1>
        <p className="m-0 text-sm text-muted-foreground">
          This member does not exist or was removed. Open a member from the Users list.
        </p>
        <div>
          <Button type="button" variant="outline" onClick={props.onBack}>
            Back to users
          </Button>
        </div>
      </div>
    );
  }

  const fullName = `${user.firstName} ${user.lastName ?? ''}`.trim();
  const roleOptions = props.roleNames.includes(role) || role === '' ? props.roleNames : [...props.roleNames, role];

  return (
    <div className="flex w-full flex-1 flex-col gap-4 bg-background p-4 text-foreground md:p-6" data-agent-id="screen:user-detail">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="m-0 text-2xl font-semibold">{fullName === '' ? user.email : fullName}</h1>
          <p className="m-0 mt-1 text-sm text-muted-foreground">
            {user.email}
            {user.role !== undefined ? ` · ${user.role}` : ''}
          </p>
        </div>
        <Button type="button" variant="outline" onClick={props.onBack}>
          Back to users
        </Button>
      </header>

      {props.notice !== null ? (
        <p
          role={props.notice.tone === 'error' ? 'alert' : 'status'}
          className={`m-0 rounded-md p-3 text-sm ${
            props.notice.tone === 'error'
              ? 'bg-status-danger-bg text-status-danger-ink'
              : 'bg-status-ok-bg text-status-ok-ink'
          }`}
        >
          {props.notice.text}
        </p>
      ) : null}

      <form
        className="grid gap-3 rounded-lg border border-border bg-card p-4 text-card-foreground md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          props.onSaveProfile({ firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), phone: phone.trim() });
        }}
      >
        <h2 className="m-0 text-base font-semibold md:col-span-2">Profile</h2>
        <label className="flex flex-col gap-1 text-sm">
          First name
          <input className={FIELD} value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Last name
          <input className={FIELD} value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Email
          <input className={FIELD} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Phone
          <input className={FIELD} value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>
        <div className="md:col-span-2">
          <Button type="submit" disabled={props.saving}>
            {props.saving ? 'Saving…' : 'Save profile'}
          </Button>
        </div>
      </form>

      <section className="grid gap-3 rounded-lg border border-border bg-card p-4 text-card-foreground">
        <h2 className="m-0 text-base font-semibold">Role</h2>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex min-w-48 flex-col gap-1 text-sm">
            Role
            <select className={FIELD} value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="">No role</option>
              {roleOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <Button
            type="button"
            disabled={props.saving || role === '' || role === user.role}
            onClick={() => props.onChangeRole(role)}
          >
            Change role
          </Button>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-4 text-card-foreground">
        <h2 className="m-0 text-base font-semibold">Activity</h2>
        <dl className="m-0 mt-2 grid gap-1 text-sm md:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Member since</dt>
            <dd className="m-0">{formatStamp(user.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Record last changed</dt>
            <dd className="m-0">{formatStamp(user.updatedAt)}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border border-border bg-card p-4 text-card-foreground">
        <h2 className="m-0 text-base font-semibold">Remove member</h2>
        <p className="m-0 mt-1 text-sm text-muted-foreground">
          Removing a member ends their access to the organization.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {confirmRemove ? (
            <>
              <span className="text-sm">Remove {fullName === '' ? user.email : fullName}?</span>
              <Button type="button" variant="destructive" disabled={props.saving} onClick={props.onRemove}>
                Yes, remove
              </Button>
              <Button type="button" variant="outline" onClick={() => setConfirmRemove(false)}>
                Cancel
              </Button>
            </>
          ) : (
            <Button type="button" variant="outline" onClick={() => setConfirmRemove(true)}>
              Remove member
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}
