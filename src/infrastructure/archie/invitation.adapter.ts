// Invitation adapter: reads and writes the `invitation` table. The role arrives as a role
// NAME (what the screen shows); the adapter resolves it to the role record on create.

import type { IGraphQLModule } from '@archie/js-sdk';
import type { Page, RepoResult } from '../../domain/shared';
import type { Invitation } from '../../domain/entities/invitation';
import type {
  InvitationRepository,
  NewInvitation,
  UpdateInvitation,
} from '../../domain/ports/invitation.repository';
import { fromGraphQL, missingData, repoError } from './transport';

interface InvitationRow {
  id: string;
  email: string | null;
  status: string | null;
  sentAt: string | null;
  expiresAt: string | null;
  role: { name: string | null } | null;
  invitedBy: { email: string | null } | null;
}

const FIELDS = `id email status sentAt expiresAt role { name } invitedBy { email }`;

const INVITATION_LIST = `query App_Invitation_List($first: Int, $skip: Int) {
  invitation(first: $first, skip: $skip, orderBy: { createdAt: DESC }) {
    count
    items { ${FIELDS} }
  }
}`;

const INVITATION_BY_ID = `query App_Invitation_ById($id: String) {
  invitationById(id: $id) { ${FIELDS} }
}`;

const INVITATION_CREATE = `mutation App_Invitation_Create($input: InvitationCreateInput!) {
  createInvitation(input: $input) { ${FIELDS} }
}`;

const INVITATION_UPDATE = `mutation App_Invitation_Update($id: String, $input: InvitationUpdateInput!) {
  updateInvitation(id: $id, input: $input) { ${FIELDS} }
}`;

const INVITATION_DELETE = `mutation App_Invitation_Delete($id: String) {
  deleteInvitation(id: $id)
}`;

const ROLE_BY_NAME = `query App_Role_ByName($name: String) {
  roles(filter: { name: { equals: $name } }, first: 1) { items { id } }
}`;

interface InvitationListData {
  invitation: { items: InvitationRow[]; count: number } | null;
}
interface InvitationByIdData {
  invitationById: InvitationRow | null;
}
interface InvitationCreateData {
  createInvitation: InvitationRow | null;
}
interface InvitationUpdateData {
  updateInvitation: InvitationRow | null;
}
interface InvitationDeleteData {
  deleteInvitation: boolean | null;
}
interface RoleByNameData {
  roles: { items: { id: string }[] } | null;
}

function toInvitation(row: InvitationRow): Invitation {
  return {
    id: row.id,
    ...(row.email ? { email: row.email } : {}),
    ...(row.role?.name ? { role: row.role.name } : {}),
    ...(row.status ? { status: row.status } : {}),
    ...(row.sentAt ? { sentAt: row.sentAt } : {}),
    ...(row.expiresAt ? { expiresAt: row.expiresAt } : {}),
    ...(row.invitedBy?.email ? { invitedBy: row.invitedBy.email } : {}),
  };
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export class ArchieInvitationRepository implements InvitationRepository {
  constructor(private readonly gql?: IGraphQLModule) {}

  private async roleId(name: string): Promise<RepoResult<string | null>> {
    if (this.gql === undefined) return { ok: true, data: null };
    const res = await this.gql.query<RoleByNameData>(ROLE_BY_NAME, { name });
    if (res.error !== null) return { ok: false, error: fromGraphQL(res.error) };
    const found = res.data?.roles?.items[0];
    return { ok: true, data: found === undefined ? null : found.id };
  }

  async list(q?: { first?: number; skip?: number }): Promise<RepoResult<Page<Invitation>>> {
    if (this.gql === undefined) return { ok: true, data: { items: [], total: 0, hasMore: false } };
    const first = q?.first ?? 100;
    const skip = q?.skip ?? 0;
    const res = await this.gql.query<InvitationListData>(INVITATION_LIST, { first, skip });
    if (res.error !== null) return { ok: false, error: fromGraphQL(res.error) };
    if (res.data === null || res.data.invitation === null) return missingData('Invitation', 'list');
    const items = res.data.invitation.items.map(toInvitation);
    const total = res.data.invitation.count;
    return { ok: true, data: { items, total, hasMore: skip + items.length < total } };
  }

  async listAll(): Promise<RepoResult<Page<Invitation>>> {
    return this.list({ first: 500, skip: 0 });
  }

  async byId(id: string): Promise<RepoResult<Invitation | null>> {
    if (this.gql === undefined) return { ok: true, data: null };
    const res = await this.gql.query<InvitationByIdData>(INVITATION_BY_ID, { id });
    if (res.error !== null) return { ok: false, error: fromGraphQL(res.error) };
    if (res.data === null) return missingData('Invitation', 'byId');
    return {
      ok: true,
      data: res.data.invitationById === null ? null : toInvitation(res.data.invitationById),
    };
  }

  async create(input: NewInvitation): Promise<RepoResult<Invitation>> {
    if (this.gql === undefined) {
      return { ok: false, error: repoError('unsupported', 'Invitation.create: no backend client.') };
    }
    const now = new Date();
    const body: Record<string, unknown> = {
      email: input.email,
      status: input.status ?? 'PENDING',
      sentAt: input.sentAt ?? now.toISOString(),
      expiresAt: input.expiresAt ?? new Date(now.getTime() + SEVEN_DAYS_MS).toISOString(),
    };
    if (input.role !== undefined && input.role !== '') {
      const role = await this.roleId(input.role);
      if (role.ok === false) return role;
      if (role.data !== null) body.role = { connect: { id: role.data } };
    }
    const res = await this.gql.mutate<InvitationCreateData>(INVITATION_CREATE, { input: body });
    if (res.error !== null) return { ok: false, error: fromGraphQL(res.error) };
    if (res.data === null || res.data.createInvitation === null) return missingData('Invitation', 'create');
    return { ok: true, data: toInvitation(res.data.createInvitation) };
  }

  async update(id: string, patch: UpdateInvitation): Promise<RepoResult<Invitation>> {
    if (this.gql === undefined) {
      return { ok: false, error: repoError('unsupported', 'Invitation.update: no backend client.') };
    }
    const body: Record<string, unknown> = {};
    if (patch.email !== undefined) body.email = patch.email;
    if (patch.status !== undefined) body.status = patch.status;
    if (patch.sentAt !== undefined) body.sentAt = patch.sentAt;
    if (patch.expiresAt !== undefined) body.expiresAt = patch.expiresAt;
    if (patch.role !== undefined && patch.role !== '') {
      const role = await this.roleId(patch.role);
      if (role.ok === false) return role;
      if (role.data !== null) body.roleId = role.data;
    }
    const res = await this.gql.mutate<InvitationUpdateData>(INVITATION_UPDATE, { id, input: body });
    if (res.error !== null) return { ok: false, error: fromGraphQL(res.error) };
    if (res.data === null || res.data.updateInvitation === null) return missingData('Invitation', 'update');
    return { ok: true, data: toInvitation(res.data.updateInvitation) };
  }

  async delete(id: string): Promise<RepoResult<void>> {
    if (this.gql === undefined) {
      return { ok: false, error: repoError('unsupported', 'Invitation.delete: no backend client.') };
    }
    const res = await this.gql.mutate<InvitationDeleteData>(INVITATION_DELETE, { id });
    if (res.error !== null) return { ok: false, error: fromGraphQL(res.error) };
    if (res.data === null) return missingData('Invitation', 'delete');
    return { ok: true, data: undefined };
  }
}
