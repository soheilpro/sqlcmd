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
    .usage('Usage:' + eol +
           '  sqlcmd -s <server> -u <username> -p <password> [-d <database>] <script>')
    .argv;

if (argv._.length === 0 || argv._[0] === '-') {
  var script = '';

  process.stdin.on('data', function(chunk) {
    script += chunk;
  });

  process.stdin.on('end', function() {
    run(argv.server, argv.user, argv.password, argv.database, script);
  });
}
else {
  run(argv.server, argv.user, argv.password, argv.database, argv._);
}

function run(server, user, password, database, script) {
  var config = {
    server: server,
    user: user,
    password: password,
    database: database || 'master',
    requestTimeout: 1000 * 60
  }

  var connection = new sql.Connection(config, function(error) {
    if (error) {
      console.error(error);
      process.exit(1);
      return;
    }

    var queries = script.toString().split(/\bGO\b/);
    var request = connection.request();

    async.eachSeries(
      queries,
      function(query, callback) {
        request.query(query, function(error, recordset) {
          if (error)
            return callback(error);

          if (recordset)
            console.log(JSON.stringify(recordset));

          callback();
        });
      },
      function(error) {
        connection.close();

        if (error) {
          console.error(error);
          process.exit(2);
          return;
        }
      }
    );
  });
}
