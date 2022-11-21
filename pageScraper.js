const fs = require('fs')

const scraperObject = {
    totalPage: 2,
    currentPage: 1,
    url: ``,
    async scraper(browser){
        let page = await browser.newPage()
        page.setDefaultTimeout(0)
        let products = [];
        let data = {}
        //Аутентификация в прокси
        await page.authenticate({
            username: '6nrddner',
            password: 'yfq5247e'
        });



        const start= new Date().getTime();
        while(this.currentPage <= this.totalPage){
            console.log(`Переход на страницу ${this.currentPage}...`)

            await page.goto(this.url + this.currentPage);

            console.log(`Переход на страницу ${this.currentPage} выполнен`)
            console.log('Поиск селектора')

            await page.waitForSelector('section.cc-item', { visibility: true })

            console.log('Селектор найден')

            let product = await page.$$eval('section.cc-item', p => p.map((item, idx) => JSON.parse(item.dataset.gaOffer)))

            products.push(...product)

            product.length > 0 ? console.log(`Сохранил данные со страницы ${this.currentPage}`) : console.log(`Не удалось сохранить данные со страницы ${this.currentPage}`)

            this.currentPage++
        }
        const end = new Date().getTime();


        data.products = [...products]
        data.count = [...products].length

        console.log(`Время выполнения ${Math.round((end - start) / 1000)} секунд`);
        console.log('Закрываю браузер...')
        browser.close();
        fs.writeFileSync('./data.json', JSON.stringify(data, null, 4));

    }
}

module.exports = scraperObject;