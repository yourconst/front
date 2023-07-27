const durl = require("./bgaudio");

class AudioAux {
    get paused() { return this._audio.paused; }
    set paused(value) {
        const a = this._audio;

        if(a.paused == value)
            return;

        this._selfChange = true;

        if(a.paused) {
            a.play();
        } else {
            a.pause();
        }
    }

    start() {
        this._audio.play();
    }

    setInfo(title, artist = "") {
        let str;

        if(this.firstTime)
            this.start();

        if(artist)
            str = artist.concat("\t - \t\n", title);
        else
            str = title;

        this._audio.title = str;
        document.title = str;
    }

    init() {
        document.body.appendChild(this._audio);
        this._audio.volume = 1e-17;
        this._audio.loop = true;

        this._audio.onwaiting = e => {
            //console.log(e);
            
            --this._cnt;
/* 
            if(this._tid)
                clearTimeout(this._tid); */
        };

        this._audio.onpause =
            this._audio.onplaying =
                e => {
                    if(this.firstTime) {
                        this.firstTime = false;
                        return;
                    }

                    if(this._selfChange) {
                        this._selfChange = false;
                        return;
                    }

                    //console.log(e);

                    if(Date.now() - this._last < this.delay)
                        ++this._cnt;

                    this._last = Date.now();

                    if(this._tid)
                        clearTimeout(this._tid);

                    this._tid = setTimeout(() => {
                        if(Date.now() - this._last >= this.delay) {
                            if(this._cnt == 0)
                                this.onplaychange();
                            else if(this._cnt == 1)
                                this.onnext();
                            else if(this._cnt == 2)
                                this.onprevious();
                        }

                        this._cnt = 0;
                    }, this.delay);
                };
    }

    constructor(delay = 1300) {
        this._audio = new Audio(durl);

        this._tid;
        this._cnt = 0;
        this._last = Date.now();

        this._selfChange = false;

        this.delay = delay;
        this.firstTime = true;

        this.onplaychange = e => {};
        this.onnext = e => {};
        this.onprevious = e => {};

/*         this._title = "";
        this._artist = ""; */

        this.init();
    }
};

if(typeof module != 'undefined') {
    module.exports = AudioAux;
}