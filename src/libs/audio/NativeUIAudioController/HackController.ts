class AudioInfo {
    private _audio = new Audio();
    private _selfChange = false;
    private _firstTime = true;
    private _cnt = 0;
    private _lastPlayChangeTime = Date.now();
    private _timeoutId?: NodeJS.Timeout = null;

    onplaychange = (paused: boolean) => { };
    onnext = () => { };
    onprev = () => { };

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

        if(this._firstTime)
            this.start();

        if(artist)
            str = artist.concat("\t - \t\n", title);
        else
            str = title;

        this._audio.title = str;
        document.title = str;
    }

    constructor(public delay = 1300) {
        document.body.appendChild(this._audio);
        this._audio.volume = 1e-17;
        this._audio.loop = true;

        this._audio.onwaiting = e => {
            --this._cnt;
        };

        this._audio.onpause =
            this._audio.onplaying =
                e => {
                    if(this._firstTime) {
                        this._firstTime = false;
                        return;
                    }

                    if(this._selfChange) {
                        this._selfChange = false;
                        return;
                    }

                    if(Date.now() - this._lastPlayChangeTime < this.delay)
                        ++this._cnt;

                    this._lastPlayChangeTime = Date.now();

                    if (this._timeoutId) {
                        clearTimeout(this._timeoutId);
                        this._timeoutId = null;
                    }

                    this._timeoutId = setTimeout(() => {
                        if(Date.now() - this._lastPlayChangeTime >= this.delay) {
                            if(this._cnt == 0)
                                this.onplaychange(this._audio.paused);
                            else if(this._cnt == 1)
                                this.onnext();
                            else if(this._cnt == 2)
                                this.onprev();
                        }

                        this._cnt = 0;
                    }, this.delay);
                };
    }
}
