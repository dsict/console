import { getTextHighlightRegex } from '@cloudforet/mirinae';

import type {
    ListResponse, ListQuery, IEnumVariableModel,
    VariableModelConstructorConfig,
} from '@/lib/variable-models/_base/types';

export default class EnumVariableModel implements IEnumVariableModel {
    _meta = {
        key: '',
        name: '',
    };

    values: IEnumVariableModel['values'] = [];

    #response: ListResponse = { results: [] };

    constructor(config?: VariableModelConstructorConfig) {
        if (!config) return;
        if (config.values) this.values = config.values;
        if (config.key) this._meta.key = config.key;
        if (config.name) this._meta.name = config.name;
    }

    async list(query: ListQuery = {}): Promise<ListResponse> {
        let results = this.values;
        const filters = query.filters;
        let more = false;
        if (filters?.length) {
            results = results.filter((item) => filters.includes(item.key));
        }
        if (query.search) {
            const regex = getTextHighlightRegex(query.search);
            results = results.filter((item) => regex.test(item.name));
        }
        if (query.start !== undefined && query.limit !== undefined) {
            const end = query.start + query.limit - 1;
            more = end < results.length;
            results = results.slice(query.start - 1, end);
        }
        this.#response = { results, more };
        return this.#response;
    }
}
