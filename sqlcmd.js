#!/usr/bin/env node

var eol = require('os').EOL;
var sql = require('mssql');
var async = require('async');
var _ = require('underscore');

var argv = require('optimist')
    .demand(['s', 'u', 'p'])
    .alias('s', 'server')
    .alias('u', 'user')
    .alias('p', 'password')
    .alias('d', 'database')
    .alias('t', 'timeout')
    .alias('m', 'param')
    .describe('s', '')
    .describe('u', '')
    .describe('p', '')
    .describe('d', 'Default: master')
    .describe('t', 'Default: 60 seconds')
    .describe('m', 'Format: param1=foo')
    .describe('no-quoted-identifier', 'Disable quoted identifiers.')
    .usage('Usage:' + eol +
           '  sqlcmd -s <server> -u <username> -p <password> [-d <database>] [-t <timeout>] [--no-quoted-identifier] [-m param1=foo -m param2=bar ...] <script>')
    .argv;

getScript(function(error, script) {
  if (error) {
    console.error(error);
    process.exit(1);
    return;
  }

  replaceTemplateParams(script, function(error, script) {
    if (error) {
      console.error(error);
      process.exit(2);
      return;
    }

    connectToServer(function(error, connection) {
      if (error) {
        console.error(error);
        process.exit(3);
        return;
      }

      executeScript(script, connection, function(error, recordsets) {
        connection.close();

        if (error) {
          console.error(error);
          process.exit(4);
          return;
        }

        recordsets.forEach(function(recordset) {
          if (recordset)
            console.log(JSON.stringify(recordset));
        });
      });
    });
  });
});

function getScript(callback) {
  if (argv._.length !== 0 && argv._[0] !== '-')
    return callback(null, argv._[0]);

  var script = '';

  process.stdin.on('data', function(chunk) {
    script += chunk;
  });

  process.stdin.on('end', function() {
    callback(null, script);
  });
}

function replaceTemplateParams(script, callback) {
  var params = _.object(_.map(argv.param ? (Array.isArray(argv.param) ? argv.param : [argv.param]) : [], function(param) {
    var match = param.match(/(.+)=(.*)/);

    if (!match)
      return [];

    return [match[1], match[2]];
  }));

  var script = script.replace(/<([\w-]+),\s*(\w*),\s*(\w*)>/g, function(match, name, type, defaultValue) {
    var value = params[name] || defaultValue;

    if (!value)
      return callback(new Error('No value for param: ' + name));

    return value;
  });

  var script = script.replace(/\$\((\w+)\)/g, function(match, name) {
    var value = params[name];

    if (!value)
      return callback(new Error('No value for param: ' + name));

    return value;
  });

  callback(null, script);
}

function connectToServer(callback) {
  var match = /^(.*)\\(.*)$/.exec(argv.user);

  if (match) {
    argv.domain = match[1];
    argv.user = match[2];
  }

  var config = {
    server: argv.server,
    domain: argv.domain,
    user: argv.user,
    password: argv.password,
    database: argv.database || 'master',
    requestTimeout: (argv.timeout || 60) * 1000
  }

  var connection = new sql.Connection(config, function(error) {
    if (error)
      return callback(error);

    callback(null, connection);
  });
}

function executeScript(script, connection, callback) {
  var queries = script.split(/\bGO\b/);

  async.mapSeries(
    queries,
    function(query, callback) {
      if (!argv['quoted-identifier'])
        connection.request().batch('SET QUOTED_IDENTIFIER OFF');

      connection.request().query(query, callback);
    },
    callback
  );
}
