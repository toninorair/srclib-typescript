/**
 * Logic for work with external and internal modules related to files
 */
export class ModuleResolver {
    private items = [];

    private MODULE_PREFIX = "__MOD__";
    private GLOBAL_MODULE_NAME: string = "__MOD__global";

    /**
     * Add new module to container
     * @param {string}     fileName
     * @param {boolean =        false}       isExternal
     */
    addModule(fileName: string, isExternal: boolean = false): void {
        if (isExternal) {
            this.items[fileName] = this.MODULE_PREFIX + fileName;
        } else {
            this.items[fileName] = this.GLOBAL_MODULE_NAME;
        }
    }

    /**
     * Retrieves module for exact file
     * @param  {string} fileName
     */
    getModule(fileName: string): string {
        return (this.items[fileName] !== undefined) ? this.items[fileName] : this.GLOBAL_MODULE_NAME;
    }

    /**
     * Returns name for path
     * @param  {string} name
     */
    formModuleName(name: string): string {
        return this.MODULE_PREFIX + name;
    }
}
