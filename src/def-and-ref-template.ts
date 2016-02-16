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
    File: string;
    Start: number;
    End: number;
}

export class RootObject {
    constructor() {
      this.Defs = new Array<Def>();
      this.Refs = new Array<Ref>();
    }
    Defs: Array<Def>;
    Refs: Array<Ref>;
}
