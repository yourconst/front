Array.prototype.unique = function() {
    return Array.from(new Set(this));
}

Array.prototype.uniqueSelf = function() {
    const
        len = this.length,
        arr = Array.from(new Set(this));
    
    this.length = 0;
    this.push.apply(this, arr);

    return len != this.length;
}

Array.prototype.concatUnique = function(src) {
    return Array.from(new Set(this.concat(src)));
}

Array.prototype.concatUniqueSelf = function(src) {
    const
        len = this.length,
        arr = Array.from(new Set(this.concat(src)));
    
    this.length = 0;
    this.push.apply(this, arr);

    return len != this.length;
}

Array.prototype.concatSelf = function(src) {
    this.push.apply(this, src);
}

Array.prototype.pushNew = function(src) {
    const len = this.length;

    src.forEach(e => {
        if(!this.includes(e))
            this.push(e);
    });

    return len != this.length;
};

Array.prototype.tryDelete = function(elem) {
    let ind = this.indexOf(elem),
        res;

    if(ind > -1)
        res = this.splice(ind, 1);

    return res;
};

Object.defineProperty(Array.prototype, "lastElement", {
    enumerable: false,
    get: function() {
        return this[this.length - 1];
    },
    set: function(value) {
        this.push(value);
    }
});



ArrayBuffer.prototype.toString2 = function() {
    const i8a = new Uint8Array(this);
    let res = "";
    
    for(let i=0; i<i8a.length; ++i)
        res += String.fromCharCode(i8a[i]);
    
    return res;
};