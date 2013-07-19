/**
 * Macchiato : Mobile and Web application offloading Copyright (C) 2013 Nicolas
 * Petitprez
 * 
 * This program is free software: you can redistribute it and/or modify it under
 * the terms of the GNU General Public License as published by the Free Software
 * Foundation, either version 3 of the License, or (at your option) any later
 * version.
 * 
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU General Public License for more
 * details.
 * 
 * You should have received a copy of the GNU General Public License along with
 * this program. If not, see <http://www.gnu.org/licenses/>.
 */

module.exports = function(grunt) {

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-clean');

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-exec');
  grunt.loadNpmTasks('grunt-execute');
  grunt.loadNpmTasks('grunt-contrib-qunit');

  // Project configuration.
  grunt
      .initConfig({
        pkg : grunt.file.readJSON('package.json'),

        // Before generating any new files, remove any previously-created files.
        clean : {
          tests : [ 'target' ]
        },

        jshint : {
          all : [ 'Gruntfile.js', 'src/main/javascript/*.js',
              'src/test/javascript/*.js' ],
          options : {
            // allow use of eval
            evil : true,
            laxbreak : true
          }
        },

        exec : {
          start : {
            cmd : function() {
              return "node src/test/server/testserver.js & echo $! >  .node.pid";
            }
          },
          stop : {
            cmd : function() {
              return "value=`cat .node.pid`; kill $value; rm  .node.pid";
            }
          }
        },

        /**
         * run qunit test
         */
        qunit : {
          all : [ 'src/test/client/*.html' ]
        },

        execute : {
          test : {
            src : [ 'src/test/server/serverTestLauncher.js' ]
          }
        },

        concat : {
          // concat task configuration goes here.
          bar : {
            src : [ 'src/main/javascript/futuresjs/*.js',
                'src/main/javascript/macchiato-commons.js',
                'src/main/javascript/macchiato-eb.js' ],
            dest : 'target/macchiato.js'
          }
        },

        uglify : {
          build : {
            src : 'target/macchiato.js',
            dest : 'target/macchiato.min.js'
          }
        }
      });

  // Default task(s).
  grunt.registerTask('test', [ 'clean', 'jshint', 'exec:start', 'qunit',
      'execute:test', 'exec:stop' ]);
  grunt.registerTask('build', [ 'concat', 'uglify' ]);
  grunt.registerTask('default', [ 'clean', /* 'test', */'build' ]);

};
