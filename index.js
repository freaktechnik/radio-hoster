const Twitch = require("twitch");
const StaticAuthProvider = require("twitch/Auth/StaticAuthProvider");
const StreamFilter = require("./lib/stream-filter");

const { CLIENT_ID, TOKEN } = process.env;
const LANGUAGE = "en";

const RadioHoster = {
    client: new Twitch({
        authProvider: new StaticAuthProvider(CLIENT_ID, TOKEN)
    }),
    talkFilter: new StreamFilter({
        game: "Talk Show",
        languageCode: LANGUAGE,
        type: "live"
    }),
    musicFilter: new StreamFilter({
        game: "Music",
        type: "live"
    }),
    async getStreams(filter) {
        const streams = await this.client.streams.getStreams(...filter.getParams());
        return filter.filterStreams(streams);
    },
    getBestStream(streams) {
        return streams[0].channel.name;
    },
    async isCurrentChannelLive() {
        const currentStream = await this.client.streams.setStreamByChannel(this.currentChannel);
        return currentStream.stream && (currentStream.stream.game === this.talkFilter.filters.game || currentStream.stream.game === this.musicFilter.filters.game);
    },
    async getNextStream() {
        //TODO force streams based on schedule
        if(await this.isCurrentChannelLive()) {
            return this.currentChannel;
        }
        const talkStreams = await this.getStreams(this.talkFilter);
        if(talkStreams.length) {
            return this.getBestStream(talkStreams);
        }
        const musicStreams = await this.getStreams(this.musicFilter);
        return this.getBestStream(musicStreams);
    },
    async setNextStream(login) {
        const chat = this.client.getChatClient();
        chat.host(login);
        this.currentChannel = login;
    },
    async update() {
        const nextStream = await this.getNextStream();
        if(nextStream != this.currentChannel) {
            await this.setNextStream(nextStream);
        }
    }
};
