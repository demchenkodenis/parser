const fs = require('fs')
const puppeteer = require('puppeteer')
const cheerio = require('cheerio')
const shell = require('shelljs')
const { log } = console

function unionFiles (dir) {
    let files = fs.readdirSync(dir)
    let arr = []
    let data = []

    for (let i in files) {
        arr.push(JSON.parse(fs.readFileSync(`./data/${files[i]}`, "utf8")))
    }

    data = [...arr]
    data = data.flat(Infinity)

    fs.writeFileSync(`./data/data.json`, JSON.stringify(data, null, 4), (err) => {
        if (err) {
            log(`Ошибка объединения файлов: ${err}`)
        }
    });

    for (let i in files) {
       fs.unlinkSync(`./${dir}/${files[i]}`)
    }
}

function sleep (milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
        currentDate = Date.now();
    } while (currentDate - date < milliseconds);
}
    
(async () => {

    let city = 'belgorod'
    let url = `https://www.eapteka.ru`
    let config              = JSON.parse(fs.readFileSync(`config.json`, `utf8`))
    let paginationSelector  = '.custom-pagination__list'
    let categories = [
        'drugs',
        'vitaminy_i_bad',
        'beauty',
        'gigiena',
        'linzy',
        'mother',
        'medical',
        'zootovary',
        'pribory_i_meditsinskaya_tekhnika'
    ]

    while(true) {
        try {
            console.log(`Открываю браузер...`)
            browser = await puppeteer.launch({
                headless: false,
                args: ['--disable-setuid-sandbox', '--proxy-server=kira.onlinesim.ru:16514'],
                'ignoreHTTPSErrors': true
            });
            break
        } catch (err) {
            console.log("Could not create a browser instance: ", err);
            await browser.close()
        }
    }

    let page = await browser.newPage()
        await page.setDefaultNavigationTimeout(30000)

        //Аутентификация в прокси
        await page.authenticate({
            username: '6nrddner',
            password: 'yfq5247e'
        });

        let idx, remainingCategories
        if (config.category !== '') {
            idx = categories.indexOf(config.category)
            remainingCategories = categories.splice(idx)
        }else{
            remainingCategories = categories
        }

        for (let category of remainingCategories) {
            log(`сейчас мы в категории ${category}`)

            config.category = category
            fs.writeFileSync(`config.json`, JSON.stringify(config, null, 4))

            while (true){
                try {
                    await page.goto(`${url}/${city}/goods/${category}/?PAGEN_1=1`, {waitUntil: "networkidle2"})
                    break
                } catch (e) {
                    log('Не удалось открыть страницу, ошибка: ' + e)
                }
            }

            log(`Переход на категорию ${category} выполнен`)

            await page.waitForSelector(paginationSelector)

            let pagination = await page.$$eval(paginationSelector, paginations => paginations.map(pagination => pagination.innerText))
            pagination = pagination[0].split('\n')
            let totalPage = parseInt(pagination[pagination.length - 1])
            log(`Всего страниц ${totalPage}`)


            //проверяем начинаем ли мы с первой страницы или продолжаем с какой-то
            let startPage
            if(config.page > 1) {
                startPage = config.page
            }else{
                startPage = 1
            }

            //totalPage = 2// УДАЛИТЬ ПОСЛЕ ТЕСТА


            while(startPage <= totalPage) {
                let products = []
                let data = {}
                log(`Переход на страницу ${startPage}`)

           
                await page.goto(`${url}/${city}/goods/${category}/?PAGEN_1=${startPage}`, {waitUntil: "networkidle2"})
                log(`Переход на страницу ${startPage} выполнен, ожидание загрузки контента`)
                     

                let html = await page.content()
                log(`контент получен`)

                const $ = cheerio.load(html)
                log(`Контент загружен`)

                let productPerPage = $('.cc-item--info').length

                //элементы товара
                let title        = $('.cc-item--title').text().split('\n').map(elem => elem.trim()).filter(elem => elem !== '')//название
                let price        = $('.price--num').text().split('\n').map(elem => elem.trim()).filter(elem => elem !== '')//стоимость
                let id           = $('span.rate__vendor').text().split('\n').map(elem => elem.trim()).filter(elem => elem !== '')//артикул
                let manufacturer = $('a[href*="manufacturer"]').toArray().map((elem) => { return $(elem).text()})//производитель

                for(let i = 0; i < productPerPage; i++){
                    products.push({
                        'id': id[i].replace(/ /gi, ' ').replace(/[^0-9]/g,""),
                        'price': price[i],
                        'name': title[i].replace(/ /gi, ' '),
                        'manufacturer': manufacturer[i]
                    })
                }

                data = [...products]

                fs.writeFileSync(`./data/${category}-${startPage}.json`, JSON.stringify(data, null, 4), (err) => {
                    if (err) {
                        console.log(err);
                    }
                    console.log('Данные со страницы сохранены!');
                });

                startPage++

                config.page = startPage

                fs.writeFileSync(`./config.json`, JSON.stringify(config, null, 4))
            }
            config.page = 1
            fs.writeFileSync(`./config.json`, JSON.stringify(config, null, 4))
        }

        log('Закрываю браузер...')
        sleep(1500)
        browser.close()
        sleep(1500)
        //сбрасываем конфиг до первой страницы
        config.page = 1
        config.category = ''
        fs.writeFileSync(`./config.json`, JSON.stringify(config, null, 4))

        unionFiles('data')

})();
