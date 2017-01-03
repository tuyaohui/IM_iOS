/*jslint node: true */
"use strict";

var fsq_dir_index = process.argv.indexOf('--fsq-dir');

module.exports = function (grunt)
{
    grunt.initConfig(
    {
        jshint: {
            all: {
                src: [ 'Gruntfile.js', 'index.js', 'lib/*.js', 'test/**/*.js', 'bench/**/*.js' ],
                options: {
                    esversion: 6
                }
            }
        },

        mochaTest: {
            default: {
                src: ['test/common.js', 'test/test_spec.js']
            },
            stress: {
                src: ['test/common.js', 'test/multiple_queues_spec.js' ]
            },
            multi: {
                src: ['test/common.js',
                      'test/rabbitmq_bindings.js',
                      'test/rabbitmq_spec.js']
            }
        },

        apidox: {
            input: ['lib/qlobber-fsq.js', 'lib/events_doc.js'],
            output: 'README.md',
            fullSourceDescription: true,
            extraHeadingLevels: 1,
            sections: {
                'QlobberFSQ': '\n## Constructor',
                'QlobberFSQ.prototype.subscribe': '\n## Publish and subscribe',
                'QlobberFSQ.prototype.stop_watching': '\n## Lifecycle',
                'QlobberFSQ.events.start': '\n## Events'
            }
        },

        shell: {
            cover: {
                command: './node_modules/.bin/istanbul cover ./node_modules/.bin/grunt -- test ' + (fsq_dir_index < 0 ? /* istanbul ignore next */ '' : process.argv.slice(fsq_dir_index).join(' '))
            },

            check_cover: {
                command: './node_modules/.bin/istanbul check-coverage --statement 90 --branch 85 --function 95 --line 95'
            },

            coveralls: {
                command: 'cat coverage/lcov.info | coveralls'
            },

            bench: {
                command: './node_modules/.bin/bench -c 1 -i "$(echo bench/implementations/*.js | tr " " ,)" --data "' + new Buffer(JSON.stringify(process.argv.slice(3))).toString('hex') + '"'

            },

            diagrams: {
                command: 'dot diagrams/how_it_works.dot -Tsvg -odiagrams/how_it_works.svg'
            }
        }
    });
    
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-apidox');
    grunt.loadNpmTasks('grunt-shell');

    grunt.registerTask('lint', 'jshint');
    grunt.registerTask('test', 'mochaTest:default');
    grunt.registerTask('test-stress', 'mochaTest:stress');
    grunt.registerTask('test-multi', 'mochaTest:multi');
    grunt.registerTask('docs', ['shell:diagrams', 'apidox']);
    grunt.registerTask('coverage', ['shell:cover', 'shell:check_cover']);
    grunt.registerTask('coveralls', 'shell:coveralls');
    grunt.registerTask('bench', 'shell:bench');
    grunt.registerTask('default', ['jshint', 'mochaTest:default']);
};
