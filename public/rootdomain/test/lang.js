if(typeof globalThis == 'undefined') {
    globalThis = window;
}

`{
    current: "eng",
    languages: {    //key - lang id; value - lang name
        eng: "English",
        ...,
        rus: "Русский"
    },
    ids: {    //key - element id; value - object
        header: {
            eng: "Header 1",
            ...,
            rus: "Заголовок 1"
        }
    }
}`;

class Lang {
    setElem(e) {
        let str;

        if(e) {
            str = this.ids[e.id][this._current];

            if(e.tagName == "input" || e.tagName == "textarea")
                e.placeholder = str;
            else
                e.innerText = str;
        }
    }

    get current() { return this._current; }
    set current(value) {
        if(this.languages[value]) {
            for(let e of this.elems.values())
                this.setElem(e);

            this._current = value;
        }
    }

    get currentLanguage() { return this.languages[this._current]; }
    set currentLanguage(value) {
        for(let lang in this.languages)
            if(this.languages[lang] == value)
                this.current = lang;
    }

    init(obj, cnt = 0) {
        if(!obj)
            return;
        else if(document.readyState != "complete" && cnt < 5) {
            setTimeout(() => this.init(obj, ++cnt), 0);
            return;
        }

        let o = obj.langs ? obj : JSON.parse(json),
            ids = o.ids;

        this.languages = o.languages;

        this.elems.clear();

        for(let id in ids)
            this.elems.set(id, document.getElementById(id));

        this.current = o.current;
    }

    constructor(obj) {
        this._current = "";
        this.languages = {};
        this.ids = {};
        this.elems = new Map;

        this.init(obj);
    }
};

if(typeof module != 'undefined') {
    module.exports = Lang;
}