/// <reference path="../typings/node/node.d.ts" />

import unit = require('./unit');

var fs = require('fs');
var readJson = require('read-package-json');

export class DepresolveAction implements Action {

    private unitFile: string;

    constructor(unitFile?: string) {
        this.unitFile = unitFile;
    }

    execute(): void {
        var fd = process.stdin;
        if (this.unitFile) {
            fd = fs.fopenSync(this.unitFile, 'r');
        }
        var self = this;
        unit.SourceUnit.readSourceUnit(function(err: Error, data: unit.SourceUnit) {
            if (err) {
                console.error(err);
                process.exit(1);
            }
            console.log(data.Dependencies);

        }, fd);
    }
}
