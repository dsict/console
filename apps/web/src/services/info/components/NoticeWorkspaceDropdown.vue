<script setup lang="ts">
import { reactive } from 'vue';
import { useRouter } from 'vue-router/composables';

import { SpaceConnector } from '@cloudforet/core-lib/space-connector';
import { ApiQueryHelper } from '@cloudforet/core-lib/space-connector/helper';
import {
    PSelectDropdown, PBadge, PEmpty, PButton, PTextHighlighting, PStatus,
} from '@cloudforet/mirinae';
import type { AutocompleteHandler } from '@cloudforet/mirinae/types/inputs/dropdown/select-dropdown/type';


import type { ListResponse } from '@/schema/_common/api-verbs/list';
import type { WorkspaceListParameters } from '@/schema/identity/workspace/api-verbs/list';
import type { WorkspaceModel } from '@/schema/identity/workspace/model';

import { makeAdminRouteName } from '@/router/helpers/route-helper';

import ErrorHandler from '@/common/composables/error/errorHandler';
import { useProxyValue } from '@/common/composables/proxy-state';
import WorkspaceLogoIcon from '@/common/modules/navigations/top-bar/modules/top-bar-header/WorkspaceLogoIcon.vue';

import { workspaceStateFormatter } from '@/services/advanced/composables/refined-table-data';
import { WORKSPACE_STATE } from '@/services/advanced/constants/workspace-constant';
import { ADVANCED_ROUTE } from '@/services/advanced/routes/route-constant';
import type { WorkspaceDropdownMenuItem, NoticeFormType } from '@/services/info/types/notice-type';

interface Props {
    selectedItems: WorkspaceDropdownMenuItem[];
    type?: NoticeFormType;
}

const props = withDefaults(defineProps<Props>(), {
    selectedItems: () => ([]),
    type: undefined,
});

const router = useRouter();

const emit = defineEmits<{(e: 'refresh', inputText: string): void;
    (e: 'selected-items', inputText: string): void;
}>();

const workspaceListApiQueryHelper = new ApiQueryHelper()
    .setPageStart(1).setPageLimit(15)
    .setSort('name', true);

const state = reactive({
    loading: true,
    visible: false,
    proxySelectedItems: useProxyValue('selectedItems', props, emit),
    searchText: '',
    menuItems: [] as WorkspaceDropdownMenuItem[],
});

const workspaceMenuHandler: AutocompleteHandler = async (inputText: string) => {
    await fetchListWorkspaces(inputText);
    return {
        results: state.menuItems as WorkspaceDropdownMenuItem[],
    };
};
const fetchListWorkspaces = async (inputText: string) => {
    state.loading = true;

    workspaceListApiQueryHelper.setFilters([
        { k: 'name', v: inputText, o: '' },
        { k: 'state', v: 'ENABLED', o: '' },
    ]);
    try {
        const { results } = await SpaceConnector.clientV2.identity.workspace.list<WorkspaceListParameters, ListResponse<WorkspaceModel>>({
            query: workspaceListApiQueryHelper.data,
        });
        state.menuItems = (results ?? []).map((workspace) => ({
            label: workspace.name,
            name: workspace.workspace_id,
            tags: workspace.tags,
            is_dormant: workspace.is_dormant,
        }));
    } catch (e) {
        ErrorHandler.handleError(e);
    } finally {
        state.loading = false;
    }
};
const handleSelectedItem = (value: WorkspaceDropdownMenuItem[]) => {
    state.proxySelectedItems = value;
};

(() => {
    if (props.type === 'EDIT') return;
    state.proxySelectedItems = [];
})();
</script>

<template>
    <p-select-dropdown :visible-menu.sync="state.visible"
                       :loading="state.loading"
                       :search-text.sync="state.searchText"
                       :selected="state.proxySelectedItems"
                       :handler="workspaceMenuHandler"
                       show-select-marker
                       is-filterable
                       multi-selectable
                       appearance-type="badge"
                       show-delete-all-button
                       class="notice-workspace-dropdown"
                       :class="{'no-data': state.menuItems.length === 0 && !state.loading}"
                       @update:selected="handleSelectedItem"
    >
        <template #dropdown-button>
            <div v-if="state.proxySelectedItems.length > 0"
                 class="selected-workspace-wrapper"
            >
                <workspace-logo-icon :text="state.proxySelectedItems[0].label || ''"
                                     :theme="state.proxySelectedItems[0].tags?.theme"
                                     size="xxs"
                />
                <span class="label">{{ state.proxySelectedItems[0].label }}</span>
                <p-badge v-if="state.proxySelectedItems.length > 1"
                         style-type="blue200"
                         badge-type="subtle"
                >
                    + {{ state.proxySelectedItems.length - 1 }}
                </p-badge>
            </div>
            <span v-else
                  class="placeholder"
            >
                {{ $t('INFO.NOTICE.FORM.SELECT') }}
            </span>
        </template>
        <template #menu-item--format="{item}">
            <div class="menu-item-wrapper">
                <workspace-logo-icon :text="item?.label || ''"
                                     :theme="item?.tags?.theme"
                                     size="xxs"
                />
                <p-text-highlighting class="label-text"
                                     :text="item.label"
                                     :term="state.searchText"
                />
                <p-status v-if="item?.is_dormant"
                          v-bind="workspaceStateFormatter(WORKSPACE_STATE.DORMANT)"
                          class="capitalize state"
                />
            </div>
        </template>
        <template #no-data-area>
            <p-empty v-if="state.menuItems.length === 0 && !state.loading"
                     image-size="sm"
                     show-image
                     show-button
                     class="no-data-wrapper"
            >
                <template #image>
                    <img src="@/assets/images/illust_planet.svg"
                         alt="empty-options"
                    >
                </template>
                <template #button>
                    <p-button style-type="substitutive"
                              icon-left="ic_plus_bold"
                              @click="router.push({ name: makeAdminRouteName(ADVANCED_ROUTE.WORKSPACES._NAME) })"
                    >
                        {{ $t('INFO.NOTICE.FORM.CREATE_WORKSPACE') }}
                    </p-button>
                </template>
                {{ $t('INFO.NOTICE.FORM.NO_WORKSPACE') }}
            </p-empty>
        </template>
    </p-select-dropdown>
</template>

<style scoped lang="postcss">
.notice-workspace-dropdown {
    width: 50%;
    margin-top: 0.25rem;
    .no-data-wrapper {
        margin-top: 2rem;
        margin-bottom: 2rem;
    }
    .menu-item-wrapper {
        @apply flex items-center;
        gap: 0.25rem;
        .state {
            @apply text-label-sm;
        }
    }
    .selected-workspace-wrapper {
        @apply flex items-center;
        gap: 0.25rem;
    }
    .placeholder {
        @apply text-gray-600;
    }
}
</style>

