<script lang="ts" setup>
import {
    computed, onUnmounted, reactive, watch,
} from 'vue';

import { ApiQueryHelper } from '@cloudforet/core-lib/space-connector/helper';
import { PHorizontalLayout } from '@cloudforet/mirinae';


import { store } from '@/store';

import { useAppContextStore } from '@/store/app-context/app-context-store';

import { useGrantScopeGuard } from '@/common/composables/grant-scope-guard';

import UserManagementAddModal from '@/services/iam/components/UserManagementAddModal.vue';
import UserManagementFormModal from '@/services/iam/components/UserManagementFormModal.vue';
import UserManagementHeader from '@/services/iam/components/UserManagementHeader.vue';
import UserManagementStatusModal from '@/services/iam/components/UserManagementStatusModal.vue';
import UserManagementTab from '@/services/iam/components/UserManagementTab.vue';
import UserManagementTable from '@/services/iam/components/UserManagementTable.vue';
import { useUserPageStore } from '@/services/iam/store/user-page-store';

const appContextStore = useAppContextStore();
const userPageStore = useUserPageStore();
const userPageState = userPageStore.$state;

const storeState = reactive({
    isAdminMode: computed(() => appContextStore.getters.isAdminMode),
    globalGrantLoading: computed(() => appContextStore.getters.globalGrantLoading),
    grantInfo: computed(() => store.getters['user/getCurrentGrantInfo']),
});

const userListApiQueryHelper = new ApiQueryHelper()
    .setSort('name', true);

/* API */
const refreshUserList = async () => {
    userPageStore.$patch({ loading: true });
    userListApiQueryHelper
        .setPageStart(userPageState.pageStart).setPageLimit(userPageState.pageLimit)
        .setFilters(userPageState.searchFilters);
    try {
        if (storeState.isAdminMode && storeState.grantInfo.scope === 'DOMAIN') {
            await userPageStore.listUsers({ query: userListApiQueryHelper.data });
        } else if (storeState.grantInfo.scope === 'WORKSPACE') {
            await userPageStore.listWorkspaceUsers({ query: userListApiQueryHelper.data });
        }
    } finally {
        userPageStore.$patch({ loading: false });
    }
};

/* Watcher */
watch(() => storeState.globalGrantLoading, (globalGrantLoading) => {
    if (globalGrantLoading) return;
    userPageStore.$patch({ isAdminMode: storeState.isAdminMode });
}, { immediate: true });

const init = async () => {
    await userPageStore.listRoles();
    await refreshUserList();
};
const { callApiWithGrantGuard } = useGrantScopeGuard(['DOMAIN', 'WORKSPACE'], init);
callApiWithGrantGuard();

/* Unmount */
onUnmounted(() => {
    userPageStore.$dispose();
    userPageStore.$reset();
});
</script>

<template>
    <section class="user-page">
        <user-management-header />
        <p-horizontal-layout class="user-toolbox-layout">
            <template #container="{ height }">
                <user-management-table :table-height="height"
                                       @confirm="refreshUserList"
                />
            </template>
        </p-horizontal-layout>
        <user-management-tab />
        <user-management-add-modal @confirm="refreshUserList" />
        <user-management-status-modal @confirm="refreshUserList" />
        <user-management-form-modal @confirm="refreshUserList" />
    </section>
</template>

<style lang="postcss" scoped>
.user-page {
    @apply mx-0;
    max-width: 100%;
}

/* custom design-system component - p-horizontal-layout */
:deep(.user-toolbox-layout) {
    .horizontal-contents {
        overflow: unset;
    }
}
</style>
