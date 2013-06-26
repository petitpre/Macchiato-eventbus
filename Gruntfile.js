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
              return "cd src/test/server; vertx run testserver.js -conf config.js & echo $! >   macchiato.pid; sleep 2";
            }
          },
          stop : {
            cmd : function() {
              return "value=`cat src/test/server/macchiato.pid`; kill $value; rm  src/test/server/macchiato.pid";
            }
          }
        },

        qunit : {
          all : [ 'src/test/client/*.html' ]
        },

        concat : {
          // concat task configuration goes here.
          bar : {
            src : [ 'src/main/javascript/futuresjs/*.js',
                'src/main/javascript/macchiato-commons.js',
                'src/main/javascript/macchiato-eb.js'
            // ,
            // 'src/macchiato-router.js', 'src/macchiato-actor.js',
            // 'src/macchiato-manager.js', 'src/macchiato-wsclient.js'
            ],
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
      'exec:stop' ]);
  grunt.registerTask('build', [ 'concat', 'uglify' ]);
  grunt.registerTask('default', [ 'clean', 'test', 'build' ]);

};