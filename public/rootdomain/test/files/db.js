require("./prototypes");

const CachedTable = require("./cachedTable");

global.CachedTable = CachedTable;

var indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.msIndexedDB;

class DB {
    deleteRowFromTable(tname, key, onsuccess = data => {}, onerror = e => {}, trnsctn) {
        const transaction = trnsctn || this.db.transaction([tname], "readwrite");
        const objStore = transaction.objectStore(tname);
        const request = objStore.delete(key);
    
        request.onsuccess = e => onsuccess(request.result);
        request.onerror = onerror;

        return transaction;
    }
    
    putRowToTable(tname, obj, onsuccess = data => {}, onerror = e => {}, trnsctn) {
        const transaction = trnsctn || this.db.transaction([tname], "readwrite");
        const objStore = transaction.objectStore(tname);
        const request = objStore.put(obj);
    
        request.onsuccess = e => onsuccess(request.result);
        request.onerror = onerror;

        return transaction;
    }
    
    addRowToTable(tname, obj, onsuccess = data => {}, onerror = e => {}, trnsctn) {
        const transaction = trnsctn || this.db.transaction([tname], "readwrite");
        const objStore = transaction.objectStore(tname);
        const request = objStore.add(obj);
    
        request.onsuccess = e => onsuccess(request.result);
        request.onerror = onerror;

        return transaction;
    }

    getRowByIndex(tname, index, key, onsuccess = data => {}, onerror = e => {}, trnsctn) {
        const transaction = trnsctn || this.db.transaction([tname], "readonly");
        const objStore = transaction.objectStore(tname);
        const indexObj = objStore.index(index);
        const request = indexObj.get(key);
    
        request.onsuccess = e => onsuccess(request.result);
        request.onerror = onerror;

        return transaction;
    }

    getRowFromTable(tname, key, onsuccess = data => {}, onerror = e => {}, trnsctn) {
        const transaction = trnsctn || this.db.transaction([tname], "readonly");
        const objStore = transaction.objectStore(tname);
        const request = objStore.get(key);
    
        request.onsuccess = e => onsuccess(request.result);
        request.onerror = onerror;

        return transaction;
    }

    getAllFromTable(tname, callback = m => {}, onerror = e => {}, trnsctn) {
        const transaction = trnsctn || this.db.transaction([tname], "readonly");
        const objStore = transaction.objectStore(tname);
        const request = objStore.getAll();
    
        request.onsuccess = e => callback(request.result);
        request.onerror = onerror;

        return transaction;
    }

    editRowFromTable(tname, key, editor = data => {}, clbck = e => {}, trnsctn, delIfEmpty = true) {
        const transaction = trnsctn || this.db.transaction([tname], "readwrite");
        const objStore = transaction.objectStore(tname);
        const request = objStore.get(key);
    
        request.onsuccess = e => {
            const res = editor(e.target.result);

            if(res)
                objStore.put(res).onsuccess = clbck;
            else if(delIfEmpty)
                objStore.delete(key).onsuccess = clbck;
            else
                clbck(e);
        };
        //request.onerror = clbck;

        return transaction;
    }

    deleteFromArray(tname, id, arrProp, delId, clbck = data => {}, trnsctn, delIfEmpty = false) {
        const transaction = trnsctn || this.db.transaction([tname], "readwrite");

        this.editRowFromTable(tname, id, row => {
            if(row) {
                let ind = row[arrProp].indexOf(delId);

                if(ind > -1)
                    row[arrProp].splice(ind, 1);

                if(delIfEmpty && row[arrProp].length == 0)
                    return undefined;
            }

            return row;
        }, undefined, transaction, delIfEmpty);
    }

    addToArray(tname, id, arrProp, addId, clbck = data => {}, trnsctn) {
        const transaction = trnsctn || this.db.transaction([tname], "readwrite");

        this.editRowFromTable(tname, id, row => {
            if(row) {
                let arr = row[arrProp] || [],
                    includes = arr.includes(addId);

                row[arrProp] = arr;

                if(includes)
                    row = undefined;
                else
                    arr.push(addId);
            }

            return row;
        }, undefined, transaction);
    }

    addSeveralToArray(tname, id, arrProp, addIds, clbck = data => {}, trnsctn) {
        const transaction = trnsctn || this.db.transaction([tname], "readwrite");

        this.editRowFromTable(tname, id, row => {
            if(row) {
                let arr = row[arrProp] || [],
                    changed = arr.concatUniqueSelf(addIds);

                row[arrProp] = arr;

                if(!changed)
                    row = undefined;
            }

            return row;
        }, clbck, transaction);
    }

    transaction(
        tables = this.db.objectStoreNames, mode = "readwrite",
        oncomplete = ()=>{}, onerror = e=>{}
    ) {
        const transaction = this.db.transaction(tables, mode);

        transaction.oncomplete = e => oncomplete();
        transaction.onerror = e => {
            oncomplete(e);
            onerror(e);
        };

        return transaction;
    }

    getAllFromCachedTable(table, clbck = d => {}) {
        clbck(this._cachedTablesMap.get(table)._data);
    }

    getCachedTable(table) {
        return this._cachedTablesMap.get(table);
    }

    commitCachedChanges(clbck = e => {}) {
        let cnt = 0;

        const f = e => {
            ++cnt;
            if(cnt >= this._cachedTablesMap.size)
                clbck(e);
        };

        this._cachedTablesMap.forEach(ct => ct.commitByChanged(f));
    }
    
    setCachedTables(tables = [], clbck = e => {}) {
        if(!tables || !tables.length) {
            clbck();
            return;
        }

        let cnt = 0;
        const f = e => {
            ++cnt;
            if(cnt >= tables.length)
                clbck(e);
        };

        tables.forEach(t => {
            this._cachedTablesMap.set(t, new CachedTable(t, this.db, f));
        });
    }

    init(obj = {}, cachedTables = []) {
        const openRequest = indexedDB.open(obj.name, obj.version);
        
        openRequest.onupgradeneeded = e => {
            const thisDb = e.target.result;

            for(const t of obj.tables) {
                if(!thisDb.objectStoreNames.contains(t.name)) {
                    var objectStore = thisDb.createObjectStore(t.name,
                        { keyPath: t.key, autoIncrement: t.autoIncrement || false }
                    );

                    if(t.index)
                        objectStore.createIndex(t.index, t.index,
                            { unique: t.uniqueIndex || false }
                        );
                }
            }

            this.oncreate(e);
        };

        openRequest.onsuccess = e => {
            this.db = e.target.result;

            this.setCachedTables(cachedTables, () => this.onopen(e));
        
            this.db.onerror = e => this.onerror(e);

            //this.onopen(e);
        };

        openRequest.onerror = e => this.onerrorcreate(e);
    }

    clearTable(table, clbck = e => {}) {
        const trnsctn = this.transaction([table], undefined, () => {
            const ct = this.getCachedTable(table);
            
            if(ct)
                ct.getAllFromDB(clbck);
            else
                clbck();
        });

        let obj = trnsctn.objectStore(table),
            req = obj.clear();
    }

    get indexedDB() { return indexedDB; }

    constructor(obj) {
        this.db;
        this._cachedTablesMap = new Map;
        
        this.onopen = e => {};

        this.oncreate = e => {};
        this.onerrorcreate = e => {};
        this.onerror = e => {};

        if(obj)
            this.init(obj);
    }
};

if(typeof module != 'undefined') {
    module.exports = DB;
}