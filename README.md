# Sourcegraph TypeScript toolchain 

## Unsupported features:
* Type declarations and type reference
* Getters and setters for properties
* Builtin for interfaces are partially supported:
** supported for field properties:

interface Foo {
    name1: string;
}
let foo1: Foo = { name1: "1" };

** unsupported for call signatures:

interface Foo1 {
    bar: {
        (s: string): string;
        //(n: number): string;
    }
}
var foo_inst: Foo1 = { bar(s: string): string { return "1"; } }


