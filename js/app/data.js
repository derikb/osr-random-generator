//functions for data manipulation


//take an array, capitalize the values and dedipe the array, return as json
//good for arrays of names
function capitalizeDedupeArray(arr) {
	var oldarr = arr;
	var newarr = [];
	_.each(oldarr, function(v,k,l){
		v = v.toLowerCase();
		x = v.split(' ');
		_.each(x, function(v,k,l){ l[k] = v.capitalize(); });
		v = x.join(' ');
		newarr.push(v);
	});
	newarr.sort();
	newarr = _.uniq(newarr, true);
	return JSON.stringify(newarr);
}