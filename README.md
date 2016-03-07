# srclib-typescript
**srclib-typescript** is a [srclib](https://sourcegraph.com/sourcegraph/srclib)
toolchain that performs TypeScript code analysis: type inference,
documentation generation, jump-to-definition, dependency resolution, etc.
It enables this functionality in any client application whose code analysis is
powered by srclib, including [Sourcegraph](https://sourcegraph.com).
## Installation
This toolchain is not a standalone program; it provides additional functionality
to applications that use [srclib](https://srclib.org).
First,
[install the `src` program (see srclib installation instructions)](https://sourcegraph.com/sourcegraph/srclib).
Then run:
```
git clone https://github.com/sourcegraph/srclib-typescript.git
cd srclib-typescript
src toolchain add sourcegraph.com/sourcegraph/srclib-typescript
```
To verify that installation succeeded, run:
```
src toolchain list
```
You should see this srclib-typescript toolchain in the list.
Now that this toolchain is installed, any program that relies on srclib will support TypeScript.
(TODO(sqs): add a tutorial link)
## Testa and known issues
srclib-typescript is alpha-quality software. It powers code analysis on
[Sourcegraph.com](https://sourcegraph.com) and additionally has been tested on the next typescript repositories:
Successfully:
*n3-charts/line-chart 
*palantir/plottable 
*SierraSoftworks/Iridium 
*valor-software/ng2-bootstrap 
*DefinitelyTyped/tsd
*Microsoft/code-push
*Microsoft/TypeScriptSamples
*mgechev/angular2-seed
*Microsoft/vscode-go
*ng-book/angular2-rxjs-chat
*auth0/angular2-authentication-sample
*NativeScript/nativescript-cli
*uProxy/uproxy
*rogerpadilla/angular2-minimalist-starter
*rangle/batarangle
*VSCodeVim/Vim
*ngUpgraders/ng-forward

With issues:
*plasma-umass/doppio 
*vega/vega-lite - fails, one duplicate Ref
Next issues were found:
1. Unsupported builtins for interfaces
2. Partially supported shorthand property assignments
3. ExportSpecifiers can work better
4. Import clause not fully supported (syntax tree kind = 226)

## Test procedure
Testing this toolchain requires that you have installed `src` from
[srclib](https://sourcegraph.com/sourcegraph/srclib) and that you have this
toolchain set up. See srclib documentation for more information.
To test this toolchain's output against the expected output, run:
```
# build the Docker container to run the tests in isolation
src toolchain build sourcegraph.com/sourcegraph/srclib-typescript
# run the tests
src test
```
By default, that command runs tests in an isolated Docker container. To run the
tests on your local machine, run `src test -m program`. See the srclib
documentation for more information about the differences between these two
execution methods.
## Contributing
Patches are welcomed via GitHub pull request! See
[CONTRIBUTING.md](./CONTRIBUTING.md) for more information.
srclib-typescript's toolchain solution is based on [Typescript AST compiler api](https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API).
Powered by Sourcegraph
Code Intelligence for teams
version 


