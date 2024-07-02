<script lang="ts" setup>
import {
    nextTick, ref, watch,
} from 'vue';

import { cloneDeep } from 'lodash';

import { numberFormatter } from '@cloudforet/utils';

import { useAmcharts5 } from '@/common/composables/amcharts5';

import type {
    Legend, RealtimeChartData, TreemapChartData,
} from '@/services/asset-inventory/types/asset-analysis-type';


const COLOR_FIELD_NAME = 'background_color';
const TEXT_COLOR_FIELD_NAME = 'font_color';
interface Props {
    loading: boolean;
    chartData: RealtimeChartData[];
    legends: Legend[];
}

const props = withDefaults(defineProps<Props>(), {
    loading: true,
    chartData: () => ([]),
    legends: () => ([]),
});

const chartContext = ref<HTMLElement | null>(null);
const chartHelper = useAmcharts5(chartContext);

const getRefinedTreemapChartData = (data: RealtimeChartData[]): TreemapChartData[] => [{
    children: data,
}];
const drawChart = () => {
    if (!props.chartData?.length) return;
    const seriesSettings = {
        valueField: 'value',
        categoryField: 'category',
        nodePaddingInner: 4,
    };
    const series = chartHelper.createTreeMapSeries(seriesSettings);
    series.rectangles.template.adapters.add('fill', (fill, target) => target.dataItem?.dataContext?.[COLOR_FIELD_NAME]);

    // tooltip
    const tooltip = chartHelper.createTooltip();
    const valueFormatter = (val) => numberFormatter(val) as string;
    series.set('tooltip', tooltip);
    chartHelper.setTreemapTooltipText(series, tooltip, valueFormatter);
    chartHelper.setTreemapLabelText(series, {
        oversizedBehavior: 'truncate',
    });
    series.labels.template.adapters.add('fill', (fill, target) => target.dataItem?.dataContext?.[TEXT_COLOR_FIELD_NAME]);

    const _chartData = getRefinedTreemapChartData(cloneDeep(props.chartData));
    series.data.setAll(_chartData);
};

watch([() => chartContext.value, () => props.loading, () => props.chartData], async ([_chartContext, loading, chartData]) => {
    if (_chartContext && !loading && chartData.length) {
        chartHelper.refreshRoot();
        await nextTick();
        drawChart();
    }
}, { immediate: false });
</script>

<template>
    <div class="h-full">
        <div v-show="!props.loading"
             ref="chartContext"
             class="chart"
        />
    </div>
</template>

<style lang="postcss" scoped>
.chart {
    height: 100%;
}
</style>