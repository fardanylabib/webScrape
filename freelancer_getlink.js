const puppeteer = require("puppeteer");
const userAgent = require("random-useragent");
const fs = require("fs");

var URL = "https://www.freelancer.com/freelancers/Indonesia/all/";
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
	const resultDirectory = ".\\Result\\freelancer_links";
	fs.mkdir(resultDirectory,function(e){
	    if(!e || (e && e.code === 'EEXIST')){
	        console.log("directory freelancer_links created");
	    } else {
	        //debug
	        console.log(e);
	    }
	});

  	// Actual Scraping goes Here...
	console.log("going to "+URL);
	await page.goto(URL, { timeout: 0 });
	let failCounter = 0;
  	var links= [];
  	let showPage = 1;
  	while(failCounter<10){  
  		console.log("getting links from page " +showPage);		
  		links = await getAllEmployeeLinks(page);
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
  		}
	}
	browser.close(); 
	finishFlag = 1;
	return finishFlag;
};


async function getAllEmployeeLinks(page){

	const onlineOnly = await page.evaluate(() => {
    	const tombol = document.querySelector(".Tags .Tags-item.button-group .Tags-item-control.btn.btn-mini.selected_rate");
    	return tombol;
	});

	console.log("clicking");
	var linkHref = [];
  	if(onlineOnly){
  		await page.click(".Tags .Tags-item.button-group .Tags-item-control.btn.btn-mini.selected_rate");
  		await page.waitFor(TIME_DELAY_2);
  		console.log("online only deleted");
  	}else{
  		console.log("online only not deleted");
  	}

  	var linkHref = [];
	linkHref = await page.evaluate(() => {
		var links = [];
    	var element = document.querySelectorAll(".ns_freelancer-list .ns_result .freelancer-details .freelancer-details-header h3 a");
		for(let i = 0;i<element.length;i++){
			links.push(element[i].href);
		}
    	return links;
	});

	const next = await page.evaluate(() => {
    	const tombol = document.querySelector(".Pagination .Pagination-item .flicon-pagination-next");
    	return tombol;
	});
	if(next){
		await page.click(".Pagination .Pagination-item .flicon-pagination-next");
		while(true){
			var linkHref2 = [];
			linkHref2 = await page.evaluate(() => {
				var links = [];
    			var element = document.querySelectorAll(".ns_freelancer-list .ns_result .freelancer-details .freelancer-details-header h3 a");
				for(let i = 0;i<element.length;i++){
					links.push(element[i].href);
				}
    			return links;
			});

			if(compareArray(linkHref, linkHref2)){
				await page.waitFor(300);
				console.log("Wait until the page reloaded")
			}else{
				break;
			}
		}
		
		// await page.waitForSelector('.ns_freelancer-list');	// element for display freelancer
	}else{
		if(linkHref[0]){
			linkHref.push("LAST");
		}
	}
	console.log('yeeayy, depak sini');
	return linkHref;	
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