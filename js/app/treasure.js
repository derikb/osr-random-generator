//!Treasure model
var Treasure = Backbone.Model.extend(
	/** @lends Treasure.prototype */
	{
	
	//localStorage: new Backbone.LocalStorage("osr-random-generator-treasure"),
	
	defaults: function() {
		return {
			//title: '[Untitled]',
		}
	},
	
	/**
	 * Treasure model
	 *
	 * @augments external:Backbone.Model
	 * @constructs
	 */	
	initialize:  function() {
		this.set('gems_t', new RandomTable(appdata.treasure.labyrinthlord.gems));
		this.set('jewelry_t', new RandomTable(appdata.treasure.labyrinthlord.jewelry));
		this.set('magic_t', new RandomTable(appdata.treasure.labyrinthlord.magic_items));
	},
	
	create: function() {
				
	},
	
	
	/**
	 * Generate the treasure randomly
	 * @param {String} type a treasure/hoard type or a dungeon level
	 * @returns {String} a description of the treasure
	 */
	generateHoard: function(type) {
		
		var hoard_data = appdata.treasure.labyrinthlord.hoards[type];
		var treasure = [];
		
		var roller = app.randomizer;
		//console.log(hoard_data);
		_.each(hoard_data, function(v,k,l){
			//roll the chance
			chance_roll = roller.roll(100);
			if (chance_roll <= v.chance) {
				if (k == 'magic') {
					var result = this.chooseMagic(v.type);
					treasure = treasure.concat(result);
				} else {
					var result = roller.parseDiceNotation(v.amount);
					if (k == 'gems') {
						result = this.chooseGems(result);
					} else if (k == 'jewelry') {
						result = this.chooseJewelry(result);
					}
					treasure.push(k.capitalize()+': '+result);
				}	
			} else {
				//console.log('chance failed for '+k);
			}
		}, this);
		//console.log(treasure);
		return this.niceString(treasure);
	},
	
	/** 
	 * get gems from the gem table
	 * @param {Number} number how many gems to select
	 * @returns {String} gem description
	 */
	chooseGems: function (number) {
		var o = '';
		var gems = [];
		var gems_t = this.get('gems_t');
		for(var i=1; i<=number; i++) {
			gems_t.generateResult()
			gems.push(gems_t.niceString());
		}
		_.each(gems, function (v){
			o += v+', ';
		}, this);
		o = $.trim(o);
		o = o.replace(/,$/, '');
		return o;
	},
	
	/** 
	 * get jewelry from the jewelry table
	 * @param {Number} number how many jewelry to select
	 * @returns {String} jewelry description
	 */
	chooseJewelry: function(number) {
		var o = '';
		var jewels = [];
		var jewelry_t = this.get('jewelry_t');
		for(var i=1; i<=number; i++) {
			jewelry_t.generateResult()
			jewels.push(jewelry_t.niceString());
		}
		_.each(jewels, function (v){
			o += v+', ';
		}, this);
		o = $.trim(o);
		o = o.replace(/,$/, '');
		return o;
	},
	
	/** 
	 * get jewelry from the jewelry table
	 * @param {Object} data which item tables to use and how many to select { type: number }
	 * @returns {Array} magic item descriptions
	 */
	chooseMagic: function(data) {
		//console.log(data);
		var o = [];
		var magic_t = this.get('magic_t');
		
		_.each(data, function(v, k){
			for(var i=1; i<=v; i++) {
				if (k == 'any') { k=''; }
				magic_t.generateResult(k)
				o.push(magic_t.niceString());
			}
		}, this);
		return o;
	},
	
	/** 
	 * a string of all the treasures
	 * @param {Object|Array|String} treasure array/object/string of treasure descriptions
	 * @returns {String} treasure description as a string
	 */
	niceString: function(treasure) {
		if (treasure == '') { return ''; }
		//console.log(r);
		if (_.isString(treasure)) { return treasure; }
		var o = '';
		_.each(treasure, function (v, k){
			o += v+'<br/>';		
		}, this);
		return o;
	},
	

});