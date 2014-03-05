//For handling generic random tables

//!RandomTable model
var RandomTable = Backbone.Model.extend(
	/** @lends RandomTable.prototype */
	{
	
	localStorage: new Backbone.LocalStorage("osr-random-generator-table"),
	
	defaults: function() {
		return {
			title: '',
			author: '',
			description: '',
			source: '',
			tags: [],
			start: '', //where to start rolling
			tables: {}, //subtables
			result: {},
		}
	},
	
	theaders: ['title', 'description', 'tags', 'actions'],
	
	/**
	 * This is the model for Random Tables.
	 *
	 * @augments external:Backbone.Model
	 * @constructs
	 * @property {String} key identifier for the table
	 * @property {String} id id for the table if it is locally saved
	 * @property {String} [title] title of the table
	 * @property {String} [author] author of the table
	 * @property {String} [description] description of the table
	 * @property {String} [source] source of the table
	 * @property {Array} [tags] subject tags
	 * @property {String|Array} [start] tables to roll on. if array it can be an array of strings (table names) or objects (two properties table: the table to roll on and times: the number of times to roll)
	 * @property {Array} [table] default table. array of strings or objects. removed after initialization.
	 * @property {Object} [tables] a property for each subtables. if table property is not set then the first propery of this Object is used to start rolling 
	 * @property {Object} [result] current result
	 */
	initialize: function(){
		this.normalize();
	},
	
	/**
	 * Normalize data - mostly move "table" to "table.default"
	 */
	normalize: function() {
		if (!_.isEmpty(this.get('table'))) {
			var tables = this.get('tables');
			tables.default = this.get('table');
			this.set('tables', tables);
			this.unset('table');
		}
	},
	
	/**
	 * Start the process of rolling
	 * @param {String} [start=''] - subtable to roll on
	 * @returns {Boolean} success (always true right now)
	 */
	generateResult: function(start) {
		if (typeof start == "undefined") {
			start = '';
		}
		//we look in the start table for what to roll if the start wasn't explicitly set in the call
		start = (start == '') ? this.get('start') : start;
		if (start == '') {
			//if no start attribute
			//try for "default" table
			if (typeof this.get('tables')['default'] !== 'undefined') {
				this.set('result', this.selectFromTable('default'), { silent: true });
			} else {
				//select first item from tables
				var k = _.keys(this.get('tables'));
				this.set('result', this.selectFromTable(k[0]), { silent: true });
			}
		} else if (typeof start == 'string') {
			this.set('result', this.selectFromTable(start), { silent: true });
		} else {
			result = [];
			_.each(start, function(v){
				if (_.isString(v)) {
					r = this.selectFromTable(v);
					result = result.concat(r);
					return;
				}
				//its an object
				var times = (typeof v.times == 'number' ) ? v.times : 1;
				for(var i = 1; i<=times; i++) {
					r = this.selectFromTable(v.table);
					result = result.concat(r);
				}
			}, this);
			//console.log(result);
			this.set('result', result, { silent: true });
		}
		
		return true;
	},
		
	/**
	 * Get a result from a table/subtable
	 * DANGER: you could theoretically put yourself in an endless loop if the data were poorly planned
	 * ...but at worst that would just crash the users browser since there's no server processing involved.
	 * @param {String} table - table to roll on
	 * @returns {Array} array of object results { table: table that was rolled on, result: result string, desc: description string }
	 */
	selectFromTable: function(table) {
		if (typeof table == 'undefined') {
			return [{ table: "Error", result: "No table found to roll on.", desc: "" }];
		}
		//console.log(table);
		var o = [];
		var t = this.get('tables')[table];
		var result = app.randomizer.rollRandom(t);
		
		if (_.isUndefined(t[result])) {
			//table is an array
			var r = _.findWhere(t, { label: result });
			if (_.isUndefined(r)) {
				//it's just an array of strings so we can stop here
				o.push({ table: table, result: result, desc: '' });
				return o
			}
			//console.log(r);
			var result_print = (typeof r['print'] == 'undefined') ? true : r['print'];
		} else {
			var r = t[result];
			var result_print = (typeof t[result]['print'] == 'undefined') ? true : t[result]['print'];
		}
		//r is now the result object
		
		//console.log(t[result]);
		//if print==false we suppress the output from this table (good for top-level tables)
		if (result_print === true) {
			//add the description if there is one
			var desc = (_.isString(r['description'])) ? r['description'] : '';
			
			t_result = app.randomizer.findToken(result);
			
			o.push({ table: table, result: t_result, desc: desc });
		}
		//console.log(result);
		
		//are there subtables to roll on?
		//var subtable = this.get('tables')[table][result].subtable;
		var subtable = r.subtable;
		//console.log(subtable);
		if (typeof subtable == 'undefined') {
			//no subtables
			return o;
		} else if (_.isString(subtable)) {
			//subtables is a string reference to a table so we run this function again
			var r = this.selectFromTable(subtable);
			o = o.concat(r);
		} else if (_.isArray(subtable)) {
			//subtables is an array, assume reference to other tables, roll on each in turn
			_.each(subtable, function(v){
				var r = this.selectFromTable(v);
				o = o.concat(r);
				//console.log(o);
			}, this);
		} else if (_.isObject(subtable)) {
			//subtable is object assume embedded table(s)
			//loop over keys
			var k = _.keys(subtable);
			_.each(k, function(kx){
				result = app.randomizer.rollRandom(subtable[kx]);
				//console.log(result);
				var desc = '';
				if (_.isUndefined(subtable[kx][result])) {
					var r = _.findWhere(subtable[kx], { label: result });
					if (_.isObject(r)) {
						desc = (_.isString(r.description)) ? r.description : '';
					}				
				} else {
					desc = (_.isString(subtable[kx][result]['description'])) ? subtable[kx][result]['description'] : '';
				}
				result = app.randomizer.findToken(result);
				o.push({ table: kx, result: result, desc: desc });
				
			}, this);

		}
		
		return o;
	},

	
	/**
	 * Show the results as a string
	 * @todo make this nicer/clearer #23
	 * Alternate: write a template to use in the views?
	 * @param {Boolean} [simple=false] if true only output the first result label
	 * @returns {String} the results
	 */
	niceString: function(simple) {
		if (typeof simple == 'undefined') {
			simple = false;
		}
		var r = this.get('result');
		if (r == '') { return ''; }
		//console.log(r);
		if (_.isString(r)) { return r; }
		if (simple) { return r[0]['result']; }
		var o = '';
		_.each(r, function (v){
			if (v.table == 'default') {
				o += v.result.capitalize()+'<br/>';
			} else {
				o += v.table.capitalize()+': '+v.result.capitalize()+'<br/>';
			}
			if (v.desc !== '') { o += v.desc+'<br/>'; }
		}, this);
		o = o.replace(/<br\/>$/, '');
		return o;
	},
	
	/**
	 * Show the table options as a list
	 * @returns {String} the table as html lists
	 */
	niceList: function() {
		//iterature through each table
		
		//count the number of entries so we can columnize if necessary
		var t_length = 0, t_tables = 0;
		_.each(this.get('tables'), function(v,k,l){
			t_length++;
			t_tables++;
			if (_.isArray(v)) {
				t_length = t_length + v.length;
			} else {
				for (key in v) {
					if (v.hasOwnProperty(key)) { t_length++; }
				}
			}
		}, this);
		
		use_columns = false;
		if (t_length > 50) {
			use_columns = true;
			var breakpoint = Math.ceil(t_length/2);
		}
		
		var ct = 0;
		
		var o = '<div class="rtable_select">';
		
		if (use_columns) {
			o += '<div class="row">';
			o += '<div class="col-sm-6">';
		}
		
		_.each(this.get('tables'), function(v,k,l){
			
			//most of the time we break in between tables (except single long tables, see below)
			if (use_columns && breakpoint) {
				if (ct >= breakpoint) {
					o += '</div><div class="col-sm-6">';
					breakpoint = false;
				}
			}
			
			if (k !== 'default') {
				o += '<header>'+k.capitalize()+'</header>';
				ct++;
			}
			o += '<ol class="list-unstyled">';

			var tweight1 = 0, tweight0 = 0;
			_.each(v, function(vx,kx,lx){
				tweight0 = tweight1 + 1;
				var weight1 = (typeof vx.weight !== 'undefined') ? vx.weight : 1;
				tweight1 = tweight1 + weight1;
				var num = (tweight0 == tweight1) ? tweight0 : tweight0+'-'+tweight1;
								
				if (_.isArray(lx) && _.isString(vx)) {
					//its an Array of strings
					o += '<li>'+num+'. '+vx.capitalize();
					ct++;
				} else if (_.isString(kx)) {
					
					o += '<li>'+num+'. '+kx.capitalize();
					ct++;
					//vx is an object
					if (typeof vx.description !== 'undefined') {
						o += ' - '+vx.description;
					}
					if (typeof vx.subtable !== 'undefined') {
						if (_.isArray(vx.subtable)){
							o += '<div class="subtable_roll">Roll on: '+vx.subtable.flatten()+'</div>';
						} else if (_.isString(vx.subtable)) {
							o += '<div class="subtable_roll">Roll on: '+vx.subtable.capitalize()+'</div>';
						} else {
							_.each(vx.subtable, function(vz,kv){
								o += '<div class="subtable_roll">Roll '+kv.capitalize()+':<ol class="list-inline">';
								var t2weight0 = 0, t2weight1 = 0;
								_.each(vz, function(q,w,qw){
									t2weight0 = t2weight1 + 1;
									var weight2 = (typeof q.weight !== 'undefined') ? q.weight : 1;
									t2weight1 = t2weight1 + weight2;
									var num2 = (t2weight0 == t2weight1) ? t2weight0 : t2weight0+'-'+t2weight1;
									if (_.isArray(qw) && _.isString(q)) {
										o += '<li>'+num2+'. '+q.capitalize()+'</li>';
									} else if (_.isString(w)) {
										o += '<li>'+num2+'. '+w.capitalize()+'</li>';
									} else {
										o += '<li>'+num2+'. '+q.label.capitalize()+'</li>';
									}
								}, this);
								o += '</ol></div>';								
							}, this);
						}
					}
				} else {
					o += '<li>'+num+'. '+vx.label;
					ct++;
					if (typeof vx.description !== 'undefined') {
						o += ' - '+vx.description;
					}
					
				}
				o += '</li>';
				
				//for single long tables we'll break in the list itself
				if (use_columns && breakpoint && t_tables == 1) {
					if (ct >= breakpoint) {
						o += '</ol></div><div class="col-sm-6"><ol class="list-unstyled">';
						breakpoint = false;
					}
				}
				
			}, this);
			o += '</ol>';
		}, this);
		
		if (use_columns) {
			o += '</div></div>';
		}
		
		o += '</div>';
		return o;		
	},
	
	/**
	 * outputs the json data for the table (import/export)
	 * strips out empty attributes
	 * @returns {String} table attributes in JSON
	 */
	outputCode: function() {
		var att = _.clone(this.attributes);
		_.each(att, function(v,k,l){
			if (_.isEmpty(v)) {
				delete l[k];
			}
		}, this);
		delete att.id;
		return JSON.stringify(att, null, 5);
	},
	
	/**
	 * Show the table options as an array suitable for iteration
	 * @param {String} table the table to list
	 * @returns {Array} array of objects to iterate over, normalized to label...?
	 */
	selectList: function(table) {
		var table = this.get('tables')[table];
		var o = [];
		_.each(table, function(v,k){
			var e = {};
			if (_.isString(k)) {
				e.label = k;
			} else {
				e.label = v.label;
			}
			o.push(e);
		}, this);
		return o;
	},
	
	
	/**
	 * Get an object result in case we only have the label and need other data from it
	 * @param {String} label The item we are looking for
	 * @param {String} [table=default] the table to search
	 * @returns {Object} the object associated with the label
	 */
	 findObject: function(label, table) {
		 if (typeof table == 'undefined') {
			 table = 'default';
		 }
		 var t = this.get('tables')[table];
		 if (typeof t[label] == 'undefined') {
			 return _.findWhere(t, { label: label });
		 }
		 return t[label];
	 },
	 
	 /**
	  * find the result element for a specific table
	  * @param {String} table The table to look for
	  * @returns {Object} result element for specified table (or empty)
	  */
	 findResultElem: function(table) {
	 	if (typeof table == 'undefined' || table == '') {
		 	table = 'default';
	 	}
	 	//console.log(_.findWhere(this.get('result'), { table: table }));
		return _.findWhere(this.get('result'), { table: table });		 
	 }
	
	
});


//!RandomTableShort
var RandomTableShort = Backbone.View.extend(
	/** @lends RandomTableShort.prototype */
	{
	
	model: RandomTable,
	tagName:'tr',
	
	/**
	 * add tags as classes for filtering
	 */
	className: function(){
		var o='tag_all ';
		_.each(this.model.get('tags'), function(v) {
	        o += 'tag_'+v+' ';
        }, this);
        return o;
	},
	
	events: {
		'click .roll': 'roll',
		'click .pick': 'pick',
		'click .info': 'info'
	},
	
	/**
	 * Table row of metdata for RandomTable
	 *
	 * @augments external:Backbone.View
	 * @constructs
	 */
    initialize:function () {
        this.tcells = this.model.shortdisplay;
        this.listenTo(this.model, "change", this.render);
        this.listenTo(this.model, "destroy", this.remove);
    },
     
    render: function () {
		
		$(this.el).empty();
		_.each(this.model.theaders, function(v) {
			if (v == 'actions') {
				$(this.el).append('<td><button title="Info" class="btn btn-default info"><span class="glyphicon glyphicon-info-sign"></span></button> <button title="Pick" class="btn btn-default pick"><span class="glyphicon glyphicon-eye-open"></span></button> <button title="Roll" class="btn btn-default roll"><span class="glyphicon glyphicon-random"></span></button></td>');
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
				$(this.el).append('<td>'+desc+'</td>');
				
				return;	
			}
			$(this.el).append('<td>'+this.model.get(v)+'</td>');
			
		}, this);

        return this;
    },
    
    /**
     * Roll on the table, generate a result, show in a modal
     */
    roll: function() {
    	editv = new RandomTableRoller({ model: this.model });
    	app.showModal('Table Result: '+editv.model.get('title'), editv.render().el);
    },
    
    /**
     * Show all the options in a modal so user can pick(?)
     */
    pick: function() {
	    editv = new RandomTablePicker({ model: this.model });
	    app.showModal('Table Options: '+editv.model.get('title'), editv.render().el, 'modal-lg');		
    },
    
    /**
     * Metadata about the table in a modal
     */
    info: function() {
    	editv = new RandomTableInfo({ model: this.model });
	    app.showModal('Table Info: '+editv.model.get('title'), editv.render().el);		
    },
	
	
});


//!RandomTableInfo
RandomTableInfo = Backbone.View.extend(
	/** @lends RandomTableInfo.prototype */
	{
	
	model: RandomTable,
	tagName:'div',
	
	events: {
		'click .delete': 'delete',
		'click .conf-delete': 'confirmDelete',
		'click .edit': 'edit'
	},
	
	/**
	 * Info modal for RandomTable
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

		var temp = '<dl><dt data-field="title">Title</dt><dd data-field="title"><%= title %></dd><dt data-field="author">Author</dt><dd data-field="author"><% if (author == "") { %>[unknown]<% } else { %><%= author %><% } %></dd><dt data-field="source">Source</dt><dd data-field="source"><% if (source == "") { %>[unknown]<% } else { %><%= source %><% } %></dd><dt>Tags</dt><% _.each(tags, function(v,k,l){ %><dd><%= v %></dd><% }) %><dt data-field="description">Description</dt><dd data-field="description"><%= description %></dd></dl>';
		
		if (typeof data.id !== 'undefined') {
			temp += '<button title="Edit" class="btn btn-default edit"><span class="glyphicon glyphicon-edit"></span></button> <button title="Delete" class="btn btn-default conf-delete"><span class="glyphicon glyphicon-remove"></span></button>';
		}
		
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
		$button.removeClass('conf-delete btn-default').addClass('btn-danger delete');
	},
	
	/**
	 * Edit the user imported table
	 */
	edit: function(e) {
		e.preventDefault();
		
		//close modal
		$('#editmodal').modal('hide');
		
		//trigger import tab
		$('#maintab a[href="#import"]').tab('show');
		
		//load import form with this.model
		app.importer.resetImporter(this.model);
		
	}
	

});


//!RandomTableRoller
RandomTableRoller = Backbone.View.extend(
	/** @lends RandomTableRoller.prototype */
	{
	
	model: RandomTable,
	tagName:'div',
	
	events: {
		'click .reroll': 'reroll',
		'click .rollagain': 'rollagain',
	},
	
	/**
	 * Modal for random table results
	 *
	 * @augments external:Backbone.View
	 * @constructs
	 */
	initialize: function() {
		this.model.generateResult();
		this.num_results = 1;
	},
	
	render: function () {
		this.$el.html(this.template());
        return this;
    },
    
    /**
     * template for individual result
     */
    result_template: function(num) {
	  	  var temp = '<div id="res'+num+'" class="well clearfix"><button type="button" class="btn btn-default reroll pull-right"><span class="glyphicon glyphicon-refresh"></span></button><div class="results"><%= result %></div></div>';	  
	  	  return temp;
    },
    
    /**
     * template for new modal
     */
    template: function() {
    	var data = this.model.attributes;
    	data.result = this.model.niceString();
    	var temp = this.result_template(1);		
		temp += '<div><button type=button class="btn btn-default rollagain">Roll Again</button></div>';
		return _.template(temp, data);
	},
	
	/**
	 * reroll an existing result
	 */
	reroll: function(e) {
		var id = jQuery(e.target).parents('.well').attr('id');
		this.model.generateResult();
		this.$el.find('#'+id+' .results').html(this.model.niceString());
	},
	
	/**
	 * roll another result on this table
	 */
	rollagain: function(e) {
		this.model.generateResult();
		this.num_results++;
		var temp = this.result_template(this.num_results);
		var data = this.model.attributes;
		data.result = this.model.niceString();
		this.$el.find('.well:last').after(_.template(temp, data));
	}

});


//!RandomTablePicker
RandomTablePicker = Backbone.View.extend(
	/** @lends RandomTablePicker.prototype */
	{
	
	model: RandomTable,
	tagName:'div',
	
	/**
	 * A modal for Picking Table options
	 *
	 * @augments external:Backbone.View
	 * @constructs
	 */
	initialize: function() {},
	
	render: function () {
		this.$el.html(this.template(this.model.attributes));
        return this;
    },
    
    template: function(data) {
		//var temp = '';
		//var opts = this.model.niceList();
		return this.model.niceList();
	},

});



//!RTable_Collection
var RTable_Collection = Backbone.Collection.extend(
	/** @lends RTable_Collection.prototype */
	{
	
	model: RandomTable,
	localStorage: new Backbone.LocalStorage("osr-random-generator-table"),
	
	sortAttribute: "title",
	sortDirection: 1,
	
	/**
	 * A collection of RandomTables
	 * Tables are added via appdata.tables (converted to an array of objects in AppRouter)
	 *
	 * @augments external:Backbone.Collection
	 * @constructs
	 */
	initialize: function(){
		
	},
	
	/**
	 * Add a RandomTable to the collection, trigger refresh so view updates
	 * @param {Object} [model] A RandomTable model to add to the collection
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
		this.sortAttribute = attr;
		this.sort();
	},
	
	/**
	 * Comparator function for sorting
	 */
	comparator: function(a, b) {
		var a = a.get(this.sortAttribute),
		b = b.get(this.sortAttribute);
		
		if (a == b) return 0;
		
		//1 is ascending
		if (this.sortDirection == 1) {
			return a > b ? 1 : -1;
		} else {
			return a < b ? 1 : -1;
		}
	},
	
	/**
	 * Return a table from the collection
	 * @Param {String} title which random table to get
	 * @returns {Object} the randomtable model
	 */
	getTable: function(title) {
		if (typeof title == 'undefined' || title == '') {
			return {};
		}
		//console.log(title);
		//console.log(this.findWhere({ key: title }));
		
		var t = this.findWhere({ key: title });
		if (typeof t == 'undefined') {
			t = this.findWhere({ title: title });
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
	getTables: function(tag) {
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
	}
	
});


//!RTable_List
var RTable_List = Backbone.View.extend(
	/** @lends RTable_List.prototype */
	{
	
	model: RTable_Collection,
	
	tagName:'table',
	className: 'table table-striped',
	theaders: ['Title', 'Description', 'Tags', 'Actions'],
	tagFilters: [],
	
	events: {
		'click .tag-filter': 'filter_tag',
		'click .clear-tag-filter': 'clear_filter',
		"click th": "headerClick"
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
     * when a tag filter is clicked in RandomTableShort view
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
			$(this.el).find('caption').empty();
			return;
		}
		
		var caption = 'Viewing tables tagged: ';
		_.each(this.tagFilters, function(v){
			caption += '<span class="badge clear-tag-filter" data-tag="'+v+'">'+v+' <span class="glyphicon glyphicon-remove-circle"></span></span> ';
		}, this);
		caption += ' <a href="" class="clear-tag-filter" data-tag="all"><span class="glyphicon glyphicon-remove-circle"></span></a>';
		
		$(this.el).find('caption').html(caption);  
    },
    
    /**
     * Uses the tag filters to show/hide rows
     */
    filter_rows: function(){
		if (this.tagFilters.length == 0) {
			$('#rtable-list table tr.tag_all').removeClass('hidden');
			return;
		}
				  
		$(this.el).find('tr.tag_all').addClass('hidden');
  		var classes = this.tagFilters.join('.tag_');
  		classes.replace(/\.tag_$/, '');
  		if (classes !== '') { classes = '.tag_'+classes; }
  		$(this.el).find('tr'+classes).removeClass('hidden');		  
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
	},
    
    /**
     * Build/show the table, filter as appropriate (for rerender actions)
     */
    render: function () {
    	$(this.el).empty();
    	$(this.el).append('<caption></caption>');
		$th_row = $('<tr>');
		_.each(this.theaders, function(v) {
			var icon = (this.model.sortAttribute == v.toLowerCase()) ? (this.model.sortDirection == 1) ? 'glyphicon-chevron-up' : 'glyphicon-chevron-down' : '';
			$th_row.append('<th data-column="'+v.toLowerCase()+'">'+v+' <span class="sorter glyphicon '+icon+'"></span></th>');
		}, this);
		$(this.el).append($th_row);
		_.each(this.model.models, function(v,k,l){
			$(this.el).append(new RandomTableShort({model:v}).render().el);
    	}, this);
    	
    	this.filter_rows();
	  	this.filter_caption();

        return this;
    }
	
	
});

