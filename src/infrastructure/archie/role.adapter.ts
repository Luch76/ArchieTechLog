// Role adapter: reads the platform `roles` table. Role writes (create, rename, delete) are
// platform-managed and stay unsupported from the app.

import type { IGraphQLModule } from '@archie/js-sdk';
import type { Page, RepoResult } from '../../domain/shared';
import type { Role } from '../../domain/entities/role';
import type { RoleRepository } from '../../domain/ports/role.repository';
import { fromGraphQL, missingData, repoError } from './transport';

interface RoleRow {
  id: string;
  name: string | null;
  description: string | null;
  isActive: boolean | null;
  createdAt: string | null;
  updatedAt: string | null;
}

interface RoleListData {
  roles: { items: RoleRow[]; count: number } | null;
}

const ROLE_LIST = `query App_Role_List($first: Int, $skip: Int) {
  roles(first: $first, skip: $skip, orderBy: { name: ASC }) {
    count
    items { id name description isActive createdAt updatedAt }
  }
}`;

const ROLE_BY_ID = `query App_Role_ById($id: String) {
  rolesById(id: $id) { id name description isActive createdAt updatedAt }
}`;

interface RoleByIdData {
  rolesById: RoleRow | null;
}

function toRole(row: RoleRow): Role {
  return {
    id: row.id,
    name: row.name ?? '',
    description: row.description ?? '',
    isActive: row.isActive ?? true,
    createdAt: row.createdAt ?? '',
    updatedAt: row.updatedAt ?? '',
  };
}

function unsupported<T>(op: string): RepoResult<T> {
  return {
    ok: false,
    error: repoError('unsupported', `Role.${op}: roles are managed by the platform, not from the app.`),
  };
}

export class ArchieRoleRepository implements RoleRepository {
  constructor(private readonly gql?: IGraphQLModule) {}

  async list(q?: { first?: number; skip?: number }): Promise<RepoResult<Page<Role>>> {
    if (this.gql === undefined) return { ok: true, data: { items: [], total: 0, hasMore: false } };
    const first = q?.first ?? 100;
    const skip = q?.skip ?? 0;
    const res = await this.gql.query<RoleListData>(ROLE_LIST, { first, skip });
    if (res.error !== null) return { ok: false, error: fromGraphQL(res.error) };
    if (res.data === null || res.data.roles === null) return missingData('Role', 'list');
    const items = res.data.roles.items.map(toRole);
    const total = res.data.roles.count;
    return { ok: true, data: { items, total, hasMore: skip + items.length < total } };
  }

  async listAll(): Promise<RepoResult<Page<Role>>> {
    return this.list({ first: 500, skip: 0 });
  }

  async byId(id: string): Promise<RepoResult<Role | null>> {
    if (this.gql === undefined) return { ok: true, data: null };
    const res = await this.gql.query<RoleByIdData>(ROLE_BY_ID, { id });
    if (res.error !== null) return { ok: false, error: fromGraphQL(res.error) };
    if (res.data === null) return missingData('Role', 'byId');
    return { ok: true, data: res.data.rolesById === null ? null : toRole(res.data.rolesById) };
  }

  async create(): Promise<RepoResult<Role>> {
    return unsupported('create');
  }

  async update(): Promise<RepoResult<Role>> {
    return unsupported('update');
  }

  async delete(): Promise<RepoResult<void>> {
    return unsupported('delete');
  }
}
