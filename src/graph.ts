/// <reference path="../typings/node/node.d.ts" />

//import * as fs from "fs";

var fs = require('fs');

class GraphAction implements Action {

    private unitFile:string;

    constructor(unitFile?:string) {
        this.unitFile = unitFile;
    }

    execute():void {
        var fd = process.stdin;
        //var fd = fs.openSync("/Users/tonya/test.ts", 'r');
        //var fd = fs.readFileSync('/Users/tonya/test.ts', "utf8");
      //  var fd;
        if (this.unitFile) {
            fd = fs.createReadStream(this.unitFile);
          }
        // } else {
        //   fd = fs.openSync("/Users/tonya/test.ts", 'r');
        // }

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
        console.log("Building graph for %s", file);

        // TODO
    }
}
