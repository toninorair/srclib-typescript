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
export function formFnSignatureForPath(sig: string): string {
    //check whether it is method with implementation
    if (sig.indexOf('{') !== -1) {
        sig = sig.substring(0, sig.indexOf('{'));
    }
    return sig.trim().replace(/;\s*/g, "").replace(/:\s*/g, "_").replace(/ \s*/g, "");
}

export var PATH_SEPARATOR: string = ".";

export function formPath(scope: string, element, addToTheEnd: boolean = false): string {
    if (addToTheEnd) {
        return (scope === "") ? element : scope + PATH_SEPARATOR + element;
    } else {
        return (scope === "") ? element : element + PATH_SEPARATOR + scope;
    }
}
