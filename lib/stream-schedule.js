"use strict";

const StreamFilter = require("./stream-filter"),

    MINUTE = 60,
    NONE = 0,
    BEFORE_MIDNIGHT = 23,
    LAST_WEEKDAY = 7,
    EQUAL = NONE,
    STEP = 1,
    SHOW_PADDING = 20;

/**
 * @typedef {{day: number, hour: number, minute: number}} DayTime
 */
/**
 * @typedef {{start: string, end: string, channels: string[]}} Show
 */

class StreamSchedule extends StreamFilter {
    /**
     * Split a string of the form "weekdayNumber hour:minute" into day, hour and minute.
     *
     * @param {string} daytime - String of the format "weekdayNumber hour:minute".
     * @returns {DayTime} Extracted day and time info.
     */
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

    /**
     * Remove the given amount of minutes from a DayTime.
     *
     * @param {DayTime} daytime - DayTime to remove minutes from.
     * @param {number} minutes - Minutes to remove.
     * @returns {DayTime} DayTime with the minutes removed. Same instance as was passed in.
     */
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

    /**
     * Compare two DayTimes.
     *
     * @param {DayTime} daytimeA - First DayTime to compare.
     * @param {DayTime} daytimeB - Second DayTime to compare.
     * @returns {number} Negative, if the first DayTime is after the second one, positive if the second one is later.
     */
    static compareDaytimes(daytimeA, daytimeB) {
        if(daytimeA.day != daytimeB.day) {
            return daytimeA.day - daytimeB.day;
        }

        if(daytimeA.hour != daytimeB.hour) {
            return daytimeA.hour - daytimeB.hour;
        }

        if(daytimeA.minute != daytimeB.minute) {
            return daytimeA.minute - daytimeB.minute;
        }

        return EQUAL;
    }

    /**
     * @param {string} language - Language to get stream schedule for.
     */
    constructor(language) {
        super({
            languageCode: language,
            game: '417752'
        });
        this.schedule = require(`../data/stream-schedule.${language}.json`);
    }

    /**
     * @returns {Show} Show that is next on the schedule.
     */
    getNextScheduledShow() {
        const now = new Date();
        let nextShow;
        for(const show of this.schedule) {
            const start = StreamSchedule.splitDaytime(show.start),
                end = StreamSchedule.splitDaytime(show.end);
            if((start.day === now.getUTCDay() || end.day === now.getUTCDay()) && end.hour > now.getUTCHours() && end.minute > now.getUTCMinutes()) {
                if(!nextShow || StreamSchedule.compareDaytimes(nextShow.dstart, start) > EQUAL) {
                    nextShow = show;
                    nextShow.dstart = start;
                }
            }
        }
        return nextShow;
    }

    /**
     * @returns {boolean} If there's currently a show on.
     */
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

    /**
     * @returns {HelixPaginatedStreamFilter} Filter params to get the stream of the next show.
     */
    getParams() {
        const nextShow = this.getNextScheduledShow();
        if(nextShow) {
            return {
                userName: nextShow.channels.join(","),
                game: this.game,
                language: this.languageCode,
                type: "live"
            };
        }
        return {};
    }
}
module.exports = StreamSchedule;
