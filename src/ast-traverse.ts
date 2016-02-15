///// <reference path="def-and-ref-template.ts" />

//import {readFileSync} from "fs";
var fs = require('fs');
var ts = require('typescript');
//import * as ts from "typescript";

class ASTTraverse {
   addFile(fileName: string) {
     let sourceFile = ts.createSourceFile(fileName, fs.readFileSync(fileName).toString(), ts.ScriptTarget.ES6, /*setParentNodes */ true);
     console.log("file = ", sourceFile);
     console.log("File read is done");
   }
}
