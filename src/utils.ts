import * as path from "path";
import * as ts from "typescript";

export class DefKind {
    static CLASS: string = "class";
    static FUNC: string = "function";
    static METHOD: string = "method";
    static VAR: string = "var";
    static PARAM: string = "param";
    static FIELD: string = "property";
    static INTERFACE: string = "interface";
    static ENUM: string = "enum";
    static ENUM_MEMBER: string = "enum member";
    static PROPERTY_SIGNATURE = "property signature";
    static METHOD_SIGNATURE = "method signature";
    static MODULE = "module";
    static IMPORT_VAR = "imported var"
}
export function formFnSignatureForPath(decl: ts.Declaration): string {
    let resStr = decl.name.getText() + "__";
    let signDecl = <ts.SignatureDeclaration>decl;
    for (const param of signDecl.parameters) {
        resStr = resStr + "__" + param.getText();
    }
    //add return type here
    if (signDecl.type !== undefined) {
        resStr = resStr + signDecl.type.getText();
    }
    return replaceSpecialSymbols(resStr);
}

function replaceSpecialSymbols(sig: string): string {
    return sig.trim().replace(/;\s*/g, "").replace(/:\s*/g, "_").replace(/ \s*/g, "").
        replace(/=>\s*/g, "_").replace(/<\s*/g, "_").replace(/>\s*/g, "_").
        replace(/\?\s*/g, "_").replace(/\(\s*/g, "_").replace(/\)\s*/g, "_").
        replace(/\|\s*/g, "_");
}

export var PATH_SEPARATOR: string = ".";

export var DATA_DOC_SEPARATOR: string = " ";

export function formPath(scope: string, element, addToTheEnd: boolean = false): string {
    if (addToTheEnd) {
        return (scope === "") ? element : scope + PATH_SEPARATOR + element;
    } else {
        return (scope === "") ? element : element + PATH_SEPARATOR + scope;
    }
}

export function normalizePath(file: string): string {
    return path.relative('', file).
        replace(new RegExp('\\' + path.sep, 'g'), path.posix.sep);
}
