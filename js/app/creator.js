//Table Creation models and views

//!Creator
var Creator = Backbone.Model.extend(
/** @lends Creator.prototype */
{
			
	/**
	 * This is the model for Creating tables.
	 *
	 * @augments external:Backbone.Model
	 * @constructs
	 */
	initialize: function(){
		
		this.form = new CreatorForm();
		$('#rtable-form').append(this.form.render().el);
		
		this.listenTo(this.form, 'resetform', this.resetCreator);
		
	},
	
	/**
	 * Reset the ImportForm view and Preview. Re-establish listener
	 *
	 */
	resetCreator: function(model) {
		this.form.remove();
		
		if (typeof model !== 'undefined') {
			this.form = new CreatorForm({ model: model});
		} else {
			this.form = new CreatorForm();
		}
		
		$('#rtable-form').html(this.form.render().el);
		this.listenTo(this.form, 'resetform', this.resetCreator);
	}
	
});


//!CreatorForm
var CreatorForm = Backbone.View.extend(
/** @lends CreatorForm.prototype */
{
	
	model: RandomTable,
	tagName: 'form',
	mode: 'guided', //can also be 'freeform'
	
    events:{
        "submit": "previewTable",
        "click .save": "saveTable",
        "click .cancel": "cancel",
        "click .addtable": "addSubtableForm",
        "click .create-help": "helpModal",
        "change input": "disableSave",
        "change textarea": "disableSave",
        "click #create_mode a": "switchMode",
        "change #tabledata_format": "switchFormat"
    },
	
	/**
	 * This is the view for a Random Table creation form.
	 * In an edit operation this will be passed a RandomTable to be edited
	 *
	 * @augments external:Backbone.View
	 * @constructs
	 */
    initialize:function () {
    	if (typeof arguments[0] == 'undefined' || typeof arguments[0].model == 'undefined') {
       		this.model = new RandomTable();
       		this.edit = false;
       	} else {
	       	this.edit = true;
       	}
  
        $('#rtable-preview table').find('tr:first').replaceWith(new RandomTableShort({model:this.model}).render().el);
        $('#rtable-preview pre').replaceWith(new CreatePreview({model:this.model}).render().el);
        
        this.listenTo(this.model, 'invalid', this.markErrors);
        this.listenTo(this.model, 'sync', this.afterSave);
    },
    
    /**
     *
     *
     */
    switchMode: function(e) {
		e.preventDefault();
		$link = $(e.currentTarget);
		mode = $(e.currentTarget).attr('data-mode');
		if (this.mode == mode) { return; }
		
		$('#create_mode li').removeClass('active');
		
		$link.parent().addClass('active');
		this.mode = mode;
		
		if (this.mode == 'freeform') {
			t = this.freeTemplate();
		} else {
			t = this.guidedTemplate();
		} 
		
		$('#create_fields').html(t);
		
    },
    
    /**
     * Make the form
     */
    render: function () {
    	var form = '';
    	
    	form += '<button type="button" class="btn btn-info create-help pull-right">Formatting Help</button>';
    	
    	form += '<ul id="create_mode" class="nav nav-pills"><li class="active"><a href="#" data-mode="guided">Guided</a></li><li><a href="#" data-mode="freeform">Freeform</a></li></ul><hr/>';
    	
    	form += '<div id="create_messages"></div>';
 		
 		form += '<div id="create_fields">';
 		
		if (this.mode == 'freeform') {
			form += this.freeTemplate();
		} else {
			form += this.guidedTemplate();
		}
		
		form += '</div>';
				
		form += '<div class="row"><div class="col-xs-8"><button type="submit" class="btn btn-primary">Preview</button> <button class="btn btn-success save" type="button" disabled>Save</button></div><div class="col-xs-4 text-right"><button type=button class="btn btn-default cancel">Cancel</button></div></div><hr/>';
    
    	$(this.el).html(form);
        return this;
    },
	
	/**
	 * for free form editing (i.e. a big textarea for JSON)
	 * @returns {String} form fields
	 */
	freeTemplate: function() {
		var f = '';
								
		f += '<p class="alert alert-info">Once you have edited a table in this mode it is not recommended to switch back to guided mode, as some data may be lost.</p>';
		
		f += '<div id="freeform_error" class="alert alert-danger hidden"></div>';

		f += '<div class="form-group"><label for="tabledata" class="control-label">Table Data</label><textarea class="form-control textarea-tall" name="tabledata" id="tabledata">'+this.model.outputCode(true)+'</textarea></div>';
		
		
		return f;
	},
	
	/**
	 * for guided editing (i.e. a many fields, simpler syntax)
	 * @returns {String} form fields
	 */
	guidedTemplate: function() {
		var f = '';
		
		//simple edit mode
		if (this.edit) {
			
			d = _.clone(this.model.get('tables'));
			if (d.default) {
				tabledata = this.parseTableObject(d.default);
				tabledata_hd = 'default';
				delete d.default;
			} else {
				var k = _.keys(d);
				tabledata_hd = k[0];
				tabledata = this.parseTableObject(d[k[0]]);
				delete d[k[0]];
			}
			
		} else {
			tabledata_hd = '';
			tabledata = '';
		}

		this.subt = 0;
		
		f += '<fieldset><legend>(Sub)Table Data</legend>';
		
		f += '<div class="row">';
		f += '<div class="form-group col-sm-6"><label for="tabledata_hd" class="control-label">Default Table Name</label><input type=text class="form-control" name="tabledata_hd" id="tabledata_hd" value="'+tabledata_hd+'" placeholder="default" /></div>';
				
		f += '<div class="form-group col-sm-6"><label for="tabledata_format" class="control-label">Format of Table Data</label><select name="tabledata_format" id="tabledata_format" class="form-control"><option value="text">Plain text</option><option value="html">HTML</option><option value="bookmarklet">Bookmarklet</option></select></div>';
		
		f += '</div>';
		
		f += '<div class="form-group"><label for="tabledata" class="control-label">Default Table Data</label><textarea class="form-control" name="tabledata" id="tabledata" rows=6>'+tabledata+'</textarea><div class="help-block">By default this table is rolled on first.</div></div>';

		
		if (this.edit){
			
			_.each(d, function(v,k,l){
				f += this.subtableForm(this.parseTableObject(v), k);
			}, this);
		}
		
		f += '<div class="form-group"><button class="btn btn-default addtable" type="button">Add a Subtable</button></div>';
		
		f += '</fieldset>';
		
		f += '<fieldset><legend>Metadata</legend>';
		
		f += '<div class="row">';
		f += '<div class="col-md-6"><div class="form-group"><label for="title" class="control-label">Title</label><input type="text" class="form-control" name="title" id="title" value="'+this.model.get('title')+'" /></div></div>';
		f += '<div class="col-md-6"><div class="form-group"><label for="author" class="control-label">Author</label><input type="text" class="form-control" name="author" id="author" value="'+this.model.get('author')+'" /></div></div>';
		f += '</div>';
		
		var tags = this.model.get('tags').join('; ');
		
		f += '<div class="row">';
		f += '<div class="col-md-6"><div class="form-group"><label for="tags" class="control-label">Tags</label><input type="text" class="form-control" name="tags" id="tags" value="'+tags+'" /><div class="help-block">Separate tags with semi-colons.</div></div></div>';
		f += '<div class="col-md-6"><div class="form-group"><label for="source" class="control-label">Source</label><input type="text" class="form-control" name="source" id="source" value="'+this.model.get('source')+'" /></div></div>';
		f += '</div>';
		
		f += '<div class="form-group"><label for="description" class="control-label">Description</label><input type="text" class="form-control" name="description" id="description" value="'+this.model.get('description')+'" /></div>';
		
		f += '</fieldset>';
		
		return f;
	},
	
	/**
	 * action for add subtable button
	 *
	 */
	addSubtableForm: function(e){
		$button = $(e.currentTarget);
		var form = this.subtableForm();
		$(form).insertBefore($button.parent('div.form-group'));
	},
	
	
	/**
	 *	returns a subtable empty or filled
	 * @param {String} [table] the subtable data
	 * @param {String} [title] the subtable title
	 * @returns {String} the form fields
	 */
	subtableForm: function(table, title) {
		if (typeof table == 'undefined') {
			table = '';
		}
		if (typeof title == 'undefined') {
			title = '';
		}
		this.subt++;
		var f = '';
		
		f += '<div class="row">';
		
		f += '<div class="form-group col-sm-6"><label for="subt_t'+this.subt+'" class="control-label">Subtable '+this.subt+' Name</label><input type=text class="form-control"name="subt_t'+this.subt+'" id="subt_t'+this.subt+'" value="'+title+'"   placeholder="subtable'+this.subt+'"  /></div>';
		
		f += '<div class="form-group col-sm-6"><label for="subt_f'+this.subt+'" class="control-label">Format of Subtable Data</label><select name="subt_f'+this.subt+'" id="subt_f'+this.subt+'" class="form-control"><option value="text">Plain text</option><option value="html">HTML</option><option value="bookmarklet">Bookmarklet</option></select></div>';
		
		f += '</div>';
		
		f += '<div class="form-group"><label for="subt'+this.subt+'" class="control-label">Subtable '+this.subt+' Data</label><textarea class="form-control" name="subt'+this.subt+'" id="subt'+this.subt+'" rows=6>'+table+'</textarea><div class="help-block">Reference this subtable in other (sub)tables via it\'s title.</div></div>';
		
		return f;
	},
	
	/**
     * Change some stuff when tabledata format is altered
     * right now just remove subtable option with bookmarklets
     */
	switchFormat: function(e) {
		format = $(e.currentTarget).val();
		//console.log(format);
		
		if (format == 'bookmarklet') {
			$('.addtable').addClass('hidden');
		} else {
			$('.addtable').removeClass('hidden');
		}
	},
	
    /**
     * Process the form data and preview
     * @todo A json validator I could run in app to highlight the error point would be cool
     */
	previewTable: function(e) {
		e.preventDefault();
		
		if (this.mode == 'freeform') {
			$('#freeform_error').addClass('hidden').html('');
			try {
				data = JSON.parse($('#tabledata').val());
			} catch (e) {
				//console.error("Parsing error:", e);
				$('#freeform_error').html('<p>Invalid JSON: '+e+'</p><p>Usually that means you either:</p><ul><li>Didn\'t add a backslah before a double-quote.</li><li>Didn\'t put a comma after a quoted value.</li><li>Didn\'t properly close a double-quote, bracket, or brace.</li><li>Have a comma after the last entry in a list.</li></ul><p>If the error is an "Unexpected token" then the letter after that message is the point in the data where something went wrong. Sorry, at this point that\'s the best I can tell you. You can always paste the data into <a href="http://jsonlint.com/">JSONLint</a> to get specifics.</p>').removeClass('hidden');
				return;
			}
			
		} else {
		
	    	var data = $(e.target).serializeObject();
	    	//console.log(data);
	    	_.each(data, function(v,k,l){
	    		l[k] = v.trim();
	    	}, this);
	    	data.tags = data.tags.replace(/;*\s*$/, '');
			data.tags = data.tags.split(/;\s*/g);
			if (data.tags[0] == '') {
				delete data.tags;
			}
			
	
			if (data.tabledata_format == 'html'){
				data.tabledata = this.parseTableHTML(data.tabledata);
			} else if (data.tabledata_format == 'bookmarklet'){
				data.tabledata = this.parseBookmarklet(data.tabledata);
				//set up to roll on all the tables
				data.sequence = [];
				_.each(data.tabledata, function(v,k,l){
					data.sequence.push(k);
				}, this);
				
			} else {
				data.tabledata = this.parseTableText(data.tabledata);
			}
			if (data.tabledata_hd == '') {
				data.tabledata_hd = 'default';
			}
			
			if (data.tabledata_format == 'bookmarklet') {
				data.tables = data.tabledata;
			} else {
				data.tables = {};
				data.tables[data.tabledata_hd] = data.tabledata;
			}
			delete data.tabledata;
			delete data.tabledata_hd;
			delete data.tabledata_format
			
			for(var i=1; i<=this.subt; i++ ) {
			
				if (data['subt'+i]) {
					if (data['subt'+1] !== '') {
						if (data['subt_f'+i] == 'html'){
							d = this.parseTableHTML(data['subt'+i]);
						} else if (data['subt_f'+i] == 'bookmarklet') {
						
						} else {
							d = this.parseTableText(data['subt'+i]);
						}
						t = (data['subt_t'+i] == '') ? 'subtable'+i : data['subt_t'+i];
						data.tables[t] = d; 
					}
					delete data['subt'+i];
					delete data['subt_t'+i];
					delete data['subt_f'+i];
				}
			}
		
		} //end mode switch
		
		//console.log(data);
		this.model.set(data);
		this.model.normalize();
		
		this.enableSave();
		document.getElementById('rtable-preview').scrollIntoView(true);
	},
	
	/**
	 * parse text from the textarea into table rows
	 * @param {String} text input from a textarea
	 * @returns {Object} parsed table data
	 */
	parseTableText: function(text) {
		//split it into an array of lines
		text = text.split(/[\n\r]+/g);

		var ct = 0; //the cumulative 'die' count we'll use to calculate the weight
		_.each(text, function(v,k,l){
			v = v.trim();
			
			//parse numbers off front and subtables off back
			//var parse = v.match(/^(?:([0-9]+)(?:##|\.\s?|:\s?))?(.+?)(?:##(.+))?$/);
			var parse = v.match(/^(?:(?:[0-9]+\-)?([0-9]+)(##)?(?:\.\s*|:\s*|,\s*|\t+|\s*))?(.+?)(?:##(.+))?$/);
			
			if (parse) {
				//console.log(parse);
				l[k] = { "label": parse[3].trim() };
				
				if (typeof parse[1] !== 'undefined') {
					if (typeof parse[2] == 'undefined') {
						var weight = parseFloat(parse[1]) - ct;
						//console.log(weight);
						if (weight < 1) { weight = 1; }
						ct = ct + weight;
					} else {
						weight = parseFloat(parse[1]);
					}
					if (weight > 1) {
						l[k].weight = weight;
					}
				} else {
					ct++;
				}
				
				if (typeof parse[4] !== 'undefined') {
					l[k].subtable = parse[4].trim();
				}
			} else {
				delete l[k];
			}
		}, this);		
		return text;
	},
	
	
	/**
	 * parse html from the textarea into randomtable rows
	 * @param {String} html input from a textarea
	 * @returns {Object} parsed table data
	 */	
	parseTableHTML: function(html) {
		html = html.replace(/[\n\r]+/g, ''); //strip linebreaks cause we'll be making new ones based on the tags
		
		//add line breaks for specific end tags li tr p br
		html = html.replace(/\<\/(p|tr|li|div)\>|<\/?br\/?>/g, '\n');
		
		html = html.replace(/\<\/?[^\>]+\>/g, '').replace(/[\n\r]+$/, '');
		
		//console.log(html);
		text = html.split(/[\n\r]+/g);
		//console.log(text);
		
		var ct = 0;
		_.each(text, function(v,k,l){
			v = v.trim(); //trim spaces from ends
			
			var parse = v.match(/^(?:(?:[0-9]+\-)?([0-9]+)(##)?(?:\.\s*|:\s*|,\s*|\t+|\s*))?(.+?)(?:##(.+))?$/);
			
			if (parse) {
				l[k] = { "label": parse[3].trim() };
				
				if (typeof parse[1] !== 'undefined') {
					if (typeof parse[2] == 'undefined') {
						var weight = parseFloat(parse[1]) - ct;
						if (weight < 1) { weight = 1; }
						ct = ct + weight;
					} else {
						weight = parseFloat(parse[1]);
					}
					if (weight > 1) {
						l[k].weight = weight;
					}
				} else {
					ct++;
				}
				
				if (typeof parse[4] !== 'undefined') {
					l[k].subtable = parse[4].trim();
				}
			} else {
				delete l[k];
			}
		}, this);		
		return text;
			
	},
	
	
	/**
	 * Take a table object and convert it for use in the table edit textarea
	 * @param {Object} table the table object
	 * @returns {String} object converted to string for textarea
	 */
	parseTableObject: function(table) {
		if (typeof table == 'undefined' || typeof table == 'string') { return ''; }
		var string = '';
		var t = _.map(table, function(v,k,l){
			if(_.isString(v)){ return v; } //must be an array of string
			var s = '';
			if (v.weight && v.weight > 1) {
				s += v.weight+'##';
			}
			s += v.label;
			if (v.subtable && v.subtable !== '') {
				s += '##'+v.subtable;
			}
			return s;
		}, this);
		
		//console.log(t);
		
		return t.join('\n');
	},
	
	/**
	 * Parsing bookmarklets as made from: http://www.lastgaspgrimoire.com/generators/the-seventh-order-of-the-random-generator/
	 * @param {String} orig_text the bookmarklet itself
	 */
	parseBookmarklet: function(orig_text) {
		if (typeof orig_text == 'undefined' || _.isEmpty(orig_text)) { return []; }
		//remove the immediate anonymous function call and the alert function
		text = orig_text.replace(/^javascript:\(function\(\)\{/, '').replace(/\s\}\)\(\);$/, '').replace(/alert\((.+?)\);$/, '');
		//eval it into local scope so we can access the variables
		eval(text);
		//console.log(blob);
		
		//Grab the data and headers and put them into a form we can use
		var tabledata = {};
		if (typeof blob !== 'undefined') {
			_.each(blob, function(x,k,l){
				var tablename = '';
				if (typeof blobheading !== 'undefined' && _.isArray(blobheading)) {
					if (blobheading[k] && blobheading[k][0] !== '') {
						tablename = blobheading[k][0];
					}
				}
				if (tablename == '') {
					if (k == 0) { tablename = 'default'; }
					else { tablename = 'subtable'+k; }
				}
				x = _.filter(x, function(st){ return st !== ''; });
				var ct = 0; //the cumulative 'die' count we'll use to calculate the weight
				_.each(x, function(v,k,l){
					var parse = v.match(/^(?:(?:[0-9]+\-)?([0-9]+)(##)?(?:\.\s*|:\s*|,\s*|\t+|\s*))?(.+?)(?:##(.+))?$/);
					if (parse) {
						//console.log(parse);
						l[k] = { "label": parse[3].trim() };
						
						if (typeof parse[1] !== 'undefined') {
							if (typeof parse[2] == 'undefined') {
								var weight = parseFloat(parse[1]) - ct;
								//console.log(weight);
								if (weight < 1) { weight = 1; }
								ct = ct + weight;
							} else {
								weight = parseFloat(parse[1]);
							}
							if (weight > 1) {
								l[k].weight = weight;
							}
						} else {
							ct++;
						}
						
						if (typeof parse[4] !== 'undefined') {
							l[k].subtable = parse[4].trim();
						}
					} else {
						delete l[k];
					}
					
				}, this);
				
				//v = _.filter(v, function(st){ return st !== ''; });
				tabledata[tablename] = x;				
			}, this);
			
		}
		//console.log(tabledata);
		return tabledata;
	},
	
	/**
	 * Save action
	 * via events this hooks into validation, error reporting, and the form reset
	 */
	saveTable: function(e) {
			
		if (this.model.isNew()) {
			this.model.set('appv', app.version); //set the appversion it was created in
			if(this.model.save()) {
				//apps new table to collection, which triggers refresh on collection/view
				app.rtables.import(this.model);
			}
		} else {
			this.model.save();
		}

	},
	
	/**
	 * called on successful model save/sync
	 * resets form/page
	 */
	afterSave: function(){
		document.getElementById('rtable-form').scrollIntoView(true);
		this.trigger('resetform');
	},
	
	/**
	 * cancel any add/edit and reset (triggered via Importer )
	 */
	cancel: function(e) {
		document.getElementById('rtable-form').scrollIntoView(true);
		this.trigger('resetform');
	},
	
	/**
	 * called when validation fails (at save), creates an alert with error info
	 * @todo make this highlight specific fields with messages
	 * @param {Object} model the current model
	 * @param {Object} error the error object send from the model's validation method
	 */
	markErrors: function(model, error) {		
		$('#create_messages').html(app.showAlert(error.general, { atype: 'danger' }));
		document.getElementById('rtable-form').scrollIntoView(true);
	},
	
	/**
	 * opens a modal with table import help.
	 */
	helpModal: function() {
		var body = '';
		if (this.mode == 'guided') {

			var title = 'Guided Table Creation';
			body += '<p>Using the guided form on the "Create Tables" page is the easiest way to add and edit random tables.</p><p>Each table or subtable has a title (if you don\'t provide one the default values will be used).</p><p>Table data should be formatted as:</p><ul><li>One result entry per line.</li><li><em class="text-info">(optional)</em> To weight a random chance you have two options:<ul><li>For a die-like format, prefix the entry with a number or a number range and a space(s), comma, period, or colon: <code>1: first</code> <code>2-3. second</code> <code>4-6, third</code>.</li><li>To directly weight the chances, prefix with a number followed by two pound signs: <code>2##This entry will be twice as likely</code> <code>4##This entry is four times as likely</code>.</li></ul></li><li><em class="text-info">(optional)</em> You can cause a roll on a subtable if the result is selected by adding two pounds signs and the title of a table to the end of a line: <code>Bandits##bandit_types</code> where "bandit_types" is the title of a subtable.</li><li><em class="text-info">(optional)</em> You can insert tokens into the results to perform actions like generating numbers or rolling on other random tables. For instance:<ul><li>Roll a number: <code>{{roll:3d6+1}}</code> in the results will generate a new random number every time that result comes up. The section after the semi-colon should accept any form of <code>[A Number or Blank]d[Another number][An arithmatic operator: +, -, *, or /][Another number]</code> such as <code>{{roll:d6}}</code> <code>{{roll:d6*2}}</code> <code>{{roll:2d10+10}}</code>.</li><li>Select from a table: <code>{{table:color}}</code> will randomly select a color. You can reference any other table in the app, but I still need to improve the table references (how to reference them and where to find those names).</li></ul></li></ul><p>Alternately, you can paste in HTML (select the "html" format option). In this case tags will be stripped and line breaks will be added at the end of list item <code>&lt;li&gt;</code>, table rows <code>&lt;tr&gt;</code>, div <code>&lt;div&gt;</code>, br <code>&lt;br&gt;</code>, and paragraph tags <code>&lt;p&gt;</code> (that should cover most of what people would use).</p><p>You can also convert bookmarklets from <a href="http://www.lastgaspgrimoire.com/generators/choose-your-own-generator/">Last Gasp Grimoire\'s Choose your own generator</a>. Just paste the bookmarklet text into the table data field and select "bookmarklet" from the format dropdown.</p><p><em>That\'s all you really need to know. But if you want more options, use the freeform mode.</em></p>';
		} else if (this.mode == 'freeform') {
			var title = 'Freeform Table Creation';
			body += '<p>Freeform mode only accepts valid JSON in the input field, so it is more complicated than Guided mode. But, in exchange, you have much greater control over the table options and data. Learn about formatting and table options: <a href="https://github.com/derikb/osr-random-generator/blob/master/tableformat.md">https://github.com/derikb/osr-random-generator/blob/master/tableformat.md</a></p>';
			
		}
		
		app.showModal({ title: title, body: body });		
	},
	
	
	/**
	 * Disable save button on change in form fields. so you can't save without previewing the changes.
	 */
	disableSave: function(e) {
		$(this.el).find('.save').attr('disabled', true);
	},
	/**
	 * Disable save button on change in form fields. so you can't save without previewing the changes.
	 */ 
	enableSave: function(e) {
		$(this.el).find('.save').attr('disabled', false);
	}
	
});

//!CreatePreview
var CreatePreview = Backbone.View.extend(
/** @lends CreatePreview.prototype */
{
	
	model: RandomTable,
	tagName: 'pre',
	id: 'create_preview',
	events:{
        "click": "selectCode",
    },
	
	/**
	 * This is the view for a Random Table create code preview
	 *
	 * @augments external:Backbone.View
	 * @constructs
	 */
    initialize:function () {
       	this.render();
        this.listenTo(this.model, 'change', this.render);
    },
    
    render: function () {
    	var html = this.model.outputCode();    
    	$(this.el).html(html);
        return this;
    },
    
    selectCode: function() {
	    selection = window.getSelection();        
        range = document.createRange();
        range.selectNodeContents( $(this.el)[0] );
        selection.removeAllRanges();
        selection.addRange(range);
	    
    }
	
	
});
