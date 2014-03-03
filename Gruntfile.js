module.exports = function(grunt) {
	
	grunt.initConfig({
  		pkg: grunt.file.readJSON('package.json'),
  		jsdoc: {
			dist : {
				src: ['js/app/*.js'], 
				options: {
					destination: 'doc'
				},
				jsdoc: 'node_modules/.bin/jsdoc'
			}
  		}
    });
 
	grunt.loadNpmTasks('grunt-jsdoc');
//  grunt.loadNpmTasks('grunt-contrib-uglify');
//  grunt.loadNpmTasks('grunt-contrib-concat');
//  grunt.loadNpmTasks('grunt-contrib-cssmin');
	
	grunt.registerTask('default', ['jsdoc']);
	
};