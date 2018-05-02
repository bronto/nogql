
var fs      = require('fs');
var http    = require('http');
var ini     = require('ini');
var mysql   = require('mysql');
var pfinder = require('portfinder');
var q       = require('q');
var moment  = require('moment')


// setup logger
var winston = require('winston'),
  logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({'timestamp':true}),
  ]
});


/**
 * NogQL Server
 *
 * @param options Any custom parameters for this server instance, which can
 * include host, port, and not logging (silent mode).
 */
var NogQLServer = exports.NogQLServer = function(options) {

  this.host   = options.a || 'localhost';
  this.port   = options.p || 8080;
  this.silent = options.s || false;

  if (this.silent) {
    logger.remove(winston.transports.Console);
  }

  // load in nagios configuration
  fs.exists(options.n, function (exists) {
    if (!exists) {
      logger.error('could not find nagios configuration file');
      process.exit();
    }
  });

  this.nagios = ini.parse(fs.readFileSync(options.n, 'utf-8'))

  // attempt to connect to mysql database
  var connection = mysql.createConnection({
    host     : this.nagios.db.server,
    port     : this.nagios.db.port,
    user     : this.nagios.db.username,
    password : this.nagios.db.password,
    database : this.nagios.db.database
  });

  connection.connect(function (error) {
    if (error) {
      logger.error('could not establish connection to mysql database');
      logger.error(error);
      process.exit();
    }
  });

  connection.on('close', function (error) {
    if (error) {
      // unexpected failure, try establishing again
      connection = mysql.createConnection(connection.config);
    }
  });

  var query = q.nfbind(connection.query.bind(connection));


  /**
   * Invokes the server to begin listening on the specified host name
   * and port number.
   *
   * @param port The port number.
   * @param host The host name.
   */
  this.listen = function (port, host) {
    this.port = port || this.port;
    this.host = host || this.host;
    var that = this;

    // check if we can use the port specified
    pfinder.basePort = this.port;
    pfinder.getPort(function (error, port) {
      if (error) {
        logger.error('server could not start on port ' + port);
        logger.error(error);
        process.exit();
      }

      that.server.listen(port, that.host);
      logger.info('server listening at http://' + that.host + ':' + port);
    });
  };


  // create a new http server
  this.server = http.createServer();
  this.server.on('request', function (req, res) {
    logger.info(['request', req.method, req.url].join('\t'));

    var sendError = function (code, message) {
      if (message) {
        logger.error(message);
        message = {"error": message};
      }
      sendResponse(code, message);
    };

    var sendResponse = function (code, data) {
      res.writeHead(code, {"Content-Type":"application/json"});

      var response = ['response', res.statusCode];
      if (typeof data === 'object') {
        data = JSON.stringify(data);
      }

      if (data) {
        response.push(data);
      }

      res.end(data);
      req.connection.destroy();
      logger.info(response.join('\t'));
    };

    var validateKeys = function (data, keys) {
      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (!data[key]) {
          sendError(400, 'request does not contain value of ' + key);
          return false;
        }
      }
      return true;
    };

    if ((req.method === 'POST') || (req.method === 'PUT')) {
      var body = '';
      req.on('data', function (chunk) {
        if (chunk.length > 1e6) {
          sendError(413, 'request data exceeded maximum permitted length');
          return;
        }
        body += chunk;
      });
    }

    // end-points supported
    var url = req.url.split('/');
    switch (url[1]) {
      case 'host':
        if (req.method === 'DELETE' || req.method === 'GET') {
          if (!url[2]) {
            sendError(400, 'request does not contain a valid id');
            return;
          }

          var host_name = url[2];
          query('SELECT id, config_id, host_name, address, check_command, active, notes FROM tbl_host WHERE host_name=?', [host_name]).then(function (results) {
            if (results[0].length != 1) {
              throw new Error('could not retrieve configuration for requested host');
            }

            result  = results[0][0];
            if (req.method === 'GET') {
              sendResponse(200, result);
              return;
            }

            // sanity check before doing this kind of update
            host_id = result.id;
            if (!host_id) {
              throw new Error('current host_id is not valid');
            }

            // ensures the host is "missed" in the ui
            try {
              fs.unlinkSync('/etc/nagiosql/hosts/' + host_name + '.cfg');
            } catch (e) { }

            query('UPDATE tbl_host SET active=\'0\' WHERE id=?', [host_id]).then(function () {
              sendResponse(200);
            });

          }).catch(function (error) {
            sendError(500, error.message);
          }).done();

        }
        else if (req.method === 'POST') {
          req.on('end', function () {
            if (!body) {
              sendError(400, 'request does not contain data');
              return;
            }

            // validate required request data
            var data = JSON.parse(body.toString());
            var keys = ['address', 'check_command', 'domain', 'host_name', 'use'];
            validateKeys(data, keys);

            var command_id, domain_id, host_id, template_id;
            query('SELECT id FROM tbl_datadomain WHERE domain=?', [data.domain]).then(function (results) {
              if (results[0].length != 1) {
                throw new Error('could not retrieve configuration for requested domain');
              }

              domain_id = results[0][0].id;
              return query('SELECT id FROM tbl_command WHERE command_name=? AND config_id=?', [data.check_command, domain_id]);

            }).then(function (results) {
              if (results[0].length != 1) {
                throw new Error('could not retrieve configuration for requested command');
              }

              command_id = results[0][0].id;
              return query('SELECT id FROM tbl_hosttemplate WHERE template_name=? AND config_id=?', [data.use, domain_id]);

            }).then(function (results) {
              if (results[0].length != 1) {
                throw new Error('could not retrieve configuration for requested template');
              }

              template_id = results[0][0].id;
              var formatted_now = moment().format('YYYY-MM-DD HH:mm:ss');
              var host_row = {
                active: 0, config_id: domain_id,
                host_name: data.host_name, alias: data.host_name, 
                display_name: data.host_name, address: data.address,
                check_command: command_id, check_period: 22, max_check_attempts: 3,
                notification_interval: 30, notification_options: 'd,u,r', notification_period: 22,
                use_template: 1, notes: data.notes, initial_state: 'o', action_url: '',
                flap_detection_options: '',stalking_options: '', notes_url: '', 
                icon_image:'', icon_image_alt: '', vrml_image: '',statusmap_image:'',
                '2d_coords': '', '3d_coords': '', name: '', last_modified: formatted_now
              };
              return query('INSERT INTO tbl_host SET ?', host_row);

            }).then(function (results) {
              if (results[0].affectedRows != 1) {
                throw new Error('could not insert new host configuration');
              }

              host_id = results[0].insertId;

              var hostemplate_row = { idMaster: host_id, idSlave: template_id, idSort: 1, idTable: 1 };
              query('INSERT INTO tbl_lnkHostToHosttemplate SET ?', hostemplate_row).then(function () {
                sendResponse(200, { id: host_id });
              });

            }).catch(function (error) {
              sendError(500, error.message);
            }).done();

          });

        } else {
          sendError(405, 'request of invalid type to end-point');
        }
        break;

      default:
        sendError(405, 'request to an invalid end-point');
    }
  });

  this.server.on('close', function () {
    logger.info('server connection closed');
    process.exit();
  });
};


/**
 * Creates and starts a new server instance.
 *
 * @returns NogQLServer
 */
exports.start = function (options) {
  var server = new NogQLServer(options);
  server.listen();
  return server;
}
