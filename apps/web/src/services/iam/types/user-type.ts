import type { MenuItem } from '@cloudforet/mirinae/src/inputs/context-menu/type';

import type { RoleType } from '@/schema/identity/role/type';
import type { UserModel } from '@/schema/identity/user/model';
import type { AuthType } from '@/schema/identity/user/type';
import type { WorkspaceUserModel } from '@/schema/identity/workspace-user/model';

import type { LOCAL_TYPE } from '@/services/iam/constants/user-constant';

export type LocalType = typeof LOCAL_TYPE[keyof typeof LOCAL_TYPE];
interface RoleBindingState {
    type: RoleType;
    name: string;
}

export type UserListItemType = Partial<WorkspaceUserModel> & Partial<UserModel> & {
    role_binding?: RoleBindingState
};

export interface ModalSettingState {
    type: string;
    title: string;
    themeColor: string;
    formVisible?: boolean;
    statusVisible?: boolean;
    addVisible?: boolean;
}

export interface AddModalMenuItem extends MenuItem {
    label?: string;
    name?: string;
    user_id?: string;
    role_type?: RoleType;
    auth_type?: AuthType|LocalType;
    isNew?: boolean;
    workspace_id?: string;
}

