const express = require('express');
const queryCategoryRouter = express.Router();

// module
const javfinder = require('../models/javfinder');
const javseen = require('../models/javseen');
const eporner = require('../models/eporner');
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
//////////////////////////////////////////
/**
 * Example
 * domain: javfinder.is
 * category: big tits
 * pageNumber: 2 // the number of the page that contains the specific category
 * 
 * https://javfinder.is/category/big-tits.html
 * https://javfinder.is/category/big-tits/page-2.html
 */
queryCategoryRouter.route('/')
.post((req, res, next)=>{
    let domain = req.body.domain;
    let category = req.body.category;
    let pageNumber = req.body.pageNumber;
    if(!domain || (typeof pageNumber !== "number") || pageNumber <= 0 || !category){
        res.statusCode=403;
        res.setHeader('Content-Type', 'text/plain');
        res.end(`invalid parameter: ${JSON.stringify(req.body)}\nExample of a correct input {"domain":"javfinder.is", "category":"big tits", "pageNumber":20}\npageNumber > 0`);
        return;
    }
    switch(domain){
        case "javfinder.is": javfinder.queryCategory({category: category, pageNumber: pageNumber}, (data)=>{
            successHandler(data, res);
        },(err)=>{
            failHandler(err, res);
        });break;

        case "javseen.com": javseen.queryCategory({category: category, pageNumber: pageNumber}, (data)=>{
            successHandler(data, res);
        },(err)=>{
            failHandler(err, res);
        });break;

        case "eporner.com": eporner.queryCategory({category: category, pageNumber: pageNumber}, (data)=>{
            successHandler(data, res);
        },(err)=>{
            failHandler(err, res);
        });break;

        default: {
            failHandler(new Error(`${domain} is not support`), res);
        };break;
    }
})
module.exports = queryCategoryRouter;