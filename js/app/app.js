//main app classes


//! App Router
var AppRouter = Backbone.Router.extend({
 
    routes:{
        "":"list",
		//"list/:id":"someFunction"
    },
 
    initialize: function () {
		this.randomizer = new AppRandomizer();
		//this.loadCustomData();
		this.AppSettings = new AppSettings();
		this.AppSettings.fetch();
		this.AppSettingsView = new AppSettingsView({ model: this.AppSettings });
		$('#settings').html(this.AppSettingsView.render().el);
		//console.log(this);
		$('#character-form').append(new CharForm({ model: this.AppSettings }).render().el);
		
		$('#wilderness-form').append(new WildernessForm({ model: this.AppSettings }).render().el);
		
		$('#dungeon-form').append(new DungeonForm({ model: this.AppSettings }).render().el);
		
    },
	
    list: function () {
       	this.charlist = new CharCollection();
        this.charlistview = new CharList({model:this.charlist});
		this.charlist.fetch({silent: true});
        $('#characters-list').html(this.charlistview.render().el);
		
		this.wildlist = new WildernessCollection();
        this.wildlistview = new WildernessList({model:this.wildlist});
		this.wildlist.fetch({silent: true});
        $('#wilderness-list').html(this.wildlistview.render().el);

		this.dungeonlist = new DungeonCollection();
        this.dungeonlistview = new DungeonList({model:this.dungeonlist});
		this.dungeonlist.fetch({silent: true});
        $('#dungeon-list').html(this.dungeonlistview.render().el);

		this.rtables = new RTable_Collection();
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
			load_tables.push(v);
		});
		//console.log(load_tables);
		this.rtables.reset(load_tables);
        $('#rtable-list').html(this.rtablelist.render().el);

    },
	
	
	showModal: function(title, body) {
		$('#editmodal .modal-title').html(title);
		$('#editmodal .modal-body').html(body);
		$('#editmodal').modal({});
		$('#editmodal').on('shown.bs.modal', function(e) {
			$(e.target).find('input[type="text"]:first').focus();
		});
	}
	
	/*
loadCustomData: function(){
		//Couldn't figure out a good way to do this with local files
		//with a server we could use $.getFile
		//or use require.js	
	}
*/
	
});


//! AppSettings - for storing settings
var AppSettings = Backbone.Model.extend({
	
	localStorage: new Backbone.LocalStorage("osr-random-generator-settings"), // Unique name within your app.
	
	defaults: function() {
		return {
			id: 'settings',
			rules_set: 'lotfp',
			personality_type: 'onewordtraits',
			appearance_type: 'onthenpc',
			personality_count: 2,
			appearance_count: 2,
			chargroup: [],
			character_display: 'full',
			ability_display: 'full',
			
			hexdressing_count: 3,
			encounter_count: 5,
		}	
	},
	
});

//!AppSettingsView - form to edit settings
var AppSettingsView = Backbone.View.extend({
	
	tagName: 'form',
	
	attributes : function () {
		return {
			id: 'app_setting_form'
		};
	},
	
	events: {
		'submit': 'editSettings',
	},
	
	editSettings: function(e) {
		e.preventDefault();
		formdata = $(e.target).serializeObject();		
		this.model.save(formdata);
		var $alert = $('<div class="alert alert-success fade in"><a class="close" data-dismiss="alert" href="#" aria-hidden="true">&times;</a>Settings Saved.</div>');
		$(this.el).prepend($alert);
		$alert.delay(3 * 1000).fadeOut()
	},
	
	render: function() {
		var form = '';
		form += '<div class="alert alert-info">Settings will be saved to your local browser storage for re-use.</div>';
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
	    		form += '<label class="radio-inline"><input type="radio" name="character_display" value="'+v.option+'" '+sel+' /> '+v.label+'</label>'
    		
    		}, this);
			form += '<div class="help-block">If you don\'t want the numbers, change this setting.</div></div>';
			
			form += '<div class="form-group col-sm-6">';
			
			var ability_display = [{ option: 'full', label: 'Full (all abilities/scores/modifiers)' }, { option: 'minimal', label: 'Minimal (Only abilities with modifiers not 0)' } ];
    		_.each(ability_display, function(v){
    			var sel = (v.option == this.model.get('ability_display')) ? 'checked=checked' : '';
	    		form += '<label class="radio-inline"><input type="radio" name="ability_display" value="'+v.option+'" '+sel+' /> '+v.label+'</label>'
    		
    		}, this);
			form += '<div class="help-block">For shorter character blocks pick "minimal".</div></div>';
			
			form += '</div></fieldset>';
		
		form += '<div class="row"><div class="form-group col-sm-9"><label for="personality_type" class="control-label">Personality List</label><select class="form-control" id="personality_type" name="personality_type">';
    		_.each(appdata.personality.options, function(v){
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
    		_.each(appdata.appearance.options, function(v){
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
	
		$(this.el).html(form);
		return this;
	}
	
	
});



//!AppRandomizer - for various randomization functions
var AppRandomizer = function() {
	
	//random value from an array/object (returns string, object, array... whatever the array is of)
	//arrays return the element
	//objects return the key
	this.randomValue = function(arr) {
		if (typeof arr == 'undefined') { return ''; }
		if (typeof arr == 'string') { return arr; }
		if (typeof arr == 'integer') { return arr; }
		if ($.isArray(arr)) {
			x = _.random(0, arr.length-1);
			return arr[x];
		} else {
			k = _.keys(arr);
			x = _.random(0, k.length-1);
			return k[x];
		}
	}
	
	//random value from an arr(values) weighted by an arr(weights)
	//values is an array of possible output
	//weights is an array of weighted integer for each output (ie they have to be in the same order as the values)
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
	
	//wrapper for this.getWeightedRandom() and this.randomValue() that accepts an object or array
	//if the elements are objects then it checks for a weight attribute
	this.rollRandom = function(data) {
		var values = [];
		var weights = [];
		//console.log(data);
			
		if ($.isArray(data)) {
			if (typeof data[0] == 'string') {
				return this.randomValue(data);
			}
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
	
	//roll die(dice) defaults to d6, 1 time, 0 modifier, + mod_op (modifier operation)
	//!TODO adjust so it can handle modifiers for (+-*/) (default to + if just an integer)
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

	//sum the values of an array
	this.arraySum = function(arr) {
		total = 0;
		for(var i = 0; i < arr.length; i++) {
			v = parseFloat(arr[i]);
			if (!isNaN(v)) total += v; 
		} 
		return total;
	},
	
	//convert a {{token}} into an value
	//Tokens are {{table:SOMETABLE}} {{table:SOMETABLE:SUBTABLE}} {{table:SOMETABLE*3}} (roll that table 3 times)
	// {{roll:1d6+2}} (etc)
	this.convertToken = function(token) {
		token = token.replace('{{', '').replace('}}', '');
		string = '';
		
		parts = token.split(':');
		if (parts.length == 0) { return ''; }
		
				
		switch (parts[0]) {
			case "list":
				//TODO remove this in favor of the table syntax
				as = parts[1].split('.');
				vlist = 'appdata';
				for(i=0;i<as.length;i++) {
					vlist += '.'+as[i];
				}
				eval('list = '+vlist+';');
				string = this.randomValue(list);
				break;
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
	
	//Look for {{TOKEN}} tokens to perform replace action
	this.findToken = function(string) {
		//console.log('findToken');
		regexp = new RegExp('(\{{2}.+?\}{2})', 'g');
		newstring = string.replace(regexp, this.convertToken);
		return newstring;
	},
	
	//takes a string like '3d6+2', parses it, and puts it through this.roll()
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
//capitalize first letter
String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}


//serialize a form
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