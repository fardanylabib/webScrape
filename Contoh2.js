const puppeteer = require('puppeteer');

let scrape = async () => {
  // Actual Scraping goes Here...
  const browser = await puppeteer.launch({headless: true, executablePath : 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'});
  const page = await browser.newPage();
  page.setExtraHTTPHeaders({'user-agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3372.0 Safari/537.36'});
  await page.goto('https://www.upwork.com/o/profiles/browse/?loc=indonesia', {timeout : 0});
  const result = await page.evaluate(async ()=>{
    var data = [];
    let elements = document.querySelectorAll('a.freelancer-tile-name')
    
    for(var element of elements){
      data.push(element.href);
    }
    const page2 = await browser.newPage();
    page.setExtraHTTPHeaders({'user-agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3372.0 Safari/537.36'});

     await page2.goto(data[0],{timeout : 0});
     const name =  await page2.evaluate(()=>{
        let nama = document.querySelector('.m-xs-bottom span span').textContent;
        return nama;
     });
     data.push(nama);
    return data;
  });

  browser.close(); 
  // Return a value
   return result;
};

scrape().then((value) => {
    console.log(value); // Success!
});