//main app classes

//! App Router
var AppRouter = Backbone.Router.extend(
	/** @lends AppRouter.prototype */
{
	
	version: '0.85', 

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
		//console.log(this);
		
	},
	
	/**
	 * Retrieve saved data and list out all RandomTables
	 */
    list: function () {

		this.AppSettings = new AppSettings({ version: this.version });
		this.AppSettings.fetch();
		this.AppSettings.checkVersionUpdate();

		$('#mission-form').html(new MissionForm({ model: this.AppSettings }).render().el);
		
		$('#wilderness-form').html(new WildernessForm({ model: this.AppSettings }).render().el);
		
		$('#dungeon-form').html(new DungeonForm({ model: this.AppSettings }).render().el);
		
		this.creator = new Creator();
		this.exporter = new Exporter();
		this.importer = new Importer();

		this.charlist = new CharCollection();
        this.charlistview = new CharList({model:this.charlist});
		this.charlist.fetch({silent: true});
        $('#characters-results').html(this.charlistview.render().el);
	
		$('#character-form').html(new CharForm({ model: this.AppSettings }).render().el);
		
		this.names = new Names();
		$('#name-form').html(new NameForm({ model: this.names  }).render().el);
		
		this.missionlist = new MissionCollection();
        this.missionlistview = new MissionList({model:this.missionlist});
		this.missionlist.fetch({silent: true});
        $('#mission-results').html(this.missionlistview.render().el);
       			
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

		this.monsters = new Monster_Collection();
        this.monsterslist = new Monster_List({model:this.monsters});
        this.monsters.loadMonsters();
		$('#monster-list').html(this.monsterslist.render().el);

		this.AppSettingsView = new AppSettingsView({ model: this.AppSettings });
		$('#settings').html(this.AppSettingsView.render().el);

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
			personality_type: 'colonial_personality',
			appearance_type: 'colonial_appearance',
			goals_type: 'colonial_goals',
			occupation_type: 'colonial_occupations',
			personality_count: 2,
			appearance_count: 2,
			chargroup: [],
			character_display: 'full',
			ability_display: 'full',
			monster_table: 'labyrinthlord',
			
			dungeon: {
				stocking_table: 'moldvay_stocking',
				trap_table: 'traps_campbell',
				special_table: 'bag_tricks_2',
			},
			
			wilderness: {
				hexdressing_count: 3,
				encounter_count: 5,
				hexdressing_default: 'hex_dressing'
			},
			
			encounter_tables: {
				road: '',
				forest: '',
				swamp: '',
				settlement: '',
				rivers: '',
				town: ''
			},
			
			mission_tables: {
				complication: '',
				antagonist: '',
				patron: '',
				reward: ''
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
		
	},
	
	/**
	 * Export the saved settings
	 * @param {String} [which] placeholder
	 * @param {Boolean} [compress=false] if true JSON will not be indented with tabs/lines
	 * @returns {Array} Array of  objects ? 
	 */
	exportOutput: function(which, compress) {
		if (typeof which == 'undefined') {
			which = '';
		}
		if (typeof compress == 'undefined') {
			compress = false;
		}
		
		var att = _.clone(this.attributes);
		// _.each(att, function(v,k,l){
// 			if (!editmode && _.isEmpty(v)) {
// 				delete l[k];
// 			}
// 		}, this);
		delete att.id;
		return att;
		
	}
	
});

//! AppSettingsView - form to edit settings
var AppSettingsView = Backbone.View.extend(
	/** @lends AppSettingsView.prototype */
	{
	
	model: AppSettings,
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
		
		//convert encounter settings into an object
		formdata.encounter_tables = {};
		var encounter_tables = this.model.get('encounter_tables');
		_.each(encounter_tables, function(v,k) {
			if (formdata['encounters_'+k]) {
				formdata.encounter_tables[k] = formdata['encounters_'+k];
				delete(formdata['encounters_'+k]);
			}
		}, this);
		
		//convert mission settings into an object
		formdata.mission_tables = {};
		var mission_tables = this.model.get('mission_tables');
		_.each(mission_tables, function(v,k) {
			if (formdata['mission_'+k]) {
				formdata.mission_tables[k] = formdata['mission_'+k];
				delete(formdata['mission_'+k]);
			}
		}, this);
		
		//convert wilderness fields to object
		formdata.wilderness = this.model.get('wilderness');
		formdata.wilderness.encounter_count = formdata.wilderness_encounter_count;
		delete(formdata.wilderness_encounter_count);
		formdata.wilderness.hexdressing_count = formdata.wilderness_hexdressing_count;
		delete(formdata.wilderness_hexdressing_count);
		formdata.wilderness.hexdressing_default = formdata.wilderness_hexdressing_default;
		delete(formdata.wilderness_hexdressing_default);
		
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
		form += '<div class="alert alert-info"><p>Settings will be saved to your local browser storage for re-use.</p><p>To see the effects of settings changes you should reload after changing them.</div>';
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
			
		form += '<div class="row"><div class="form-group col-sm-12"><label for="occupation_type" class="control-label">Occupation List</label><select class="form-control" id="occupation_type" name="occupation_type">';
    		_.each(app.rtables.getByTags('occupation'), function(v){
    			var sel = (v.get('key') == this.model.get('occupation_type')) ? 'selected=selected' : '';
	    		form += '<option value="'+v.get('key')+'" '+sel+'>'+v.get('title')+'</option>';
    		}, this);
		form += '</select><div class="help-block">For 0 level NPCs. Tag a table with "occupation" to have it appear here.</div></div></div>';
		
		form += '<div class="row"><div class="form-group col-sm-9"><label for="personality_type" class="control-label">Personality List</label><select class="form-control" id="personality_type" name="personality_type">';
    		_.each(app.rtables.getByTags('personality'), function(v){
    			var sel = (v.get('key') == this.model.get('personality_type')) ? 'selected=selected' : '';
	    		form += '<option value="'+v.get('key')+'" '+sel+'>'+v.get('title')+'</option>';
    		}, this);
		form += '</select><div class="help-block">For added color. Tag a table with "personality" to have it appear here.</div></div>';
		
		form += '<div class="form-group col-sm-3"><label for="personality_count" class="control-label"># Traits</label><select class="form-control" id="personality_count" name="personality_count">';
			for(var i=0;i<=4;i++) {
				var sel = (i == this.model.get('personality_count')) ? 'selected=selected' : '';
	    		form += '<option value="'+i+'" '+sel+'>'+i+'</option>';
			}
		form += '</select><div class="help-block"></div></div></div>';
		
		form += '<div class="row"><div class="form-group col-sm-9"><label for="appearance_type" class="control-label">Appearance List</label><select class="form-control" id="appearance_type" name="appearance_type">';
    		_.each(app.rtables.getByTags('appearance'), function(v){
    			var sel = (v.get('key') == this.model.get('appearance_type')) ? 'selected=selected' : '';
	    		form += '<option value="'+v.get('key')+'" '+sel+'>'+v.get('title')+'</option>';
    		}, this);
		form += '</select><div class="help-block">For added color. Tag a table with "appearance" to have it appear here.</div></div>';
		
		form += '<div class="form-group col-sm-3"><label for="appearance_count" class="control-label"># Traits</label><select class="form-control" id="appearance_count" name="appearance_count">';
			for(var i=0;i<=4;i++) {
				var sel = (i == this.model.get('appearance_count')) ? 'selected=selected' : '';
	    		form += '<option value="'+i+'" '+sel+'>'+i+'</option>';
			}
		form += '</select><div class="help-block"></div></div></div>';
		
		form += '<div class="row"><div class="form-group col-sm-12"><label for="goals_type" class="control-label">Goals List</label><select class="form-control" id="goals_type" name="goals_type">';
    		_.each(app.rtables.getByTags('goals'), function(v){
    			var sel = (v.get('key') == this.model.get('goals_type')) ? 'selected=selected' : '';
	    		form += '<option value="'+v.get('key')+'" '+sel+'>'+v.get('title')+'</option>';
    		}, this);
		form += '</select><div class="help-block">Tag a table with "goals" to have it appear here.</div></div></div>';
				
		form += '</fieldset>';
		
		form += '<fieldset><legend>Other Settings</legend>';
		
		form += '<div class="row"><div class="form-group col-sm-9"><label for="monster_table" class="control-label">Monster Table</label><select class="form-control" id="monster_table" name="monster_table">';
    		_.each(appdata.monsters, function(v,k){
    			var sel = (k == this.model.get('monster_table')) ? 'selected=selected' : '';
	    		form += '<option value="'+k+'" '+sel+'>'+k+'</option>';
    		}, this);
		form += '</select><div class="help-block">For generators and the "Monsters" tab.</div></div></div>';
		
		form += '</fieldset>';
		
		form += '</div>';
		
		form += '<div class="col-sm-6">';
			
			form += '<fieldset><legend>Mission Settings</legend>';
						
			var mission_tables = this.model.get('mission_tables');
			
			_.each(mission_tables, function(v,k){
				
				form += '<div class="form-group"><label for=mission_'+k+' class="control-label">Mission '+k.capitalize()+'</label><select class="form-control" id="mission_'+k+'" name="mission_'+k+'">';			
					_.each(app.rtables.getByTags('mission_'+k), function(t){
						var sel = (t.get('key') == v) ? 'selected=selected' : '';
						form += '<option value='+t.get('key')+' '+sel+'>'+t.get('title')+'</option>';
					}, this);		
				form += '</select><div class="help-block">Tag a table with "mission_'+k+'" and reload to see it in this list.</div></div>';
				
			}, this);
			
			form += '</fieldset>';
		
		
			form += '<fieldset><legend>Wilderness Settings</legend>';
			
			form += '<div class="row"><div class="form-group col-sm-6"><label for=wilderness_encounter_count class="control-label">Encounters to Generate</label><input type="number" class="form-control" id="wilderness_encounter_count" name="wilderness_encounter_count" value="'+this.model.get('wilderness').encounter_count+'" /></div>';
			
			form += '<div class="form-group col-sm-6"><label for=wilderness_hexdressing_count class="control-label">Hexdressing to Generate</label><input type="number" class="form-control" id="wilderness_hexdressing_count" name="wilderness_hexdressing_count" value="'+this.model.get('wilderness').hexdressing_count+'" /></div>';
			
			form += '</div>'; //.row
			
			var hexdressing_default = this.model.get('wilderness').hexdressing_default; 
			form += '<div class="form-group"><label for="wilderness_hexdressing_default" class="control-label">Default Hexdressing Table</label><select class="form-control" id="wilderness_hexdressing_default" name="wilderness_hexdressing_default">';
				_.each(app.rtables.getByTags('hexdressing'), function(t){
					var sel = (t.get('key') == hexdressing_default) ? 'selected=selected' : '';
					form += '<option value='+t.get('key')+' '+sel+'>'+t.get('title')+'</option>';
				}, this);			
			form += '</select><div class="help-block">If a subtable called "hexdressing" is not defined for the terrain encounter table then this table will be used instead. Tag a table with "hexdressing" to have it appear here.</div></div>';
			
			
			var encounter_tables = this.model.get('encounter_tables');
			
			_.each(encounter_tables, function(v,k){
				
				form += '<div class="form-group"><label for=encounters_'+k+' class="control-label">'+k.capitalize()+' Encounters</label><select class="form-control" id="encounters_'+k+'" name="encounters_'+k+'">';			
					_.each(app.rtables.getByTags('encounters'), function(t){
						var sel = (t.get('key') == v) ? 'selected=selected' : '';
						form += '<option value='+t.get('key')+' '+sel+'>'+t.get('title')+'</option>';
					}, this);		
				form += '</select><div class="help-block">Tag a table with "encounters" and reload to see it in this list.</div></div>';
				
			}, this);
			
			form += '</fieldset>';
		form += '</div>';
		
		form += '</div>';
		
		form += '<div class="form-group"><button type=submit class="btn btn-primary">Save Settings</button></div>';
	
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
		var modifier = (typeof modifier == 'undefined') ? 0 : parseInt(modifier);
		var die = (typeof die == 'undefined') ? 6 : parseInt(die);
		var mod_op = (typeof mod_op == 'undefined') ? '+' : mod_op;

		if (typeof number == 'undefined') {
			var number = 1;
		} else if (number == 0) {
			number = 1;
		} else {
			number = parseInt(number);
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
	 * @param {String} token A value passed from {@link AppRandomizer#findToken} containing a token(s) {{SOME OPERATION}} Tokens are {{table:SOMETABLE}} {{table:SOMETABLE:SUBTABLE}} {{table:SOMETABLE*3}} (roll that table 3 times) {{roll:1d6+2}} (etc) (i.e. {{table:colonial_occupations:laborer}} {{table:color}} also generate names with {{name:flemish}} (surname only) {{name:flemish:male}} {{name:dutch:female}}
	 * 
	 * Note: this function runs out of scope (?) via the replace function, so "this" does not refer to the randomizer object
	 *
	 * @returns {String} The value with the token(s) replaced by the operation
	 */
	this.convertToken = function(token, curtable) {
		var token = token.replace('{{', '').replace('}}', '');
		var string = '';
		var parts = token.split(':');
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
				
				//what table do we roll on
				if (parts[1] == 'this') {
					//reroll on same table
					var t = app.rtables.getByTitle(curtable);
				} else {
					var t = app.rtables.getByTitle(parts[1]);
				}
				if (typeof parts[2] !== 'undefined' && parts[2].indexOf('*') !== -1) {
					var x = parts[2].split('*');
					parts[2] = x[0];
					multiplier = x[1];
				}
				subtable = (typeof parts[2] == 'undefined') ? '' : parts[2];
				
				for(var i=1; i<=multiplier; i++) {
					t.generateResult(subtable);
					string += t.niceString(true)+', ';
				}
				string = $.trim(string);
				string = string.replace(/,$/, '');
				
				break;
			case "roll":
				string = app.randomizer.parseDiceNotation(parts[1]);
				break;
			case "name":
				var n = new Names();
				if (typeof parts[1] == 'undefined' || parts[1]=='' || parts[1]=='random') {
					parts[1] = '';
				}
				if (typeof parts[3] == 'undefined' || parts[3] !== 'first') {
					parts[3] = '';
				}
				if (typeof parts[2] == 'undefined') {
					string = n.generateSurname(parts[1]);
				} else if (parts[2] == 'male') {
					string = n.generateName(parts[1], 'male', parts[3]);
				} else if (parts[2] == 'female') {
					string = n.generateName(parts[1], 'female', parts[3]);
				} else if (parts[2] == 'random') {
					string = n.generateName(parts[1], 'random', parts[3]);
				}
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
	this.findToken = function(string, curtable) {
		if (typeof curtable == 'undefined') { var curtable = ''; }
		regexp = new RegExp('(\{{2}.+?\}{2})', 'g');
		var that = this;
		newstring = string.replace(regexp, function(token) {
			return that.convertToken(token, curtable);
		});
		return newstring;
	},
	
	/**
	 * takes a string like '3d6+2', 'd6', '2d6', parses it, and puts it through {@link AppRandomizer#roll}
	 * @params {String} string a die roll notation
	 * @returns {Number} the result of the roll
	 */
	this.parseDiceNotation = function(string) {
		var m = string.match(/^([0-9]*)d([0-9]+)(?:([\+\-\*\/])([0-9]+))*$/);
		if (m) {
			if (typeof m[4] == 'undefined') { m[4] = 0; }
			if (m[1] !== '') {
				return this.roll(parseInt(m[2]), parseInt(m[1]), parseInt(m[4]), m[3]);
			} else {
				return this.roll(parseInt(m[2]), '1', parseInt(m[4]), m[3]);
			}
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
 * converts string to be usable as a class/id
 * @returns {String} string with some characters remove or replaced
 */
String.prototype.cleanClass = function() {
    return this.replace(/[\s,'";<>]/g, "_");
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