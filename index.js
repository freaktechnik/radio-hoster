const StreamFilter = require("./lib/stream-filter");
const tmi = require("tmi.js");

const { CLIENT_ID, TOKEN, USERNAME } = process.env;
const LANGUAGE = "en";

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
    talkFilter: new StreamFilter({
        game: "Talk+Shows",
        languageCode: LANGUAGE,
        type: "live"
    }),
    musicFilter: new StreamFilter({
        game: "Music",
        type: "live"
    }),
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
        if(this.currentChannel) {
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
            return currentStream.stream && (currentStream.stream.game === this.talkFilter.filters.game || currentStream.stream.game === this.musicFilter.filters.game);
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
        console.log("Getting most popular talk show...");
        const talkStreams = await this.getStreams(this.talkFilter);
        if(talkStreams && talkStreams.length) {
            return this.getBestStream(talkStreams);
        }
        console.log("Getting most popular music stream...");
        const musicStreams = await this.getStreams(this.musicFilter);
        if(musicStreams && musicStreams.length) {
            return this.getBestStream(musicStreams);
        }
        console.log("Nothing to do.");
        return this.currentChannel;
    },
    async setNextStream(login) {
        //const chat = this.client.getChatClient();
        //await chat.send(`PRIVMSG #${chat._userName} .host ${login}`);
        await this.chatClient.host(USERNAME, login);
        console.log("Now hosting", login);
        this.currentChannel = login;
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
        setInterval(() => this.update(), 60000);
    }
};

RadioHoster.init();
