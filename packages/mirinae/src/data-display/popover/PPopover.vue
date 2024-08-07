<template>
    <component :is="tag"
               v-click-outside="handleClickOutside"
               class="p-popover"
               v-on="$listeners"
    >
        <span ref="targetRef"
              class="target-ref"
        >
            <slot />
        </span>
        <div ref="contentRef"
             class="popper"
             :class="{ 'visible': proxyIsVisible, 'hide-padding': hidePadding }"
        >
            <div class="popper-content-wrapper">
                <slot name="content" />
                <p-icon-button v-if="!hideCloseButton"
                               name="ic_close"
                               color="inherit"
                               size="sm"
                               class="close-icon"
                               @click.stop="handleClickCloseIcon"
                />
            </div>
            <div v-if="!hideArrow"
                 class="arrow"
                 data-popper-arrow
            />
        </div>
    </component>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import {
    defineComponent,
    onMounted, onUnmounted, reactive, toRefs, watch, computed,
} from 'vue';

import type { Instance } from '@popperjs/core';
import { createPopper } from '@popperjs/core';
import vClickOutside from 'v-click-outside';

import type { PopoverPlacement, PopoverTrigger } from '@/data-display/popover/type';
import { POPOVER_PLACEMENT, POPOVER_TRIGGER } from '@/data-display/popover/type';
import PIconButton from '@/inputs/buttons/icon-button/PIconButton.vue';

interface PopoverProps {
    isVisible: boolean;
    tag: string;
    position?: PopoverPlacement;
    trigger?: PopoverTrigger;
    ignoreTargetClick?: boolean;
    ignoreOutsideClick?: boolean;
    hidePadding?: boolean;
    hideCloseButton?: boolean;
    hideArrow?: boolean
}

export default defineComponent<PopoverProps>({
    name: 'PPopover',
    components: {
        PIconButton,
    },
    directives: {
        clickOutside: vClickOutside.directive,
    },
    model: {
        prop: 'isVisible',
        event: 'update:isVisible',
    },
    props: {
        isVisible: {
            type: Boolean,
            default: false,
        },
        tag: {
            type: String,
            default: 'span',
        },
        position: {
            type: String as PropType<PopoverPlacement>,
            validator(value?: PopoverPlacement) {
                if (value === undefined) return true;
                return Object.values(POPOVER_PLACEMENT).includes(value);
            },
            default: POPOVER_PLACEMENT.BOTTOM_END,
        },
        trigger: {
            type: String as PropType<PopoverTrigger>,
            validator(value?: PopoverTrigger) {
                if (value === undefined) return true;
                return Object.values(POPOVER_TRIGGER).includes(value);
            },
            default: POPOVER_TRIGGER.CLICK,
        },
        ignoreTargetClick: {
            type: Boolean,
            default: true,
        },
        ignoreOutsideClick: {
            type: Boolean,
            default: false,
        },
        hidePadding: {
            type: Boolean,
            default: false,
        },
        hideCloseButton: {
            type: Boolean,
            default: false,
        },
        hideArrow: {
            type: Boolean,
            default: false,
        },
    },
    setup(props, { emit }) {
        let popperObject: Instance|undefined;
        const state = reactive({
            proxyIsVisible: false,
            contentRef: null as null|HTMLElement,
            targetRef: null as null|HTMLElement,
            popperOptions: computed(() => ({
                placement: props.position,
                modifiers: [
                    {
                        name: 'offset',
                        options: {
                            offset: [0, props.hideArrow ? 11 : 21],
                        },
                    },
                ],
            })),
        });
        const updateIsVisible = (visible: boolean, emitEvent = true) => {
            state.proxyIsVisible = visible;
            if (emitEvent) emit('update:is-visible', visible);
        };
        const hidePopover = (emitEvent = true) => {
            state.contentRef?.removeAttribute('data-show');
            popperObject?.setOptions({ placement: props.position });
            popperObject?.update();
            updateIsVisible(false, emitEvent);
        };
        const showPopover = (emitEvent = true) => {
            state.contentRef?.setAttribute('data-show', '');
            popperObject?.setOptions({ placement: props.position });
            popperObject?.update();
            updateIsVisible(true, emitEvent);
        };
        const handleClickTargetRef = (e) => {
            if (props.ignoreTargetClick) e.stopPropagation();
            const value = !state.proxyIsVisible;
            if (value) showPopover();
            else hidePopover();
        };
        const handleClickCloseIcon = () => {
            emit('close');
            hidePopover();
        };
        const handleClickOutside = () => {
            if (!props.ignoreOutsideClick) {
                hidePopover();
            }
        };
        const handleTargetShowEvent = () => {
            showPopover();
        };
        const handleTargetHideEvent = () => {
            hidePopover();
        };
        const bindEventToTargetRef = (eventType, handler, useCapture = false) => state.targetRef?.addEventListener(eventType, handler, useCapture);
        const addEvent = () => {
            if (props.trigger === POPOVER_TRIGGER.CLICK) {
                bindEventToTargetRef('click', handleClickTargetRef, true);
            } else if (props.trigger === POPOVER_TRIGGER.HOVER) {
                bindEventToTargetRef('mouseenter', handleTargetShowEvent);
                bindEventToTargetRef('mouseleave', handleTargetHideEvent);
            } else if (props.trigger === POPOVER_TRIGGER.FOCUS) {
                bindEventToTargetRef('focus', handleTargetShowEvent, true);
                bindEventToTargetRef('blur', handleTargetHideEvent, true);
            }
        };
        const handleEscKey = (event) => {
            if (event.key === 'Escape') {
                hidePopover();
            }
        };

        onMounted(() => {
            if (state.targetRef && state.contentRef) {
                popperObject = createPopper(state.targetRef, state.contentRef, state.popperOptions);
                addEvent();

                document.addEventListener('keydown', handleEscKey);

                watch(() => props.isVisible, (value) => {
                    if (state.proxyIsVisible === value) return;
                    state.proxyIsVisible = value;
                    if (value) showPopover(false);
                    else hidePopover(false);
                }, { immediate: true });
            }
        });

        onUnmounted(() => {
            popperObject?.destroy();
            document.removeEventListener('keydown', handleEscKey);
        });

        return {
            ...toRefs(state),
            handleClickTargetRef,
            handleClickOutside,
            handleClickCloseIcon,
        };
    },
});

</script>

<style lang="postcss">
.p-popover {
    > .popper {
        @apply bg-white border rounded-md border-gray-300;
        display: none;
        filter: drop-shadow(0 0 0.5rem rgba(0, 0, 0, 0.08));
        z-index: 99;
        padding: 1rem;

        &[data-show] {
            display: block;
        }
        &.hide-padding {
            padding: 0;
        }
        > .popper-content-wrapper {
            @apply flex w-full;

            .close-icon {
                position: absolute;
                right: 0.25rem;
                top: 0.25rem;
                z-index: 100;
            }
        }

        > .arrow,
        > .arrow::before {
            @apply border-gray-300 border;
            position: absolute;
            width: 1rem;
            height: 1rem;
            background: inherit;
        }

        > .arrow {
            visibility: hidden;
        }

        > .arrow::before {
            visibility: visible;
            content: '';
            transform: rotate(45deg);
        }

        &[data-popper-placement^='top'] > .arrow {
            bottom: -0.55rem;

            &::before {
                border-top: none;
                border-left: none;
            }
        }

        &[data-popper-placement^='bottom'] > .arrow {
            top: -0.55rem;

            &::before {
                border-bottom: none;
                border-right: none;
            }
        }

        &[data-popper-placement^='left'] > .arrow {
            right: -0.55rem;

            &::before {
                border-bottom: none;
                border-left: none;
            }
        }

        &[data-popper-placement^='right'] > .arrow {
            left: -0.55rem;

            &::before {
                border-top: none;
                border-right: none;
            }
        }

        &.visible {
            display: unset;
        }
    }

    @screen mobile {
        > .popper {
            max-width: 17rem;
        }
    }
}
</style>
