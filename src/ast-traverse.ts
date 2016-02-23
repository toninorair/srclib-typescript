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

            //check whether it is actual source file for analysis
            //if (!sourceFile.hasNoDefaultLib) {
            if (self.program.getRootFileNames().indexOf(sourceFile.fileName) != -1) {
                // Walk the ast tree to search for defs
                ts.forEachChild(sourceFile, _collectDefs);
            }
        };

        //second pass - collecting all refs
        for (const sourceFile of this.program.getSourceFiles()) {
            var self = this;
            //check whether it is actual source file for analysis
            //if (!sourceFile.hasNoDefaultLib) {
            if (self.program.getRootFileNames().indexOf(sourceFile.fileName) != -1) {
                // Walk the ast tree to search for refs
                ts.forEachChild(sourceFile, _collectRefs);
            }
        };

        process.stdout.write(JSON.stringify(this.allObjects));

        function _collectRefs(node: ts.Node) {
            if (node.kind === ts.SyntaxKind.Identifier) {
                let id = <ts.Identifier>node;
                let symbol = self.checker.getSymbolAtLocation(id);
                if (!self._isDeclarationIdentifier(id)) {
                    if (symbol !== undefined) {
                        //emit ref here
                        if (symbol.valueDeclaration === undefined) {
                            console.error("VALUE DECLARATION FOR ID", id.text, "IS UNDEFINED");
                        }
                        if (symbol.declarations.length > 1) {
                            console.error("MORE THAN ONE DECLARATION FOR ID", id.text, "WAS FOUND")
                        }
                        //get all possible declarations
                        for (const decl of symbol.declarations) {
                            if (symbol.declarations.length > 1) {
                                console.error("DECL for symbol", symbol.name, " = ", decl.getText());
                            }
                            self._emitRef(decl, id, self._isBlockedScopeSymbol(symbol));
                        }
                    } else {
                        console.error("UNDEF SYMBOL", id.text);
                    }
                }
            }
            ts.forEachChild(node, _collectRefs);
        }

        function _collectDefs(node: ts.Node) {
            switch (node.kind) {
                case ts.SyntaxKind.ModuleDeclaration:
                case ts.SyntaxKind.ClassDeclaration:
                case ts.SyntaxKind.InterfaceDeclaration:
                case ts.SyntaxKind.EnumDeclaration:
                case ts.SyntaxKind.FunctionDeclaration:
                case ts.SyntaxKind.MethodDeclaration:
                case ts.SyntaxKind.ImportEqualsDeclaration:
                case ts.SyntaxKind.Parameter:
                case ts.SyntaxKind.EnumMember:
                case ts.SyntaxKind.PropertyDeclaration:
                //FOR INTERFACES
                case ts.SyntaxKind.PropertySignature:
                case ts.SyntaxKind.MethodSignature:
                    let decl = <ts.Declaration>node;
                    self.allDeclIds.push(<ts.Identifier>decl.name);

                    //emit def here
                    self._emitDef(decl);
                    break;

                case ts.SyntaxKind.VariableDeclaration: {
                    let decl = <ts.VariableDeclaration>node;
                    self.allDeclIds.push(<ts.Identifier>decl.name);
                    let symbol = self.checker.getSymbolAtLocation(decl.name);

                    //emit def here
                    self._emitDef(decl, self._isBlockedScopeSymbol(symbol));
                    break;
                }
            }
            ts.forEachChild(node, _collectDefs);
        }
    }

    private _isBlockedScopeSymbol(symbol: ts.Symbol): boolean {
        return (symbol.flags & ts.SymbolFlags.BlockScoped) != 0;
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

    private _getDeclarationKindName(kind: ts.SyntaxKind, fullName: boolean = false) {
        switch (kind) {
            case ts.SyntaxKind.ModuleDeclaration:
                return fullName ? utils.DefKind.MODULE : "module";
            case ts.SyntaxKind.ClassDeclaration:
                return fullName ? utils.DefKind.CLASS : "class";
            case ts.SyntaxKind.InterfaceDeclaration:
                return fullName ? utils.DefKind.INTERFACE : "interface";
            case ts.SyntaxKind.EnumDeclaration:
                return fullName ? utils.DefKind.ENUM : "enum";
            case ts.SyntaxKind.FunctionDeclaration:
                return fullName ? utils.DefKind.FUNC : "func";
            case ts.SyntaxKind.MethodDeclaration:
                return fullName ? utils.DefKind.METHOD : "method";
            case ts.SyntaxKind.VariableDeclaration:
                return fullName ? utils.DefKind.VAR : "var";
            case ts.SyntaxKind.ImportEqualsDeclaration:
                return fullName ? utils.DefKind.IMPORT_VAR : "var";
            case ts.SyntaxKind.Parameter:
                return fullName ? utils.DefKind.PARAM : "param";
            case ts.SyntaxKind.EnumMember:
                return fullName ? utils.DefKind.ENUM_MEMBER : "enum_val";
            case ts.SyntaxKind.PropertyDeclaration:
                return fullName ? utils.DefKind.FIELD : "field";
            //FOR INTERFACES
            case ts.SyntaxKind.PropertySignature:
                return fullName ? utils.DefKind.PROPERTY_SIGNATURE : "property_sig";
            case ts.SyntaxKind.MethodSignature:
                return fullName ? utils.DefKind.METHOD_SIGNATURE : "method_sig";
        }
    }

    private _emitDef(decl: ts.Declaration, blockedScope: boolean = false) {
        //emitting def here
        var def: defs.Def = new defs.Def();
        var id: ts.Identifier = <ts.Identifier>decl.name;
        def.Name = id.text;
        //def.Path = this.checker.getFullyQualifiedName(symbol);
        var scopeRes: string = this._getScopesChain(decl.parent, blockedScope);
        var declNameInScope: string = this._getScopeNameForDeclaration(decl);
        def.Path = (scopeRes === "") ? declNameInScope : scopeRes + utils.PATH_SEPARATOR + declNameInScope;
        def.Kind = this._getDeclarationKindName(decl.kind, true);
        def.File = decl.getSourceFile().fileName;
        def.DefStart = id.getStart();
        def.DefEnd = id.getEnd();
        this.allObjects.Defs.push(def);
        // console.log(JSON.stringify(def));
        // console.log("-------------------");
    }

    //now declaration is provided as node here
    private _emitRef(decl: ts.Declaration, id: ts.Identifier, blockedScope: boolean = false) {
        //emitting ref here
        var ref: defs.Ref = new defs.Ref();
        var scopeRes: string = this._getScopesChain(decl.parent, blockedScope);
        var declNameInScope: string = this._getScopeNameForDeclaration(decl);
        ref.DefPath = (scopeRes === "") ? declNameInScope : scopeRes + utils.PATH_SEPARATOR + declNameInScope;
        ref.File = id.getSourceFile().fileName;
        ref.Start = id.getStart();
        ref.End = id.getEnd();
        ref.End = id.getEnd();
        this.allObjects.Refs.push(ref);
        // console.log(JSON.stringify(ref));
        // console.log("-------------------");
    }

    private _getScopeNameForDeclaration(decl: ts.Declaration): string {
        switch (decl.kind) {
            case ts.SyntaxKind.MethodSignature:
                return utils.formFnSignatureForPath(decl.getText());
            default:
                return this._getDeclarationKindName(decl.kind) + "__" + (<ts.Identifier>decl.name).text;
        }
    }

    private _getScopesChain(node: ts.Node, blockedScope: boolean, parentChain: string = ""): string {
        if (!node || node.kind === ts.SyntaxKind.SourceFile) {
            return parentChain;
        }

        switch (node.kind) {
            case ts.SyntaxKind.ModuleDeclaration:
            case ts.SyntaxKind.ClassDeclaration:
            case ts.SyntaxKind.InterfaceDeclaration:
            case ts.SyntaxKind.EnumDeclaration:
            case ts.SyntaxKind.FunctionDeclaration:
            case ts.SyntaxKind.MethodDeclaration:
            case ts.SyntaxKind.PropertySignature:
            case ts.SyntaxKind.MethodSignature: {
                let decl = <ts.Declaration>node;
                let name = this._getScopeNameForDeclaration(decl);
                let newChain = (parentChain === "") ? name : name + utils.PATH_SEPARATOR + parentChain;
                return this._getScopesChain(node.parent, blockedScope, newChain);
            }

            //added for built-in interface initialization
            case ts.SyntaxKind.VariableDeclaration: {
                let decl = <ts.VariableDeclaration>node;
                let name = decl.type.getText();
                let newChain = (parentChain === "") ? name : name + utils.PATH_SEPARATOR + parentChain;
                return this._getScopesChain(node.parent, blockedScope, newChain);
            }
            case ts.SyntaxKind.Block: {
                if (blockedScope) {
                    let decl = <ts.Block>node;
                    let newChain: string = (parentChain === "") ? "" + decl.getStart() : decl.getStart() + utils.PATH_SEPARATOR + parentChain;
                    return this._getScopesChain(node.parent, blockedScope, newChain);
                }
            }
            default:
                return this._getScopesChain(node.parent, blockedScope, parentChain);
        }
    }
}
