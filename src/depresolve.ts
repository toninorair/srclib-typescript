/// <reference path="../typings/node/node.d.ts" />

import unit = require('./unit');

var fs = require('fs');
var readJson = require('read-package-json');

export class DepresolveAction implements Action {

    private unitFile:string;

    constructor(unitFile?:string) {
        this.unitFile = unitFile;
    }

    execute():void {
        var fd = process.stdin;
        if (this.unitFile) {
            fd = fs.fopenSync(this.unitFile, 'r');
        }
        var self = this;
        unit.SourceUnit.readSourceUnit(function (err:Error, data:unit.SourceUnit) {
            if (err) {
                console.error(err);
                process.exit(1);
            }

            // TODO: can we live without package.json?
            readJson('package.json', console.error, function(err, data) {
                if (err) {
                    console.error("Unable to read package.json", err);
                    process.stdout.write('[]');
                    process.exit(0);
                }
                console.log(data);

            });
        }, fd);
    }
}
