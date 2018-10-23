const puppeteer = require("puppeteer");
const userAgent = require("random-useragent");
const fs = require("fs");

const selectedUrlId = 0; //CHANGE THIS TO THE INDEXES BELOW
const folderNameOffset = 52;

const loginPage = "https://www.fiverr.com/login?source=signin_redirect";
const mainURL = "https://www.fiverr.com/";
let URLs = [];
let startUrlID = process.argv[2] - 1;

const TIME_DELAY_2 = 2000;
const TIME_DELAY_1 = 1000;
const PROXY_LIST = ["no-proxy",
					"--proxy-server=http://36.37.85.50:41367",
					"--proxy-server=http://36.37.89.99:32323",
					"--proxy-server=http://36.89.39.10:3128",
					"--proxy-server=http://203.99.123.25:61502",
					"--proxy-server=http://36.91.48.82:8080",//lemot tapi ok
					"--proxy-server=http://203.77.215.250:61474",
					"--proxy-server=http://110.232.86.6:54022",
					"--proxy-server=http://222.124.131.211:47343",
					"--proxy-server=http://202.93.128.98:3128",
					"--proxy-server=http://203.142.64.35:45458",
					"--proxy-server=http://123.231.230.130:42259",
					"--proxy-server=http://222.165.222.137:30687",
					"--proxy-server=http://117.54.234.36:42455",
					"--proxy-server=http://203.77.215.250:61474"
					];

var browser;
var page;
var agent;
let proxyId = 0;

const scrape = async (startUrlID) => {

	let finishFlag = 0
	await resetPage(false);
	const resultDirectory = ".\\Result\\fiverr_links\\";

	fs.mkdir(resultDirectory,function(e){
	    if(!e || (e && e.code === 'EEXIST')){
	        console.log("directory fiverr_links created");
	    } else {
	        //debug
	        console.log(e);
	    }
	});

	//get all category links
	while(true){
		try{
			// page.on('response', request => {
			// 	// console.log(request);
			// 	throw 'no page response';
			// });
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
				console.log("no URL");
				await resetPage(true);
			}
		}catch(err){
			console.log(err);
			await resetPage(true);
		}
	}
	console.log("Found "+URLs.length+" URLs");
	console.log(URLs);

  	// Actual Scraping goes Here...
  	//looping per child URLS
  	for(; startUrlID<URLs.length;startUrlID++){
  		let links= [];
  		let prevLinks = [];
  		let failCounter = 0;
	  	let pageCounter = 1;	
		while(true){
			try{
				// page.on('response', request => {
				// 	// console.log(request);
    //         		throw 'no page response';
    //     		});

				await page.goto(URLs[startUrlID], { timeout: 180000, waitUntil : 'load'});
				// const countryFilter = ".filter-sidebar-group > .filter-multi-long > .filter-typeahead-select > .typeahead-select > .search-lastpass-disable";

				prevLinks = await getAllEmployeeLinks();
				const countryFilter = ".filter-typeahead-select.js-typeahead-select .typeahead-select .search-lastpass-disable";
				await page.waitForSelector(countryFilter);
  				await page.type(countryFilter,"indonesia");
 				//press ENTER
				await page.type(String.fromCharCode(13));
				console.log("filter indonesia has been applied");
				break; 
			}catch(err){
				console.log(err);
				await resetPage(true);
			}
		}

		
	  	while(failCounter<5){  
	  		console.log("Go to page "+pageCounter);
	  		await page.waitFor(TIME_DELAY_1);
	  		let waitCounter = 0
	  		while(waitCounter<30){
	  			links = await getAllEmployeeLinks();
	  			if(links[0]){
	  				if(compareArray(links, prevLinks)){
	  					await page.waitFor(TIME_DELAY_1);
	  					console.log("Wait until the page reloaded");
	  					waitCounter++;
	  				}else{
	  					break;
	  				}
	  			}else{
	  				await page.waitFor(TIME_DELAY_1);
	  				console.log("Wait until the page reloaded");
	  				waitCounter++;
	  			}
	  			
	  		}

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
					// console.log(fileName);
	  			}
	  			
	  			var stream = fs.createWriteStream(fileName);
	  			console.log("writing links into file...");
				for(const link of links){
					stream.write(link + '\n');
				}
				stream.end();
				console.log("page "+pageCounter+" was recorded!");
				pageCounter++;

				let selectorPage = ".row > .mp-gig-carousel > .pagination > .pagination-range > .link-no-style";
				let pageLength = document.querySelectorAll(selectorPage).length;
				if(pageLength<10){
					selectorPage = selectorPage + ":nth-child("+pageCounter+")";
					await page.waitForSelector(selectorPage);
					await page.click(selectorPage,{delay:250});
				}else{
					selectorPage = ".row > .mp-gig-carousel > .pagination > .link-no-style:nth-child(3) > .fa";
					await page.waitForSelector(selectorPage);
					await page.click(selectorPage,{delay:250});
				}
				failCounter = 0;
	  		}else{
	  			let currentURL = await page.evaluate(()=>{
	  				return window.location.href;  
	  			});
	  			failCounter++;
	  			await resetPage(true);
	  			while(true){
	  				try{
	  					// page.on('response', request => {
	  					// 	// console.log(request);
	  					// 	throw 'no page response';
	  					// });
	  					await page.goto(currentURL, { timeout: 180000, waitUntil : 'domcontentloaded'});
	  					break; 
	  				}catch(err){
	  					console.log(err);
	  					await resetPage(true);
	  				}
	  			}
	  		}
		}
  	}

	browser.close(); 
	finishFlag = 1;
	return finishFlag;
};


async function getAllEmployeeLinks(){
	var result = [];
	console.log("get employee links");
	result = await page.evaluate(()=>{
		let data1 = [];
		let elements = document.querySelectorAll(".gig-thumb-wrapper .gig-seller .seller-name.js-seller-name");
		let elementsAlternate = document.querySelectorAll(".gig-card-caption .gig-seller-info .seller-info-wrapper .seller-name");

		if(elements.length != 0){
			for(let i=0;i<elements.length;i++){
				data1.push(elements[i].href);
			}
		}else if(elementsAlternate.length != 0){
			for(let i=0;i<elementsAlternate.length;i++){
				data1.push(elementsAlternate[i].href);
			}
		}
		
		return data1;
	});
	console.log("get employee links done");
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

async function resetPage(resetBrowser){
	if(resetBrowser){
		console.log("reset browser...");
		browser.close();
	}
	//rotate proxy
	let proxyStr = PROXY_LIST[proxyId];
	console.log("using proxy: "+ proxyId + ". "+proxyStr);
	if(proxyId==0){
		browser = await puppeteer.launch({ headless: false, executablePath : 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'});
	}else{
		browser = await puppeteer.launch({ headless: false, executablePath : 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe', 'args' : [proxyStr]});
	}
	proxyId++;
	if(proxyId >= PROXY_LIST.length){
		proxyId = 0;
	}

	page = await browser.newPage();
	agent = userAgent.getRandom(function (ua) {
		return ua.osName === 'Linux';
	});
	console.log(agent);
	page.setExtraHTTPHeaders({ 'user-agent': agent});
	console.log("reset page success");
}

// async function login(page){
// 	//login page
// 	try{
// 		await page.goto(loginPage, { timeout: 0, waitUntil : 'load'});
// 		let selector = '.js-form-login';
// 		await page.waitForSelector(selector);
// 		await page.type(selector, username);
// 		selector = '.js-form-password';
// 		await page.waitForSelector(selector);
// 		await page.type(selector, password);
// 		selector = '.popup-content-login > .popup-form > #session_form > .form-row-buttons > #login-btn';
// 		await page.waitForSelector(selector);
// 		await page.click(selector);
// 		await page.waitFor(TIME_DELAY_2);
// 	}catch(err){
// 		console.log("reset browser...");
//   		browser.close();
//   		browser = await puppeteer.launch(usingChrome);
// 		page = await browser.newPage();
// 		var agent = userAgent.getRandom(filter);
// 		console.log(agent);
// 		await page.setExtraHTTPHeaders({ "user-agent": agent});
// 		login(page);
// 	}
// }

scrape(startUrlID);