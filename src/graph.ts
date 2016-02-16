/// <reference path="../typings/node/node.d.ts" />

var fs = require('fs');
import traverse = require('./ast-traverse');
import unit = require('./unit');

export class GraphAction implements Action {

    private unitFile:string;

    constructor(unitFile?:string) {
        this.unitFile = unitFile;
    }

    execute():void {
        var fd = process.stdin;
        if (this.unitFile) {
            fd = fs.createReadStream(this.unitFile);
          }
         var self = this;
        unit.SourceUnit.readSourceUnit(function (err:Error, data:unit.SourceUnit) {
            if (err) {
                console.error(err);
                process.exit(1);
            }

            data.Files.forEach(function(file) {
                if (!fs.existsSync(file)) {
                    console.warn("File %s does not exist", file);
                    return;
                }
                //self._graph(file);
            });
            self._graph(data.Files);
        }, fd);
    }

    private _graph(fileNames: string[]):void {
        var tree: traverse.ASTTraverse = new traverse.ASTTraverse(fileNames);
        tree.traverse();
    }
}
