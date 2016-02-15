/// <reference path="../typings/node/node.d.ts" />
var fs = require("fs");
//var fs = require('fs');
var GraphAction = (function () {
    function GraphAction(unitFile) {
        this.unitFile = unitFile;
    }
    GraphAction.prototype.execute = function () {
        //var fd = process.stdin;
        var fd = fs.openSync("test.ts", 'r');
        //var fd = fs.readFileSync('/Users/tonya/test.ts', "utf8");
        //  var fd;
        if (this.unitFile) {
            fd = fs.openSync(this.unitFile, 'r');
        }
        var self = this;
        SourceUnit.readSourceUnit(function (err, data) {
            if (err) {
                console.error(err);
                process.exit(1);
            }
            data.Files.forEach(function (file) {
                if (!fs.existsSync(file)) {
                    console.warn("File %s does not exist", file);
                    return;
                }
                self._graph(file);
            });
        }, fd);
    };
    GraphAction.prototype._graph = function (file) {
        console.log("Building graph for %s", file);
        // TODO
    };
    return GraphAction;
})();
