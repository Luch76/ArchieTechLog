// View model of the `organizations` screen: what the container hands the view.

import type {
  Organization,
  OrganizationStatus,
} from '../../domain/entities/organization';

export type OrganizationsScreenViewModel = {
  readonly organizations: readonly Organization[];
  readonly busyId: string | null;
  readonly creating: boolean;
  readonly actionError: string | null;
  readonly onCreate: (input: {
    readonly name: string;
    readonly adminEmail: string;
    readonly operatorType: string;
    readonly status: OrganizationStatus;
  }) => void;
  readonly onChangeStatus: (id: string, status: OrganizationStatus) => void;
};
