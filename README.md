# sqlcmd
sqlcmd for Mac and Linux.

## Install

```
npm install -g sqlcmdjs
```

## Usage

```
sqlcmd -s <server> -u <username> -p <password> [-d <database>] [-t <timeout>] <script>
```

If no script is specified, sqlcmd reads from the standard input.

## Example

Run a script:

```
sqlcmd -s 127.0.0.1 -u sa -p p@ssw0rd "select name, database_id from sys.databases"
```

Run a script from file:

```
cat script.sql | sqlcmd -s 127.0.0.1 -u sa -p p@ssw0rd
```

## Version History
+ **1.2**
  + Added timeout argument.
+ **1.1**
  + Added support for scripts with GO statements.
+ **1.0**
	+ Initial release.

## Author
**Soheil Rashidi**

+ http://soheilrashidi.com
+ http://twitter.com/soheilpro
+ http://github.com/soheilpro

## Copyright and License
Copyright 2015 Soheil Rashidi

Licensed under the The MIT License (the "License");
you may not use this work except in compliance with the License.
You may obtain a copy of the License in the LICENSE file, or at:

http://www.opensource.org/licenses/mit-license.php

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
