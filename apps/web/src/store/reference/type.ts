export interface ReferenceItem<Data = Record<string, any>> {
    key?: string;
    label?: string;
    name?: string;
    color?: string;
    icon?: string;
    provider?: string;
    continent?: {
        continent_code?: string;
        continent_label?: string;
        latitude?: number;
        longitude?: number;
    };
    latitude?: string;
    longitude?: string;
    data?: Data;
    description?: string;
    link?: string;
}

export type ReferenceMap<Item extends ReferenceItem = ReferenceItem> = Record<string, Item>;

export interface ReferenceState<Items = Record<string, any>> {
    items: Items;
}

export interface ReferenceRootState {
    isAllLoaded: boolean;
}

export interface ReferenceLoadOptions {
    lazyLoad?: boolean;
    force?: boolean;
}

export interface ReferenceTypeInfo {
    type: string; // 'project'
    key: string; // project_id
    name: string; // Project
    referenceMap: ReferenceMap;
}
