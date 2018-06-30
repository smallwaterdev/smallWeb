
const express = require('express');
const queryContentRoute = require('./routes/query_content');
const queryPageRoute = require('./routes/query_videos');
const queryCategoryRoute = require('./routes/query_category');
const queryMetaRoute = require('./routes/query_meta');

const validationRouter = require('./routes/query_validation');

const logger = require('morgan');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = new express();

const listen_ip = require('./config').listen_ip;
const listen_port = require('./config').listen_port;


// app.use(cors());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use('/query/content', queryContentRoute);
app.use('/query/videos', queryPageRoute);
app.use('/query/category', queryCategoryRoute);
app.use('/query/meta', queryMetaRoute);
app.use('/validate/videoUrl', validationRouter);
app.listen(listen_port, listen_ip);
console.log(`Server is running at http://${listen_ip}:${listen_port}`)


/**
 * Usage
 * /query/content
 * Support: javfinder.is, javseen.com, eporner.com
 * {
 *  "domain":"javfinder.is",
 *  "indexUrl":"https://javfinder.is/movie/watch/glory-quest-gvg-694-sister-crime-diary-aya-sasami.html"
 * }
 * 
 * /query/videos
 * Support: javfinder.is, javseen.com
 * {
 *	"domain":"javfinder.is",
 *	"pageNumber":10
 * }
 * 
 * /query/category
 * Support: javfinder.is, javseen.com, eporner.com
 * {
 *  "domain":"javfinder.is",
 *  "category":"big tits",
 *  "pageNumber":10
 * }
 * 
 * /query/meta/pagenumbycategory
 * Support: javfinder.is, eporner.com
 * {
 *  "domain":"javfinder.is",
 *  "category":"big tits"
 * }
 * 
 * /query/meta/categorynames
 * Support: javfinder.is, eporner.com
 * {
 *  "domain":"javfinder.is",
 * }
 */