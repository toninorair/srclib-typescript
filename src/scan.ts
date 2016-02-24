/// <reference path="../typings/node/node.d.ts" />
/// <reference path="../typings/npm/npm.d.ts" />
/// <reference path="../typings/q/Q.d.ts" />
/// <reference path="../typings/async/async.d.ts" />

import unit = require('./unit');

import * as npm from "npm";
import * as q from "q";
import * as async from "async";

var D_TS_SUFFIX: string = 'd.ts';
var TESTS_DIR: string = '.';

var fs = require('fs');
var path = require('path');
var tsconfig = require('tsconfig');

export class ScanAction implements Action {

    execute(): void {
        var self = this;

        var sourceUnit = new unit.SourceUnit();
        sourceUnit.Type = 'TypeScriptModule';

        q.
        when(self._initializeNpm()).
        then(self._install).
        then(self._getDeps).
        then(self._getRepositories).
        then(function(repos: {}[]) {
          var deps = [];
          repos.forEach(function(repo:any) {
            deps.push({
              Target: {
                ToRepoCloneURL: repo.uri,
                ToUnit: 'TODO',
                ToUnitType: 'CommonJSPackage',
                ToVersionString: repo.version
              }
            });
          });
          sourceUnit.Dependencies = deps;
        }).
        then(self._collectFiles).
        then(function(files) {
          sourceUnit.Files = files;
        }).
        then(function() {
          var packageJson: any;
          try {
            var json = fs.readFileSync('package.json');
            packageJson = JSON.parse(json);
          } catch (e) {
             packageJson = {};
          }
          sourceUnit.Name = packageJson.name || path.basename(process.cwd());
          console.log(JSON.stringify([sourceUnit]));
        });
    }

    private _initializeNpm(): q.Promise<void> {
      var ret : q.Deferred<void> = q.defer<void>();
      console.error("initializing npm");
      npm.load(null, function(err, result) {
        if (err) {
          ret.reject(err);
        } else {
          console.error("npm is initialized");
          ret.resolve();
        }
      });
      return ret.promise;
    }

    private _install(): q.Promise<void> {
      var ret : q.Deferred<void> = q.defer<void>();
      console.error("Installing npm packages");
      npm.commands.install([], function(err) {
        if (err) {
          ret.reject(err);
        } else {
          console.error("npm packages are installed");
          ret.resolve();
        }
      });
      return ret.promise;
    }

    private _getDeps(): q.Promise<{}[]> {
      var ret : q.Deferred<{}[]> = q.defer<{}[]>();
      console.error("Retrieving installed npm packages");
      npm.commands.ls([], true, function(err, data, deps) {
        if (err) {
          ret.reject(err);
        } else {
          console.error("Retrieved installed npm packages");
          ret.resolve(deps);
        }
      });
      return ret.promise;
    }

    private _getRepositories(deps: any): q.Promise<any> {
      var ret : q.Deferred<any> = q.defer<any>();
      console.error("Retrieving repositories");
      var tasks = [];
      async.forEachOf(deps.dependencies || {}, function(v:any, k:string) {
        tasks.push(function(callback) {
          npm.commands.view([k + '@' + v.version], true, function(err, data) {
            callback(err, {
                uri: ((data[v.version] || {}).repository || {}).url,
                version: v.version});
          })
        });
      }, function() {});
      async.parallel(tasks, function(err, data) {
        if (err) {
          ret.reject(err);
        } else {
          console.error("Retrieved repositories");
          ret.resolve(data);
        }
      });

      return ret.promise;
    }

    private _collectFiles(): string[] {
      console.error("Collecting files");
      try {
        var tsConfig = tsconfig.loadSync(TESTS_DIR);
      } catch (e) {
        return [];
      }
        return (tsConfig.files || []).map(function(file: string) {
            return file.replace(new RegExp('\\' + path.sep, 'g'), path.posix.sep);
        });
    }
}
