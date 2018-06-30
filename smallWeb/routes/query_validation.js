const express = require('express');
const queryValidationRouter = express.Router();

// module
const openload = require('../models/openload');

queryValidationRouter.route('/')
.post((req, res, next)=>{


    function callback(err, result){
        if(err){
            res.statusCode = 403;
            res.setHeader('Content-Type', 'text/plain');
            res.end(err.message);
        }else{
            res.statusCode = 200;
            res.json(result);
        }
    }

    let videoDomain = req.body.videoDomain;
    let videoUrl = req.body.videoUrl;
    if(videoDomain === undefined || videoUrl === undefined){
        callback(new Error(`Invalid argument`));
        return;
    }
    switch(videoDomain){
        case "openload.co": openload.validate(videoUrl, callback); break;
        
        default: {
            callback(new Error(`${videoDomain} is not support`));
        };break;
    }
})
module.exports = queryValidationRouter;