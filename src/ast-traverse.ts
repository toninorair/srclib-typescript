/// <reference path="def-and-ref-template.ts" />

import {readFileSync} from "fs";
import * as ts from "typescript";
import defs = require('./def-and-ref-template');

export class ASTTraverse {

    private allObjects: defs.RootObject;
    private program: ts.Program;
    private checker: ts.TypeChecker;

    constructor(fileNames: string[]) {
        console.log(fileNames);
        this.program = ts.createProgram(fileNames, {
            target: ts.ScriptTarget.ES5, module: ts.ModuleKind.CommonJS
        });

        // Get the checker, we will use it to find more about classes
        this.checker = this.program.getTypeChecker();

        //initialize def/ref storage
        this.allObjects = new defs.RootObject();
    }

    traverse() {
        for (const sourceFile of this.program.getSourceFiles()) {
            if (!sourceFile.hasNoDefaultLib) {
                // Walk the tree to search for classes
                console.log(sourceFile.fileName);
                ts.forEachChild(sourceFile, _visit);
            }
            var self = this;

            function _visit(node: ts.Node) {
                //console.log(this);
                if (node.kind === ts.SyntaxKind.ClassDeclaration) {
                    var classDecl: ts.ClassDeclaration = <ts.ClassDeclaration>node;
                    let symbol = self.checker.getSymbolAtLocation(classDecl.name);

                    // console.log("Inside class = ", self.checker.getFullyQualifiedName(symbol));

                    //emit def here
                    self._emitNamedDef(node, symbol, "class");
                }

                if (node.kind === ts.SyntaxKind.PropertyAccessExpression) {
                    var decl: ts.PropertyAccessExpression = <ts.PropertyAccessExpression>node;
                    let symbol = self.checker.getSymbolAtLocation(decl.name);

                    //emit ref here
                    self._emitRef(node, symbol);
                    // let type = checker.typeToString(checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration));
                }

                ts.forEachChild(node, _visit);
            }
        };
        console.log(JSON.stringify(this.allObjects));
    }

    private _emitNamedDef(node: ts.Node, symbol: ts.Symbol, kind: string) {
        //emitting def here
        var def: defs.Def = new defs.Def();
        def.Name = symbol.name;
        def.Path = this.checker.getFullyQualifiedName(symbol);
        def.Kind = kind;
        def.File = node.getSourceFile().fileName;
        def.DefStart = node.getStart();
        def.DefEnd = node.getEnd();
        this.allObjects.Defs.push(def);
        //console.log(JSON.stringify(def));
    }

    private _emitRef(node: ts.Node, symbol: ts.Symbol) {
        //emitting ref here
        var ref: defs.Ref = new defs.Ref();
        ref.DefPath = this.checker.getFullyQualifiedName(symbol);
        ref.File = node.getSourceFile().fileName;
        ref.Start = node.getStart();
        ref.End = node.getEnd();
        this.allObjects.Refs.push(ref);
        // console.log(JSON.stringify(ref));
    }
}

// private _getParentChain(node: ts.Node, parentChain: string = "") {
//
//     if (!node) {
//         return parentChain;
//     }
//     switch (node.kind) {
//         case ts.SyntaxKind.ModuleDeclaration:
//             var moduleDecl: ts.ModuleDeclaration = <ts.ModuleDeclaration>node;
//         case ts.SyntaxKind.ClassDeclaration:
//             var classDecl: ts.ClassDeclaration = <ts.ClassDeclaration>node;
//         case ts.SyntaxKind.FunctionDeclaration:
//             var funcDecl: ts.FunctionDeclaration = <ts.FunctionDeclaration>node;
//
//     }
// }
//
