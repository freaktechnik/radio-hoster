"use strict";

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
        this.filters = filters;
    }

    filterStreams(streams) {
        const filters = Object.keys(this.filters)
            .filter((p) => !StreamFilter.PARAM_FILTERS.includes(p));
        if(filters.length) {
            return streams.filter((stream) => {
                if(this.filters.languageCode && stream.channel.broadcaster_language != this.filters.languageCode) {
                    return false;
                }
                return filters.every((property) => stream[property] == this.filters[property]);
            });
        }
        return streams;
    }

    getParams() {
        //return StreamFilter.PARAM_FILTERS.map((p) => this.filters[p]);
        return `?game=${this.filters.game.replace(" ", "+")}&language=en&stream_type=live&limit=1`;
    }
};
