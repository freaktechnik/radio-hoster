const StreamFilter = require("./lib/stream-filter");
const tmi = require("tmi.js");

//TODO avoid surpassing host rate/handle that -> 3 hosts per 30mins -> 1 host per 10mins

const { CLIENT_ID, TOKEN, USERNAME } = process.env;
const LANGUAGE = "en";

const IGNORE_LIVE = require("./data/ignore-livestate."+LANGUAGE+".json");

const headers = {
    "Client-ID": CLIENT_ID,
    "Accept": "application/vnd.twitchtv.v3+json"
};

const RadioHoster = {
    chatClient: tmi.client({
        options: {
            clientId: CLIENT_ID
        },
        connection: {
            secure: true,
            reconnect: true
        },
        identity: {
            username: USERNAME,
            password: `oauth:${TOKEN}`
        },
        channels: [
            `#${USERNAME}`
        ]
    }),
    filters: [
        new StreamFilter({
            game: "Gamescom 2017",
            languageCode: LANGUAGE,
            type: "live"
        }),
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
        const streams = await new Promise((resolve, reject) => {
            this.chatClient.api({
                url: `https://api.twitch.tv/kraken/streams${filter.getParams()}`,
                headers
            }, (err, res, body) => {
                if(err) {
                    reject(err);
                    return;
                }
                resolve(body.streams);
            });
        });
        return filter.filterStreams(streams);
    },
    getBestStream(streams) {
        return streams[0].channel.name;
    },
    async isCurrentChannelLive() {
        if(this.currentChannel && !IGNORE_LIVE.includes(this.currentChannel)) {
            const currentStream = await new Promise((resolve, reject) => {
                this.chatClient.api({
                    url: `https://api.twitch.tv/kraken/streams/${this.currentChannel}`,
                    headers
                }, (err, res, body) => {
                    if(err) {
                        reject(err);
                        return;
                    }
                    resolve(body);
                });
            });
            return currentStream.stream && this.filters.some((f) => f.filters.game === currentStream.stream.game);
        }
        return false;
    },
    async getNextStream() {
        console.log("### Updating host ###");
        //TODO force streams based on schedule
        console.log("Checking if current channel is still live...")
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
        //const chat = this.client.getChatClient();
        //await chat.send(`PRIVMSG #${chat._userName} .host ${login}`);
        await this.chatClient.host(USERNAME, login).catch(() => console.log("Can't host", login, "atm"));
        console.log("Now hosting", login);
    },
    async update() {
        const nextStream = await this.getNextStream();
        if(nextStream != this.currentChannel) {
            await this.setNextStream(nextStream);
        }
    },
    init() {
        this.chatClient.connect();
        this.chatClient.on("connected", () => this.update());
        this.chatClient.on("hosting", (c, target) => {
            this.currentChannel = target;
        });
        setInterval(() => this.update(), 60000);
    }
};

RadioHoster.init();
