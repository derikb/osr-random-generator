

//!Mission model
var Mission = Backbone.Model.extend({
	
	localStorage: new Backbone.LocalStorage("osr-random-generator-mission"),
	
	defaults: function() {
		return {
			title: '[Untitled]',
			target: {},
			action: '',
			patron: {},
			antagonist: {},
			reward: '',
			complication: '',
			notes: '',
		}
	},
	
			
	initialize:  function() {
		
	},
	
	/**
	 * Generate the starting results
	 * @todo make it customizable what tables get used
	 */
	create: function() {
		var act = this.getAction();
		this.set('action', act.action );
		var target = { type: act.target };
		target.details = this.getTargetDetails(target.type);
		this.set('target', target );
		this.set('patron', this.getPatron());
		this.set('antagonist', this.getAntagonist());		
		this.set('complication', this.getComplication());
		this.set('reward', this.getReward());
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
	 * Get basic action result
	 * @returns {Array} of strings
	 */
	getAction: function() {
		var o = [];
		var action_t = app.rtables.getByTitle('mission_action');
		
		action_t.generateResult();
		//console.log(action_t.get('result'));
		
		o = {
			'action': action_t.get('result')[1]['result'],
			'target': action_t.get('result')[0]['result']
		}
		return o;
	},
	
	/**
	 * Flesh out the target
	 * @param {String} type either person place or thing
	 * @returns {Object} target details
	 */
	getTargetDetails: function(type) {
		
		switch (type) {
			case 'Person':
				var t = app.rtables.getByTitle('mission_person');
				t.generateResult();
				return t.get('result')[1].result.capitalize() + ' ' + t.get('result')[0].result.capitalize();
				//return t.niceString();
				break;
			case 'Place':
				var t = app.rtables.getByTitle('mission_place');
				t.generateResult();
				return t.niceString();
				break;
			case 'Thing':
				var t = app.rtables.getByTitle('mission_thing');
				t.generateResult();
				return t.niceString();
				break;
			default:
				return '';
		}
		
	},
	
	/**
	 * Generate a Patron
	 *
	 */
	getPatron: function(){
		var patron = {};
		
		var t = app.rtables.getByTitle('mission_patron');
		t.generateResult();
		patron.occupation = t.niceString(true);
		
		var t = app.rtables.getByTitle('colonial_goals');
		t.generateResult();
		patron.goal = t.niceString();
		
		
		return patron;	
	},
	
	/**
	 * Generate Antagonist
	 *
	 */
	getAntagonist: function(){
		var t = app.rtables.getByTitle('mission_antagonist');
		t.generateResult();
		return t.niceString();	
	},
	
	/**
	 * Generate Complication
	 *
	 */
	getComplication: function(){
		var t = app.rtables.getByTitle('mission_complication');
		t.generateResult();
		return t.niceString();	
	},
	
	/**
	 * Generate Reward
	 *
	 */
	getReward: function(){
		var t = app.rtables.getByTitle('mission_reward');
		t.generateResult();
		return t.niceString();	
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

//!MissionCollection
var MissionCollection = Backbone.Collection.extend({
	
	model: Mission,
	localStorage: new Backbone.LocalStorage("osr-random-generator-mission"), // Unique name within your app.
		
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


//!MissionDetails - view for individual wilderness models
var MissionDetails = Backbone.View.extend({
	
	tagName: 'div',
	className: 'mission-details panel panel-default hidden-print',
	model: Mission,
	
	attributes : function () {
		return {
			//id: 'character_'+this.model.get('id')
		};
	},
	
	events: {
		'click .save': 'saveMission',
		'click .conf-delete': 'confirmDelete',
		'click .delete': 'deleteMission',
		'click *[data-field]': 'editField',
	},
	
	initialize: function() {
    	this.listenTo(this.model, 'change', this.render);    	
    },
	
	/**
	 * Save an edited item
	 */
	saveMission: function() {
		this.model.save();

		this.$el.find('.unsaved, .save').remove();
		return false;
    },
    
    /**
     * Delete the item
     */
    deleteMission: function(e) {
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
	    var editv = new MissionEditView({model: this.model, field: field});
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
		
		temp += '<h4 class="panel-title"><a data-toggle="collapse" href="#mission<%= id %>"><%= title %></a></h4></div>';
		
		temp += '<div id="mission<%= id %>" class="panel-collapse collapse '+openclass+'"><div class="panel-body">';
		
			temp += '<dl class="dl-horizontal clearfix"><dt data-field="title">Title</dt><dd data-field="title"><%= title %></dd><dt data-field="action">Action</dt><dd data-field="action"><%= action %></dd><dt data-field="target">Target</dt><dd data-field="target"><%= target.details %></dd><dt data-field="antagonist">Complication</dt><dd data-field="complication"><%= complication %></dd></dl>';
			
			temp += '<h5>Patron</h5><dl class="dl-horizontal clearfix"><dt data-field="patron">Occupation</dt><dd data-field="patron"><%= patron.occupation %></dd><dt data-field="patron">Goal</dt><dd data-field="patron"><%= patron.goal %></dd></dl>';
			
			temp += '<dl class="dl-horizontal clearfix"><dt data-field="reward">Reward</dt><dd data-field="reward"><%= reward %></dd><dt data-field="antagonist">Antagonist</dt><dd data-field="antagonist"><%= antagonist %></dd></dl>'; 
			
			temp += '<h5 data-field="notes">Notes</h5><div data-field="notes"><%= notes %></div>';
						
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


//!MissionEditView View for editing the fields
var MissionEditView = Backbone.View.extend({
	
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
		
		if (this.field == 'patron' || this.field == 'target') {
			this.model.set(this.field, formdata, { open: true });
		} else if (this.field == 'notes') {
			formdata.notes = formdata.notes.nl2br();
			this.model.set(formdata, { open: true });
		} else {
			this.model.set(formdata, { open: true });
		}
		$('#editmodal').modal('hide');
		
		return false;
	},
	
	loadRandom: function(e) {
		
		//console.log(e);
		var inputtarget = $(e.target).attr('data-targetfield');
		var list = $(e.target).attr('data-list');
		
		if (this.field == 'patron') {
			var patron = this.model.getPatron();
			var newval = patron[list];
			$('#'+inputtarget).val(newval);
		} else if (this.field == 'target') {
			if (list == 'type') {
				var act = this.model.getAction();
				var newval = act.target;
			} else {
				var type = this.$el.find('#edittarget_type').val();
				var newval = this.model.getTargetDetails(type);
			}
			
			$('#'+inputtarget).val(newval);
		} else if (this.field == 'complication') {
			$('#'+inputtarget).val(this.model.getComplication());
		} else if (this.field == 'antagonist') {
			$('#'+inputtarget).val(this.model.getAntagonist());
		} else if (this.field == 'reward') {
			$('#'+inputtarget).val(this.model.getReward());
		}
		
	},
	
	
	template: function(data){
		var field = this.field;
		var subfield = this.subfield;
		
		var form = app.modalHeader('Edit Field: '+field.capitalize());
		form += '<div class="modal-body">';
		switch (field) {
						
			case 'patron':
			case 'target':
			
				_.each(this.model.get(field), function(v,k) {
					
					form += '<div class="form-group"><label class="control-label" for="edit'+field+'_'+k+'">'+k.capitalize()+'</label><div class="input-group"><input type=text class="form-control" id="edit'+field+'_'+k+'" name="'+k+'" value="'+v+'" />';
					
					form += '<div class="input-group-btn"><button type="button" class="btn btn-default randomize" data-targetfield="edit'+field+'_'+k+'" data-list="'+k+'">Randomly Replace</button></div></div></div>';
						
				}, this);
			
				break;
			
			case 'complication':
			case 'antagonist':
			case 'reward':
				var i=0;
				
				form += '<div class="form-group"><label class="control-label" for="edit'+field+'_'+i+'">'+field.capitalize()+'</label><div class="input-group"><input type=text class="form-control" id="edit'+field+'_'+i+'" name="'+field+'" value="<%= '+field+' %>" />';
					
					form += '<div class="input-group-btn"><button type="button" class="btn btn-default randomize" data-targetfield="edit'+field+'_'+i+'" data-list="'+field+'">Randomly Replace</button></div></div></div>';
				
				break;
			
			case 'notes':
				form += '<div class="form-group"><label class="control-label" for="edit'+field+'">'+field.capitalize()+'</label><textarea class="form-control" id="edit'+field+'" name="'+field+'" rows="6"><% var converted = '+field+'.br2nl() %><%= converted %></textarea><span class="help-block"></span></div>';
				break;
											
			default:
				form += '<div class="form-group"><label class="control-label" for="edit'+field+'">'+field.capitalize()+'</label><input type=text class="form-control" id="edit'+field+'" name="'+field+'" value="<%= '+field+' %>" /><span class="help-block"></span></div>';
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



//!MissionList - view for individual wilderness models
var MissionList = Backbone.View.extend({
	
	model: MissionCollection,
	tagName:'section',
	id: 'mission-collection',
	
	/**
	 * List of Mission
	 *
	 * @augments external:Backbone.View
	 * @constructs
	 */
    initialize:function () {
        this.listenTo(this.model, "add", this.addItem);
        this.listenTo(this.model, "destroy", this.removeItem);
    },
     
    render: function () {
    	$(this.el).html('<h1>Saved Missions</h1>');
    	$ul = $('<div id="mission-list" class="panel-group"></div>');
       	_.each(this.model.models, function(v,k,l){
	    	$ul.append(new MissionDetails({model:v}).render().el);
    	}, this);
		
		$(this.el).append($ul);
        return this;
    },
    
    /**
     * Put a new item into the list (when it's added to the collection), default it to open
     */
    addItem: function(m) {
	    //console.log(m);
	    $(this.el).find('#mission-list').prepend(new MissionDetails({model: m, open: true}).render().el);
	    $('#mission'+m.get('id')).collapse('show');
	    $('#mission'+m.get('id')).parents('.mission-details')[0].scrollIntoView(true);
	    
    },
    
    /**
     * Remove an item from the list (when it's removed from the collection)
     */
    removeItem: function(m) {
	    $('#mission'+m.get('id')).parents('.panel').remove();
    }
	
	
});


//!MissionForm
var MissionForm = Backbone.View.extend({
	
	model: AppSettings,
	tagName: 'form',
	className: 'mission-form clearfix',
	
	attributes : function () {
		return {
			//id: 'character_'+this.model.get('id')
		};
	},
	
	events: {
		'submit': 'createMission',
	},
	
	initialize: function() {
    	this.render();
        this.listenTo(this.model, 'change', this.render);
    },
	
	/**
	 * Submit form action, validates, creates, saves, adds to collection.
	 */
	createMission: function(e) {
		e.preventDefault();
		var $mess = $(this.el).find('.messages');
		$mess.empty();
		
		formdata = $(e.target).serializeObject();
		if (formdata.title == '') {
			formdata.title = 'Mission '+app.randomizer.roll(10000);
		}
    	var mission = new Mission(formdata);
    	mission.create();
    	if (!mission.isValid()) {
    		$mess.html(app.showAlert(mission.validationError.general, { atype: 'danger' }));
			$mess[0].scrollIntoView(true);
	    	//console.log(wild.validationError);
	    	return;
    	}
    	mission.save();
		app.missionlist.add(mission);
    	
    	this.$('#title').val('');
			
	},
	
	
	template: function(data) {
		var html = '';
		
		html += '<h1>Create Mission</h1>';
		
		html += '<div class="messages"></div>';
		
		html += '<div class="form-group"><label for=title class="control-label">Title</label><input type="text" class="form-control" name="title" id="title" value=""/><div class="help-block">Just a way to identify it later.</div></div>';	

		html += '<div class="form-group"><button type=submit class="btn btn-primary">Generate</button></div>';
		
		return html;
			
	},
	
	render: function() {
    	this.$el.html(this.template(this.model.attributes));
		return this;
	}
	
	
});