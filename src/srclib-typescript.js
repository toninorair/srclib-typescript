/// <reference path="../typings/commander/commander.d.ts" />
/// <reference path="action.ts" />
/// <reference path="scan.ts" />
/// <reference path="graph.ts" />
/// <reference path="depresolve.ts" />
var program = require('commander');
program.command("scan").action(function () { new ScanAction().execute(); });
program.
    command("graph").
    option("--debug-unit-file <debug-unit-file>").
    action(function () {
    new GraphAction(program.debugUnitFile).execute();
});
program.command("depresolve").
    option("--debug-unit-file <debug-unit-file>").
    action(function () { new DepresolveAction().execute(); });
program.command("*").action(function (command) {
    console.error("Invalid command %s", command);
    process.exit(1);
});
program.parse(process.argv);
