<script setup lang="ts">
import { useResizeObserver } from '@vueuse/core/index';
import {
    computed, defineExpose, reactive, ref, watch,
} from 'vue';

import dayjs from 'dayjs';
import type { BarSeriesOption } from 'echarts/charts';
import { init } from 'echarts/core';
import type {
    EChartsType,
} from 'echarts/core';
import {
    isEmpty, sortBy, throttle,
} from 'lodash';

import { SpaceConnector } from '@cloudforet/core-lib/space-connector';
import { numberFormatter } from '@cloudforet/utils';

import type { ListResponse } from '@/schema/_common/api-verbs/list';
import type { PrivateWidgetLoadParameters } from '@/schema/dashboard/private-widget/api-verbs/load';
import type { PublicWidgetLoadParameters } from '@/schema/dashboard/public-widget/api-verbs/load';

import type { APIErrorToast } from '@/common/composables/error/errorHandler';
import ErrorHandler from '@/common/composables/error/errorHandler';
import WidgetFrame from '@/common/modules/widgets/_components/WidgetFrame.vue';
import { useWidgetFrame } from '@/common/modules/widgets/_composables/use-widget-frame';
import { useWidgetInitAndRefresh } from '@/common/modules/widgets/_composables/use-widget-init-and-refresh';
import { DATE_FIELD } from '@/common/modules/widgets/_constants/widget-constant';
import { DATE_FORMAT } from '@/common/modules/widgets/_constants/widget-field-constant';
import {
    getApiQueryDateRange,
    getReferenceLabel,
    getWidgetBasedOnDate,
    getWidgetDateFields,
    getWidgetDateRange,
} from '@/common/modules/widgets/_helpers/widget-date-helper';
import type { DateRange } from '@/common/modules/widgets/types/widget-data-type';
import type {
    WidgetProps, WidgetEmit, WidgetExpose,
} from '@/common/modules/widgets/types/widget-display-type';
import type { XAxisValue, DateFormatValue } from '@/common/modules/widgets/types/widget-field-value-type';

import { MASSIVE_CHART_COLORS } from '@/styles/colorsets';


type Data = ListResponse<{
    [key: string]: string|number;
}>;
const props = defineProps<WidgetProps>();
const emit = defineEmits<WidgetEmit>();

const chartContext = ref<HTMLElement|null>(null);
const state = reactive({
    loading: false,
    errorMessage: undefined as string|undefined,
    data: null as Data | null,
    chart: null as EChartsType | null,
    xAxisData: [],
    chartData: [],
    chartOptions: computed<BarSeriesOption>(() => ({
        color: MASSIVE_CHART_COLORS,
        grid: {
            left: 10,
            right: 10,
            containLabel: true,
        },
        legend: {
            type: 'scroll',
            show: state.showLegends,
            bottom: 0,
            left: 0,
            icon: 'circle',
            itemWidth: 10,
            itemHeight: 10,
        },
        tooltip: {
            trigger: 'axis',
            formatter: (params) => {
                const _params = params as any[];
                let _axisValue = getReferenceLabel(props.allReferenceTypeInfo, state.xAxisField, _params[0].axisValue);
                if (state.xAxisField === DATE_FIELD.DATE) {
                    _axisValue = dayjs.utc(_axisValue).format(state.dateFormat);
                }
                const _values = _params.map((p) => {
                    const _unit = widgetFrameProps.value.unitMap?.[p.seriesName];
                    let _seriesName = getReferenceLabel(props.allReferenceTypeInfo, state.dataField, p.seriesName);
                    if (_unit) _seriesName = `${_seriesName} (${_unit})`;
                    const _value = numberFormatter(p.value) || '';
                    return `${p.marker} ${_seriesName}: <b>${_value}</b>`;
                });
                return [_axisValue, ..._values].join('<br/>');
            },
        },
        xAxis: {
            type: 'category',
            axisLabel: {
                formatter: (val) => {
                    if (state.xAxisField === DATE_FIELD.DATE) {
                        return dayjs.utc(val).format(state.dateFormat);
                    }
                    return getReferenceLabel(props.allReferenceTypeInfo, state.xAxisField, val);
                },
            },
            data: state.xAxisData,
        },
        yAxis: {
            type: 'value',
            axisLabel: {
                formatter: (val) => numberFormatter(val, { notation: 'compact' }),
            },
        },
        series: state.chartData,
    })),
    // required fields
    granularity: computed<string>(() => props.widgetOptions?.granularity as string),
    basedOnDate: computed(() => getWidgetBasedOnDate(state.granularity, props.dashboardOptions?.date_range?.end)),
    xAxisField: computed<string>(() => (props.widgetOptions?.xAxis as XAxisValue)?.value),
    xAxisCount: computed<number>(() => (props.widgetOptions?.xAxis as XAxisValue)?.count),
    dataField: computed<string[]>(() => props.widgetOptions?.dataField as string[] || []),
    dateRange: computed<DateRange>(() => {
        let _start = state.basedOnDate;
        let _end = state.basedOnDate;
        if (Object.values(DATE_FIELD).includes(state.xAxisField)) {
            [_start, _end] = getWidgetDateRange(state.granularity, state.basedOnDate, state.xAxisCount);
        }
        return { start: _start, end: _end };
    }),
    // optional fields
    showLegends: computed<boolean>(() => props.widgetOptions?.legend as boolean),
    dateFormat: computed<string|undefined>(() => {
        const _dateFormat = (props.widgetOptions?.dateFormat as DateFormatValue)?.value || 'MMM DD, YYYY';
        return DATE_FORMAT?.[_dateFormat]?.[state.granularity];
    }),
});
const { widgetFrameProps, widgetFrameEventHandlers } = useWidgetFrame(props, emit, {
    dateRange: computed(() => state.dateRange),
    errorMessage: computed(() => state.errorMessage),
    widgetLoading: computed(() => state.loading),
    noData: computed(() => (state.data ? !state.data.results?.length : false)),
});

/* Util */
const fetchWidget = async (): Promise<Data|APIErrorToast|undefined> => {
    if (props.widgetState === 'INACTIVE') return undefined;
    try {
        const _fields = {};
        state.dataField?.forEach((field) => {
            _fields[field] = { key: field, operator: 'sum' };
        });
        const _isPrivate = props.widgetId.startsWith('private');
        const _fetcher = _isPrivate
            ? SpaceConnector.clientV2.dashboard.privateWidget.load<PrivateWidgetLoadParameters, Data>
            : SpaceConnector.clientV2.dashboard.publicWidget.load<PublicWidgetLoadParameters, Data>;
        const _queryDateRange = getApiQueryDateRange(state.granularity, state.dateRange);
        const res = await _fetcher({
            widget_id: props.widgetId,
            query: {
                granularity: state.granularity,
                start: _queryDateRange.start,
                end: _queryDateRange.end,
                group_by: [state.xAxisField],
                fields: _fields,
            },
            vars: props.dashboardVars,
        });
        state.errorMessage = undefined;
        return res;
    } catch (e: any) {
        state.loading = false;
        state.errorMessage = e.message;
        ErrorHandler.handleError(e);
        return ErrorHandler.makeAPIErrorToast(e);
    }
};
const drawChart = (rawData: Data|null) => {
    if (isEmpty(rawData)) return;

    // sort and slice Data, etc
    const _sortedData = sortBy(rawData?.results, (v) => state.dataField.reduce((acc, field) => acc + (v[field] as number), 0)).reverse();
    const _slicedData = _sortedData.slice(0, state.xAxisCount);
    const _etcData = _sortedData.slice(state.xAxisCount).reduce((acc, v) => {
        state.dataField.forEach((field) => {
            acc[field] = (acc[field] as number) + (v[field] as number);
        });
        return acc;
    }, Object.fromEntries(state.dataField.map((field) => [field, 0])));
    if (Object.values(_etcData).some((v) => v > 0)) {
        _slicedData.push({ [state.xAxisField]: 'etc', ..._etcData });
    }

    // get xAxis data
    let _xAxisData: string[] = [];
    if (state.xAxisField === DATE_FIELD.DATE) {
        _xAxisData = getWidgetDateFields(state.granularity, state.dateRange.start, state.dateRange.end);
    } else {
        _xAxisData = Array.from(new Set(_slicedData.map((v) => v[state.xAxisField] as string)));
        _xAxisData = _xAxisData.slice(0, state.xAxisCount);
        if (Object.values(_etcData).some((v) => v > 0)) {
            _xAxisData.push('etc');
        }
    }
    state.xAxisData = _xAxisData;

    // get chart data
    const _seriesData: any[] = [];
    state.dataField?.forEach((field) => {
        _seriesData.push({
            name: field,
            type: 'bar',
            barMaxWidth: 24,
            barGap: 0,
            data: _xAxisData.map((d) => {
                const _data = _slicedData.find((v) => v[state.xAxisField] === d);
                return _data ? _data[field] : undefined;
            }),
        });
    });
    state.chartData = _seriesData;
};

const loadWidget = async (): Promise<Data|APIErrorToast> => {
    state.loading = true;
    const res = await fetchWidget();
    if (typeof res === 'function') return res;
    state.data = res;
    drawChart(state.data);
    state.loading = false;
    return state.data;
};

/* Watcher */
watch([() => state.chartData, () => chartContext.value], ([, chartCtx]) => {
    if (chartCtx) {
        state.chart = init(chartContext.value);
        state.chart.setOption(state.chartOptions, true);
    }
});

useResizeObserver(chartContext, throttle(() => {
    state.chart?.resize();
}, 500));
useWidgetInitAndRefresh({ props, emit, loadWidget });
defineExpose<WidgetExpose<Data>>({
    loadWidget,
});
</script>

<template>
    <widget-frame v-bind="widgetFrameProps"
                  v-on="widgetFrameEventHandlers"
    >
        <!--Do not delete div element below. It's defense code for redraw-->
        <div class="h-full">
            <div ref="chartContext"
                 class="h-full"
            />
        </div>
    </widget-frame>
</template>
