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
	
    events:{
        "submit": "previewTable",
        "click .save": "saveTable",
        "click .cancel": "cancel"
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
     * Make the form
     * @todo edit this to handle complex tables. Perhaps put each table in a different textarea with an appropriate heading field
     */
    render: function () {
    	var form = '<p>You can add your own Random Tables through this form. All fields are optional, though you at least need to put in some table data, and a title is recommended if you want to add more than one table.</p><p>You have a lot of options for formatting your data from the very simple to the complex: for now the easiest method is:</p><ul><li>One entry per line.</li><li>To weight a random chance, prefix the entry with a number and two pound signs (i.e. "2##This entry will be twice as likely", "4##This entry is four times as likely").</li></ul><p>You can test the table at right before saving. The Import/export code area shows you the table as converted to JSON (which we can use later for importing/exporting/sharing).</p>';
    
		//Right now we only parse simple tables...
		d = this.model.get('tables').default;
		tabledata = [];
		_.each(d, function(v,k,l){
			var line = '';
			if (typeof v == 'string') {
				line = v;
			} else {			
				if (v.weight > 1) {
					line += v.weight+'##';
				}
				line += v.label;
			}
			tabledata.push(line);
		}, this);
		
		form += '<div class="form-group"><label for="tabledata" class="control-label">Table Data</label><textarea class="form-control" rows="20" name="tabledata" id="tabledata">'+tabledata.join("\n")+'</textarea><div class="help-block">Import formats.</div></div>';
		form += '<div class="row">';
		form += '<div class="col-md-6"><div class="form-group"><label for="title" class="control-label">Title</label><input type="text" class="form-control" name="title" id="title" value="'+this.model.get('title')+'" /></div></div>';
		form += '<div class="col-md-6"><div class="form-group"><label for="author" class="control-label">Author</label><input type="text" class="form-control" name="author" id="author" value="'+this.model.get('author')+'" /></div></div>';
		form += '</div>';
		
		var tags = this.model.get('tags').join('; ');
		
		form += '<div class="row">';
		form += '<div class="col-md-6"><div class="form-group"><label for="tags" class="control-label">Tags</label><input type="text" class="form-control" name="tags" id="tags" value="'+tags+'" /><div class="help-block">Separate tags with semi-colons.</div></div></div>';
		form += '<div class="col-md-6"><div class="form-group"><label for="source" class="control-label">Source</label><input type="text" class="form-control" name="source" id="source" value="'+this.model.get('source')+'" /></div></div>';
		form += '</div>';
		
		form += '<div class="form-group"><label for="description" class="control-label">Description</label><input type="text" class="form-control" name="description" id="description" value="'+this.model.get('description')+'" /></div>';
		
		form += '<div class="clearfix"><button type=button class="btn btn-default pull-right cancel">Cancel</button><button type="submit" class="btn btn-primary">Preview</button> <button class="btn btn-success save" type="button">Save</button></div>';
    
    	$(this.el).html(form);
        return this;
    },

    /**
     * Process the form data and preview
     */
	previewTable: function(e) {
		e.preventDefault();

    	formdata = $(e.target).serializeObject();
    	_.each(formdata, function(v,k,l){
	    	l[k] = $.trim(v);
    	}, this);
    	formdata.tags = formdata.tags.replace(/;*\s*$/, '');
		formdata.tags = formdata.tags.split(/;\s*/g);
		if (formdata.tags[0] == '') {
			delete formdata.tags;
		}
		
		var isjson = false;
		var formjson = '';
		try {
			formjson = JSON.parse(formdata.tabledata);
			isjson = true;
		} catch (e) {
			console.error("Parsing error:", e); 
		}
		//console.log(isjson);
		
		//parse the json into the object
		if (isjson) {		
			/*
			//overrride json with local fields? Nah.
			if (formdata.title !== '') {
				formjson.title = formdata.title;
			}
			if (formdata.author !== '') {
				formjson.author = formdata.author;
			}
			if (typeof formdata.tags !== 'undefined') {
				formjson.tags = formdata.tags;
			}
			if (formdata.source !== '') {
				formjson.source = formdata.source;
			}
			if (formdata.description !== '') {
				formjson.description = formdata.description;
			}
*/
			
			this.model.set(formjson);
			this.model.normalize();
		} else {
				
			//it's not JSON so parse it by line
			formdata.tabledata = formdata.tabledata.split(/[\n\r]+/g);
			var weighted = false;
			_.each(formdata.tabledata, function(v,k,l){
				var parse = v.match(/^([0-9]+)##(.+)/);
				if (parse) {
					l[k] = { "label": parse[2], "weight": parseFloat(parse[1]) };
					weighted = true;
				} else {
					l[k] = { "label": v, "weight": 1 };
				}
			}, this);		
	
			if (!weighted) {
				_.each(formdata.tabledata, function(v,k,l){
					l[k] = v.label;			
				}, this);
			}
			
			formdata.table = formdata.tabledata;
			delete formdata.tabledata;
			//console.log(formdata);
			this.model.set(formdata);
			this.model.normalize();
		}

		document.getElementById('import-preview').scrollIntoView(true);
	},
	
	/**
	 * Save action. Saves table, resets form.
	 *
	 */
	saveTable: function(e) {
		
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
	}
	
	
});


var ImportPreview = Backbone.View.extend(
/** @lends ImportPreview.prototype */
{
	
	model: RandomTable,
	tagName: 'pre',
	
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