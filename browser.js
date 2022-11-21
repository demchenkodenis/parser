const puppeteer = require('puppeteer');

async function startBrowser(){
    let browser;
    try {
        console.log("Открываю браузер......");
        browser = await puppeteer.launch({
            headless: false,
            args: ["--disable-setuid-sandbox", '--proxy-server='],
            'ignoreHTTPSErrors': true
        });
    } catch (err) {
        console.log("Could not create a browser instance => : ", err);
    }
    return browser;
}

module.exports = {
    startBrowser
};