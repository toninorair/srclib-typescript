export class Data {
    Type: string;
    Keyword: string;
    Kind: string;
    Separator: string;
}

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

export class Ref {
    DefPath: string;
    Def: boolean;
    File: string;
    Start: number;
    End: number;
}

export class Doc {
    Path: string;
    Format: string;
    Data: string;
}

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
