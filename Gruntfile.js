'use strict';

module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    eslint: {
      src: ["lib/**/*.js"]
    },
    mochaTest: {
      test: {
        options: {
          run: true
        },
        src: ['**/*-spec.js']
      }
    }
  });

  grunt.loadNpmTasks("grunt-eslint");
  grunt.registerTask('default', ['eslint']);
  grunt.registerTask('unit', ['eslint','mochaTest']);
};
