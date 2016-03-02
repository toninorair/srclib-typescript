# Sourcegraph TypeScript toolchain 

## Unsupported features:
1. Type declarations and type reference;
2. Getters and setters for properties;
3. Builtin for interfaces are partially supported:
3.1 supported for field properties:

interface Foo {
    name1: string;
}
let foo1: Foo = { name1: "1" };

3.2 unsupported for call signatures:

interface Foo1 {
    bar: {
        (s: string): string;
        //(n: number): string;
    }
}
var foo_inst: Foo1 = { bar(s: string): string { return "1"; } }

## Toolchain tested on:
1. https://github.com/antonina-cherednichenko/srclib-typescript
2. line-chart - https://github.com/n3-charts/line-chart
3. https://github.com/sgtest/typescript-test
4. https://github.com/Microsoft/TypeScriptSamples


