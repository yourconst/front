class FilterElement {
    destructor() {
        this.actx.removeFilter(this.filter);
        this.parent.removeChild(this.eCont);

        this.onchange("delete");
    }

    get enabled() { return this.ePower ? this.ePower.checked : false; }
    set enabled(value) {
        this.ePower.checked = value;

        if(value) {
            this.filter.gain.value = this.eGain.value;
            this.filter.Q.value = 1 - this.eQ.value;
        } else {
            this.filter.gain.value = 0;
            this.filter.Q.value = 1;
        }

        this.onchange("enabled");
    }

    get frequency() { return this.eFreq.value; }
    set frequency(value) {
        this.eFreq.value = value;
        this.filter.frequency.value = this.eFreq.value;

        this.onchange("frequency");
    }

    get Q() { return 1 - this.eQ.value; }
    set Q(value) {
        this.eQ.value = 1 - value;
        this.filter.Q.value = 1 - this.eQ.value;

        this.onchange("Q");
    }

    get gain() { return this.eGain.value; }
    set gain(value) {
        this.eGain.value = value;
        this.filter.gain.value = this.eGain.value;

        this.onchange("gain");
    }

    makePowerButton() {
        this.ePower = document.createElement("input");

        this.ePower.type = "checkbox";
        this.ePower.checked = true;

        this.ePower.oninput = () => {
            this.enabled = this.ePower.checked;
        };

        return this.ePower;
    }

    makeGainRange() {
        this.eGain = document.createElement("input");

        this.eGain.type = "range";
        this.eGain.min = -10;
        this.eGain.max = 10;
        this.eGain.step = "any";

        this.eGain.value = this.filter.gain.value;

        this.eGain.oninput = () => {
            if(this.enabled)
                this.gain = this.eGain.value;
        };

        return this.eGain;
    }

    makeQRange() {
        this.eQ = document.createElement("input");

        this.eQ.type = "range";
        this.eQ.min = 0;
        this.eQ.max = 1;
        this.eQ.step = "any";

        this.eQ.value = 1 - this.filter.Q.value;

        this.eQ.oninput = () => {
            this.Q = 1 - this.eQ.value;
        };
        
        return this.eQ;
    }

    makeFreqNumber() {
        this.eFreq = document.createElement("input");
        
        this.eFreq.type = "number";
        this.eFreq.value = this.filter.frequency.value;

        this.eFreq.oninput = () => {
            this.frequency = this.eFreq.value;
        };

        return this.eFreq;
    }

    makeDeleteButton() {
        this.eDelete = document.createElement("input");

        this.eDelete.type = "button";
        this.eDelete.value = "x";

        this.eDelete.onclick = () => this.destructor();

        return this.eDelete;
    }

    domInitByTr(parent) {
        this.eCont = document.createElement("tr");
        
        for(let i=0;i<5;++i)
            this.eCont.insertCell();

        this.eCont.cells[0].appendChild(this.makePowerButton());
        this.eCont.cells[1].appendChild(this.makeGainRange());
        this.eCont.cells[2].appendChild(this.makeQRange());
        this.eCont.cells[3].appendChild(this.makeFreqNumber());
        this.eCont.cells[4].appendChild(this.makeDeleteButton());

        this.parent = parent;
        this.parent.appendChild(this.eCont);

        return this.eCont;
    }

    domInitByDiv(parent) {
        this.eCont = document.createElement("div");

        this.eCont.appendChild(this.makePowerButton());
        this.eCont.appendChild(this.makeGainRange());
        this.eCont.appendChild(this.makeQRange());
        this.eCont.appendChild(this.makeFreqNumber());
        this.eCont.appendChild(this.makeDeleteButton());

        this.parent = parent;
        this.parent.appendChild(this.eCont);

        return this.eCont;
    }

    toJSON() {
        return {
            enabled: this.enabled, frequency: this.frequency, Q: this.Q, gain: this.gain
        };
    }

    constructor(actx, parent, type = "div") {
        this.parent;

        this.eCont;
        this.ePower;
        this.eGain;
        this.eQ;
        this.eFreq;
        this.eDelete;

        this.actx = actx;
        this.filter = actx.addFilter(1000);

        this.onchange = text => {};

        if(type == "tr")
            this.domInitByTr(parent);
        else 
            this.domInitByDiv(parent);
    }
};

if(typeof module != 'undefined') {
    module.exports = FilterElement;
}