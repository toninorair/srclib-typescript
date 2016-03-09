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
[install the `srclib` program (see srclib installation instructions)](https://sourcegraph.com/sourcegraph/srclib).
Then run:
```
git clone https://github.com/sourcegraph/srclib-typescript.git
cd srclib-typescript
srclib toolchain install typescript
```
To verify that installation succeeded, run:
```
srclib toolchain list
```
You should see this srclib-typescript toolchain in the list.
Now that this toolchain is installed, any program that relies on srclib will support TypeScript.
(TODO(sqs): add a tutorial link)
## Current limitations
* Support only for projects which have **tsconfig.json** file in the root directory, other package systems are not supported.

* To be fully analysed file need to be included in the **Files** section of **tsconfig.json** file or to be referenced via reference path.  

* Production of more than one ref for reference is currently switched off if multiple declarations are provided by AST tree. Reasons - src tool produces bugs in this case, for some references AST tree gives just the same declarations and it leads to duplicate ref error. Need to go back to this issue after a while.

## Tests and known issues
srclib-typescript is alpha-quality software. It powers code analysis on
[Sourcegraph.com](https://sourcegraph.com) and additionally has been tested on the next typescript repositories:  

**Successfully:**
* [n3-charts/line-chart](https://sourcegraph.com/github.com/sourcegraph/srclib-typescript) 
* [palantir/plottable](https://github.com/palantir/plottable)
* [SierraSoftworks/Iridium](https://github.com/SierraSoftworks/Iridium)
* [valor-software/ng2-bootstrap](https://github.com/valor-software/ng2-bootstrap) 
* [DefinitelyTyped/tsd](https://github.com/DefinitelyTyped/tsd)
* [Microsoft/code-push](https://github.com/Microsoft/code-push)
* [Microsoft/TypeScriptSamples](https://github.com/Microsoft/TypeScriptSamples)
* [mgechev/angular2-seed](https://github.com/mgechev/angular2-seed)
* [Microsoft/vscode-go](https://github.com/Microsoft/vscode-go)
* [ng-book/angular2-rxjs-chat](https://github.com/ng-book/angular2-rxjs-chat)
* [auth0/angular2-authentication-sample](https://github.com/auth0/angular2-authentication-sample)
* [NativeScript/nativescript-cli](https://github.com/NativeScript/nativescript-cli)
* [uProxy/uproxy](https://github.com/uProxy/uproxy)
* [rogerpadilla/angular2-minimalist-starter](https://github.com/rogerpadilla/angular2-minimalist-starter)
* [rangle/batarangle](https://github.com/rangle/batarangle)
* [VSCodeVim/Vim](https://github.com/VSCodeVim/Vim)
* [ngUpgraders/ng-forward](https://github.com/ngUpgraders/ng-forward)
* [vega/vega-lite](https://github.com/vega/vega-lite)   

**Testing in progress:**
* [plasma-umass/doppio](https://github.com/plasma-umass/doppio) 
* [DefinitelyTyped/DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped) 

**Next issues were found:**
* Unsupported builtins for interfaces.
* Partially supported shorthand property assignments.
* ExportSpecifiers can work better.
* Import clause is not fully supported (syntax tree kind = 226, reproduced on [doppio](https://github.com/plasma-umass/doppio) project).

## Run procedure
Testing this toolchain requires that you have installed `srclib` from
[srclib](https://sourcegraph.com/sourcegraph/srclib) and that you have this
toolchain set up. See srclib documentation for more information.
To test this toolchain's output against the expected output, run:
```
# run the tests
srclib test
```
## Contributing
Patches are welcomed via GitHub pull request! See
[CONTRIBUTING.md](./CONTRIBUTING.md) for more information.
srclib-typescript's toolchain solution is based on [Typescript AST compiler api](https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API).
