/* global saveAs, Blob, BlobBuilder, console */
/* exported ics */

var ics = function() {
    'use strict';

    if (navigator.userAgent.indexOf('MSIE') > -1 && navigator.userAgent.indexOf('MSIE 10') == -1) {
        console.log('Unsupported Browser');
        return;
    }

    var SEPARATOR = (navigator.appVersion.indexOf('Win') !== -1) ? '\r\n' : '\n';
    var calendarEvents = [];
    var calendarStart = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0'
    ].join(SEPARATOR);
    var calendarEnd = SEPARATOR + 'END:VCALENDAR';

    var dateFormatter = function(date) {
        
    };

    return {
        /**
         * Returns events array
         * @return {array} Events
         */
        'events': function() {
            return calendarEvents;
        },

        /**
         * Returns calendar
         * @return {string} Calendar in iCalendar format
         */
        'calendar': function() {
            return calendarStart + SEPARATOR + calendarEvents.join(SEPARATOR) + calendarEnd;
        },

        /**
         * Add event to the calendar
         * @param  {string} subject     Subject/Title of event
         * @param  {string} description Description of event
         * @param  {string} location    Location of event
         * @param  {string} begin       Beginning date of event
         * @param  {string} stop        Ending date of event
         */
        'addEvent': function(subject, description, location, begin, stop, until, exclude) {
            // I'm not in the mood to make these optional... So they are all required
            if (typeof subject === 'undefined' ||
                typeof description === 'undefined' ||
                typeof location === 'undefined' ||
                typeof begin === 'undefined' ||
                typeof stop === 'undefined'
            ) {
                return false;
            };

            //TODO add time and time zone? use moment to format?
            var start_date = new Date(begin);
            var end_date = new Date(stop);
            var repeat_date;
            var exclude_date;

            var start_year = ("0000" + (start_date.getFullYear().toString())).slice(-4);
            var start_month = ("00" + ((start_date.getMonth() + 1).toString())).slice(-2);
            var start_day = ("00" + ((start_date.getDate()).toString())).slice(-2);
            var start_hours = ("00" + (start_date.getHours().toString())).slice(-2);
            var start_minutes = ("00" + (start_date.getMinutes().toString())).slice(-2);
            var start_seconds = ("00" + (start_date.getSeconds().toString())).slice(-2);

            var end_year = ("0000" + (end_date.getFullYear().toString())).slice(-4);
            var end_month = ("00" + ((end_date.getMonth() + 1).toString())).slice(-2);
            var end_day = ("00" + ((end_date.getDate()).toString())).slice(-2);
            var end_hours = ("00" + (end_date.getHours().toString())).slice(-2);
            var end_minutes = ("00" + (end_date.getMinutes().toString())).slice(-2);
            var end_seconds = ("00" + (end_date.getSeconds().toString())).slice(-2);

            if (until) {
                repeat_date = new Date(until)
                var repeat_year = ("0000" + (repeat_date.getFullYear().toString())).slice(-4);
                var repeat_month = ("00" + ((repeat_date.getMonth() + 1).toString())).slice(-2);
                var repeat_day = ("00" + ((repeat_date.getDate()).toString())).slice(-2);
                var repeat_hours = ("00" + (repeat_date.getHours().toString())).slice(-2);
                var repeat_minutes = ("00" + (repeat_date.getMinutes().toString())).slice(-2);
                var repeat_seconds = ("00" + (repeat_date.getSeconds().toString())).slice(-2);

                var repeat_time = 'T' + repeat_hours + repeat_minutes + repeat_seconds;

                var repeat = repeat_year + repeat_month + repeat_day + repeat_time;
            }

            if (exclude) {
                exclude_date = new Date(exclude);
                var exclude_year = ("0000" + (exclude_date.getFullYear().toString())).slice(-4);
                var exclude_month = ("00" + ((exclude_date.getMonth() + 1).toString())).slice(-2);
                var exclude_day = ("00" + ((exclude_date.getDate()).toString())).slice(-2);
                var exclude_hours = ("00" + (exclude_date.getHours().toString())).slice(-2);
                var exclude_minutes = ("00" + (exclude_date.getMinutes().toString())).slice(-2);
                var exclude_seconds = ("00" + (exclude_date.getSeconds().toString())).slice(-2);

                
                var exclude_time = 'T' + exclude_hours + exclude_minutes + exclude_seconds;

                var exclusion = exclude_year + exclude_month + exclude_day + exclude_time;
            }

            var start_time = "";
            var end_time = "";
            //hack for getting day-long events working
            if (start_date.getHours()   == 0 && 
                start_date.getMinutes() == 0 && 
                start_date.getSeconds() == 0 &&
                end_date.getHours()   == 0 && 
                end_date.getMinutes() == 0 && 
                end_date.getSeconds() == 0 ) {
                //don't include time, daylong event
            } else {
                //include time
                start_time = 'T' + start_hours + start_minutes + start_seconds;
                end_time = 'T' + end_hours + end_minutes + end_seconds;
            }

            var start = start_year + start_month + start_day + start_time;
            var end = end_year + end_month + end_day + end_time;
            
            //TODO exdate

            var calendarEvent = [
                'BEGIN:VEVENT',
                'CLASS:PUBLIC',
                'DESCRIPTION:' + description,
                'DTSTART;TZID=Australia/Melbourne:' + start];
            if (until) { calendarEvent.push("RRULE:FREQ=WEEKLY;UNTIL="+repeat); }
            if (exclude) { calendarEvent.push("EXDATE;TZID=Australia/Melbourne:"+exclusion); }
            calendarEvent = calendarEvent.concat([
                'DTEND;TZID=Australia/Melbourne:' + end,
                'LOCATION:' + location,
                'SUMMARY;LANGUAGE=en-us:' + subject,
                'TRANSP:TRANSPARENT',
                'END:VEVENT'
            ]);
            calendarEvent = calendarEvent.join(SEPARATOR);

            calendarEvents.push(calendarEvent);
            return calendarEvent;
        },

        /**
         * Download calendar using the saveAs function from filesave.js
         * @param  {string} filename Filename
         * @param  {string} ext      Extention
         */
        'download': function(filename, ext) {
            if (calendarEvents.length < 1) {
                return false;
            }

            ext = (typeof ext !== 'undefined') ? ext : '.ics';
            filename = (typeof filename !== 'undefined') ? filename : 'calendar';
            var calendar = calendarStart + SEPARATOR + calendarEvents.join(SEPARATOR) + calendarEnd;

            var blob;
            if (navigator.userAgent.indexOf('MSIE 10') === -1) { // chrome or firefox
                blob = new Blob([calendar]);
            } else { // ie
                var bb = new BlobBuilder();
                bb.append(calendar);
                blob = bb.getBlob('text/x-vCalendar;charset=' + document.characterSet);
            }
            saveAs(blob, filename + ext);
            return calendar;
        }
    };
};
