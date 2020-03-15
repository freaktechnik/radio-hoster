"use strict";

const FILTER_MAP = {
    languageCode: 'language',
    game: 'gameId'
};

/**
 * @typedef {{type?: 'live', languageCode?: string|null, game?: string, channels?: string[]}} Filter
 */

module.exports = class StreamFilter {
    static get PARAM_FILTERS() {
        return [
            "channels",
            "game",
            "languageCode",
            "type"
        ];
    }

    /**
     * Filter for Twitch streams. Filters both at the API call level and after.
     *
     * @param {Filter} filters - Filter parameters to filter by.
     */
    constructor(filters = {}) {
        this.filters = Object.assign({
            type: 'live',
            languageCode: null,
            game: ''
        }, filters);
    }

    /**
     * Filter streams returned by an API call.
     *
     * @param {twitch.HelixStream[]} streams - Streams returned by the API.
     * @returns {twitch.HelixStream[]} Streams that matched the filter.
     */
    filterStreams(streams) {
        const filters = Object.keys(this.filters)
            .filter((p) => !StreamFilter.PARAM_FILTERS.includes(p));
        if(filters.length) {
            return streams.filter((stream) => filters.every((property) => {
                let targetProperty = property;
                if(FILTER_MAP.includes(property)) {
                    targetProperty = FILTER_MAP[property];
                }
                return stream[targetProperty] == this.filters[property];
            }));
        }
        return streams;
    }

    /**
     * Parameters for the API call.
     *
     * @returns {HelixStreamFilter} Parameters to pass to the API.
     */
    getParams() {
        return {
            game: this.filters.game,
            language: this.filters.languageCode,
            type: this.filters.live
        };
    }
};
