//!Dungeon
var Dungeon = Backbone.Model.extend(
	/** @lends Dungeon.prototype */
	{
	
	localStorage: new Backbone.LocalStorage("osr-random-generator-dungeon"),
	
	defaults: function() {
		return {
			title: '[Untitled]',
			level: 1,
			room_count: 10,
			rooms: {},
		}
	},
	
	/**
	 * Dungeon objects
	 *
	 * @augments external:Backbone.View
	 * @constructs
	 * @property {String} [title=[Untitled]] Title of the dungeon level
	 * @property {Number} [level=1] dungeon level number (used for monster and treasure generation)
	 * @property {Number} [room_count=10] number of rooms on the level
	 * @property {Array} rooms array of room objects
	 */	
	initialize:  function() {
		
	},
	
	/**
	 * create all the rooms to start
	 */
	create: function() {
		this.set('rooms', this.generateRooms(this.get('room_count')));
	},
	
	/**
	 * for each room generate it
	 * @returns {Array} an array of room objects
	 */
	generateRooms: function(ct) {
		var rooms = [];

		for(var i=1;i<=ct;i++){
			rooms.push(this.generateRoom(i));
		}
		
		return rooms;	
	},
	
	/**
	 * roll a single room
	 * @param {Number} roomnumber which room are we generating
	 * @returns {Object} a room object
	 */
	generateRoom: function(roomnumber) {
		var room = { number: roomnumber, content: 'Empty', monster_type: '', trap_type: '', special_type: '', treasure_type: '' };
		//room.content = app.randomizer.rollRandom(appdata.dungeon.rooms.content);
		//room.treasure = app.randomizer.rollRandom(appdata.dungeon.rooms.content[room.content].treasure);
		
		var ctable = app.rtables.getTable(app.AppSettings.get('dungeon').stocking_table);
		ctable.generateResult();
		//console.log(ctable.get('result'));
		
		room.content = ctable.findResultElem('content').result;
		room.treasure = ctable.findResultElem('treasure').result;
		
		//console.log(room);
		
		if (room.content == 'monster') {
			var mon = app.randomizer.rollRandom(this.generateMonsterList());
			room.monster_type = mon;
		}
		else if (room.content == 'trap') {
			room.trap_type = this.generateTrap();
		} else if (room.content == 'special') {
			room.special_type = this.generateSpecial();
		}
		room.notes = '';
		
		if (room.treasure == 'yes') {
			room.treasure_type = this.generateTreasure(room);
		} else {
			room.treasure_type = "None";
		}
		
		return room;
	},
	
	/**
	 * create monster list for level
	 * @todo fix the way the monster data gets saved!???
	 * @returns {Object} keyed to monster name with stats as property value
	 */
	generateMonsterList: function() {
		if (typeof this.get('monsters') !== 'undefined') { return this.get('monsters'); }
		var m = appdata.monsters.labyrinthlord;
		var monsters = {};
		_.each(m, function(v,k,l) {
			if (v.level == this.get('level') && _.contains(v.terrain, 'DG')) {
				monsters[k] = v;
			}
		}, this);		
		this.set('monsters', monsters);
		return monsters;
	},
	
	/**
	 * roll on the trap table
	 * @returns {String} trap description
	 */	
	generateTrap: function() {
		var t = app.rtables.getTable(app.AppSettings.get('dungeon').trap_table);
		t.generateResult();
		return t.niceString();
	},
	
	/**
	 * roll on the special table
	 * @returns {String} special description
	 */	
	generateSpecial: function() {
		var t = app.rtables.getTable(app.AppSettings.get('dungeon').special_table);
		t.generateResult();
		return t.niceString();
	},

	/**
	 * roll on treasure table(s)
	 * @returns {String} treasure list
	 */
	generateTreasure: function(room) {
		var t = new Treasure();
		var o = '';
		
		if (room.monster_type !== '') {
			monster = appdata.monsters.labyrinthlord[room.monster_type];
			ttype = monster.statblock.TRS;
			if (ttype == "None") {
				return 'None';
			}
			//console.log('treasure type '+ttype);
			if (ttype.indexOf(',') !== -1) {
				//multiple
				types = ttype.split(',');
				
				_.each(types, function(v) {
					v = v.trim();
					o += t.generateHoard(v);
				}, this);
				
			} else {
				o += t.generateHoard(ttype);
			}
		} else {
			o += t.generateHoard(this.get('level'));
			//o = 'something else';
		}
		
		return (o == '') ? 'None' : o;
	},
	
	/**
	 * outputs the json data for the dungeon (import/export)
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
	 * outputs the json data for the dungeon (import/export)
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


//!DungeonCollection
var DungeonCollection = Backbone.Collection.extend(
	/** @lends DungeonCollection.prototype */
	{
	
	model: Dungeon,
	localStorage: new Backbone.LocalStorage("osr-random-generator-dungeon"),
	
	/**
	 * Collection of Dungeon objects
	 *
	 * @augments external:Backbone.Collection
	 * @constructs
	 */	
	initialize: function(){
		
	},
	
	/**
	 * Export the saved dungeons
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
			}
			*/
			return true;
		});
		
		_.each(t, function(v,k,l){
			l[k] = v.outputObject(false);
		}, this);
		
		return t;		
	}
});


//!DungeonDetails
var DungeonDetails = Backbone.View.extend(
	/** @lends DungeonDetails.prototype */
	{
	
	tagName: 'div',
	className: 'dungeon-details clearfix',
	model: Dungeon,
	
	events: {
		'click .save': 'saveDungeon',
		'click .delete': 'deleteDungeon',
		'click .conf-delete': 'confirmDelete',
		'click .remove': 'removeDungeon',
		'click *[data-field]': 'editField',
		'click *[data-room]': 'editRoom',
	},
	
	/**
	 * Full Dungeon view
	 *
	 * @augments external:Backbone.View
	 * @constructs
	 */
	initialize: function() {
    	this.listenTo(this.model, 'change', this.render);
    },
	
	/**
	 * Save the dungeon
	 */
	saveDungeon: function() {
		if (this.model.isNew()) {
			this.model.save();
			app.dungeonlist.add(this.model);
		} else {
			this.model.save();
		}
		this.$el.find('.unsaved').remove();
		return false;
    },
    
    /**
	 * Delete the dungeon
	 */
    deleteDungeon: function(e) {
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
    
    /**
     * Prompts to removes unsaved dungeons
     */
    removeDungeon: function(e) {
	    e.preventDefault();
	    $button = $(e.currentTarget);

	    if (this.model.isNew()) {
	    	var msg = 'Are you sure?';
	    } else if (this.model.changedAttributes()) {
	   		var msg = 'Unsaved changes will be lost.';
	    } else {
		    this.remove();
		    return;
	    }
	    $button.html(msg);
	    $button.removeClass('remove btn-default').addClass('btn-danger delete');
    },
    
    /**
     * Opens modal for editing fields (title and level only so far)
     */
    editField: function(e) {
	    var field = $(e.currentTarget).attr('data-field');
	    //console.log(field);
	    var editv = new DungeonEditView({model: this.model, field: field });
	    app.showModal('Edit Field: '+field.capitalize(), editv.render().el);
    },

    /**
     * Opens modal for editing a room
     */
	editRoom: function(e) {
		var roomnumber = $(e.currentTarget).attr('data-room');
		var editv = new DungeonEditView({model: this.model, field: '', roomnumber: roomnumber});
		app.showModal('Edit Room: '+roomnumber, editv.render().el);
	},
	
	template: function(data) {
		var temp = '';
				
		temp = '<section><h1 data-field="title"><% if (title == "") { %>[untitled]<% } else { %><%= title %><% } %></h1><dl><dt data-field="level">Level</dt><dd data-field="level"><%= level %></dd></dl><h2>Rooms</h2><% _.each(rooms, function(v,k,l){ %><section class="dungeon-room"><h3>Room <%= v.number %></h3><dl data-room="<%= v.number %>"><dt>Content:</dt><dd><%= v.content.capitalize() %></dd><% if (v.trap_type !== "") { %><dt>Trap:</dt><dd><%= v.trap_type %></dd><% } if (v.monster_type !== "") { %><dt>Monster:</dt><dd><%= v.monster_type %></dd><% } if (v.special_type !== "") { %><dt>Special:</dt><dd><%= v.special_type %></dd><% } %><dt>Treasure:</dt><dd><%= v.treasure_type %></dd></dl></section><% }); %></section>';
		
		temp += '<div class="pull-right hidden-print">';
		
		if (this.model.changedAttributes()) { temp += '<span class="label label-danger unsaved">Unsaved Changes</span> '; }
		
		temp += '<button title="Save" class="btn btn-default btn-xs save"><span class="glyphicon glyphicon-save"></span></button>';
		
		temp += ' <button title="Close" class="btn btn-default btn-xs remove"><span class="glyphicon glyphicon-eye-close"></span></button>';
		
		temp += '<% if (typeof id !== "undefined"){ %> <button title="Delete" class="btn btn-default btn-xs conf-delete"><span class="glyphicon glyphicon-remove"></span></button><% } else { %><%} %></div>';
		
		var html = _.template(temp, data);
		return html;
	},
	
	render: function() {
    	this.$el.html(this.template(this.model.attributes));    	    	
		return this;
	}
	
	
});


//!DungeonList
var DungeonList = Backbone.View.extend(
	/** @lends DungeonList.prototype */
	{
	
	model: DungeonCollection,
	tagName:'section',
	className: 'dungeon-collection',
 
	attributes : function () {
		return {
			//id: 'character_'+this.model.get('id')
		};
	},
	
	/**
	 * List of Dungeons in DungeonListItem format
	 *
	 * @augments external:Backbone.View
	 * @constructs
	 */
    initialize:function () {
        this.listenTo(this.model, "add", this.render);
        this.listenTo(this.model, "destroy", this.render);
        //this.listenTo(this.model, "change:title", this.render);
    },
     
    render: function () {
    	var html = '';
    	$(this.el).html('<h1>Saved Dungeons</h1>');
    	$ul = $('<ul class="list-unstyled"></ul>');
       	_.each(this.model.models, function(v,k,l){
	    	$ul.append(new DungeonListItem({model:v}).render().el);
    	}, this);
		
		$(this.el).append($ul);
        return this;
    }
	
	
});



//!DungeonListItem
var DungeonListItem = Backbone.View.extend(
	/** @lends DungeonListItem.prototype */
	{
	
	tagName: 'li',
	className: 'dungeon-list',

	events: {
		'click .view': 'view',
		'click .delete': 'deleteDungeon',
		'click .conf-delete': 'confirmDelete'
	},
	
	/**
	 * Brief Dungeon listing
	 *
	 * @augments external:Backbone.View
	 * @constructs
	 */
	initialize: function() {
    	this.listenTo(this.model, "sync", this.render); //only change when character is saved.
    },

	/**
	 * open the details view in the main column
	 */
    view: function(e) {
		e.preventDefault();
		$('#dungeon-results').append(new DungeonDetails({model:this.model}).render().el)
	},
    
    /**
     * delete!
     */
    deleteDungeon: function(e) {
		e.preventDefault();
		this.model.destroy();
    },
    
    /**
     * Updates the delete button to make you click it twice to delete
     */
    confirmDelete: function(e) {
		$button = $(e.currentTarget);
		$button.html('Are you sure?');
		$button.removeClass('conf-delete btn-default').addClass('btn-danger delete');
	},
   
    template: function(data){
    	var list = '';
    	
 		list += '<div class="pull-right"><button title="View" class="btn btn-default btn-xs view"><span class="glyphicon glyphicon-eye-open"></span></button>';
		
		list+= '<% if (typeof id !== "undefined"){ %> <button title="Delete" class="btn btn-default btn-xs conf-delete"><span class="glyphicon glyphicon-remove"></span></button><% } else { %><%} %></div>';
		
		list += '<% if (title == "") { %>[untitled]<% } else { %><%= title %><% } %> <%= level %>';
				
		var html = _.template(list, data);
		return html;
    },
    
    render: function() {
    	this.$el.html(this.template(this.model.attributes));
		return this;
	}
	
});


//!DungeonEditView
var DungeonEditView = Backbone.View.extend(
	/** @lends DungeonEditView.prototype */
	{
	
	tagName: 'div',
	field: '',
	
	events: {
		'submit form': 'commitEdit',
		'click .randomize': 'loadRandom',
	},
	
	/**
	 * Edit form for Dungeon objects
	 *
	 * @augments external:Backbone.View
	 * @constructs
	 */
	initialize: function(options) {
		//this.options = options || {};
		this.field = options.field;
		this.subfield = '';
		this.roomnumber = options.roomnumber;

		if (this.roomnumber > 0) { this.field = 'rooms'; }
		
		if (this.field.indexOf('.') !== -1 ) {
			var f = this.field.split('.');
			this.field = f[0];
			this.subfield = f[1];
		}
	},
	
	/**
	 * save changes
	 */
	commitEdit: function(e) {
		formdata = $(e.target).serializeObject();
		//console.log(formdata);
		
		if (this.field == 'rooms') {
			
			var rooms = _.clone( this.model.get('rooms') );
			
			var number = formdata.number;
			formdata.number = parseInt(formdata.number);
			var index = formdata.number - 1;
			
			formdata.trap_type = formdata.trap_type.nl2br();
			formdata.treasure_type = formdata.treasure_type.nl2br();
			formdata.special_type = formdata.special_type.nl2br();
			
			rooms[index] = formdata;
			
			this.model.set('rooms', rooms);

		} else {
			this.model.set(formdata);
		}
		$('#editmodal').modal('hide');
		
		return false;
	},
	
	/**
	 * load random result into the modal form
	 */
	loadRandom: function(e) {
		
		var inputtarget = $(e.target).attr('data-targetfield');
		var list = $(e.target).attr('data-list');
		
		if (this.field == 'rooms') {
			newroom = this.model.generateRoom(this.roomnumber);
			//console.log(newroom);
			$('#editcontent').val(newroom.content);
			$('#editmonster_type').val(newroom.monster_type);
			$('#edittrap_type').val(newroom.trap_type.br2nl());
			$('#editspecial_type').val(newroom.special_type.br2nl());
			$('#edittreasure').val(newroom.treasure);
			$('#edittreasure_type').val(newroom.treasure_type.br2nl());
		}
		
	},
	
	
	template: function(data){
		var field = this.field;
		var subfield = this.subfield;
		
		var form = '<form>';
		switch (field) {
									
			case 'rooms':

				var rooms = this.model.get('rooms');
				//console.log(rooms);
				var room = _.findWhere(rooms, { number: parseInt(this.roomnumber) });
				//console.log(room);
				
				form += '<input type=hidden id=room_number name=number value="'+this.roomnumber+'" />';

				form += '<div class="form-group"><label class="control-label" for="editcontent">Content</label><select class="form-control" id="editcontent" name="content">';
					var stable = app.rtables.getTable(app.AppSettings.get('dungeon').stocking_table);
					_.each(stable.selectList('content'), function(v,k,l){
						var sel = (room.content == v.label) ? 'selected=selected' : '';
						form += '<option value="'+v.label+'" '+sel+'>'+v.label.capitalize()+'</option>';
					}, this);
					
				form += '</select></div>';
					
				//monster
				form += '<div class="form-group"><label class="control-label" for="editmonster_type">Monster</label><input type=text class="form-control" id="editmonster_type" name="monster_type" value="'+room.monster_type+'" /><span class="help-block"></span></div>';
				
				//trap
				form += '<div class="form-group"><label class="control-label" for="edittrap_type">Trap</label><textarea class="form-control" id="edittrap_type" name="trap_type" rows="5">'+room.trap_type.br2nl()+'</textarea><span class="help-block"></span></div>';
				
				//special
				form += '<div class="form-group"><label class="control-label" for="editspecial_type">Special</label><textarea class="form-control" id="editspecial_type" name="special_type" rows="5">'+room.special_type.br2nl()+'</textarea><span class="help-block"></span></div>';
				
				//treasure
				form += '<input type=hidden id=treasure name=treasure value="'+room.treasure+'" />';
				form += '<div class="form-group"><label class="control-label" for="edittreasure_type">Treasure</label><textarea class="form-control" id="edittreasure_type" name="treasure_type" rows="5">'+room.treasure_type.br2nl()+'</textarea><span class="help-block"></span></div>';
				
				//reroll room
				form += '<div class="form-group"><button type=submit class="btn btn-primary">Update</button> &nbsp; <button type="button" class="btn btn-warning randomize" data-targetfield="rooms">Reroll Room</button></div>';
				
				break;
							
			default:
				form += '<div class="form-group"><label class="control-label" for="edit'+field+'">'+field+'</label><input type=text class="form-control" id="edit'+field+'" name="'+field+'" value="<%= '+field+' %>" /><span class="help-block"></span></div><div class="form-group"><button type=submit class="btn btn-primary">Update</button></div>';
				break;

		}
		
		form += '</form>';

		var html = _.template(form, data);
		return html;
	},
	
	render: function() {
    	this.$el.html(this.template(this.model.attributes));
		return this;	
	}
	
});


//!DungeonForm
var DungeonForm = Backbone.View.extend(
	/** @lends DungeonForm.prototype */
	{
	
	tagName: 'form',
	className: 'dungeon-form clearfix',
	
	events: {
		'submit': 'createDungeon',
	},
	
	/**
	 * Form for generating Dungeon objects
	 *
	 * @augments external:Backbone.View
	 * @constructs
	 */
	initialize: function() {
    	this.render();
        this.listenTo(this.model, 'change', this.render);
    },
	
	/**
	 * Form submission, dungeon generation
	 */
	createDungeon: function(e) {
		e.preventDefault();
		formdata = $(e.target).serializeObject();
		if (!formdata.room_count.match(/^[0-9]+$/)) { alert('Room Count must be a number.'); return; }
    	var dungeon = new Dungeon(formdata);
    	dungeon.create();
    	$('#dungeon-results').prepend(new DungeonDetails({model:dungeon}).render().el);
    	
    	this.$('#title').val('');
			
	},
	
	
	template: function(data) {
		var html = '';
		
		html += '<div class="row">';
		
		html += '<div class="col-sm-6"><div class="form-group"><label for=title class="control-label">Title</label><input type="text" class="form-control" name="title" id="title" value=""/><div class="help-block">Identify it later.</div></div></div>';	
		
		html += '<div class="col-sm-6"><div class="form-group"><label for=level class="control-label">Level</label><select class="form-control" name="level" id="level">';
			for(var i=1; i <= 10; i++) {
				html += '<option value="'+i+'">'+i+'</option>';
			}
		html += '</select><div class="help-block">Effects monsters/treasure.</div></div></div>';
		
		html += '</div><div class="row">';
		
		html += '<div class="col-sm-6"><div class="form-group"><label for=room_count class="control-label"># of Rooms</label><input type="text" class="form-control" name="room_count" id="room_count" value="20"/><div class="help-block">Obvious I hope.</div></div></div>';	
		
		html += '<div class="col-sm-6"><div class="form-group"><button type=submit class="btn btn-primary">Generate</button></div></div>';
		html += '</div>';
		return html;
			
	},
	
	render: function() {
    	this.$el.html(this.template(this.model.attributes));
		return this;
	}
	
	
});
