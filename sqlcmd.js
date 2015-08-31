#!/usr/bin/env node

var eol = require('os').EOL;
var sql = require('mssql');
var async = require('async');

var argv = require('optimist')
    .demand(['s', 'u', 'p'])
    .alias('s', 'server')
    .alias('u', 'user')
    .alias('p', 'password')
    .alias('d', 'database')
    .alias('t', 'timeout')
    .usage('Usage:' + eol +
           '  sqlcmd -s <server> -u <username> -p <password> [-d <database>] [-t <timeout>] <script>')
    .argv;

getScript(function(error, script) {
  if (error) {
    console.error(error);
    process.exit(1);
    return;
  }

  connectToServer(function(error, connection) {
    if (error) {
      console.error(error);
      process.exit(2);
      return;
    }

    executeScript(script, connection, function(error, recordsets) {
      connection.close();

      if (error) {
        console.error(error);
        process.exit(3);
        return;
      }

      recordsets.forEach(function(recordset) {
        if (recordset)
          console.log(JSON.stringify(recordset));
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

function connectToServer(callback) {
  var config = {
    server: argv.server,
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
      connection.request().query(query, callback);
    },
    callback
  );
}
