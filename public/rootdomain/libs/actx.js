class MediaSource {
    play() { this.element.play(); }
    pause() { this.element.pause(); }

    connect(node) { this.node.connect(node); }
    disconnect(node) { this.node.disconnect(node); }
    
    constructor(ctx, elem) {
        this.element = elem;
        this.node = ctx.createMediaElementSource(elem);
    }
}

class BufferSource {
    play() { this.node.start(); }
    pause() { this.node.stop(); }

    connect(node) { this.node.connect(node); }
    disconnect(node) { this.node.disconnect(node); }

    decode(buf) {
        console.log(buf);

        this.ctx.decodeAudioData(buf, abuf => {
            this.abuf = abuf;
            this.node.buffer = abuf;
        }, err => console.log(`Something went wrong. Error: ${err}`));
    }
    
    constructor(ctx, buf) {
        this.ctx = ctx;
        this.abuf;
        this.node = ctx.createBufferSource();

        this.decode(buf);
    }
};

class Source {
    play() { if(this.src) this.src.play(); }
    pause() { if(this.src) this.src.pause(); }

    connect(node) { if(this.src) this.src.connect(node); }
    disconnect(node) { if(this.src) this.src.disconnect(node); }

    get output() { return this._output; }
    set output(value) {
        if(this._output)
            this.disconnect(this._output);

        this._output = value;
        this.connect(this._output);
    }

    get src() { return this._src; }
    set src(value) {
        if(this._output)
            this.disconnect(this._output);

        this._src = value;
        this._src.connect(this._output);

        this.onchange(this._src);
    }

    changeSrc(source) {
        if(typeof source == "string") {
            let xhr = new XMLHttpRequest();

            xhr.open("GET", source, true);
            xhr.responseType = "arraybuffer";

            xhr.onload = () => {
                this.src = new BufferSource(this.ctx, xhr.response);
            }
        } else if(source instanceof ArrayBuffer) {
            this.src = new BufferSource(this.ctx, source);
        } else if(source instanceof HTMLMediaElement) {
            this.src = new MediaSource(this.ctx, source);
        }
    }

    constructor(ctx, output, source) {
        this._src; this.src;
        this.ctx = ctx;
        this._output;
        this.output = output;

        this.onchange = (src) => {};

        this.changeSrc(source);
    }
};

class ACTX {
    get volume() { return this.gain.gain.value; }
    set volume(value) { this.gain.gain.value = value; }

    changeSource(source) {
        this.src.changeSrc(source);
    }

    get fCount() { return Math.log2(this.analysers[0].fftSize / 32); }
    set fCount(value) {
        let v = 32 << value;
        for(let i=0;i<this.analysers.length; ++i)
            this.analysers[i].fftSize = v;
    }

    get updTime() { return this.analysers[0].smoothingTimeConstant; }
    set updTime(value) {
        for(let i=0;i<this.analysers.length; ++i)
            this.analysers[i].smoothingTimeConstant = value;
    }

    get currentData() {
        let fbcnt = this.analysers[0].frequencyBinCount,
            data = new Array(this.analysers.length);
        
        for(let i=0;i<this.analysers.length; ++i) {
            data[i] = new Uint8Array(fbcnt);
            this.analysers[i].getByteFrequencyData(data[i]);
        }

        return data;
    }

    play() { this.src.play(); }
    pause() { this.src.pause(); }

    splitClear() {
        if(this.splitter && this.analysers) {
            this.gain.disconnect(this.splitter);

            for(let i=0;i<this.analysers.length; ++i)
                this.splitter.disconnect(this.analysers[i]);
        }
    }

    fewSplit(cnt) {
        this.analysers = new Array(cnt);
        this.splitter = this.ctx.createChannelSplitter(cnt);

        this.gain.connect(this.splitter);

        for(let i=0;i<cnt; ++i) {
            let a = this.ctx.createAnalyser();

            this.splitter.connect(a, i);
            this.analysers[i] = a;
        }
    }

    get channelsCount() { return this._channelsCount; }
    set channelsCount(cnt) {
        let fCount = this.fCount,
            updTime = this.updTime || 0.4;

        if(this._channelsCount > 1)
            this.splitClear();
        else if(this._channelsCount == 1)
            this.gain.disconnect(this.analysers[0]);

        if(cnt > 1) 
            this.fewSplit(cnt);
        else if(cnt == 1) {
            let a = this.ctx.createAnalyser();

            this.analysers = [a];
            this.gain.connect(a);
        }

        this.fCount = fCount;
        this.updTime = updTime;

        this._channelsCount = cnt;
    }

    constructor(source) {
        let AudioContext = window.AudioContext || window.webkitAudioContext;

        this.ctx = new AudioContext();
        this.gain = this.ctx.createGain();
        this.analysers = [{fftSize: 512}];

        this.channelsCount = 2;

        this.src = new Source(this.ctx, this.gain, source);

        this.src.onchange = src => {this.src.play();};
        //this.fCount = 4;
        //this.updTime = 0.4;

        this.gain.connect(this.ctx.destination);

        this.changeSource(source);
    }
};