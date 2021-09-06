const HOST_COOLDOWN = 1800000,
    AVAILABLE_HOSTS = 3,
    NO_HOSTS = 0,
    ONE_HOST = 1;
/**
 * @typedef {{start: string, end: string, channels: string[]}} Show
 */

export default class HostScheduler {
    static get HOST_COOLDOWN() {
        return HOST_COOLDOWN;
    }

    constructor() {
        this.hostTimestamps = [];
    }

    onHost() {
        if(this.hostTimestamps.length === AVAILABLE_HOSTS) {
            let oldestTimestamp;
            for(const timestamp of this.hostTimestamps) {
                if(!oldestTimestamp || timestamp < oldestTimestamp) {
                    oldestTimestamp = timestamp;
                }
            }
            this.hostTimestamps = this.hostTimestamps.filter((timestamp) => timestamp !== oldestTimestamp);
        }
        this.hostTimestamps.push(Date.now());
    }

    /**
     * @returns {boolean} If it's worth it to look for a new channel to host.
     */
    shouldCheck() {
        const now = Date.now();
        return this.hostTimestamps.length < AVAILABLE_HOSTS || this.hostTimestamps.some((t) => t < now - HostScheduler.HOST_COOLDOWN);
    }

    /**
     * @returns {number} Number of hosts that remain for the current period.
     */
    getAvailableHosts() {
        const now = Date.now(),
            usedHosts = this.hostTimestamps.reduce((total, timestamp) => total + (timestamp >= now - HostScheduler.HOST_COOLDOWN ? ONE_HOST : NO_HOSTS), NO_HOSTS);
        return AVAILABLE_HOSTS - usedHosts;
    }

    /**
     * Is there a host command available.
     *
     * @param {string} username - User name that shall be hosted.
     * @param {Show} nextShow - Next show on the schedule.
     * @returns {boolean} When true, the user can be hosted.
     */
    canHost(username, nextShow) {
        // decide if the channel should be hosted. Checks with schedule.
        if(this.shouldCheck()) {
            if(!nextShow) {
                return true;
            }

            const availableHosts = this.getAvailableHosts();
            if(availableHosts > ONE_HOST) {
                return true;
            }

            return nextShow.channels.includes(username);
        }
        return false;
    }

    /**
     * Update remaining amount of host commands.
     *
     * @param {number} count - Amount of remaining hosts.
     * @returns {undefined}
     */
    reportRemaining(count) {
        if(count < this.getAvailableHosts()) {
            this.onHost();
        }
        else if(count > this.getAvailableHosts()) {
            console.warn("Scheduler has less available hosts accounted for than Twitch");
        }
    }
}
