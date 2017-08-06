//!Names model
var Names = Backbone.Model.extend(
	/** @lends Names.prototype */
	{
	
	defaults: function() {
		return {
			listCount: 10,
			markov: {},
		}
	},
	
	initialize:  function() {
		
	},
	
	
	generateList: function(nametypes, create) {
		var names = {};
		if (typeof create == 'undefined') { create = false; }
		
		if (!_.isArray(nametypes)) {
			nametypes = [nametypes];
		}
		
		_.each(nametypes, function(v,k,l){
			var a = { male: [], female: [] };
			var n = this.get('listCount');
			for(var i=1; i<=n; i++) {
				var gender = (i <= Math.ceil(n/2)) ? 'male' : 'female';
				if (create && v !== 'holmesian' && v !== 'demonic') {
					a[gender].push(this.createName(v, gender, true));
				} else {
					a[gender].push(this.generateName(v, gender));
				}
			}
			names[v] = a;
		}, this);
		
		return names;
	},
	
	/**
	 * Generate a Holmes name
	 * @returns {String} name
	 */
	holmesname: function() {
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
	 * Demonic name
	 * Taken from Jeff Rients, based on Goetia, as implemented here: http://www.random-generator.com/index.php?title=Goetic_Demon_Names
	 */
	demonname: function() {
		var name = '';
		var format = app.randomizer.getWeightedRandom([ ['first','last'],['first','inner','last'],['first','inner','inner','last'],['first','inner','inner','inner','last'] ], [55,35,7,3]);
		for (i=0; i < format.length; i++) {
			name += app.randomizer.rollRandom(appdata.name.demonic[format[i]]);
			
		}
		return name;
	},
	
	/**
	 * Create a name
	 * @param {String} name_type What name list/process to use else random
	 * @param {String} gender male, female, random, ''
	 * @param {String} style first=first name only, else full name
	 * @returns {String} a name
	 */
	generateName: function(name_type, gender, style) {
		var name = '';
		
		if (typeof name_type == 'undefined' || name_type == '' || name_type == 'random') {
			//randomize a type...
			var name_type = app.randomizer.rollRandom(_.keys(appdata.name.options));
		}
		if (typeof gender == 'undefined' || gender == 'random') {
			//randomize a gender...
			var gender = app.randomizer.rollRandom(['male', 'female']);
		}
		if (typeof style == 'undefined' || style !== 'first') {
			//randomize a gender...
			var style = '';
		}
		
		switch (name_type) {
		 	case "holmesian":
				name = this.holmesname();
				break;
			case "demonic":
				name = this.demonname();
				break;
			case "cornish":
			case "flemish":
			case "dutch":
			case "turkish":
			default:
				name = app.randomizer.rollRandom(appdata.name[name_type][gender]).capitalize();
				if (typeof appdata.name[name_type]['surname'] !== 'undefined' && style !== 'first') {
					name += ' '+app.randomizer.rollRandom(appdata.name[name_type]['surname']).capitalize();
				}
				name = app.randomizer.findToken(name).trim();
				break;
		}
		return name;
	},
	/**
	 * Create a sur/last name only
	 * @param {String} name_type what list/process to use, else random
	 * @returns {String} a name
	 */
	generateSurname: function(name_type) {
		var name = '';
		if (typeof name_type == 'undefined' || name_type == '' || name_type == 'random') {
			//randomize a type...
			var name_type = app.randomizer.rollRandom(_.keys(appdata.name.options));
		}
		switch (name_type) {
		 	case "holmesian":
				name = this.holmesname();
				break;
			case "cornish":
			case "flemish":
			case "dutch":
			case "turkish":
			default:
				name = app.randomizer.rollRandom(appdata.name[name_type]['surname']).capitalize();
				name = app.randomizer.findToken(name);
				break;
		}
		return name;
	},
	
	/**
	 * Create a name using Markov chains
	 * @param {String} name_type what list/process to use, else random
	 * @param {String} gender male or female or both
	 * @param {Boolean} surname include a surname or not
	 * @returns {String} a name
	 */
	createName: function(name_type, gender, surname) {
		if (typeof name_type == 'undefined') { return ''; }
		if (typeof surname == 'undefined') { surname = false; }
		if (!appdata.name[name_type]) { return ''; }
		if (typeof gender == 'undefined') { gender = ''; }
		var mkey = name_type+'_'+gender;
		var firstname = '';
		var lastname = '';
		var thename = '';
		
		if (!this.get('markov').memory) {
			var markov = new Markov({ order: 2 });
			this.set('markov', markov);
		} else {
			var markov = this.get('markov');
		}
		
		if (!markov.memory[mkey]) {		
			//console.log('learn '+mkey);
			
			if (gender == '') {
				var namelist = appdata.name[name_type]['male'];
				namelist = namelist.concat( appdata.name[name_type]['female'] );
			} else {
				var namelist = appdata.name[name_type][gender];
			}
			_.each(namelist, function (v,k){
				markov.learn(mkey, v);
			}, this);
		}
		
		if (surname) {
			var skey = name_type+'_last';
			if (!markov.memory[skey]) {		
				//console.log('learn surname '+skey);
				if (appdata.name[name_type]['surname']) {
					var namelist = appdata.name[name_type]['surname'];
					_.each(namelist, function (v,k){
						markov.learn(skey, v);
					}, this);
				} else {
					markov.memory[skey] = {};
				}
			}
			
			lastname = this.capitalizeName(markov.generate(skey));	
		}
		
		thename = this.capitalizeName(markov.generate(mkey));
		if (lastname !== '') {
			thename += ' '+lastname;
		}
		
		return thename;
	},
	
	/**
	 * Capitalize names, account for multiword lastnames like "Van Hausen"
	 * Alternately could probably split on space, map array to capitalize and then join with space... would that be faster?
	 */
	capitalizeName: function(name) {
		//need to find spaces in name and capitalize letter after space
		name = name.replace(/\s([a-z])/mg, function(match, p1){ return ' '+p1.toUpperCase(); });
		
		return name.charAt(0).toUpperCase() + name.slice(1);
	}
		
});


//!Name  creation form
var NameForm = Backbone.View.extend(
	/** @lends NameForm.prototype */
	{
		
	model: Names,
	tagName: 'form',
	id: 'name-form',
	
    events:{
        "submit": "showResults",
    },
	
	/**
	 * This is the view for a name creation form
	 *
	 * @augments external:Backbone.View
	 * @constructs
	 */
    initialize:function () {
        //this.listenTo(this.model, 'change', this.render);
    },
    
    render: function () {
    	//var rules = appdata.rules[this.model.get('rules_set')];
    	var form = '<h1>Generate Names</h1>';
    	form += '<div class="messages"></div>';
    	form += '<div class="form-group">';
    	form += '<fieldset><legend>Name Types</legend>';
    		_.each(appdata.name.options, function(v,k){
    			form += '<label for="'+k+'" class="checkbox-inline"><input type="checkbox" name="nametype" id="'+k+'" value="'+k+'" checked=checked> '+v+'</label>';
			});
    	form += '</fieldset>';
    	form += '</div>';
    	
    	form += '<div class="form-group"><label for=create class="check"><input type=checkbox name=create id=create value=1 /> Create new names</label></div>';
			    	
    	form += '<div class="form-group"><button type=submit class="btn btn-primary">Generate</button></div>';
    	//form += '</div>';
    	$(this.el).html(form);
        return this;
    },
    
    /**
     * Output the generated names
     */
    showResults: function(e) {
    	e.preventDefault();
    	var formdata = $(e.target).serializeObject();
		//console.log(formdata);
		var names = this.model.generateList(formdata.nametype, formdata.create);
    
	    var html = '<h1>Names</h1>';
	    _.each(names, function(v,k,l) {
		    html += '<section class="name-block"><h1>'+k.capitalize()+'</h1>';
		    html += '<div class="row">';
		    _.each(v, function(z,y){
			    if (_.isArray(z) && z.length > 0) {
					html += '<div class="col-sm-6"><h2>'+y.capitalize()+'</h2><ul>';
					_.each(z, function(n){
						html += '<li>'+n+'</li>';
					}, this);
					html += '</ul></div>';
			    }
		    }, this);
		    html += '</div></section>';
	    }, this);
	    
		$('#name-results').html(html);
    }

    
});

/**
 * Adapted from http://blog.javascriptroom.com/2013/01/21/markov-chains/
 */
var Markov = function(config){
	if (typeof config == 'undefined') { var config = {}; }
	this.memory = {};
	this.separator = (config.separator) ? config.separator : '';
	this.order = (config.order) ? config.order : 2;
	/**
	 * Feed text
	 * @param {String} key key for the chain (so we can store multiples
	 * @param {String} txt word or phrase
	 */
    this.learn = function (key, txt) {
		var mem = (this.memory[key]) ? this.memory[key] : {};
		this.breakText(txt, learnPart);
		
		/**
		 * add element to memory
		 * @param {Array} key array for chain (converted to a,b,c by toString()), implicitly coerced into a string 'a,b,c'
		 * @param {String} value next element in chain
		 */
		function learnPart (key, value) {
			if (!mem[key]) {
				mem[key] = {};
			}
			if (mem[key][value]) {
				mem[key][value].weight = mem[key][value].weight + 1;
			} else {
				mem[key][value] = { weight: 1 };
			}
			return mem;
		}
		
		this.memory[key] = mem;
    };
	/**
	 * Return a generated response
	 * @param {String} key key for the chain (so we can store multiples
	 * @param {Array} seed letters to start the response (?)
	 */
	this.generate = function (key, seed) {
		if (!seed) {
			seed = this.genInitial();
		}
		this.cur_key = key;
		return seed.concat(this.step(seed, [])).join(this.separator);
	};
	/**
	 * iterate through, calls self
	 * @param {Array} state array of most recent x(x=order) elements in chain, implicitly coerced into a string 'a,b,c'
	 * @param {Array} ret the chain
	 * @return {Array}
	 */
	this.step = function (state, ret) {
		var nextAvailable = this.memory[this.cur_key][state] || [''];
		next = app.randomizer.rollRandom(nextAvailable);
		//we don't have anywhere to go
		if (!next) {
			return ret;
		}
		ret.push(next);
		var nextState = state.slice(1);
		nextState.push(next);
		return this.step(nextState, ret);
	};
	/**
	 * Chunk the word or phrase
	 * @param {String} txt the text to chunk
	 * @param {Function} cb callback function
	 */
    this.breakText = function (txt, cb) {
        var parts = txt.split(this.separator),
            prev = this.genInitial();
 
        parts.forEach(step);
        cb(prev, '');
		
		/**
		 * Apply the callback then move forward in the chain
		 * @param {String} next the current value in the txt
		 */
        function step (next) {
	        next = next.toLowerCase();
            cb(prev, next);
            prev.shift();
            prev.push(next);
        }
    };
	
	/**
	 * Generate a starting array for the chain based on the order number
	 * @return {Array}
	 */
    this.genInitial = function () {
        var ret = [];
        for (
            var i = 0;
            i < this.order;
            ret.push(''), i++
        );
 
        return ret;
    };
};

