<script setup lang="ts">
import {
    computed, reactive,
} from 'vue';

import { cloneDeep } from 'lodash';

import {
    PButton,
    PDefinitionTable, PHeading, PI, PStatus,
} from '@cloudforet/mirinae';
import type { DefinitionField } from '@cloudforet/mirinae/src/data-display/tables/definition-table/type';
import { iso8601Formatter } from '@cloudforet/utils';

import { store } from '@/store';
import { i18n } from '@/translations';

import config from '@/lib/config';
import { postUserValidationEmail } from '@/lib/helper/verify-email-helper';

import ErrorHandler from '@/common/composables/error/errorHandler';

import {
    calculateTime,
    useRoleFormatter,
    userStateFormatter,
} from '@/services/iam/composables/refined-table-data';
import { USER_MODAL_TYPE } from '@/services/iam/constants/user-constant';
import { useUserPageStore } from '@/services/iam/store/user-page-store';
import type { ModalSettingState } from '@/services/iam/types/user-type';

const userPageStore = useUserPageStore();
const userPageState = userPageStore.$state;

const emit = defineEmits<{(e: 'refresh', id: string): void }>();

const storeState = reactive({
    userInfo: computed(() => store.state.user),
    smtpEnabled: computed(() => config.get('SMTP_ENABLED')),
});
const state = reactive({
    loading: false,
    verifyEmailLoading: false,
    selectedUser: computed(() => userPageStore.selectedUsers[0]),
});
const tableState = reactive({
    refinedUserItems: computed(() => ({
        ...state.selectedUser,
        last_accessed_at: calculateTime(state.selectedUser.last_accessed_at, state.selectedUser.timezone),
    })),
    fields: computed<DefinitionField[]>(() => {
        const additionalFields: DefinitionField[] = [];
        const additionalRoleFields: DefinitionField[] = [];
        if (userPageStore.isAdminMode) {
            if (storeState.smtpEnabled) {
                additionalFields.push(
                    { name: 'email', label: i18n.t('IAM.USER.MAIN.NOTIFICATION_EMAIL'), block: true },
                );
            }
            additionalFields.push(
                { name: 'mfa', label: i18n.t('IAM.USER.MAIN.MFA'), disableCopy: true },
            );
            if (state.selectedUser?.role_id) {
                additionalRoleFields.push(
                    { name: 'role_id', label: i18n.t('IAM.USER.MAIN.ROLE_NAME') },
                );
            }
        } else {
            additionalRoleFields.push({
                name: 'role_binding',
                label: i18n.t('IAM.USER.MAIN.ROLE'),
            });
        }

        return [
            { name: 'user_id', label: i18n.t('IAM.USER.MAIN.USER_ID') },
            { name: 'name', label: i18n.t('IAM.USER.MAIN.NAME') },
            { name: 'state', label: i18n.t('IAM.USER.MAIN.STATE'), disableCopy: true },
            ...additionalFields,
            { name: 'last_accessed_at', label: i18n.t('IAM.USER.MAIN.LAST_ACTIVITY'), disableCopy: true },
            { name: 'domain_id', label: i18n.t('IAM.USER.MAIN.DOMAIN_ID') },
            { name: 'role_type', label: i18n.t('IAM.USER.MAIN.ROLE_TYPE') },
            ...additionalRoleFields,
            { name: 'language', label: i18n.t('IAM.USER.MAIN.LANGUAGE'), disableCopy: true },
            { name: 'timezone', label: i18n.t('IAM.USER.MAIN.TIMEZONE'), disableCopy: true },
            { name: 'created_at', label: i18n.t('IAM.USER.MAIN.CREATED_AT') },
        ];
    }),
});

/* Component */
const handleClickButton = (type: string) => {
    switch (type) {
    case USER_MODAL_TYPE.DISABLE: updateModalSettings({
        type,
        title: i18n.t('IAM.USER.MAIN.MODAL.DISABLE_TITLE') as string,
        themeColor: 'alert',
        statusVisible: true,
    }); break;
    case USER_MODAL_TYPE.ENABLE: updateModalSettings({
        type,
        title: i18n.t('IAM.USER.MAIN.MODAL.ENABLE_TITLE') as string,
        themeColor: 'primary',
        statusVisible: true,
    }); break;
    case USER_MODAL_TYPE.REMOVE: updateModalSettings({
        type,
        title: i18n.t('IAM.USER.MAIN.MODAL.REMOVE_TITLE') as string,
        themeColor: 'alert',
        statusVisible: true,
    }); break;
    case USER_MODAL_TYPE.DELETE: updateModalSettings({
        type,
        title: i18n.t('IAM.USER.MAIN.MODAL.DELETE_TITLE') as string,
        themeColor: 'alert',
        statusVisible: true,
    }); break;
    case USER_MODAL_TYPE.UPDATE: updateModalSettings({
        type,
        title: i18n.t('IAM.USER.MAIN.MODAL.UPDATE_TITLE') as string,
        themeColor: 'primary',
        formVisible: true,
    }); break;
    default: break;
    }
};
const updateModalSettings = ({
    type, title, themeColor, statusVisible, addVisible, formVisible,
}: ModalSettingState) => {
    userPageStore.$patch((_state) => {
        _state.modal.type = type;
        _state.modal.title = title;
        _state.modal.themeColor = themeColor;
        _state.modal.visible.status = statusVisible ?? false;
        _state.modal.visible.add = addVisible ?? false;
        _state.modal.visible.form = formVisible ?? false;
        _state.modal = cloneDeep(_state.modal);
    });
};

/* API */
const handleClickVerifyButton = async () => {
    state.verifyEmailLoading = true;
    try {
        if (tableState.refinedUserItems.email_verified) return;
        await postUserValidationEmail({
            user_id: tableState.refinedUserItems.user_id || '',
            email: tableState.refinedUserItems.email || '',
        });
        await emit('refresh', tableState.refinedUserItems.user_id || '');
        await store.dispatch('user/setUser', { email: tableState.refinedUserItems.email });
    } catch (e: any) {
        ErrorHandler.handleError(e);
    } finally {
        state.verifyEmailLoading = false;
    }
};
</script>

<template>
    <div class="user-management-tab-detail">
        <p-heading heading-type="sub"
                   :title="$t('IAM.USER.MAIN.BASE_INFORMATION')"
        >
            <template #extra>
                <div class="toolbox-wrapper">
                    <div v-if="userPageState.isAdminMode"
                         class="toolbox"
                    >
                        <p-button v-if="tableState.refinedUserItems.state === 'ENABLED'"
                                  style-type="tertiary"
                                  @click="handleClickButton(USER_MODAL_TYPE.DISABLE)"
                        >
                            {{ $t('IAM.USER.MAIN.DISABLE') }}
                        </p-button>
                        <p-button v-else
                                  style-type="tertiary"
                                  @click="handleClickButton(USER_MODAL_TYPE.ENABLE)"
                        >
                            {{ $t('IAM.USER.MAIN.ENABLE') }}
                        </p-button>
                        <p-button style-type="tertiary"
                                  icon-left="ic_edit"
                                  @click="handleClickButton(USER_MODAL_TYPE.UPDATE)"
                        >
                            <span class="button-label">{{ $t('IAM.USER.MAIN.EDIT') }}</span>
                        </p-button>
                        <p-button style-type="negative-secondary"
                                  icon-left="ic_delete"
                                  @click="handleClickButton(USER_MODAL_TYPE.DELETE)"
                        >
                            <span class="button-label">{{ $t('IAM.USER.MAIN.DELETE') }}</span>
                        </p-button>
                    </div>
                    <p-button v-else-if="userPageStore.isWorkspaceOwner"
                              style-type="negative-secondary"
                              :disabled="userPageStore.selectedUsers.length === 0"
                              @click="handleClickButton(USER_MODAL_TYPE.REMOVE)"
                    >
                        {{ $t('IAM.USER.REMOVE') }}
                    </p-button>
                </div>
            </template>
        </p-heading>
        <p-definition-table :fields="tableState.fields"
                            :data="tableState.refinedUserItems"
                            :loading="state.loading"
                            :skeleton-rows="7"
                            class="user-definition-table"
                            v-on="$listeners"
        >
            <template #data-state="{data}">
                <p-status v-bind="userStateFormatter(data)"
                          class="capitalize"
                />
            </template>
            <template #data-mfa="{data}">
                {{ data?.state === 'ENABLED' ? 'On' : 'Off' }}
            </template>
            <template #data-role_type>
                <span class="role-type">
                    <img :src="useRoleFormatter(userPageStore.isAdminMode ? (userPageStore.roleMap[tableState.refinedUserItems?.role_id]?.role_type) : tableState.refinedUserItems.role_type).image"
                         alt="role-type-icon"
                         class="role-type-icon"
                    >
                    <span>
                        {{
                            useRoleFormatter(userPageStore.isAdminMode
                                ? (userPageStore.roleMap[tableState.refinedUserItems?.role_id]?.role_type)
                                : tableState.refinedUserItems?.role_type).name
                        }}
                    </span>
                </span>
            </template>
            <template #data-role_id="{value}">
                <span class="role-type">
                    <span class="pr-4">{{ userPageStore.roleMap[value]?.name ?? '' }}</span>
                </span>
            </template>
            <template #data-role_binding="{value}">
                {{ value.name }}
            </template>
            <template #data-last_accessed_at="{data}">
                <span v-if="data === -1">
                    -
                </span>
                <span v-else-if="data === 0">
                    {{ $t('IAM.USER.MAIN.TODAY') }}
                </span>
                <span v-else-if="data === 1">
                    {{ $t('IAM.USER.MAIN.YESTERDAY') }}
                </span>
                <span v-else>
                    {{ data }} {{ $t('IAM.USER.MAIN.DAYS') }}
                </span>
            </template>
            <template #data-created_at="{data}">
                {{ iso8601Formatter(data, userPageStore.timezone) }}
            </template>
            <template #data-email="{data}">
                <div v-if="data && data !== ''"
                     class="col-email"
                >
                    <span :class="tableState.refinedUserItems.email_verified && 'verified-text'">{{ data }}</span>
                    <span v-if="tableState.refinedUserItems.email_verified">
                        <p-i name="ic_verified"
                             height="1rem"
                             width="1rem"
                             class="verified-icon"
                             color="#60B731"
                        />
                    </span>
                    <span v-else
                          class="not-verified"
                    >
                        {{ $t('IAM.USER.MAIN.NOT_VERIFIED') }}
                    </span>
                </div>
            </template>
            <template #extra="{label}">
                <p-button v-if="label === $t('IAM.USER.MAIN.NOTIFICATION_EMAIL')
                              && !tableState.refinedUserItems.email_verified
                              && tableState.refinedUserItems.email
                              && tableState.refinedUserItems.email !== ''"
                          style-type="primary"
                          size="sm"
                          :loading="state.verifyEmailLoading"
                          class="toolbox-button send-mail-button"
                          @click="handleClickVerifyButton"
                >
                    <span>{{ $t('IDENTITY.USER.NOTIFICATION_EMAIL.VERIFY') }}</span>
                </p-button>
            </template>
        </p-definition-table>
    </div>
</template>

<style lang="postcss" scoped>
.user-management-tab-detail {
    .toolbox-wrapper {
        .toolbox {
            @apply flex ;
            gap: 0.5rem;
            .button-label {
                line-height: 1rem;
            }
        }
    }

    /* custom design-system component - p-definition */
    :deep(.p-definition) {
        height: 2.25rem;
        .value-wrapper {
            @apply items-center;
            padding: 0 1rem;
            .extra {
                @apply flex items-center;
                max-height: 100%;
                .verify-button-wrapper {
                    height: 1.5rem;
                }
            }
            .p-copy-button {
                @apply flex items-center;
                gap: 0.25rem;
                .copy-text {
                    margin: 0;
                }
            }
        }
    }
    .user-definition-table {
        .col-email {
            @apply relative;
            .not-verified {
                @apply absolute bg-yellow-200 text-label-sm;
                height: 1.25rem;
                padding: 0.15rem 0.5rem;
                border-radius: 6.25rem;
                right: -7rem;
            }
            .verified-text {
                margin-left: 1.5rem;
            }
            .verified-icon {
                @apply absolute;
                bottom: -0.025rem;
                left: 0;
            }
        }
        .role-type {
            @apply flex items-center;
            gap: 0.5rem;
            .role-type-icon {
                @apply rounded-full;
                width: 1rem;
                height: 1rem;
            }
        }
    }
}
</style>
