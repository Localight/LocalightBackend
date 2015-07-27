//'use strict';
module.exports = function(grunt) {
   // Unified Watch Object
   var watchFiles = {
      mochaTests: ['app/tests/**/*.js']
   };
   // Project Configuration
   grunt.initConfig({
      pkg: grunt.file.readJSON('package.json'),
      env: {
         test:{
            NODE_ENV: 'test'
         },
         secure: {
            NODE_ENV: 'secure'
         }
      },
      mochaTest:{
         src: watchFiles.mochaTests,
         options: {
            reporter: 'spec',
            require:'app.js'
         }
      },
   });
   // Load NPM tasks
   require('load-grunt-tasks')(grunt);

   // Making grunt default to force in order not to brak the Projet.
   grunt.option('force', true);

   grunt.task.registerTask('loadConfig', 'Task that loads the config into a grunt option', function(){
      var init = require('./config/init')();
      var config = require('./config/config');
   });

   // Default task(s)
   grunt.registerTask('default', [ 'concurrent:default']);
   // Debug task.
   grunt.registerTask('debug', ['concurrent:debug']);
   // Test Task.
   grunt.registerTask('test', ['env:test', 'mochaTest']);
};
