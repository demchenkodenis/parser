const express = require('express');
const router = express.Router();
const puppeteer = require('puppeteer')


/* GET users listing. */
router.get('/', function(req, res, next) {

    let url         = 'https://www.mamba.ru/ru/login',
        currentPage = 1
        LOGIN       = ''
        PASSWORD    = ''

    // async function getResult (page) {
    //     const pageResult = await page.evaluate(function () {
    //         return Array.from()
    //     })
    // }



    async function startBrowser(){
        let browser, links;
        try {
            console.log("Opening the browser......");
            browser = await puppeteer.launch({
                headless: false,
                args: ["--no-sandbox", "--disable-setuid-sandbox"],
                'ignoreHTTPSErrors': true
            });

            const page = await browser.newPage()

            await page.setDefaultNavigationTimeout(60000)
            await page.goto(url)
            await page.waitForSelector('input[name="login"]')
            await page.waitForTimeout(2000)
            await page.focus('[name="login"]')
            await page.keyboard.type(LOGIN)
            await page.waitForTimeout(2000)
            await page.focus('[name="password"]')
            await page.keyboard.type(PASSWORD)
            await page.waitForTimeout(2000)
            await page.click('input.bAZzjf')
            await page.waitForTimeout(2000)
            await page.waitForSelector('a[data-name="link-main-menu__search-action"]')
            await page.click('a[data-name="link-main-menu__search-action"]')
            await page.waitForSelector('div[data-name="search-list-item"]')

            let arr = await page.evaluate(function () {
                return Array.from(document.querySelectorAll('div[data-name="search-list-item"] > a')).map((element) => ({
                    link: element.getAttribute('href')
                }))
            })

            console.log(arr)

        } catch (err) {
            console.log("Could not create a browser instance => : ", err);
        }
        //return links;
    }

    startBrowser().then(console.log())

    res.send('parser');
});

module.exports = router;
