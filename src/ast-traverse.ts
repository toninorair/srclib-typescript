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
            if (node.kind === ts.SyntaxKind.Identifier) {
                let id = <ts.Identifier>node;
                let symbol = self.checker.getSymbolAtLocation(id);
                if (!self._isDeclarationIdentifier(id)) {
                    if (symbol !== undefined) {
                        //emit ref here
                        if (symbol.valueDeclaration === undefined) {
                            console.log("VALUE DECLARATION FOR ID", id.text, "IS UNDEFINED");
                        }
                        if (symbol.declarations.length > 1) {
                            console.log("MORE THAN ONE DECLARATION FOR ID", id.text, "WAS FOUND")
                        }
                        //get all possible declarations
                        for (const decl of symbol.declarations) {
                            if (symbol.flags & ts.SymbolFlags.BlockScoped) {
                                self._emitRef(decl, id, true);
                            } else {
                                self._emitRef(decl, id, false);
                            }
                        }
                    } else {
                        console.log("UNDEF SYMBOL", id.text);
                    }
                }
            }
            ts.forEachChild(node, _collectRefs);
        }

        function _collectDefs(node: ts.Node) {
            switch (node.kind) {
                case ts.SyntaxKind.ClassDeclaration: {
                    let decl = <ts.ClassDeclaration>node;
                    self.allDeclIds.push(decl.name);

                    //emit def here
                    self._emitDef(decl, utils.DefKind.CLASS);
                    break;
                }
                case ts.SyntaxKind.InterfaceDeclaration: {
                    let decl = <ts.InterfaceDeclaration>node;
                    self.allDeclIds.push(decl.name);

                    //emit def here
                    self._emitDef(decl, utils.DefKind.INTERFACE);
                    break;
                }
                case ts.SyntaxKind.EnumDeclaration: {
                    let decl = <ts.EnumDeclaration>node;
                    self.allDeclIds.push(decl.name);

                    //emit def here
                    self._emitDef(decl, utils.DefKind.ENUM);
                    break;
                }
                case ts.SyntaxKind.FunctionDeclaration: {
                    let decl = <ts.FunctionDeclaration>node;
                    self.allDeclIds.push(decl.name);

                    //emit def here
                    self._emitDef(decl, utils.DefKind.FUNC);
                    break;
                }
                case ts.SyntaxKind.MethodDeclaration: {
                    let decl = <ts.MethodDeclaration>node;
                    self.allDeclIds.push(<ts.Identifier>decl.name);

                    //emit def here
                    self._emitDef(decl, utils.DefKind.METHOD);
                    break;
                }
                case ts.SyntaxKind.VariableDeclaration: {
                    let decl = <ts.VariableDeclaration>node;
                    self.allDeclIds.push(<ts.Identifier>decl.name);
                    let symbol = self.checker.getSymbolAtLocation(decl.name);

                    //emit def here
                    if (symbol.flags & ts.SymbolFlags.BlockScopedVariable) {
                        self._emitDef(decl, utils.DefKind.VAR, true);
                    } else {
                        self._emitDef(decl, utils.DefKind.VAR);
                    }
                    break;
                }
                case ts.SyntaxKind.Parameter: {
                    let decl = <ts.ParameterDeclaration>node;
                    self.allDeclIds.push(<ts.Identifier>decl.name);

                    //emit def here
                    self._emitDef(decl, utils.DefKind.PARAM);
                    break;
                }
                case ts.SyntaxKind.EnumMember: {
                    let decl = <ts.EnumMember>node;
                    self.allDeclIds.push(<ts.Identifier>decl.name);

                    //emit def here
                    self._emitDef(decl, utils.DefKind.ENUM_MEMBER);
                    break;
                }
                case ts.SyntaxKind.PropertyDeclaration: {
                    let decl = <ts.PropertyDeclaration>node;
                    self.allDeclIds.push(<ts.Identifier>decl.name);

                    //emit def here
                    self._emitDef(decl, utils.DefKind.FIELD);
                    break;
                }
                //FOR INTERFACES
                case ts.SyntaxKind.PropertySignature: {
                    let decl = <ts.SignatureDeclaration>node;
                    self.allDeclIds.push(<ts.Identifier>decl.name);

                    //emit def here
                    self._emitDef(decl, utils.DefKind.PROPERTY_SIGNATURE);
                    break;
                }
                case ts.SyntaxKind.MethodSignature: {
                    let decl = <ts.SignatureDeclaration>node;
                    self.allDeclIds.push(<ts.Identifier>decl.name);

                    //emit def here
                    self._emitDef(decl, utils.DefKind.METHOD_SIGNATURE);
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

    private _emitDef(node: ts.Declaration, kind: string, blockedScope: boolean = false) {
        //emitting def here
        var def: defs.Def = new defs.Def();
        def.Name = (<ts.Identifier>node.name).text;
        //def.Path = this.checker.getFullyQualifiedName(symbol);
        var scopeRes: string = this._getNamedScope(node.parent, "", blockedScope);
        var nameForScope: string = this._getScopeNameForDeclaration(node);
        def.Path = (scopeRes === "") ? nameForScope : scopeRes + utils.PATH_SEPARATOR + nameForScope;
        def.Kind = kind;
        def.File = node.getSourceFile().fileName;
        def.DefStart = node.getStart();
        def.DefEnd = node.getEnd();
        this.allObjects.Defs.push(def);
        console.log(JSON.stringify(def));
        console.log("-------------------");
    }

    //now declaration is provided as node here
    private _emitRef(node: ts.Declaration, id: ts.Identifier, blockedScope: boolean) {
        //emitting ref here
        var ref: defs.Ref = new defs.Ref();
        var scopeRes: string = this._getNamedScope(node.parent, "", blockedScope);
        var nameForScope: string = this._getScopeNameForDeclaration(node);
        ref.DefPath = (scopeRes === "") ? nameForScope : scopeRes + utils.PATH_SEPARATOR + nameForScope;
        ref.File = id.getSourceFile().fileName;
        ref.Start = id.getStart();
        ref.End = id.getEnd();
        this.allObjects.Refs.push(ref);
        console.log(JSON.stringify(ref));
        console.log("-------------------");
    }

    private _getScopeNameForDeclaration(decl: ts.Declaration): string {
        switch (decl.kind) {
            case ts.SyntaxKind.MethodSignature:
                return utils.formFnSignatureForPath(decl.getText());
            default:
                return (<ts.Identifier>decl.name).text;
        }
    }

    private _getNamedScope(node: ts.Node, parentChain: string = "", blockedScope: boolean = false): string {
        if (!node || node.kind === ts.SyntaxKind.SourceFile) {
            return parentChain;
        }

        switch (node.kind) {
            case ts.SyntaxKind.ModuleDeclaration: {
                let decl = <ts.ModuleDeclaration>node;
                let name = this._getScopeNameForDeclaration(decl);
                let newChain = (parentChain === "") ? name : name + utils.PATH_SEPARATOR + parentChain;
                return this._getNamedScope(node.parent, newChain, blockedScope);
            }
            case ts.SyntaxKind.ClassDeclaration: {
                let decl = <ts.ClassDeclaration>node;
                let name = this._getScopeNameForDeclaration(decl);
                let newChain = (parentChain === "") ? name : name + utils.PATH_SEPARATOR + parentChain;
                return this._getNamedScope(node.parent, newChain, blockedScope);
            }
            case ts.SyntaxKind.InterfaceDeclaration: {
                let decl = <ts.InterfaceDeclaration>node;
                let name = this._getScopeNameForDeclaration(decl);
                let newChain = (parentChain === "") ? name : name + utils.PATH_SEPARATOR + parentChain;
                return this._getNamedScope(node.parent, newChain, blockedScope);
            }
            case ts.SyntaxKind.EnumDeclaration: {
                let decl = <ts.EnumDeclaration>node;
                let name = this._getScopeNameForDeclaration(decl);
                let newChain = (parentChain === "") ? name : name + utils.PATH_SEPARATOR + parentChain;
                return this._getNamedScope(node.parent, newChain, blockedScope);
            }
            case ts.SyntaxKind.FunctionDeclaration: {
                let decl = <ts.FunctionDeclaration>node;
                let name = this._getScopeNameForDeclaration(decl);
                let newChain = (parentChain === "") ? name : name + utils.PATH_SEPARATOR + parentChain;
                return this._getNamedScope(node.parent, newChain, blockedScope);
            }
            case ts.SyntaxKind.MethodDeclaration: {
                let decl = <ts.MethodDeclaration>node;
                let name = this._getScopeNameForDeclaration(decl);
                let newChain = (parentChain === "") ? name : name + utils.PATH_SEPARATOR + parentChain;
                return this._getNamedScope(node.parent, newChain, blockedScope);
            }
            case ts.SyntaxKind.PropertySignature: {
                let decl = <ts.SignatureDeclaration>node;
                let name = this._getScopeNameForDeclaration(decl);
                let newChain = (parentChain === "") ? name : name + utils.PATH_SEPARATOR + parentChain;
                return this._getNamedScope(node.parent, newChain, blockedScope);
            }
            case ts.SyntaxKind.MethodSignature: {
                let decl = <ts.SignatureDeclaration>node;
                let name = this._getScopeNameForDeclaration(decl);
                let newChain = (parentChain === "") ? name : name + utils.PATH_SEPARATOR + parentChain;
                return this._getNamedScope(node.parent, newChain, blockedScope);
            }
            //added for built-in initialization
            case ts.SyntaxKind.VariableDeclaration: {
                let decl = <ts.VariableDeclaration>node;
                let name = decl.type.getText();
                let newChain = (parentChain === "") ? name : name + utils.PATH_SEPARATOR + parentChain;
                return this._getNamedScope(node.parent, newChain, blockedScope);
            }
            case ts.SyntaxKind.Block: {
                if (blockedScope) {
                    let decl = <ts.Block>node;
                    let newChain: string = (parentChain === "") ? "" + decl.getStart() : decl.getStart() + utils.PATH_SEPARATOR + parentChain;
                    return this._getNamedScope(node.parent, newChain, blockedScope);
                }
            }
            default:
                return this._getNamedScope(node.parent, parentChain, blockedScope);
        }
    }
}
