/// <reference path="def-and-ref-template.ts" />

import {readFileSync} from "fs";
import * as ts from "typescript";
import defs = require('./def-and-ref-template');

 export class ASTTraverse {

    private sourceFile: ts.SourceFile;

    private allObjects: defs.RootObject;

    emitNamedDef(ident: ts.Identifier, kind: string) {
        var def: defs.Def = new defs.Def();
        def.Name = ident.text;
        //add path resolution here
        def.Kind = kind;
        def.File = this.sourceFile.fileName;
        def.DefStart = ident.getStart();
        def.DefEnd = ident.getEnd();
        this.allObjects.Defs.push(def);
    }

    private emitDefs(node: ts.Node, depth = 0) {
        console.log(new Array(depth+1).join('----'), node.kind, node.pos, node.end);
        //for debug purposes for now
        depth++;

        if (node.kind == ts.SyntaxKind.VariableDeclaration) {
            var varDecl: ts.VariableDeclaration = <ts.VariableDeclaration>node;
            if (varDecl.name.kind == ts.SyntaxKind.Identifier) {
                var ident: ts.Identifier = <ts.Identifier>varDecl.name;
                this.emitNamedDef(ident, "var");
            }
        }
        else if (node.kind == ts.SyntaxKind.FunctionDeclaration) {
            var funcDecl: ts.FunctionDeclaration = <ts.FunctionDeclaration>node;
            if (funcDecl.name.kind == ts.SyntaxKind.Identifier) {
                var ident: ts.Identifier = <ts.Identifier>funcDecl.name;
                this.emitNamedDef(ident, "func");
            }
        }
        else if (node.kind == ts.SyntaxKind.ClassDeclaration) {
            var classDecl: ts.ClassDeclaration = <ts.ClassDeclaration>node;
            if (classDecl.name.kind == ts.SyntaxKind.Identifier) {
                var ident: ts.Identifier = <ts.Identifier>classDecl.name;
                this.emitNamedDef(ident, "class");
            }
        }
        else if (node.kind == ts.SyntaxKind.InterfaceDeclaration) {
            var interfaceDecl: ts.InterfaceDeclaration = <ts.InterfaceDeclaration>node;
            if (interfaceDecl.name.kind == ts.SyntaxKind.Identifier) {
                var ident: ts.Identifier = <ts.Identifier>interfaceDecl.name;
                this.emitNamedDef(ident, "interface");
            }

        }
        else if (node.kind == ts.SyntaxKind.EnumDeclaration) {
            var enumDecl: ts.EnumDeclaration = <ts.EnumDeclaration>node;
            if (enumDecl.name.kind == ts.SyntaxKind.Identifier) {
                var ident: ts.Identifier = <ts.Identifier>enumDecl.name;
                this.emitNamedDef(ident, "enum");
            }
        }

        else if (node.kind == ts.SyntaxKind.Identifier) {
            //console.log("Inside identifier with id = ", node.id);
            //emit refs here
        }
        // }
        node.getChildren().forEach(c => this.emitDefs(c, depth));
        // var checker = program.getTypeChecker(true);
    }

    addFile(fileName: string) {
        console.log("I am here inside adding files");
        this.sourceFile = ts.createSourceFile(fileName, readFileSync(fileName).toString(), ts.ScriptTarget.ES6, /*setParentNodes */ true);
        this.emitDefs(this.sourceFile);
    }
}
