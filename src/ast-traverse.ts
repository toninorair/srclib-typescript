///// <reference path="../typings/typescript/typescript.d.ts" />

import * as fs from "fs";
import * as ts from "typescript";
import * as path from "path";

import defs = require('./def-and-ref-template');
import utils = require('./utils');
import resolver = require('./module-resolver');

/**
 * Class is used for AST tree traversing and defs and refs emission
 */
export class ASTTraverse {
    /**
      * Instance of class which holds Defs, Refs and Docs data
      * @type {defs.RootObject}
    */
    private allObjects: defs.RootObject;
    /**
      * Instance of program object, created for given list of files
      * @type {ts.Program}
    */
    private program: ts.Program;
    /**
      * AST type checker for given program
      * @type {ts.TypeChecker}
    */
    private checker: ts.TypeChecker;
    /**
      * List of all identifiers in declarations,
      * prevents emissions of useless refs for declaration names
      * @type {Array<ts.Identifier>}
    */
    private allDeclIds: Array<ts.Identifier>;
    /**
      * Analyses and saves information about modules related to the given typescript files
      * @type {resolver.ModuleResolver}
    */
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

    /**
      * Traverses AST tree, emits defs and refs.
      * Contains 3 passes - 1-st - saving info about modules
      * 2-nd - emission of defs
      * 3-rd - emissions of refs
    */
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

        /**
          * Checks wheather given sourceFile is external or internal module
          * External module criteria (one is enough):
          * - contains at least one import declaration
          * - contains at least one export assignment
          * - contains at least one top level exported declaration of exac typescript
          * For more detailed info please check http://www.typescriptlang.org/Content/TypeScript%20Language%20Specification.pdf
          * @param  {ts.SourceFile}  sourceFile given typescript file
          * @param  {ts.TypeChecker} checker    project checker
          * @return {[type]}                    boolean value
        */
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

        /**
          * Saves all references, checks whether it is not declaration name
          * Emits only first declaration, emission of more than one declaration was disabled because
          * - src does not properly support it
          * - sometimes AST produce duplicate same declarations for reference
          * @param  {ts.Node} node - current node
          * @return {[type]}  void
        */
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
                        for (const decl of symbol.declarations.slice(0, 1)) {
                            if (decl.kind !== ts.SyntaxKind.SourceFile) {
                                self._emitRef(decl, id);
                            }
                        }
                    } else {
                        console.error("UNDEF SYMBOL", id.text, "IN FILE = ", node.getSourceFile().fileName);
                    }
                }
            }
            ts.forEachChild(node, _collectRefs);
        }

        /**
          * Collecting of defs happens here
          * @param  {ts.Node} node - current node
          * @return {[type]}       void
        */
        function _collectDefs(node: ts.Node) {
            switch (node.kind) {
                case ts.SyntaxKind.ModuleDeclaration: {
                    let decl = <ts.ModuleDeclaration>node;
                    self._addDeclarationIdentifier(decl);
                    break;
                }
                case ts.SyntaxKind.ImportDeclaration: {
                    let decl = <ts.ImportDeclaration>node;
                    if (decl.importClause !== undefined && decl.importClause.namedBindings !== undefined) {
                        let namedBindings = decl.importClause.namedBindings;
                        if (namedBindings.kind === ts.SyntaxKind.NamespaceImport) {
                            let namespaceImport = <ts.NamespaceImport>namedBindings;
                            self._addDeclarationIdentifier(namespaceImport);

                            //emit def here
                            self._emitDef(namespaceImport);

                        } else if (namedBindings.kind === ts.SyntaxKind.NamedImports) {
                            let namedImports = <ts.NamedImports>namedBindings;
                            for (const namedImport of namedImports.elements) {
                                self._addDeclarationIdentifier(namedImport);

                                //emit def here
                                self._emitDef(namedImport);
                            }
                        }
                    }
                    break;
                }
                case ts.SyntaxKind.VariableDeclaration: {
                    let decl = <ts.VariableDeclaration>node;
                    self._addDeclarationIdentifier(decl);
                    let symbol = self.checker.getSymbolAtLocation(decl.name);
                    if (symbol === undefined) {
                        console.error("UNDEFINED SYMBOL IN VAR DECL", decl.getText());
                        break;
                    }

                    //emit def here
                    self._emitDef(decl);
                    break;
                }
                case ts.SyntaxKind.SetAccessor:
                case ts.SyntaxKind.GetAccessor:
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
                case ts.SyntaxKind.ShorthandPropertyAssignment:
                case ts.SyntaxKind.ExportSpecifier:
                case ts.SyntaxKind.BindingElement:
                    let decl = <ts.Declaration>node;
                    self._addDeclarationIdentifier(decl);
                    //emit def here
                    self._emitDef(decl);
                    break;
            }
            ts.forEachChild(node, _collectDefs);
        }
    }

    /**
       * Emission of definition and fake ref for it
       * @param  {ts.Declaration} decl
       * @param  {boolean     =    false}       blockedScope - identifies if we add numbers for blocks
       * @return {[type]}              void
       */
    private _emitDef(decl: ts.Declaration) {
        if (decl.name === undefined || decl.name.kind !== ts.SyntaxKind.Identifier) {
            console.error("Cannot emit declaration, declaration name is absent or is not identifier", decl.getText());
            return;
        }

        //emitting def here
        var def: defs.Def = new defs.Def();
        var id: ts.Identifier = <ts.Identifier>decl.name;
        def.Name = id.text;

        //def.Path = this.checker.getFullyQualifiedName(symbol);
        var scopeRes: string = this._getScopesChain(decl.parent);
        var declNameInScope: string = this._getScopeNameForDeclaration(decl);
        def.Path = utils.formPath(scopeRes, declNameInScope, true);
        def.TreePath = def.Path;
        def.Kind = this._getDeclarationKindName(decl.kind, true);
        def.File = utils.normalizePath(decl.getSourceFile().fileName);
        def.DefStart = id.getStart();
        def.DefEnd = id.getEnd();


        //fill data field and comments
        let symbol = this.checker.getSymbolAtLocation(decl.name);
        def.Data = new defs.Data();
        if (symbol !== undefined) {
            def.Data.Type = this.checker.typeToString(this.checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration));
            var comments = symbol.getDocumentationComment();
            if (comments.length > 0) {
                var docRes = "";
                for (const comment of comments) {
                    docRes += comment.text + " ";
                }
                var doc: defs.Doc = new defs.Doc();
                doc.Path = def.Path;
                doc.Format = "";
                doc.Data = docRes.trim();
                this.allObjects.Docs.push(doc);
            }
        }

        def.Data.Keyword = this._getDeclarationKindName(decl.kind);
        def.Data.Kind = this._getDeclarationKindName(decl.kind, true);
        def.Data.Separator = utils.DATA_DOC_SEPARATOR;

        this.allObjects.Defs.push(def);

        //emit special ref with Def field set into true
        this._emitRef(decl, id, true);
        // console.error(JSON.stringify(def));
        // console.error("-------------------");
    }

    /**
      * Emission of ref happens here
      * @param  {ts.Declaration} decl
      * @param  {ts.Identifier}  id
      * @param  {boolean     =    false}       blockedScope  identifies if we add numbers for scopes
      * @param  {boolean     =    false}       definitionRef identifies if it is ref for definition name
      * @return {[type]}
     */
    private _emitRef(decl: ts.Declaration, id: ts.Identifier, definitionRef: boolean = false) {
        //emitting ref here
        var ref: defs.Ref = new defs.Ref();
        var scopeRes: string = this._getScopesChain(decl.parent);
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


    private _addDeclarationIdentifier(decl: ts.Declaration): void {
        if (decl.name !== undefined && decl.name.kind === ts.SyntaxKind.Identifier) {
            this.allDeclIds.push(<ts.Identifier>decl.name);
        } else {
            //console.error("Cannot add declaration, declaration name is absent or is not identifier", decl.getText());
        }
    }

    /**
     * Checks whether given identifier is declaration name identifier
     */
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

    /**
     * Gets kind for declaration - short or full, short for path, full - for definition info
     * @param  {ts.SyntaxKind} kind
     * @param  {boolean    =    false}       fullName
     * @return {[type]}
    */
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
            case ts.SyntaxKind.GetAccessor:
                return fullName ? utils.DefKind.GET_ACCESSOR : "get_accessor";
            case ts.SyntaxKind.SetAccessor:
                return fullName ? utils.DefKind.SET_ACCESSOR : "set_accessor";
            case ts.SyntaxKind.ShorthandPropertyAssignment:
                return fullName ? "prop_assign" : "prop_assign";
            case ts.SyntaxKind.BindingElement:
                return fullName ? "binding_element" : "binding_element";
            default:
                console.error("UNDEFINED KIND = ", kind);
        }
    }

    /**
     * Gets declaration name for path
     * @param  {ts.Declaration} decl
     * @return {string}              declaration name
    */
    private _getScopeNameForDeclaration(decl: ts.Declaration): string {
        switch (decl.kind) {
            case ts.SyntaxKind.MethodSignature:
            case ts.SyntaxKind.MethodDeclaration: {
                return this._getDeclarationKindName(decl.kind) + "__" + utils.formFnSignatureForPath(decl) +
                    "__" + decl.getStart() + "__" + this.program.getSourceFiles().indexOf(decl.getSourceFile());
            }
            default:
                if (this._getDeclarationKindName(decl.kind) === undefined) {
                    console.error("UNDEFINED KIND FOR DECL = ", decl.getText(), "IN SRC FILE = ", decl.getSourceFile().fileName);
                }
                if (decl.name !== undefined && decl.name.kind === ts.SyntaxKind.Identifier) {
                    return this._getDeclarationKindName(decl.kind) + "__" + (<ts.Identifier>decl.name).text +
                        "__" + decl.getStart() + "__" + this.program.getSourceFiles().indexOf(decl.getSourceFile());
                } else {
                    console.error("UNDEFINED NAME or NAME IS NOT IDENTIFIER!!!!", decl.getText());
                    return this._getDeclarationKindName(decl.kind) +
                        "__" + decl.getStart() + "__" + this.program.getSourceFiles().indexOf(decl.getSourceFile());
                }
        }
    }

    /**
     * Gets declaration scope path
    */
    private _getScopesChain(node: ts.Node, parentChain: string = ""): string {
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
                    return this._getScopesChain(node.parent, newChain);
                }
            }
            case ts.SyntaxKind.VariableDeclaration:
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
                return this._getScopesChain(node.parent, newChain);
            }
            default:
                return this._getScopesChain(node.parent, parentChain);
        }
    }
}
