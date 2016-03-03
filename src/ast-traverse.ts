///// <reference path="../typings/typescript/typescript.d.ts" />

import * as fs from "fs";
import * as ts from "typescript";
import * as path from "path";

import defs = require('./def-and-ref-template');
import utils = require('./utils');
import resolver = require('./module-resolver');

export class ASTTraverse {

    private allObjects: defs.RootObject;
    private program: ts.Program;
    private checker: ts.TypeChecker;
    private allDeclIds: Array<ts.Identifier>;
    private moduleResolver: resolver.ModuleResolver;

    constructor(fileNames: string[]) {
        this.program = ts.createProgram(fileNames, {
            target: ts.ScriptTarget.ES5, module: ts.ModuleKind.CommonJS
        });
        // Get the checker, we will use it to find more about classes
        this.checker = this.program.getTypeChecker();

        //initialize def/ref storage
        this.allObjects = new defs.RootObject();

        this.allDeclIds = new Array<ts.Identifier>();

        this.moduleResolver = new resolver.ModuleResolver();
    }

    traverse() {

        for (const sourceFile of this.program.getSourceFiles()) {
            var self = this;
            if (!sourceFile.hasNoDefaultLib) {
                // console.error("SOURCE FILE = ", sourceFile.fileName);
                // if (self.program.getRootFileNames().indexOf(sourceFile.fileName) != -1) {
                //     console.error("SOURCE FILE2 = ", sourceFile.fileName);
                // }
                let fileName: string = path.parse(sourceFile.fileName).name;
                self.moduleResolver.addModule(fileName, _isExternalModule(sourceFile, self.checker));
            }
        };

        //firts pass - collecting all defs
        for (const sourceFile of this.program.getSourceFiles()) {
            var self = this;

            //check whether it is actual source file for analysis
            if (!sourceFile.hasNoDefaultLib) {
                //if (self.program.getRootFileNames().indexOf(sourceFile.fileName) != -1) {
                // Walk the ast tree to search for defs
                ts.forEachChild(sourceFile, _collectDefs);
            }
        };

        // //second pass - collecting all refs
        for (const sourceFile of this.program.getSourceFiles()) {
            var self = this;
            //check whether it is actual source file for analysis
            if (!sourceFile.hasNoDefaultLib) {
                //if (self.program.getRootFileNames().indexOf(sourceFile.fileName) != -1) {
                // Walk the ast tree to search for refs
                ts.forEachChild(sourceFile, _collectRefs);
            }
        };

        process.stdout.write(JSON.stringify(this.allObjects));

        function _isExternalModule(sourceFile: ts.SourceFile, checker: ts.TypeChecker) {
            let res = ts.forEachChild(sourceFile, node => {
                switch (node.kind) {
                    case ts.SyntaxKind.ExportAssignment:
                    case ts.SyntaxKind.ImportDeclaration:
                        return true;
                    case ts.SyntaxKind.ImportEqualsDeclaration:
                        let reference = (<ts.ImportEqualsDeclaration>node).moduleReference;
                        if (reference.kind === ts.SyntaxKind.ExternalModuleReference) {
                            return true;
                        }
                        break;
                    //TODO check variable statement here
                    case ts.SyntaxKind.VariableStatement:
                    case ts.SyntaxKind.VariableDeclaration:
                    case ts.SyntaxKind.FunctionDeclaration:
                    case ts.SyntaxKind.ClassDeclaration:
                    case ts.SyntaxKind.InterfaceDeclaration:
                    case ts.SyntaxKind.TypeAliasDeclaration:
                    case ts.SyntaxKind.EnumDeclaration:
                    case ts.SyntaxKind.ModuleDeclaration:
                    case ts.SyntaxKind.ImportDeclaration:
                        // case ts.SyntaxKind.AmbientDeclaration:
                        if (self._isExportedNode(node)) {
                            return true;
                        }
                        break;
                }
            });
            return res !== undefined;
        }

        function _collectRefs(node: ts.Node) {
            if (node.kind === ts.SyntaxKind.Identifier) {
                let id = <ts.Identifier>node;
                let symbol = self.checker.getSymbolAtLocation(id);

                if (!self._isDeclarationIdentifier(id)) {
                    if (symbol !== undefined && symbol.declarations !== undefined) {
                        // if (symbol.valueDeclaration === undefined) {
                        //     console.error("VALUE DECLARATION FOR ID", id.text, "IS UNDEFINED");
                        // }
                        // if (symbol.declarations.length > 1) {
                        //     console.error("MORE THAN ONE DECLARATION FOR ID", id.text, "WAS FOUND")
                        // }
                        //get all possible declarations and emit refs here
                        for (const decl of symbol.declarations) {
                            self._emitRef(decl, id, self._isBlockedScopeSymbol(symbol));
                        }
                    } else {
                        console.error("UNDEF SYMBOL", id.text, "IN FILE = ", node.getSourceFile().fileName);
                    }
                }
            }
            ts.forEachChild(node, _collectRefs);
        }

        function _collectDefs(node: ts.Node) {
            switch (node.kind) {
                case ts.SyntaxKind.ModuleDeclaration: {
                    let decl = <ts.Declaration>node;
                    self.allDeclIds.push(<ts.Identifier>decl.name);
                    break;
                }
                case ts.SyntaxKind.ImportDeclaration: {
                    let decl = <ts.ImportDeclaration>node;
                    if (decl.importClause !== undefined && decl.importClause.namedBindings !== undefined) {
                        let namedBindings = decl.importClause.namedBindings;
                        if (namedBindings.kind === ts.SyntaxKind.NamespaceImport) {
                            let namespaceImport = <ts.NamespaceImport>namedBindings;
                            self.allDeclIds.push(<ts.Identifier>namespaceImport.name);

                            //emit def here
                            self._emitDef(namespaceImport);

                        } else if (namedBindings.kind === ts.SyntaxKind.NamedImports) {
                            let namedImports = <ts.NamedImports>namedBindings;
                            for (const namedImport of namedImports.elements) {
                                self.allDeclIds.push(<ts.Identifier>namedImport.name);

                                //emit def here
                                self._emitDef(namedImport);
                            }
                        }
                    }
                    break;
                }
                case ts.SyntaxKind.VariableDeclaration: {
                    let decl = <ts.VariableDeclaration>node;
                    self.allDeclIds.push(<ts.Identifier>decl.name);
                    let symbol = self.checker.getSymbolAtLocation(decl.name);
                    if (symbol === undefined) {
                        console.error("UNDEFINED SYMBOL IN VAR DECL");
                        break;
                    }

                    //emit def here
                    self._emitDef(decl, self._isBlockedScopeSymbol(symbol));
                    break;
                }
                case ts.SyntaxKind.ClassDeclaration:
                case ts.SyntaxKind.InterfaceDeclaration:
                case ts.SyntaxKind.EnumDeclaration:
                case ts.SyntaxKind.FunctionDeclaration:
                case ts.SyntaxKind.MethodDeclaration:
                case ts.SyntaxKind.ImportEqualsDeclaration:
                case ts.SyntaxKind.Parameter:
                case ts.SyntaxKind.TypeParameter:
                case ts.SyntaxKind.EnumMember:
                case ts.SyntaxKind.PropertyDeclaration:
                //FOR INTERFACES
                case ts.SyntaxKind.PropertySignature:
                case ts.SyntaxKind.TypeAliasDeclaration:
                case ts.SyntaxKind.MethodSignature:
                case ts.SyntaxKind.ExportSpecifier:
                    let decl = <ts.Declaration>node;
                    self.allDeclIds.push(<ts.Identifier>decl.name);

                    //emit def here
                    self._emitDef(decl);
                    break;
            }
            ts.forEachChild(node, _collectDefs);
        }
    }

    private _emitDef(decl: ts.Declaration, blockedScope: boolean = false) {
        //emitting def here
        var def: defs.Def = new defs.Def();
        var id: ts.Identifier = <ts.Identifier>decl.name;
        def.Name = id.text;
        let symbol = this.checker.getSymbolAtLocation(decl.name);

        //fill data field
        def.Data = new defs.Data();
        if (symbol !== undefined) {
            def.Data.Type = this.checker.typeToString(this.checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration));
        }
        def.Data.Keyword = this._getDeclarationKindName(decl.kind);
        def.Data.Kind = this._getDeclarationKindName(decl.kind, true);
        def.Data.Separator = utils.DATA_DOC_SEPARATOR;

        //def.Path = this.checker.getFullyQualifiedName(symbol);
        var scopeRes: string = this._getScopesChain(decl.parent, blockedScope);
        var declNameInScope: string = this._getScopeNameForDeclaration(decl);
        def.Path = utils.formPath(scopeRes, declNameInScope, true);
        def.TreePath = def.Path;
        def.Kind = this._getDeclarationKindName(decl.kind, true);
        def.File = utils.normalizePath(decl.getSourceFile().fileName);
        def.DefStart = id.getStart();
        def.DefEnd = id.getEnd();
        this.allObjects.Defs.push(def);

        //emit special ref with Def field set into true
        this._emitRef(decl, id, blockedScope, true);
        // console.error(JSON.stringify(def));
        // console.error("-------------------");
    }

    //now declaration is provided as node here
    private _emitRef(decl: ts.Declaration, id: ts.Identifier, blockedScope: boolean = false, definitionRef: boolean = false) {
        //emitting ref here
        var ref: defs.Ref = new defs.Ref();
        var scopeRes: string = this._getScopesChain(decl.parent, blockedScope);
        var declNameInScope: string = this._getScopeNameForDeclaration(decl);
        ref.DefPath = utils.formPath(scopeRes, declNameInScope, true);
        ref.File = utils.normalizePath(id.getSourceFile().fileName);
        ref.Start = id.getStart();
        ref.End = id.getEnd();
        ref.End = id.getEnd();
        //optional field, set only for definition refs
        if (definitionRef) {
            ref.Def = true;
        }
        this.allObjects.Refs.push(ref);
        // console.error(JSON.stringify(ref));
        // console.error("-------------------");
    }

    private _isBlockedScopeSymbol(symbol: ts.Symbol): boolean {
        return (symbol.flags & ts.SymbolFlags.BlockScoped) != 0;
    }

    private _isExportedNode(node: ts.Node): boolean {
        return (node.flags & ts.NodeFlags.Export) != 0;
    }

    private _isInterfaceType(type: ts.Type): boolean {
        return (type.flags & ts.TypeFlags.Interface) != 0;
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
            case ts.SyntaxKind.NamespaceImport:
            case ts.SyntaxKind.ImportSpecifier:
                return fullName ? utils.DefKind.IMPORT_VAR : "import_var";
            case ts.SyntaxKind.Parameter:
                return fullName ? utils.DefKind.PARAM : "param";
            case ts.SyntaxKind.TypeParameter:
                return fullName ? utils.DefKind.TYPE_PARAM : "type_param";
            case ts.SyntaxKind.EnumMember:
                return fullName ? utils.DefKind.ENUM_MEMBER : "enum_val";
            case ts.SyntaxKind.PropertyDeclaration:
                return fullName ? utils.DefKind.FIELD : "field";
            //FOR INTERFACES
            case ts.SyntaxKind.PropertySignature:
                return fullName ? utils.DefKind.PROPERTY_SIGNATURE : "property_sig";
            case ts.SyntaxKind.MethodSignature:
                return fullName ? utils.DefKind.METHOD_SIGNATURE : "method_sig";
            case ts.SyntaxKind.PropertyAssignment:
                return fullName ? utils.DefKind.PROPERTY_SIGNATURE : "property_sig";
            case ts.SyntaxKind.TypeAliasDeclaration:
                return fullName ? utils.DefKind.TYPE_ALIAS : "type_alias";
            case ts.SyntaxKind.ExportSpecifier:
                return fullName ? utils.DefKind.EXPORT_SPECIFIER : "exported_name";
            default:
                console.error("UNDEFINED KIND = ", kind);
        }
    }

    private _getScopeNameForDeclaration(decl: ts.Declaration): string {
        switch (decl.kind) {
            case ts.SyntaxKind.MethodSignature:
            case ts.SyntaxKind.MethodDeclaration: {
                return this._getDeclarationKindName(decl.kind) + "__" + utils.formFnSignatureForPath(decl);
            }
            default:
                if (this._getDeclarationKindName(decl.kind) === undefined) {
                    console.error("UNDEFINED KIND FOR DECL = ", decl.getText(), "IN SRC FILE = ", decl.getSourceFile().fileName);
                }
                return this._getDeclarationKindName(decl.kind) + "__" + (<ts.Identifier>decl.name).text +
                    "__" + decl.getStart() + "__" + this.program.getSourceFiles().indexOf(decl.getSourceFile());
        }
    }

    private _getScopesChain(node: ts.Node, blockedScope: boolean, parentChain: string = ""): string {
        if (node.kind === ts.SyntaxKind.SourceFile) {
            let fileName: string = path.parse(node.getSourceFile().fileName).name;
            let moduleName: string = this.moduleResolver.getModule(fileName);
            return utils.formPath(parentChain, moduleName);
        }

        switch (node.kind) {
            case ts.SyntaxKind.ModuleDeclaration: {
                let decl = <ts.ModuleDeclaration>node;
                //we found external ambient module here
                if (decl.name.kind === ts.SyntaxKind.StringLiteral) {
                    return utils.formPath(parentChain, this.moduleResolver.formModuleName(decl.name.text));
                } else {
                    let name = this._getScopeNameForDeclaration(decl);
                    let newChain = utils.formPath(parentChain, name);
                    return this._getScopesChain(node.parent, blockedScope, newChain);
                }
            }
            case ts.SyntaxKind.VariableDeclaration: {
                let decl = <ts.VariableDeclaration>node;
                let symbol = this.checker.getSymbolAtLocation(decl.name);
                if (symbol !== undefined) {
                    let type = this.checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration);
                    if (type !== undefined && type.symbol !== undefined && type.symbol.declarations !== undefined) {
                        let name = this._isInterfaceType(type) ? this._getScopeNameForDeclaration(type.symbol.declarations[0])
                            : this._getScopeNameForDeclaration(decl);
                        let newChain = utils.formPath(parentChain, name);
                        return this._getScopesChain(node.parent, blockedScope, newChain);
                    }
                }
            }
            case ts.SyntaxKind.ClassDeclaration:
            case ts.SyntaxKind.InterfaceDeclaration:
            case ts.SyntaxKind.EnumDeclaration:
            case ts.SyntaxKind.FunctionDeclaration:
            case ts.SyntaxKind.MethodDeclaration:
            case ts.SyntaxKind.VariableDeclaration:
            case ts.SyntaxKind.PropertySignature:
            case ts.SyntaxKind.MethodSignature: {
                let decl = <ts.Declaration>node;
                let name = this._getScopeNameForDeclaration(decl);
                let newChain = utils.formPath(parentChain, name);
                return this._getScopesChain(node.parent, blockedScope, newChain);
            }
            case ts.SyntaxKind.Block: {
                if (blockedScope) {
                    let decl = <ts.Block>node;
                    let newChain = utils.formPath(parentChain, decl.getStart());
                    return this._getScopesChain(node.parent, blockedScope, newChain);
                }
            }
            default:
                return this._getScopesChain(node.parent, blockedScope, parentChain);
        }
    }
}
