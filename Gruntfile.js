var fs = require('fs');

module.exports = function(grunt) {
  var browsers = grunt.option('browser') ? grunt.option('browser').split(',') : ['PhantomJS'];
  var umdHeader = '(function (factory) {\n' +
    '  //define an AMD module that relies on \'leaflet\'\n' +
    '  if (typeof define === \'function\' && define.amd) {\n' +
    '    define([\'leaflet\', \'esri-leaflet\'], function (L, EsriLeaflet) {\n' +
    '      return factory(L, EsriLeaflet);\n' +
    '    });\n' +
    '  //define a common js module that relies on \'leaflet\'\n' +
    '  } else if (typeof module === \'object\' && typeof module.exports === \'object\') {\n' +
    '    module.exports = factory(require(\'leaflet\'), require(\'esri-leaflet\'));\n' +
    '  }\n\n' +
    '  if(typeof window !== \'undefined\' && window.L){\n' +
    '    factory(window.L, L.esri);\n' +
    '  }\n' +
    '}(function (L, EsriLeaflet) {\n\n';

  var umdFooter = '\n\n  return EsriLeaflet;\n' +
    '}));';

  var complete = [
    'src/Util.js',
    'src/Services/MapService.js',
    'src/Tasks/Legend.js',
    'src/Layers/DynamicMapLayer.js',
    'src/Controls/Legend.js'
  ];

  var symbols = [
    'src/Util.js',
    'src/Services/MapService.js',
    'src/Services/FeatureLayer.js',
    'src/Tasks/Legend.js',
    'src/Tasks/Legend/SymbolLegend.js',
    'src/Tasks/Legend/SymbolRenderer.js',
    'src/Layers/DynamicMapLayer.js',
    'src/Layers/FeatureLayer/FeatureLayer.js',
    'src/Controls/Legend.js'
  ];

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      all: {
        src: [
          'src/**/*.js'
        ]
      }
    },

    watch: {
      scripts: {
        files: [
          'src/**/*.js',
          'spec/**/*.js'
        ],
        tasks: ['jshint', 'concat'],
        options: {
          spawn: false
        }
      }
    },

    concurrent: {
      options: {
        logConcurrentOutput: true
      },
      dev: ['watch:scripts', 'karma:watch', 'connect:server']
    },

    concat: {
      options: {
        sourceMap: true,
        separator: '\n\n',
        banner: umdHeader,
        footer: umdFooter,
      },
      complete: {
        src: complete,
        dest: 'dist/esri-leaflet-legend-src.js'
      },
      symbols: {
        src: symbols,
        dest: 'dist/esri-leaflet-legend-compat-src.js'
      }
    },

    uglify: {
      options: {
        sourceMap: true,
        sourceMapIncludeSources: true,
        wrap: false,
        mangle: {
          except: ['L']
        },
        preserveComments: 'some',
        report: 'gzip',
        banner: umdHeader,
        footer: umdFooter,
      },
      dist: {
        files: {
          'dist/esri-leaflet-legend.js': complete,
          'dist/esri-leaflet-legend-compat.js': symbols,
        }
      }
    },

    karma: {
      options: {
        configFile: 'karma.conf.js'
      },
      run: {
        reporters: ['progress'],
        browsers: browsers,
        logLevel: 'ERROR'
      },
      coverage: {
        reporters: ['progress', 'coverage'],
        browsers: browsers,
        preprocessors: {
          'src/**/*.js': 'coverage'
        }
      },
      watch: {
        singleRun: false,
        autoWatch: true,
        browsers: browsers
      }
    },

    connect: {
      server: {
        options: {
          https: true,
          port: 8000,
          base: '.',
          keepalive: true
        }
      }
    }
  });


  // Development Tasks
  grunt.registerTask('default', ['concat', 'concurrent:dev']);
  grunt.registerTask('build', ['jshint', 'karma:coverage', 'concat', 'uglify']);
  grunt.registerTask('test', ['jshint', 'karma:run']);


  // Require all grunt modules
  require('load-grunt-tasks')(grunt, {
    pattern: ['grunt-*', 'grunt-assemble']
  });

};
