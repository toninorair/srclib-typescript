/// <reference path="../typings/node/node.d.ts" />

var fs = require('fs');

export class ToolRef {
    Toolchain:string;
    Subcmd:string;
}

export class Info {
    Path:string;
    Dir:string;
    ConfigFile:string;
    Program:string;
}

export class SourceUnit {
    Name:string;
    Type:string;
    Repo:string;
    CommitID:string;
    Files:string[];
    Globs:string[];
    Dir:string;
    Dependencies:any[];
    Info:Info;
    Data:{
        [key: string]: any
    };
    Config:{
        [key: string]: any
    };
    Ops:{
        [key: string]: ToolRef
    };

    public static readSourceUnit(callback:(err:Error, data?:SourceUnit) => void, fd:any):void {
        var data = '';
        fd.resume();
        fd.setEncoding('utf8');
        fd.on('data', function (chunk) {
            data += chunk.toString();
        });

        fd.on('end', function () {
            var unit:SourceUnit = JSON.parse(data);
            callback(null, unit);
        });

        fd.on('error', function (e) {
            callback(e);
        });


    }
}
