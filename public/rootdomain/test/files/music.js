//const MusicStorage = require("./musicStorage");
require("./prototypes");

Array.prototype.insert = function(index, element) {
    this.splice(index, 0, element);
};

class Music {
    setTracks(arr) {
        this._tracks.length = 0;
        this._mapTracks.clear();

        this._tracks.push.apply(this._tracks, arr);
        this._tracks.forEach(t => this._mapTracks.set(t.id, t));
    }
    
    setArtists(arr) {
        this._artists.length = 0;
        this._mapArtists.clear();
        
        this._artists.push.apply(this._artists, arr);
        this._artists.forEach(a => this._mapArtists.set(a.id, a));
    }
    
    setAlbums(arr) {
        this._albums.length = 0;
        this._mapAlbums.clear();
        
        this._albums.push.apply(this._albums, arr);
        this._albums.forEach(a => this._mapAlbums.set(a.id, a));
    }

    getTrackById(id) {
        return this._mapTracks.get(id);
    }

    getTracksByIds(ids = []) {
        return ids.map(id => this._mapTracks.get(id)).filter(t => t);
        //return allTracks.filter(t => 1 + ids.indexOf(t.id));
    }

    getTracksByStr(str = "", tracks = this._tracks) {
        str = str.replace(/(\s{2,})/ig, ' ').toUpperCase();
        return tracks.filter(t => 1 + t.upperTitle.indexOf(str));
    }

    getArtistsByStr(str = "") {
        str = str.replace(/(\s{2,})/ig, ' ').toUpperCase();
        return this._artists.filter(a => 1 + a.upperArtist.indexOf(str));
    }

    getArtistById(id) {
        return this._mapArtists.get(id);
    }

    getArtistsByIds(ids = []) {
        return ids.map(id => this._mapArtists.get(id)).filter(t => t);
    }

    getArtistTrackIds(id) {
        return this.getArtistById(id).tracks;
    }

    getArtistTracks(id) {
        return this.getTracksByIds(this.getArtistTrackIds(id));
    }

    getAlbumsByStr(str = "") {
        str = str.replace(/(\s{2,})/ig, ' ').toUpperCase();
        return this._albums.filter(a => 1 + a.upperAlbum.indexOf(str));
    }

    getAlbumById(id) {
        return this._mapAlbums.get(id);
    }

    getAlbumsByIds(ids = []) {
        return ids.map(id => this._mapAlbums.get(id)).filter(t => t);
    }

    getAlbumTrackIds(id) {
        return (this.getAlbumById(id) || {}).tracks;
    }

    getAlbumTracks(id) {
        return this.getTracksByIds(this.getAlbumTrackIds(id));
    }



    getCurrentTrack() {
        return this.getTrackById(this.current);
    }

    getCurrentArtist() {
        const t = this.getTrackById(this.current);
        return this.getArtistById((t.artists || [])[0]);
    }

    getCurrentArtists() {
        const t = this.getTrackById(this.current);
        return this.getArtistsByIds(t.artists);
    }

    getCurrentAlbum() {
        const t = this.getTrackById(this.current);
        return this.getAlbumById((t.albums || []).lastElement);
    }

    getCurrentAlbums() {
        const t = this.getTrackById(this.current);
        return this.getAlbumsByIds(t.albums);
    }


    getCurrentTrackTitle() {
        const t = this.getTrackById(this.current);
        return t ? t.title : undefined;
    }

    getCurrentArtistName() {
        const a = this.getCurrentArtist();
        return a ? a.artist : undefined;
    }

    getCurrentAlbumName() {
        const a = this.getCurrentAlbum();
        return a ? a.album : undefined;
    }
    

    getIndex(ind) {
        let res = this.current;

        if(this.loop) {
            res = Math.abs(ind % this._pl.length);

            if(ind < 0)
                res = this._pl.length - res;
        } else
            res = Math.min(this._pl.length - 1, Math.max(0, ind));

        return res;
    }

    getIndexById(id, plus = 0) {
        return this.getIndex(plus + this._pl.findIndex(t => t.id == id));
    }

    get nextId() {
        let i = this.getIndexById(this.current, 1);
        
        return this._pl[i].id;
    }
    set nextId(id) {
        const track = this.getTrackById(id);

        if(track) {
            let i = this.getIndexById(this.current, 1);
            this._pl.insert(i, track);
        }
    }

    get prevId() {
        let i = this.getIndexById(this.current, -1);
        
        return this._pl[i].id;
    }
    set prevId(id) {
        const track = this.getTrackById(id);

        if(track) {
            let i = this.getIndexById(this.current);
            this._pl.insert(i, track);
        }
    }

    makeOrder() {
        let ord = this._order;

        if(ord == "direct") {
            this._pl = this._srcPlayList.slice();
        } else if(ord == "reverse") {
            this._pl = this._srcPlayList.slice().reverse();
        } else if(ord == "random") {
            this._pl = this._srcPlayList.slice().sort((a, b) => -1+2*Math.random());
        }
    }
    
    get playList() { return this._pl; }
    set playList(value) {
        if(value instanceof Array && (!this._pl || this._srcPlayList != value)) {
            this._srcPlayList = value;
            
            this.makeOrder();
        }
    }

    get order() { return this._order; }
    set order(value) {
        if(this.orders.includes(value)) {
            this._order = value;
            this.makeOrder();
        }
    }

    constructor() {
        //this.storage = new MusicStorage;

        this.orders = ["direct", "reverse", "random"];
        
        this.index = 0;

        this.current = 0;
        this._srcPlayList = [];
        this._pl = [];
        
        this._order = "direct";

        this.loop = true;

        this._tracks = [];
        this._artists = [];
        this._albums = [];

        this._mapTracks = new Map;
        this._mapArtists = new Map;
        this._mapAlbums = new Map;
    }
};

if(typeof module != 'undefined') {
    module.exports = Music;
}