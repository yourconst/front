import { writable, type Readable, type Writable } from "svelte/store";

export class HelpersSvelte {
    static getStore<T>(store: Readable<T>) {
        let result: T;
        store.subscribe($ => result = $)();
        return result;
    }

    static writable<T>(value: T) {
        const store: Writable<T> & {
            get(): T;
        } = <any> writable(value);

        store.get = () => HelpersSvelte.getStore(store);

        return store;
    }
}
