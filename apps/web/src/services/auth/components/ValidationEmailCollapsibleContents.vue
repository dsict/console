<template>
    <p-data-loader class="collapsible-contents-wrapper"
                   :loading="state.loading"
    >
        <div class="contents-item">
            <p class="title">
                {{ $t('AUTH.PASSWORD.RESET.EMAIL.DONE.EXTENSION_TITLE_1') }}
            </p>
            <ul class="list">
                <li>{{ $t('AUTH.PASSWORD.RESET.EMAIL.DONE.EXTENSION_REASON_1') }}</li>
                <li>{{ $t('AUTH.PASSWORD.RESET.EMAIL.DONE.EXTENSION_REASON_2') }}</li>
                <li>
                    <p-text-button class="re-send-button"
                                   @click="handleClickResend"
                    >
                        {{ $t('AUTH.PASSWORD.RESET.EMAIL.DONE.CLICK_HERE') }}
                    </p-text-button>
                    {{ $t('AUTH.PASSWORD.RESET.EMAIL.DONE.EXTENSION_REASON_3') }}
                </li>
            </ul>
        </div>
        <div class="contents-item">
            <p class="title">
                {{ $t('AUTH.PASSWORD.RESET.EMAIL.DONE.EXTENSION_TITLE_2') }}
            </p>
            <p>
                {{ $t('AUTH.PASSWORD.RESET.EMAIL.DONE.EXTENSION_DESC_1') }}
                <span class="contact-help-text">
                    {{ $t('AUTH.PASSWORD.RESET.EMAIL.DONE.EXTENSION_CONTACT') }}
                </span>
            </p>
        </div>
    </p-data-loader>
</template>

<script setup lang="ts">

import { reactive } from 'vue';

import { SpaceConnector } from '@cloudforet/core-lib/space-connector';
import { PTextButton, PDataLoader } from '@cloudforet/mirinae';

import { SpaceRouter } from '@/router';

import { useDomainStore } from '@/store/domain/domain-store';

import ErrorHandler from '@/common/composables/error/errorHandler';

import { AUTH_ROUTE } from '@/services/auth/routes/route-constant';


const { query } = SpaceRouter.router.currentRoute;

const domainStore = useDomainStore();
const state = reactive({
    loading: false,
});

/* API */
const handleClickResend = async () => {
    const userId = query.userId as string;
    state.loading = true;
    try {
        await SpaceConnector.clientV2.identity.user.resetPassword({ user_id: userId, domain_id: domainStore.state.domainId });
        await SpaceRouter.router.replace({ name: AUTH_ROUTE.EMAIL._NAME, query: { userId, status: 'done' } }).catch(() => {});
    } catch (e: any) {
        ErrorHandler.handleError(e);
        await SpaceRouter.router.push({ name: AUTH_ROUTE.EMAIL._NAME, query: { userId, status: 'fail' } }).catch(() => {});
        throw e;
    } finally {
        state.loading = false;
    }
};
</script>

<style lang="postcss" scoped>
.collapsible-contents-wrapper {
    @apply text-paragraph-sm;
    max-width: 23rem;
    .contents-item {
        .title {
            @apply font-bold;
        }
        .contact-help-text {
            @apply text-violet-600;
        }
        li {
            @apply relative;
            padding-left: 1.25rem;
            &::before {
                @apply absolute;
                content: '·';
                top: 0;
                left: 0.5rem;
            }
            .re-send-button {
                @apply inline-block text-paragraph-sm text-blue-700;
                padding: 0;
            }
        }
        & + .contents-item {
            margin-top: 1.625rem;
        }
        a {
            @apply text-blue-700;
        }
    }
}
</style>
