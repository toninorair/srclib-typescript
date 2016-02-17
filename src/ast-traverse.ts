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

                //             var classDecl: ts.ClassDeclaration = <ts.ClassDeclaration>node;
                //         case ts.SyntaxKind.FunctionDeclaration:
                //             var funcDecl: ts.FunctionDeclaration = <ts.FunctionDeclaration>node;
                if (node.kind === ts.SyntaxKind.ClassDeclaration) {
                    let symbol = self.checker.getSymbolAtLocation((<ts.ClassDeclaration>node).name);

                    //emit def here
                    self._emitNamedDef(node, symbol, "class");
                    ts.forEachChild(node, _visit);
                } else if (node.kind === ts.SyntaxKind.FunctionDeclaration) {
                    let symbol = self.checker.getSymbolAtLocation((<ts.FunctionDeclaration>node).name);

                    //emit def here
                    self._emitNamedDef(node, symbol, "function");
                    ts.forEachChild(node, _visit);
                } else if (node.kind === ts.SyntaxKind.MethodDeclaration) {
                    let symbol = self.checker.getSymbolAtLocation((<ts.MethodDeclaration>node).name);

                    //emit def here
                    self._emitNamedDef(node, symbol, "method");
                    //ts.forEachChild(node, _visit);
                } else if (node.kind === ts.SyntaxKind.PropertyAccessExpression) {
                    let symbol = self.checker.getSymbolAtLocation((<ts.PropertyAccessExpression>node).name);

                    //emit ref here
                    self._emitRef(node, symbol);
                    // let type = checker.typeToString(checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration));
                } else if (node.kind === ts.SyntaxKind.Identifier) {
                    let symbol = self.checker.getSymbolAtLocation(<ts.Identifier>node);

                    //emit ref here
                    self._emitRef(node, symbol);
                } else {
                    ts.forEachChild(node, _visit);
                }
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
