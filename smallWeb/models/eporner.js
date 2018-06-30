const request = require('request');
const cheerio = require('cheerio');
const EventEmitter = require('events');
const async = require('async');

// configurations
const maxPagePerCategory = require('../config').epornerMaxPagePerCategory;
const indexUrlPerPage = require('../config').epornerIndexUrlPerPage;
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
/////////////////////////////////////////
/**
 * public module data
 */
const logo = '';
const name = 'Eporner';
const mainpageURL = 'https://eporner.com'
const errorTitle = '[Error] Eporner ';
 
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

function generateDuration(duration){
    // e.g. 11:40 => 11 * 60 + 40 = 660 + 40 = 700,
    // 01:11:40 => 3600 + 700 = 4300
    try{
        let times = duration.split(':');
        let unit = times.length;
        let result = 0;
        for(let i = 0; i < times.length; i++){
            let temp = 1;
            for(let i_2 = 0; i_2 < unit - 1; i_2 ++){
                temp *= 60;
            }
            result += Number(times[i]) * temp;
            unit -= 1;
        }
        return result;
    }catch(err){
        return 0;
    }
}



//////////////////////////////////////////////////////////////

/**
 * indexUrl:  https://www.eporner.com/hd-porn/7WbDa4JIXLU/Teen-hidden-masturbating-Stepfathers-Perfect-Fit/
*/

function queryContent(indexUrl, successCallback, failCallback){
    const videoContent = new VideoContent("eporner.com");
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
                
                // imgSummaryUrl
                let scripts = $('#moviexxx script').toArray();
                let script = scripts[scripts.length - 1];
                let imgSummaryText = $(script).html();
                let startP = imgSummaryText.indexOf("poster");
                let endP = imgSummaryText.indexOf("playbackRates");
                let imgSummaryUrl = imgSummaryText.substring(startP + "poster: '".length, endP - "', ".length);
                videoContent.setImgSummaryUrl(imgSummaryUrl);

                // title
                
                let title = $('#undervideomenu h1').html();
                let e_p = title.indexOf('<span');
                if(e_p > 0){
                    title = title.substring(0, e_p - 1);
                }
                videoContent.setTitle(title);

                // videoUrl
                let videoUrl = "https://www.eporner.com/embed/" + indexUrl.split('/')[4];
                videoContent.setVideoUrl(videoUrl);
                // videoUrls
                let videoUrls = $("#hd-porn-dload table tr");
                videoUrls.toArray().forEach(ele=>{
                    let resolution = $('strong', ele).html();
                    resolution = resolution.substring(0, resolution.length - 2);
                    videoContent.addVideoUrl(resolution ,'https://www.eporner.com' + $('a', ele).attr('href'));
                });
                videoContent.setVideoDomain('eporner.com');
                // imgPreviewUrls
                let previewUrls = $('#cutscenes .cutscenesbox');
                previewUrls.toArray().forEach(ele=>{
                    videoContent.addImgPreviewUrl($('a', ele).attr('href'));
                });
                // starnames, 
                let meta = $('#hd-porn-tags table tr');
                meta.toArray().forEach(ele=>{
                    let data = $('td', ele).toArray();
                    if($('td strong', ele).html().indexOf('Pornstars') !== -1){
                        if(data.length === 2){
                            let starnames = $('td > a', data[1]).toArray();
                            for(let s_i = 0; s_i < starnames.length - 1; s_i ++){
                                videoContent.addStarname($(starnames[s_i]).html());
                            }
                        }
                    }else if($('td strong', ele).html().indexOf('Categories') !== -1){
                        if(data.length === 2){
                            let genres = $('td > a', data[1]).toArray();
                            for(let g_i = 0; g_i < genres.length - 1; g_i ++){
                                videoContent.addGenre($(genres[g_i]).html());
                            }
                        }
                    }
                });
                // duration
                $('head meta').toArray().forEach(ele=>{
                    
                    if($(ele).attr('name') === 'description'){
                        
                        let content = $(ele).attr('content');
                        let s_p = content.indexOf('Duration');
                        let e_p = content.indexOf('available');
                        let duration = content.substring(s_p + 'Duration: '.length, e_p - 2);
                        videoContent.setDuration(generateDuration(duration));
                    }
                });
                // views
                let v_p = $('#cinemaviews').html().indexOf('<small>');
                let number = $('#cinemaviews').html().substring(0, v_p);
                number = number.split(',');
                let viewNum = '';
                number.forEach(i =>{
                    viewNum += i;
                });
                viewNum = parseInt(viewNum);
                videoContent.setView(viewNum);
                // rating
                let rating = parseInt($('#ratingValue').html());
                videoContent.setRating(rating / 100);
                videoContent.setStatus(99);
                successCallback(videoContent);
            }
        }
    );
}

////////////////////////////////index query ///////////////////////////////////////////////
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
                console.log(errorTitle + ` queryPage failed on ${pageUrl}`);
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
        let category = categoryConvert(data.category);
        let pageUrl; 
        if(data.pageNumber === 1){
            pageUrl = `https://www.eporner.com/category/${category}/PROD-pro/`;
        }else{
            pageUrl = `https://www.eporner.com/category/${category}/PROD-pro/${data.pageNumber}/`;
        }
        request(
            pageUrl,
            (error, response, htmltext)=>{
                // index page
                const videoPages = new VideoPages();
                if(error || response.statusCode != 200 || (response.request.uri.href !== pageUrl)){
                    console.log(errorTitle + ` queryCategory failed on ${pageUrl}`);
                    if(error){
                        failCallback(error);
                    }else if(response.statusCode != 200){
                        failCallback(new Error(`response: ${response.statusCode}`));
                    }else{
                        failCallback(new Error(`Unexpected redirect to: ${response.request.uri.href}`));
                    }
                }else{
                    const $ = cheerio.load(htmltext);
                    $('#vidresults > .mb').toArray().forEach((element)=>{
                        var result = "https://www.eporner.com" + $('a', element).attr('href');
                        
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
    let lastTry = -1;
    let returnError = null;
    let result = new MetaContent("eporner.com");
    result.setName('pageNumByCategory');

    event.on('end', ()=>{
        success(result);
    });
    event.on('error',()=>{
        fail(returnError);
    });
    event.on('nexttry', ()=>{
        let url;
        if(pageNumber === 1){
            url = `https://www.eporner.com/category/${category}/PROD-pro/`;
        }else{
            url = `https://www.eporner.com/category/${category}/PROD-pro/${pageNumber}/`;
        }
        console.log(url);
        request(url, (err, res, htmltext)=>{
            // index page
            if(lastTry === pageNumber){
                console.log('xxxx');
                pageNumber--;
                lastTry--;
            }
            if(err || res.statusCode != 200 || (res.request.uri.href !== url)){
                if(err){
                    console.log('err', url);
                    returnError = err;
                    event.emit('error');
                }else if(res.statusCode != 200){
                    if(res.statusCode == 404){
                        // go back
                        
                        right = pageNumber;
                        lastTry = pageNumber;
                        pageNumber = Math.ceil((left + pageNumber) / 2);
                        event.emit('nexttry');            
                    }else{
                        console.log(res.statusCode, url);
                        returnError = new Error(`response: ${res.statusCode}`);
                        event.emit('error');
                    }
                }else{
                    console.log('red', url);
                    returnError = new Error(`Unexpected redirect to: ${res.request.uri.href}`);
                    event.emit('error');
                }
            }else{
                if(lastTry === pageNumber){
                    let value = {category : category, pageNumber: pageNumber+ 1};
                    result.setValue(value);
                    event.emit('end');
                }else if(htmltext.indexOf('Next page') !== -1){
                    // go next
                    left = pageNumber;
                    lastTry = pageNumber;
                    pageNumber = Math.ceil((right + pageNumber) / 2);
                    event.emit('nexttry');
                }else{
                    // correct
                    let value = {category : category, pageNumber: pageNumber};
                    result.setValue(value);
                    event.emit('end');
                }
            }
        });
    });
    event.emit('nexttry');
}

function categorynames(value, success, failCallback){
    let categories = [];
    request(
        "https://www.eporner.com/",
        (error, response, htmltext)=>{
            if(error || response.statusCode != 200){
                console.log(errorTitle + ` categorynames failed`);
                if(error){
                    failCallback(error);
                }else{
                    failCallback(new Error(`response: ${response.statusCode}`));
                }
            }else{
                let $ = cheerio.load(htmltext);
                let ignore_counter = 0;
                $('#categories-list-left a').toArray().forEach(ele=>{
                    if(ignore_counter >= 4){
                        let value = $(ele).attr('href');
                        value = value.substring('/category/'.length, value.length - 1);
                        categories.push(value);
                    }
                    ignore_counter ++;
                });
                let metaResult = new MetaContent('eporner.com');
                metaResult.setName("categorynames");
                metaResult.setValue({categories: categories});
                success(metaResult);
            }
        }
    );
}


const eporner = new JavModel();
eporner.queryContent = queryContent;
//eporner.queryPage = queryPage;
eporner.queryCategory = queryCategory;
eporner.queryMeta.pageNumByCategory = pageNumByCategory;
eporner.queryMeta.categorynames = categorynames;
module.exports = eporner;

