"use strict";

const StreamFilter = require("./lib/stream-filter"),
    StreamSchedule = require("./lib/stream-schedule"),
    HostScheduler = require("./lib/host-scheduler"),
    { default: Twitch } = require("twitch"),

    {
        CLIENT_ID, TOKEN, USERNAME
    } = process.env,
    LANGUAGE = "en",
    IGNORE_LIVE = require(`./data/ignore-livestate.${LANGUAGE}.json`),
    MINUTE = 60000,
    DEBUG_LOG_LEVEL = 1,

    RadioHoster = {
        hostScheduler: new HostScheduler(),
        streamSchedule: new StreamSchedule(LANGUAGE),
        client: Twitch.withCredentials(
            CLIENT_ID,
            TOKEN,
            null,
            {}
        ),
        filters: [
            /*new StreamFilter({
                game: "Gamescom 2017",
                languageCode: LANGUAGE,
                type: "live"
            }),*/
            new StreamFilter({
                game: "Talk Shows",
                languageCode: LANGUAGE,
                type: "live"
            }),
            new StreamFilter({
                game: "Music",
                type: "live"
            })
        ],
        async getStreams(filter) {
            const streamParams = filter.getParams(),
                streams = await this.client.streams.getStreams(...streamParams);
            return filter.filterStreams(streams);
        },
        getBestStream(streams) {
            const [ firstStream ] = streams;
            return firstStream.channel.name;
        },
        async isCurrentChannelLive() {
            if(this.currentChannel && !IGNORE_LIVE.includes(this.currentChannel)) {
                const currentStream = await this.client.streams.getStreamByChannel(this.currentChannel);
                return this.filters.some((f) => f.filters.game === currentStream.game) && !currentStream.channel.status.includes("24/7") && currentStream.type === "live";
            }
            return false;
        },
        showLive() {
            if(this.streamSchedule.showRunning()) {
                return this.getStreams(this.streamSchedule);
            }
            return false;
        },
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
        async setNextStream(login) {
            const chatClient = await this.client.getChatClient('default', DEBUG_LOG_LEVEL);
            try {
                await chatClient.host(login);
            }
            catch(e) {
                console.warn("Can't host", login, "atm");
            }
            this.hostScheduler.onHost();
            this.currentChannel = login;
            console.log("Now hosting", login);
        },
        async update() {
            if(this.hostScheduler.shouldCheck()) {
                const nextStream = await this.getNextStream(),
                    nextShow = this.streamSchedule.getNextScheduledShow();
                if(nextStream != this.currentChannel && this.hostScheduler.canHost(nextStream, nextShow)) {
                    await this.setNextStream(nextStream);
                }
            }
        },
        async init() {
            const chatClient = await this.client.getChatClient('default', DEBUG_LOG_LEVEL);
            chatClient.onHost((chan, target) => {
                this.currentChannel = target;
            });
            chatClient.onHostsRemaining((channel, remainingHosts) => {
                if(channel === USERNAME) {
                    this.hostScheduler.reportRemaining(remainingHosts);
                }
            });
            await chatClient.connect();
            await chatClient.join(`#${USERNAME}`);
            await this.update();
            setInterval(() => this.update().catch(console.error), MINUTE);
        }
    };

RadioHoster.init().catch(console.error);
