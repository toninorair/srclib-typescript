/// <reference path="../typings/commander/commander.d.ts" />
/// <reference path="action.ts" />
/// <reference path="scan.ts" />
/// <reference path="depresolve.ts" />

import graph = require('./graph');
import scan = require('./scan');
import depresolve = require('./depresolve');

var program = require('commander');

process.on('uncaughtException', function(e) {
  console.trace(e);
  process.exit(1);
});

program.command("scan").action(function() {new scan.ScanAction().execute()});
program.
    command("graph").
    option("--debug-unit-file <debug-unit-file>").
    action(function(command) {
        new graph.GraphAction(command.debugUnitFile).execute()
    });
program.command("depresolve").
    option("--debug-unit-file <debug-unit-file>").
    action(function(command) {
      new depresolve.DepresolveAction(command.debugUnitFile).execute()
    });
program.command("*").action(function(command) {
    console.error("Invalid command %s", command);
    process.exit(1);
});
program.parse(process.argv);
