<script lang="ts" setup>
import {
    computed, reactive, watch,
} from 'vue';
import { useRoute, useRouter } from 'vue-router/composables';

import { get } from 'lodash';

import {
    PRadioGroup, PRadio, PLazyImg,
} from '@cloudforet/mirinae';

import { store } from '@/store';
import { i18n } from '@/translations';

import { makeAdminRouteName } from '@/router/helpers/route-helper';

import { useAllReferenceStore } from '@/store/reference/all-reference-store';
import type { ProviderReferenceMap } from '@/store/reference/provider-reference-store';

import { useProperRouteLocation } from '@/common/composables/proper-route-location';
import { useFavoriteStore } from '@/common/modules/favorites/favorite-button/store/favorite-store';
import type { FavoriteOptions, FavoriteConfig } from '@/common/modules/favorites/favorite-button/type';
import { FAVORITE_TYPE } from '@/common/modules/favorites/favorite-button/type';
import LSB from '@/common/modules/navigations/lsb/LSB.vue';
import type {
    LSBItem, LSBMenu,
} from '@/common/modules/navigations/lsb/type';
import { MENU_ITEM_TYPE } from '@/common/modules/navigations/lsb/type';
import { useGnbStore } from '@/common/modules/navigations/stores/gnb-store';

import CloudServiceLSBDropdownMenuItem from '@/services/asset-inventory/components/CloudServiceLSBDropdownMenuItem.vue';
import { CLOUD_SERVICE_FILTER_KEY } from '@/services/asset-inventory/constants/cloud-service-constant';
import { ASSET_INVENTORY_ROUTE } from '@/services/asset-inventory/routes/route-constant';
import { useCloudServiceDetailPageStore } from '@/services/asset-inventory/stores/cloud-service-detail-page-store';
import { useCloudServicePageStore } from '@/services/asset-inventory/stores/cloud-service-page-store';
import type { CloudServiceDetailPageParams } from '@/services/asset-inventory/types/cloud-service-detail-page-type';

const PROVIDER_MENU_ID = 'provider';
const CATEGORY_MENU_ID = 'category';
const REGION_MENU_ID = 'region';

const { getProperRouteLocation, isAdminMode } = useProperRouteLocation();

const gnbStore = useGnbStore();
const cloudServicePageStore = useCloudServicePageStore();
const cloudServicePageState = cloudServicePageStore.$state;
const cloudServiceDetailPageStore = useCloudServiceDetailPageStore();
const cloudServiceDetailPageState = cloudServiceDetailPageStore.$state;
const allReferenceStore = useAllReferenceStore();
const favoriteStore = useFavoriteStore();
const favoriteGetters = favoriteStore.getters;

const route = useRoute();
const router = useRouter();

const storeState = reactive({
    currentGrantInfo: computed(() => store.getters['user/getCurrentGrantInfo']),
    favoriteItems: computed(() => favoriteGetters.cloudServiceItems),
    providers: computed<ProviderReferenceMap>(() => allReferenceStore.getters.provider),
});
const state = reactive({
    currentPath: computed(() => route.fullPath),
    isCloudServiceDetailPage: computed(() => route.name === ASSET_INVENTORY_ROUTE.CLOUD_SERVICE.DETAIL._NAME
        || route.name === makeAdminRouteName(ASSET_INVENTORY_ROUTE.CLOUD_SERVICE.DETAIL._NAME)),
    detailPageParams: computed<CloudServiceDetailPageParams|undefined>(() => {
        if (state.isCloudServiceDetailPage) return route.params as unknown as CloudServiceDetailPageParams;
        return undefined;
    }),
    favoriteItemMap: computed(() => {
        const result: Record<string, FavoriteConfig> = {};
        storeState.favoriteItems?.forEach((d) => {
            result[d.itemId] = d;
        });
        return result;
    }),
    starredMenuItems: computed<LSBItem[]>(() => storeState.favoriteItems.map((d) => {
        const labelArr = d.name.split('.');
        return {
            type: MENU_ITEM_TYPE.ITEM,
            label: `${d.parents[0].label} [${d.label}]`,
            id: d.name,
            imgIcon: d.icon,
            to: getProperRouteLocation({
                name: ASSET_INVENTORY_ROUTE.CLOUD_SERVICE.DETAIL._NAME,
                params: {
                    provider: d.provider,
                    group: labelArr[1],
                    name: labelArr[2],
                },
            }),
            favoriteOptions: {
                type: FAVORITE_TYPE.CLOUD_SERVICE,
                id: d.name,
            },
        };
    })),
    cloudServiceMainMenuSet: computed<LSBItem[]>(() => ([
        {
            type: MENU_ITEM_TYPE.COLLAPSIBLE,
            label: i18n.t('INVENTORY.CLOUD_SERVICE.PAGE.PROVIDER'),
            id: PROVIDER_MENU_ID,
        },
        {
            type: MENU_ITEM_TYPE.COLLAPSIBLE,
            label: i18n.t('INVENTORY.CLOUD_SERVICE.MAIN.SERVICE_CATEGORY'),
            id: CATEGORY_MENU_ID,
        },
        {
            type: MENU_ITEM_TYPE.COLLAPSIBLE,
            label: i18n.t('INVENTORY.CLOUD_SERVICE.MAIN.REGION'),
            id: REGION_MENU_ID,
        },
    ])),
    cloudServiceDetailMenuSet: computed<LSBItem[]>(() => {
        const selectedItem = cloudServiceDetailPageState.cloudServiceTypeList[0];
        const results: LSBItem[] = [
            {
                type: MENU_ITEM_TYPE.BUTTON_TITLE,
                label: state.detailPageParams.group,
                id: selectedItem?.group,
                isBackLink: true,
                to: getProperRouteLocation({ name: ASSET_INVENTORY_ROUTE.CLOUD_SERVICE._NAME }),
                titleIcon: get(selectedItem, ['tags', 'spaceone:icon'], ''),
            },
        ];
        cloudServiceDetailPageState.cloudServiceTypeList.forEach((d) => {
            results.push({
                type: MENU_ITEM_TYPE.ITEM,
                label: d.name,
                id: d.cloud_service_type_key,
                to: getProperRouteLocation({ name: ASSET_INVENTORY_ROUTE.CLOUD_SERVICE.DETAIL._NAME, params: { ...state.detailPageParams, name: d.name } }),
                favoriteOptions: {
                    type: FAVORITE_TYPE.CLOUD_SERVICE,
                    id: d.cloud_service_type_key,
                },
            });
        });
        return results;
    }),
    menuSet: computed<LSBMenu[]>(() => (state.isCloudServiceDetailPage ? state.cloudServiceDetailMenuSet : state.cloudServiceMainMenuSet)),
    favoriteOptions: computed<FavoriteOptions>(() => {
        if (!state.isCloudServiceDetailPage) {
            return {
                type: FAVORITE_TYPE.MENU,
                id: 'cloud_service',
            };
        }
        return {
            type: FAVORITE_TYPE.CLOUD_SERVICE,
            id: cloudServiceDetailPageState.selectedCloudServiceType?.cloud_service_type_key || '',
        };
    }),
});
const providerState = reactive({
    contextMenuItems: computed(() => [
        { name: 'all', label: 'All', icon: undefined },
        ...Object.keys(storeState.providers).map((k) => ({
            label: storeState.providers[k].label,
            name: storeState.providers[k].key,
        })),
    ]),
    selectedItem: computed(() => {
        const item = storeState.providers[cloudServicePageState.selectedProvider];
        if (item) {
            return storeState.providers[cloudServicePageState.selectedProvider].key;
        } return 'all';
    }),
});

const initCloudServiceDetailLSB = async (params: CloudServiceDetailPageParams) => {
    cloudServiceDetailPageStore.setProviderGroupName(params);
    await cloudServiceDetailPageStore.listCloudServiceTypeData();
};

const routeToFirstCloudServiceType = async (params: CloudServiceDetailPageParams) => {
    await router.replace(getProperRouteLocation({
        name: ASSET_INVENTORY_ROUTE.CLOUD_SERVICE.DETAIL._NAME,
        params: {
            provider: params.provider,
            group: params.group,
            name: cloudServiceDetailPageState.cloudServiceTypeList[0].name,
        },
        query: route.query,
    }));
    await cloudServiceDetailPageStore.setSelectedCloudServiceType();
};
const handleSelectProvider = (selected: string) => {
    if (!selected) return;
    cloudServicePageStore.setSelectedProvider(selected);
};

/* Watchers */
watch([() => state.detailPageParams, () => storeState.currentGrantInfo.scope], async ([params, scope]) => {
    if (scope === 'USER') return;
    if (!params) return;
    await initCloudServiceDetailLSB(params);
    if (!params.name) await routeToFirstCloudServiceType(params);
}, { immediate: true });
watch(() => state.favoriteOptions, (favoriteOptions) => {
    gnbStore.setFavoriteItemId(favoriteOptions);
}, { immediate: true });
</script>

<template>
    <l-s-b :menu-set="state.menuSet"
           class="cloud-service-l-s-b"
           :class="{'is-admin-mode': isAdminMode, 'is-detail-page': state.isCloudServiceDetailPage}"
    >
        <template #collapsible-contents-provider>
            <p-radio-group direction="vertical"
                           class="provider-radio-group"
            >
                <p-radio v-for="(item, idx) in providerState.contextMenuItems"
                         :key="idx"
                         :selected="providerState.selectedItem"
                         :value="item.name"
                         class="provider-item"
                         @change="handleSelectProvider"
                >
                    <span class="selected-wrapper">
                        <p-lazy-img width="1rem"
                                    height="1rem"
                                    error-icon="ic_cloud-filled"
                                    :src="storeState.providers[item.name]?.icon"
                                    class="mr-1"
                        /><span>{{ item.label }}</span>
                    </span>
                </p-radio>
            </p-radio-group>
        </template>
        <template #collapsible-contents-category>
            <cloud-service-l-s-b-dropdown-menu-item class="collapsible-item"
                                                    :type="CLOUD_SERVICE_FILTER_KEY.SERVICE_CATEGORY"
                                                    :label="$t('INVENTORY.CLOUD_SERVICE.MAIN.SERVICE_CATEGORY')"
            />
        </template>
        <template #collapsible-contents-region>
            <cloud-service-l-s-b-dropdown-menu-item class="collapsible-item"
                                                    :type="CLOUD_SERVICE_FILTER_KEY.REGION"
                                                    :label="$t('INVENTORY.CLOUD_SERVICE.MAIN.REGION')"
            />
        </template>
    </l-s-b>
</template>

<style lang="postcss" scoped>
.cloud-service-l-s-b {
    .provider-radio-group {
        .provider-item {
            @apply flex items-center;
            gap: 0.25rem;
            padding-left: 0.25rem;
            .selected-wrapper {
                @apply flex items-center;
            }
        }
    }
    &.is-admin-mode:not(&.is-detail-page) {
        &:deep(.menu-wrapper) {
            padding-top: 0.5rem;
        }
    }
    &:deep(.l-s-b-collapsible-menu-item) {
        margin-top: 0.5rem;
    }
}
</style>
