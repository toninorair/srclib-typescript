# Sourcegraph TypeScript toolchain 

## Unsupported features:
1. Type declarations and type reference;
2. Getters and setters for properties;
3. Builtin for interfaces are partially supported:
* supported for field properties:

```typescript
interface Foo {
    name1: string;
}
let foo1: Foo = { name1: "1" };
```

* unsupported for call signatures:

```typescript
interface Foo1 {
    bar: {
        (s: string): string;
        //(n: number): string;
    }
}
var foo_inst: Foo1 = { bar(s: string): string { return "1"; } }
```

## Toolchain tested on:
1. project itself - https://sourcegraph.com/antonina-cherednichenko/srclib-typescript
2. line-chart - https://sourcegraph.com/n3-charts/line-chart
3. sourcegraph tests - https://sourcegraph.com/sgtest/typescript-test
4. MS TypeScript samples - https://sourcegraph.com/Microsoft/TypeScriptSamples


