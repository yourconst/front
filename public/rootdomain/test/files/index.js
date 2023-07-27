require("./prototypes");

const
    Bind = require("../bind"),
    Animation = Bind.Animation,
    ID3 = require("id3-reader"),
    getTrackInfo = require("./trackInfo"),
    AudioAux = require("./audioAux"),
    MusicStorage = require("./musicStorage"),
    MenuVisual = require("./menuVisual"),
    ACTX = require("../actx"),
    Music = require("./music"),
    Visualization = require("./visualization"),
    brainz = require("./brainz");

global.brainz = brainz;

const
    actx = new ACTX,
    music = new Music,
    visualization = new Visualization(visualityDiv);
    
global.actx = actx;
global.music = music;
global.visualization = visualization;
    
global.makeSomeSongDiv = makeSomeSongDiv;
global.makeSongDiv = makeSongDiv;

global.lastPage = "lists";

let layer = require("./Layer"),
    emptyCover = require("./emptyCover"),
    musicStorage = new MusicStorage,
    menuVisual = new MenuVisual(menuCanvas),
    bind,
    pgAnim = new Animation(0.6, "bezier"),
    aAux;

    
global.layer = layer;
global.musicStorage = musicStorage;
global.menuVisual = menuVisual;
global.ID3 = ID3;



function removeClassFrom(fromClass, className = fromClass) {
    let els = Array.from(document.getElementsByClassName(fromClass));

    els.forEach(e => e.classList.remove(className));
}

function addClassTo(toClass, className) {
    let els = Array.from(document.getElementsByClassName(toClass));

    els.forEach(e => e.classList.toggle(className));
}

function displayActiveTrack(id) {
    removeClassFrom("listening");
    addClassTo(`track${id}`, "listening");
}

function updateAllTracks() {
    musicStorage.getAllFromCachedTable("artists", arr => {
        music.setArtists(arr);
        makeArtistDiv(arr, true);
    });
    musicStorage.getAllFromCachedTable("albums", arr => {
        music.setAlbums(arr);
        makeAlbumDiv(arr, true);
    });
    musicStorage.getAllFromCachedTable("tracks", arr => {
        music.setTracks(arr);
        makeSongDiv(arr, true);
    });
}

global.updateAllTracks = updateAllTracks;

let chooseAction = "play", chooseList = [];

global.changeAction = act => {
    if(act == "play") {
        popup.style.display = "none";
        extraButton.value = ":";
    }

    if(act != chooseAction) {
        removeClassFrom(chooseAction);
        chooseAction = act;
        chooseList.length = 0;
    } else
        chooseAction = act;
};

global.endAction = (str) => {
    switch(chooseAction) {
        case "deleting":
            chooseList.forEach(id => musicStorage.deleteTrack(id, updateAllTracks));
            break;
        case "addition":
            let tmp = [].concat(chooseList);
            musicStorage.addAlbum(str, tmp, updateAllTracks);
            break;
    }
    changeAction("play");
};

function addOrRemove(id, elem, className) {
    if(elem.classList.contains(className)) {
        elem.classList.remove(className);

        if(chooseList.indexOf(id) != -1)
            chooseList.splice(chooseList.indexOf(id));
    } else {
        chooseList.push(id);
        elem.classList.add(className);
    }
}

global.songClick = (id, elem) => {
    switch(chooseAction) {
        case "play":
            if(music.playList != songsTable.setList) {
                music.playList = songsTable.setList;
                makeSomeSongDiv(playListTable, music.playList);
            }
            playSongWithId(id);
            break;
        case "deleting":
            addOrRemove(id, elem, "deleting");
            break;
        case "addition":
            addOrRemove(id, elem, "addition");
            break;
    }
};

global.extraVariant = variant => {
    popup.style.display = "none";
    changeAction(variant);
};

global.extra = elem => {
    const wasNot = elem.value == ':';

    popupHead.innerHTML = "";
    popup.style.display = "block";

    if(wasNot) {
        elem.value = "\/";
        popupTable.tBodies[0].innerHTML =
            `
            <tr>
                <td onclick='extraVariant("addition")'>Add to Playlist</td>
            </tr>
            <tr>
                <td onclick='extraVariant("deleting")'>Delete</td>
            </tr>
            <tr>
                <td onclick='extraVariant("play")'>Cancel</td>
            </tr>
            `;
    } else {

        if(!chooseList.length) {
            changeAction("play");
            return;
        }

        if(chooseAction == "deleting") {
            popupHead.innerHTML = `Are you want delete these ${chooseList.length} tracks`;
            popupTable.tBodies[0].innerHTML =
                `
                <tr>
                    <td onclick='endAction()'>Delete</td>
                    <td onclick='changeAction("play")'>Cancel</td>
                </tr>
                `;
        } else if(chooseAction == "addition") {
            popupHead.innerHTML = `To which playlist you want add
                                    these ${chooseList.length} tracks`;
            global.albumNameText = "Unknown";
            popupTable.tBodies[0].innerHTML =
                `
                <tr><td colspan="2">
                    <input type="text" class="searcher" oninput='albumNameText = this.value;'>
                </td></tr>
                <tr>
                    <td onclick='endAction(albumNameText)'>Add</td>
                    <td onclick='changeAction("play")'>Cancel</td>
                </tr>
                `;
        }
    }
};

function makeSomeSongDiv(div, songs) {
    let str = "";

    songs.forEach(s => {
        const as = music.getArtistsByIds(s.artists).map(a => a.artist);

        str += `<tr class='track${s.id}' onclick='songClick(${s.id}, this)'>
                    <td>${s.title}</td>
                    <td>${as.join(", ")}</td>
                </tr>`
    });

    div.tBodies[0].innerHTML = str;
    div.tFoot.innerHTML = `<tr><td><br></td></tr>
        <tr><td align="center" colspan='3'>Count of songs: ${songs.length}</td></tr>`;

    displayActiveTrack(music.current);
}

function makeSongDiv(songs = music._tracks, setList=false, from="") {
    makeSomeSongDiv(songsTable, songs);

    songSearcher.placeholder = "search in ".concat(from ? from : "all music");

    songsTable.playList = songs;

    if(setList)
        songsTable.setList = songs;
}

global.chooseArtist = id => {
    let art = music.getArtistById(id);

    makeSongDiv(music.getTracksByIds(art.tracks), true, "artist: ".concat(art.artist));
    
    toPage("songs", "artist", art.artist);
    //pages.goPage("songs");
};

global.chooseAlbum = id => {
    let tracks = music.getAlbumTracks(id);

    makeSongDiv(tracks, true, "album: ".concat(music.getAlbumById(id).album));
    
    toPage("songs", "album", id);
    //pages.goPage("songs");
};

function sortByProp(arr, prop) {
    return arr.sort(
        (left, right) => {
            let a = left[prop], b = right[prop];

            if(a > b)
                return 1;
            else if(a < b)
                return -1;
            else
                return 0;
        }
    )
}

function sortByPropFromProp(arr, prop, pprop) {
    return arr.sort(
        (left, right) => {
            let a = left[prop][pprop], b = right[prop][pprop];

            if(a > b)
                return 1;
            else if(a < b)
                return -1;
            else
                return 0;
        }
    )
}

global.sortSongsBy = prop => {
    if(prop == "artist")
        makeSongDiv(sortByPropFromProp(songsTable.playList, "artists", "0"));
    else
        makeSongDiv(sortByProp(songsTable.playList, prop));
    
};

global.sortArtistBy = prop => {
    if(prop == "tracks")
        makeArtistDiv(sortByPropFromProp(artistsTable.setList, "tracks", "length"));
    else
        makeArtistDiv(sortByProp(artistsTable.setList, prop));
};

global.sortAlbumBy = prop => {
    if(prop == "tracks")
        makeAlbumDiv(sortByPropFromProp(albumsTable.setList, "tracks", "length"));
    else
        makeAlbumDiv(sortByProp(albumsTable.setList, prop));
};

function makeArtistDiv(artists, setList = false) {
    let str = "";

    artists.forEach(a =>
        str += `<tr onclick='chooseArtist(${a.id}, this)'>
                    <td>${a.artist}</td>
                    <td>${a.tracks.length}</td>
                </tr>`
    );

    artistsTable.tBodies[0].innerHTML = str;
    artistsTable.tFoot.innerHTML = `<tr><td colspan='2'><br></td></tr>
        <tr><td align="center" colspan='2'>Count of artists: ${artists.length}</td></tr>`;

    if(setList)
        artistsTable.setList = artists;

    //displayActiveTrack(music.current);
}

function setAlbumCover(aid, src) {
    const imgs = Array.from(document.getElementsByClassName(`coverOfAlbum${aid}`));
    
    imgs.forEach(img => img.src = src);
    //imgs.forEach(img => img.style.backgroundImage = `url(${src})`);
}

function getAlbumCover(aid) {
    const a = typeof aid == "object" ? aid : music.getAlbumById(aid);
    let res = "";

    //setAlbumCover(a.id, emptyCover);

    if(a.thumbnails)
        res = a.thumbnails["small"] || a.thumbnails["large"] || a.thumbnails.original;
        
    if(res)
        setAlbumCover(a.id, res);
}

function getAlbumsCovers(albums = music._albums) {
    albums.forEach(getAlbumCover);
}

global.setAlbumCover = setAlbumCover;
global.getAlbumCover = getAlbumCover;
global.getAlbumsCovers = getAlbumsCovers;

function makeAlbumDiv(albums, setList = false) {
    let str = "";

    albums.forEach(a =>
        str += `<tr onclick='chooseAlbum(${a.id}, this)'>
                    <td><img class="albumCover coverOfAlbum${a.id}"></td>
                    <td>${a.album}</td>
                    <td>${a.tracks.length}</td>
                </tr>`
    );

    albumsTable.tBodies[0].innerHTML = str;
    albumsTable.tFoot.innerHTML = `<tr><td colspan='3'><br></td></tr>
        <tr><td align="center" colspan='3'>Count of albums: ${albums.length}</td></tr>`;

    if(setList)
        albumsTable.setList = albums;
    
    getAlbumsCovers(albums);
    //displayActiveTrack(music.current);
}

global.findSongs = str => {
    makeSongDiv(music.getTracksByStr(str, songsTable.setList));
    songSearcher.value = str;
};

global.findArtists = str => {
    makeArtistDiv(music.getArtistsByStr(str), true);
    artistSearcher.value = str;
};

global.findAlbums = str => {
    makeAlbumDiv(music.getAlbumsByStr(str), true);
};

global.clearDB = () => musicStorage.clear();

function checkNameInArrs(field, target, src) {
    if(target && src) {
        const tmap = new Map;

        target.forEach(e => tmap.set(e[field].toUpperCase(), 1));

        src.forEach(e => {
            if(!tmap.has(e[field].toUpperCase()))
                target.push(e);
        });
    }
}

global.updateAllTracksInfo = (callback = (ind, arr) => {}) => {
    //const transaction = musicStorage.transaction(undefined, undefined, updateAllTracks);
    const m = music._tracks;
    let cur = 0;
    
    musicStorage.clearTable("artists");
    musicStorage.clearTable("albums");

    function f() {
        const
            t = JSON.parse(JSON.stringify(m[cur])),
            o = t.origin,
            info = getTrackInfo(o.filename, o.title, o.artist, o.album, o.year);

        t.title = info.title;
        t.artists = info.artists;
        t.albums = info.albums;
        t.year = info.year;

        brainz.getAllInfo(t.title, t.artists[0].artist, (res) => {
            if(++cur < m.length)
                f();

            if(res) {
                t.mbid = res.mbid;
                t.title = res.title;
                checkNameInArrs("artist", t.artists, res.artists);
                checkNameInArrs("album", t.albums, res.albums);
                /* t.artists = res.artists || t.artists;
                t.albums = res.albums || t.albums; */
                t.length = res.length;
                t.year = res.year;
            }

            musicStorage.updateTrack( t/*,  updateAllTracks  */);
            callback(cur, m);
            
            if(cur == m.length)
                updateAllTracks();
        });
    }

    f();

    //musicStorage.forceUpdateTrack(t, undefined, transaction);
    //musicStorage.updateAllTracks(music._tracks, updateAllTracks);
};

global.updateAllAlbumsInfo = () => {
    //const trnsctn = musicStorage.transaction(undefined, undefined, updateAllTracks);
    let cnt = 0, cnt2 = 0;

    music._albums.forEach(a => {
        if(a.mbid) {
            ++cnt;
            delete a.imageSrc;
            
            brainz.getCoverSrc(a.mbid, (src, thumb) => {
                ++cnt2;
                a.thumbnails = thumb;
                musicStorage.editRowFromTable("albums", a.id, oa => a);

                if(cnt == cnt2) {
                    updateAllTracks();
                    //musicStorage.updateAllAlbums(music._albums, updateAllTracks);
                    alert(`${cnt} albums updated`);
                }
            });
        }
    });
};

global.onUpdateClick = (elem) => {
    elem.disabled = true;

    updateAllTracksInfo((current, arr) => {
        updateInfo.innerText = `${current} / ${arr.length}`;

        if(current + 1 >= arr.length)
            elem.disabled = false;
    });
};

const aToLen = new Audio;

function onFile(f, onend = tinfo => {}) {
    let fr = new FileReader(),
        url = f.urn || f.name,
        picture, trackInfo;

    fr.onload = event => {
        musicStorage.addTrack(trackInfo, event.target.result, picture);
        actx.changeSource(event.target.result);
    }

    ID3.loadTags(url, function() {
        var tags = ID3.getAllTags(url);
        
        picture = tags.picture;
        trackInfo = getTrackInfo(f.name, tags.title, tags.artist, tags.album, tags.year);

        aToLen.src = URL.createObjectURL(f);

        console.log(tags);
        console.log(trackInfo);
        
        let cover64;

        if(picture && picture.data)
            cover64 = "data:".concat(picture.format).concat(";base64,")
                    .concat(btoa(new Uint8Array(picture.data).buffer.toString2()));

        brainz.getAllInfo(
            trackInfo.title,
            trackInfo.artists.length ? trackInfo.artists[0].artist : undefined,
            (my, serv) => {
                console.log(my, serv);

                f.arrayBuffer().then(buf => {
                    if(my) {
                        my.origin = trackInfo.origin;
                        trackInfo = my;
                    }

                    trackInfo.length = 1e3 * aToLen.duration || trackInfo.length;
                    musicStorage.addTrack(trackInfo, buf, cover64, onend);
                });
            }
        );

        //fr.readAsArrayBuffer(f);
    }, {
        tags: ["title","artist","album","year","picture"],
        dataReader: ID3.FileAPIReader(f)
    });
}

let CII;
file.oninput = function(event) {
    let fs = file.files,
        clbck = event => {
            if(event)
                console.log(event);
            ++CII;
            updateAllTracks();

            if(CII < fs.length)
                onFile(fs[CII], clbck);
        };

    if(!fs.length)
        return;

    CII = -1;
    clbck();
};

function setCover(song) {
    if(song.imageId) 
        musicStorage.getRowFromTable("images", song.imageId, row => {
            coverIMG.src = row.base64;
        });
    else {
        let isCover = false;

        for(const a of music.getAlbumsByIds(song.albums))
            if(a.imageId || a.thumbnails) {
                if(a.imageId)
                    musicStorage.getRowFromTable("images", a.imageId,
                        row => coverIMG.src = row.base64
                    );
                if(a.thumbnails)
                    coverIMG.src = a.thumbnails["500"]
                                || a.thumbnails["250"]
                                || a.thumbnails.original;
                    
                isCover = true;
                break;
            }

        if(!isCover)
            coverIMG.src = emptyCover;
    }
}

var songsLoading = 0;

global.playSongWithId = id => {
    if(music.current == id)
        playChange();
    else {
        let song = music.getTrackById(id);

        aAux.setInfo(song.title, (music.getArtistById(song.artists[0])||{}).artist);

        titleQueuee.innerHTML = aAux._audio.title;

/*         if(aAux.firstTime)
            aAux.start(); */

        if(!songsLoading && !actx.paused) {
            actx.postVolume = 0;
            menuVisual.pause();
        }

        ++songsLoading;

        setCover(song);

        musicStorage.getRowFromTable("trackData", id, row => {
            actx.changeSource(row.data);
            /* actx.changeSource("data:audio/mp3;base64,".concat(btoa(row.data.toString2())));
            document.appendChild(actx.src.src.element); */

/*             if(music.playList != songsTable.setList)
                music.playList = songsTable.setList; */
            music.current = id;

            displayActiveTrack(id);
        });
    }
};

var lastVolume = 1;

function checkPlayState() {
    aAux.paused = actx.paused;

    if(actx.paused) {
        actx.postVolume = 0;
        menuVisual.pause();
    }
    else if(!songsLoading) {
        actx.postVolume = 1;
        menuVisual.play();
    }
}

global.prevSong = () => {
    let id = music.prevId;
    
    if(music.current != id)
        playSongWithId(id);
};

global.nextSong = () => {
    let id = music.nextId;
    
    if(music.current != id)
        playSongWithId(id);
};

global.playChange = () => {
    if(actx.paused)
        actx.play();
    else
        actx.pause();

    //checkPlayState(); callback in actx.onplaychange
}

let vctoid = 0;

global.volumeChange = () => {
    gainRange.style.height = "30px";

    clearTimeout(vctoid);

    vctoid = setTimeout(() => gainRange.style.height = "15px", 500);
};

function closeSongDiv() {
    setTimeout(() => songBlockBG.style.opacity = "0", 400);

    songBlock.style.bottom = "60px";
    songBlock.style.height = "48px";
    closeSongButton.style.top = "-60px";

    coverIMG.style.top = "3px";
    coverIMG.style.left = "10px";
    coverIMG.style.width = "40px";
    coverIMG.style.height = "40px";

    titleBlock.style.top = "12px";
    titleBlock.style.right = "150px";
    titleBlock.style.width = "calc(100% - 210px)";
    prevPlayNextBlock.style.top = "6px";
    prevPlayNextBlock.style.width = "150px";
}

global.closeSongDiv = closeSongDiv;

function openSongDiv() {
    songBlockBG.style.opacity = "1";
    
    songBlock.style.bottom = "0px";
    songBlock.style.height = "100%";
    closeSongButton.style.top = "0px";

    coverIMG.style.top = "10%";
    coverIMG.style.left = "10vw";
    coverIMG.style.width = "80vw";
    coverIMG.style.height = "80vw";

    titleBlock.style.top = "calc(20% + 80vw - 30px)";
    titleBlock.style.right = "10vw";
    titleBlock.style.width = "80vw";
    prevPlayNextBlock.style.top = "calc(20% + 80vw + 30px)";
    prevPlayNextBlock.style.width = "100%";
}

global.songBlockClick = event => {
    const el = event.srcElement;

    if(el.tagName == "INPUT" || el == closeSongButton)
        return;

    openSongDiv();
};

function startUp() {
    let pgs = ["lists", "songs", "visuality", "settings", "add", "songs"];

    for(let i=0; i<pgs.length; ++i)
        setTimeout(pg => toPage(pg), 200 * i, pgs[i]);

    setTimeout(openSongDiv, 1e3);
    setTimeout(closeSongDiv, 2e3);
    
    setTimeout(() => {
        //coverIMG.src = menuCanvas.toDataURL();
        startUpDiv.style.display = "none";

        setTimeout(() => {
            const type = layer.visType;
            layer.visType = type == "spiral" ? "circle" : "spiral";
            layer.visType = type;
        }, 1e3);
    }, 200 * (pgs.length));
}

global.toPage = (pgname, from = "", id = undefined) => {
    let per = 
        ({lists: 0, songs: 0.2, visuality: 0.4, settings: 0.6, add: 0.8})[pgname] || 0;

    if(pgname == "songs" && lastPage == "songs")
        makeSongDiv(undefined, true, from);
        
    if(pgname == "lists" && lastPage == "lists")
        openList();

    if(pgname == "visuality") {
        footer.style.background = layer.visBG;
        //menuContainer.style.color = "white";
        //themeColor.content = "black";
    } else {
        footer.style.background = "#ffffff";
        //menuContainer.style.color = "black";
        //themeColor.content = "white";
    }

    lastPage = pgname;
    thisPageFrom = from;
    thisPageFromId = id;
    
    pgAnim.begin(per);
};

let lastList;

global.openList = (elem, cnt = 0) => {
    if(lastList) {
        let ps = lastList.previousElementSibling.children[0];

        ps.style.marginLeft = "20px";
        lastList.style.height = "0px";
        listContainer.children[0].style.marginTop = "100px";
    }

    if(!elem && lastList)
        elem = lastList.previousElementSibling;

    if(elem) {
        let curList = elem.nextElementSibling;

        if(lastList != curList) {
            let ps = curList.previousElementSibling.children[0];

            lastList = curList;
            ps.style.marginLeft = `calc(50% - ${ps.scrollWidth / 2}px)`;
            lastList.style.height = "calc(100% - 60px)";
            elem.parentNode.children[0].style.marginTop = `-${60 * cnt}px`;
        } else
            lastList = null;
    }
};

window.onload = () => {
    actx.update();
    actx.onended = nextSong;

    actx.onplaychange = checkPlayState;

    actx.onchange = () => {
        currentTimeRange.max =
            music.getTrackById(music.current).length / 1e3 || actx.duration;
        currentTimeRange.value = actx.currentTime;
        
        --songsLoading;
    }

    actx.ondurationchange = () => {
        //currentTimeRange.title =
            currentTimeRange.value = actx.currentTime;

        if(!currentTimeRange.single.animation.animate) {
            //currentTimeRange.single.oAnimation.base = currentTimeRange.value;
            currentTimeRange.single.eAnimation.target = currentTimeRange.value;
            currentTimeRange.single.oAnimation.target = currentTimeRange.value;
        }
    };
    
    //pages = new Pages();
    //pages.goPage("artists");
    actx.mainDataSize = 4;
    menuVisual.pointsCount = 16 << actx.mainDataSize;

    visualization.canvas.onclick = e => visSetDiv.style.top = "0%";
    visSetClose.onclick = e => visSetDiv.style.top = "-100%";

    visualization.canvas.style = "width: 100%; height: 100%;";

    aAux = new AudioAux(777);

    aAux.onplaychange = playChange;
    aAux.onnext = nextSong;
    aAux.onprevious = prevSong;

    bind = new Bind;
    bind.autoAnimate = true;

    global.bind = bind;

    musicStorage.onopen = e => updateAllTracks();
    //musicStorage.oncreate = e => updateAllTracks();
    musicStorage.onerrorcreate = e => console.log(e);
    musicStorage.onerror = e => console.log(e);

    musicStorage.init();
    
    main();
    startUp();
};

function main() {
    let st = pgAnim.getCurrentState();
    pointer.style.left = `${100 * st}%`;

    //pagesContainer.scrollTop = 0;
    pagesContainer.scrollLeft = Math.round(st * (4 + pagesContainer.scrollWidth));

    if(st > 0.2 && st < 0.6) //lastPage == "visuality")
        visualization.update(actx.currentData);
    menuVisual.draw(actx.currentMainData[1]);
    
    /* icon.href = iconA.href = iconB.href = iconC.href =
        coverIMG.src = menuCanvas.toDataURL(); */

    requestAnimationFrame(main);
}