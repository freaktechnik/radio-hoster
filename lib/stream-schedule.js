"use strict";

class StreamSchedule {
    static splitDaytime(daytime) {
        const [ day, time ] = daytime.split(" "),
            [ hour, minute ] = time.split(":");
        return {
            day: parseInt(day, 10),
            hour: parseInt(hour, 10),
            minute: parseInt(minute, 10)
        };
    }

    static removeMinutes(daytime, minutes) {
        let day, hour, minute;
        if(daytime.minute < minutes) {
            minute = 60 - minutes + daytime.minute;
            if(daytime.hour === 0) {
                hour = 23;
                if(daytime.day === 0) {
                    day = 7;
                }
                else {
                    day = daytime.day - 1;
                }
            }
            else {
                hour = daytime.hour - 1;
            }
        }
        else {
            minute = daytime.minute - minutes;
        }
        return {
            day,
            hour,
            minute
        };
    }

    static compareDaytimes(daytimeA, daytimeB) {
        if(daytimeA.day < daytimeB.day) {
            return -1;
        }
        else if(daytimeA.day > daytimeB.day) {
            return 1;
        }
        else {
            if(daytimeA.hour < daytimeB.hour) {
                return -1;
            }
            else if(daytimeA.hour > daytimeB.hour) {
                return 1;
            }
            else {
                if(daytimeA.minute < daytimeB.minute) {
                    return -1;
                }
                else if(daytimeA.minute > daytimeB.minute) {
                    return 1;
                }
                else {
                    return 0;
                }
            }
        }
    }

    constructor(language) {
        this.language = language;
        this.schedule = require("../data/stream-schedule." + language + ".json");
    }

    getNextScheduledShow() {
        const now = new Date();
        let nextShow;
        for(const show of this.schedule) {
            const start = StreamSchedule.splitDaytime(show.start),
                end = StreamSchedule.splitDaytime(show.end);
            if((start.day === now.getUTCDay() || end.day === now.getUTCDay()) && end.hour > now.getUTCHours() && end.minute > now.getUTCMinutes()) {
                if(!nextShow || StreamSchedule.compareDaytimes(nextShow.dstart, start) === 1) {
                    nextShow = show;
                    nextShow.dstart = start;
                }
            }
        }
        return nextShow;
    }

    showRunning() {
        const nextShow = this.getNextScheduledShow();
        if(nextShow) {
            const now = new Date(),
                nowTime = StreamSchedule.removeMinutes({
                    day: now.getUTCDay(),
                    hour: now.getUTCHours(),
                    minute: now.getUTCMinutes()
                }, 20);
            return StreamSchedule.compareDaytimes(nowTime, nextShow) <= 0;
        }
        return false;
    }

    getParams() {
        const nextShow = this.getNextScheduledShow();
        if(nextShow) {
            return `?channels=${nextShow.channels.join(",")}&game=Talk Shows&broadcaster_language=${this.language}&stream_type=live`;
        }
        return "";
    }

    filterStreams(streams) {
        return streams;
    }
}
module.exports = StreamSchedule;
