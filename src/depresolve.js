/// <reference path="../typings/node/node.d.ts" />
var fs = require('fs');
var readJson = require('read-package-json');
var DepresolveAction = (function () {
    function DepresolveAction(unitFile) {
        this.unitFile = unitFile;
    }
    DepresolveAction.prototype.execute = function () {
        var fd = process.stdin;
        if (this.unitFile) {
            fd = fs.fopenSync(this.unitFile, 'r');
        }
        var self = this;
        SourceUnit.readSourceUnit(function (err, data) {
            if (err) {
                console.error(err);
                process.exit(1);
            }
            // TODO: can we live without package.json?
            readJson('package.json', console.error, function (err, data) {
                if (err) {
                    console.error("Unable to read package.json", err);
                    process.stdout.write('[]');
                    process.exit(0);
                }
                console.log(data);
            });
        }, fd);
    };
    return DepresolveAction;
})();
