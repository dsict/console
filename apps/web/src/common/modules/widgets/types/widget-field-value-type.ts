import type {
    COLOR_SCHEMA, DATE_FORMAT, NUMBER_FORMAT, DATA_FIELD_HEATMAP_COLOR,
} from '@/common/modules/widgets/_constants/widget-field-constant';


export interface Icon {
    name: string;
    label: string;
}
// Field Value Options
export interface IconValue {
    icon: Icon;
    color: string;
}

export type ComparisonFormat = 'all'|'percent'|'fixed';
export interface ComparisonValue {
    decreaseColor?: string;
    increaseColor?: string;
    format?: ComparisonFormat;
}

export interface ProgressBarValue {
    fieldName: string;
    basisField?: string;
    totalField?: string;
    formatRules?: FormatRulesValue[];
    baseColor?: string;
}
export interface FormatRulesValue {
    threshold?: number;
    color: string;
}
export interface LineByValue {
    value: string;
    count: number;
}
export interface StackByValue {
    value: string;
    count: number;
}
export interface CategoryByValue {
    value: string;
    count: number;
}
export interface XAxisValue {
    value: string;
    count: number;
}
export interface YAxisValue {
    value: string;
    count: number;
}
export interface TableDataFieldValue {
    fieldType: 'dynamicField' | 'staticField';
    value?: string | string[];
    criteria?: string;
    count: number;
}
export interface GroupByValue {
    value?: string | string[];
    count?: number;
}

export interface TotalValue {
    toggleValue: boolean;
    freeze: boolean;
}

export interface WidgetHeaderValue {
    toggleValue: boolean;
    title?: string;
    description?: string;
}

export type ColorValue = typeof COLOR_SCHEMA[keyof typeof COLOR_SCHEMA];
export interface ColorSchemaValue {
    colorName: keyof typeof COLOR_SCHEMA;
    colorValue: ColorValue;
}

export type DateFormat = keyof typeof DATE_FORMAT;
export interface DateFormatValue {
    value: DateFormat;
}

export type NumberFormat = typeof NUMBER_FORMAT[keyof typeof NUMBER_FORMAT];
export interface NumberFormatValue {
    [key: string]: {
        format: NumberFormat;
        customNumberFormat?: string;
    };
}

export type DataFieldHeatmapColor = keyof typeof DATA_FIELD_HEATMAP_COLOR;
export interface DataFieldHeatmapColorValue {
    [key: string]: {
        value: DataFieldHeatmapColor;
    };
}

export interface DisplayAnnotationValue {
    toggleValue: boolean;
    annotation?: string;
}

export interface DisplaySeriesLabelValue {
    toggleValue: boolean;
    position?: 'left' | 'center' | 'right';
    rotate?: number;
}

export type WidgetFieldValues = string | string[] | number | boolean | ComparisonValue[] | ProgressBarValue | FormatRulesValue[]
    | LineByValue | StackByValue | CategoryByValue | GroupByValue
    | XAxisValue | YAxisValue | TableDataFieldValue | IconValue | TotalValue | ColorSchemaValue
    | WidgetHeaderValue | DateFormatValue | NumberFormatValue | DataFieldHeatmapColorValue
    | DisplayAnnotationValue | DisplaySeriesLabelValue;
