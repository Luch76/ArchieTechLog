import * as React from 'react';
import { useSearchParams } from 'react-router';
import { useAppNavigate } from '@/presentation/navigation';
import type { RepoError } from '../../domain/shared';
import type { User } from '../../domain/entities/user';
import type { UserDetailScreenViewModel } from '../../application/view-models/user-detail.vm';
import { useRepositories } from '../app-context';
import { UserDetailView } from '../views/user-detail.view';
import { ScreenError, ScreenLoading } from '../screen-state';

export default function UserDetailScreenRoute(): React.ReactElement {
  const repositories = useRepositories();
  const navigate = useAppNavigate();
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('id');

  const [user, setUser] = React.useState<User | null>(null);
  const [roleNames, setRoleNames] = React.useState<readonly string[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<RepoError | null>(null);
  const [reloadToken, setReloadToken] = React.useState(0);
  const [saving, setSaving] = React.useState(false);
  const [notice, setNotice] = React.useState<UserDetailScreenViewModel['notice']>(null);
  const hasLoadedRef = React.useRef(false);

  const reload = React.useCallback((): void => {
    setReloadToken((n) => n + 1);
  }, []);

  React.useEffect(() => {
    let live = true;
    if (userId === null) {
      setUser(null);
      setLoading(false);
      return;
    }
    if (!hasLoadedRef.current) setLoading(true);
    setLoadError(null);
    void Promise.all([repositories.user.byId(userId), repositories.role.listAll()])
      .then(([userResult, rolesResult]) => {
        if (!live) return;
        if (userResult.ok === false) {
          setLoadError(userResult.error);
          setLoading(false);
          return;
        }
        setUser(userResult.data);
        if (rolesResult !== null && rolesResult.ok === true) {
          setRoleNames(rolesResult.data.items.map((r) => r.name));
        }
        hasLoadedRef.current = true;
        setLoading(false);
      })
      .catch((cause: unknown) => {
        console.error('[archie] user-detail load failed:', cause);
        if (!live) return;
        setLoadError({
          kind: 'transport',
          message: 'The query failed in a way the transport could not normalize.',
          detail: 'rejected promise outside the RepoResult contract',
        });
        setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [repositories, reloadToken, userId]);

  const goBack = (): void => {
    navigate('/users');
  };

  const vm: UserDetailScreenViewModel = {
    user,
    roleNames,
    saving,
    notice,
    onSaveProfile: (patch) => {
      if (userId === null) return;
      setSaving(true);
      setNotice(null);
      void repositories.user
        .update(userId, {
          firstName: patch.firstName,
          lastName: patch.lastName,
          email: patch.email,
          phone: patch.phone,
        })
        .then((result) => {
          setSaving(false);
          if (result.ok === false) {
            setNotice({ tone: 'error', text: 'The profile could not be saved. Try again.' });
            return;
          }
          setNotice({ tone: 'ok', text: 'Profile saved.' });
          reload();
        });
    },
    onChangeRole: (role) => {
      if (userId === null) return;
      setSaving(true);
      setNotice(null);
      void repositories.user.update(userId, { role }).then((result) => {
        setSaving(false);
        if (result.ok === false) {
          setNotice({ tone: 'error', text: 'The role could not be changed. Try again.' });
          return;
        }
        setNotice({ tone: 'ok', text: 'Role changed.' });
        reload();
      });
    },
    onRemove: () => {
      if (userId === null) return;
      setSaving(true);
      setNotice(null);
      void repositories.user.delete(userId).then((result) => {
        setSaving(false);
        if (result.ok === false) {
          setNotice({ tone: 'error', text: 'The member could not be removed. Try again.' });
          return;
        }
        goBack();
      });
    },
    onBack: goBack,
  };

  return (
    <>
      {loading ? (
        <ScreenLoading data-vid="r4mflbk" />
      ) : loadError !== null ? (
        <ScreenError data-vid="1ox10jn" error={loadError} onRetry={reload} />
      ) : (
        <UserDetailView data-vid="yitipa1" key={user?.id ?? 'none'} {...vm} />
      )}
    </>
  );
}
