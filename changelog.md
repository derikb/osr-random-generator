Change Log
==========

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