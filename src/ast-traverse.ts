/// <reference path="def-and-ref-template.ts" />

import * as fs from "fs";
import * as ts from "typescript";
import defs = require('./def-and-ref-template');
import utils = require('./utils');

export class ASTTraverse {

    private allObjects: defs.RootObject;
    private program: ts.Program;
    private checker: ts.TypeChecker;
    private allDeclIds: Array<ts.Identifier>;

    constructor(fileNames: string[]) {
        this.program = ts.createProgram(fileNames, {
            target: ts.ScriptTarget.ES5, module: ts.ModuleKind.CommonJS
        });
        // Get the checker, we will use it to find more about classes
        this.checker = this.program.getTypeChecker();

        //initialize def/ref storage
        this.allObjects = new defs.RootObject();

        this.allDeclIds = new Array<ts.Identifier>();
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
        //console.log(JSON.stringify(this.allObjects));

        function _collectRefs(node: ts.Node) {
            if (node.kind === ts.SyntaxKind.PropertyAccessExpression) {
                let symbol = self.checker.getSymbolAtLocation((<ts.PropertyAccessExpression>node).name);

                //emit ref here
                self._emitRef(node, symbol);
            }

            else if (node.kind === ts.SyntaxKind.Identifier) {
                let id = <ts.Identifier>node;
                let symbol = self.checker.getSymbolAtLocation(id);
                if (!self._isDeclarationIdentifier(id)) {
                    //emit ref here

                    //get declaration and use its scope for path creation
                    self._emitRef(symbol.valueDeclaration, symbol, true);
                }
            } else {
                ts.forEachChild(node, _collectRefs);
            }
        }

        function _collectDefs(node: ts.Node) {
            switch (node.kind) {
                case ts.SyntaxKind.ClassDeclaration: {
                    let decl = <ts.ClassDeclaration>node;
                    let symbol = self.checker.getSymbolAtLocation(decl.name);
                    self.allDeclIds.push(decl.name);

                    //emit def here
                    self._emitDef(node, symbol, utils.DefKind.CLASS);
                    break;
                }
                case ts.SyntaxKind.InterfaceDeclaration: {
                    let decl = <ts.InterfaceDeclaration>node;
                    let symbol = self.checker.getSymbolAtLocation(decl.name);
                    self.allDeclIds.push(decl.name);

                    //emit def here
                    self._emitDef(node, symbol, utils.DefKind.INTERFACE);
                    break;
                }
                case ts.SyntaxKind.FunctionDeclaration: {
                    let decl = <ts.FunctionDeclaration>node;
                    let symbol = self.checker.getSymbolAtLocation(decl.name);
                    self.allDeclIds.push(decl.name);

                    //emit def here
                    self._emitDef(node, symbol, utils.DefKind.FUNC);
                    break;
                }
                case ts.SyntaxKind.MethodDeclaration: {
                    let decl = <ts.MethodDeclaration>node;
                    let symbol = self.checker.getSymbolAtLocation(decl.name);
                    self.allDeclIds.push(<ts.Identifier>decl.name);

                    //emit def here
                    self._emitDef(node, symbol, utils.DefKind.METHOD);
                    break;
                }
                case ts.SyntaxKind.VariableDeclaration: {
                    let decl = <ts.VariableDeclaration>node;
                    let symbol = self.checker.getSymbolAtLocation(decl.name);
                    self.allDeclIds.push(<ts.Identifier>decl.name);

                    //emit def here
                    self._emitDef(node, symbol, utils.DefKind.VAR);
                    break;
                }
                case ts.SyntaxKind.Parameter: {
                    let decl = <ts.ParameterDeclaration>node;
                    let symbol = self.checker.getSymbolAtLocation(decl.name);
                    self.allDeclIds.push(<ts.Identifier>decl.name);

                    //emit def here
                    self._emitDef(node, symbol, utils.DefKind.PARAM);
                    break;
                }
                case ts.SyntaxKind.PropertyDeclaration: {
                    let decl = <ts.PropertyDeclaration>node;
                    let symbol: ts.Symbol = self.checker.getSymbolAtLocation(decl.name);
                    self.allDeclIds.push(<ts.Identifier>decl.name);

                    //emit def here
                    self._emitDef(node, symbol, utils.DefKind.FIELD);
                    break;
                }
                case ts.SyntaxKind.PropertySignature: {
                    let decl = <ts.SignatureDeclaration>node;
                    let symbol: ts.Symbol = self.checker.getSymbolAtLocation(decl.name);

                    self.allDeclIds.push(<ts.Identifier>decl.name);

                    //emit def here
                    self._emitDef(node, symbol, utils.DefKind.FIELD);
                    break;
                }
            }
            ts.forEachChild(node, _collectDefs);
        }
    }

    private _isDeclarationIdentifier(id: ts.Identifier): boolean {
        for (const declId of this.allDeclIds) {
            if (declId.getStart() === id.getStart()
                && declId.getEnd() === id.getEnd()
                && declId.getSourceFile() === id.getSourceFile()) {
                return true;
            }
        }
        return false;
    }

    private _emitDef(node: ts.Node, symbol: ts.Symbol, kind: string) {
        //emitting def here
        var def: defs.Def = new defs.Def();
        def.Name = symbol.name;
        //def.Path = this.checker.getFullyQualifiedName(symbol);
        var scopeRes: string = this._getNamedScope(node.parent);
        def.Path = (scopeRes === "") ? symbol.name : scopeRes + utils.PATH_SEPARATOR + symbol.name;
        def.Kind = kind;
        def.File = node.getSourceFile().fileName;
        def.DefStart = node.getStart();
        def.DefEnd = node.getEnd();
        this.allObjects.Defs.push(def);
        // console.log(JSON.stringify(def));
        // console.log("-------------------");
    }

    //now declaration is provided as node here
    private _emitRef(node: ts.Node, symbol: ts.Symbol, defineScope: boolean = false) {
        //emitting ref here
        var ref: defs.Ref = new defs.Ref();
        if (defineScope) {
            var scopeRes: string = this._getNamedScope(node.parent);
            ref.DefPath = (scopeRes === "") ? symbol.name : scopeRes + utils.PATH_SEPARATOR + symbol.name;
        } else {
            ref.DefPath = this.checker.getFullyQualifiedName(symbol);
        }

        ref.File = node.getSourceFile().fileName;
        ref.Start = node.getStart();
        ref.End = node.getEnd();
        this.allObjects.Refs.push(ref);
        // console.log(JSON.stringify(ref));
        // console.log("-------------------");
    }

    private _getNamedScope(node: ts.Node, parentChain: string = ""): string {
        if (!node || node.kind === ts.SyntaxKind.SourceFile) {
            return parentChain;
        }

        switch (node.kind) {
            case ts.SyntaxKind.ModuleDeclaration: {
                let decl = <ts.ModuleDeclaration>node;
                let name = decl.name.text;
                let newChain = (parentChain === "") ? name : name + utils.PATH_SEPARATOR + parentChain;
                return this._getNamedScope(node.parent, newChain);
            }
            case ts.SyntaxKind.ClassDeclaration: {
                let decl = <ts.ClassDeclaration>node;
                let name = decl.name.getText();
                let newChain = (parentChain === "") ? name : name + utils.PATH_SEPARATOR + parentChain;
                return this._getNamedScope(node.parent, newChain);
            }
            case ts.SyntaxKind.InterfaceDeclaration: {
                let decl = <ts.InterfaceDeclaration>node;
                let name = decl.name.getText();
                let newChain = (parentChain === "") ? name : name + utils.PATH_SEPARATOR + parentChain;
                return this._getNamedScope(node.parent, newChain);
            }
            case ts.SyntaxKind.FunctionDeclaration: {
                let decl = <ts.FunctionDeclaration>node;
                let name = decl.name.getText();
                let newChain = (parentChain === "") ? name : name + utils.PATH_SEPARATOR + parentChain;
                return this._getNamedScope(node.parent, newChain);
            }
            case ts.SyntaxKind.MethodDeclaration: {
                let decl = <ts.MethodDeclaration>node;
                let name = decl.name.getText();
                let newChain = (parentChain === "") ? name : name + utils.PATH_SEPARATOR + parentChain;
                return this._getNamedScope(node.parent, newChain);
            }
            // case ts.SyntaxKind.VariableDeclaration: {
            //     let decl = <ts.VariableDeclaration>node;
            //     let init = decl.initializer;
            //     //used for defining refs for creation of interfaces for example
            //     if (init !== undefined && init.kind === ts.SyntaxKind.ObjectLiteralExpression) {
            //         let typeName = decl.type.getText();
            //         let newChain = (parentChain === "") ? typeName : typeName + utils.PATH_SEPARATOR + parentChain;
            //         return this._getNamedScope(node.parent, newChain);
            //     }
            // }
            default:
                return this._getNamedScope(node.parent, parentChain);
        }
    }
}
