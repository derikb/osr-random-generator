//Importer models and views


var Importer = Backbone.Model.extend(
/** @lends Importer.prototype */
{
			
	/**
	 * This is the model for Importing tables.
	 *
	 * @augments external:Backbone.Model
	 * @constructs
	 */
	initialize: function(){
		
		this.form = new ImportForm();
		$('#import-form').append(this.form.render().el);
		
		this.listenTo(this.form, 'resetform', this.resetImporter);
		
	},
	
	/**
	 * Reset the ImportForm view and Preview. Re-establish listener
	 *
	 */
	resetImporter: function(model) {
		this.form.remove();
		
		if (typeof model !== 'undefined') {
			this.form = new ImportForm({ model: model});
		} else {
			this.form = new ImportForm();
		}
		
		$('#import-form').html(this.form.render().el);
		this.listenTo(this.form, 'resetform', this.resetImporter);
	}
	
});



var ImportForm = Backbone.View.extend(
/** @lends ImportForm.prototype */
{
	
	model: RandomTable,
	tagName: 'form',
	mode: 'guided', //can also be 'freeform'
	
    events:{
        "submit": "previewTable",
        "click .save": "saveTable",
        "click .cancel": "cancel",
        "click .addtable": "addSubtableForm",
        "click .import-help": "helpModal",
        "change input": "disableSave",
        "change textarea": "disableSave",
        "click #import_mode a": "switchMode"
    },
	
	/**
	 * This is the view for a Random Table import form.
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
  
        $('#import-preview table').find('tr:first').replaceWith(new RandomTableShort({model:this.model}).render().el);
        $('#import-preview pre').replaceWith(new ImportPreview({model:this.model}).render().el);
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
		
		$('#import_mode li').removeClass('active');
		
		$link.parent().addClass('active');
		this.mode = mode;
		
		if (this.mode == 'freeform') {
			t = this.freeTemplate();
		} else {
			t = this.guidedTemplate();
		} 
		
		$('#import_fields').html(t);
		
    },
    
    /**
     * Make the form
     * @todo edit this to handle editing tables. #26
     */
    render: function () {
    	var form = '';
    	
    	form += '<button type="button" class="btn btn-info import-help pull-right">Import Help</button>';
    	
    	form += '<ul id="import_mode" class="nav nav-pills"><li class="active"><a href="#" data-mode="guided">Guided</a></li><li><a href="#" data-mode="freeform">Freeform</a></li></ul><hr/>';
 		
 		form += '<div id="import_fields">';
 		
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
								
		f += '<p>Freeform mode only accepts valid JSON in the input below, so it is more complicated than Guided mode. But, in exchange you have much greater control over the table options and data. Learn about formatting and table options.</p>';
		
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
		
		f += '<div class="form-group"><label for="format_html" class="check"><input type="checkbox" name="format_html" id="format_html" value="1"/> Table data is in HTML format.</label><div class="help-block">Tags will be stripped and line breaks will be added at the end of list item, table rows, div, br, and paragraph tags (that should cover most of what people would use).</div></div>';
		
		f += '<div class="form-group"><label for="tabledata_hd" class="control-label">Table Name</label><input type=text class="form-control"name="tabledata_hd" id="tabledata_hd" value="'+tabledata_hd+'" placeholder="default" /><div class="help-block">Short and without spaces is best.</div></div>';
		f += '<div class="form-group"><label for="tabledata" class="control-label">Table Data</label><textarea class="form-control" name="tabledata" id="tabledata">'+tabledata+'</textarea><div class="help-block">Import formats.</div></div>';
		
		if (this.edit){
			
			_.each(d, function(v,k,l){
				f += this.subtableForm(this.parseTableObject(v), k);
			}, this);
		}
		
		f += '<div class="form-group"><button class="btn btn-default addtable" type="button">Add a Subtable</button></div>';
		
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
		
		f += '<div class="form-group"><label for="subt_t'+this.subt+'" class="control-label">Subtable '+this.subt+' Name</label><input type=text class="form-control"name="subt_t'+this.subt+'" id="subt_t'+this.subt+'" value="'+title+'"   placeholder="subtable'+this.subt+'"  /><div class="help-block">Short and without spaces is best.</div></div>';
		f += '<div class="form-group"><label for="subt'+this.subt+'" class="control-label">Subtable '+this.subt+' Data</label><textarea class="form-control" name="subt'+this.subt+'" id="subt'+this.subt+'">'+table+'</textarea><div class="help-block">Import formats.</div></div>';
		
		return f;
	},
	
    /**
     * Process the form data and preview
     * @todo A json validator I could run in app to highlight the error point would be cool
     * @todo edit this to handle json data. #26
     */
	previewTable: function(e) {
		e.preventDefault();
		
		if (this.mode == 'freeform') {
			$('#freeform_error').addClass('hidden').html('');
			try {
				data = JSON.parse($('#tabledata').val());
			} catch (e) {
				//console.error("Parsing error:", e);
				$('#freeform_error').html('<p>Invalid JSON: '+e+'</p><p>Usually that means you either:</p><ul><li>Didn\'t add a backslah before a double-quote.</li><li>Didn\'t put a comma after a quoted value.</li><li>Didn\'t properly close a double-quote, bracket, or brace.</li></ul><p>If the error is an "Unexpected token" then the letter after that message is the point in the data where something went wrong. Sorry, at this point that\'s the best I can tell you. You can always paste the data into <a href="http://jsonlint.com/">JSONLint</a> to get specifics.</p>').removeClass('hidden');
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
			
	
			if (data.format_html){
				data.tabledata = this.parseTableHTML(data.tabledata);
			} else {
				data.tabledata = this.parseTableText(data.tabledata);
			}
			if (data.tabledata_hd == '') {
				data.tabledata_hd = 'default';
			}
			
			data.tables = {};
			data.tables[data.tabledata_hd] = data.tabledata;
			delete data.tabledata;
			delete data.tabledata_hd;
			
			for(var i=1; i<=this.subt; i++ ) {
			
				if (data['subt'+i]) {
					if (data['subt'+1] !== '') {
						if (data.format_html){
							d = this.parseTableHTML(data['subt'+i]);
						} else {
							d = this.parseTableText(data['subt'+i]);
						}
						t = (data['subt_t'+i] == '') ? 'subtable'+i : data['subt_t'+i];
						data.tables[t] = d; 
					}
					delete data['subt'+i];
					delete data['subt_t'+i];
				}
			}
		
		} //end mode switch
		
		//console.log(data);
		this.model.set(data);
		this.model.normalize();
		
		this.enableSave();
		document.getElementById('import-preview').scrollIntoView(true);
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
		
		html = html.replace(/\<\/?[^\>]+\>/g, '');
		
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
		
		console.log(t);
		
		return t.join('\n');
	},
	
	/**
	 * Save action. Saves table, resets form.
	 *
	 */
	saveTable: function(e) {
		
		//validate?
		if (this.model.get('title') == '') {
			alert('Please add a title before saving.');
			this.disableSave();
			return;
		}
		
		if (this.model.isNew()) {
			this.model.save();
			//apps new table to collection, which triggers refresh on collection/view
			app.rtables.import(this.model);
		} else {
			this.model.save();
		}
		
		document.getElementById('import-form').scrollIntoView(true);
		this.trigger('resetform');
	},
	
	/**
	 * cancel any add/edit and reset (triggered via Importer )
	 */
	cancel: function(e) {
		this.trigger('resetform');
	},
	
	/**
	 * opens a modal with table import help.
	 */
	helpModal: function() {
		if (this.mode == 'guided') {
			var body = '<p>You can add your own Random Tables through this form. All fields are optional, though you at least need to put in some table data, and a title is recommended if you want to add more than one table.</p><p>You have a lot of options for formatting your data from the very simple to the complex: for now the easiest method is:</p>';
			
			body += '<ul><li>One entry per line. (Just that will get you a table of equally likely results.)</li>';
			body += '<li>To weight a random chance you have two options:<ul><li>For a die like format, prefix the entry with a number or a number range and a space(s), comma, period, or colon. (i.e. "1: first", "2-3. second", "4-6, third")</li><li>To directly weight the chances, prefix with a number followed by two pound signs (i.e. "2##This entry will be twice as likely", "4##This entry is four times as likely").</li></ul></li>';
			body += '<li>If you add multiple tables, you can add two pounds signs and the name of a table to the end of a line to have the randomizer select from the named subtable if the entry is selected (i.e. "Bandits##bandit_types") Subtables are better if short with limited punctuation.</li>';
			
			body += '<li>You can insert tokens into the results to perform actions like generating numbers or rolling on other random tables. For instance:<ul><li>Roll a number: {{roll:3d6+1}} in the results will generate a new random number every time that result comes up. The section after the semi-colon should accept any form of [A Number or Blank]d[Another number][An arithmatic operator: +, -, *, or /][Another number] (i.e. "d6", "d6*2", "2d10+10", etc.)</li>';
			body += '<li>Select from a table: {{table:general.color}} will randomly select a color. You can reference any other table in the app, but I still need to improve the table references (how to reference them and where to find those names).</li>';
			
			body += '</ul></li>';
			
			body += '</ul>';
			body += '<p>You must preview the table at right before saving. Saving the table will save it to your local browser storage and add the table to the Random Tables list. The Import/export code area shows you the table as converted to JSON (which we can use later for importing/exporting/sharing).</p>';
		} else if (this.mode == 'freeform') {
			//* @todo add link to tableformat.md doc (anchor to freeform section?) */
			body = '<p>Freeform mode only accepts valid JSON in the input field, so it is more complicated than Guided mode. But, in exchange, you have much greater control over the table options and data. Learn about formatting and table options.</p>';
			
		}
		
		app.showModal('Import Format Help', body);		
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


var ImportPreview = Backbone.View.extend(
/** @lends ImportPreview.prototype */
{
	
	model: RandomTable,
	tagName: 'pre',
	id: 'import_preview',
	
	/**
	 * This is the view for a Random Table import code preview
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
	
	
});