Change Log
==========

v0.87 - 2015-xx-xx
------------------

* Improvements to the Markov chains for name generator
* updated jquery to 213

v0.86 - 2015-02-15
------------------

* Simplified the cross-table references to just use `{{table:TABLENAME:SUBTABLENAME}}` or `{{table:this:SUBTABLENAME}}`
* Added settings for:
    * Mission tables.
    * NPC goals field.
    * Default hex dressing
* Improved format of NPCs for better copy and pasting (as plain text).
* Added import/export of settings.
* Added a few new tables to the random tables list.
* A bunch of bug fixes, minor UI improvements, and code clean-up.
* Added `hide_desc` as an option on a table's `print` setting.
* Added more name options including the option to use Markov chains to create new names based on the names list.

v0.85 - 2014-09-05
------------------

* Some fixes for using tokens in results.
    * You can now use {{table:this:subtable}} to roll a result on a subtable of the current table. (Handy for creating concatenations from subtables, i.e. "The {{table:this:adjectives}} {{table:this:nouns}}".)
    * Fixed roll token so it can be used as {{roll:d20}} without an integer preceding the "d".
* Added monster tab that lists out monsters.
	* Currently offers a 5e monster list/index for available monsters.
* Improvements to the Wilderness feature.
    * You can pick different tables (tagged "encounters") for different terrain types. They will also be used for hexdressing if there is a "hexdressing" subtable.
* Improvements to the Mission generator.
* Added a bunch of tables related to my in-progress colonial america-esque setting.
* A few more CSS changes to make things easier to use on narrow screens (tablet/phone). (Still testing Android app.)

v0.8 - 2014-09-01
-----------------

* Added a standalone name generator (separate from the NPC generator) that creates lists of names.
* Added Japanese and Turkish names to the default data.
* Added Mission generator.
* Added a bunch of new tables for my fantasy colonial america-esque campaign. Most should have broader relevancy though.
* Started adding 5e stuff (monsters and rules for NPC generation) (incomplete).

v0.7 - 2014-03-23
-----------------

* Updated the modal for rolling on a table to allow for the generation of results from subtables.
* Design change: Updated the modals to have form buttons in the footer to save vertical space.
* Design change: NPC, Wilderness, and Dungeon pages redesigned to be more concise and more mobile friendly. This includes moving the "new" results into the saved list and changing the saved list into accordion panels that expand to show full details of the item.
* NPC, Wilderness, and Dungeon creations are now automatically saved on generation. This gets rid of the multiple save/close/delete options which were confusing.
* A number of changes to improve/add printing. Only the currently shown section and currently opened items (tables, characters, dungeons, etc.) will print. Improved the stylesheet too.
* Fixed an issue with character groups.
* A bunch of minor design/usability changes.
* Fixed issue where tags with spaces (and some other characters) would break filtering of tables.

v0.6.1 - 2014-03-17
-------------------

* Bug fix: The default appearance setting for NPC generation was bad, causing NPCs to not be generated.


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