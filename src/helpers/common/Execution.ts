export abstract class ExecutionHelpers {
    static async forEachParallel<T>(elems: Iterable<T>, handler: (e: T) => Promise<void>, concurrency = 10) {
        const jobs = new Set<Promise<void>>();

        for (const e of elems) {
            const p = handler(e);
            jobs.add(p);

            if (jobs.size >= concurrency) {
                await Promise.race([...jobs]);
            }
        }

        await Promise.all([...jobs]);
    }
}
