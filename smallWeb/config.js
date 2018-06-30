/**************************  smallWeb ************************/
/// global configurations ///////
const listen_port = 2000;
const listen_ip = "localhost";
///// javfinder configurations //////////
const javfinderMaxPagePerCategory = 600; // not need the exact number
const javfinderIndexUrlPerPage = 48; // how many indexurl per page

const javfinder_category_urls = [
    "https://javfinder.is/category.html",
    "https://javfinder.is/category/page-2.html",
    "https://javfinder.is/category/page-3.html",
    "https://javfinder.is/category/page-4.html",
    "https://javfinder.is/category/page-5.html"
];

const epornerMaxPagePerCategory = 4699;
const epornerIndexUrlPerPage = 72;

module.exports.listen_port = listen_port;
module.exports.listen_ip = listen_ip;

module.exports.javfinderIndexUrlPerPage = javfinderIndexUrlPerPage;
module.exports.javfinderMaxPagePerCategory = javfinderMaxPagePerCategory;
module.exports.javfinder_category_urls = javfinder_category_urls;

module.exports.epornerMaxPagePerCategory = epornerMaxPagePerCategory;
module.exports.epornerIndexUrlPerPage = epornerIndexUrlPerPage;