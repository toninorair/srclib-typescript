/// <reference path="def-and-ref-template.ts" />

import * as fs from "fs";
import * as ts from "typescript";
import defs = require('./def-and-ref-template');

export class ASTTraverse {

    private allObjects: defs.RootObject;
    private program: ts.Program;
    private checker: ts.TypeChecker;

    constructor(fileNames: string[]) {
        this.program = ts.createProgram(fileNames, {
            target: ts.ScriptTarget.ES5, module: ts.ModuleKind.CommonJS
        });
        // Get the checker, we will use it to find more about classes
        this.checker = this.program.getTypeChecker();

        //initialize def/ref storage
        this.allObjects = new defs.RootObject();
    }

    traverse() {
        //firts pass - collecting all defs
        for (const sourceFile of this.program.getSourceFiles()) {
            var self = this;
            if (!sourceFile.hasNoDefaultLib) {
                // Walk the ast tree to search for defs
                ts.forEachChild(sourceFile, _collectDefs);
            }
        };

        //second pass - collecting all refs
        for (const sourceFile of this.program.getSourceFiles()) {
            var self = this;
            if (!sourceFile.hasNoDefaultLib) {
                // Walk the ast tree to search for refs
                ts.forEachChild(sourceFile, _collectRefs);
            }
        };
        fs.writeFileSync("defs-refs.json", JSON.stringify(this.allObjects));
        console.log(JSON.stringify(this.allObjects));

        function _collectRefs(node: ts.Node) {
            if (node.kind === ts.SyntaxKind.PropertyAccessExpression) {
                let symbol = self.checker.getSymbolAtLocation((<ts.PropertyAccessExpression>node).name);

                //emit ref here
                self._emitRef(node, symbol);
            } else if (node.kind === ts.SyntaxKind.Identifier) {
                let symbol = self.checker.getSymbolAtLocation(<ts.Identifier>node);
                //console.log(symbol);
                console.log(node.parent.kind);

                //emit ref here
                self._emitRef(node, symbol);
            }
        }

        function _collectDefs(node: ts.Node) {
            switch (node.kind) {
                case ts.SyntaxKind.ClassDeclaration:
                    let classSym = self.checker.getSymbolAtLocation((<ts.ClassDeclaration>node).name);
                    //emit def here
                    self._emitNamedDef(node, classSym, "class");
                    break;

                case ts.SyntaxKind.FunctionDeclaration:
                    let funSym = self.checker.getSymbolAtLocation((<ts.FunctionDeclaration>node).name);

                    //emit def here
                    self._emitNamedDef(node, funSym, "function");
                    break;
                case ts.SyntaxKind.MethodDeclaration:
                    let methodSym = self.checker.getSymbolAtLocation((<ts.MethodDeclaration>node).name);

                    //emit def here
                    self._emitNamedDef(node, methodSym, "method");
                    break;
                case ts.SyntaxKind.VariableDeclaration:
                    let varSym = self.checker.getSymbolAtLocation((<ts.VariableDeclaration>node).name);

                    //emit def here
                    self._emitNamedDef(node, varSym, "var");
                    break;
                case ts.SyntaxKind.Parameter:
                    let paramSym = self.checker.getSymbolAtLocation((<ts.ParameterDeclaration>node).name);

                    //emit def here
                    self._emitNamedDef(node, paramSym, "param");
                    break;
                case ts.SyntaxKind.PropertyDeclaration:
                    let fieldSym = self.checker.getSymbolAtLocation((<ts.PropertyDeclaration>node).name);

                    //emit def here
                    self._emitNamedDef(node, fieldSym, "property");
                    break;
            }
            ts.forEachChild(node, _collectDefs);
        }
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
