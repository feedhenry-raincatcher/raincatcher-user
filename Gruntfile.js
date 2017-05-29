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
    mocha_istanbul: {
      coverage: {
        src: ['test/**/*.js']
      },
      coveralls: {
        src: 'test/**/*-spec.js',
        options: {
          coverage: true,
          reportFormats: ['lcovonly'],
          root: './lib'
        }

      }
    },
    env:{
      test :{
        WFM_USE_MEMORY_STORE: true
      }
    }
  });
  grunt.event.on('coverage',function(lcov,done){
    require('coveralls').handleInput(lcov, function(err){
      if (err) {
        return done(err);
      }
      done();
    });
  });
  grunt.loadNpmTasks('grunt-mocha-istanbul');
  grunt.loadNpmTasks('grunt-env');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks("grunt-eslint");
  grunt.registerTask('mocha', ['mochaTest']);
  grunt.registerTask('unit', ['env:test', 'eslint', 'mocha']);
  grunt.registerTask('coveralls',['env:test','mocha_istanbul:coveralls']);
  grunt.registerTask('coverage',['env:test','mocha_istanbul:coverage']);
  grunt.registerTask('default', ['unit','coveralls']);

};
