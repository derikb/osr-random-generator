

//!Wilderness model
var Wilderness = Backbone.Model.extend({
	
	localStorage: new Backbone.LocalStorage("osr-random-generator-wilds"),
	
	defaults: function() {
		return {
			title: '[Untitled]',
			terrain: '',
			hexdressing_count: app.AppSettings.get('hexdressing_count'),
			hexdressing: [],
			encounters: [],
			encounter_count: app.AppSettings.get('encounter_count'),
			weather: {},
		}
	},
	
			
	initialize:  function() {
		
	},
	
	/**
	 * @todo fix the way the tables get saved!???
	 */
	create: function() {
		//load up the randomtable models
		this.set('hexdressing_t', new RandomTable(appdata.tables.hex_dressing));
		this.set('encounters_t', new RandomTable(appdata.encounters[this.get('terrain')]));
		//generate the starting results
		this.set('hexdressing', this.getHexDressing(this.get('hexdressing_count')) );
		this.set('encounters', this.getEncounters(this.get('encounter_count')));
	},
	
	
	getHexDressing: function(ct) {
		var o = [];
		var dressing_t = this.get('hexdressing_t');
		for(var i=1;i<=ct;i++) {
			dressing_t.generateResult();
			o.push(dressing_t.niceString());
		}
		return o;
	},
	
	getEncounters: function(ct) {
		var o = [];
		var encounter_t = this.get('encounters_t');
		for(var i=1;i<=ct;i++){
			encounter_t.generateResult();
			o.push(encounter_t.niceString());
		}
		return o;	
	},
	
	/**
	 * outputs the json data for the wilderness (import/export)
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
	 * outputs the json data for the wilderness (import/export)
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

//!WildernessCollection
var WildernessCollection = Backbone.Collection.extend({
	
	model: Wilderness,
	localStorage: new Backbone.LocalStorage("osr-random-generator-wilds"), // Unique name within your app.
		
	initialize: function(){
		//this.listenTo(this.model, 'sync', this.addChar);
	},
	
	/**
	 * Export the saved wildernesses
	 * @param {String} [which] placeholder
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
			/*
			if (which == 'user') {
				return ( typeof model.get('id') !== 'undefined' );
			} */
			return true;
		});
		
		_.each(t, function(v,k,l){
			l[k] = v.outputObject(false);
		}, this);
		
		return t;		
	}
	
});


//!WildernessDetails - view for individual wilderness models
var WildernessDetails = Backbone.View.extend({
	
	tagName: 'div',
	className: 'wilderness-details clearfix',
	model: Wilderness,
	
	attributes : function () {
		return {
			//id: 'character_'+this.model.get('id')
		};
	},
	
	events: {
		'click .save': 'saveWild',
		'click .delete': 'deleteWild',
		'click .remove': 'removeWild',
		'click *[data-field]': 'editField',
	},
	
	initialize: function() {
    	this.listenTo(this.model, 'change', this.render);
    },
	
	saveWild: function() {
		//do something
		if (this.model.isNew()) {
			this.model.save();
			app.wildlist.add(this.model);
		} else {
			this.model.save();
		}
		this.$el.find('.unsaved').remove();
		return false;
    },
    
    deleteWild: function(e) {
		e.preventDefault();
		this.model.destroy();
		this.remove();
		//return false;  
    },
    
    removeWild: function(e) {
	    e.preventDefault();
	    //console.log(this.model.changedAttributes());
	    if (this.model.isNew()) {
		    if (!confirm('You have not saved this wilderness. Are you sure you with to delete it?')) {
			    return false;
		    }
	    } else if (this.model.changedAttributes()) {
		    if (!confirm('You have unsaved changes that will be lost. Are you sure?')) {
			    return false;
		    }
	    }
	    this.remove();
    },
    
    editField: function(e) {
	    var field = $(e.target).attr('data-field');
	    //console.log(field);
	    
	    var editv = new WildernessEditView({model: this.model, field: field});
	    app.showModal('Edit Field: '+field.capitalize(), editv.render().el);
    },

	
	template: function(data) {
		var temp = '';
		
		temp += '<dl><dt data-field="title">Title</dt><dd data-field="title"><%= title %></dd><dt data-field="terrain">Terrain</dt><dd data-field="terrain"><%= terrain %></dd></dl>';
		
		temp += '<dl><dt>Hex Dressing</dt><% _.each(hexdressing, function(v,k,l){ %><dd data-field="hexdressing"><%= v %></dd><% }); %></dl>';
		
		temp += '<dl><dt>Encounters</dt><dd data-field="encounters"><ol><% _.each(encounters, function(v,k,l){ %><li data-field="encounters"><%= v %></li><% }); %></ol></dd></dl>';
		
		temp += '<div class="pull-right hidden-print">';
		
		if (this.model.changedAttributes()) { temp += '<span class="label label-danger unsaved">Unsaved Changes</span> '; }
		
		temp += '<button title="Save" class="btn btn-default btn-xs save"><span class="glyphicon glyphicon-save"></span></button>';
		
		temp += ' <button title="Close" class="btn btn-default btn-xs remove"><span class="glyphicon glyphicon-eye-close"></span></button>';
		
		temp += '<% if (typeof id !== "undefined"){ %> <button title="Delete" class="btn btn-default btn-xs delete"><span class="glyphicon glyphicon-remove"></span></button><% } else { %><%} %></div>';
		
		var html = _.template(temp, data);
		return html;
	},
	
	render: function() {
    	//console.log('view render');
    	//console.trace();
    	this.$el.html(this.template(this.model.attributes));
    	    	
		return this;
    	
	}
	
	
});


//!WildernessEditView View for editing the fields
var WildernessEditView = Backbone.View.extend({
	
	tagName: 'div',
	field: '',
	
	events: {
		'submit form': 'commitEdit',
		'click .randomize': 'loadRandom',
	},
	
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
		
		if (this.field == 'something') {
			

		} else {
			this.model.set(formdata);
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
		
		if (this.field == 'hexdressing') {
			var newval = this.model.getHexDressing(1);
			$('#'+inputtarget).val(newval[0]);
		} else if (this.field == 'terrain') {
			var newval = app.randomizer.rollRandom(appdata.wilderness.terrain);
			$('#'+inputtarget).val(newval);
		}
		
	},
	
	
	template: function(data){
		var field = this.field;
		var subfield = this.subfield;
		
		//console.log(this);
		var form = '<form>';
		switch (field) {
						
			case 'hexdressing':
				
				var cur = this.model.get(field);
				
				for(var i=0; i<cur.length; i++) {
					var num = i+1;
					form += '<div class="form-group"><label class="control-label" for="edit'+field+'_'+i+'">'+field.capitalize()+' '+num+'</label><div class="input-group"><input type=text class="form-control" id="edit'+field+'_'+i+'" name="'+field+'" value="'+cur[i]+'" />';
					
					form += '<div class="input-group-btn"><button type="button" class="btn btn-default randomize" data-targetfield="edit'+field+'_'+i+'" data-list="'+field+'">Randomly Replace</button></div></div></div>';
					
				}
			
				break;
			
			case 'terrain':
				
				form += '<div class="form-group"><label class="control-label" for="edit'+field+'_'+i+'">'+field.capitalize()+'</label><div class="input-group"><input type=text class="form-control" id="edit'+field+'_'+i+'" name="'+field+'" value="<%= '+field+' %>" />';
					
					form += '<div class="input-group-btn"><button type="button" class="btn btn-default randomize" data-targetfield="edit'+field+'_'+i+'" data-list="goals">Randomly Replace</button></div></div></div>';
				
				break;
							
			default:
				form += '<div class="form-group"><label class="control-label" for="edit'+field+'">'+field+'</label><input type=text class="form-control" id="edit'+field+'" name="'+field+'" value="<%= '+field+' %>" /><span class="help-block"></span></div>';
				break;

		}
		
		form += '<div class="form-group"><button type=submit class="btn btn-primary">Update</button></div></form>';

		var html = _.template(form, data);
		return html;
	},
	
	render: function() {
    	this.$el.html(this.template(this.model.attributes));
		return this;	
	}
	
});



//!WildernessList - view for individual wilderness models
var WildernessList = Backbone.View.extend({
	
	model: WildernessCollection,
	tagName:'section',
	className: 'wilderness-collection',
 
	attributes : function () {
		return {
			//id: 'character_'+this.model.get('id')
		};
	},
	
    initialize:function () {
        this.listenTo(this.model, "add", this.render);
        this.listenTo(this.model, "destroy", this.render);
        //this.listenTo(this.model, "change:title", this.render);
    },
     
    render: function () {
    	var html = '';
    	$(this.el).html('<h1>Saved Wilderness</h1>');
    	$ul = $('<ul class="list-unstyled"></ul>');
       	_.each(this.model.models, function(v,k,l){
	    	$ul.append(new WildernessListItem({model:v}).render().el);
    	}, this);
		
		$(this.el).append($ul);
        return this;
    }
	
	
});

//!WildernessListItem
//View for wilderness data in brief list
var WildernessListItem = Backbone.View.extend({
	
	tagName: 'li',
	className: 'wilderness-list',
	
	attributes : function () {
		return {
			//id: 'character_'+this.model.get('id')
		};
	},
	
	events: {
		'click .view': 'viewWild',
		'click .delete': 'deleteWild'
	},
	
	initialize: function() {
    	//this.listenTo(this.model, "change", this.render);
    	this.listenTo(this.model, "sync", this.render); //only change when character is saved.
    },

    viewWild: function(e) {
		e.preventDefault();
		$('#wilderness-results').append(new WildernessDetails({model:this.model}).render().el)
	},
    
    deleteWild: function(e) {
		e.preventDefault();
		if (!confirm('Are you sure you want to delete this wilderness?')) { return; }
		this.model.destroy();
    },
   
    template: function(data){
    	var list = '';
    	
 		list += '<div class="pull-right"><button title="View" class="btn btn-default btn-xs view"><span class="glyphicon glyphicon-eye-open"></span></button>';
		
		list+= '<% if (typeof id !== "undefined"){ %> <button title="Delete" class="btn btn-default btn-xs delete"><span class="glyphicon glyphicon-remove"></span></button><% } else { %><%} %></div>';
		
		list += '<%= title %> ';
				
		var html = _.template(list, data);
		return html;
    },
    
    render: function() {
    	this.$el.html(this.template(this.model.attributes));
		return this;
	}
	
});


//!WildernessForm
var WildernessForm = Backbone.View.extend({
	
	tagName: 'form',
	className: 'wilderness-form clearfix',
	
	attributes : function () {
		return {
			//id: 'character_'+this.model.get('id')
		};
	},
	
	events: {
		'submit': 'createWilderness',
	},
	
	initialize: function() {
    	this.render();
        this.listenTo(this.model, 'change', this.render);
    },
	
	
	createWilderness: function(e) {
		e.preventDefault();
		formdata = $(e.target).serializeObject();
    	var wild = new Wilderness(formdata);
    	wild.create();
    	$('#wilderness-results').prepend(new WildernessDetails({model:wild}).render().el);
    	
    	this.$('#title').val('');
			
	},
	
	
	template: function(data) {
		var html = '';
		
		html += '<div class="form-group"><label for=title class="control-label">Title</label><input type="text" class="form-control" name="title" id="title" value=""/><div class="help-block">Just a way to identify it later.</div></div>';	
		html += '<div class="form-group"><label for=terrain class="control-label">Terrain</label><select class="form-control" name="terrain" id="terrain">';
			_.each(appdata.wilderness.terrain, function (v,k){
				html += '<option value="'+k+'">'+v.label+'</option>';
			}, this);
		html += '</select><div class="help-block">Just a way to identify it later.</div></div>';
		
		html += '<div class="form-group"><button type=submit class="btn btn-primary">Generate</button></div>';
		
		return html;
			
	},
	
	render: function() {
    	//console.log('view render');
    	//console.trace();
    	this.$el.html(this.template(this.model.attributes));
    	    	
		return this;
    	
	}
	
	
});