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
    },
	
    list: function () {
        this.charlist = new CharCollection();
        this.charlistview = new CharList({model:this.charlist});
		this.charlist.fetch({silent: true});
        $('#characters-list').html(this.charlistview.render().el);
    },

	
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
			chargroup: []
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
		form += '</select></div>';
		
		form += '<fieldset><legend>NPC Settings</legend>';
		
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
		
		form += '<fieldset>';
		
		form += '<div class="form-group"><button type=submit class="btn btn-primary">Save Settings</button></div>';
	
		$(this.el).html(form);
		return this;
	}
	
	
});



//!AppRandomizer - for various randomization functions
var AppRandomizer = function() {
	
	//random number between min and max
	//use _.random(min, max) instead
	/*
this.randomNumber = function(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}
*/
	
	//random value from an array (returns string, object, array... whatever the array is of)	
	this.randomValue = function(arr) {
		if (typeof arr == 'undefined') { return ''; }
		x = _.random(0, arr.length-1);
		return arr[x];
	}
	
	//random value from an arr(values) weighted by an arr(weights)
	//values is an array of possible output
	//weights is an array of weighted integer for each output (ie they have to be in the same order as the values)
	this.getWeightedRandom = function (values, weights){ 
	    n = 0; 
	    num = _.random(0, this.arraySum(weights));
	    for(var i = 0; i < values.length; i++) {
	        n = n + weights[i]; 
	        if(n >= num){
	            break; 
	        }
	    } 
	    return values[i]; 
	}
	
	//roll die(dice) defaults to d6, 1 time, 0 modifier
	this.roll = function(die, number, modifier) {
		//console.log(arguments);
		if (typeof modifier == 'undefined') {
			var modifier = 0;
		}
		if (typeof number == 'undefined') {
			var number = 1;
		}
		if (typeof die == 'undefined') {
			var die = 6;
		}
		
		sum = 0;
		for (var i=1; i<=number; i++) {
			sum = sum + _.random(1, die);
		}
		sum = sum + modifier
		return sum;
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
	
	
	this.convertToken = function(token) {
		token = token.replace('{{', '').replace('}}', '');
		string = '';
		
		parts = token.split(':');
		if (parts.length == 0) { return ''; }
		//console.log(parts);
		
		switch (parts[0]) {
			case "list":
				as = parts[1].split('.');
				vlist = 'appdata';
				for(i=0;i<as.length;i++) {
					vlist += '.'+as[i];
				}
				eval('list = '+vlist+';');
				string = this.randomValue(list);
				break;
			case "roll":
				as = parts[1].match(/([0-9]+)d([0-9]+)([\+-]{1}[0-9]+)?/);
				//console.log(as);
				if (as) {
					string = app.randomizer.roll(parseInt(as[1]), parseInt(as[2]), parseInt(as[3]));	
				}
				break;
			default:
				string = '';
		}
		return string;
	},
	
	this.findToken = function(string) {
		regexp = new RegExp('(\{{2}.+?\}{2})');
		newstring = string.replace(regexp, this.convertToken);
		return newstring;
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