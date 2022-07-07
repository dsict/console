import { Tags } from '@/models';

export interface CloudServiceTypeInfo {
    cloud_service_type_id: string;
    cloud_service_type_key: string;
    name: string;
    provider: string;
    group: string;
    service_code: string;
    is_primary: boolean;
    is_major: boolean;
    resource_type: string;
    metadata: any;
    labels: string[];
    tags: Tags;
}

export interface CloudServiceDetailPageParams {
    provider: string;
    group: string;
    name?: string;
}

/* History Tab */
export interface CloudServiceTimelineItem {
    id: string;
    record_id: string;
    date: string;
    color: string;
    title: string;
    count?: number;
    data?: { key: string, value?: any }[];
}
