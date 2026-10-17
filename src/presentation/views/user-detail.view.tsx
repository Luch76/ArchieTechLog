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
      <div data-vid="9h34vqh" className="flex w-full flex-1 flex-col gap-3 bg-background p-6 text-foreground" data-agent-id="screen:user-detail-not-found">
        <h1 data-vid="rbgw5oj" className="m-0 text-2xl font-semibold">Member not found</h1>
        <p data-vid="huapcjf" className="m-0 text-sm text-muted-foreground">
          This member does not exist or was removed. Open a member from the Users list.
        </p>
        <div data-vid="abvwjum">
          <Button data-vid="az7tp0u" type="button" variant="outline" onClick={props.onBack}>
            Back to users
          </Button>
        </div>
      </div>
    );
  }

  const fullName = `${user.firstName} ${user.lastName ?? ''}`.trim();
  const roleOptions = props.roleNames.includes(role) || role === '' ? props.roleNames : [...props.roleNames, role];

  return (
    <div data-vid="uvyqmti" className="flex w-full flex-1 flex-col gap-4 bg-background p-4 text-foreground md:p-6" data-agent-id="screen:user-detail">
      <header data-vid="xucdcxn" className="flex flex-wrap items-start justify-between gap-3">
        <div data-vid="6h3bam7" className="min-w-0">
          <h1 data-vid="4a23vxo" className="m-0 text-2xl font-semibold">{fullName === '' ? user.email : fullName}</h1>
          <p data-vid="zvrpi6p" className="m-0 mt-1 text-sm text-muted-foreground">
            {user.email}
            {user.role !== undefined ? ` · ${user.role}` : ''}
          </p>
        </div>
        <Button data-vid="bk0pp6d" type="button" variant="outline" onClick={props.onBack}>
          Back to users
        </Button>
      </header>

      {props.notice !== null ? (
        <p data-vid="4s1nare"
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

      <form data-vid="qetbaw7"
        className="grid gap-3 rounded-lg border border-border bg-card p-4 text-card-foreground md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          props.onSaveProfile({ firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), phone: phone.trim() });
        }}
      >
        <h2 data-vid="hr6feab" className="m-0 text-base font-semibold md:col-span-2">Profile</h2>
        <label data-vid="a4tfwg3" className="flex flex-col gap-1 text-sm">
          First name
          <input data-vid="155fgri" className={FIELD} value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        </label>
        <label data-vid="3122b64" className="flex flex-col gap-1 text-sm">
          Last name
          <input data-vid="kc6i5vm" className={FIELD} value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </label>
        <label data-vid="mf4skyf" className="flex flex-col gap-1 text-sm">
          Email
          <input data-vid="7d4h8yz" className={FIELD} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label data-vid="fh8onlw" className="flex flex-col gap-1 text-sm">
          Phone
          <input data-vid="iyjbm3g" className={FIELD} value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>
        <div data-vid="5r40cyu" className="md:col-span-2">
          <Button data-vid="o9mgkw4" type="submit" disabled={props.saving}>
            {props.saving ? 'Saving…' : 'Save profile'}
          </Button>
        </div>
      </form>

      <section data-vid="gato2dl" className="grid gap-3 rounded-lg border border-border bg-card p-4 text-card-foreground">
        <h2 data-vid="4kvbi4d" className="m-0 text-base font-semibold">Role</h2>
        <div data-vid="9c9wjhy" className="flex flex-wrap items-end gap-3">
          <label data-vid="b1k3tot" className="flex min-w-48 flex-col gap-1 text-sm">
            Role
            <select data-vid="943mrxk" className={FIELD} value={role} onChange={(e) => setRole(e.target.value)}>
              <option data-vid="l3mu27c" value="">No role</option>
              {roleOptions.map((name) => (
                <option data-vid="5xgkkls" key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <Button data-vid="ngrkht1"
            type="button"
            disabled={props.saving || role === '' || role === user.role}
            onClick={() => props.onChangeRole(role)}
          >
            Change role
          </Button>
        </div>
      </section>

      <section data-vid="1vlbgia" className="rounded-lg border border-border bg-card p-4 text-card-foreground">
        <h2 data-vid="jfcb1z8" className="m-0 text-base font-semibold">Activity</h2>
        <dl data-vid="9cr71f2" className="m-0 mt-2 grid gap-1 text-sm md:grid-cols-2">
          <div data-vid="c9ujlxg">
            <dt data-vid="fmv9gpd" className="text-muted-foreground">Member since</dt>
            <dd data-vid="0bldok5" className="m-0">{formatStamp(user.createdAt)}</dd>
          </div>
          <div data-vid="6lshp7h">
            <dt data-vid="u5nb5tp" className="text-muted-foreground">Record last changed</dt>
            <dd data-vid="s4uhdx3" className="m-0">{formatStamp(user.updatedAt)}</dd>
          </div>
        </dl>
      </section>

      <section data-vid="kw0bwhj" className="rounded-lg border border-border bg-card p-4 text-card-foreground">
        <h2 data-vid="bq1k78a" className="m-0 text-base font-semibold">Remove member</h2>
        <p data-vid="ydzuaxj" className="m-0 mt-1 text-sm text-muted-foreground">
          Removing a member ends their access to the organization.
        </p>
        <div data-vid="5x6jbcf" className="mt-3 flex flex-wrap items-center gap-2">
          {confirmRemove ? (
            <>
              <span data-vid="a54obow" className="text-sm">Remove {fullName === '' ? user.email : fullName}?</span>
              <Button data-vid="rmr1twx" type="button" variant="destructive" disabled={props.saving} onClick={props.onRemove}>
                Yes, remove
              </Button>
              <Button data-vid="5kv06h9" type="button" variant="outline" onClick={() => setConfirmRemove(false)}>
                Cancel
              </Button>
            </>
          ) : (
            <Button data-vid="unap3wr" type="button" variant="outline" onClick={() => setConfirmRemove(true)}>
              Remove member
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}
