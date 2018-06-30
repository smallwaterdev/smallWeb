const request = require('request');
const cheerio = require('cheerio');
const EventEmitter = require('events');

function validate__(url, callback){
    request(url, (err, res, data)=>{
        if(err){
            callback(null, {success: false, reason: `request failed on ${url}: ${err.message}`});
        }else if(res.statusCode !== 200){
            callback(null, {success: false, reason: `request failed on ${url}: statusCode ${res.statusCode}`})
        }else{
            const $ = cheerio.load(data);
            if($('#DtsBlkVFQx').parent().find('p').not('#DtsBlkVFQx').text()){
                callback(null, {success: true, reason: ""});
            }else{
                callback(null, {success: false, reason: `no video url is found`})
            }
        }
    });
}

function validate(url, callback){
    if(typeof url === 'string'){
        validate__(url, callback);
    }else if(url instanceof Array){
        const numWorker = 10;
        const scheduler = new EventEmitter();
        let counter = 0;
        let result = [];
        scheduler.once('done', ()=>{
            callback(null, result);
        });
        scheduler.on('worker_done', ()=>{
            counter++;
            if(counter === numWorker){
                scheduler.emit('done');
            }
        });
        scheduler.on('next', i=>{
            if(i >= url.length){
                scheduler.emit('worker_done');
            }else{
                validate__(url[i], (err, back)=>{
                    result.push({videoUrl: url[i], result: back});
                    scheduler.emit('next', i+numWorker);
                });
            }
        });
        let c_i = 0;
        while(c_i < numWorker){
            scheduler.emit('next', c_i);
            c_i ++;
        }
    }else{
        callback(null, {success:false, reason:`Invalid argument ${url}`});
    }
}


module.exports.validate = validate;