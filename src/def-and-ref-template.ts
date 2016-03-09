/**
 * Data template for Def object
 */
export class Data {
    Type: string;
    Keyword: string;
    Kind: string;
    Separator: string;
}

/**
 * General Def template
 */
export class Def {
    Path: string;
    Name: string;
    Kind: string;
    File: string;
    DefStart: number;
    DefEnd: number;
    Data: Data;
    TreePath: string;
}

/**
 * General Ref template
 */
export class Ref {
    DefPath: string;
    Def: boolean;
    File: string;
    Start: number;
    End: number;
}

/**
 * General Doc template for toolchain
 */
export class Doc {
    Path: string;
    Format: string;
    Data: string;
}

/**
 * Container of all defs, refs, docs data
 */
export class RootObject {
    constructor() {
        this.Defs = new Array<Def>();
        this.Refs = new Array<Ref>();
        this.Docs = new Array<Doc>();
    }
    Defs: Array<Def>;
    Refs: Array<Ref>;
    Docs: Array<Doc>;
}
