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
                return filters.reduce((prev, property) => stream[property] == this.filters[property] && prev, true);
            });
        }
        return streams;
    }

    getParams() {
        //return StreamFilter.PARAM_FILTERS.map((p) => this.filters[p]);
        return `?game=${this.filters.game}&language=en&stream_type=live`;
    }
}
