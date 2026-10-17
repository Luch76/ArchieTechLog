import * as React from 'react';
import type { RepoError } from '../../domain/shared';
import type { Organization, OrganizationStatus } from '../../domain/entities/organization';
import type { OrganizationsScreenViewModel } from '../../application/view-models/organizations.vm';
import { useRepositories } from '../app-context';
import { OrganizationsView } from '../views/organizations.view';
import { ScreenError, ScreenLoading } from '../screen-state';

export default function OrganizationsScreenRoute(): React.ReactElement {
  const repositories = useRepositories();
  const [organizations, setOrganizations] = React.useState<readonly Organization[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<RepoError | null>(null);
  const [reloadToken, setReloadToken] = React.useState(0);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const hasLoadedRef = React.useRef(false);

  const reload = React.useCallback((): void => {
    setReloadToken((n) => n + 1);
  }, []);

  React.useEffect(() => {
    let live = true;
    if (!hasLoadedRef.current) setLoading(true);
    setLoadError(null);
    void repositories.organization
      .listAll({ sort: { field: 'createdAt', dir: 'DESC' } })
      .then((result) => {
        if (!live) return;
        if (result.ok === false) {
          setLoadError(result.error);
        } else {
          setOrganizations(result.data.items);
          hasLoadedRef.current = true;
        }
        setLoading(false);
      })
      .catch((cause: unknown) => {
        console.error('[archie] organizations load failed:', cause);
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
  }, [repositories, reloadToken]);

  const vm: OrganizationsScreenViewModel = {
    organizations,
    busyId,
    creating,
    actionError,
    onCreate: (input) => {
      setCreating(true);
      setActionError(null);
      void repositories.organization.create(input).then((result) => {
        setCreating(false);
        if (result.ok === false) {
          setActionError('The organization could not be created. Try again.');
          return;
        }
        reload();
      });
    },
    onChangeStatus: (id: string, status: OrganizationStatus) => {
      setBusyId(id);
      setActionError(null);
      void repositories.organization.update(id, { status }).then((result) => {
        setBusyId(null);
        if (result.ok === false) {
          setActionError('The status could not be changed. Try again.');
          return;
        }
        reload();
      });
    },
  };

  return (
    <>
      {loading ? (
        <ScreenLoading />
      ) : loadError !== null ? (
        <ScreenError error={loadError} onRetry={reload} />
      ) : (
        <OrganizationsView {...vm} />
      )}
    </>
  );
}
