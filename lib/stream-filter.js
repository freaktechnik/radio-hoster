"use strict";

const PAGE = 1,
    LIMIT = 1;

module.exports = class StreamFilter {
    static get PARAM_FILTERS() {
        return [
            "channels",
            "game",
            "languageCode",
            "type"
        ];
    }

    constructor(filters = {}) {
        this.filters = Object.assign({
            type: 'live',
            languageCode: null,
            game: ''
        }, filters);
    }

    filterStreams(streams) {
        const filters = Object.keys(this.filters)
            .filter((p) => !StreamFilter.PARAM_FILTERS.includes(p));
        if(filters.length) {
            return streams.filter((stream) => filters.every((property) => stream[property] == this.filters[property]));
        }
        return streams;
    }

    getParams() {
        return [
            null,
            this.filters.game,
            this.filters.languageCode,
            this.filters.live,
            PAGE,
            LIMIT
        ];
    }
};
