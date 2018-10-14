const puppeteer = require("puppeteer");
const userAgent = require("random-useragent");
const fs = require("fs");

const selectedUrlId = 0; //CHANGE THIS TO THE INDEXES BELOW
const folderNameOffset = 52;

const loginPage = "https://www.fiverr.com/login?source=signin_redirect";
const mainURL = "https://www.fiverr.com/";
let URLs = [];
let startUrlID = process.argv[2] - 1;

const usingChrome = { headless: false, executablePath : "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"};
const usingChromium = { headless: false};

const TIME_DELAY_1 = 1000;
let TIME_DELAY_2 = 2000;

const username = "fardanylabib@gmail.com";
const password = "Suudiyah001";

const filter = (ua) => ua !== "mobile";
var browser ;

const scrape = async (startUrlID) => {

	let finishFlag = 0
	browser = await puppeteer.launch(usingChrome);
	var agent = userAgent.getRandom(filter);
	var page = await browser.newPage();
	console.log(agent);
	await page.setExtraHTTPHeaders({ "user-agent": agent});
	const resultDirectory = ".\\Result\\fiverr_links\\";

	fs.mkdir(resultDirectory,function(e){
	    if(!e || (e && e.code === 'EEXIST')){
	        console.log("directory fiverr_links created");
	    } else {
	        //debug
	        console.log(e);
	    }
	});

	await login(page);

	//get all category links
	while(true){
		await page.goto(mainURL, { timeout: 0, waitUntil : 'load'});	
		URLs = await page.evaluate(()=>{
			let urlList = [];
			let elements = document.querySelectorAll(".js-category-nav.category-nav .slider-box .slider-hider .slide .dropdown li a");
			for(let i=0;i<elements.length;i++){
				urlList.push(elements[i].href);
			}
			return urlList;
		});
		if(URLs[0]){
			break;
		}else{
			await page.waitFor(TIME_DELAY_2);
		}
	}
	console.log("Found "+URLs.length+" URLs");
	console.log(URLs);
  	// Actual Scraping goes Here...
  	//looping per child URLS
  	for(; startUrlID<URLs.length;startUrlID++){
  		var links= [];
  		let failCounter = 0;
	  	let pageCounter = 1;
	 //  	console.log("Go to page "+URLs[startUrlID]);
		// await page.goto(URLs[startUrlID] + "&ref=seller_location%3AID&filter=rating", { timeout: 0});	
	
	  	//looping per pages
	  	while(failCounter<5){  
	  		let pageUrl = URLs[startUrlID] + "&ref=seller_location%3AID&filter=rating&offset=0&page="+pageCounter;
	  		console.log("Go to page "+pageUrl);
	  		await page.goto(pageUrl, { timeout: 0});
	  		links = await getAllEmployeeLinks(page, pageCounter);
	  		console.log("getting links process was done");
	  		console.log(links);
	  		if(links[0]){	

	  			let fileExist = -1;
	  			let index = 0;
	  			let name = (URLs[startUrlID].substring(34,URLs[startUrlID].indexOf("?"))).replace(/\//g ,'_');
	  			console.log("file name = "+name);
	  			name = resultDirectory +"\\"+name+"_page"+pageCounter;
	  			while(fileExist != 0){
	  				if(index === 0){
	  					fileName = name+".txt";
	  				}else{
	  					fileName = name+"("+ index +").txt";
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
					stream.write(link + '\n');
				}
				stream.end();
				console.log("page "+pageCounter+" was recorded!");
				pageCounter++;
				failCounter = 0;
	  		}else{
	  			await page.waitFor(300);
		  		console.log("reset browser...");
		  		browser.close();
		  		browser = await puppeteer.launch(usingChrome);
				page = await browser.newPage();
				var agent = userAgent.getRandom(filter);
				console.log(agent);
				await page.setExtraHTTPHeaders({ "user-agent": agent});
				let currentUrl = await page.evaluate(()=>{
					return window.location.href;  
				})
	  			if(currentUrl.includes(pageUrl)){
	  				failCounter++;
	  			}else{
	  				await login(page);
	  			}	
	  		}
		}
  	}

	browser.close(); 
	finishFlag = 1;
	return finishFlag;
};


async function getAllEmployeeLinks(page,pageCounter){
	var result = [];
	result = await page.evaluate(()=>{
		let data1 = [];
		let elements = document.querySelectorAll(".gig-seller .seller-name.js-seller-name");
		for(var i=0;i<elements.length;i++){
			data1.push(elements[i].href);
		}
		return data1;
	});
	
	// let selector = '.row > .mp-gig-carousel > .pagination > .pagination-range > .link-no-style:nth-child('+(pageCounter+1)+')';
	// await page.waitForSelector(selector);
 //  	await page.click(selector);
	// await page.waitFor(TIME_DELAY_1);
  	
 //  	while(true){
	// 	let result2 = [];
	// 	result2 = await page.evaluate(() => {
	// 		let links = [];
	// 		let elements = document.querySelectorAll(".gig-seller .seller-name.js-seller-name");
	// 		for(let i = 0;i<elements.length;i++){
	// 			links.push(elements[i].href);
	// 		}
	// 		return links;
	// 	});

	// 	if(compareArray(result, result2)){
	// 		await page.waitFor(TIME_DELAY_1);
	// 		console.log("Wait until the page reloaded")
	// 	}else{
	// 		break;
	// 	}
	// }

	return result;
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

async function login(page){
	//login page
	try{
		await page.goto(loginPage, { timeout: 0, waitUntil : 'load'});
		let selector = '.js-form-login';
		await page.waitForSelector(selector);
		await page.type(selector, username);
		selector = '.js-form-password';
		await page.waitForSelector(selector);
		await page.type(selector, password);
		selector = '.popup-content-login > .popup-form > #session_form > .form-row-buttons > #login-btn';
		await page.waitForSelector(selector);
		await page.click(selector);
		await page.waitFor(TIME_DELAY_2);
	}catch(err){
		console.log("reset browser...");
  		browser.close();
  		browser = await puppeteer.launch(usingChrome);
		page = await browser.newPage();
		var agent = userAgent.getRandom(filter);
		console.log(agent);
		await page.setExtraHTTPHeaders({ "user-agent": agent});
		login(page);
	}
}

scrape(startUrlID);