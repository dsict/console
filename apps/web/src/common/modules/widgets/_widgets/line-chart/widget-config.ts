import type { WidgetConfig } from '@/common/modules/widgets/types/widget-config-type';


const lineChart: WidgetConfig = {
    widgetName: 'lineChart',
    meta: {
        title: 'Line Chart',
        sizes: ['md', 'full'],
    },
    requiredFieldsSchema: {
        granularity: {},
        dataField: {},
        xAxis: {
            options: {
                dataTarget: 'labels_info',
                defaultMaxCount: 5,
                max: 31,
            },
        },
    },
    optionalFieldsSchema: {
        legend: {
            options: {
                default: true,
            },
        },
        lineBy: {
            options: {
                dataTarget: 'labels_info',
                defaultMaxCount: 5,
                max: 10,
                defaultIndex: 0,
                excludeDateField: true,
            },
        },
        dateFormat: {
            options: {
                default: 'MMM DD, YYYY',
            },
        },
        displayAnnotation: {},
    },
};


export default lineChart;
