const express = require('express');
const queryContentRouter = express.Router();
// models
const javfinder = require('../models/javfinder');
const javseen = require('../models/javseen');
const eporner = require('../models/eporner');
function successHandler(data, res){
    res.statusCode=200;
    res.setHeader('Content-Type', 'application/json');
    res.json(data.data);
}
function failHandler(err, res){
    res.statusCode=404;
    res.setHeader('Content-Type', 'text/plain');
    res.end(err.message);
}
function GetPutDeleteHandler(req, res){
    res.statusCode=403;
    res.setHeader('Content-Type', 'text/plain');
    res.end(`${req.method} is not supported`);
}


queryContentRouter.route('/')
.post((req, res, next)=>{
    let domain = req.body.domain;
    let indexUrl = req.body.indexUrl;
    if(domain === undefined || indexUrl === undefined){
        res.statusCode=403;
        res.setHeader('Content-Type', 'text/plain');
        res.end(`invalid parameter: ${JSON.stringify(req.body)}\n
            Correct examples\n
            {"domain":"javfinder.is", "indexUrl":"https://javfinder.is/movie/watch/fitch-jufd-922-hana-haruna-vulgar-malaching-haruka-haruna-of-mucicos-slut-tempting-with-tohuma-hami-taking-out-body.html"}\n
            {"domain":"javseen.com", "indexUrl":"http://javseen.com/bdsm-training-courses-mariki-yoguri/"}\n
            {"domain":"eporner.com", "indexUrl":"https://www.eporner.com/hd-porn/bd96XfWEgpt/Brutal-Sex-With-Kinky-Redhead/"}
        `);
    }else{
        switch(domain){
            case "javfinder.is": {
                javfinder.queryContent(indexUrl, (data)=>{
                    successHandler(data, res);
                }, (err)=>{
                    failHandler(err, res);
                });
            };break;

            case "javseen.com": {
                javseen.queryContent(indexUrl, (data)=>{
                    successHandler(data, res);
                }, (err)=>{
                    failHandler(err, res);
                });
            };break;

            case "eporner.com": {
                eporner.queryContent(indexUrl, (data)=>{
                    successHandler(data, res);
                }, (err)=>{
                    failHandler(err, res);
                });
            };break;

            default: {
                res.statusCode=404;
                res.setHeader('Content-Type', 'text/plain');
                res.end(`${domain} is not supported!`);
            };break;
        }
    }
})
module.exports = queryContentRouter;