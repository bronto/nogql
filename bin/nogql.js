#!/usr/bin/env node

// parse any cli options
var yargs = require('yargs')
  .options({
    'a' : {
      'default'  : 'localhost',
      'describe' : 'hostname to serve from',
    },
    'n' : {
      'demand'   : true,
      'describe' : 'location of nagiosql settings.php'
    },
    'p' : {
      'default'  : '8080',
      'describe' : 'port to utilize',
    },
    's' : {
      'boolean'  : true,
      'default'  : false,
      'describe' : 'suppress logging',
    },
    'h' : {
      'alias'    : 'help',
      'boolean'  : true,
      'describe' : 'display usage information'
    }
  })
  .usage("$0 [options]");

options = yargs.argv;
if (options.h || options.help) {
  yargs.showHelp();
  process.exit();
}

// start up the server
var nogql  = require('../lib/nogql.js');
nogql.start(options);
