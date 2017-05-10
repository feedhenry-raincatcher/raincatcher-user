'use strict';

module.exports = function(grunt) {
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    eslint: {
      src: ["lib/**/*.js"]
    },

    mochaTest: {
      test: {
        src: ['test/**/*-spec.js'],
        options: {
          reporter: 'Spec',
          logErrors: true,
          timeout: 10000,
          run: true
        }
      }
    },
    env:{
      test :{
        WFM_USE_MEMORY_STORE: true
      }
    }
  });
  grunt.loadNpmTasks('grunt-env');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks("grunt-eslint");
  grunt.registerTask('mocha', ['mochaTest']);
  grunt.registerTask('unit', ['env:test', 'eslint', 'mocha']);
  grunt.registerTask('default', ['unit']);

};
