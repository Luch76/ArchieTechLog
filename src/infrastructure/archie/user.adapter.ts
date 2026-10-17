// User adapter: reads the platform `users` table (with each person's role). Accounts are
// created through invitations, never by inserting a row, so writes other than profile
// updates stay unsupported.

import type { IGraphQLModule } from '@archie/js-sdk';
import type { Page, RepoResult } from '../../domain/shared';
import type { User } from '../../domain/entities/user';
import type { UserRepository } from '../../domain/ports/user.repository';
import { fromGraphQL, missingData, repoError } from './transport';

interface UserRow {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  userRolesList?: { items?: { role: { name: string | null } | null }[] } | null;
}

interface UserListData {
  users: { items: UserRow[]; count: number } | null;
}

interface UserByIdData {
  usersById: UserRow | null;
}

const FIELDS = `id firstName lastName email phone createdAt updatedAt
    userRolesList { items { role { name } } }`;

const USER_LIST = `query App_User_List($first: Int, $skip: Int) {
  users(first: $first, skip: $skip, orderBy: { createdAt: DESC }) {
    count
    items { ${FIELDS} }
  }
}`;

const USER_LIST_PLAIN = `query App_User_ListPlain($first: Int, $skip: Int) {
  users(first: $first, skip: $skip, orderBy: { createdAt: DESC }) {
    count
    items { id firstName lastName email phone createdAt updatedAt }
  }
}`;

const USER_BY_ID = `query App_User_ById($id: String) {
  usersById(id: $id) { ${FIELDS} }
}`;

const USER_UPDATE = `mutation App_User_Update($id: String, $input: UsersUpdateInput!) {
  updateUsers(id: $id, input: $input) { ${FIELDS} }
}`;

interface UserUpdateData {
  updateUsers: UserRow | null;
}

function toUser(row: UserRow): User {
  const roleNames = (row.userRolesList?.items ?? [])
    .map((entry) => entry.role?.name ?? '')
    .filter((name, idx, all) => name !== '' && all.indexOf(name) === idx);
  const roleName = roleNames.length > 0 ? roleNames.join(', ') : undefined;
  return {
    id: row.id,
    firstName: row.firstName ?? '',
    ...(row.lastName ? { lastName: row.lastName } : {}),
    email: row.email ?? '',
    ...(row.phone ? { phone: row.phone } : {}),
    createdAt: row.createdAt ?? '',
    updatedAt: row.updatedAt ?? '',
    ...(roleName ? { role: roleName } : {}),
  };
}

function unsupported<T>(op: string): RepoResult<T> {
  return {
    ok: false,
    error: repoError(
      'unsupported',
      `User.${op}: accounts are created by invitation and removed by an administrator, not from this call.`,
    ),
  };
}

export class ArchieUserRepository implements UserRepository {
  constructor(private readonly gql?: IGraphQLModule) {}

  async list(q?: { first?: number; skip?: number }): Promise<RepoResult<Page<User>>> {
    if (this.gql === undefined) return { ok: true, data: { items: [], total: 0, hasMore: false } };
    const first = q?.first ?? 100;
    const skip = q?.skip ?? 0;
    let res = await this.gql.query<UserListData>(USER_LIST, { first, skip });
    if (res.error !== null) {
      console.error('[users] list with roles failed, retrying without roles', res.error);
      // The role link is a nice-to-have: if it is refused, still show the people.
      res = await this.gql.query<UserListData>(USER_LIST_PLAIN, { first, skip });
    }
    if (res.error !== null) {
      console.error('[users] list failed', res.error);
      return { ok: false, error: fromGraphQL(res.error) };
    }
    if (res.data === null || res.data.users === null) return missingData('User', 'list');
    const items = res.data.users.items.map(toUser);
    const total = res.data.users.count;
    return { ok: true, data: { items, total, hasMore: skip + items.length < total } };
  }

  async listAll(): Promise<RepoResult<Page<User>>> {
    return this.list({ first: 500, skip: 0 });
  }

  async byId(id: string): Promise<RepoResult<User | null>> {
    if (this.gql === undefined) return { ok: true, data: null };
    const res = await this.gql.query<UserByIdData>(USER_BY_ID, { id });
    if (res.error !== null) return { ok: false, error: fromGraphQL(res.error) };
    if (res.data === null) return missingData('User', 'byId');
    return { ok: true, data: res.data.usersById === null ? null : toUser(res.data.usersById) };
  }

  async create(): Promise<RepoResult<User>> {
    return unsupported('create');
  }

  async update(
    id: string,
    patch: { firstName?: string; lastName?: string; email?: string; phone?: string },
  ): Promise<RepoResult<User>> {
    if (this.gql === undefined) return unsupported('update');
    const input: Record<string, string> = {};
    if (patch.firstName !== undefined) input.firstName = patch.firstName;
    if (patch.lastName !== undefined) input.lastName = patch.lastName;
    if (patch.email !== undefined) input.email = patch.email;
    if (patch.phone !== undefined) input.phone = patch.phone;
    if (Object.keys(input).length === 0) {
      const current = await this.byId(id);
      if (current.ok === false) return current;
      return current.data === null ? unsupported('update') : { ok: true, data: current.data };
    }
    const res = await this.gql.mutate<UserUpdateData>(USER_UPDATE, { id, input });
    if (res.error !== null) return { ok: false, error: fromGraphQL(res.error) };
    if (res.data === null || res.data.updateUsers === null) return missingData('User', 'update');
    return { ok: true, data: toUser(res.data.updateUsers) };
  }

  async delete(): Promise<RepoResult<void>> {
    return unsupported('delete');
  }
}
