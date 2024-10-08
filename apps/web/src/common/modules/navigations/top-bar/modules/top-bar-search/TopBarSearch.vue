<script setup lang="ts">
import { useWindowSize } from '@vueuse/core/index';
import {
    computed, onMounted, onUnmounted, reactive,
} from 'vue';

import { PI, screens, PTooltip } from '@cloudforet/mirinae';

import { i18n } from '@/translations';

import TopBarSearchDropdown from '@/common/modules/navigations/top-bar/modules/top-bar-search/modules/top-bar-search-dropdown/TopBarSearchDropdown.vue';
import TopBarSearchInput from '@/common/modules/navigations/top-bar/modules/top-bar-search/modules/TopBarSearchInput.vue';
import TopBarSearchMobileInput from '@/common/modules/navigations/top-bar/modules/top-bar-search/modules/TopBarSearchMobileInput.vue';
import { useTopBarSearchStore } from '@/common/modules/navigations/top-bar/modules/top-bar-search/store';
import type { FocusingDirection } from '@/common/modules/navigations/top-bar/modules/top-bar-search/type';

const topBarSearchStore = useTopBarSearchStore();
const windowSize = useWindowSize();


const state = reactive({
    isFocusOnInput: false,
    isFocusOnSuggestion: false,
    focusingDirection: 'DOWNWARD' as FocusingDirection|undefined,
    isOverMobileSize: computed(() => windowSize.width.value > screens.mobile.max),
    isOverTabletSize: computed(() => windowSize.width.value > screens.tablet.max),
    tooltipTexts: computed<Record<string, string>>(() => ({
        search: i18n.t('COMMON.GNB.TOOLTIP.SEARCH') as string,
    })),
    visible: computed(() => topBarSearchStore.getters.isActivated),
});

/* Event */
const showSearchMenu = async () => {
    state.isFocusOnSuggestion = false;
    if (!state.isFocusOnInput) state.isFocusOnInput = true;
    if (!state.visible) {
        topBarSearchStore.setIsActivated(true);
    }
};

const hideSearchMenu = () => {
    if (state.visible) {
        topBarSearchStore.setIsActivated(false);
        topBarSearchStore.$patch((_state) => {
            _state.state.inputText = '';
        });
        state.isFocusOnInput = false;
        state.isFocusOnSuggestion = false;
        // dataState.filteredCloudServices = [];
        // dataState.filteredMenuList = [];
    }
};

const moveFocusToSuggestion = (focusingDirection: FocusingDirection) => {
    state.focusingDirection = focusingDirection;
    state.isFocusOnInput = false;
    state.isFocusOnSuggestion = true;
};

const handleSearchButtonClick = () => {
    if (!state.visible) showSearchMenu();
    else hideSearchMenu();
};

const handleMoveFocusEnd = () => {
    state.focusingDirection = undefined;
    state.isFocusOnSuggestion = false;
    state.isFocusOnInput = true;
};

// Keyboard Event: Meta([ctrl or cmd] + K
const handleKeyDown = (e: KeyboardEvent) => {
    if (e.metaKey && e.code === 'KeyK') {
        topBarSearchStore.setIsActivated(!state.visible);
        state.isFocusOnInput = state.visible;
        state.isFocusOnSuggestion = false;
    } else if (e.code === 'Escape') {
        topBarSearchStore.setIsActivated(false);
    }
};

const handleHideSearchMenu = () => { hideSearchMenu(); };

onMounted(() => {
    window.addEventListener('keydown', handleKeyDown);
});
onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown);
});

</script>

<template>
    <div class="top-bar-search"
         :class="{ 'bg-shadow': state.visible}"
         @click.stop
    >
        <top-bar-search-input v-if="state.isOverMobileSize"
                              :is-focused.sync="state.isFocusOnInput"
                              @click="showSearchMenu"
                              @esc="handleHideSearchMenu"
                              @arrow-up="moveFocusToSuggestion('UPWARD')"
                              @arrow-down="moveFocusToSuggestion('DOWNWARD')"
        />

        <p-tooltip v-else
                   :contents="state.tooltipTexts.search"
                   position="bottom"
        >
            <span :class="{'menu-button': true, 'opened': state.visible}"
                  tabindex="0"
                  role="button"
                  @click.stop="handleSearchButtonClick"
                  @keydown.esc="handleHideSearchMenu"
                  @keydown.enter="showSearchMenu"
            >
                <p-i name="ic_gnb_search"
                     height="1.375rem"
                     width="1.375rem"
                     color="inherit"
                />
            </span>
        </p-tooltip>

        <top-bar-search-dropdown v-show="state.visible"
                                 :focusing-direction.sync="state.focusingDirection"
                                 :is-focused="state.isFocusOnSuggestion"
                                 @move-focus-end="handleMoveFocusEnd"
                                 @close="handleHideSearchMenu"
        >
            <template #search-input>
                <top-bar-search-mobile-input v-if="!state.isOverTabletSize"
                                             @esc="hideSearchMenu"
                                             @arrow-up="moveFocusToSuggestion('UPWARD')"
                                             @arrow-down="moveFocusToSuggestion('DOWNWARD')"
                />
            </template>
        </top-bar-search-dropdown>
        <div v-if="state.visible & state.isOverMobileSize"
             class="background-block"
             @click="handleHideSearchMenu"
        />
    </div>
</template>

<style lang="postcss" scoped>
.top-bar-search {
    @apply relative;
    display: inline-block;

    .menu-button {
        @apply inline-flex items-center justify-center text-gray-500 rounded-full;
        width: 2rem;
        height: 2rem;
        line-height: $top-bar-height;
        cursor: pointer;

        &:hover {
            @apply text-blue-600 bg-blue-100;
        }

        &.opened {
            @apply text-blue-600 bg-blue-200;
        }
    }
    .background-block {
        @apply fixed inset-0 bg-black;
        opacity: 30%;
        z-index: 999;
    }
}

.bg-shadow {
    box-shadow: 0 0 8px 0 #00000014;
}

@screen mobile {
    .top-bar-search {
        box-shadow: unset;
    }
}
</style>
