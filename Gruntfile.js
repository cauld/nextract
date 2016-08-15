module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    eslint: {
      options: {
        configFile: '.eslintrc.json'
      },
      target: {
        files: [{
          expand: true,
          src: [
            '**/*.js',
            '**/*.json',
            '!**/node_modules/**',
            '!apidocs/**'
          ]
        }]
      },
    },

    yuidoc: {
      compile: {
        name: '<%= pkg.name %>',
        description: '<%= pkg.description %>',
        version: '<%= pkg.version %>',
        url: '<%= pkg.homepage %>',
        options: {
          paths: '.',
          themedir: 'apidocs_theme/default/',
          outdir: 'apidocs'
        }
      }
    }
  });

  //Load plugins
  grunt.loadNpmTasks('grunt-contrib-yuidoc');
  grunt.loadNpmTasks('grunt-eslint');

  //Default task(s)
  grunt.registerTask('default', ['eslint', 'yuidoc']);

  //Task for just generating docs
  grunt.registerTask('docs', ['yuidoc']);

};
