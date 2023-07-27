import { PromiseManaged } from "../Promise";

export class AsyncTask<R = any, P extends any[] = any[]> extends PromiseManaged<R> {
    constructor(public readonly _worker: (...params: P) => Promise<R>, public readonly _params?: P) {
        super();
    }
    
    private _run(): Promise<R> {
        return this._worker(...(this._params || <any>[]));
    }

    async run() {
        try {
            (<any>this).resolve(await this._run());
            return null;
        } catch (error) {
            this.reject(error);
            return error;
        }
    }

    async runNoReject() {
        try {
            (<any>this).resolve(await this._run());
            return null;
        } catch (error) {
            return error;
        }
    }
}
