import { computed, reactive } from 'vue';

import { defineStore } from 'pinia';

import type { ConsoleFilter } from '@cloudforet/core-lib/query/type';
import { SpaceConnector } from '@cloudforet/core-lib/space-connector';
import { getCancellableFetcher } from '@cloudforet/core-lib/space-connector/cancallable-fetcher';

import type { ListResponse } from '@/schema/_common/api-verbs/list';
import type { MetricGetParameters } from '@/schema/inventory/metric/api-verbs/get';
import type { MetricListParameters } from '@/schema/inventory/metric/api-verbs/list';
import type { MetricModel } from '@/schema/inventory/metric/model';
import type { NamespaceGetParameters } from '@/schema/inventory/namespace/api-verbs/get';
import type { NamespaceModel } from '@/schema/inventory/namespace/model';

import { GRANULARITY, OPERATOR } from '@/services/asset-inventory/constants/metric-explorer-constant';
import { getInitialPeriodByGranularity } from '@/services/asset-inventory/helpers/metric-explorer-period-helper';
import type {
    Granularity, MetricNamespace, Operator, Period, RelativePeriod,
} from '@/services/asset-inventory/types/metric-explorer-type';


export const useMetricExplorerPageStore = defineStore('page-metric-explorer', () => {
    const state = reactive({
        namespaceListloading: false,
        metricListLoading: false,
        metricLoading: false,
        metricId: undefined as string|undefined,
        metric: undefined as MetricModel|undefined,
        namespaces: [] as NamespaceModel[],
        metricList: [] as MetricModel[],
        selectedNamespace: undefined as MetricNamespace|undefined,
        // query section
        granularity: GRANULARITY.MONTHLY as Granularity,
        period: getInitialPeriodByGranularity(GRANULARITY.MONTHLY)[0] as Period|undefined,
        relativePeriod: getInitialPeriodByGranularity(GRANULARITY.MONTHLY)[1] as RelativePeriod|undefined,
        enabledFiltersProperties: undefined as string[]|undefined,
        filters: {} as Record<string, string[]>,
        selectedGroupByList: [] as string[],
        selectedChartGroupBy: undefined as string|undefined,
        selectedOperator: OPERATOR.SUM as Operator,
    });
    const getters = reactive({
        groupByItems: computed<Array<{name: string, label: string}>>(() => {
            if (!state.metric?.label_keys?.length) return [];
            return state.metric.label_keys.map((label) => ({
                name: label.key,
                label: label.name,
            }));
        }),
        selectedGroupByItems: computed<Array<{name: string, label: string}>>(() => state.selectedGroupByList.map((groupBy) => ({
            name: groupBy,
            label: state.metric?.label_keys?.find((label) => label.key === groupBy)?.name ?? groupBy,
        }))),
        consoleFilters: computed<ConsoleFilter[]>(() => {
            const results: ConsoleFilter[] = [];
            Object.entries(state.filters ?? {}).forEach(([category, filterItems]) => {
                if (filterItems.length) {
                    results.push({
                        k: category,
                        v: filterItems,
                        o: '=',
                    });
                }
            });
            return results;
        }),
    });

    /* Mutations */
    const setGranularity = (granularity: Granularity) => {
        state.granularity = granularity;
    };
    const setPeriod = (period?: Period) => {
        state.period = period;
    };
    const setRelativePeriod = (relativePeriod?: RelativePeriod) => {
        state.relativePeriod = relativePeriod;
    };
    const setSelectedGroupByList = (groupByList: string[]) => {
        state.selectedGroupByList = groupByList;
    };
    const setSelectedChartGroupBy = (groupBy: string|undefined) => {
        state.selectedChartGroupBy = groupBy;
    };
    const setEnabledFiltersProperties = (enabledProperties: string[]) => {
        state.enabledFiltersProperties = enabledProperties;
    };
    const setFilters = (filters: Record<string, string[]>) => {
        state.filters = filters;
    };
    const setMetricId = (metricId?: string) => {
        state.metricId = metricId;
    };
    const setSelectedOperator = (operator: Operator) => {
        state.selectedOperator = operator;
    };

    /* Actions */
    const reset = () => {
        state.granularity = GRANULARITY.MONTHLY;
        state.period = getInitialPeriodByGranularity(GRANULARITY.MONTHLY)[0];
        state.relativePeriod = getInitialPeriodByGranularity(GRANULARITY.MONTHLY)[1];
        state.filters = {};
        state.selectedGroupByList = [];
        state.selectedChartGroupBy = undefined;
        state.selectedNamespace = undefined;
        state.enabledFiltersProperties = undefined;
        state.metricId = undefined;
        state.metric = undefined;
        state.metricList = [];
        state.namespaces = [];
        state.selectedOperator = OPERATOR.SUM;
    };
    const loadNamespaces = async () => {
        state.namespaceListloading = true;
        const fetcher = getCancellableFetcher(SpaceConnector.clientV2.inventory.namespace.list);
        try {
            const { response, status } = await fetcher<NamespaceGetParameters, ListResponse<NamespaceModel>>({});
            if (status === 'succeed') {
                state.namespaces = response.results || [];
                state.namespaceListloading = false;
            }
        } catch (e) {
            console.error(e);
            state.namespaces = [];
            state.namespaceListloading = false;
        }
    };
    const loadMetrics = async (namespaceId: string) => {
        if (!namespaceId) return;
        state.metricList = [];
        state.metricListLoading = true;
        try {
            const response = await SpaceConnector.clientV2.inventory.metric.list<MetricListParameters, ListResponse<MetricModel>>({
                namespace_id: namespaceId,
            });
            state.metricList = response.results ?? [];
        } catch (e) {
            state.metricList = [];
            console.error(e);
        } finally {
            state.metricListLoading = false;
        }
    };
    const loadMetricFetcher = getCancellableFetcher(SpaceConnector.clientV2.inventory.metric.get);
    const loadMetric = async () => {
        if (!state.metricId) return;
        state.metricLoading = true;
        try {
            const { status, response } = await loadMetricFetcher<MetricGetParameters, MetricModel>({
                metric_id: state.metricId,
            });
            if (status === 'succeed') {
                state.metric = response;
                state.metricLoading = false;
            }
        } catch (e) {
            state.metric = undefined;
            state.metricLoading = false;
            console.error(e);
        }
    };

    const actions = {
        reset,
        loadNamespaces,
        loadMetrics,
        loadMetric,
    };
    const mutations = {
        setGranularity,
        setPeriod,
        setRelativePeriod,
        setSelectedGroupByList,
        setSelectedChartGroupBy,
        setEnabledFiltersProperties,
        setFilters,
        setMetricId,
        setSelectedOperator,
    };

    return {
        state,
        getters,
        ...mutations,
        ...actions,
    };
});
