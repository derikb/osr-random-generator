//! Character / NPC model
var Character = Backbone.Model.extend(
	/** @lends Character.prototype */
	{
	
	localStorage: new Backbone.LocalStorage("osr-random-generator-npcs"),
	
	defaults: function() {
		return {
			rules_set: app.AppSettings.get('rules_set'),
			name_type: '',
			name: '',
			chargroup: '',
			gender: '',
			race: 'human',
			ability_scores: [],
			charclass: 'none',
			spellcaster: false,
			level: 0,
			hp: 0,
			ac: 10,
			attack: {
				base:0, 
				melee:0, 
				missile:0,
			},
			spells: {},
			personality: [],
			appearance: [],
			goals: '',
			armor: '',
			weapon: '',
			reaction_roll: 0
		}
	},
		
	/**
	 * This is the model for Characters/NPCs.
	 *
	 * @augments external:Backbone.Model
	 * @constructs
	 * @property {String} rules_set What rules to use
	 * @property {String} name_type Name list to use
	 * @property {String} name Character name
	 * @property {String} chargroup Group name
	 * @property {String} gender
	 * @property {String} [race='human']
	 * @property {Array} ability_scores array of ability objects { name, score, modifier }
	 * @property {String} charclass character's class
	 * @property {Boolean} spellcaster
	 * @property {Number} [level=0]
	 * @property {Number} hp Hit points
	 * @property {Number} ac Armor class (based on rules_set it will vary
	 * @property {Object} attack attack bonuses { base, melee, missile }
	 * @property {Object} spells spell list { "Level 1": array of spells, etc. }
	 * @property {Array} personality Personality traits
	 * @property {Array} appearance Appearance traits
	 * @property {String} goals Character Goals
	 * @property {String} armor Armor Worn
	 * @property {String} weapon Weapon carried
	 * @property {Number} reaction_roll Default reaction
	 */
	initialize:  function() {
		
	},
	
	/**
	 * Retrieve rule data
	 * @returns {Object} all the rule data
	 */
	getRules: function() {
		return appdata.rules[this.get('rules_set')];
	},

	/**
	 * Are they a spellcaster? resets current setting. Used when class changes.
	 * @returns {Boolean}
	 */
	checkSpellCaster: function() {
		this.set({ spellcaster: false }, { silent: true });
		if (this.getRules().classes[this.get('charclass')].spellcaster == true) {
			this.set({ spellcaster: true }, { silent: true });
			return true;
		}
		return false;
	},
	
	/**
	 * Calculate ability modifier, defaults to "general" if there is not a specific mod for the ability
	 * @param {String} att ability name
	 * @param {Number} score ability score
	 * @returns {Number} positive or negative modifier
	 */
	calcModifier: function(att, score) {
		if (typeof this.getRules().ability_scores_mod[att] !== 'undefined') {
			return this.getRules().ability_scores_mod[att][score];
		}
		return this.getRules().ability_scores_mod.general[score];
	},
	
	/**
	 * Retrieve the current score for the ability
	 * @param {String} att Ability name
	 * @returns {Number} Current score
	 */
	getAttScore: function(att){
		a = _.findWhere(this.get('ability_scores'), { name: att});
		return a.score;
	},
	
	/**
	 * Retrieve current modifier for the ability
	 * @param {String} att Ability name
	 * @returns {Number} Currect modifier
	 */
	getAttMod: function(att){
		a = _.findWhere(this.get('ability_scores'), { name: att});
		return a.modifier;
	},
	
	/**
	 * Generate a Holmes name
	 * @param {String} gender Gender to user
	 * @returns {String} name
	 */
	holmesname: function(gender) {
		var name = '';
		scount = app.randomizer.getWeightedRandom(appdata.name.holmesian_scount.values, appdata.name.holmesian_scount.weights);
	
		for (i=1; i<=scount; i++) {
			name += app.randomizer.rollRandom(appdata.name.holmesian_syllables); //array
			if (i<scount) {
				name += app.randomizer.getWeightedRandom(['',' ','-'],[3,2,2]);
			}
		}
		name = name.toLowerCase().capitalize();
		name += ' '+app.randomizer.rollRandom(appdata.name.holmesian_title);
		
		name = app.randomizer.findToken(name);
		
		name = name.replace(/[\s\-]([a-z]{1})/g, function(match) {
			return match.toUpperCase();
		});
		return name;
	},
	
	/**
	 * Create a name
	 * @param {String} name_type What name list/process to use
	 * @returns {String} a name
	 */
	generateName: function(name_type) {
		var gender = this.get('gender');
		var name = '';
		switch (name_type) {
		 	case "holmesian":
				name = this.holmesname(gender);
				break;
			case "cornish":
			case "flemish":
			default:
				name = app.randomizer.rollRandom(appdata.name[name_type][gender]);
				if (typeof appdata.name[name_type]['surname'] !== 'undefined') {
					name += ' '+app.randomizer.rollRandom(appdata.name[name_type]['surname']);
				}
				name = app.randomizer.findToken(name);
				break;
		}
		return name;
	},
	
	/**
	 * Gender
	 */
	calcGender: function() {
		this.set('gender', app.randomizer.rollRandom(['male', 'female']));
	},
	
	/**
	 * Rolls the ability scores and adds them to the ability_scores array
	 */
	rollAbilities: function() {
		var ability_scores = [];
		for (var att in this.getRules().ability_scores) {
		    if (this.getRules().ability_scores.hasOwnProperty(att)) {
				a = { name: att, score: 0, modifier: 0 };
				if (this.get('charclass') == 'none') {
					a.score = app.randomizer.roll(6,3);
				} else {
					//use 4d6 drop lowest for classed npcs
					var arolls = [];
					arolls.push(app.randomizer.roll(6)); arolls.push(app.randomizer.roll(6)); arolls.push(app.randomizer.roll(6)); arolls.push(app.randomizer.roll(6));
					arolls.sort(function(a, b) { return a - b; }).reverse();
					a.score = arolls[0] + arolls[1] + arolls[2];
				}
				
				a.modifier = this.calcModifier(a.name, a.score);
				ability_scores.push(a);
		    }
		}
		this.set('ability_scores', ability_scores);
	},
	
	/**
	 * randomly select class or occupation
	 */
	selectClass: function() {
		var cclass = this.get('charclass');
		if (cclass == 'random') {
			this.set('charclass', app.randomizer.getWeightedRandom(this.getRules().classes.random.options, this.getRules().classes.random.weight) );
		} else if (cclass == 'none') {
			var oc = app.rtables.getByTitle(app.AppSettings.get('occupation_type')); 
			oc.generateResult();
			this.set('occupation', oc.niceString(true));
		}
	},

	/**
	 * Select armor based on class/occupation
	 */
	selectArmor: function() {
		var charclass = this.get('charclass');
		if (charclass == 'none') {
			var t = app.rtables.getByTitle(app.AppSettings.get('occupation_type'));
			var occ = t.findObject(this.get('occupation'));
			if (typeof occ.armor == 'undefined') { return ''; }
			if (occ.armor == false) { return ''; }
		}
		return app.randomizer.rollRandom(this.getRules().classes[charclass]['armor']);
	},
	
	/**
	 * Set/select level
	 */
	setLevel:  function() {
		var lvl = this.get('level');
		var curclass = this.get('charclass');
		if (curclass == 'none') {
			lvl = 0;
		} else if (lvl == "random") {
			lvl = _.random(1,9);
		} else if (lvl == 0 && this.get('charclass') !== 'none') {
			lvl = 1;
		}
		this.set('level', lvl);
	},
	
	/**
	 * Set/select spells and set them as spells object
	 */
	selectSpells: function() {
		if (this.checkSpellCaster() == true) {
			var charclass = this.get('charclass');
			var spelllist = this.getRules().classes[charclass].spelllist;
			var spelluse = this.getRules().classes[charclass].spells[this.get('level') - 1];
			var selected = {};
			var spelltable = app.rtables.getByTitle(spelllist);
			for(var i=0; i < spelluse.length; i++) {
				var level = i+1;
				lvl = 'lvl'+level;
				var sp = [];
				for (j=0; j < spelluse[i]; j++) {
					spelltable.generateResult(lvl);
					var spell = spelltable.niceString(true);
					//avoid duplicates
					if (_.indexOf(sp, spell) >= 0) {
						j--;
					} else {
						sp.push( spelltable.niceString(true) );
					}
				}
				selected['Level '+level] = sp;
			}
			
			this.set('spells', selected);
		}
	},
	
	/**
	 * Roll/set hit points
	 */
	rollHp: function() {
		var hp = 0;
		var conmod = this.getAttMod('con');
		if (this.get('charclass') == 'none') {
			hp = app.randomizer.roll(this.getRules().classes[this.get('charclass')].hd, 1, conmod);
		} else {
			for(i=1;i<=this.get('level');i++) {
				var r = app.randomizer.roll(this.getRules().classes[this.get('charclass')].hd, 1, conmod);
				if (r < 1) { r = 1; }
				hp += r;
			}
		}		
		if (hp < 1) { hp = 1; }
		this.set('hp', hp);
	},
	
	/**
	 * Set the attack object based on class, level, ability scores
	 */
	calcAttack: function() {
		var attack = {};
		attack.base = this.getRules().classes[this.get('charclass')].attack(this.get('level'));
		attack.melee = attack.base + parseInt(this.getAttMod('str'));
		attack.missile = attack.base + parseInt(this.getAttMod('dex'));
		
		if (attack.melee > 0) {
			attack.melee = '+'+attack.melee;
		}
		if (attack.missile > 0) {
			attack.missile = '+'+attack.missile;
		}
		
		this.set('attack', attack);		
	},
	
	/**
	 * Set armor class based on class, armor, dex, etc.
	 */
	calcAC: function() {
		//accounting for monk basically...
		if (typeof this.getRules().classes[this.get('charclass')]['ac'] !== 'undefined') {
			ac = this.getRules().classes[this.get('charclass')]['ac'](this.get('level'));
			this.set('ac', ac);
			return;
		}
		
		var ac = parseInt(this.getRules().armorclass.base);
		var method = this.getRules().armorclass.method;
		var armor = this.get('armor');

		if (armor !== '') {
			var armordata = _.findWhere(this.getRules().armor, { name: armor });
			//console.log(armordata);
			if (armordata.ac_base > 0) { ac = armordata.ac_base; }
			if (armordata.ac_bonus > 0) {
				if (method == 'asc') {
					ac = ac + parseInt(armordata.ac_bonus);
				} else if (method == 'desc') {
					ac = ac - parseInt(armordata.ac_bonus);
				}			
			}
		}
		
		if (method == 'asc') {
			ac = ac + parseInt(this.getAttMod('dex'));
		} else if (method == 'desc') {
			ac = ac - parseInt(this.getAttMod('dex'));
		}

		this.set('ac', ac);
	},
	
	/**
	 * Select/Set personality traits
	 * @param {Number} ct Number of traits to set
	 */
	selectPersonality: function(ct) {
		var personality = [];
		var ptable = app.rtables.getByTitle(app.AppSettings.get('personality_type')); 
		for(var i=1;i<=ct;i++){
			ptable.generateResult();
			personality.push(ptable.niceString());
		}
		this.set('personality', personality);
	},
	
	/**
	 * Select/Set appearance traits
	 * @param {Number} ct Number of traits to set
	 */
	selectAppearance: function(ct) {
		var appearance = [];
		var atable = app.rtables.getByTitle(app.AppSettings.get('appearance_type'));
		for(var i=1;i<=ct;i++){
			atable.generateResult();
			appearance.push(atable.niceString());
		}
		this.set('appearance', appearance);
	},
	
	/**
	 * Select/Set goals traits
	 */
	selectGoals: function() {
		var g = app.rtables.getByTitle('character_goals');
		g.generateResult();
		return  g.niceString();
	},
	
	/**
	 * Set Reaction Roll
	 */
	rollReaction: function() {
		var t = app.rtables.getByTitle('reaction');
		t.generateResult();
		return t.niceString();
	},
	
	/**
	 * run all the various functions to generate the npc object
	 */
	create: function() {
				
		this.rollAbilities();	
		this.selectClass();			
		this.setLevel();
		this.selectSpells();
		this.rollHp();
		this.calcAttack();
		this.selectPersonality(app.AppSettings.get('personality_count'));
		this.selectAppearance(app.AppSettings.get('appearance_count'));
		this.set('goals', this.selectGoals());
		this.set('armor', this.selectArmor());
		this.calcAC();
		this.set('reaction_roll', this.rollReaction());
		
		//gender
		this.calcGender();
		this.set( 'name', this.generateName(this.get('name_type')) );
		
		//events to update
		this.on('change:level change:charclass', function(model){ model.rollHp(); model.calcAttack(); model.selectSpells(); });
		this.on('change:occupation', function(model){ model.set('armor', model.selectArmor()); });
		this.on('change:armor', function(model){ model.calcAC(); });
		this.on('change:con', function(model){ model.rollHp(); });
		this.on('change:str change:dex', function(model){ model.calcAttack(); });
		this.on('change:dex', function(model){ model.calcAC(); });
		
		this.on('change:int change:wis change:cha', function(model){ /* nothing here, we just need to trigger change for the view to update */ });
		
	},
	
	
	/**
	 * validate fields before saving
	 * @returns {Object} error information
	 */
	validate: function(attributes, options) {
		//console.log(attributes);
		var error = { fields: [], general: '' };
		
	/*
		if (attributes.title == '') {
			error.fields.push({ field: 'title', message: 'Title cannot be blank' });
			error.general += 'Title cannot be blank. ';
		}
	*/
		
		if (!_.isEmpty(error.fields) || !_.isEmpty(error.general)) {
			return error;
		}
	},


	/**
	 * outputs the json data for the npc (import/export)
	 * @param {Boolean} [editmode=false] if false empty attributes will be stripped out
	 * @returns {Object} table attributes
	 */
	outputObject: function(editmode) {
		if (typeof editmode == 'undefined' ) { editmode = false; }
		var att = _.clone(this.attributes);
		_.each(att, function(v,k,l){
			if (!editmode && _.isEmpty(v)) {
				delete l[k];
			}
		}, this);
		delete att.id;
		return att;
	},
	
	/**
	 * outputs the json data for the npc (import/export)
	 * @param {Boolean} [editmode=false] if false empty attributes will be stripped out
	 * @param {Boolean} [compress=false] if true JSON will not have indentation, etc.
	 * @returns {String} table attributes in JSON
	 */
	outputCode: function(editmode, compress) {
		if (typeof editmode == 'undefined' ) { editmode = false; }
		if (typeof compress == 'undefined' ) { compress = false; }
		
		var obj = this.outputObject(editmode);
		
		if (compress) {
			return JSON.stringify(obj);
		}
		return JSON.stringify(obj, null, 2);
	},

	

});


//!CharacterBlock View for character data
var CharacterBlock = Backbone.View.extend(
	/** @lends CharacterBlock.prototype */
	{
	
	tagName: 'div',
	className: 'character-block panel panel-default',
	
	attributes : function () {
		return {
			//id: 'character_'+this.model.get('id')
		};
	},
	
	events: {
		'click *[data-field]': 'editField',
		'click .save': 'saveCharacter',
		'click .delete': 'deleteCharacter',
		'click .conf-delete': 'confirmDelete',
		//'click .remove': 'removeCharacter',
		'click .spell': 'showSpell'
	},
	
	/**
	 * This is the view for Characters
	 *
	 * @augments external:Backbone.View
	 * @constructs
	 */
	initialize: function() {
    	this.listenTo(this.model, "change", this.render);
    	//this.listenTo(this.model, "destroy", this.remove);
    },
    
    /**
	 * Save an edited item
	 */
    saveCharacter: function() {
		//do something
		/*
if (this.model.isNew()) {
			this.model.save();
			app.charlist.add(this.model);
		} else {
*/
			this.model.save();
		//}
		this.$el.find('.unsaved, .save').remove();
		return false;
    },
    
    /**
     * Delete the item
     */
    deleteCharacter: function(e) {
		e.preventDefault();
		this.model.destroy();
		this.remove();
    },
    
    /**
     * Updates the delete button to make you click it twice to delete
     */
	confirmDelete: function(e) {
		$button = $(e.currentTarget);
		$button.html('Are you sure?');
		$button.removeClass('conf-delete btn-default').addClass('btn-danger delete');
	},
    
/*
    removeCharacter: function(e) {
	    e.preventDefault();
	    //console.log(this.model.changedAttributes());
	    if (this.model.isNew()) {
		    if (!confirm('You have not saved this character. Are you sure you with to delete it?')) {
			    return false;
		    }
	    } else if (this.model.changedAttributes()) {
		    if (!confirm('You have unsaved changes that will be lost. Are you sure?')) {
			    return false;
		    }
	    }
	    this.remove();
    },
*/
    
    showSpell: function(e) {
	    e.preventDefault();
	    var title = $(e.target).attr('data-spell');
	    if (typeof title == 'undefined') {
		    var title = $(e.target).parent().attr('data-spell');
	    }
	    var charclass = this.model.get('charclass');
	    var spelllist = this.model.getRules().classes[charclass].spelllist;
	    spell = _.findWhere(appdata.spells.descriptions[spelllist], { title: title });
	    
	    var spellv = new SpellView({spell: spell});
	    app.showModal({ title: 'Spell Details: '+spell.title.capitalize(), body: spellv.render().el });
    },
    
    editField: function(e) {
	    var field = $(e.target).attr('data-field');
	    //console.log(field);
	    
	    var editv = new CharacterEditView({model: this.model, field: field});
	    app.showModal({ full_content: editv.render().el });
    },
    
    
    template: function(data, open){
    	var character_display = app.AppSettings.get('character_display');
    	
		open = (open) ? open : false;
		var openclass = (open) ? 'in' : '';
		
		
		accordion = data.chargroup.replace(/[\s\.:'"]/g, '_');
		
    	var temp = '';
    	temp += '<div class="panel-heading clearfix">';
		
		temp += '<div class="pull-right hidden-print">';
				if (this.model.changedAttributes()) { temp += '<span class="label label-danger unsaved">Unsaved Changes</span> <button title="Save" class="btn btn-default btn-xs save"><span class="glyphicon glyphicon-save"></span></button>'; }
			
				temp += '<button title="Delete" class="btn btn-default btn-xs conf-delete"><span class="glyphicon glyphicon-remove"></span></button>';
			temp += '</div>';
		
		temp += '<h4 class="panel-title"><a data-toggle="collapse" data-parent="#npc-accordion-'+accordion+'" href="#char<%= id %>"><%= name %> <% if(charclass == "none") { %>(<%= occupation %>)<% } else { %>(<% var cc = charclass.capitalize() %><%= cc %> <%= level %>)<% } %></a></h4></div>';
		
		temp += '<div id="char<%= id %>" class="panel-collapse collapse '+openclass+'"><div class="panel-body">';


    	
    	if (character_display == 'soft') {
	    	
	    	temp += '<div class="row"><div class="col-xs-6"><dl class="dl-horizontal clearfix"><dt>Name</dt><dd><span data-field="name"><%= name %> (<span data-field="gender"><%= gender %></span>)</span></dd><% if(charclass == "none") { %><dt>Occupation</dt><dd><span data-field="occupation"><%= occupation %></span></dd><% } else { %><dt>Class</dt><dd><span data-field="charclass"><% var cc = charclass.capitalize() %><%= cc %></dd><% } %><dt data-field="race">Race</dt><dd data-field="race"><% var r = race.capitalize() %><%= r %></span></dd><dt data-field="chargroup">Group</dt><dd data-field="chargroup"><%= chargroup %></span></dd></dl>';
	    	
	    	temp += '</div><div class="col-xs-6">';
    	
			temp += '<dl class="character-traits clearfix"><dt data-field="personality">Personality</dt><% _.each(personality, function(v,k){ v.capitalize(); %><dd><span data-field="personality"><%= v %></span></dd><% }); %><dt data-field="appearance">Appearance</dt><% _.each(appearance, function(v,k){ v.capitalize(); %><dd><span data-field="appearance"><%= v %></span></dd><% }); %><dt data-field="goals">Goals</dt><dd><span data-field="goals"><%= goals %></span></dd></dl>';
			
    	} else {
    	
    		temp += '<div class="row"><div class="col-xs-6"><dl class="dl-horizontal clearfix"><dt>Name</dt><dd><span data-field="name"><%= name %> (<span data-field="gender"><%= gender %></span>)</span></dd><% if(charclass == "none") { %><dt>Occupation</dt><dd><span data-field="occupation"><%= occupation %></span></dd><% } else { %><dt>Class</dt><dd><span data-field="charclass"><% var cc = charclass.capitalize() %><%= cc %>, <span data-field="level">Lvl <%= level %></span></dd><% } %><dt data-field="race">Race</dt><dd data-field="race"><% var r = race.capitalize() %><%= r %></span></dd></dl>';
    	
	    	if (app.AppSettings.get('ability_display') == 'minimal') {
		    	
		    	temp += '<dl class="dl-horizontal clearfix"><% _.each(ability_scores, function(v,k){ var a = v.name.capitalize(); if (v.modifier !== 0) { %><dt><%= a %></dt><dd><span data-field="ability_scores.<%= v.name %>"><%= v.score %> (<% var mod = (v.modifier > 0) ? "+"+v.modifier : v.modifier; %><%= mod %>)</span></dd><% } }); %></dl>';
		    	
	    	} else {
	    		temp += '<dl class="dl-horizontal clearfix"><% _.each(ability_scores, function(v,k){ var a = v.name.capitalize(); %><dt><%= a %></dt><dd><span data-field="ability_scores.<%= v.name %>"><%= v.score %> (<% var mod = (v.modifier > 0) ? "+"+v.modifier : v.modifier; %><%= mod %>)</span></dd><% }); %></dl>';
	    	}
    	
    		temp += '<dl class="dl-horizontal clearfix"><dt>HP</dt><dd><span data-field="hp"><%= hp %></span></dd><dt>AC</dt><dd><%= ac %><% if (armor !== "") { %> (<span data-field="armor"><%= armor %></span>)<% } %></dd><dt>Attack Bonus</dt><% if (attack.melee == attack.missile) { %><dd><%= attack.melee %></dd><% } else { %><dd><%= attack.melee %> Melee</dd><dd><%= attack.missile %> Missile</dd><% } %><dt>Reaction Roll</dt><dd><%= reaction_roll %></dd></dl>';
    	
			temp += '</div><div class="col-xs-6">';
    	
    		temp += '<dl class="dl-horizontal clearfix"><dt data-field="chargroup">Group</dt><dd data-field="chargroup"><%= chargroup %></span></dd></dl>';
    	
    		temp += '<dl class="character-traits clearfix"><dt data-field="personality">Personality</dt><% _.each(personality, function(v,k){ v.capitalize(); %><dd><span data-field="personality"><%= v %></span></dd><% }); %><dt data-field="appearance">Appearance</dt><% _.each(appearance, function(v,k){ v.capitalize(); %><dd><span data-field="appearance"><%= v %></span></dd><% }); %><dt data-field="goals">Goals</dt><dd><span data-field="goals"><%= goals %></span></dd></dl>';
    	
    		temp += '<% if (spellcaster == true) { %><section><h4 data-field="spells">Spells</h4><dl class=""><% _.each(spells, function(v,k) { %><dt data-field="spells"><%= k %></dt><% _.each(v, function(y,x) { %><dd class="spell" data-spell="<%= y %>"><%= y %> <span class="glyphicon glyphicon-info-sign"></span></dd><% }); }); %></dl></section><% } %>'; //spells
		
			temp += '</div></div>';
		
		}

		temp += '</div>';
				
		var html = _.template(temp, data);
		return html;
    },
    
    render: function() {
    	//console.log('view render');
    	//console.trace();
    	var open = false;
    	if (arguments[1]) {
	    	open = (arguments[1]['open']) ? arguments[1]['open'] : false;
    	}
    	this.$el.html(this.template(this.model.attributes, open));
		return this;
	}
	
});


//!SpellView
var SpellView = Backbone.View.extend(
	/** @lends SpellView.prototype */
	{
	
	tagName: 'div',
	className: 'spell-details clearfix',

	/**
	 * This is the view for Spells
	 *
	 * @augments external:Backbone.View
	 * @constructs
	 */
	initialize: function(options) {
		//this.options = options || {};
		this.spell = options.spell;
	},
	
	
	template: function(data) {
		//console.log('SpellView: here is template');
		var html = '';
		
		html += '<dl class="dl-horizontal">';
		_.each(data, function(v,k,l){
			html += '<dt>'+k.capitalize()+'</dt><dd>'+v+'</dd>';
		});
		html += '</dl>';
		
		return html;
	},
	
	render: function(){
		//console.log('SpellView: here is render');
		this.$el.html(this.template(this.spell));
		return this;
	}
	
});

//!CharacterEditView View for editing the fields
var CharacterEditView = Backbone.View.extend(
	/** @lends CharacterEditView.prototype */
	{
	
	tagName: 'form',
	field: '',
	className: 'modal-content',
	
	events: {
		'submit': 'commitEdit',
		'click .randomize': 'loadRandom',
	},
	
	/**
	 * This is the view for Characters being edited
	 *
	 * @augments external:Backbone.View
	 * @constructs
	 */
	initialize: function(options) {
		//this.options = options || {};
		this.field = options.field;
		this.subfield = '';
		
		if (this.field.indexOf('.') !== -1 ) {
			var f = this.field.split('.');
			this.field = f[0];
			this.subfield = f[1];
		}
	},
	
	commitEdit: function(e) {
		formdata = $(e.target).serializeObject();
		//console.log(formdata);
		
		if (this.field == 'ability_scores') {
			
			var scores = _.clone( this.model.get('ability_scores') );
			//console.log(scores);
			a = _.findWhere(scores, { name: formdata.ability });
			a.score = formdata.score;
			a.modifier = this.model.calcModifier(a.name, a.score);
			var index=0;
			for (i=0;i<scores.length;i++) {
				if (scores[i].name == a.name) {
					index = i;
				}
			}
						
			scores[index] = a;
			//console.log(scores);
			this.model.set({ ability_scores: scores });
			//this.model.save({ ability_scores: scores });
			this.model.trigger('change:'+a.name, this.model);
			this.model.trigger('change', this.model, { open: true });
		
		} else if (this.field == 'spells') {
			
			var fdata = { spells: formdata};
			//we have to account for a level that has only 1 spell
			_.each(fdata.spells, function (v,k,l){
				if (typeof v == 'string') {
					l[k] = [v];
				}
			});
			this.model.set(fdata, { open: true });
			//this.model.save(fdata);
		} else {
			this.model.set(formdata, { open: true });
			//this.model.save(formdata, {wait: true});
		}
		//this.model.save();
		$('#editmodal').modal('hide');
		
		return false;
	},
	
	loadRandom: function(e) {
		
		//console.log(e);
		var inputtarget = $(e.target).attr('data-targetfield');
		var list = $(e.target).attr('data-list');
		
		if (this.field == 'personality' || this.field == 'appearance' || this.field == 'goals') {
			var t = app.rtables.getByTitle(list);
			t.generateResult();
			$('#'+inputtarget).val(t.niceString());
		} else if (this.field == 'name') {
			
			var newval = this.model.generateName(list);
			$('#'+inputtarget).val(newval);
			
		} else if (this.field == 'spells') {
			
			//list = lvl1
			var charclass = this.model.get('charclass');
			var spelllist = this.model.getRules().classes[charclass].spelllist;		
			var spelltable = app.rtables.getByTitle(spelllist);
			spelltable.generateResult(list);
			//var newval = _.sample(appdata.spells.bylevel[spelllist][list]);
			$('#'+inputtarget).val(spelltable.niceString(true));
		}
		
	},
	
	
	template: function(data){
		var field = this.field;
		var subfield = this.subfield;
		
		//console.log(this);
		var form = app.modalHeader('Edit Field: '+field.capitalize());
		form += '<div class="modal-body">';
		switch (field) {
			case 'ability_scores':
				var score = this.model.getAttScore(subfield);
				form += '<input type=hidden name=ability value="'+subfield+'" />';
				form += '<div class="form-group"><label for="edit_score" class="control-label">'+subfield.capitalize()+'</label><select class="form-control" id="edit_score" name="score">';
				for(i=3;i<=18;i++) {
					var sel = (i == score) ? 'selected=selected' : '';
					form += '<option value="'+i+'" '+sel+'>'+i+'</option>';
				}
				form += '</select><div class="help-block">Updating an ability score will (if applicable) update hp, attack, spells, etc.</div></div>';
				
				break;
			
			case 'level':
				form += '<div class="form-group"><label for="level" class="control-label">Level</label><select class="form-control" id="level" name="level">';
				for(i=0;i<=9;i++) {
					var sel = (i == this.model.get(field)) ? 'selected=selected' : '';
					form += '<option value="'+i+'" '+sel+'>'+i+'</option>';
				}
				form += '<option value="random">Random</option></select><div class="help-block">Updating level will automatically update hp, spells, and attack bonus.</div></div>';
				break;
			
			case 'charclass':
				form += '<div class="form-group"><label for="charclass" class="control-label">Class</label><select class="form-control" id="charclass" name="charclass">';			
				_.each(this.model.getRules().classes, function(v,k,l) {
					var sel = (k == this.model.get(field)) ? 'selected=selected' : '';
					form += '<option value="'+k+'" '+sel+'>'+v.label+'</option>';
					
				}, this);
				form += '</select><div class="help-block">Updating class will automatically update hp, spells, and attack bonus.</div></div>';
			
				break;
			
			case 'occupation':
				form += '<div class="form-group"><label for="occupation" class="control-label">Occupation</label><select class="form-control" id="occupation" name="occupation">';
					var t = app.rtables.getByTitle(app.AppSettings.get('occupation_type'));
					_.each(t.selectList('default'), function(v) {
						var sel = (v.label == this.model.get(field)) ? 'selected=selected' : '';
						form += '<option value="'+v.label+'" '+sel+'>'+v.label.capitalize()+'</option>';
						
					}, this)
					form += '</select><div class="help-block"></div></div>';
			
				break;
			
			case 'personality':
			case 'appearance':
			case 'goals':
				
				var cur = this.model.get(field);
				if (typeof cur == 'string') {
					cur = [cur];
				}
				
				for(var i=0; i<cur.length; i++) {
					var num = i+1;
					form += '<div class="form-group"><label class="control-label" for="edit'+field+'_'+i+'">'+field.capitalize()+' '+num+'</label><div class="input-group"><input type=text class="form-control" id="edit'+field+'_'+i+'" name="'+field+'" value="'+cur[i]+'" />';
					
					form += '<div class="input-group-btn"><button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown">Randomly Replace from... <span class="caret"></span></button><ul class="dropdown-menu pull-right">';
						var options = app.rtables.getByTags(field);
						_.each(options, function(v,k){
							form += '<li><a class="randomize" href="#" data-targetfield="edit'+field+'_'+i+'" data-list="'+v.get('key')+'">'+v.get('title')+'</a></li>';
						});			
					form += '</ul></div></div></div>';
					
				}
			
				break;
							
			case 'gender':
			
				form += '<div class="form-group">';
				var sel = ('male' == this.model.get(field)) ? 'checked=checked' : '';
				form += '<label class="radio-inline"><input type="radio" name="gender" id="gender1" value="male" '+sel+' /> Male</label>';
				var sel = ('female' == this.model.get(field)) ? 'checked=checked' : '';
				form += '<label class="radio-inline"><input type="radio" name="gender" id="gender2" value="female" '+sel+' /> Female</label>';
				form += '<div class="help-block">The gender the character identifies as. It is only used for random name generation.</div></div>';
				
				break;
			case 'name':
				form += '<div class="form-group"><label class="control-label" for="edit'+field+'">'+field.capitalize()+'</label><div class="input-group"><input type=text class="form-control" id="edit'+field+'" name="'+field+'" value="<%= '+field+' %>" />';
				
				form += '<div class="input-group-btn"><button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown">Randomly Generate <span class="caret"></span></button><ul class="dropdown-menu pull-right">';
						_.each(appdata[field]['options'], function(v,k){
							form += '<li><a class="randomize" href="#" data-targetfield="edit'+field+'" data-list="'+v.option+'">'+v.label+'</a></li>';
						});			
					form += '</ul></div></div>';
				
				form += '<span class="help-block">If you wish to generate a new random name, select one of the options below.</span></div>';
								
				break;
			
			case 'spells':
				var spells = this.model.get('spells');
				
				_.each(spells, function(v,k,l){
					var level = k.split(' ')[1];
					
					form += '<fieldset><legend>'+k+'</legend>';
					
					_.each(v, function(y,x) {
						var ct = x+1;
						form += '<div class="form-group"><label class="control-label" for="edit'+field+'_'+level+'_'+x+'">'+ct+'</label><div class="input-group"><input type=text class="form-control" id="edit'+field+'_'+level+'_'+x+'" name="'+k+'" value="'+y+'" />';
				
						form += '<div class="input-group-btn"><button type="button" class="btn btn-default randomize" data-targetfield="edit'+field+'_'+level+'_'+x+'" data-list="lvl'+level+'">Randomly Generate</button></div></div></div>';
						
					});
					
					form += '</fieldset>';
					
				});
				
			
				break;
				
			case 'armor':
								
				form += '<div class="form-group"><label for="armor" class="control-label">Armor</label><select class="form-control" id="armor" name="armor">';
					_.each(this.model.getRules().armor, function(v,k,l) {
						var sel = (v.name == this.model.get(field)) ? 'selected=selected' : '';
						form += '<option value="'+v.name+'" '+sel+'>'+v.name.capitalize()+'</option>';
						
					}, this)
				form += '</select><div class="help-block"></div></div>';
			
				break;
				
			case 'chargroup':
			
				form += '<div class="form-group"><label for="chargroup" class="control-label">Character Group</label><select class="form-control" id="chargroup" name="chargroup"><option value="">---</option>';
					_.each(app.AppSettings.get('chargroup'), function(v,k,l) {
						var sel = (v.name == this.model.get(field)) ? 'selected=selected' : '';
						form += '<option value="'+v.name+'" '+sel+'>'+v.name+'</option>';
						
					}, this)
				form += '</select><div class="help-block"></div></div>';

				
				break;
			
			case 'race':
			
				form += '<div class="form-group"><label for="race" class="control-label">Race</label><select class="form-control" id="race" name="race">';
					_.each(this.model.getRules().races, function(v,k,l) {
						var sel = (k == this.model.get(field)) ? 'selected=selected' : '';
						form += '<option value="'+k+'" '+sel+'>'+v.label+'</option>';
						
					}, this)
				form += '</select><div class="help-block"></div></div>';

				
				break;
			
			default:
				form += '<div class="form-group"><label class="control-label" for="edit'+field+'">'+field+'</label><input type=text class="form-control" id="edit'+field+'" name="'+field+'" value="<%= '+field+' %>" /><span class="help-block"></span></div>';
				break;

		}
		
		form += '</div>';
		
		form += app.modalFooter('<button type=submit class="btn btn-primary">Update</button>');

		var html = _.template(form, data);
		return html;
	},
	
	render: function() {
    	this.$el.html(this.template(this.model.attributes));
		return this;	
	}
	
});



//!CharCollection
var CharCollection = Backbone.Collection.extend(
	/** @lends CharCollection.prototype */
	{

    model: Character,
	localStorage: new Backbone.LocalStorage("osr-random-generator-npcs"), // Unique name within your app.
	
	comparator: function(char) {
      return [char.get("group"), char.get("name")]
    },
	
	/**
	 * This is a collection of Characters
	 *
	 * @augments external:Backbone.Collection
	 * @constructs
	 */
	initialize: function(){
		//this.listenTo(this.model, 'sync', this.addChar);
	},
	
	/**
	 * Get a list of all groups (via the saved NPCs)
	 * @returns {Array}
	 */
	grouplist: function() {
		var groups = this.pluck('chargroup');
		groups = _.uniq(_.reject(groups, function(v){ return v == ''; }));
		return groups;
	},
	
	/**
	 * Update the group name on saved NPCs
	 * @param {String} oldgroup old name of the group
	 * @param {String} newgroup new name of the group
	 */
	editGroups: function(oldgroup, newgroup) {
		
		var ch = this.where({chargroup: oldgroup});
		//console.log(ch);
		_.each(ch, function(v,k,l){
			//console.log(v);
			v.save({ chargroup: newgroup });
		});
			
	},
	
	
	/**
	 * Export the user saved nocs
	 * @param {String} [which] group to export (?)
	 * @param {Boolean} [compress=false] if true JSON will not be indented with tabs/lines
	 * @returns {Array} Array of table objects ? 
	 */
	exportOutput: function(which, compress) {
		if (typeof which == 'undefined') {
			which = '';
		}
		if (typeof compress == 'undefined') {
			compress = false;
		}
		var t = this.filter(function(model){
			if (which !== '') {
				return ( typeof model.get('chargroup') !== which );
			}
			return true;
		});
		
		_.each(t, function(v,k,l){
			l[k] = v.outputObject(false);
		}, this);
		
		return t;		
	}


});


//!CharList
var CharList = Backbone.View.extend(
	/** @lends CharList.prototype */
	{
	
	model: CharCollection,
	
	tagName:'section',
	id: 'character-collection',

	/**
	 * This is the view for the Character Collection
	 *
	 * @augments external:Backbone.View
	 * @constructs
	 */
    initialize:function () {
        this.listenTo(this.model, "add", this.addItem);
        this.listenTo(this.model, "destroy", this.removeItem);
        this.listenTo(this.model, "change:chargroup", this.render);
    },
     
    render: function () {
    	$(this.el).html('<h1>Saved Characters</h1>');

    	var ord = this.model.groupBy(function(char){
    		return char.get('chargroup');
    	});
    	k = _.keys(ord).sort(); //sort by group name

    	_.each(k, function(group) {
    		var grouplabel = (group == '') ? '[no group]' : group;
    	 	$(this.el).append('<h2>'+grouplabel+'</h2>');
    	 	var ghtml = group.replace(/[\s\.:'"]/g, '_');
    	 		var $glist = $('<div id="npc-accordion-'+ghtml+'" class="panel-group"></div>');
    	 		//var $glist = $('<ul class="list-unstyled"></ul>');
		 		_.each(ord[group], function(char){
        			$glist.append(new CharacterBlock({model:char}).render().el);
        		}, this);
        		$(this.el).append($glist);
        }, this);


        return this;
    },
    
    /**
     * Put a new item into the list (when it's added to the collection), default it to open
     */
    addItem: function(m) {
	    //console.log(m);
	    
	    var ghtml = m.get('chargroup').replace(/[\s\.:'"]/g, '_');
	    
	    $(this.el).find('#npc-accordion-'+ghtml).prepend(new CharacterBlock({model: m, open: true}).render().el);
	    $('#char'+m.get('id')).collapse('show');
	    $('#char'+m.get('id'))[0].scrollIntoView(true);
    },
    
    /**
     * Remove an item from the list (when it's removed from the collection)
     */
    removeItem: function(m) {
	    $('#char'+m.get('id')).parents('.panel').remove();
    }
	
	
});


//!CharForm character creation form
var CharForm = Backbone.View.extend(
	/** @lends CharForm.prototype */
	{
		
	model: AppSettings,
	tagName: 'form',
	id: 'npc-form',
	
    events:{
        "submit": "newChar",
        "change #chargroup": "addGroup"
    },
	
	/**
	 * This is the view for a character creation form
	 *
	 * @augments external:Backbone.View
	 * @constructs
	 */
    initialize:function () {
        this.listenTo(this.model, 'change', this.render);
    },
    
    render: function () {
    	var rules = appdata.rules[this.model.get('rules_set')];
    	var form = '<h1>Create Character</h1>';
    	form += '<div class="messages"></div>';
    	form += '<div class="row">';
    	
    	form += '<div class="form-group col-sm-4"><label for="race" class="control-label">Race</label><select class="form-control" id="race" name="race">';
    		_.each(rules.races, function(v,k,l) {
				form += '<option value="'+k+'">'+v.label+'</option>';		
			}, this);
    	form += '</select><div class="help-block">Currently no rules effect.</div></div>';
    	
    	form += '<div class="form-group col-sm-4"><label for="charclass" class="control-label">Class</label><select class="form-control" id="charclass" name="charclass">';
    		_.each(rules.classes, function(v,k,l) {
				form += '<option value="'+k+'">'+v.label+'</option>';		
			}, this);
    	form += '</select><div class="help-block"></div></div>';
		form += '<div class="form-group col-sm-4"><label for="level" class="control-label">Level</label><select class="form-control" id="level" name="level">';
			for(var i=0; i<10; i++) {
				form += '<option value="'+i+'">'+i+'</option>';
			}
		form += '<option value="random">Random</option></select><div class="help-block"></div></div></div>';
    	
    	form += '<div class="row">';
	    	form += '<div class="form-group col-sm-6"><label for="name_type" class="control-label">Name Type</label><select class="form-control" id="name_type" name="name_type">';
	    		_.each(appdata.name.options, function(v){
		    		form += '<option value="'+v.option+'">'+v.label+'</option>';
	    		});
			form += '</select><div class="help-block"></div></div>';
			

			form += '<div class="form-group col-sm-6"><label for="chargroup" class="control-label">Character Group</label><select class="form-control" name="chargroup" id="chargroup">';
				form += '<option value="">---</option>';
				
				//Complicated process to make sure the saved groups in settings and npcs are merged.
				var npcgrouplist = app.charlist.grouplist();
				//console.log(npcgrouplist);
				
				var savedgroups = this.model.get('chargroup');
				_.each(savedgroups, function(v,k,l){
					var x = npcgrouplist.indexOf(v.name);
					if (x > -1) {
						delete npcgrouplist[x];
					}
				}, this);
				//console.log(npcgrouplist);
				
				_.each(npcgrouplist, function(v,k,l){
					savedgroups.push({ name: v });
				}, this);
				//console.log(savedgroups);				
				this.model.save( { chargroup: savedgroups });

				_.each(savedgroups, function(v,k) {
					form += '<option value="'+v.name+'">'+v.name+'</option>';
				}, this);
				form += '<option value="">------</option><option value="0">Manage Groups</option>';
			form += '</select><div class="help-block">For organizing your saved NPCs.</div></div>';
    	form += '</div>';
    	
    	form += '<div class="form-group"><button type=submit class="btn btn-primary">Generate NPC</button></div>';
    	
    	$(this.el).html(form);
        return this;
    },
 
    newChar:function (e) {
    	e.preventDefault();
    	var $mess = $(this.el).find('.messages');
		$mess.empty();
		
    	formdata = $(e.target).serializeObject();
    	var char = new Character(formdata);
    	char.create();
    	
    	if (!char.isValid()) {
    		$mess.html(app.showAlert(char.validationError.general, { atype: 'danger' }));
			$mess[0].scrollIntoView(true);
	    	//console.log(wild.validationError);
	    	return;
    	}
    	char.save();
		app.charlist.add(char);
    	
    	//$('#characters-new').prepend(new CharacterBlock({model:char}).render().el);
    },
    
    addGroup: function(e) {
	    var val = $(e.target).val();
	    if (val == '0') {
		    var form = ''; 
		    app.showModal({ full_content: new CharGroupView({model:this.model}).render().el });
		    $(e.target).val('');
	    }
    }
    
});


//!CharGroup
var CharGroupView = Backbone.View.extend(
	/** @lends CharGroupView.prototype */
	{
	
	tagName: 'form',
	className: 'chargroup-add clearfix',
	
	/**
	 * This is the view for Character Groups
	 *
	 * @augments external:Backbone.View
	 * @constructs
	 */
	initialize: function(options) {
		//this.options = options || {};
	},
	
	events: {
        "submit": "newGroup",
        "click .delete": "deleteGroup",
        "click .edit": "setupEdit",
        "click .saveedit": "editGroup",
        "click .cancel": "render"
    },
	
	template: function(data) {
		//console.log('CharGroupView: here is template');
		var html = app.modalHeader('Manage Groups');
		html += '<div class="modal-body">';
		html += '<ul class="list-unstyled">';
			_.each(this.model.get('chargroup'), function (v) {
				html += '<li class="chargroup-list" data-group="'+v.name+'">'+v.name+' <a href="#" class="edit"><span class="glyphicon glyphicon-edit"></span></a> <a href="#" class="delete"><span class="glyphicon glyphicon-remove"></span></a></li>';
			});
		html += '</ul>';
		
		html += '<div class="form-group"><label for="newgroup" class="control-label">New Character Group</label><input type="text" class="form-control" id="newgroup" name="newgroup" value="" /></div>';
		
		html += '</div>';

		html += app.modalFooter('<button type=submit class="btn btn-primary">Add</button>');
		
		return html;
	},
	
	render: function(){
		this.$el.html(this.template());
		return this;
	},
	
	/**
	 * Create a new group from the form data
	 */
	newGroup: function(e) {
		e.preventDefault();
    	var formdata = $(e.target).serializeObject();
    	if (formdata.newgroup !== '') {
    		var groups = _.clone( this.model.get('chargroup') );
	    	if (typeof _.findWhere(groups, { name: formdata.newgroup }) == 'undefined') {
		    	groups.push({ name: formdata.newgroup });
		    	//save groups, avoid rerendering and just add the new group and select it
		    	//this keeps the form values that are already set
		    	this.model.save( { 'chargroup': groups }, { silent: true });
		    	$('#chargroup').append(jQuery('<option></option>').attr('value', formdata.newgroup).text(formdata.newgroup));
		    	$('#chargroup').val(formdata.newgroup);
	    	} else {
		    	alert("That group already exists!");
		    	return false;
	    	}
	    	$('#editmodal').modal('hide');
	    	
    	}
	},
	
	/**
	 * Delete group remove it from settings and from saved NPCs
	 */
	deleteGroup: function(e) {
		e.preventDefault();
		var group = $(e.target).parents('li').attr("data-group");
		var groups = _.clone( this.model.get('chargroup') );
		groups = _.reject(groups, function(g){ return g.name == group; });
		this.model.save( { 'chargroup': groups } );
		app.charlist.editGroups(group, '');
		$(e.target).parents('li').remove();
	},
	
	/**
	 * Replace group name with an input group
	 */
	setupEdit: function(e) {
		e.preventDefault();
		var $li = $(e.target).parents('li');
		var group = $li.attr("data-group");
		$li.html('<div class="input-group"><input type="text" class="form-control" name="editgroup" id="editgroup" value="'+group+'" /><span class="input-group-btn"><button type="button" class="btn btn-primary saveedit">Save</button><button type="button" class="btn btn-default cancel"><span class="glyphicon glyphicon-remove-circle"></span></button></span></div>');
		
	},
	
	/**
	 * Rename group and all associated saved NPCs
	 */
	editGroup: function(e) {
		e.preventDefault();
		var $li = $(e.target).parents('li');
		var oldgroup = $li.attr("data-group");
		var newgroup = $li.find('input').val();

		var groups = _.clone( this.model.get('chargroup') );
		groups = _.reject(groups, function(g){ return g.name == oldgroup; });
		//console.log(groups);
		groups.push({ name: newgroup });
		this.model.save( { 'chargroup': groups } );
		app.charlist.editGroups(oldgroup, newgroup);
		this.render();
	}
	
	
	
});
