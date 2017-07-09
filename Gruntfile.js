module.exports = function(grunt) {
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({

    //Watch for file changes and kicks off a build if needed
    watch: {
      scripts: {
        files: ['Gruntfile.js', 'src/**/*'],
        tasks: ['default'],
        options: {
          interrupt: true,
          reload: true
        }
      }
    },

    //Cleans the build directory
    clean: {
      build: ['build']
    },

    //Copies all src files into the build dir for a new build
    copy: {
      main: {
        files: [{
          expand: true,
          cwd: 'src/',
          src: ['**'],
          dest: 'build/'
        }]
      }
    },

    //Handles ES2015 syntax conversions
    //See: https://babeljs.io/
    babel: {
      options: {
        plugins: ['lodash'],
        presets: ['es2015']
      },
      dist: {
        files: [{
          expand: true,
          cwd: 'build/',
          src: ['**/*.js'],
          dest: 'build/',
          ext: '.js'
        }]
      }
    },

    //JS syntax checking
    eslint: {
      options: {
        configFile: '.eslintrc.json'
      },
      target: {
        files: [{
          expand: true,
          src: [
            'build/**/*.js',
            'build/**/*.json'
          ]
        }]
      },
    },

    pkg: grunt.file.readJSON('package.json'),

    //Generates new API docs using YUI Doc
    yuidoc: {
      compile: {
        name: '<%= pkg.name %>',
        description: '<%= pkg.description %>',
        version: '<%= pkg.version %>',
        url: '<%= pkg.homepage %>',
        options: {
          paths: './build',
          themedir: 'apidocs_theme/default/',
          outdir: 'build/apidocs'
        }
      }
    }
  });

  //Default task(s)
  grunt.registerTask('default', ['clean', 'copy', 'babel', 'eslint', 'yuidoc']);

  //Task for just generating docs
  grunt.registerTask('docs', ['yuidoc']);

  //Dev task that monitors for changes and kicks off autobuilds
  //Will ultimately run all tasks define in the "default" task
  grunt.registerTask('dev', ['watch']);
};
