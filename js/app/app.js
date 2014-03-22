//main app classes

//! App Router
var AppRouter = Backbone.Router.extend(
	/** @lends AppRouter.prototype */
{
	
	version: '0.6', 

    routes:{
        "":"list",
		//"list/:id":"someFunction"
    },
 	
	/**
	 * This is the App Controller
	 *
	 * @augments external:Backbone.Router
	 * @constructs
	 */
    initialize: function () {
		this.randomizer = new AppRandomizer();
		//this.loadCustomData();
		this.AppSettings = new AppSettings({ version: this.version });
		this.AppSettings.fetch();
		this.AppSettings.checkVersionUpdate();
		this.AppSettingsView = new AppSettingsView({ model: this.AppSettings });
		$('#settings').html(this.AppSettingsView.render().el);
		
		
		//console.log(this);
		
		
		$('#wilderness-form').append(new WildernessForm({ model: this.AppSettings }).render().el);
		
		$('#dungeon-form').append(new DungeonForm({ model: this.AppSettings }).render().el);
		
		this.creator = new Creator();
		this.exporter = new Exporter();
		this.importer = new Importer();
	},
	
	/**
	 * Retrieve saved data and list out all RandomTables
	 */
    list: function () {

		this.charlist = new CharCollection();
        this.charlistview = new CharList({model:this.charlist});
		this.charlist.fetch({silent: true});
        $('#characters-list').html(this.charlistview.render().el);
	
		$('#character-form').html(new CharForm({ model: this.AppSettings }).render().el);
       			
		this.wildlist = new WildernessCollection();
        this.wildlistview = new WildernessList({model:this.wildlist});
		this.wildlist.fetch({silent: true});
        $('#wilderness-results').html(this.wildlistview.render().el);

		this.dungeonlist = new DungeonCollection();
        this.dungeonlistview = new DungeonList({model:this.dungeonlist});
		this.dungeonlist.fetch({silent: true});
        $('#dungeon-results').html(this.dungeonlistview.render().el);
	
		//load up random tables, first saved ones then hardcoded ones
		this.rtables = new RTable_Collection();
		this.rtables.fetch({silent: true});
        this.rtablelist = new RTable_List({model:this.rtables});
		var load_tables = [];
		_.each(appdata.tables, function(v, k){
			if (typeof v.title == 'undefined') {
				v.title = k;
			}
			if (_.isArray(v)) {
				var newv = { title: k, table: v };
				v = newv;
			}
			v.key = k;
			load_tables.push(v);
		}, this);
		this.rtables.add(load_tables);
        $('#rtable-list').html(this.rtablelist.render().el);

    },
	
	/**
	 * Modal utility
	 * @param {Object} options modal options
	 */
	showModal: function(options) {
		options = $.extend({
			title: 'Modal',
			body: '',
			size: '',
			full_content: ''
		}, options);
		
		$('#editmodal .modal-dialog').removeClass('modal-lg modal-sm');
		if (typeof options.size !== 'undefined') {
			$('#editmodal .modal-dialog').addClass(options.size);
		}
		
		if (options.full_content !== '') {
			$('#editmodal .modal-content').replaceWith(options.full_content);
		} else {
			$('#editmodal .modal-content').empty();
			$('#editmodal .modal-content').append(this.modalHeader(options.title));
			$('#editmodal .modal-content').append('<div class="modal-body"></div>').append(this.modalFooter());
			$('#editmodal .modal-body').append(options.body);
			
		}
		$('#editmodal').modal({});
		$('#editmodal').on('shown.bs.modal', function(e) {
			$(e.target).find('input[type="text"]:first').focus();
		});
	},
	
	/**
	 * Generate the modal header
	 * @param {String} title
	 * @returns {String} the header html
	 */
	modalHeader: function(title) {
		return '<div class="modal-header"><button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button><h4 class="modal-title">'+title+'</h4></div>';
	},
	
	/**
	 * Generate the modal footer
	 * @param {String} buttons
	 * @returns {String} the footer html
	 */
	modalFooter: function(buttons) {
		if (typeof buttons == 'undefined') { buttons = ''; }
		return '<div class="modal-footer">'+buttons+'<button type="button" class="btn btn-default" data-dismiss="modal">Close</button></div>';
	},
	
	/**
	 * Alert utility
	 * @param {String} text Content of the alert
	 * @param {Object} [options] Options such as: atype: Alert type (info, success, danger, warning), className, id
	 * @returns {Object} bootstrap alert as a jquery object
	 */
	showAlert: function(text, options) {
		if (typeof text == 'undefined' || text == '') { return; }
		
		options = $.extend({
			atype: 'info',
			className: '',
			id: ''
		}, options);
				
		var $alert = $('<div></div>')
			.addClass('alert alert-'+options.atype+ ' '+options.className)
			.attr('id', options.id);
		$alert.append('<button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>');
		$alert.append(text);
		return $alert;
	}
	
});


//! AppSettings - for storing settings
var AppSettings = Backbone.Model.extend(
	/** @lends AppSettings.prototype */
	{
	
	localStorage: new Backbone.LocalStorage("osr-random-generator-settings"), // Unique name within your app.
	
	defaults: function() {
		return {
			id: 'settings',
			version: '',
			rules_set: 'lotfp',
			personality_type: 'onewordtraits',
			appearance_type: 'onthenpc_appearance',
			goals_type: 'character_goals',
			occupation_type: 'medieval_occupations',
			personality_count: 2,
			appearance_count: 2,
			chargroup: [],
			character_display: 'full',
			ability_display: 'full',
			
			dungeon: {
				stocking_table: 'moldvay_stocking',
				trap_table: 'traps_campbell',
				special_table: 'bag_tricks_2',
				monster_table: 'labyrinthlord',	
			},
			
			
			wilderness: {
				hexdressing_count: 3,
				encounter_count: 5,
				hexdressing_default: 'hex_dressing'
			}
			
			
		}	
	},
	
	/**
	 * This is the model for the App Settings
	 *
	 * @augments external:Backbone.Model
	 * @constructs
	 */
	initialize: function(options) {
		this.set('version', options.version);
	},
	
	
	checkVersionUpdate: function() {
		var changed = this.changedAttributes();
		//console.log(changed);
		if (changed.version) {
			//console.log(changed)
		}
		
	}
	
});

//! AppSettingsView - form to edit settings
var AppSettingsView = Backbone.View.extend(
	/** @lends AppSettingsView.prototype */
	{
	
	tagName: 'form',
	
	attributes : function () {
		return {
			id: 'app_setting_form'
		};
	},
	
	events: {
		'submit': 'editSettings',
	},
	
	/**
	 * This is the view for the App Settings
	 *
	 * @augments external:Backbone.View
	 * @constructs
	 */
	initialize: function() {
		
	},
	
	/**
	 * Save the settings
	 */
	editSettings: function(e) {
		e.preventDefault();
		formdata = $(e.target).serializeObject();		
		this.model.save(formdata);
		var $alert = $('<div class="alert alert-success fade in"><a class="close" data-dismiss="alert" href="#" aria-hidden="true">&times;</a>Settings Saved.</div>');
		$(this.el).prepend($alert);
		$alert.delay(3 * 1000).fadeOut()
	},
	
	/**
	 * Show the settings form
	 */
	render: function() {
		var form = '';
		form += '<div class="alert alert-info">Settings will be saved to your local browser storage for re-use.</div>';
		form += '<div class="row">';
		form += '<div class="col-sm-6">';
 		form += '<div class="form-group"><label for=rules_set class="control-label">Rules</label><select class="form-control" id="rules_set" name="rules_set">';
			_.each(appdata.rules.options, function(v,k,l){
				var sel = (v.option == this.model.get('rules_set')) ? 'selected=selected' : '';
				form += '<option value='+v.option+' '+sel+'>'+v.label+'</option>';
			}, this);		
		form += '</select><div class="help-block">Only effects NPCs at this point.</div></div>';
		
		form += '<fieldset><legend>NPC Settings</legend>';
		
		form += '<fieldset><legend>Display</legend>';
		
			form += '<div class="row"><div class="form-group col-sm-6">';
			
			var char_display = [{ option: 'full', label: 'Full Character Display' }, { option: 'soft', label: 'No Stats/Numbers' } ];
    		_.each(char_display, function(v){
    			var sel = (v.option == this.model.get('character_display')) ? 'checked=checked' : '';
	    		form += '<label class="radio"><input type="radio" name="character_display" value="'+v.option+'" '+sel+' /> '+v.label+'</label>'
    		
    		}, this);
			form += '<div class="help-block">If you don\'t want the numbers, change this setting.</div></div>';
			
			form += '<div class="form-group col-sm-6">';
			
			var ability_display = [{ option: 'full', label: 'Full (all abilities/scores/modifiers)' }, { option: 'minimal', label: 'Minimal (Only abilities with modifiers not 0)' } ];
    		_.each(ability_display, function(v){
    			var sel = (v.option == this.model.get('ability_display')) ? 'checked=checked' : '';
	    		form += '<label class="radio"><input type="radio" name="ability_display" value="'+v.option+'" '+sel+' /> '+v.label+'</label>'
    		
    		}, this);
			form += '<div class="help-block">For shorter character blocks pick "minimal".</div></div>';
			
			form += '</div></fieldset>';
		
		form += '<div class="row"><div class="form-group col-sm-9"><label for="personality_type" class="control-label">Personality List</label><select class="form-control" id="personality_type" name="personality_type">';
    		_.each(appdata.personality_options, function(v){
    			var sel = (v.option == this.model.get('personality_type')) ? 'selected=selected' : '';
	    		form += '<option value="'+v.option+'" '+sel+'>'+v.label+'</option>';
    		}, this);
		form += '</select><div class="help-block">For added color.</div></div>';
		
		form += '<div class="form-group col-sm-3"><label for="personality_count" class="control-label"># Traits</label><select class="form-control" id="personality_count" name="personality_count">';
			for(var i=0;i<=4;i++) {
				var sel = (i == this.model.get('personality_count')) ? 'selected=selected' : '';
	    		form += '<option value="'+i+'" '+sel+'>'+i+'</option>';
			}
		form += '</select><div class="help-block"></div></div></div>';
		
		form += '<div class="row"><div class="form-group col-sm-9"><label for="appearance_type" class="control-label">Appearance List</label><select class="form-control" id="appearance_type" name="appearance_type">';
    		_.each(appdata.appearance_options, function(v){
    			var sel = (v.option == this.model.get('appearance_type')) ? 'selected=selected' : '';
	    		form += '<option value="'+v.option+'" '+sel+'>'+v.label+'</option>';
    		}, this);
		form += '</select><div class="help-block">For added color.</div></div>';
		
		form += '<div class="form-group col-sm-3"><label for="appearance_count" class="control-label"># Traits</label><select class="form-control" id="appearance_count" name="appearance_count">';
			for(var i=0;i<=4;i++) {
				var sel = (i == this.model.get('appearance_count')) ? 'selected=selected' : '';
	    		form += '<option value="'+i+'" '+sel+'>'+i+'</option>';
			}
		form += '</select><div class="help-block"></div></div></div>';
		
				
		form += '</fieldset>';
		
		form += '<div class="form-group"><button type=submit class="btn btn-primary">Save Settings</button></div>';
		
		form += '</div>';
		
		form += '</div>';
	
		$(this.el).html(form);
		return this;
	}
	
	
});


/**
 * //! AppRandomizer - handles app randomization functions
 * @constructor
 */
var AppRandomizer = function() {
	
	/**
	 * Random value selection
	 * @param {Array} values an array of strings from which to choose
	 * @param {Array} weights a matching array of integers to weight the values (i.e. values and weights are in the same order)
	 * @returns {String} the randomly selected Array element from values param
	 */
	this.getWeightedRandom = function (values, weights){ 
	    n = 0; 
	    num = _.random(1, this.arraySum(weights));
	    //console.log('roll '+num);
	    //console.log('values'+values);
	    for(var i = 0; i < values.length; i++) {
	        n = n + weights[i]; 
	        if(n >= num){
	            break; 
	        }
	    } 
	    return values[i]; 
	}
	
	
	/**
	 * Random value selection, wrapper for getWeightedRandom that processes the data into values/weights arrays
	 * @param {Object|Array} data An object or array of data 
	 * @returns {String} the randomly selected Object property name, Array element, or value of the "label" property
	 */
	this.rollRandom = function(data) {
		var values = [];
		var weights = [];
		//console.log(data);
			
		if ($.isArray(data)) {
			_.each(data, function(v,k,l){
				//console.log(typeof v);
				if (typeof v == 'object') {
					if (typeof v.weight !== 'undefined') {
						weights.push(v.weight);
					} else {
						weights.push(1);
					}
					values.push(v.label);
				} else if (typeof v == 'string') {
					//nothing
					weights.push(1);
					values.push(v);
				}
			}, this);
		} else if (typeof data == "object") {
			_.each(data, function(v,k,l){
				if (typeof v.weight !== 'undefined') {
					weights.push(v.weight);
				} else {
					weights.push(1);
				}
				values.push(k);
			}, this);
		}
		//console.log(values);
		//console.log(weights);
		return this.getWeightedRandom(values, weights);
	}
	
	/**
	 * Dice rolling simulator
	 * @param {Number} [die=6] Die type
	 * @param {Number} [number=1] Number of times to roll the die
	 * @param {Number} [modifier=0] Numeric modifier to dice total
	 * @param {String} [mod_op=+] Operator for the modifier (+,-,/,*)
	 * @returns {Number} Number rolled (die*number [mod_op][modifier])
	 */
	this.roll = function(die, number, modifier, mod_op) {
		//console.log(arguments);
		if (typeof modifier == 'undefined') {
			var modifier = 0;
		} else {
			modifier = parseInt(modifier);
		}
		if (typeof number == 'undefined') {
			var number = 1;
		} else {
			number = parseInt(number);
		}
		if (typeof die == 'undefined') {
			var die = 6;
		} else {
			die = parseInt(die);
		}
		if (typeof mod_op == 'undefined') {
			var mod_op = '+';
		}
		
		sum = 0;
		for (var i=1; i<=number; i++) {
			sum = sum + _.random(1, die);
		}
		if (modifier == 0) {
			return sum;
		}
		
		switch (mod_op) {
			case '*':
				sum = sum * modifier;
				break;
			case '-':
				sum = sum - modifier;
				break;
			case '/':
				sum = sum / modifier;
				break;	
			case '+':
			default:
				sum = sum + modifier;
				break;
		} 
		return  Math.round(sum);
	}
	
	/**
	 * Sum an array
	 * @param {Array} arr an array of numbers
	 * @returns {Number} Total value of numbers in array
	 */
	//sum the values of an array
	this.arraySum = function(arr) {
		total = 0;
		for(var i = 0; i < arr.length; i++) {
			v = parseFloat(arr[i]);
			if (!isNaN(v)) total += v; 
		} 
		return total;
	},
	
	/**
	 * Perform token replacement.  Only table and roll actions are accepted
	 * @param {String} token A value passed from {@link AppRandomizer#findToken} containing a token(s) {{SOME OPERATION}} Tokens are {{table:SOMETABLE}} {{table:SOMETABLE:SUBTABLE}} {{table:SOMETABLE*3}} (roll that table 3 times) {{roll:1d6+2}} (etc)
	 * @returns {String} The value with the token(s) replaced by the operation
	 */
	this.convertToken = function(token) {
		token = token.replace('{{', '').replace('}}', '');
		string = '';
		
		parts = token.split(':');
		if (parts.length == 0) { return ''; }
		
		//Only table and roll actions are accepted
		switch (parts[0]) {
			case "table":
				var multiplier = 1;
				if (parts[1].indexOf('*') !== -1) {
					var x = parts[1].split('*');
					parts[1] = x[0];
					multiplier = x[1];
				}
				var subtables = parts[1].split('.');
				vlist = 'appdata';
				for(i=0;i<subtables.length;i++) {
					vlist += '.'+subtables[i];
				}
				eval('table = '+vlist+';');
				var t = new RandomTable(table);
				
				if (typeof parts[2] !== 'undefined' && parts[2].indexOf('*') !== -1) {
					var x = parts[2].split('*');
					parts[2] = x[0];
					multiplier = x[1];
				}
				subtable = (typeof parts[2] == 'undefined') ? '' : parts[2];
				
				for(var i=1; i<=multiplier; i++) {
					t.generateResult(subtable);
					string += t.niceString()+', ';
				}
				string = $.trim(string);
				string = string.replace(/,$/, '');
				
				break;
			case "roll":
				string = app.randomizer.parseDiceNotation(parts[1]);
				break;
			default:
				string = '';
		}
		return string;
	},
	
	/**
	 * Look for tokens to perform replace action in {@link AppRandomizer#convertToken}
	 * @param {String} string usually a result from a RandomTable
	 * @returns {String} String with tokens replaced (if applicable)
	 */
	this.findToken = function(string) {
		//console.log('findToken');
		regexp = new RegExp('(\{{2}.+?\}{2})', 'g');
		newstring = string.replace(regexp, this.convertToken);
		return newstring;
	},
	
	/**
	 * takes a string like '3d6+2', parses it, and puts it through {@link AppRandomizer#roll}
	 * @params {String} string a die roll notation
	 * @returns {Number} the result of the roll
	 */
	this.parseDiceNotation = function(string) {
		//
		var m = string.match(/^([0-9]+)d([0-9]+)$/);
		if (m) {
			//console.log(m);
			return this.roll(parseInt(m[2]), parseInt(m[1]));
		}
		
		var m = string.match(/^([0-9]+)d([0-9]+)([\+\-\*\/])([0-9]+)$/);
		if (m) {
			//console.log(m);
			return this.roll(parseInt(m[2]), parseInt(m[1]), parseInt(m[4]), m[3]);
		}
		
		return '';
		
	}
	
		
};


//////////////////////////////////////////////////////////////////////////////////////////
//helper functions
//////////////////////////////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////////////////////////////
/**
 * capitalize first letter
 * @returns {String} string with first letter capitalized.
 */
String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}


/**
 * conver <br> tags to new lines
 * @returns {String} string with new lines instead of br tags
 */
String.prototype.br2nl = function() {
    return this.replace(/<br\s*\/?>/mg,"\n");
}

/**
 * conver <br> tags to new lines
 * @returns {String} string with new lines instead of br tags
 */
String.prototype.nl2br = function() {
    return this.replace(/([\n\r]+)/mg, "<br/>");
}

/**
 * Flatten an array into a string
 * @returns {String} a comma separate, capitalized string of the array
 */
Array.prototype.flatten = function(){
	var o = '';
	_.each(this, function(v){
		o += v.capitalize()+', ';
	}, this);
	o = $.trim(o);
	o = o.replace(/,$/, '');
	return o;
}

/**
 * serialize a form
 * @returns {String} form data as object
 */
$.fn.serializeObject = function()
{
    var o = {};
    var a = this.serializeArray();
    $.each(a, function() {
        if (o[this.name] !== undefined) {
            if (!o[this.name].push) {
                o[this.name] = [o[this.name]];
            }
            o[this.name].push(this.value || '');
        } else {
            o[this.name] = this.value || '';
        }
    });
    return o;
};