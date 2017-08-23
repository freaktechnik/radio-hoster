"use strict";

class HostScheduler {
    static get HOST_COOLDOWN() {
        return 30 * 60000;
    }

    constructor() {
        this.hostTimestamps = [];
    }

    onHost() {
        if(this.hostTimestamps.length === 3) {
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
        return this.hostTimestamps.length < 3 || this.hostTimestamps.some((t) => t < now - HostScheduler.HOST_COOLDOWN);
    }

    canHost(username, nextShow) {
        // decide if the channel should be hosted. Checks with schedule.
        if(this.shouldCheck()) {
            if(!nextShow) {
                return true;
            }

            let usedHosts = 0;
            for(const t of this.hostTimestamps) {
                if(t >= Date.now() - HostScheduler.HOST_COOLDOWN) {
                    ++usedHosts;
                }
            }
            if(usedHosts < 2) {
                return true;
            }

            return nextShow.channels.includes(username);
        }
        return false;
    }
}
module.exports = HostScheduler;
