/// <reference path="../typings/node/node.d.ts" />
/// <reference path="ast-traverse.ts" />

var fs = require('fs');

class GraphAction implements Action {

    private unitFile:string;

    private tree: ASTTraverse = new ASTTraverse();

    constructor(unitFile?:string) {
        this.unitFile = unitFile;
    }

    execute():void {
        var fd = process.stdin;
        if (this.unitFile) {
            fd = fs.createReadStream(this.unitFile);
          }
         var self = this;
        SourceUnit.readSourceUnit(function (err:Error, data:SourceUnit) {
            if (err) {
                console.error(err);
                process.exit(1);
            }

            data.Files.forEach(function(file) {
                if (!fs.existsSync(file)) {
                    console.warn("File %s does not exist", file);
                    return;
                }
                self._graph(file);
            });
        }, fd);
    }

    private _graph(file:string):void {
        var self = this;
        console.log("Building graph for %s", file);
        self.tree.addFile(file);
        // TODO
    }
}
