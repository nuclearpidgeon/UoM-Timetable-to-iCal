UoM-Timetable-to-iCal
=====================

Chrome Extension that converts the University of Melbourne timetable page into an iCalendar/.ics file

## How it works

`contentscript.js` runs on the UoM timetable page and is used to scrape your timetable data declaratively using jQuery. `ics.js` is then utilised to pack the class information into an iCalendar file. This is all controlled and triggered from `popup.html`/`popup.js`, which allows you to configure some of the settings.

## How to use it

Whenever you reach the UoM timetable page, an icon will appear in the address bar. Click on it to bring up the settings popup, then click the 'Create Timetable' button to trigger the script and generate your iCal file.

## Development notes

It can be useful to test the plugin on a saved local copy of a timetable - to do this, edit the manifest.json file to require permissions for file:// URLs that will cover the location of the saved copy (e.g. "file://*/UoM-Timetable-to-iCal/extension/test/*") and then reload the plugin in development mode.

## Credits

* **ncwell** on GitHub for making the [ics.js](https://github.com/nwcell/ics.js/) library. Apologies for making an absolute mess of it adding in the ability to do repeats and exclusions - I promise I'll tidy it up and send a pull request soon.
* [jQuery](http://www.jquery.com/) for being the greatest thing since sliced bread.
* **Google** for developing the Chrome extension framework and store.
