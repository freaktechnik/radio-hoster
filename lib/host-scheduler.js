"use strict";

const HOST_COOLDOWN = 1800000,
    AVAILABLE_HOSTS = 3,
    NO_HOSTS = 0,
    ONE_HOST_REMAINING = 2;

class HostScheduler {
    static get HOST_COOLDOWN() {
        return HOST_COOLDOWN;
    }

    constructor() {
        this.hostTimestamps = [];
    }

    onHost() {
        if(this.hostTimestamps.length === AVAILABLE_HOSTS) {
            let oldestTimestamp;
            for(const i in this.hostTimestamps) {
                if(!oldestTimestamp || this.hostTimestamps[i] < oldestTimestamp) {
                    oldestTimestamp = i;
                }
            }
            this.hostTimestamps = this.hostTimestamps.filter((t, i) => i !== oldestTimestamp);
        }
        this.hostTimestamps.push(Date.now());
    }

    shouldCheck() {
        const now = Date.now();
        return this.hostTimestamps.length < AVAILABLE_HOSTS || this.hostTimestamps.some((t) => t < now - HostScheduler.HOST_COOLDOWN);
    }

    canHost(username, nextShow) {
        // decide if the channel should be hosted. Checks with schedule.
        if(this.shouldCheck()) {
            if(!nextShow) {
                return true;
            }

            let usedHosts = NO_HOSTS;
            for(const t of this.hostTimestamps) {
                if(t >= Date.now() - HostScheduler.HOST_COOLDOWN) {
                    ++usedHosts;
                }
            }
            if(usedHosts < ONE_HOST_REMAINING) {
                return true;
            }

            return nextShow.channels.includes(username);
        }
        return false;
    }
}
module.exports = HostScheduler;
