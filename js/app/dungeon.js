
//!Dungeon model
var Dungeon = Backbone.Model.extend({
	
	localStorage: new Backbone.LocalStorage("osr-random-generator-dungeon"),
	
	defaults: function() {
		return {
			title: '[Untitled]',
			level: 1,
			room_count: 10,
			rooms: {},
		}
	},
	
			
	initialize:  function() {
		
	},
	
	create: function() {
		this.set('rooms', this.generateRooms(this.get('room_count')));
	},
	
	generateRooms: function(ct) {
		var rooms = [];

		for(var i=1;i<=ct;i++){
			rooms.push(this.generateRoom(i));
		}
		
		return rooms;	
	},
	
	//roll a single room
	generateRoom: function(roomnumber) {
		var room = { number: roomnumber, content: 'Empty', monster_type: '', trap_type: '', special_type: '', treasure_type: '' };
		room.content = app.randomizer.rollRandom(appdata.dungeon.rooms.content);
		room.treasure = app.randomizer.rollRandom(appdata.dungeon.rooms.content[room.content].treasure);
		
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
	
	
	generateTrap: function() {
		var traptable = new RandomTable(appdata.tables.traps_campbell);
		traptable.generateResult();
		return traptable.niceString();
	},
	
	
	generateSpecial: function() {
		//?
		var specialtable = new RandomTable(appdata.tables.bag_tricks_2);
		specialtable.generateResult();
		return specialtable.niceString();
	},

	//room object passed
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
	}
	
	
});


//!DungeonCollection
var DungeonCollection = Backbone.Collection.extend({
	
	model: Dungeon,
	localStorage: new Backbone.LocalStorage("osr-random-generator-dungeon"), // Unique name within your app.
		
	initialize: function(){
		//this.listenTo(this.model, 'sync', this.addChar);
	},
});


//!DungeonDetails
var DungeonDetails = Backbone.View.extend({
	
	tagName: 'div',
	className: 'dungeon-details clearfix',
	model: Dungeon,
	
	attributes : function () {
		return {
			//id: 'character_'+this.model.get('id')
		};
	},
	
	events: {
		'click .save': 'saveDungeon',
		'click .delete': 'deleteDungeon',
		'click .remove': 'removeDungeon',
		//!TODO reenable editing #19
		//'click *[data-field]': 'editField',
		//'click *[data-room]': 'editRoom',
	},
	
	initialize: function() {
    	this.listenTo(this.model, 'change', this.render);
    },
	
	saveDungeon: function() {
		//do something
		if (this.model.isNew()) {
			this.model.save();
			app.dungeonlist.add(this.model);
		} else {
			this.model.save();
		}
		this.$el.find('.unsaved').remove();
		return false;
    },
    
    deleteDungeon: function(e) {
		e.preventDefault();
		this.model.destroy();
		this.remove();
		//return false;  
    },
    
    removeDungeon: function(e) {
	    e.preventDefault();
	    //console.log(this.model.changedAttributes());
	    if (this.model.isNew()) {
		    if (!confirm('You have not saved this dungeon. Are you sure you with to delete it?')) {
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
	    var room = $(e.target).parent('dl').attr('data-room');
	    
	    var editv = new DungeonEditView({model: this.model, field: field, room: room});
	    app.showModal('Edit Field: '+field.capitalize(), editv.render().el);
    },

	editRoom: function(e) {
		var roomnumber = $(e.target).parent('dl').attr('data-room');
		var editv = new DungeonEditView({model: this.model, field: '', roomnumber: roomnumber});
		app.showModal('Edit Room: '+roomnumber, editv.render().el);
	},
	
	template: function(data) {
		var temp = '';
		
		//console.log(data);
		
		temp = '<section><h1 data-field="title"><% if (title == "") { %>[untitled]<% } else { %><%= title %><% } %></h1><dl><dt data-field="level">Level</dt><dd data-field="level"><%= level %></dd></dl><h2>Rooms</h2><% _.each(rooms, function(v,k,l){ %><h3>Room <%= v.number %></h3><dl data-room="<%= v.number %>"><dt>Content:</dt><dd><%= v.content.capitalize() %></dd><% if (v.content == "trap") { %><dt>Trap:</dt><dd><%= v.trap_type %></dd><% } else if (v.content == "monster") { %><dt>Monster:</dt><dd><%= v.monster_type %></dd><% } else if (v.content == "special") { %><dt>Special:</dt><dd><%= v.special_type %></dd><% } %><dt>Treasure:</dt><dd><%= v.treasure_type %></dd></dl><% }); %></section>';
		
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





//!DungeonList - view for individual dungeon models
var DungeonList = Backbone.View.extend({
	
	model: DungeonCollection,
	tagName:'section',
	className: 'dungeon-collection',
 
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
//View for dungeon data in brief list
var DungeonListItem = Backbone.View.extend({
	
	tagName: 'li',
	className: 'dungeon-list',
	
	attributes : function () {
		return {
			//id: 'character_'+this.model.get('id')
		};
	},
	
	events: {
		'click .view': 'view',
		'click .delete': 'delete'
	},
	
	initialize: function() {
    	//this.listenTo(this.model, "change", this.render);
    	this.listenTo(this.model, "sync", this.render); //only change when character is saved.
    },

    view: function(e) {
		e.preventDefault();
		$('#dungeon-results').append(new DungeonDetails({model:this.model}).render().el)
	},
    
    delete: function(e) {
		e.preventDefault();
		if (!confirm('Are you sure you want to delete this dungeon?')) { return; }
		this.model.destroy();
    },
   
    template: function(data){
    	var list = '';
    	
 		list += '<div class="pull-right"><button title="View" class="btn btn-default btn-xs view"><span class="glyphicon glyphicon-eye-open"></span></button>';
		
		list+= '<% if (typeof id !== "undefined"){ %> <button title="Delete" class="btn btn-default btn-xs delete"><span class="glyphicon glyphicon-remove"></span></button><% } else { %><%} %></div>';
		
		list += '<% if (title == "") { %>[untitled]<% } else { %><%= title %><% } %> <%= level %>';
				
		var html = _.template(list, data);
		return html;
    },
    
    render: function() {
    	this.$el.html(this.template(this.model.attributes));
		return this;
	}
	
});


//!DungeonEditView View for editing the fields
var DungeonEditView = Backbone.View.extend({
	
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
		this.roomnumber = options.roomnumber;

		if (this.roomnumber > 0) { this.field = 'rooms'; }
		
		if (this.field.indexOf('.') !== -1 ) {
			var f = this.field.split('.');
			this.field = f[0];
			this.subfield = f[1];
		}
	},
	
	commitEdit: function(e) {
		formdata = $(e.target).serializeObject();
		//console.log(formdata);
		
		if (this.field == 'rooms') {
			
			var rooms = _.clone( this.model.get('rooms') );
			
			var number = formdata.number;
			formdata.number = parseInt(formdata.number);
			var index = formdata.number - 1;
			
			rooms[index] = formdata;
			
			this.model.set('rooms', rooms);

		} else {
			this.model.set(formdata);
		}
		$('#editmodal').modal('hide');
		
		return false;
	},
	
	loadRandom: function(e) {
		
		//console.log(e);
		var inputtarget = $(e.target).attr('data-targetfield');
		var list = $(e.target).attr('data-list');
		
		if (this.field == 'personality' || this.field == 'appearance') {
			var newval = app.randomizer.randomValue(appdata[this.field][list]);
			$('#'+inputtarget).val(newval);
		} else if (this.field == 'hexdressing') {
			var newval = _.sample(appdata.wilderness.hexdressing);
			$('#'+inputtarget).val(newval);
		} else if (this.field == 'rooms') {
			newroom = this.model.generateRoom(this.roomnumber);
			//console.log(newroom);
			$('#editcontent').val(newroom.content);
			$('#editmonster_type').val(newroom.monster_type);
			$('#edittrap_type').val(newroom.trap_type);
			$('#edittreasure').val(newroom.treasure);
		}
		
	},
	
	
	template: function(data){
		var field = this.field;
		var subfield = this.subfield;
		
		//console.log(field);
		
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
			
			case 'rooms':

				var rooms = this.model.get('rooms');
				//console.log(rooms);
				var room = _.findWhere(rooms, { number: parseInt(this.roomnumber) });
				//console.log(room);
				
				form += '<input type=hidden id=room_number name=number value="'+this.roomnumber+'" />';

				form += '<div class="form-group"><label class="control-label" for="editcontent">Content</label><select class="form-control" id="editcontent" name="content">';
					_.each(appdata.dungeon.rooms.content, function(v,k,l){
						var sel = (room.content == k) ? 'selected=selected' : '';
						form += '<option value="'+k+'" '+sel+'>'+k.capitalize()+'</option>';
					}, this);
					
				form += '</select></div>';
					
				//monster
				form += '<div class="form-group"><label class="control-label" for="editmonster_type">Monster</label><input type=text class="form-control" id="editmonster_type" name="monster_type" value="'+room.monster_type+'" /><span class="help-block"></span></div>';
				
				//trap
				form += '<div class="form-group"><label class="control-label" for="edittrap_type">Trap</label><input type=text class="form-control" id="edittrap_type" name="trap_type" value="'+room.trap_type+'" /><span class="help-block"></span></div>';
				
				//special
				
				//treasure
				form += '<div class="form-group"><label class="control-label" for="edittreasure">Treasure</label><input type=text class="form-control" id="edittreasure" name="treasure" value="'+room.treasure+'" /><span class="help-block"></span></div>';
				
				//reroll room
				form += '<div class="form-group"><button type="button" class="btn btn-warning randomize" data-targetfield="rooms">Reroll Room</button></div>';
				
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


//!DungeonForm
var DungeonForm = Backbone.View.extend({
	
	tagName: 'form',
	className: 'dungeon-form clearfix',
	
	attributes : function () {
		return {
			//id: 'character_'+this.model.get('id')
		};
	},
	
	events: {
		'submit': 'createDungeon',
	},
	
	initialize: function() {
    	this.render();
        this.listenTo(this.model, 'change', this.render);
    },
	
	
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
		
		html += '<div class="form-group"><label for=title class="control-label">Title</label><input type="text" class="form-control" name="title" id="title" value=""/><div class="help-block">Just a way to identify it later.</div></div>';	
		
		html += '<div class="row"><div class="col-sm-6"><div class="form-group"><label for=level class="control-label">Level</label><select class="form-control" name="level" id="level">';
			for(var i=1; i <= 10; i++) {
				html += '<option value="'+i+'">'+i+'</option>';
			}
		html += '</select><div class="help-block">Will effect monster/treasure results.</div></div></div>';
		
		html += '<div class="col-sm-6"><div class="form-group"><label for=room_count class="control-label"># of Rooms</label><input type="text" class="form-control" name="room_count" id="room_count" value="20"/><div class="help-block">Obvious I hope.</div></div></div></div>';	
		
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
