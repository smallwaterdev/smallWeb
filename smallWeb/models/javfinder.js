const request = require('request');
const cheerio = require('cheerio');
const EventEmitter = require('events');
const async = require('async');

// configurations
const maxPagePerCategory = require('../config').epornerMaxPagePerCategory;
const indexUrlPerPage = require('../config').javfinderIndexUrlPerPage;
const category_urls = require('../config').javfinder_category_urls;


// data structure
const VideoContent = require('../../data_model/video_content');
const VideoPages = require('../../data_model/video_indices');
const MetaContent = require('../../data_model/meta_content');

// method structure
const JavModel = require('./jav_model');

'use strict';
// decryption 
const CryptoJS = require('crypto-js');
var CryptoJSAesJson = {
    stringify: function (cipherParams) {
        var j = {ct: cipherParams.ciphertext.toString(CryptoJS.enc.Base64)};
        if (cipherParams.iv) j.iv = cipherParams.iv.toString();
        if (cipherParams.salt) j.s = cipherParams.salt.toString();
        return JSON.stringify(j);
    },
    parse: function (jsonStr) {
        var j = JSON.parse(jsonStr);
        var cipherParams = CryptoJS.lib.CipherParams.create({ciphertext: CryptoJS.enc.Base64.parse(j.ct)});
        if (j.iv) cipherParams.iv = CryptoJS.enc.Hex.parse(j.iv);
        if (j.s) cipherParams.salt = CryptoJS.enc.Hex.parse(j.s);
        return cipherParams;
    }
};

var CryptoJSAESdecrypt = function(e,t) {
    try {
        return JSON.parse(CryptoJS.AES.decrypt(e, t, {format: CryptoJSAesJson}).toString(CryptoJS.enc.Utf8));
    } catch(er) {
        return null;
    }
}


///////// category format converter ///////////
/**
 * 
 * @param {*} category 
 * 
 * space to minus, \ to minus, & removed
 * 
 */
function categoryConvert(category){
    category = category.toLowerCase().replace(/ /g, '-');
    category = category.replace(/\//g, '-');
    category = category.replace('-&-', '-');
    return category;
}

/*
* date converting e.g. (Nov, 17th, 2017)
* 2016-04-26T18:09:11Z
*/
function generateDate(month, day, year){
    var months = {
        "Jan": "01",
        "Feb": "02",
        "Mar": "03",
        "Apr": "04",
        "May": "05",
        "Jun": "06",
        "Jul": "07",
        "Aug": "08",
        "Sep": "09",
        "Oct": "10",
        "Nov": "11",
        "Dec": "12"
    }
    month = months[month];
    if(!month){
        month="01";
    }
    day = '' + parseInt(day);
    if(day.length === 1){
        day = '0'+day;
    }
    
    date = new Date(year + '-' + month + '-' + day + 'T00:00:00Z');
    if(date.getTime()){
        return date;
    }else{
        return new Date();
    }
    
}


/**
 * 
 * return examples
 * { domain: 'www.fembed.com', url: 'https://www.fembed.com/v/549y-6dlxol' }
*/
var video_id2url = function(video_id){
    if (video_id.indexOf('drive://') != -1) {
        return {domain: "drive.google.com", 
        url:'https://drive.google.com/file/d/' + video_id.replace('drive://', '') + '/preview'};
    }
    else if (video_id.indexOf('youtube://') != -1) {
        return {domain: "www.youtube.com", 
        url:'https://www.youtube.com/embed/' + video_id.replace('youtube://', '')};
    }
    else if (video_id.indexOf('openload://') != -1) {
        return {domain: "openload.co", 
        url:'https://openload.co/embed/' + video_id.replace('openload://', '')};
    }
    else if (video_id.indexOf('streamcherry://') != -1) {
        return {domain: "streamcherry.com", 
        url:'https://streamcherry.com/embed/' + video_id.replace('streamcherry://', '')};
    }
    else if (video_id.indexOf('rapidvideo://') != -1) {
        return {domain: "rapidvideo.com", 
        url: 'https://www.rapidvideo.com/e/' + video_id.replace('rapidvideo://', '')};
    }
    else if (video_id.indexOf('fembed://') != -1){
        return {domain: "www.fembed.com", 
        url:'https://www.fembed.com/v/' + video_id.replace('fembed://', '')};
    } else {
        console.log(`Unsupported video_id2url ${video_id}`);
        return {domain: null, url: null};
    }
}


//////////////////////////////////////////////////////////////
/**
 * public module data
 */
const logo = '';
const name = 'Javfinder';
const mainpageURL = 'https://javfinder.is'
const errorTitle = '[Error] Javfinder ';
 
/**
 * @param url dataKeyUrl
 * @param videoContent 
 * @param callback (err, url)
 * 
 * url examples
 * https://javfinder.is/stream/sw0/r73w259936d
*/
function videoPage2Frame(url, videoContent, callback){
    if(!url){
        callback(new Error(errorTitle + " [videoPage2Frame] url = null"), null);
        return;
    }
    request(
        url, 
        (err, response, jsontext)=>{
            if(err || response.statusCode !== 200){
                if(err){
                    callback(err, null);
                }else{
                    callback(new Error(`${errorTitle} [videoPage2Frame] Bad request ${response.statusCode} on ${url}`), null);
                }
            }else{
                let videoFrameData;
                
                try{
                    let data_key = JSON.parse(jsontext).data;
                    let video_id = CryptoJSAESdecrypt(data_key,"up3x.com");
                    videoFrameData = video_id2url(video_id);
                    
                }catch(err_){

                    callback(err_, null);
                    return;
                }
                callback(null, videoFrameData);
            }
            
        }
    );
}
/**
 * @param videoFrameData {domain:,url:}
 * @param videoContent 
 * @param callback (err, {domain:url:})
*/
function videoFrame2Content(videoFrameData, videoContent, callback){
    if(!videoFrameData.domain || !videoFrameData.url){
        callback(new Error(`${errorTitle} [videoFrame2Content] Bad argument ${videoFrameData}`));
        return;
    }
    switch(videoFrameData.domain){
        /*case "rapidvideo.com": {
            request(videoFrameData.url, (error, response, htmltext)=>{
                if(error || response.statusCode !== 200){
                    if(error){
                        callback(error, null);
                    }else{
                        callback(new Error(`${errorTitle} [videoFrame2Content] Bad response ${response.statusCode}`));
                    }
                }else{
                    let $ = cheerio.load(htmltext);
                    let video_url = $('#videojs source').attr('src');
                    videoContent.setVideoContentUrl(video_url);
                    videoContent.setVideoContentDomain(videoFrameData.domain);
                    callback(null, videoFrameData);
                }
            });
        };break;*/

        /*case "www.fembed.com": fembedFrame2VideoContentUrl(videoFrameData.url, videoContent, (err, mp4Url)=>{
            callback(err, mp4Url);
        });break;*/
        case "rapidvideo.com":{
            videoContent.setVideoContentUrl(videoFrameData.url);
            videoContent.setVideoContentDomain(videoFrameData.domain);
            callback(null, videoFrameData);
        };break;

        // leave for the browser, realtime-url-with-user-ip
        case "www.fembed.com":{
            videoContent.setVideoContentUrl(videoFrameData.url);
            videoContent.setVideoContentDomain(videoFrameData.domain);
            callback(null, videoFrameData);
        };break;

        default:callback(new Error(`${errorTitle} [videoFrame2Content] domain ${videoFrameData.domain} not supported` ), null);break;
    }
}

function censoredVideoSplitIndexAndTitle(text){
    try{
        let pos = text.indexOf('-');
        if(pos === -1){
            // not found
            return {index: null, title: text};
        }
        let firstPart = text.substring(0, pos).split(' ');
        let secondPart = text.substring(pos+1, text.length-1).split(' ');
        let index = firstPart[firstPart.length-1] + '-' + secondPart[0];
        let titlePos = text.indexOf(index) + index.length;
        let title = text.substring(titlePos + 1, text.length);
        if(index === '-'){
            index=null;
        }
        let videoIndexAndTitle = {
            index: index,
            title: title
        }
        return videoIndexAndTitle;
    }catch(err){
        console.log(errorTitle + "censoredVideoSplitIndexAndTitle");
    }
    return null;
}

function queryContent(indexUrl, successCallback, failCallback){
    const videoContent = new VideoContent("javfinder.is");
    videoContent.setIndexUrl(indexUrl);
    request(
        indexUrl, 
        (error, response, data)=>{
            if(error || response.statusCode != 200){
                console.log(errorTitle + ` videoPage2Content failed on ${indexUrl}`);
                if(error){
                    failCallback(error);
                }else{
                    failCallback(new Error(`response: ${response.statusCode}`));
                }
            }else{
                const $ = cheerio.load(data);
                // core: the video content
                let videoSource = $('#avcms_player').attr('data-src');
                if(!videoSource){
                    failCallback(new Error(`Bad request: ${indexUrl}`));
                    return;
                }
                let titleIndex = $('#wrap-main-home-tab .wrap-meta h1').text();
                // index and title
                let indexAndTitle = censoredVideoSplitIndexAndTitle(titleIndex);
                if(indexAndTitle){
                    videoContent.setTitle(indexAndTitle.title);
                    videoContent.setIndex(indexAndTitle.index);      
                }
                // img
                let imgURL = $('#wrap-main-home-tab img').attr('src');
                videoContent.setImgSummaryUrl(imgURL);
                
                let view = $('#video-watch-count').text().toLowerCase();
                view = view.substring(0, view.length - ' views'.length);
                view = view.split(',');
                let viewNum = '';
                view.forEach(i =>{
                    viewNum += i;
                });
                viewNum = parseInt(viewNum);
                if(viewNum){
                    videoContent.setView(viewNum);
                }
                
                let dislike = parseInt($('.btn-video-dislike').text());
                let like = parseInt($('.btn-video-like').text());
                if(like + dislike !== 0){
                    videoContent.setRating(like / (like + dislike));
                }
                
                
                // studio, tags and one starname, relasedate
                let info = $('#content-main-1 .meta-item');
                info.toArray().forEach((element)=>{
                    switch($('.meta-label', element).text()){
                        case "Studio": videoContent.setStudio($('.meta-content a', element).text());break;
                        case "Genre": $('.meta-content a', element).toArray().forEach((tag)=>{
                            videoContent.addGenre($(tag).text());
                        });break;
                        case "Actor": {
                            $('.meta-content a', element).toArray().forEach((ele) =>{
                                let starname = $(ele).text().toLowerCase();
                                if(starname !== "porn star"){
                                    videoContent.addStarname(starname);
                                }
                            });
                        };break;
                        case "Meta": {
                            let value = $('.meta-content', element).text();
                            let startPos = value.indexOf("Duration") + 10;

                            value = value.substring(startPos, startPos+8);
                            if(value !== "00:00:00"){
                                videoContent.setDuration(value);
                            }
                        };break;
                        case "Release": {
                            let value;
                            try{
                                value = $('.meta-content', element).text();
                                value = value.split(' ');
                                for(let i = 0; i < value.length; i++){
                                    
                                    if(value[i] !== '\n' && value[i] !== ''){
                                        let month = value[i];
                                        let day  =value[i+1];
                                        let year = value[i+2];
                                        videoContent.setReleaseDate(generateDate(month, day, year));
                                        break;
                                    }
                                }
                            }catch(err){
                                console.log(`error to set relase date ${value}`)
                            }
                        };break;
                        default:break;
                    }
                });

                // preview images
                $('.wrap-gallery a').toArray().forEach(ahref=>{
                    videoContent.addImgPreviewUrl($(ahref).attr('href'));
                });
                // videoControlUrl
                
                let dataKeyUrl = mainpageURL + videoSource.replace('/embed/', '/stream/sw0/');
                videoPage2Frame(dataKeyUrl,videoContent, (err, videoFrameData)=>{
                    if(err){
                        failCallback(err);
                    }else{
                        videoContent.setVideoDomain(videoFrameData.domain);
                        videoContent.setVideoUrl(videoFrameData.url);
                        videoContent.setStatus(99);
                        successCallback(videoContent);
                    }
                });
            }
        }
    );
}

///////////////////////////////////////////////////////////////////////////////
/**
 * Indexing functions
 */

function queryPage(pageNumber, successCallback, failCallback){
    request(
        `https://javfinder.is/category/censored/page-${pageNumber}.html`,
        (error, response, data)=>{
            // index page
            const videoPages = new VideoPages();
            if(error || response.statusCode != 200){
                console.log(errorTitle + ` indexPage2VideoPages failed on ${pageUrl}`);
                if(error){
                    failCallback(error);
                }else{
                    failCallback(new Error(`response: ${response.statusCode}`));
                }
            }else{
                const $ = cheerio.load(data);
                $('#primary > .wrap-block .wrap-main-item').toArray().forEach((element)=>{
                    var result = "https://javfinder.is" + $('a', element).attr('href');
                    videoPages.addVideoUrl(result);
                });
                
                videoPages.setStatus('success');
                successCallback(videoPages);
            }
        }
    );
}
function queryCategory(data, successCallback, failCallback){
    if(data && data.category && (typeof data.pageNumber === 'number')){
        category = categoryConvert(data.category);
        let pageUrl = `https://javfinder.is/category/${category}/page-${data.pageNumber}.html`;
        request(
            pageUrl,
            (error, response, htmltext)=>{
                // index page
                const videoPages = new VideoPages();
                if(error || response.statusCode != 200 || (response.request.uri.href !== pageUrl)){
                    console.log(errorTitle + ` indexPage2VideoPages failed on ${pageUrl}`);
                    if(error){
                        failCallback(error);
                    }else if(response.statusCode != 200){
                        failCallback(new Error(`response: ${response.statusCode}`));
                    }else{
                        failCallback(new Error(`Unexpected redirect to: ${response.request.uri.href}`));
                    }
                }else{
                    const $ = cheerio.load(htmltext);
                    $('#primary > .wrap-block .wrap-main-item').toArray().forEach((element)=>{
                        var result = "https://javfinder.is" + $('a', element).attr('href');
                        videoPages.addVideoUrl(result);
                    });
                    
                    videoPages.setStatus('success');
                    successCallback(videoPages);
                }
            }
        );
    }else{
        failCallback(new Error(`${errorTitle} queryCategory: invalid argument ${data}`));
    }
}

///////////////////////// meta data query ///////////////////////////////////////////
function pageNumByCategory(category, success, fail){
    
    // normalized the name
    category = categoryConvert(category);

    const event = new EventEmitter();
    let left = 0;
    let right = maxPagePerCategory;
    let pageNumber = 200;
    let returnError = null;
    let result = new MetaContent("javfinder.is");
    result.setName('pageNumByCategory');

    event.on('end', ()=>{
        success(result);
    });
    event.on('error',()=>{
        fail(returnError);
    });
    event.on('nexttry', ()=>{
        let url = `https://javfinder.is/category/${category}/page-${pageNumber}.html`;
        request(url, (err, res, htmltext)=>{
            // index page
            if(err || res.statusCode != 200 || (res.request.uri.href !== url)){
                if(err){
                    returnError = err;
                    event.emit('error');
                }else if(res.statusCode != 200){
                    returnError = new Error(`response: ${res.statusCode}`);
                    event.emit('error');
                }else{
                    returnError = new Error(`Unexpected redirect to: ${res.request.uri.href}`);
                    event.emit('error');
                }
            }else{
                const $ = cheerio.load(htmltext);
                let length = $('#primary > .wrap-block .wrap-main-item .main-thumb').toArray().length;
                if((length > 0 && length < indexUrlPerPage) || pageNumber === maxPagePerCategory){
                    let value = {category : category, pageNumber: pageNumber};
                    result.setValue(value);
                    event.emit('end');
                }else if(length === 0){
                    // over
                    right = pageNumber;
                    pageNumber = Math.ceil((left + pageNumber) / 2);
                    event.emit('nexttry');
                }else if(length === indexUrlPerPage){
                    // 
                    left = pageNumber;
                    pageNumber = Math.ceil((right + pageNumber) / 2);
                    event.emit('nexttry');
                }else{
                    returnError = new Error(`Unexpected number (${length}) of indexUrl in one page.`);
                    event.emit('error');
                }
            }
        });
    });
    event.emit('nexttry');
}

function categorynames(value, success, fail){
    let categories = [];
    async.each(category_urls, (url, callback_)=>{
        request(
            url,
            (error, response, htmltext)=>{
                // index page
                if(error || response.statusCode != 200){
                    if(error){
                        callback_(error);
                    }else{
                        callback_(new Error(`response: ${response.statusCode}`));
                    }
                }else{
                    const $ = cheerio.load(htmltext);
                    $('#primary > .wrap-block .wrap-main-item h5').toArray().forEach((element)=>{
                        let result = $('a', element).text();
                        categories.push(result);
                    });
                    callback_();
                }
            }
        );
    }, (err)=>{
        if(err){
            fail(err);
        }else{
            let metaResult = new MetaContent('javfinder.is');
            metaResult.setName("categorynames");
            metaResult.setValue({categories: categories});
            success(metaResult);
        }
    });
}


const javfinder = new JavModel();
javfinder.queryContent = queryContent;
javfinder.queryPage = queryPage;
javfinder.queryCategory = queryCategory;
javfinder.queryMeta.pageNumByCategory = pageNumByCategory;
javfinder.queryMeta.categorynames = categorynames;
module.exports = javfinder;

