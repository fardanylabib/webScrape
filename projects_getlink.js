const puppeteer = require("puppeteer");
const userAgent = require("random-useragent");
const fs = require("fs");

var URL = "https://projects.co.id/public/browse_users/listing";
const usingChrome = { headless: false, executablePath : "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe" };
const usingChromium = { headless: false};

const TIME_DELAY_1 = 1000;
const TIME_DELAY_2 = 2000;

const scrape = async () => {
	let finishFlag = 0
	var browser = await puppeteer.launch(usingChrome);
	var page = await browser.newPage();
	var agent = userAgent.getRandom(function (ua) {
		return ua.osName === 'Linux';
	});
	console.log(agent);
	page.setExtraHTTPHeaders({ "user-agent": agent});
	//make file directory
	const resultDirectory = ".\\Result\\projects_links";
	fs.mkdir(resultDirectory,function(e){
	    if(!e || (e && e.code === 'EEXIST')){
	        console.log("directory projects_links created");
	    } else {
	        //debug
	        console.log(e);
	    }
	});

  	// Actual Scraping goes Here...
	console.log("going to "+URL);
	await page.goto(URL, { timeout: 0 });
	//set sort as worker ranking
	await page.waitForSelector('#ds > .dont-print-this > .col-md-12 > .pull-left > .dropdown-toggle')
  	await page.click('#ds > .dont-print-this > .col-md-12 > .pull-left > .dropdown-toggle')
  	await page.waitForSelector('.col-md-12 > .open > .dropdown-menu > li:nth-child(2) > .ajax-url-filter')
  	await page.click('.col-md-12 > .open > .dropdown-menu > li:nth-child(2) > .ajax-url-filter')
  	await page.waitFor(TIME_DELAY_2);

	let failCounter = 0;
  	var links= [];
  	let showPage = 1;
  	let nextButtonChildId = 10;
  	while(failCounter<10 && showPage<=5508){  
  		console.log("getting links from page " +showPage);		
  		links = await getAllEmployeeLinks(page,nextButtonChildId);
  		console.log("getting links process was done");
  		console.log(links);

  		if(links[0]){		
  			let fileExist = -1;
  			let index = 0;
  			let fileName = "";
  			while(fileExist != 0){

  				if(index === 0){
  					fileName = resultDirectory+"\\page"+showPage+".txt";
  				}else{
  					fileName = resultDirectory+"\\page"+showPage+"("+ index +").txt";
  				}
	  			if(fs.existsSync(fileName)){
	  				index++;
	  			}else{
	  				fileExist = 0;
	  			}
				console.log(fileName);
  			}
  			
  			var stream = fs.createWriteStream(fileName);
  			console.log("writing links into file...");
			for(const link of links){
				if(link == new String("LAST").valueOf()){
					console.log("LAST PAGE REACHED");
					failCounter = 100;
					break;
				}
				stream.write(link + '\n');
			}
			stream.end();
			console.log("page "+showPage+" was recorded!");

  			if(nextButtonChildId<15){
  				nextButtonChildId++;
  			}
			showPage++;
			failCounter = 0;
  		}else{
  			failCounter++
  			await page.waitFor(300);
  			console.log("reset browser...");
  			browser.close();
  			if(failCounter%2 === 1){
  				browser = await puppeteer.launch(usingChromium);
  			}else{
  				browser = await puppeteer.launch(usingChrome);
  			}
			
			page = await browser.newPage();
			agent = userAgent.getRandom(function (ua) {
				return ua.osName === 'Linux';
			});
			console.log(agent);
			page.setExtraHTTPHeaders({ "user-agent": agent});
			await page.goto(URL, { timeout: 0 });
			await page.waitForSelector('#ds > .dont-print-this > .col-md-12 > .pull-left > .dropdown-toggle')
		  	await page.click('#ds > .dont-print-this > .col-md-12 > .pull-left > .dropdown-toggle')
		  	await page.waitForSelector('.col-md-12 > .open > .dropdown-menu > li:nth-child(2) > .ajax-url-filter')
		  	await page.click('.col-md-12 > .open > .dropdown-menu > li:nth-child(2) > .ajax-url-filter')
		  	await page.waitFor(TIME_DELAY_2);
  		}
	}
	browser.close(); 
	finishFlag = 1;
	return finishFlag;
};


async function getAllEmployeeLinks(page,nextBtnId){
	
	let userLinks = [];
	userLinks = await page.evaluate(() => {
		let links = [];
    	let elements = document.querySelectorAll(".col-md-10.align-left h2 a");
    	for(let i = 0;i<elements.length;i++){
			links.push(elements[i].href);
		}
    	return links;
	});

	//click next page
	let selector = '.row:nth-child(1) > .col-md-12 > .pull-right > .pagination > li:nth-child('+ nextBtnId +') > .ajax-url';
	await page.waitForSelector(selector);
	await page.click(selector);
	await page.waitFor(TIME_DELAY_1);

	while(true){
		let userLinks2 = [];
		userLinks2 = await page.evaluate(() => {
			let links = [];
			let elements = document.querySelectorAll(".col-md-10.align-left h2 a");
			for(let i = 0;i<elements.length;i++){
				links.push(elements[i].href);
			}
			return links;
		});

		if(compareArray(userLinks, userLinks2)){
			await page.waitFor(TIME_DELAY_1);
			console.log("Wait until the page reloaded")
		}else{
			break;
		}
	}

	return userLinks;
}

function compareArray(arr1, arr2){
	if(arr1.length !== arr2.length){
		return false;
	}
	for(var i = 0; i< arr1.length ; i++){
		if(arr1[i] !== arr2[i]){
			return false;
		}
	}
	return true;
}

scrape();