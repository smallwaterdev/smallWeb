const Javseen = require('./models/javseen');
const data = new Javseen();
data.parseItems('http://javseen.com/page/2',(data)=>{
    console.log('end');
});