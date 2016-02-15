/// <reference path="../typings/node/node.d.ts" />

var D_TS_SUFFIX:string = 'd.ts';
var TESTS_DIR:string = '/Users/tonya/typescript-tests/';

var fs = require('fs');
var path = require('path');
var tsconfig = require('tsconfig');

class ScanAction implements Action {

    execute():void {

        var tsConfig = tsconfig.loadSync(TESTS_DIR);
        var files:string[] = this._collectFiles(tsConfig.files);

        var sourceUnit = new SourceUnit();
        sourceUnit.Type = 'TypeScriptModule';
        sourceUnit.Name = 'TODO';
        sourceUnit.Files = files;

        process.stdout.write(JSON.stringify([sourceUnit]));
    }

    private _collectFiles(files:string[]):string[] {
        return files.filter(function (file:string) {
            return file.indexOf(D_TS_SUFFIX, file.length - D_TS_SUFFIX.length) < 0;
        }).map(function(file:string) {
            return file.replace(new RegExp('\\' + path.sep, 'g'), path.posix.sep);
        });
    }
}
