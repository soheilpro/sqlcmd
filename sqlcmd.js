#!/usr/bin/env node

var eol = require('os').EOL;
var sql = require('mssql');

var argv = require('optimist')
    .demand(['s', 'u', 'p'])
    .alias('s', 'server')
    .alias('u', 'user')
    .alias('p', 'password')
    .alias('d', 'database')
    .usage('Usage:' + eol +
           '  sqlcmd -s <server> -u <username> -p <password> [-d <database>] <query>')
    .argv;

if (argv._.length === 0 || argv._[0] === '-') {
  var query = '';

  process.stdin.on('data', function(chunk) {
    query += chunk;
  });

  process.stdin.on('end', function() {
    run(argv.server, argv.user, argv.password, argv.database, query);
  });
}
else {
  run(argv.server, argv.user, argv.password, argv.database, argv._);
}

function run(server, user, password, database, query) {
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
      return;
    }

    var request = connection.request();

    request.query(query, function(error, recordset) {
      if (error) {
        console.error(error);
        return;
      }

      console.log(JSON.stringify(recordset));

      connection.close();
    });
  });
}
