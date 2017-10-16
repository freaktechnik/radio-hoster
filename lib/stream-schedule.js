"use strict";

const MINUTE = 60,
    NONE = 0,
    BEFORE_MIDNIGHT = 23,
    LAST_WEEKDAY = 7,
    SMALLER = -1,
    BIGGER = 1,
    EQUAL = NONE,
    STEP = BIGGER,
    SHOW_PADDING = 20;

class StreamSchedule {
    static splitDaytime(daytime) {
        const [
                day,
                time
            ] = daytime.split(" "),
            [
                hour,
                minute
            ] = time.split(":");
        return {
            day: parseInt(day, 10),
            hour: parseInt(hour, 10),
            minute: parseInt(minute, 10)
        };
    }

    static removeMinutes(daytime, minutes) {
        let day, hour, minute;
        if(daytime.minute < minutes) {
            minute = MINUTE - minutes + daytime.minute;
            if(daytime.hour === NONE) {
                hour = BEFORE_MIDNIGHT;
                if(daytime.day === NONE) {
                    day = LAST_WEEKDAY;
                }
                else {
                    day = daytime.day - STEP;
                }
            }
            else {
                hour = daytime.hour - STEP;
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
            return SMALLER;
        }
        else if(daytimeA.day > daytimeB.day) {
            return BIGGER;
        }

        if(daytimeA.hour < daytimeB.hour) {
            return SMALLER;
        }
        else if(daytimeA.hour > daytimeB.hour) {
            return BIGGER;
        }

        if(daytimeA.minute < daytimeB.minute) {
            return SMALLER;
        }
        else if(daytimeA.minute > daytimeB.minute) {
            return BIGGER;
        }

        return EQUAL;
    }

    constructor(language) {
        this.language = language;
        this.schedule = require(`../data/stream-schedule.${language}.json`);
    }

    getNextScheduledShow() {
        const now = new Date();
        let nextShow;
        for(const show of this.schedule) {
            const start = StreamSchedule.splitDaytime(show.start),
                end = StreamSchedule.splitDaytime(show.end);
            if((start.day === now.getUTCDay() || end.day === now.getUTCDay()) && end.hour > now.getUTCHours() && end.minute > now.getUTCMinutes()) {
                if(!nextShow || StreamSchedule.compareDaytimes(nextShow.dstart, start) === BIGGER) {
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
                }, SHOW_PADDING);
            return StreamSchedule.compareDaytimes(nowTime, nextShow) <= EQUAL;
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
