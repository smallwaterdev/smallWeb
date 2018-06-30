const express = require('express');
const queryVideosRouter = express.Router();

// module
const javfinder = require('../models/javfinder');
const javseen = require('../models/javseen');

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
queryVideosRouter.route('/')
.post((req, res, next)=>{
    let domain = req.body.domain;
    let pageNumber = req.body.pageNumber;
    if(!domain || !pageNumber){
        res.statusCode=403;
        res.setHeader('Content-Type', 'text/plain');
        res.end(`invalid parameter: JSON.stringify(req.body)\nExample of a correct request: {"domain":"javseen.com", "pageNumber":2}\npageNumber > 0`);
        return;
    }
    switch(domain){
        case "javfinder.is": javfinder.queryPage(pageNumber, (data)=>{
            successHandler(data, res);
        },(err)=>{
            failHandler(err, res);
        });break;

        case "javseen.com": javseen.queryPage(pageNumber, (data)=>{
            successHandler(data, res);
        },(err)=>{
            failHandler(err, res);
        });break;
        
        default: {
            failHandler(new Error(`${domain} is not support`), res);
        };break;
    }
})
module.exports = queryVideosRouter;