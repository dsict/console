<script setup lang="ts">
import { useWindowSize } from '@vueuse/core';
import {
    computed, nextTick, reactive, ref, watch,
} from 'vue';

import { PI, screens } from '@cloudforet/mirinae';

import { i18n } from '@/translations';

import { useTopBarSearchStore } from '@/common/modules/navigations/top-bar/modules/top-bar-search/store';

interface Props {
    isFocused: boolean;
}

const { width } = useWindowSize();

const props = withDefaults(defineProps<Props>(), {
    isFocused: false,
});

const topBarSearchStore = useTopBarSearchStore();

const inputRef = ref<null|HTMLInputElement>(null);

const state = reactive({
    isMobileSize: computed(() => width.value < screens.mobile.max),
    isOverTabletSize: computed(() => width.value > screens.tablet.max),
    placeholder: computed(() => {
        if (state.isMobileSize) return i18n.t('COMMON.GNB.SEARCH.SEARCH');
        return i18n.t('COMMON.GNB.SEARCH.SEARCH_PLACEHOLDER');
    }),
    metaName: computed(() => {
        const userAgent = window.navigator.userAgent;
        if (userAgent.indexOf('Mac') !== -1) return 'cmd';
        return 'Ctrl';
    }),
});

const handleUpdateInput = (event: InputEvent) => {
    const target = event.target as HTMLInputElement;
    topBarSearchStore.$patch((_state) => {
        _state.state.inputText = target.value;
    });
};

const handleInitInput = () => {
    topBarSearchStore.$patch((_state) => {
        _state.state.inputText = '';
    });
};

watch(() => props.isFocused, async (isFocused) => {
    await nextTick();
    if (isFocused) inputRef.value?.focus();
    else inputRef.value?.blur();
});


</script>

<template>
    <div class="top-bar-search-input"
         @click.stop="$emit('click')"
    >
        <div class="disabled-input">
            <p-i name="ic_search"
                 height="1.5rem"
                 width="1.5rem"
                 color="inherit"
            />
            <span>{{ state.placeholder }}</span>
        </div>
        <div v-if="topBarSearchStore.getters.isActivated && state.isOverTabletSize"
             class="enabled-input"
        >
            <p-i name="ic_search"
                 height="1.5rem"
                 width="1.5rem"
                 color="inherit"
            />
            <input ref="inputRef"
                   :value="topBarSearchStore.state.inputText"
                   :placeholder="state.placeholder"
                   @input="handleUpdateInput"
                   @focus="$emit('update:isFocused', true)"
                   @blur="$emit('update:isFocused', false)"
                   @keyup.esc="$emit('esc')"
                   @keydown.up="$emit('arrow-up')"
                   @keydown.down="$emit('arrow-down')"
            >
            <p-i v-if="topBarSearchStore.state.inputText"
                 name="ic_close"
                 height="1rem"
                 width="1rem"
                 color="inherit"
                 class="delete-button"
                 @click.stop="handleInitInput"
            />
            <div class="shortcut-wrapper">
                <span class="tag-box">{{ state.metaName }}</span>
                <span class="tag-box">k</span>
            </div>
        </div>
    </div>
</template>

<style lang="postcss" scoped>
.top-bar-search-input {

    .disabled-input {
        @apply flex items-center justify-center bg-gray-200 rounded-md text-gray-600;
        background-color: rgba(221, 221, 223, 0.4);
        height: 1.75rem;
        width: 30rem;
        padding: 0.125rem 0.75rem;
        font-size: 0.875rem;
        cursor: pointer;

        &:hover {
            @apply bg-blue-200;
            opacity: unset;
        }
    }

    .enabled-input {
        @apply flex items-center border border-transparent border-gray-200 bg-white rounded-md text-gray-500 fixed;
        top: 0.375rem;
        left: 0;
        right: 0;
        margin: 0 auto;
        z-index: 1000;
        max-width: 47.5rem;
        width: 100%;
        height: 2.75rem;
        padding: 0 0.75rem;
        font-size: 0.875rem;

        &:hover {
            @apply bg-secondary-2;
        }

        &:focus-within {
            @apply border-secondary-1 bg-secondary-2;
            box-shadow: 0 0 0 2px rgba(73, 167, 247, 0.2);
        }

        input {
            @apply flex-grow text-gray-900;
            background-color: inherit;

            &::placeholder {
                @apply text-gray-400;
            }
        }

        .delete-button {
            @apply text-gray-400;
            cursor: pointer;
        }

        .shortcut-wrapper {
            @apply flex items-center;
            margin-left: 0.5rem;
            line-height: 1.5;

            .tag-box {
                @apply rounded-md border border-gray-200 text-label-sm text-gray-400;
                display: inline-block;
                padding: 0.125rem 0.375rem;
                margin-right: 0.25rem;
            }
        }
    }
}
</style>
