/// <reference path="../typings/node/node.d.ts" />
var D_TS_SUFFIX = 'd.ts';
var fs = require('fs');
var path = require('path');
var tsconfig = require('tsconfig');
var ScanAction = (function () {
    function ScanAction() {
    }
    ScanAction.prototype.execute = function () {
        var tsConfig = tsconfig.loadSync('.');
        var files = this._collectFiles(tsConfig.files);
        var sourceUnit = new SourceUnit();
        sourceUnit.Type = 'TypeScriptModule';
        sourceUnit.Name = 'TODO';
        sourceUnit.Files = files;
        process.stdout.write(JSON.stringify([sourceUnit]));
    };
    ScanAction.prototype._collectFiles = function (files) {
        return files.filter(function (file) {
            return file.indexOf(D_TS_SUFFIX, file.length - D_TS_SUFFIX.length) < 0;
        }).map(function (file) {
            return file.replace(new RegExp('\\' + path.sep, 'g'), path.posix.sep);
        });
    };
    return ScanAction;
})();
