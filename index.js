"use strict";

//TODO filter based on some tags?

const StreamFilter = require("./lib/stream-filter"),
    StreamSchedule = require("./lib/stream-schedule"),
    HostScheduler = require("./lib/host-scheduler"),
    { default: Twitch } = require("twitch"),
    { default: TwitchChatClient } = require("twitch-chat-client"),

    {
        CLIENT_ID, TOKEN, USERNAME
    } = process.env,
    LANGUAGE = "en",
    IGNORE_LIVE = require(`./data/ignore-livestate.${LANGUAGE}.json`),
    MINUTE = 60000;

Twitch.withCredentials(CLIENT_ID, TOKEN).then((client) => {
    const RadioHoster = {
        hostScheduler: new HostScheduler(),
        streamSchedule: new StreamSchedule(LANGUAGE),
        client,
        chatClient: TwitchChatClient.forTwitchClient(client, {
            legacyScopes: true
        }),
        filters: [
            /*new StreamFilter({
                game: "Gamescom 2017",
                languageCode: LANGUAGE,
                type: "live"
            }),*/
            new StreamFilter({
                game: "417752", // Talk Shows & Podcasts
                languageCode: LANGUAGE,
                type: "live"
            }),
            new StreamFilter({
                game: "26936", // Music and stuff
                type: "live"
            })
        ],
        /**
         * @param {StreamFilter} filter - What to filter streams by.
         * @returns {Promise<HelixStream[]>} Streams found based on filter.
         */
        async getStreams(filter) {
            const streamParams = filter.getParams(),
                streams = await this.client.helix.streams.getStreams(streamParams).getNext();
            return filter.filterStreams(streams);
        },
        /**
         * Get the best matching stream's user name.
         *
         * @param {HelixStream[]} streams - List of candidates.
         * @returns {Promise<string>} User name of the best stream.
         */
        async getBestStream(streams) {
            const [ firstStream ] = streams,
                user = await firstStream.getUser();
            return user.name;
        },
        /**
         * @returns {Promise<string>} ID of the currently hosted user.
         */
        async currentId() {
            if(!this._cachedId || this._cachedId.username != this.currentChannel) {
                this._cachedId = {
                    username: this.currentChannel
                };
                const user = await this.client.helix.users.getUserByName(this.currentChannel);
                this._cachedId.id = user.id;
            }
            return this._cachedId.id;
        },
        /**
         * @returns {Promise<boolean>} If the currently hosted channel should be considered live.
         */
        async isCurrentChannelLive() {
            if(this.currentChannel && !IGNORE_LIVE.includes(this.currentChannel)) {
                const currentId = await this.currentId(),
                    currentStream = await this.client.helix.streams.getStreamByUserId(currentId);
                return currentStream && this.filters.some((f) => f.filters.game === currentStream.gameId) && !currentStream.title.includes("24/7") && currentStream.type === "live";
            }
            return false;
        },
        /**
         * @returns {Promise<HelixStream[]|false>} Streams to show based on schedule.
         */
        async showLive() {
            if(this.streamSchedule.showRunning()) {
                return this.getStreams(this.streamSchedule);
            }
            return false;
        },
        /**
         * @returns {Promise<string>} User name to host.
         */
        async getNextStream() {
            console.log("### Updating host ###");
            const showStream = await this.showLive();
            if(showStream && showStream.length) {
                return this.getBestStream(showStream);
            }
            console.log("Checking if current channel is still live...");
            if(await this.isCurrentChannelLive()) {
                return this.currentChannel;
            }
            for(const filter of this.filters) {
                console.log("Getting most popular", filter.filters.game, "stream...");
                const streams = await this.getStreams(filter);
                if(streams && streams.length) {
                    return this.getBestStream(streams);
                }
            }
            console.log("Nothing to do.");
            return this.currentChannel;
        },
        /**
         * Host stream.
         *
         * @param {string} login - User name of the stream to host.
         * @returns {Promise} Resolves once stream is hosted.
         */
        async setNextStream(login) {
            try {
                await this.chatClient.host(login);
                this.hostScheduler.onHost();
                this.currentChannel = login;
                console.log("Now hosting", login);
            }
            catch(e) {
                console.warn("Can't host", login, "atm");
            }
        },
        /**
         * @returns {Promise} Resolves when all operations are done.
         */
        async update() {
            if(this.hostScheduler.shouldCheck()) {
                const nextStream = await this.getNextStream(),
                    nextShow = this.streamSchedule.getNextScheduledShow();
                if(nextStream != this.currentChannel && this.hostScheduler.canHost(nextStream, nextShow)) {
                    await this.setNextStream(nextStream);
                }
            }
        },
        /**
         * @returns {Promise} Resolves when the initial channel is hosted.
         */
        async init() {
            this.chatClient.onHost((chan, target) => {
                if(chan.endsWith(USERNAME)) {
                    this.currentChannel = target;
                }
            });
            this.chatClient.onHostsRemaining((channel, remainingHosts) => {
                if(channel.endsWith(USERNAME)) {
                    this.hostScheduler.reportRemaining(remainingHosts);
                }
            });
            await this.chatClient.connect();
            await this.chatClient.waitForRegistration();
            await this.chatClient.join(`#${USERNAME}`);
            await this.update();
            setInterval(() => this.update().catch(console.error), MINUTE);
        }
    };

    return RadioHoster.init();
})
    .catch(console.error);
