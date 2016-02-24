export class ModuleResolver {
    private items = [];

    private MODULE_PREFIX = "__MOD__";
    private GLOBAL_MODULE_NAME: string = "__MOD__global";

    addModule(fileName: string, isExternal: boolean = false): void {
        if (isExternal) {
            this.items[fileName] = this.MODULE_PREFIX + fileName;
        } else {
            this.items[fileName] = this.GLOBAL_MODULE_NAME;
        }
    }

    getModule(fileName: string): string {
        return (this.items[fileName] !== undefined) ? this.items[fileName] : this.GLOBAL_MODULE_NAME;
    }

    formModuleName(name: string): string {
        return this.MODULE_PREFIX + name;
    }
}
