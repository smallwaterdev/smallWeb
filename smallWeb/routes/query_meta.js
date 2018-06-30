const express = require('express');
const queryMetaRouter = express.Router();

// module
const javfinder = require('../models/javfinder');
const eporner = require('../models/eporner');
const javseen = require('../models/javseen');
//const javseen = require('../models/javseen');

function successHandler(data, res){
    res.statusCode=200;
    res.setHeader('Content-Type', 'application/json');
    res.json(data.data);
}
function failHandler(err, res){
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain');
    res.end(err.message);
}
queryMetaRouter.route('/:meta')
.post((req, res, next)=>{
    let meta = req.params.meta;
    
    switch(meta){
        /////////// query how many index pages for a specific category //////////
        case "pagenumbycategory": {
            let category = req.body.category;
            let domain = req.body.domain;
            if(!category || !domain){
                res.statusCode=403;
                res.setHeader('Content-Type', 'text/plain');
                res.end('invalid parameter: ' + JSON.stringify(req.body) + '\nExample of a correct argument: {"domain":"javfinder.is", "category":"big tits"}');
                return;
            }
            switch(domain){
                case "javfinder.is":{
                    category = category.toLowerCase().replace(/ /g, '-');
                    javfinder.queryMeta.pageNumByCategory(category,  (metadata)=>{
                        successHandler(metadata, res);
                    }, (err)=>{
                        failHandler(err, res);
                    });
                };break;
                
                case "eporner.com":{
                    category = category.toLowerCase().replace(/ /g, '-');
                    eporner.queryMeta.pageNumByCategory(category,  (metadata)=>{
                        successHandler(metadata, res);
                    }, (err)=>{
                        failHandler(err, res);
                    });
                };break;

                default: {
                    failHandler(new Error(`${meta} on ${domain} is not supported`), res);
                };break;
            }
        };break;
        
        case "categorynames":{
            let domain = req.body.domain;
            if(!domain){
                res.statusCode=403;
                res.setHeader('Content-Type', 'text/plain');
                res.end('invalid parameter: ' + JSON.stringify(req.body) + '\nExample of a correct argument: {"domain":"javfinder.is"}');
                return;
            }
            switch(domain){
                case "javfinder.is":{
                    javfinder.queryMeta.categorynames(req.body,  (metadata)=>{
                        successHandler(metadata, res);
                    }, (err)=>{
                        failHandler(err, res);
                    });
                };break;
                
                case "eporner.com":{
                    eporner.queryMeta.categorynames(req.body,  (metadata)=>{
                        successHandler(metadata, res);
                    }, (err)=>{
                        failHandler(err, res);
                    });
                };break;

                default: {
                    failHandler(new Error(`${meta} on ${domain} is not supported`), res);
                };break;
            }
        }break;

        case "indices":{
            let domain = req.body.domain;
            if(!domain){
                res.statusCode=403;
                res.setHeader('Content-Type', 'text/plain');
                res.end('invalid parameter: ' + JSON.stringify(req.body) + '\nExample of a correct argument: {"domain":"javfinder.is"}');
                return;
            }
            switch(domain){
                case "javseen.com":{
                    javseen.queryMeta.indices(req.body,  (metadata)=>{
                        successHandler(metadata, res);
                    }, (err)=>{
                        failHandler(err, res);
                    });
                };break;
                
                default:{
                    failHandler(new Error(`${meta} on ${domain} is not supported`), res);
                };break;
            }
        };break;
        
        case "numberofindices":{
            let domain = req.body.domain;
            if(!domain){
                res.statusCode=403;
                res.setHeader('Content-Type', 'text/plain');
                res.end('invalid parameter: ' + JSON.stringify(req.body) + '\nExample of a correct argument: {"domain":"javfinder.is"}');
                return;
            }
            switch(domain){
                case "javseen.com":{
                    javseen.queryMeta.queryNumOfIndices(req.body, (metadata)=>{
                        successHandler(metadata, res);
                    }, (err)=>{
                        failHandler(err, res);
                    });
                };break;

                default:{
                    failHandler(new Error(`${meta} on ${domain} is not supported`), res);
                };break;
            }
        };break;

        default: {
            failHandler(new Error(`${meta} is not supported`), res);
        };break;
    }
});
module.exports = queryMetaRouter;