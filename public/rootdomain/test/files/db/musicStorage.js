const DB = require("./db");

const getObjectWithProps = props => {
    let res = {};

    props.forEach(p => res[p.name] = p.value );

    return res;
};

class MusicStorage extends DB {
    getIdByObject(type, el, clbck = e => {}, transaction) {
        const complex = typeof el == "object",
            name = complex ? el[type] : el,
            upper = name.toUpperCase(),
            tableName = type.concat("s"),
            fieldName = "upper".concat(type[0].toUpperCase(), type.substr(1)),
            trnsctn = transaction || this.transaction([tableName], undefined, clbck);
                
        this.getRowByIndex(tableName, fieldName, upper, row => {
            let obj = row || getObjectWithProps([
                    {name: type, value: name},
                    {name: fieldName, value: upper}
                ]),
                f = aid => {
                    obj.id = aid;
                    
                    this.putRowToTable(tableName, obj, clbck, undefined, trnsctn);
                };

            if(complex)
                for(let p in el)
                    if(!obj[p])
                        obj[p] = el[p];
        
            if(obj.id)
                f(obj.id);
            else
                this.addRowToTable(tableName, obj, f, undefined, trnsctn);
        }, undefined, trnsctn);
    }

    getIdsByObjects(type, els, clbck = e => {}, transaction) {
        const 
            tableName = type.concat("s"),
            trnsctn = transaction || this.transaction([tableName]),
            res = [];

        els.forEach(el => {
            this.getIdByObject(type, el, id => {
                res.push(id);

                if(res.length == els.length)
                    clbck(res);
            }, trnsctn);
        });
    }

    connect(type1, keys1, type2, keys2, clbck = e => {}, transaction) {
        const 
            tableName1 = type1.concat('s'),
            tableName2 = type2.concat('s'),
            trnsctn =
                transaction || this.transaction([tableName1, tableName2], undefined, clbck);
        let cnt = 0,
            f = () => {
                ++cnt;
                if(cnt == 2)
                    clbck();
            };

        keys1.forEach(key => 
            this.addSeveralToArray(tableName1, key, tableName2, keys2, f, trnsctn)
        );

        keys2.forEach(key => 
            this.addSeveralToArray(tableName2, key, tableName1, keys1, f, trnsctn)
        );
    }

    addTrackIdsTo(type, ids, to, clbck = e => {}, transaction) {
        const trnsctn =
            transaction || this.transaction(["tracks", type.concat('s')], undefined, clbck);

        this.getIdByObject(
            type, to,
            id => this.connect(type, [id], "track", ids, clbck, trnsctn),
            trnsctn
        );
    }

    addTrackIdToArtist(trackId, artist, clbck = e => {}) {
        this.addTrackIdsTo("artist", artist, [trackId], clbck);
    }

    addTrackIdsToArtist(trackIds, artist, clbck = e => {}) {
        this.addTrackIdsTo("artist", artist, trackIds, clbck);
    }

    addAlbum(album, ids = [], clbck = e => {}) {
        this.addTrackIdsTo("album", album, ids, clbck);
    }

    updateRelation(table1, table2, newObj, clbck = e => {}, transaction) {
        const trnsctn = transaction || this.transaction(undefined, undefined, clbck),
            id = newObj.id;

        this.editRowFromTable(table2, id, oldObj => {
            let exists = new Map, notExists = [];

            oldObj[table1].forEach(a => exists.set(a, a));

            newObj[table1].forEach(a => {
                let auc = a.toUpperCase();

                if(exists.has(auc))
                    exists.delete(auc);
                else
                    notExists.push(auc);
            });
            
            notExists.forEach(a =>
                this.addToArray(table1, a, table2, id, undefined, trnsctn)
            );

            Array.from(exists.keys()).forEach(a => {
                this.deleteFromArray(table1, a, table2, id, undefined, trnsctn, true);
            });

            oldObj[table1] = newObj[table1];

            return oldObj;
        }, undefined, trnsctn);
    }

    clearTable(table, clbck = e => {}) {
        const trnsctn = this.transaction([table], undefined, clbck);

        let obj = trnsctn.objectStore(table),
            req = obj.clear();
    }

    updateAllTracks(tracks, clbck = ()=>{}) {
        const trnsctn = this.transaction(["artists"], undefined, clbck);

        let obj = trnsctn.objectStore("artists"),
            req = obj.clear();

        req.onsuccess = e => {
            tracks.forEach(t => {
                t.artists.forEach(a => {
                    const mt = this.transaction(["artists", "tracks"]);

                    this.addTrackIdsTo("artist", [t.id], a, undefined, mt);
                    this.putRowToTable("tracks", t, undefined, undefined, mt);
                });
            });
        };
    }

    deleteTrack(id, clbck = e => {}) {
        const trnsctn = this.transaction(undefined, undefined, clbck);

        this.getRowFromTable("tracks", id, track => {
            this.deleteRowFromTable("tracks", id, undefined, undefined, trnsctn);
            this.deleteRowFromTable("trackData", id, undefined, undefined, trnsctn);
    
            for(const aid of track.artists)
                this.editRowFromTable("artists", aid, row => {
                    if(row && row.tracks) {
                        let ind = row.tracks.indexOf(id);

                        if(ind >= 0)
                            row.tracks.splice(ind, 1);

                        if(!row.tracks.length)
                            row = null;
                    }

                    return row;
                }, undefined, trnsctn, true);
    
                for(const album of track.albums)
                    this.editRowFromTable("albums", album, row => {
                        let ind = row.tracks.indexOf(id);
        
                        if(ind >= 0) {
                            row.tracks.splice(ind, 1);
        
                            if(!row.tracks.length)
                                return undefined;
                        }

                        return row;
                    }, undefined, trnsctn);
        }, clbck, trnsctn);
    }
    
    setArtistsAndAlbums(track, artists, albums, clbck = ()=>{}, transaction) {
        console.log(track);

        const trnsctn = transaction || this.transaction(undefined, undefined, clbck),
            imageId = track.imageId, tid = track.id;
        let artIds, albIds;
        
        albums.forEach(alb => alb.imageId = imageId);

        const f = () => {
            if(artIds && albIds)
            this.connect("artist", artIds, "track", [tid], () => {
                this.connect("album", albIds, "track", [tid], () => {
                    console.warn(artIds, albIds);
                    this.connect("artist", artIds, "album", albIds, clbck, trnsctn);
                }, trnsctn);
            }, trnsctn);
        };

        this.getIdsByObjects("artist", artists, ids => {
            artIds = ids;
            f();
        }, trnsctn);
        
        this.getIdsByObjects("album", albums, ids => {
            albIds = ids;
            f();
        }, trnsctn);
    }

    updateTrack(track, clbck = e => {}) {
        track = JSON.parse(JSON.stringify(track));

        const trnsctn = this.transaction(undefined, undefined/* , clbck */),
            artists = track.artists, albums = track.albums, id = track.id;

        track.artists = [];
        track.albums = [];
        
        //this.updateRelation("artists", "tracks", track, undefined, trnsctn);
        //this.updateRelation("albums", "tracks", track, undefined, trnsctn);

        this.editRowFromTable("tracks", id, t => track, () => {
            this.setArtistsAndAlbums(track, artists, albums, clbck, trnsctn);
        }, trnsctn);

/*         for(const ap in arrsprops)
            arrsprops[ap].forEach(e =>
                this.addTrackIdsTo(ap.substr(0, ap.length-1), [id], e)
            ); */
    }

    addTrack(trackInfo, trackData, trackImage, clbck = ()=>{}) {
        if(!(trackData instanceof ArrayBuffer) || trackData.byteLength < 100) {
            console.log("Some problems with track: ", trackData);
            return;
        }

        trackInfo.size = trackData.byteLength;
        trackInfo.upperTitle = trackInfo.title.toUpperCase();
        trackInfo.imageId = 0;

        const trnsctn = this.transaction(undefined, undefined, clbck),
            albums = trackInfo.albums,
            artists = trackInfo.artists;

        trackInfo.albums = [];
        trackInfo.artists = [];

        this.getRowByIndex("tracks", "upperTitle", trackInfo.upperTitle, t => {
            if(t && t.mbid == trackInfo.mbid && Math.abs(t.size - trackInfo.size) < 5e3) {
                trnsctn.commit();
                return;
            }

            this.addRowToTable("tracks", trackInfo, tid => {
                this.putRowToTable("trackData", {trackId: tid, data: trackData});

                trackInfo.id = tid;

                if(trackImage)
                    this.addRowToTable("images", {base64: trackImage}, imgId => {
                        this.editRowFromTable("tracks", tid, t => {
                            t.imageId = imgId;

                            return t;
                        });
                    },
                    () => this.setArtistsAndAlbums(t, artists, albums, clbck, trnsctn),
                    trnsctn);
                else
                    this.setArtistsAndAlbums(trackInfo, artists, albums, clbck, trnsctn);
            }, undefined, trnsctn);
        }, undefined, trnsctn);
    }

    deleteTrackFromAlbum(trackId, albumId, clbck = data => {}) {
        const trnsctn = this.transaction(["tracks", "albums"], undefined, clbck);

        this.deleteFromArray("tracks", trackId, "albums", albumId, undefined, trnsctn);
        this.deleteFromArray("albums", albumId, "tracks", trackId, undefined, trnsctn);
    }

    init() {
        super.init({
            name: "music", version: 1,
            tables: [
                {
                    name: "tracks", key: "id",
                    autoIncrement: true, index: "upperTitle", uniqueIndex: false
                },
                { name: "trackData", key: "trackId" },
                {
                    name: "artists", key: "id", autoIncrement: true,
                    index: "upperArtist", uniqueIndex: false
                },
                {
                    name: "albums", key: "id", autoIncrement: true,
                    index: "upperAlbum", uniqueIndex: false
                },
                { name: "images", key: "id", autoIncrement: true }
            ]
        });
    }

    clear() {
        let request;

        this.db.close();
        request = this.indexedDB.deleteDatabase("music");

        request.onsuccess = e => this.init();
    }

    constructor() {
        super();
    }
};

if(typeof module != 'undefined') {
    module.exports = MusicStorage;
}