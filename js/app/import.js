//Exporter and Importer models and views

//!Exporter
var Exporter = Backbone.Model.extend(
/** @lends Exporter.prototype */
{
			
	/**
	 * This is the model for Exporting data from local storage.
	 *
	 * @augments external:Backbone.Model
	 * @constructs
	 */
	initialize: function(){
		this.form = new ExportForm();
		$('#export').append(this.form.render().el);		
	},
	
	
});


//!ExportForm
var ExportForm = Backbone.View.extend(
/** @lends ExportForm.prototype */
{
	
	model: Exporter,
	tagName: 'form',
	
    events:{
        "submit": "prepDownload"
    },
	
	data_types: {
		'rtables': { label: 'Random Tables' },
		'npcs': { label: 'NPCs' },
		'dungeons': { label: 'Dungeons' },
		'wilderness': { label: 'Wilderness' },
		'missions': { label: 'Missions' },
		'all': { label: 'All ' }	
	},
	
	/**
	 * This is the view for a Random Table import form.
	 * In an edit operation this will be passed a RandomTable to be edited
	 *
	 * @augments external:Backbone.View
	 * @constructs
	 */
    initialize:function () {

    },
	
	/**
     * Make the form
     */
    render: function () {
    	var f = '';
    	    	
    	f += '<p class="alert alert-info">With this form you can export (via file download) the data saved to this app.</p>';
		
		f += '<div class="form-group"><label for="data_type" class="control-label">Data to Export</label><select class="form-control" id="data_type" name="data_type">';
			_.each(this.data_types, function(v,k,l){
				f += '<option value="'+k+'">'+v.label+'</option>';
			}, this);
		f += '</select></div>';
		
		f += '<div class="form-group"><label for="compress" class="check"><input type="checkbox" value="1" name="compress" id="compress" /> Compress output (less human readable, but smaller file)</label></div>';
		
		f += '<div class="form-group"><button class="btn btn-primary" type="submit">Generate Download File</button></div>';
		
		$(this.el).html(f);
        return this;
	},
	
	/**
	 * Uses the form data to generate a download link
	 */
	prepDownload:  function(e) {
		e.preventDefault();
		
		var form = $(e.target).serializeObject();
		var type = form.data_type;
		var compress = (form.compress) ? true : false;
		
		var text = '';
		
		var exportdata = {};
		
		if (type == 'rtables') {
			exportdata.tables = app.rtables.exportOutput('user');
		} else if (type == 'npcs') {
			exportdata.npcs = app.charlist.exportOutput('');
		} else if (type == 'dungeons') {
			exportdata.dungeons = app.dungeonlist.exportOutput('');
		} else if (type == 'wilderness') {
			exportdata.wilderness = app.wildlist.exportOutput('');
		} else if (type == 'missions') {
			exportdata.missions = app.missionlist.exportOutput('');
		} else if (type == 'all') {
			exportdata.tables = app.rtables.exportOutput('user');
			exportdata.npcs = app.charlist.exportOutput('');
			exportdata.dungeons = app.dungeonlist.exportOutput('');
			exportdata.wilderness = app.wildlist.exportOutput('');
			exportdata.missions = app.missionlist.exportOutput('');
		}

		text = (compress) ? JSON.stringify(exportdata) : JSON.stringify(exportdata, null, 2);
		
		var date = new Date();
		var y = date.getFullYear(), m = date.getMonth()+1, d = date.getDate();
		var filename = 'osr_export_'+type+'_'+y+'-'+m+'-'+d+'.txt';
		
		$('#export-link').remove();
		var $download = $('<a></a>')
			.text('Download File')
			.attr('id', 'export-link')
			.addClass('btn btn-success')
			.attr('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text))
			.attr('download', filename);
		$(this.el).find('button[type=submit]').after($download);
		
	}
	

});


//!Importer
var Importer = Backbone.Model.extend(
/** @lends Importer.prototype */
{
	
	data_types: {
		'rtables': { label: 'Random Tables' },
		'npcs': { label: 'NPCs' },
		'dungeons': { label: 'Dungeons' },
		'wilderness': { label: 'Wilderness' },
		//'missions': { label: 'Missions' },
		'all': { label: 'All ' }	
	},
	
	defaults: function() {
		return {
			rtables: [],
			npcs: [],
			dungeons: [],
			wilderness: [],
			settings: [], /** @todo setting export/import? */
		}
	},
	
	
	/**
	 * This is the model for Importing data to local storage.
	 *
	 * @augments external:Backbone.Model
	 * @constructs
	 */
	initialize: function(){
		
		this.form = new ImportForm({ model: this });
		this.preview = new ImportPreview({ model: this });
		
		$lcol = $('<div class="col-sm-6"></div>');
		$lcol.append(this.form.render().el);
		$rcol = $('<div class="col-sm-6"></div>');
		$rcol.append(this.preview.render().el);
		
		$row = $('<div class="row"></div>');
		$row.append($lcol).append($rcol);
		
		$('#import').append($row);
		
	},
	
	/**
	 * Parse the data from the form into models
	 * @param {Object} temp_data the JSON data from the form
	 * @param {String} data_type the type of import
	 */
	parseForm: function(temp_data, data_type) {
		this.importdata = {};
		if (data_type !== 'all') {
			this.importdata = this.formatImport(temp_data, data_type);
		} else {
			this.importdata = temp_data;
		}
		
		//console.log(this.importdata);
		
		imported = {};
		
		if (this.importdata.rtables) {
			imported.rtables = 0;
			_.each(this.importdata.rtables, function(v,k,l){
				if (_.isEmpty(v)) { return; }
				t = new RandomTable(v);
				t.set('id', ''); //just in case an id stuck around
				if (t.save()) {
					app.rtables.import(t);
					imported.rtables++;
				}
			}, this);
		}
		
		if (this.importdata.npcs) {
			imported.npcs = 0;
			//console.log(this.importdata.npcs);
			_.each(this.importdata.npcs, function(v,k,l){
				if (_.isEmpty(v)) { return; }
				t = new Character(v);
				t.set('id', ''); //just in case an id stuck around
				if (t.save()) {
					app.charlist.add(t);
					imported.npcs++;
				}
			}, this);
			
		}
		
		if (this.importdata.dungeons) {
			imported.dungeons = 0;
			//console.log(this.importdata.dungeons);
			_.each(this.importdata.dungeons, function(v,k,l){
				if (_.isEmpty(v)) { return; }
				t = new Dungeon(v);
				t.set('id', ''); //just in case an id stuck around
				if (t.save()) {
					app.dungeonlist.add(t);
					imported.dungeons++;
				}
			}, this);
			
		}
		
		if (this.importdata.wilderness) {
			imported.wilderness = 0;
			//console.log(this.importdata.wilderness);
			_.each(this.importdata.wilderness, function(v,k,l){
				if (_.isEmpty(v)) { return; }
				t = new Wilderness(v);
				t.set('id', ''); //just in case an id stuck around
				if (t.save()) {
					app.wildlist.add(t);
					imported.wilderness++;
				}
			}, this);
			
		}
		
		if (this.importdata.missions) {
			imported.missions = 0;
			//console.log(this.importdata.missions);
			_.each(this.importdata.missions, function(v,k,l){
				if (_.isEmpty(v)) { return; }
				t = new Mission(v);
				t.set('id', ''); //just in case an id stuck around
				t.save({ error: function(m,r,o){ console.log(m); console.log(r); }, success: function(m,r,o){ console.log(m); console.log(r); app.missionlist.add(m); imported.missions++; } });
				
				/*
if (t.save()) {		
					console.log(t);
					app.missionlist.add(t);
					imported.missions++;
				}
*/
			}, this);
			
		}
		
		if (!_.isEmpty(imported)) {
			var mess = '', atype = 'success';
			_.each(imported, function(v,k,l){
				mess += '<p>'+v+' '+this.data_types[k]['label']+' imported.</p>';
			}, this);
			if (mess == '') {
				mess = 'No data imported.';
				atype = 'danger';
			}
			$alert = app.showAlert(mess, { atype: atype, className: 'import-alert' });
			$('#import').prepend($alert);
		}
		
		this.form.reset();
		
	},
	
	/**
	 * Convert the import data to the right format of Object
	 * @param {Object} temp_data the JSON data from the form
	 * @param {String} data_type the type of import
	 * @returns {Object} reformatted (or not) import data
	 */
	formatImport: function(temp_data, data_type) {
		var ret = {};
		if (_.isArray(temp_data)) {
			//its a bunch of objects (we hope)
			ret[type] = temp_data;				
		} else {
			//its either 1 object or it could be an export of objects
			if (!temp_data[data_type]) {
				//assume it's just one table?
				ret[data_type] = [temp_data];
			} else {
				ret = temp_data;
			}
		}
		return ret;
	}
	
	
	
});


//!ImportForm
var ImportForm = Backbone.View.extend(
/** @lends ImportForm.prototype */
{
	
	model: Importer,
	tagName: 'form',
	
    events:{
        "submit": "runImport"
    },	
		
	/**
	 * This is the view for a Random Table import form.
	 * In an edit operation this will be passed a RandomTable to be edited
	 *
	 * @augments external:Backbone.View
	 * @constructs
	 */
    initialize:function () {

    },
	
	/**
     * Make the form
     */
    render: function () {
    	var f = '';
    	    	
    	f += '<p class="alert alert-info">With this form you can import data to this app. The data should be JSON formatted. If you are importing data you have previously exported from this app, then select the "All" data type option.</p>';
    	
    	f += '<p id="import_error" class="alert alert-danger hidden"></p>';
    	
    	f += '<div class="form-group"><label for="data_type" class="control-label">Type of Data to Import</label><select class="form-control" id="data_type" name="data_type">';
			_.each(this.model.data_types, function(v,k,l){
				f += '<option value="'+k+'">'+v.label+'</option>';
			}, this);
		f += '</select></div>';
		
		f += '<div class="form-group"><label for="importdata" class="control-label">Data to Import</label><textarea class="form-control textarea-tall" id="importdata" name="importdata"></textarea></div>';
		
		f += '<div class="form-group"><button class="btn btn-primary" type="submit">Import</button></div>';
		
		$(this.el).html(f);
        return this;
	},
	
	/**
	 * validate and submit form to Importer model
	 */
	runImport: function(e) {
		e.preventDefault();
		
		$('#import_error').addClass('hidden').html('');
		
		var data = $(e.target).serializeObject();
		
		try {
			temp_data = JSON.parse(data.importdata);
		} catch (e) {
			//console.error("Parsing error:", e);
			$('#import_error').html('<p>Invalid JSON: '+e+'</p><p>Usually that means you either:</p><ul><li>Didn\'t add a backslah before a double-quote.</li><li>Didn\'t put a comma after a quoted value.</li><li>Didn\'t properly close a double-quote, bracket, or brace.</li></ul><p>If the error is an "Unexpected token" then the letter after that message is the point in the data where something went wrong. Sorry, at this point that\'s the best I can tell you. You can always paste the data into <a href="http://jsonlint.com/">JSONLint</a> to get specifics.</p>').removeClass('hidden');
			return;
		}

		if (typeof temp_data == 'string') {
			$('#import_error').html('Data must be a JSON formatted object or array.').removeClass('hidden');
			return;
		}
		
		//try to get data into appropriate format
		if (data.data_type == 'all') {
			if (typeof temp_data !== 'object') {
				$('#import_error').html('Data appears improperly formatted for importing <em>All</em>.').removeClass('hidden');
				return;
			} else if (!temp_data.rtables && !temp_data.npcs && !temp_data.dungeons && !temp_data.wilderness) {
				$('#import_error').html('Data appears improperly formatted for importing <em>All</em>.').removeClass('hidden');
				return;
			}
			this.model.parseForm(temp_data, data.data_type);
		} else {
			this.model.parseForm(temp_data, data.data_type);
		}

	},
	
	/**
	 * clear the form for reuse
	 */
	reset: function() {
		$(this.el).find('input[type=text], input[text=hidden], textarea').val('');
		$(this.el).find('select option:first-child').attr('selected', true);
	}
	

});


//!Import Preview
var ImportPreview = Backbone.View.extend(
/** @lends ImportPreview.prototype */
{
	
	model: Importer,
	tagName: 'div',
	id: 'import-preview',
	
	
    events:{

    },
	
	/**
	 * This is the preview view for the app import form. Shown in a modal?
	 * various imported data models are displayed here before saving
	 *
	 * @augments external:Backbone.View
	 * @constructs
	 */
    initialize:function () {
		this.listenTo(this.model, "change", this.showRTables);
    },
	
	/**
     * show the list of models to be saved
     */
    render: function () {
    	var o = '<div class="rtables"></div>';
    	    	
		$(this.el).html(o);
        return this;
	},
	
	showRTables: function() {
		var rtables = this.model.get('rtables');
		//console.log(rtables);
		$container = $(this.el).find('.rtables');
		$container.empty();
		$container.append('<button id="rtables-button" class="btn btn-primary pull-right">Import All</button>').append('<h2>Random Tables to Import</h2>');
		$table = $('<table class="table table-striped"></table>');
		_.each(rtables, function(v,k,l){
			
			$table.append(new RandomTableShort({ model: v, import: true }).render().el);
			
		}, this);
		$container.append($table);
		//$(this.el).find('.rtables').prepend('<button id="rtables-button" class="btn btn-primary pull-right">Import All</button>');
		
	}


});
