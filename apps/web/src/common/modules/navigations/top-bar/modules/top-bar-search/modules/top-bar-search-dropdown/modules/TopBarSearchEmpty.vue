<script setup lang="ts">
import { PEmpty } from '@cloudforet/mirinae';

interface Props {
    inputText?: string;
    isRecent: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    inputText: '',
    isRecent: false,
});
</script>

<template>
    <p-empty
        v-if="props.inputText"
        show-image
    >
        <template #image>
            <img src="@/assets/images/illust_ghost.svg"
                 alt="empty-image"
            >
        </template>
        <p class="no-data-text">
            <i18n path="COMMON.NAVIGATIONS.TOP_BAR.NO_RESULT_1">
                <template #inputText>
                    <em>{{ props.inputText }}</em>
                </template>
            </i18n>
            <br>{{ $t('COMMON.NAVIGATIONS.TOP_BAR.NO_RESULT_2') }}
        </p>
    </p-empty>
    <p-empty
        v-else-if="props.isRecent"
        show-image
        image-size="md"
    >
        <template #image>
            <img src="@/assets/images/illust_microscope.svg"
                 alt="empty-image"
            >
        </template>
        {{ $t('COMMON.NAVIGATIONS.TOP_BAR.HELP_TEXT') }}
    </p-empty>
</template>
Search for navigation service account
