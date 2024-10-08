<script lang="ts" setup>
import {
    reactive, computed, onMounted, onUnmounted,
} from 'vue';

import PTooltip from '@/data-display/tooltips/PTooltip.vue';
import PI from '@/foundation/icons/PI.vue';
import { screens } from '@/index';

const MOBILE_WIDTH = '312';

interface Props {
    height?: string;
    initWidth?: number;
    minWidth?: number;
    maxWidth?: number;
}

const props = withDefaults(defineProps<Props>(), {
    height: '100%',
    initWidth: 240,
    minWidth: 100,
    maxWidth: 500,
});

const documentEventMount = (eventName: string, func: any) => {
    onMounted(() => document.addEventListener(eventName, func));
    onUnmounted(() => document.removeEventListener(eventName, func));
};

const state = reactive({
    isMobileSize: false,
    width: props.initWidth,
    resizing: false,
    clientX: null,
    hide: false,
    transition: false,
    sidebarContainerStyle: computed(() => ({
        width: `${state.width}px`,
        height: '100%',
        'overflow-y': 'auto',
        'overflow-x': 'hidden',
        ...(state.isMobileSize && {
            position: 'absolute',
            zIndex: 1,
        }),
    })),
    sidebarStyle: computed(() => ({
        width: 'auto',
        minWidth: `${props.minWidth}px`,
        maxWidth: `${props.maxWidth}px`,
        opacity: state.hide && !state.transition ? 0 : 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        height: '100%',
    })),
    resizerStyle: computed(() => ({
        left: `${state.width}px`,
        'border-left-width': state.hide ? 0 : '1px',
    })),
    mainStyle: computed(() => ({
        width: state.isMobileSize ? '100%' : `calc( 100% - ${state.width}px )`,
        height: props.height,
    })),
});

/* Resizing */
const isResizing = (event) => {
    if (state.resizing) {
        if (state.clientX === null) {
            state.clientX = event.clientX;
            return;
        }
        const delta = state.clientX - event.clientX;
        const width = (state.isMobileSize ? MOBILE_WIDTH : state.width) - delta;
        if (!(width <= props.minWidth || width > props.maxWidth)) {
            state.width = width;
        }
        state.clientX = event.clientX;
    }
};
const endResizing = () => {
    state.resizing = false;
    state.clientX = null;
};
const startResizing = () => {
    state.resizing = true;
};

/* Toggle hide Sidebar */
const offTransition = () => { state.transition = false; };
const handleSidebarToggle = () => {
    if (!state.hide) {
        state.hide = true;
        state.transition = true;
        state.width = 0;
        setTimeout(offTransition, 500);
    } else {
        state.width = state.isMobileSize ? MOBILE_WIDTH : props.initWidth;
        state.transition = true;
        state.hide = false;
        setTimeout(offTransition, 500);
    }
};
documentEventMount('mousemove', isResizing);
documentEventMount('mouseup', endResizing);

const detectWindowResizing = () => {
    state.isMobileSize = window.innerWidth <= screens.mobile.max;
    if (!state.hide) {
        if (state.isMobileSize) {
            state.hide = false;
            handleSidebarToggle();
        } else {
            state.hide = true;
            handleSidebarToggle();
        }
    }
};

detectWindowResizing();
window.addEventListener('resize', detectWindowResizing);
</script>

<template>
    <div class="p-vertical-layout"
         :style="{height: props.height}"
    >
        <div class="sidebar-container"
             :style="state.sidebarContainerStyle"
             :class="{transition: state.transition}"
        >
            <div :style="state.sidebarStyle">
                <slot name="sidebar"
                      v-bind="{width: state.width, hide: state.hide, transition: state.transition, height: props.height}"
                />
            </div>
        </div>
        <div class="resizer-container line"
             :class="{transition: state.transition}"
             :style="state.resizerStyle"
             @mousedown="startResizing"
             @mousemove="isResizing"
             @mouseup="endResizing"
        >
            <p-tooltip :contents="state.hide ? $t('COMPONENT.VERTICAL_LAYOUT.EXPAND') : $t('COMPONENT.VERTICAL_LAYOUT.COLLAPSE')"
                       position="right"
                       :class="{hide: state.hide}"
                       class="resizer"
                       @click="handleSidebarToggle"
            >
                <span class="resizer-button">
                    <slot name="resizer-button">
                        <p-i width="1.5rem"
                             height="1.5rem"
                             :name="state.hide ? 'ic_chevron-right' : 'ic_chevron-left'"
                             color="inherit"
                        />
                    </slot>
                </span>
            </p-tooltip>
        </div>
        <div class="main"
             :class="{transition: state.transition}"
             :style="state.mainStyle"
        >
            <slot />
        </div>
    </div>
</template>

<style lang="postcss">
.p-vertical-layout {
    display: flex;
    width: 100%;
    flex-direction: row;
    padding: 0;
    margin: unset;

    > .sidebar-container {
        @apply bg-white;
        &.transition {
            transition: width 0.2s;
        }
    }
    > .main {
        display: flex;
        flex-direction: column;
        justify-content: stretch;

        /* flex-grow: 1; */
        overflow-x: hidden;
        overflow-y: auto;
        &.transition {
            transition: width 0.2s;
        }
    }
    > .resizer-container {
        display: flex;
        align-items: flex-start;
        justify-content: center;
        position: sticky;
        top: 0;
        height: 100%;
        width: 0;
        z-index: 1;
        &.transition {
            transition: left 0.2s;
        }
        &.line {
            @apply border-gray-200;
            background-color: transparent;
            &:hover {
                @apply border-blue-500;
                cursor: ew-resize;
            }
        }
        .resizer {
            @apply absolute flex items-center justify-center bg-white border border-gray-300 rounded-full text-gray-600 cursor-pointer;
            width: 1.5rem;
            height: 1.5rem;
            margin-top: 1.25rem;
            font-size: 1.5rem;
            font-weight: 600;
            z-index: 1;
            cursor: col-resize;
            &.hide {
                @apply bg-white justify-end;
                left: -1px;
                width: 1.25rem;
                margin-right: -0.25rem;
                border-top-left-radius: 50%;
                border-bottom-left-radius: 50%;
                border-left: 0;
                .resizer-button > svg {
                    margin-right: -0.125rem;
                }
                &:hover {
                    @apply text-secondary;
                    width: 2.5rem;
                    .resizer-button > svg {
                        margin-right: 0;
                    }
                }
            }
            &:hover {
                @apply bg-blue-200 cursor-pointer;
            }
        }
    }
}
</style>
