// View model of the `user-detail` screen (one team member).

import type { User } from '../../domain/entities/user';

export type UserDetailScreenViewModel = {
  readonly user: User | null;
  readonly roleNames: readonly string[];
  readonly saving: boolean;
  readonly notice: { readonly tone: 'ok' | 'error'; readonly text: string } | null;
  readonly onSaveProfile: (patch: {
    readonly firstName: string;
    readonly lastName: string;
    readonly email: string;
    readonly phone: string;
  }) => void;
  readonly onChangeRole: (role: string) => void;
  readonly onRemove: () => void;
  readonly onBack: () => void;
};
