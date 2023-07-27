require("./prototypes");

class CachedTable {
    objectStore(mode = "readwrite", callback = e => {}) {
        const t = this.db.transaction([this.name], mode),
            os = t.objectStore(this.name);

        t.onsuccess = callback;
        t.onerror = callback;

        return os;
    }
    
    _putToDB(row) {

    }

    removeFromIndex(index, row) {
        const indVal = row[index],
            someDict = this._indexMaps.get(index);

        if(someDict) {
            const someSet = someDict.get(indVal);
            someSet.delete(row);

            if(!someSet.size)
                someDict.delete(indVal);
        }
    }
    
    get loaded() { return !!this._loaded; }

    get onload() { return this._onload; }
    set onload(f) {
        this._onload = f;

        if(this.loaded)
            f();
    }

    get indexNames() { return this._indexNames; }
    set indexNames(arr) {
        arr.forEach(n => this._indexMaps.set(n, new Map));
        this._indexNames = arr;
    }

    _putLocal(row) {
        const keyVal = row[this.keyPath];

        this._keyMap.set(keyVal, row);

        if(keyVal > this.currentKey)
            this.currentKey = keyVal;

        this.indexNames.forEach(ind => {
            const keyVal = row[ind],
                m = this._indexMaps.get(ind),
                sm = m.get(keyVal);

            if(sm)
                sm.add(row);
            else
                m.set(keyVal, new Set([row]));
        });

        this._data.push(row);
    }

    get(key) {
        return this._keyMap.get(key);
    }

    getRowsByIndex(index, value) {
        const im = this._indexMaps.get(index);

        if(im)
            return im.get(value);

        return undefined;
    }

    delete(key) {
        const row = this.get(key);

        if(row) {
            this._deletedMap.set(key, row);
            this._keyMap.delete(key);

            this._indexNames.forEach(n => this.removeFromIndex(n, row));

            this._data.tryDelete(row);
        }

        return row;
    }

    put(row = {}) {
        let key = row[this.keyPath];

        if(!key)
            key = row[this.keyPath] = ++this.currentKey;

        this.delete(key);

        this._deletedMap.delete(key);
        this._changedMap.set(key, row);
        
        this._putLocal(row);

        return key;
    }

    edit(key, editor = row => row, delIfEmpty = false) {
        let res = editor(this.get(key));

        if(res) {
            this.put(res);
            this._changedMap.set(key, res);
        } else if(delIfEmpty)
            this.delete(key);

        return res;
    }

    get data() { return this._data; }
    set data(d) {
        this._data.length = 0;
        this._keyMap.clear();

        d.forEach(row => this._putLocal(row));

        //this._data = d;
    }

    init(os, dataArr) {
        this.name = os.name;
        this.keyPath = os.keyPath;
        this.indexNames = Array.from(os.indexNames);

        this._changedMap.clear();

        this.data = dataArr;
    }

    getAllFromDB(callback = e => {}) {
        const os = this.objectStore("readonly");

        os.getAll().onsuccess = e => {
            this.init(os, e.target.result);
            this._loaded = true;
            callback();
            this._onload(e);
        }
    }

    commitAll(callback = e => {}) {
        const kp = this.keyPath,
            os = this.objectStore("readwrite", () => this.getAllFromDB(callback));

        this._data.forEach(r => {
            const key = r[kp];

            this._changedMap.delete(key);

            if(this._deletedMap.delete(key)) {
                os.delete(key);
            } else
                os.put(r);
        });
    }

    commitByKeys(keys, callback = e => {}) {
        const os = this.objectStore("readwrite", callback);

        keys.forEach(key => {
            this._changedMap.delete(key);

            if(this._deletedMap.delete(key))
                os.delete(key);
            else {
                const row = this.get(key);
                if(row)
                    os.put(row);
            }
        });
    }

    commitByChanged(callback = e => {}) {
        const os = this.objectStore("readwrite", callback);

        this._changedMap.forEach((row, key) => {
            this._changedMap.delete(os.put(row));
        });
    }

    constructor(name, db, callback = e => {}) {
        this.db = db;
        this.name = name;

        this.currentKey = 0;

        this._loaded = false;

        this._deletedMap = new Map;
        this._changedMap = new Map;

        this._data = [];
        this._keyMap = new Map;
        this._indexMaps = new Map;
        this._indexNames;

        this._onload = e => {};
        
        this.getAllFromDB(callback);
    }
};

if(typeof module != 'undefined') {
    module.exports = CachedTable;
}