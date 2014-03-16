Random Table Import/Export Format
=================================

_If you want the easiest way, just read this first section on "Guided Table Creation."_

Guided Table Creation
---------------------

Using the guided form on the "Create Tables" page is the easiest way to add and edit random tables.

Each table or subtable has a title (if you don't provide one the default values will be used).

Table data should be formatted as:

* One result entry per line.
* To weight a random chance you have two options:
    * For a die-like format, prefix the entry with a number or a number range and a space(s), comma, period, or colon: `1: first` `2-3. second` `4-6, third`.
    * To directly weight the chances, prefix with a number followed by two pound signs: `2##This entry will be twice as likely` `4##This entry is four times as likely`.
* You can cause a roll on a subtable if the result is selected by adding two pounds signs and the title of a table to the end of a line: `Bandits##bandit_types` where "bandit_types" is the title of a subtable.
* You can insert tokens into the results to perform actions like generating numbers or rolling on other random tables. For instance:
    * Roll a number: `{{roll:3d6+1}}` in the results will generate a new random number every time that result comes up. The section after the semi-colon should accept any form of `[A Number or Blank]d[Another number][An arithmatic operator: +, -, *, or /][Another number]` such as `{{roll:d6}}` `{{roll:d6*2}}` `{{roll:2d10+10}}`.
    * Select from a table: `{{table:general.color}}` will randomly select a color. You can reference any other table in the app, but I still need to improve the table references (how to reference them and where to find those names).
    
Alternately, you can paste in HTML (select the "html" format option). In this case tags will be stripped and line breaks will be added at the end of list item `<li>`, table rows `<tr>`, div `<div>`, br `<br>`, and paragraph tags `<p>` (that should cover most of what people would use).

You can also convert bookmarklets from [Last Gasp Grimoire's Choose your own generator](http://www.lastgaspgrimoire.com/generators/choose-your-own-generator/). Just paste the bookmarklet text into the table data field and select "bookmarklet" from the format dropdown.

_That's all you really need to know. But if you want more options, read on..._


Freeform Table Creation
-----------------------

While there can be no easy to encapsulate all the possibilities for random tables, I've tried to create a format that is as simple as possible and can be easily read by other applications. I chose JSON as a format that can be handled by most programming languages and has a minimal amount of fussing with special characters, required fields, closing tags, etc.

We are primarily dealing with four types of data:

* Numbers: As you expect. Can be positive or negative. `23` `-2` `14543556`
* Strings: Combinations of letters, numbers, spaces, punctuation, etc. Anything from a single word, to a whole page of text. For our purposes you can include html in most cases (though it should be unnecessary). `"Chimera"` `"War dog"` `"The secret door is activated by pulling on the bust of Quarn the Pustulent which is sitting on the mantle."`
* Lists (a.k.a. Array): A collection of strings. `[ "Elf", "Dwarf", "Human" ]`
* Objects: A collection of names and their associated values.  `{ "race": "Elf", "class": "Fighter", "level": 2 }`

A few rules that must be followed
---------------------------------

### All text strings should be enclosed in double quotes (and NOT the fancy ones from Word).

Numbers do not need quotes.
Within the text strings all double quotes need to be preceded by a back-slash.


    "Dragons"
    "A Big Book of Spells"
    "13 gp"
    13
	
    "A man called \"Tubs\" asks for help."
    "The orc is screaming \"Oogadaboogada\" at you."
	
### List of strings are enclosed in brackets

Separate the strings with commas, but don't add a comma after the last element in the list (IE in particular hates that).

    [
    	"Orc",
    	"Goblin",
    	"Kobold"
    ]

### Objects are enclosed in braces

Names are followed by a colon and then the value. Name/value pairs are separated by commas. Do not put a comma after the last pair (like in lists above).

Names must be strings. Values can be numbers, strings, lists, or objects.

	{
		"Intelligence": 16,
		"Class": "Magic-User",
		"Spells": [ "Sleep", "Magic Missile" ],
		"Equipment": {
			"Weapon": "Dagger",
			"Armor": "None"
		}
	}

### Spaces, tabs, and linebreaks (other than within the strings) don't matter

The examples and actual data in the app use spaces for readability, but aren't necessary.

	{"Intelligence":16,"Class":"Magic-User","Spells":["Sleep","Magic Missile"],"Equipment": {"Weapon": "Dagger","Armor": "None"}}


Formatting Random Tables
------------------------

I've tried to build in an escalating scale of complexity. Simple tables can be formatted very simply, but complex tables require more complexity to the formatting.

I've tried to build in as much forgiveness as possible into the format.

### Simple unweighted table

A basic list of options with no extra information.

	[
		"Orcs",
		"Kobolds",
		"Goblins"
	]

### Simple weighted table

	[
		{ "label": "Orcs", "weight": 1 },
		{ "label": "Kobolds", "weight": 2 },
		{ "label": "Goblins", "weight": 6 }
	]

Alternately, it could be formatted as:

	{
		"Orcs": { "weight": 1 },
		"Kobolds": { "weight": 2 },
		"Goblins": { "weight": 6 }
	}

### Simple Table with information (metadata)

	{
		"title": "Dungeon Stocking (Moldvay)",
		"author": "Tom Moldvay",
		"source": "D&D Basic Set",
		"description": "Stocking a room in a dungeon. For fuller features see the Dungeon tab.",
		"tags": [ "dungeons", "d&d" ],
		"tables": {
			"default": {
				"monster": { "weight": 2 },
				"trap": { "weight": 1 },
				"special": { "weight": 1 },
				"empty": { "weight": 2 }
			}
		}
	}

This table adds information about the table which helps with finding it in the table list and provides author/source information. The optional fields include:

* title: Name the table
* author: Credit where credit is due.
* source: Book or website where the table came from (include a url/link)
* description: What is this table? What is it for?
* tags: a list of tags to categorize the table (you can filter on the tags in the table list)
* tables: an object made up of table names and table data

### Complex Table with Subtables

	{
		"title": "Sea Encounters",
		"author": "Derik Badman",
		"source": "",
		"description": "For when travelling on water (sea, ocean) (in progress)",
		"tags": ["sea", "water", "encounters", "wilderness"],
	 	"tables": {
		 	"general": {
		 		"Ship": { "subtable": "ship", "print": false, "weight": 3 },
		 		"Animal/Monster": { "subtable": "monster", "print": false, "weight": 2 },
		 		"Natural": { "subtable": "natural", "print": false, "weight": 2 },
		 	},
		 	"ship": {
			 	"Merchants": {},
			 	"Military": {},
			 	"Pirates": {},
			 	"Fishers": {},
			 	"Raiders": {},
			 	"Explorers": {},
			 	"Pilgrims": {},
			 	"Wreck": {},
			 	"Ghost Ship": {},
		 	},
		 	"monster": {
			 	"Sharks": {},
			 	"Whales": {},
			 	"Dolphins": {},
			 	"Turtles": {},
			 	"Fish": {},
			 	"Dragon Turtle": {},
			 	"Sea Monster": {},
		 	},
		 	"natural": {
			 	"Heavy winds": {},
			 	"Storm": {},
			 	"Whirlpool": {},
			 	"No wind": {},
			 	"Rain": {},
			 	"Fog": {},
			 	"Choppy Sea": {},
			 	"Hurricane": {},
		 	}
		}
	}


	
### Other options

The "start" property can be used to set what table or tables should be rolled on by default. This can be a single table name or a list of table names.

Values within tables can have a variety of properties:

* desc: add extra textual description to a result (this will be output with the result)
* print: if set to false the result from that table will not be output. This is helpful when a bunch of subtables are chained together. You may have a top-level table that doesn't need to be shown in the results.
* subtable: a reference to a subtable _or_ a whole subtable object.

#### Tokens

You can also use tokens to generate random numbers or results from other tables in the app.
