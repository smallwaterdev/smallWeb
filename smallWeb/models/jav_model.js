 
class JavModel{
    constructor(){
        // data, success callback, fail callback
        const defaultFunction = function(data, success, fail){fail(new Error('Unrealized function'));}
        this.queryContent = defaultFunction; // (indexUrl, success[VideoContent], fail(err))
        this.queryCategory = defaultFunction; // (category, success[VideoIndices], fail(err))
        this.queryPage = defaultFunction; // (pageNumber, sucess[VideoIndices], fail(err))
        this.queryMeta = {
            /**
             * {
                    "domain": "javfinder.is",
                    "name": "pageNumByCategory",
                    "value": {
                        "category": "hot-spring",
                        "pageNumber": 5
                    }
                }
            */
            pageNumByCategory: defaultFunction,
            
            /*{
                "domain": "javfinder.is",
                "name": "categorynames",
                "value": {
                    "categories": [
                        "69-style",
                        "adultery",
                        "amateur",
                        "anal",
                    ]
                }
            }*/
            categorynames: defaultFunction,

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
           indices:defaultFunction,
           queryNumOfIndices: defaultFunction
        }
    }
}

module.exports = JavModel;