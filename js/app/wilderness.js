

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
	 * Generate the starting results
	 * @todo make it customizable what tables get used
	 */
	create: function() {
		
		this.set('hexdressing', this.getHexDressing(app.AppSettings.get('wilderness').hexdressing_count) );
		this.set('encounters', this.getEncounters(app.AppSettings.get('wilderness').encounter_count) );
	},
	
	/**
	 * validate fields before saving
	 * @returns {Object} error information
	 */
	validate: function(attributes, options) {
		//console.log(attributes);
		var error = { fields: [], general: '' };
		
		if (attributes.title == '') {
			error.fields.push({ field: 'title', message: 'Title cannot be blank' });
			error.general += 'Title cannot be blank. ';
		}
		
		if (!_.isEmpty(error.fields) || !_.isEmpty(error.general)) {
			return error;
		}
	},
	
	/**
	 * Get hex dressing result
	 * @todo have this be based on terrain (with a default fallback)
	 * @param {Number} ct how many results to return
	 * @returns {Array} of strings
	 */
	getHexDressing: function(ct) {
		var o = [];
		//var dressing_t = app.rtables.getByTitle(app.AppSettings.get('wilderness').hexdressing_default);
		var tables = app.AppSettings.get('encounter_tables');
		var encounter_t = app.rtables.getByTitle(tables[this.get('terrain')]);
		if (encounter_t.get('tables').hexdressing) {
			for(var i=1;i<=ct;i++) {
				encounter_t.generateResult('hexdressing');
				o.push(encounter_t.niceString(true));
			}
		} else {
			var dressing_t = app.rtables.getByTitle('hex_dressing');
			for(var i=1;i<=ct;i++) {
				dressing_t.generateResult();
				o.push(dressing_t.niceString());
			}
		}
		
		//var dressing_t = app.rtables.getByTitle('hex_dressing');
		
		return o;
	},
	
	/**
	 * Get encounter results
	 * @todo have the tables be customizable
	 * @param {Number} ct how many results to return
	 * @returns {Array} of strings
	 */
	getEncounters: function(ct) {
		var o = [];
		
		var tables = app.AppSettings.get('encounter_tables');
		
		var encounter_t = app.rtables.getByTitle(tables[this.get('terrain')]);
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
	className: 'wilderness-details panel panel-default hidden-print',
	model: Wilderness,
	
	attributes : function () {
		return {
			//id: 'character_'+this.model.get('id')
		};
	},
	
	events: {
		'click .save': 'saveWild',
		'click .conf-delete': 'confirmDelete',
		'click .delete': 'deleteWild',
		'click *[data-field]': 'editField',
	},
	
	initialize: function() {
    	this.listenTo(this.model, 'change', this.render);    	
    },
	
	/**
	 * Save an edited item
	 */
	saveWild: function() {
		this.model.save();

		this.$el.find('.unsaved, .save').remove();
		return false;
    },
    
    /**
     * Delete the item
     */
    deleteWild: function(e) {
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
		
		//reset the button about a few seconds
		window.setTimeout(this.resetDelete.bind(this), 4000);
	},
	
	/**
	 * Resets the confirm delete button so the 'are you sure' doesn't stick around
	 */
	resetDelete: function() {
		this.$el.find('.delete').html('<span class="glyphicon glyphicon-remove"></span>').removeClass('btn-danger delete').addClass('conf-delete btn-default');
	},
    
    /**
     * Show the edit modal
     */
    editField: function(e) {
	    var field = $(e.target).attr('data-field');	    
	    var editv = new WildernessEditView({model: this.model, field: field});
	    app.showModal({ full_content: editv.render().el });
    },

	/**
	 * Template
	 * @param {Object} data attributes for the template
	 * @param {Boolean} open should the panel be open
	 */
	template: function(data, open) {
		var temp = '';
		
		open = (open) ? open : false;
		var openclass = (open) ? 'in' : '';

		temp += '<div class="panel-heading clearfix">';
		
		temp += '<div class="pull-right hidden-print">';
				if (this.model.changedAttributes()) { temp += '<span class="label label-danger unsaved">Unsaved Changes</span> <button title="Save" class="btn btn-default btn-xs save"><span class="glyphicon glyphicon-save"></span></button>'; }
			
				temp += '<button title="Delete" class="btn btn-default btn-xs conf-delete"><span class="glyphicon glyphicon-remove"></span></button>';
			temp += '</div>';
		
		temp += '<h4 class="panel-title"><a data-toggle="collapse" href="#wild<%= id %>"><%= title %></a></h4></div>';
		
		temp += '<div id="wild<%= id %>" class="panel-collapse collapse '+openclass+'"><div class="panel-body">';
		
			temp += '<dl class="dl-horizontal clearfix"><dt data-field="title">Title</dt><dd data-field="title"><%= title %></dd><dt data-field="terrain">Terrain</dt><dd data-field="terrain"><%= terrain %></dd></dl>';
			
			temp += '<dl><dt>Hex Dressing</dt><dd data-field="hexdressing"><ol><% _.each(hexdressing, function(v,k,l){ %><li data-field="hexdressing"><%= v %></li><% }); %></ol></dd>';
			
			temp += '<dt>Encounters</dt><dd data-field="encounters"><ol><% _.each(encounters, function(v,k,l){ %><li data-field="encounters"><%= v %></li><% }); %></ol></dd></dl>';
						
		temp += '</div>';
		
		var html = _.template(temp, data);
		return html;
	},
	
	render: function() {
    	//console.log(arguments);
    	var open = false;
    	if (arguments[1]) {
	    	open = (arguments[1]['open']) ? arguments[1]['open'] : false;
    	}
    	this.$el.html(this.template(this.model.attributes, open));
		return this;    	
	}
	
	
});


//!WildernessEditView View for editing the fields
var WildernessEditView = Backbone.View.extend({
	
	tagName: 'form',
	field: '',
	className: 'modal-content',
	
	events: {
		'submit': 'commitEdit',
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
		
		if (this.field == 'hexdressing' || this.field == 'encounters') {
			_.each(formdata[this.field], function(v,k,l){
				l[k] = v.nl2br();
			}, this);
			this.model.set(formdata, { open: true });
		} else {
			this.model.set(formdata, { open: true });
		}
		//this.model.save();
		$('#editmodal').modal('hide');
		
		return false;
	},
	
	loadRandom: function(e) {
		//console.log(e);
		var inputtarget = $(e.currentTarget).attr('data-targetfield');
		var list = $(e.target).attr('data-list');
		
		if (this.field == 'hexdressing') {
			var newval = this.model.getHexDressing(1);
			$('#'+inputtarget).val(newval[0].br2nl());
		} else if (this.field == 'encounters') {
			var newval = this.model.getEncounters(1);
			$('#'+inputtarget).val(newval[0].br2nl());
		} else if (this.field == 'terrain') {
			var newval = app.randomizer.rollRandom( _.keys(app.AppSettings.get('encounter_tables')) );
			$('#'+inputtarget).val(newval);
		}
		
	},
	
	
	template: function(data){
		var field = this.field;
		var subfield = this.subfield;
		
		var form = app.modalHeader('Edit Field: '+field.capitalize());
		form += '<div class="modal-body">';
		switch (field) {
						
			case 'hexdressing':
			case 'encounters':
				
				var cur = this.model.get(field);
				
				for(var i=0; i<cur.length; i++) {
					var num = i+1;
					var textvalue = cur[i].br2nl();
					form += '<div class="form-group"><label class="control-label" for="edit'+field+'_'+i+'">'+field.capitalize()+' '+num+'</label><textarea class="form-control" rows=3 id="edit'+field+'_'+i+'" name="'+field+'">'+textvalue+'</textarea>';
					
					form += '<div class="clearfix"><button type="button" class="btn btn-default randomize pull-right" data-targetfield="edit'+field+'_'+i+'" data-list="'+field+'"><span class="glyphicon glyphicon-random"></span></button></div></div>';
					
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



//!WildernessList - view for individual wilderness models
var WildernessList = Backbone.View.extend({
	
	model: WildernessCollection,
	tagName:'section',
	id: 'wilderness-collection',
	
	/**
	 * List of Wilderness
	 *
	 * @augments external:Backbone.View
	 * @constructs
	 */
    initialize:function () {
        this.listenTo(this.model, "add", this.addItem);
        this.listenTo(this.model, "destroy", this.removeItem);
    },
     
    render: function () {
    	$(this.el).html('<h1>Saved Wilderness</h1>');
    	$ul = $('<div id="wilderness-list" class="panel-group"></div>');
       	_.each(this.model.models, function(v,k,l){
	    	$ul.append(new WildernessDetails({model:v}).render().el);
    	}, this);
		
		$(this.el).append($ul);
        return this;
    },
    
    /**
     * Put a new item into the list (when it's added to the collection), default it to open
     */
    addItem: function(m) {
	    //console.log(m);
	    $(this.el).find('#wilderness-list').prepend(new WildernessDetails({model: m, open: true}).render().el);
	    $('#wild'+m.get('id')).collapse('show');
	    $('#wild'+m.get('id')).parents('.wilderness-details')[0].scrollIntoView(true);
	    
    },
    
    /**
     * Remove an item from the list (when it's removed from the collection)
     */
    removeItem: function(m) {
	    $('#wild'+m.get('id')).parents('.panel').remove();
    }
	
	
});


//!WildernessForm
var WildernessForm = Backbone.View.extend({
	
	model: AppSettings,
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
	
	/**
	 * Submit form action, validates, creates, saves, adds to collection.
	 */
	createWilderness: function(e) {
		e.preventDefault();
		var $mess = $(this.el).find('.messages');
		$mess.empty();
		
		formdata = $(e.target).serializeObject();
		if (formdata.title == '') {
			formdata.title = 'Wilderness '+app.randomizer.roll(10000);
		}
    	var wild = new Wilderness(formdata);
    	wild.create();
    	if (!wild.isValid()) {
    		$mess.html(app.showAlert(wild.validationError.general, { atype: 'danger' }));
			$mess[0].scrollIntoView(true);
	    	return;
    	}
    	wild.save();
		app.wildlist.add(wild);
    	
    	this.$('#title').val('');
			
	},
	
	
	template: function(data) {
		var html = '';
		
		html += '<h1>Create Wilderness</h1>';
		
		html += '<div class="messages"></div>';
		
		html += '<div class="form-group"><label for=title class="control-label">Title</label><input type="text" class="form-control" name="title" id="title" value=""/></div>';	
		html += '<div class="form-group"><label for=terrain class="control-label">Terrain</label><select class="form-control" name="terrain" id="terrain">';
			_.each(app.AppSettings.get('encounter_tables'), function (v,k){
				html += '<option value="'+k+'">'+k.capitalize()+'</option>';
			}, this);
		html += '</select><div class="help-block">Will decide what tables to use for encounters and hex dressing.</div></div>';
		
		html += '<div class="form-group"><button type=submit class="btn btn-primary">Generate</button></div>';
		
		return html;
			
	},
	
	render: function() {
    	this.$el.html(this.template(this.model.attributes));
		return this;
	}
	
	
});