Change Log
==========

v0.6 - 2014-03-16
-----------------

* Added Export function to take saved data from LocalStorage and save it as a file.
* Added Import function for accepting data from the Export function.
* Added/fixed editing of user created tables.
    * You should now be able to edit (edit link is in the info modal) any tables you add to the app.
* Added Guided/Freeform switch for Create Table form.
	* Guided gives you fields broken out, but a more limited customization/feature set.
	* Guided will also accept html and bookmarklet generators.
	* Freeform is just for JSON objects, so more complicated but with all the features available.
* Improvements for display and usability at various screen widths
	* Changed nav tabs to navbar so it will collapse into a menu at narrow screen widths, also group some tabs into a dropdown to improve nav width in non-collapsed state.
    * Modals now have a close button at the bottom of the modal.
    * Some table columns disappear at narrow widths to keep tables from horizontally scrolling.
    * A bunch of pages broken into columns at wider screens.
* Added simple keyword search filter for Random Tables list.
* Fixed issue with the Random Table sorting being case sensitive (which messed up the title sort).

v0.5 - 2014-03-08
-----------------

* Updated Dungeon generator to better use RandomTables, improve editing, and use appsettings for which tables to use.
* Updated spell list to use RandomTables. Treasure now uses random spell list where appropriate for selecting spell scrolls.
* Updated the Create Table form to better handle non-JSON formatting (removed it from accepting JSON formatting for now). You can now add subtables, reference those subtables from results, weight results in different ways, and input html (that will get parsed into linebreaks).

v0.4 - 2014-03-04
-----------------

* Improved tag filtering on Random Tables (you can use multiple tags at a time now and clear them individually) and added column sorting (though it's mostly only useful for title sort as sorting by tags or description seems useless).
* Long/large Random Tables will break into two columns when viewing the full tables (also increased width of that modal for easier reading).
* Fixes to some broken NPC elements caused by the last update. Moved more of the process into RandomTable models/methods and the related collection. This should increase flexibility further along for adding and using custom tables for personality/appearance/goals/occupation of NPCs.

v0.3 - 2014-03-02
-----------------

* Added a way to import/save user's own tables. Right now you it either accepts a full JSON object or a simple one entry per line text format.
* Added code documentation with JSDoc3 commenting.
* Cleaned up RandomTable class and AppRandomizer functioning to be, hopefully, simpler and more consistent.
* Moved more of the pre-RandomTable stuff into the RandomTable format/class (like NPC personalities, appearance, goals, and occupations).
* More wilderness encounter tables (mostly in-process).
* Added the "list table" function for complex tables. It should show all the tables and subtables now in a semi-usable format. (Depending on the weight values, it might not convert to real dice rolls.)


v0.2 - 2014-02-24
-----------------

* Lots of stuff, but since no one really saw v0.1, I'm not going to list it all here.