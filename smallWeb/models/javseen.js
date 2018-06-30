const request = require('request');
const cheerio = require('cheerio');
const EventEmitter = require('events')
// data structure
const VideoContent = require('../../data_model/video_content');
const VideoPages = require('../../data_model/video_indices');
const MetaContent = require('../../data_model/meta_content');
// method structure
const JavModel = require('./jav_model');

'use strict';



//////////////////////////////////////////////////////////////
/**
 * public module data
 */
const logo = '';
const name = 'Javseen';
const mainpageURL = 'http://javseen.com'
const errorTitle = '[Error] Javseen ';
 
//////////////////////////////////////////////////////////////

/**
 * @param url VideoFrameUrl e.g. https://openload.co/embed/w0q5Dor-m-Q/SSNI-139.mp4
 * @param videoContent video content
 * @param callback (err, dataKey, decryptScript) 
 * 
 * Extract the frame url from the video page url
*/
function videoFrameUrl2VideoData(url, videoContent, callback){
    if(!url){
        callback(new Error(errorTitle + " [videoFrameUrl2VideoData] url = null"), null);
    }else{
        request(
            url,
            (err, res, data)=>{
                if(err || res.statusCode !== 200){
                    if(err){
                        callback(err, null);
                    }else{
                        callback(new Error(`${errorTitle} [videoFrameUrl2VideoData] Bad request ${res.statusCode} on ${indexPageUrl}`), null);
                    }
                }else{
                    try{
                        const $ = cheerio.load(data);
                        const dataKey = $('#DtsBlkVFQx').parent().find('p').not('#DtsBlkVFQx').text();
                        let scripts = $('script').get();
                        const decryptScript = scripts[scripts.length - 1].children[0].data;
                        callback(null, dataKey, decryptScript);
                    }catch(err){
                        callback(err, null);
                    }
                }
            }
        );
    }
}

////////////////////////////////////////////////////////////////////
/**
 * @param url VideoPageUrl e.g. http://javseen.com/watch-sweat-juicying-saliva-salivarous-daddy-daddy-full-body-licking-sucking-serious-juice-total-leakage-sexual-intercourse-hashimoto-yes/
 * @param videoContent video content
 * @param callback (err, videoFrameUrl) e.g. https://openload.co/embed/RZ9-xuIsQp4/SSNI-132.mp4
 * 
 * Extract the frame url from the video page url
*/
function videoPageUrl2VideoFrame(url, videoContent, callback){
    if(!url){
        callback(new Error(errorTitle + " [videoPageUrl2VideoFrame] url = null"), null);
    }else{
        request(
            url,
            (err, res, data)=>{
                if(err || res.statusCode !== 200){
                    if(err){
                        callback(err, null);
                    }else{
                        callback(new Error(`${errorTitle} [videoPageUrl2VideoFrame] Bad request ${res.statusCode} on ${url}`), null);
                    }
                }else{
                    try{
                        const $ = cheerio.load(data);
                        let videoFrameUrl = $('#post .player iframe').attr('src');
                        if(videoFrameUrl.indexOf('openload.co') !== -1){
                            callback(null, videoFrameUrl);
                        }else{
                            let flag = true;
                            $('#post .film .label').toArray().forEach(ele=>{
                                if($('.server-name', ele).html().toLowerCase().indexOf('openload') !== -1){
                                    flag = false;
                                    let pageUrl = $('a', ele).attr('href');
                                    videoPageUrl2VideoFrame(pageUrl, null, callback);
                                    return;
                                }
                            });
                            if(flag){
                                callback(null, videoFrameUrl);
                            }
                            return;
                        }
                    }catch(err){
                        callback(err, null);
                    }
                }
            }
        );
    }
}

/**
 * @param url indexPageUrl  indexPageUrl can be null
 * @param videoContent video content
 * @param callback (err, videoPageUrl) videoPageUrl can be null e.g. http://javseen.com/watch-sweat-juicying-saliva-salivarous-daddy-daddy-full-body-licking-sucking-serious-juice-total-leakage-sexual-intercourse-hashimoto-yes/
 * 
 * Extract the video page url from the video index url
*/
function indexPage2VideoPage(url, videoContent, callback){
    if(!url){
        callback(new Error(errorTitle + " [indexPage2VideoPage] url = null"), null);
    }else{
        request(
            url,
            (err, res, data)=>{
                if(err || res.statusCode !== 200){
                    if(err){
                        callback(err, null);
                    }else{
                        callback(new Error(`${errorTitle} [indexPage2VideoPage] Bad request ${res.statusCode} on ${url}`), null);
                    }
                }else{
                    try{
                        // setting title, index, profile photo, summary img, genre, author, starname, studio
                        const $ = cheerio.load(data);
                        let title = $('#post-header h1').text();   
                        videoContent.setTitle(title);                   
                        let imgURL = $('#post .post-content img').attr('data-lazy-src');
                        if(imgURL.indexOf('http') == -1){
                            imgURL = "http:" + imgURL;
                        }
                        videoContent.setImgSummaryUrl(imgURL);
                        $('#post .title-info > ul li').toArray().forEach(element => {
                            let text = $(element).text();
                            if(text.indexOf('Studio') !== -1){
                                videoContent.setStudio(text.substring(8, text.length));
                            }else if(text.indexOf('Starring') !== -1){
                                let starname = text.substring(9, text.length);
                                if(starname && starname.toLowerCase() !== "updating"){
                                    starname.split(', ').forEach(temp=>{
                                        videoContent.addStarname(temp);
                                    });
                                    
                                }
                            }else if(text.indexOf('Genre') !== -1){
                                if(text.indexOf(',') !== -1){
                                    videoContent.setGenres(text.substring(7, text.length).split(', '));
                                }else{
                                    videoContent.addGenre(text.substring(7, text.length));
                                }
                            }else if(text.indexOf('SKU') !== -1){
                                videoContent.setIndex(text.substring('SKU: '.length, text.length));
                            }else if(text.indexOf('Director') !== -1){
                                let director = text.substring(10, text.length);
                                if(director && director.toLowerCase() !== "updating"){
                                    videoContent.setDirector(director);
                                }
                            }else if(text.indexOf('Released Date') !== -1){
                                let releasedDate = new Date(text.substring('Released Date: '.length, text.length) + 'T00:00:00Z');
                                if(!releasedDate.getTime()){
                                    releasedDate = new Date();
                                }
                                videoContent.setReleaseDate(releasedDate);
                            }else if(text.indexOf('Views:') !== -1){
                                
                                let views = text.split(' ')[1];
                                views = views.split(',');
                                let finalNumber = "";
                                views.forEach(ele=>{
                                    finalNumber += ele;
                                })
                                let numView = parseInt(finalNumber);
                                videoContent.setView(numView);
                            }else if(text.indexOf('average:') !== -1){
                                let s_p = text.indexOf('average:') + 'average: '.length;
                                let e_p = text.indexOf(' out');
                                let rating = text.substring(s_p, e_p);
                                videoContent.setRating(parseFloat(rating));
                            }
                        });
                        let videoPageUrl = $('#post .movie_play a').attr('href');
                        callback(null, videoPageUrl);
                    }catch(err){
                        callback(err, null);
                    }
                }
            }
        );
    }
}

/**
 * 
 * @param {*} indexUrl e.g. http://javseen.com/saliva-caress-hug-slowly-netting-cummed-development-development-sexual-intercourse-yatsune-tsubasa/
 * @param {*} successCallback 
 * @param {*} failCallback 
 */
function queryContent(indexUrl, successCallback, failCallback){
    const videoContent = new VideoContent("javseen.com");
    videoContent.setIndexUrl(indexUrl);
    indexPage2VideoPage(indexUrl, videoContent, (err, videoPageUrl)=>{
        if(err){
            failCallback(err);
        }else{
            videoPageUrl2VideoFrame(videoPageUrl, videoContent, (err, videoFrameUrl)=>{
                if(err){
                    failCallback(err);
                }else{
                    let videoDomain = videoFrameUrl.split('/');
                    if(videoDomain.length >= 3){
                        videoContent.setVideoDomain(videoDomain[2]);
                    }                    
                    videoContent.setVideoUrl(videoFrameUrl);
                    videoContent.setStatus(99);
                    
                    successCallback(videoContent);
                }
            });
        }
    });
}
////////////////////////////////////////////////////////
/**
 * Indexing functions
 */

function queryPage(pageNumber, successCallback, failCallback){
    let pageUrl = "";
    if(pageNumber === 1){
        pageUrl = "http://javseen.com";
    }else{
        pageUrl = `http://javseen.com/page/${pageNumber}/`;
    }
    request(
        pageUrl,
        (error, response, data)=>{
            // index page
            const videoPages = new VideoPages();
            if(error || response.statusCode != 200){
                console.log(errorTitle + ` indexPage2Indices failed on ${pageUrl}`);
                if(error){
                    failCallback(error);
                }else{
                    failCallback(new Error(`response: ${response.statusCode}`));
                }
            }else{
                const $ = cheerio.load(data);
                $('#main #items-wrapper .item-thumb').toArray().forEach((element)=>{
                    const indexUrl = cheerio.load(element)('a').attr('href');
                    if(indexUrl && indexUrl.substring(0, 18) === "http://javseen.com"){
                        videoPages.addVideoUrl(indexUrl);
                    }
                });
                
                videoPages.setStatus('success');
                successCallback(videoPages);
            }
        }
    );
}
/**
 * category url examples:
 * 1. http://javseen.com/category/big-tits/
 * 2. http://javseen.com/category/big-tits/page/2/
 * 
 * special
 * http://javseen.com/category/big-tits/page/1/ redirect to http://javseen.com/category/big-tits/
 * 
*/
function categoryConvert(category){
    category = category.toLowerCase().replace(/ /g, '-');
    category = category.replace(/\//g, '-');
    category = category.replace('-&-', '-');
    return category;
}
function queryCategory(data, successCallback, failCallback){
    if(data && data.category && (typeof data.pageNumber === 'number')){
        category = categoryConvert(data.category);
        let pageUrl = "";
        if(data.pageNumber === 1){
            pageUrl = `http://javseen.com/category/${category}/`;
        }else{
            pageUrl = `http://javseen.com/category/${category}/page/${data.pageNumber}/`;
        }
        request(
            pageUrl,
            (error, response, data)=>{
                // index page
                const videoPages = new VideoPages();
                if(error || response.statusCode != 200){
                    console.log(errorTitle + ` [queryCategory] failed on ${pageUrl}`);
                    if(error){
                        failCallback(error);
                    }else{
                        failCallback(new Error(`response: ${response.statusCode}`));
                    }
                }else{
                    const $ = cheerio.load(data);
                    $('#main #items-wrapper .item-thumb').toArray().forEach((element)=>{
                        const indexUrl = cheerio.load(element)('a').attr('href');
                        if(indexUrl && indexUrl.substring(0, 18) === "http://javseen.com"){
                            videoPages.addVideoUrl(indexUrl);
                        }
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
//////////////// queryIndices ////////////////////
// callback(err, indexUrl)
function tag2IndexUrl(url, callback){
    request(
        url,
        (error, response, htmltext)=>{
            // index page
            if(error || response.statusCode != 200){
                if(error){
                    callback(error);
                }else{
                    callback(new Error(`response: ${response.statusCode}`));
                }
            }else{
                const $ = cheerio.load(htmltext);
                try{
                    let item = $('#items-wrapper .item-thumb').toArray()[0];
                    let indexUrl = $('a', item).attr('href');
                    callback(null, indexUrl);
                }catch(err){
                    callback(err);
                }
            }
        }
    );
}
 /*
    {
        "domain":"javseen.com",
        "name":"indices",
        "value":{
            "indices":{
                "abc-123":"indexUrl"
                "bcd-349":"indexUrl"
            }
        }
    }
*/
function queryIndices(info, successCallback, failCallback){
    if(!((typeof info.from === 'number') && (typeof info.limit === 'number') && info.limit >=0 && info.from >= 0)){
        failCallback(new Error(`queryIndices agrument ${info} incorrect`));
        return;
    }
    let $;
    let numWorker = 3;
    let localcounter = 0;
    let pointer = 0;
    let event = new EventEmitter();
    let tasks = []; 
    let result = [];
    event.once('done', ()=>{
        let metaResult = new MetaContent('javseen.com');
        metaResult.setName("indices");
        metaResult.setValue({indices: result});
        successCallback(metaResult);
    });
    event.on('workerdone', ()=>{
        localcounter++;
        if(localcounter >= numWorker){
            event.emit('done');
        }
    });
    event.on('next', (index)=>{
        let tag = tasks[index].tag;
        let url = tasks[index].url;
        if(index < tasks.length){
            
            tag2IndexUrl(url, (err, indexUrl)=>{
                if(err){
                    console.log(errorTitle + ` [tag2IndexUrl] failed on ${url}`);
                }else{
                    result.push({index:tag, indexUrl:indexUrl});
                }
                if(index + numWorker >= tasks.length){
                    event.emit('workerdone');
                }else{
                    event.emit('next', index + numWorker);
                }
            });    
        }
    });
    request(
        "http://javseen.com/tags/",
        (error, response, data)=>{
            if(error || response.statusCode != 200){
                console.log(errorTitle + ` [queryCategory] failed on ${pageUrl}`);
                if(error){
                    failCallback(error);
                }else{
                    failCallback(new Error(`response: ${response.statusCode}`));
                }
            }else{
                let counter = 0;
                $ = cheerio.load(data);
                $('#list-tags .tagindex').toArray().forEach(ele=>{
                    $('li', ele).toArray().forEach(item=>{
                        let index = $('a', item).html();
                        if(index && index.indexOf('-') !== -1 && index.indexOf(' ') === -1){
                            if(counter >= info.from && counter < info.limit + info.from){
                                tasks.push({tag: index, url: $('a', item).attr('href')});
                            }
                            counter++;
                        }
                        
                    });
                });
                counter = 0;
                while(counter < numWorker){
                    event.emit('next', counter);
                    counter ++;
                }
            }
        }
    );
}
/** 
 * no input
 * output:{numindices: 203343} // the total number of videos
*/
function queryNumOfIndices(info, successCallback, failCallback){
    let result = 0;
    request(
        "http://javseen.com/tags/",
        (error, response, data)=>{
            if(error || response.statusCode != 200){
                console.log(errorTitle + ` [queryCategory] failed on ${pageUrl}`);
                if(error){
                    failCallback(error);
                }else{
                    failCallback(new Error(`response: ${response.statusCode}`));
                }
            }else{
                $ = cheerio.load(data);
                $('#list-tags .tagindex').toArray().forEach(ele=>{
                    $('li', ele).toArray().forEach(item=>{
                        let index = $('a', item).html();
                        if(index && index.indexOf('-') !== -1 && index.indexOf(' ') === -1){
                            result++;
                        }
                    });
                });
                let metaResult = new MetaContent('javseen.com');
                metaResult.setName("numberOfindices");
                metaResult.setValue({numindices: result});
                successCallback(metaResult);
            }
        }
    );
}

const javseen = new JavModel();

javseen.queryPage = queryPage;
javseen.queryContent = queryContent;
javseen.queryCategory = queryCategory;
javseen.queryMeta.indices = queryIndices;
javseen.queryMeta.queryNumOfIndices = queryNumOfIndices;
module.exports = javseen;

