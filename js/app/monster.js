//Monster stuff!

//!Monster model
var Monster = Backbone.Model.extend(
	/** @lends Monster.prototype */
	{
	
	localStorage: new Backbone.LocalStorage("osr-random-generator-table"),
	
	defaults: function() {
		return {
			name: '',
			cr: '',
			type: '',
			source: '',
		}
	},
	
	theaders: ['name', 'cr', 'type', 'source'],
	
	/**
	 * This is the model for Monsters.
	 *
	 * @augments external:Backbone.Model
	 * @constructs
	 * @property {String} key identifier for the table
	 * @property {String} id id for the table if it is locally saved
	 * @property {String} name of the table
	 * @property {String} [source] source of the table
	 */
	initialize: function(){
		if (this.get('key') == '') {
			this.set('key', this.get('name').replace(' ', '_'));
		}
	},
	
	
	/**
	 * validate fields before saving
	 * @returns {Object} error information
	 */
	validate: function(attributes, options) {
		//console.log(attributes);
		var error = { fields: [], general: '' };
		
		if (attributes.name == '') {
			error.fields.push({ field: 'name', message: 'Name cannot be blank' });
			error.general += 'Name cannot be blank. ';
		}
		
		if (!_.isEmpty(error.fields) || !_.isEmpty(error.general)) {
			return error;
		}
	},
				
	/**
	 * outputs the json data for the table (import/export)
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
	 * outputs the json data for the table (import/export)
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


//!MonsterShort
var MonsterShort = Backbone.View.extend(
	/** @lends MonsterShort.prototype */
	{
	
	model: Monster,
	tagName:'tr',
	
	/**
	 * add tags as classes for filtering
	 */
	className: function(){
		/*
var o='tag_all ';
		_.each(this.model.get('tags'), function(v) {
	        o += 'tag_'+v.cleanClass()+' ';
	        //o += 'tag_'+v+' ';
        }, this);
        return o;
*/
	},
	
	events: {
		/*
'click .roll': 'roll',
		'click .pick': 'pick',
		'click .info': 'info'
*/
	},
	
	/**
	 * Table row of metdata for Monster
	 *
	 * @augments external:Backbone.View
	 * @constructs
	 * @param {Object} options include optional "import" property to change view if we are in the import area.
	 */
    initialize:function (options) {
        this.tcells = this.model.shortdisplay;
        this.listenTo(this.model, "change", this.render);
        this.listenTo(this.model, "destroy", this.remove);
       
        this.options = options || {};
        this.import = (this.options.import) ? this.options.import : false;
    },
     
    render: function () {
		
		$(this.el).empty();
		this.$el.attr('id', this.model.get('key'));
		//this.$el.attr('class', _.result(this, 'className'));
		
		_.each(this.model.theaders, function(v) {
			/*
if (v == 'actions') {
				$actions = $('<td></td>');
				$actions.append('<button title="Info" class="btn btn-default info"><span class="glyphicon glyphicon-info-sign"></span></button> <button title="Pick" class="btn btn-default pick"><span class="glyphicon glyphicon-eye-open"></span></button> <button title="Roll" class="btn btn-default roll"><span class="glyphicon glyphicon-random"></span></button> ');
				if (this.import) {
					$actions.append(' <button title="Remove" class="btn btn-default remove"><span class="glyphicon glyphicon-remove"></span></button>');
				}
				
				$(this.el).append($actions);
				return;
			} else if (v == 'tags') {
				var tags = '';
				
				_.each(this.model.get('tags'), function (v){
					tags += '<a href="" class="badge tag-filter" data-tag="'+v+'">'+v+'</a> ';
				}, this);
				
				$(this.el).append('<td>'+tags+'</td>');
				return;
			} else if (v == 'description') {
				var desc = this.model.get(v);
				if (desc !== '') { desc += '<br/>'; }
				var src = this.model.get('source');
				if (src !== '') {
					desc += 'Source: '+src; 
				}
				$(this.el).append('<td class="hidden-xs">'+desc+'</td>');
				
				return;	
			}
*/
			$(this.el).append('<td>'+this.model.get(v)+'</td>');
			
		}, this);

        return this;
    },
        
    /**
     * Metadata about the table in a modal
     */
    info: function() {
    	editv = new MonsterInfo({ model: this.model });
	    app.showModal({ full_content: editv.render().el });		
    },
	
	
});


//!MonsterInfo
MonsterInfo = Backbone.View.extend(
	/** @lends MonsterInfo.prototype */
	{
	
	model: Monster,
	tagName: 'div',
	className: 'modal-content',
	
	events: {
		'click .delete': 'delete',
		'click .conf-delete': 'confirmDelete',
		'click .edit': 'edit'
	},
	
	/**
	 * Info modal for Monster
	 *
	 * @augments external:Backbone.View
	 * @constructs
	 */
	initialize: function(){},
	
	render: function () {
		this.$el.html(this.template(this.model.attributes));
        return this;
    },
        
    template: function(data) {
		var temp = '';
		
		temp += app.modalHeader(data.title);
		temp += '<div class="modal-body">';
		temp += '<dl><dt data-field="title">Title</dt><dd data-field="title"><%= title %></dd><dt data-field="author">Author</dt><dd data-field="author"><% if (author == "") { %>[unknown]<% } else { %><%= author %><% } %></dd><dt data-field="source">Source</dt><dd data-field="source"><% if (source == "") { %>[unknown]<% } else { %><%= source %><% } %></dd><dt>Tags</dt><% _.each(tags, function(v,k,l){ %><dd><%= v %></dd><% }) %><dt data-field="description">Description</dt><dd data-field="description"><%= description %></dd></dl>';
		temp += '</div>';
		
		if (typeof data.id !== 'undefined' && data.id !== '') {
			buttons = '<button title="Edit" class="btn btn-primary edit">Edit</button> <button title="Delete" class="btn btn-danger conf-delete">Delete</button>';
		} else { buttons = ''; }
		
		temp += app.modalFooter(buttons);
		
				
		return _.template(temp, data);
	},
	
	/**
	 * Delete the user imported table
	 */
	delete: function(e) {
		e.preventDefault();
		
		this.model.destroy();
		this.remove();
		$('#editmodal').modal('hide');
	},
	
    /**
     * Updates the delete button to make you click it twice to delete
     */
	confirmDelete: function(e) {
		$button = $(e.currentTarget);
		$button.html('Are you sure?');
		$button.removeClass('conf-delete').addClass('delete');
		
		//reset the button about a few seconds
		window.setTimeout(this.resetDelete.bind(this), 4000);	
	},
	
	/**
	 * Resets the confirm delete button so the 'are you sure' doesn't stick around
	 */
	resetDelete: function() {
		this.$el.find('.delete').html('Delete').removeClass('delete').addClass('conf-delete');
	},
	
	/**
	 * Edit the user imported table
	 */
	edit: function(e) {
		e.preventDefault();
		
		//close modal
		$('#editmodal').modal('hide');
		
		//trigger import tab
		$('#maintab a[href="#create"]').tab('show');
		
		//load import form with this.model
		app.creator.resetCreator(this.model);
		
	}
	

});


//!Monster_Collection
var Monster_Collection = Backbone.Collection.extend(
	/** @lends Monster_Collection.prototype */
	{
	
	model: Monster,
	localStorage: new Backbone.LocalStorage("osr-random-generator-monster"),
	
	sortAttribute: "name",
	sortDirection: 1,
	
	/**
	 * A collection of Monsters
	 * Tables are added via appdata.tables (converted to an array of objects in AppRouter)
	 *
	 * @augments external:Backbone.Collection
	 * @constructs
	 */
	initialize: function(){
		
	},
	
	/**
	 * Add a Monster to the collection, trigger refresh so view updates
	 * @param {Object} [model] A Monster model to add to the collection
	 */
	import: function (model) {
		this.add(model);
		this.trigger('refresh');
	},
	
	/**
	 * trigger a refresh on the collection
	 */
	refresh: function() {
		this.trigger('refresh')
	},
	
	/**
	 * Sort the collection's Tables
	 * @param {String} attr The field to sort by
	 */
	sortTables: function (attr) {
		if (typeof attr == 'undefined') { attr = 'title'; this.sortDirection = 1; }
		this.sortAttribute = attr;
		this.sort();
	},
	
	/**
	 * Comparator function for sorting
	 */
	comparator: function(a, b) {
		var a = a.get(this.sortAttribute),
		b = b.get(this.sortAttribute);
		
		if (_.isString(a)) {
			a = a.toLowerCase();
		}
		if (_.isString(b)) {
			b = b.toLowerCase();
		}
		
		if (a == b) return 0;
		
		//1 is ascending
		if (this.sortDirection == 1) {
			return a > b ? 1 : -1;
		} else {
			return a < b ? 1 : -1;
		}
	},
	
	/**
	 * Search the collection
	 * @param {String} query words to look for
	 * @param {Function} callback function to perform with the matching models
	 */
	search: function( query, callback ){
		var pattern = new RegExp( $.trim( query ).replace( / /gi, '|' ), "i");
		callback.call( this, this.filter(function( model ){
			if (pattern.test(model.attributes.name) || pattern.test(model.attributes.type) || pattern.test(model.attributes.cr) || pattern.test(model.attributes.source)) {
				return true;
			}
		}));
	},

	/**
	 * Returns a table from the collection based on ID
	 * @Param {String} id which random table to get
	 * @returns {Object} the randomtable model
	 */
	getById: function(id) {
		if (typeof id == 'undefined' || _.isEmpty(id) || id == '0') {
			return {};
		}
		
		var t = this.findWhere({ id: id });
		if (typeof t == 'undefined') {
			return {};
		}
		return t; 
	},
	
	/**
	 * Return a table from the collection
	 * @Param {String} title which random table to get
	 * @returns {Object} the randomtable model
	 */
	getByName: function(name) {
		if (typeof name == 'undefined' || title == '') {
			return {};
		}
		//console.log(title);
		//console.log(this.findWhere({ key: title }));
		
		var t = this.findWhere({ key: name });
		if (typeof t == 'undefined') {
			t = this.findWhere({ name: name });
		}
		if (typeof t == 'undefined') {
			return {};
		}
		return t; 
	},
	
	/**
	 * Return an array of tables from the collection
	 * @Param {String} tag a tag to search on
	 * @returns {Array} of randomtable models
	 */
/*
	getByTags: function(tag) {
		if (typeof tag == 'undefined' || tag == '') {
			return [];
		}
		//console.log(tag);
		var t = this.filter(function(model){
			return ( _.indexOf(model.get('tags'), tag) >= 0 );
		});
		//console.log(t);
		if (typeof t == 'undefined') {
			return [];
		}
		return t; 
	},
*/
	
	/**
	 * Export the user saved custom tables
	 * @param {String} [which=user] user will only output user saved tables, all will output all tables
	 * @param {Boolean} [compress=false] if true JSON will not be indented with tabs/lines
	 * @returns {Array} Array of table objects ? 
	 */
	exportOutput: function(which, compress) {
		if (typeof which == 'undefined') {
			which = 'user';
		}
		if (typeof compress == 'undefined') {
			compress = false;
		}
		var t = this.filter(function(model){
			if (which == 'user') {
				return ( typeof model.get('id') !== 'undefined' );
			}
			return true;
		});
		
		_.each(t, function(v,k,l){
			l[k] = v.outputObject(false);
		}, this);
		
		return t;		
	}
	
});


//!Monster_List
var Monster_List = Backbone.View.extend(
	/** @lends Monster_List.prototype */
	{
	
	model: Monster_Collection,
	
	tagName:'table',
	className: 'table table-striped',
	theaders: [ { label: 'Name', class: '' }, { label: 'CR', class: '' }, { label: 'Type', class: '' }, { label: 'Source', class: '' }],
	tagFilters: [],
	kwquery: '',
	
	events: {
		'click .tag-filter': 'filter_tag',
		'click .clear-tag-filter': 'clear_filter',
		"click th": "headerClick",
		"keyup #monster_keyword": "trigger_filter_keyword"
	},
	
	/**
	 * This is the view for the RTable_Collection (a table)
	 * list for RTable_Collection refresh event to refresh table
	 *
	 * @augments external:Backbone.View
	 * @constructs
	 */
    initialize:function () {
		this.listenTo(this.model, 'refresh', this.render);
		this.listenTo(this.model, 'sort', this.render);
    },
    
    /**
     * when a tag filter is clicked in MonsterShort view
     * adds tag to filter list
     */
    filter_tag: function(e) {
	  	e.preventDefault();
	  	var tag = $(e.target).data('tag');
	  	if (_.contains(this.tagFilters, tag)) {
		  	return;
	  	}

	  	if (tag == 'all' || tag == '') {
		  	this.tagFilters = [];
	  	} else {
	  		this.tagFilters.push(tag);
	  	}
	  	
	  	this.filter_rows();
	  	this.filter_caption();
    },
    
    /**
     * clear one or all tag filters
     */
    clear_filter: function(e) {
	    e.preventDefault();
	    var $badge = $(e.currentTarget);
	    var cur_tag = $badge.attr('data-tag');
	    if (cur_tag == 'all' || cur_tag == '') {
			this.tagFilters = [];
		} else {
			this.tagFilters = _.filter(this.tagFilters, function(tag){ return tag !== cur_tag; }, this);
			
		}
		
		this.filter_rows();
		this.filter_caption();
    },
    
    /**
     * Adjust the caption based on tag filters
     */
    filter_caption: function() {
		if (this.tagFilters.length == 0) {
			$('#monster-list caption').html(this.defaultCaption());
			return;
		}
		
		var caption = 'Viewing tables tagged: ';
		_.each(this.tagFilters, function(v){
			caption += '<span class="badge clear-tag-filter" data-tag="'+v+'">'+v+' <span class="glyphicon glyphicon-remove-circle"></span></span> ';
		}, this);
		caption += ' <a href="" class="clear-tag-filter" data-tag="all"><span class="glyphicon glyphicon-remove-circle"></span></a>';
		
		$('#rtable-list caption').html(caption);  
    },
    
    /**
     * Uses the tag filters to show/hide rows
     */
    filter_rows: function(){
		if (this.tagFilters.length == 0) {
			$('#monster-list table tr.tag_all').removeClass('hidden');
			return;
		}
				  
		$(this.el).find('tr.tag_all').addClass('hidden');
		filter = _.map(this.tagFilters, function(v){ return v.cleanClass(); }, this);
  		var classes = filter.join('.tag_');
  		classes.replace(/\.tag_$/, '');
  		if (classes !== '') { classes = '.tag_'+classes; }
  		$(this.el).find('tr'+classes).removeClass('hidden');		  
    },
    
    /**
     * show tables based on search query (activated by typing in filter form)
     */
    trigger_filter_keyword: function(e) {
	    //console.log( $(e.currentTarget).val() );
	    
	   this.kwquery = $(e.currentTarget).val();
	    
	   this.filter_keyword();
	    
	},
    
    
    filter_keyword: function() {
	    if (this.kwquery !== '') {
	    	$('#monster-list table tbody tr').addClass('hidden');
			    
			// later
			this.model.search(this.kwquery, function( matches ){
				_.each(matches, function(match){
					//console.log('Found '+query+' in '+match.get('title'));
					$('#'+match.get('key')).removeClass('hidden');
				});
			});
	    	
		} else {
			 $('#monster-list table tr').removeClass('hidden');
		}
    },
    
	/**
	 * event for clicking on th to sort table
	 */
	headerClick: function(e) {
		
		var $el = $(e.currentTarget),
		ns = $el.data('column'),
		cs = this.model.sortAttribute;
		
		if (ns == 'actions') { return; }
		
		// Toggle sort if the current column is sorted
		if (ns == cs) {
			this.model.sortDirection *= -1;
		} else {
			this.model.sortDirection = 1;
		}
		
		$(this.el).find('th span.sorter').removeClass('glyphicon-chevron-up glyphicon-chevron-down');
		if (this.model.sortDirection == 1) {
			$el.find('span').addClass('glyphicon-chevron-up');
		} else {
			$el.find('span').addClass('glyphicon-chevron-down');
		}
		
		this.model.sortTables(ns);
		if (this.kwquery) {
			this.filter_keyword();
		}
	},
    
    /**
     * Build/show the table, filter as appropriate (for rerender actions)
     */
    render: function () {
    	$(this.el).empty();
    	$(this.el).append('<caption>'+this.defaultCaption()+'</caption>');
    	var $thead = $('<thead>');
		var $th_row = $('<tr>');
		_.each(this.theaders, function(v) {
			var icon = (this.model.sortAttribute == v.label.toLowerCase()) ? (this.model.sortDirection == 1) ? 'glyphicon-chevron-up' : 'glyphicon-chevron-down' : '';
			$th_row.append('<th class="'+v.class+'" data-column="'+v.label.toLowerCase()+'">'+v.label+' <span class="sorter glyphicon '+icon+'"></span></th>');
		}, this);
		$thead.append($th_row);
		$(this.el).append($thead);
		var $tbody = $('<tbody>');
		_.each(this.model.models, function(v,k,l){
			$($tbody).append(new MonsterShort({model:v}).render().el);
    	}, this);
    	$(this.el).append($tbody);
    	this.filter_rows();
	  	this.filter_caption();

        return this;
    },
	
	/**
	 * the default caption (when filters are reset)
	 * @returns {String} caption html
	 */
	defaultCaption: function() {
		return '<form class="form-inline"><div class="form-group"><label for="monster_keyword" class="control-label">Filter by Keyword</label> <input type="text" class="form-control" name="monster_keyword" id="monster_keyword" value="'+this.kwquery+'" /></div></form>';
		//return '<form class="form-inline"><div class="form-group"><label for="rtable_keyword">Filter by Keyword</label><input type="text" class="form-control" name="rtable_keyword" id="rtable_keyword" value="" /></div></form> <span class="divider">or</span> Click a Tag';
	}
	
});

