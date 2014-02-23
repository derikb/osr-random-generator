//For handling generic random tables

//!RandomTable model
var RandomTable = Backbone.Model.extend(
	/** @lends RandomTable.prototype */
	{
	
	localStorage: new Backbone.LocalStorage("osr-random-generator-table"),
	
	defaults: function() {
		return {
			title: '',
			author: '[unknown]',
			description: '[undefined]',
			source: '[unknown]',
			tags: [],
			start: '', //where to start rolling
			table: [],
			tables: {}, //subtables
			simple: false, //simple tables only have 1 list to randomize
			result: {},
		}
	},
	
	theaders: ['title', 'description', 'tags', 'actions'],
	
	/**
	 * This is the model for Random Tables.
	 *
	 * @augments external:Backbone.Model
	 * @constructs
	 * @property {String} [title] title of the table
	 * @property {String} [author=[unknown]] author of the table
	 * @property {String} [description=[undefined]] description of the table
	 * @property {String} [source=[unknown]] source of the table
	 * @property {Array} [tags] subject tags
	 * @property {String|Array} [start] tables to roll on. if array it can be an array of strings (table names) or objects (two properties table: the table to roll on and times: the number of times to roll)
	 * @property {Array} [table] default table. array of strings (simple table) or objects (complex table)
	 * @property {Object} [tables] a property for each subtables. if table property is not set then the first propery of this Object is used to start rolling 
	 * @property {Boolean} [start=false] simple or complex table if simple we just roll on the table property
	 * @property {Object} [result] current result
	 */
	initialize: function(){
		
		//take a simple table format and normalize it
		if (_.isEmpty(this.get('tables'))) {
			var tables = {
				"default": this.get('table')
			};			
			this.set('tables', tables);	
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
			//if no start attribute, select first item from tables
			var k = _.keys(this.get('tables'));
			this.set('result', this.selectFromTable(k[0]));
		} else if (typeof start == 'string') {
			this.set('result', this.selectFromTable(start));
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
			this.set('result', result);
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
				o.push({ table: kx, result: result, desc: desc });
				
			}, this);

		}
		
		return o;
	},

	
	/**
	 * Show the results as a string
	 * @todo make this nicer/clearer #23
	 * Alternate: write a template to use in the views?
	 * @returns {String} the results
	 */
	niceString: function() {
		var r = this.get('result');
		if (r == '') { return ''; }
		//console.log(r);
		if (_.isString(r)) { return r; }
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
	 * @todo make this work for complex listing #24
	 * @returns {Array} the options for iterating in a list
	 */
	niceList: function() {
		
		if (this.get('simple') === true) {
			var options = [];
			_.each(this.get('table'), function (v,k,l) {
				if (typeof v == 'string') {
					options.push(v);
				} else {
					options.push(v.label);
				}
			}, this);
			return options;
		}
		
		
		/** @todo complex listing #24 */
		return ['Sorry, haven\'t figured out how to best list these complex (sub)tables yet.'];
		
	}
	
});


//!RandomTableShort - table row of metadata on the random table for display/filtering/actions
var RandomTableShort = Backbone.View.extend({
	
	model: RandomTable,
	tagName:'tr',
	
	//add tags as classes for filtering
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
		'click .info': 'info',
		'click .tag-filter': 'filter_tag'
	},
 
    initialize:function () {
        this.tcells = this.model.shortdisplay;
    },
     
    render: function () {
		
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
				$(this.el).append('<td>'+this.model.get(v)+'<br/>Source: '+this.model.get('source')+'</td>');
				
				return;	
			}
			$(this.el).append('<td>'+this.model.get(v)+'</td>');
			
		}, this);

        return this;
    },
    
    //Roll on the table, generate a result, show in a modal
    roll: function() {
    	editv = new RandomTableRoller({ model: this.model });
    	app.showModal('Table Result: '+editv.model.get('title'), editv.render().el);
    },
    
    //Show all the options in a modal so user can pick(?)
    pick: function() {
	    editv = new RandomTablePicker({ model: this.model });
	    app.showModal('Table Options: '+editv.model.get('title'), editv.render().el);		
    },
    
    //Metadata about the table in a modal
    info: function() {
    	editv = new RandomTableInfo({ model: this.model });
	    app.showModal('Table Info: '+editv.model.get('title'), editv.render().el);		
    },
	
	//only show the tables with the clicked tag
	//an event is also triggered in RTable_List
	filter_tag: function(e) {
		e.preventDefault();
		var tag = $(e.target).data('tag');
		if (tag == '') { tag = 'all'; }
		$('#rtable-list table tr.tag_all').addClass('hidden');
		$('#rtable-list table tr.tag_'+tag).removeClass('hidden');
	}
	
});


//!RandomTableInfo info modal data
RandomTableInfo = Backbone.View.extend({
	
	model: RandomTable,
	tagName:'div',
	
	render: function () {
		this.$el.html(this.template(this.model.attributes));
        return this;
    },
    
    template: function(data) {
		var temp = '<dl><dt data-field="title">Title</dt><dd data-field="title"><%= title %></dd><dt data-field="author">Author</dt><dd data-field="author"><%= author %></dd><dt data-field="source">Source</dt><dd data-field="source"><%= source %></dd><dt>Tags</dt><% _.each(tags, function(v,k,l){ %><dd><%= v %></dd><% }) %><dt data-field="description">Description</dt><dd data-field="description"><%= description %></dd></dl>';	
		return _.template(temp, data);
	},

});


//!RandomTableRoller - roll on the table, display in a modal
RandomTableRoller = Backbone.View.extend({
	
	model: RandomTable,
	tagName:'div',
	
	events: {
		'click .reroll': 'reroll',
		'click .rollagain': 'rollagain',
	},
	
	initialize: function() {
		this.model.generateResult();
		this.num_results = 1;
	},
	
	render: function () {
		this.$el.html(this.template());
        return this;
    },
    
    //template for individual result
    result_template: function(num) {
	  	  var temp = '<div id="res'+num+'" class="well clearfix"><button type="button" class="btn btn-default reroll pull-right"><span class="glyphicon glyphicon-refresh"></span></button><div class="results"><%= result %></div></div>';	  
	  	  return temp;
    },
    
    //template for new modal
    template: function() {
    	var data = this.model.attributes;
    	data.result = this.model.niceString();
    	var temp = this.result_template(1);		
		temp += '<div><button type=button class="btn btn-default rollagain">Roll Again</button></div>';
		return _.template(temp, data);
	},
	
	//reroll an existing result
	reroll: function(e) {
		var id = jQuery(e.target).parents('.well').attr('id');
		this.model.generateResult();
		this.$el.find('#'+id+' .results').html(this.model.niceString());
	},
	
	//roll another result on this table
	//add it to the modal
	rollagain: function(e) {
		this.model.generateResult();
		this.num_results++;
		var temp = this.result_template(this.num_results);
		var data = this.model.attributes;
		data.result = this.model.niceString();
		this.$el.find('.well:last').after(_.template(temp, data));
	}

});


//!RandomTablePicker - show table options
RandomTablePicker = Backbone.View.extend({
	
	model: RandomTable,
	tagName:'div',
	
	render: function () {
		this.$el.html(this.template(this.model.attributes));
        return this;
    },
    
    template: function(data) {
		var temp = '';
		var opts = this.model.niceList();
		//console.log(opts);
		data.opts = opts;
		if (data.simple == true) {
			temp = '<ol><% _.each(opts, function(v,k,l){ %><li><%= v %></li><% }) %></ol>';
		} else {
			temp = '<ol><% _.each(opts, function(v,k,l){ %><li><%= v %></li><% }) %></ol>';
		}		
		return _.template(temp, data);
	},

});



//!RTable_Collection collection of all RandomTable models
/*
	Tables are added via appdata.tables (converted to an array of objects in AppRouter)
*/
// doesn't really do anything, yet?
var RTable_Collection = Backbone.Collection.extend({
	
	model: RandomTable,

	initialize: function(){

	},
	
});


//!RTable_List Table display of the RTable_Collection
var RTable_List = Backbone.View.extend({
	
	model: RTable_Collection,
	
	tagName:'table',
	className: 'table table-striped',
	theaders: ['Title', 'Description', 'Tags', 'Actions'],
	
	events: {
		'click .tag-filter': 'filter_tag',
		'click .clear-tag-filter': 'clear_filter'
	},
	
    initialize:function () {

    },
    
    //when a filter is clicked in RandomTableShort view
    //update the table caption
    filter_tag: function(e) {
	  	e.preventDefault();
	  	var tag = $(e.target).data('tag');

	  	if (tag == 'all') {
		  	var caption = '';
		  	$('#rtable-list table tr.tag_all').removeClass('hidden');
	  	} else {
		  	var caption = 'Viewing tables tagged: <span class="badge">'+tag+'</span> <a href="" class="clear-tag-filter" data-tag="all"><span class="glyphicon glyphicon-remove-circle"></span></a>';
	  	}
	  	
	  	$(this.el).find('caption').html(caption);
    },
    
    //clear the filter, show all tables, remove caption
    clear_filter: function(e) {
	    e.preventDefault();
	  	var tag = $(e.target).parent().data('tag');
	  	var caption = '';
		$('#rtable-list table tr.tag_all').removeClass('hidden');
		$(this.el).find('caption').html(caption);
    },
    
    render: function () {
    	$(this.el).append('<caption></caption>');
		$th_row = $('<tr>');
		_.each(this.theaders, function(v) {
			$th_row.append('<th>'+v+'</th>');
		});
		$(this.el).append($th_row);
		_.each(this.model.models, function(v,k,l){
			$(this.el).append(new RandomTableShort({model:v}).render().el);
    	}, this);

		/** @todo after render we could work in DataTables for sorting? #25 */
        return this;
    }
	
	
});

