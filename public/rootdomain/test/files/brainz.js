function getImageToBase64(src, callback = base64 => {}) {
  if(!src) {
    callback();
    return;
  }

  const xhr = new XMLHttpRequest;

  xhr.onload = () => {
    const reader = new FileReader();
    reader.onloadend = () => callback(reader.result);
    reader.readAsDataURL(xhr.response);

    //callback(xhr.responseText, btoa(xhr.responseText));
  }

  xhr.open('GET', src);
  xhr.send();
}

function getCoverSrc(releaseId, callback = (src, thumb, imgData) => {}) {
  const addr = `http://coverartarchive.org/release/${releaseId}`,
    xhr = new XMLHttpRequest;

  xhr.onload = () => {
    let src, obj, thumb;

    if(xhr.status == 200) {
      try {
        obj = JSON.parse(xhr.responseText);

        if(obj.images)
          for(const d of obj.images)
            if(!d.back) {
              src = d.image;
              thumb = d.thumbnails;
              thumb.original = src;
              break;
            }
      } catch(e) {};
    }
    
    callback(src, thumb, obj);
  };

  xhr.onerror = callback;

  xhr.open('GET', addr);
  xhr.send();
}

function getSong(title, artist, callback = obj => {}) {
  let query = "", addr,
    xhr = new XMLHttpRequest;

  if(artist)
    query = `artistname:'${artist}' AND recordingname:'${title}'`;
  else
    query = `'${title}'`;

  addr = encodeURI(`http://musicbrainz.org/ws/2/recording?query=${query}&limit=3&fmt=json`);

  console.log(addr);

  xhr.onload = () => {
    let obj;

    if(xhr.status == 200) {
      try {
        obj = JSON.parse(xhr.responseText);
      } catch(e) {};
    }

    callback(obj, xhr.responseText);
  };

  xhr.onerror = () => {
    console.log(xhr);
    if(xhr.status == 0) {
      setTimeout(() => {
        xhr.open('GET', addr);
        xhr.send();
      }, 1e3);
    } else
      callback();
  };

  xhr.open('GET', addr);
  xhr.send();
}

function getInfo(obj, callback = resObj => {}) {
  if(obj && obj.recordings && obj.recordings.length) {
    const res = {}, rs = obj.recordings;

    let record = rs[0].releases || rs.length == 1 ? rs[0] : rs[1].releases ? rs[1] : rs[0];

    res.mbid = record.id;
    res.title = record.title;
    res.length = record.length;
    res.artists = new Array;
    res.albums = new Array;
    res.year = undefined;
    //res.imageSrc = undefined;

    for(const art of record['artist-credit']) {
      const a = art.artist;

      res.artists.push({mbid: a.id, artist: a.name, description: a.disambiguation});
    }

    if(record['releases'] && record['releases'].length)
      for(const alb of record['releases']) {
        const albObj = {mbid: alb.id, album: alb.title, date: alb.date/* , imageSrc: undefined */};
        getCoverSrc(albObj.mbid, (src, thumbnails, imageData) => {
          alb.imageData = imageData;
          albObj.thumbnails = thumbnails;
          //albObj.imageSrc = src;
          res.albums.push(albObj);

          if(res.albums.length == record['releases'].length) {
            res.year = parseInt(albObj.date);
            callback(res);
          }
        });
      }
    else
      callback(res);
  } else
    callback();
}

function checkResult(title, artist, resObj) {
  if(!resObj)
    return false;

  const
    tu = title.toUpperCase(), au = (artist || "").toUpperCase(),
    rtu = resObj.title.toUpperCase(), rau = resObj.artists[0].artist.toUpperCase(),
    titCheck = rtu.includes(tu) || tu.includes(rtu),
    artCheck = rau.includes(au) || au.includes(rau) || tu.includes(rau);

    if(rtu.length < tu.length)
      resObj.title = title.replace(title.substr(tu.indexOf(rtu), rtu.length), resObj.title);

  return titCheck && artCheck;
}

function brainz(title, artist, callback = (resObj, response) => {}) {
  getSong(title, artist, obj => {
    getInfo(obj, res => {
      if(checkResult(title, artist, res))
        callback(res, obj);
      else
        callback(undefined, obj);
    });
  });
}

if(typeof module != 'undefined') {
    module.exports = {getAllInfo: brainz, getCoverSrc: getCoverSrc, getSong: getSong};
}