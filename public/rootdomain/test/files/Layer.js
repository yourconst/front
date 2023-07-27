const FilterElement = require("../filterElement");

const
    actx = global.actx,
    music = global.music,
    visualization = global.visualization;

const freqCont = document.getElementById("freqCont"),
    allFreq = document.getElementById("allFreq");

class Layer {
    get volume() { return actx.volume; }
    set volume(value) {
        value = parseFloat(value);
        value = isNaN(value) ? actx.volume : value;

        actx.volume = value;
        localStorage.setItem("volume", actx.volume);
    }
    
    get volume2() { return actx.volume2; }
    set volume2(value) {
        value = parseFloat(value);
        value = isNaN(value) ? actx.volume2 : value;

        actx.volume2 = value;
        localStorage.setItem("volume2", actx.volume2);
    }

    get musicOrder() { return music.order; }
    set musicOrder(value) {
        music.order = value;
        localStorage.setItem("musicOrder", music.order);
        
        musicOrderDiv.value = music.order;
        makeSomeSongDiv(playListTable, music.playList);
    }

    nextMusicOrder() {
        let os = music.orders;

        this.musicOrder = os[(os.indexOf(this.musicOrder) + 1) % os.length];

        return this.musicOrder;
    }

    get musicLoop() { return music.loop; }
    set musicLoop(value) {
        value = parseInt(value * 1) || parseInt(value) || 0;

        music.loop = value;
        localStorage.setItem("musicLoop", music.loop);
        
        musicLoopDiv.value = music.loop ? "loop" : "unloop";
    }

    get visLoopsCount() { return visualization.loopsCount; }
    set visLoopsCount(value) {
        value = parseFloat(value);
        value = isNaN(value) ? visualization.loopsCount : value;

        visualization.loopsCount = value;
        localStorage.setItem("visLoopsCount", visualization.loopsCount);
    }

    get radius() { return visualization.radius; }
    set radius(value) {
        value = parseFloat(value) || 1e3;
        value = isNaN(value) ? visualization.radius : value;

        visualization.radius = value;
        localStorage.setItem("radius", visualization.radius);
    }

    get updTime() { return actx.updTime; }
    set updTime(value) {
        value = parseFloat(value);
        value = isNaN(value) ? actx.updTime : value;

        actx.updTime = value;
        localStorage.setItem("updTime", actx.updTime);
    }

    get fCount() { return actx.fCount; }
    set fCount(value) {
        value = parseFloat(value);
        value = isNaN(value) ? actx.fCount : value;

        actx.fCount = value;
        visualization.pointCount = 16 << actx.fCount;
        localStorage.setItem("fCount", actx.fCount);
    }

    get mono() { return actx.monoAnalysing; }
    set mono(value) {
        value = parseInt(value * 1) || parseInt(value) || 0;

        actx.monoAnalysing = value;
        visualization.linesCount = value ? 1 : actx.sourceChannelCount;
        localStorage.setItem("mono", value);
    }

    get transition() { return visualization.transition; }
    set transition(value) {
        value = parseFloat(value);
        value = isNaN(value) ? visualization.transition : value;

        visualization.transition = value;
        localStorage.setItem("transition", visualization.transition);
    }

    get flying() { return visualization.flying; }
    set flying(value) {
        value = parseInt(value * 1) || parseInt(value) || 0;

        visualization.flying = value;
        localStorage.setItem("flying", value);
    }

    get flyingSpeed() { return visualization.flyingSpeed; }
    set flyingSpeed(value) {
        value = parseFloat(value);
        value = isNaN(value) ? visualization.flyingSpeed : value;

        visualization.flyingSpeed = value;
        localStorage.setItem("flyingSpeed", visualization.flyingSpeed);
    }

    get visType() { return visualization.effectType; }
    set visType(value) {
        visualization.effectType = value || "spiral";
        localStorage.setItem("visType", visualization.effectType);
    }

    get fov() { return visualization.camera.fov; }
    set fov(value) {
        value = parseFloat(value);
        value = isNaN(value) ? visualization.camera.fov : value;

        visualization.camera.fov = value;
        localStorage.setItem("fov", visualization.camera.fov);
    }

    get multiplier() { return visualization.multiplier; }
    set multiplier(value) {
        value = parseFloat(value);
        value = isNaN(value) ? visualization.multiplier : value;

        visualization.multiplier = value;
        MATERIAL.uniforms.mult.value = value;
        localStorage.setItem("multiplier", visualization.multiplier);
    }

    get visBG() { return visualization.renderer.getClearColor().value; }
    set visBG(value) {
        value = value || "#000000";

        visualization.renderer.setClearColor(value);
        if(lastPage == "visuality")
            footer.style.background = value;
        localStorage.setItem("visBG", visualization.renderer.getClearColor().value);
    }

    get lineWidth() { return MATERIAL.linewidth; }
    set lineWidth(value) {
        value = parseFloat(value);
        value = isNaN(value) ? MATERIAL.linewidth : value;
    
        MATERIAL.linewidth = value;
        localStorage.setItem("lineWidth", MATERIAL.linewidth);
    }

    get resolution() { return visualization.renderer.getPixelRatio(); }
    set resolution(value) {
        value = parseFloat(value);
        value = isNaN(value) ? 1 : value;
    
        visualization.renderer.setPixelRatio(value);
        localStorage.setItem("resolution", visualization.renderer.getPixelRatio());
    }

    get allFreqEnabled() { return allFreq.checked; }
    set allFreqEnabled(value) {
        value = parseInt(value * 1) || parseInt(value) || 0;
    
        allFreq.checked = value;
        this.filters.forEach(f => f.enabled = value);
        localStorage.setItem("allFreqEnabled", value);
    }

    addFilter(cont = freqCont) {
        let filter = new FilterElement(actx, cont, "tr");

        this.filters.push(filter);

        filter.onchange = text => {
            if(text == "delete") {
                let l = this.filters.lastIndexOf(filter);

                if(l >= 0)
                    this.filters.splice(l, 1);
            } else if(text == "enabled" && !filter.enabled) {
                allFreq.checked = false;
            }
        
            localStorage.setItem("filters", JSON.stringify(this.filters));
        };
        
        localStorage.setItem("filters", JSON.stringify(this.filters));

        return filter;
    }

    getFiltersFromStorage() {
        let sfs;

        try {
            sfs = JSON.parse(localStorage.getItem("filters"));
        } catch(e) {}

        if(sfs instanceof Array) {
            sfs.forEach(sf => {
                const f = this.addFilter();

                f.enabled = sf.enabled;
                f.gain = sf.gain;
                f.Q = sf.Q;
                f.frequency = sf.frequency;
            });
        }
    }

    getFromStorage() {
        [
            "volume", "volume2", "musicOrder", "musicLoop",
            "visLoopsCount", "radius", "fCount",
            "mono", "visType", "fov", "multiplier",
            "visBG", "lineWidth", "resolution", "allFreqEnabled",
            "updTime", "flying", "flyingSpeed", "transition"
        ].forEach(n => {
            this[n] = localStorage.getItem(n);
        });
    }

    constructor() {
        this.filters = [];

        allFreq.oninput = e => this.allFreqEnabled = allFreq.checked;

        //try {
            this.getFromStorage();
            this.getFiltersFromStorage();
        //} catch(e) {};
    }
};

//let layer = new Layer;

module.exports = new Layer;