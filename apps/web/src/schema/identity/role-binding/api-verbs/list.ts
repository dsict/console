import type { Query } from '@cloudforet/core-lib/space-connector/type';

import type { ListResponse } from '@/schema/_common/api-verbs/list';
import type { RoleBindingModel } from '@/schema/identity/role-binding/model';
import type { RoleType } from '@/schema/identity/role/type';

export interface RoleBindingListParameters {
    query?: Query;
    role_binding_id?: string;
    user_id?: string;
    role_id?: string;
    role_type?: RoleType;
    workspace_id?: string;
    // TODO: will be removed after the backend is ready
    domain_id: string;
}

export type RoleBindingListResponse = ListResponse<RoleBindingModel>;
