<script setup lang="ts">
import {
    computed, reactive,
} from 'vue';
import { useRoute } from 'vue-router/composables';

import BookmarkManagementDetailTable from '@/services/advanced/components/BookmarkManagementDetailTable.vue';

const route = useRoute();

const state = reactive({
    group: computed<string>(() => route.params.group),
});
</script>

<template>
    <div class="admin-bookmark-detail-page">
        <div v-if="state.group === 'global'"
             class="notification"
        >
            <span>{{ $t('IAM.BOOKMARK.GLOBAL_NOTIFICATION') }}</span>
        </div>
        <bookmark-management-detail-table />
    </div>
</template>

<style lang="postcss" scoped>
.admin-bookmark-detail-page {
    .notification {
        @apply bg-violet-200 text-paragraph-md;
        border-radius: 0.25rem;
        margin-bottom: 1.5rem;
        padding: 0.5rem 1rem;
    }
}
</style>
