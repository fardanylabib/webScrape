const puppeteer = require("puppeteer");
const userAgent = require("random-useragent");
const fs 		= require("fs");
const cluster 	= require('cluster');
const numCPUs = require("os").cpus().length;

const folderNameOffset = 43;
const TIME_DELAY_2 = 2000;
const TIME_DELAY_1 = 1000;
const PROXY_LIST = ["no-proxy",
					"--proxy-server=http://202.125.94.139:1234",
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
const URLs = [	"https://www.upwork.com/o/profiles/browse/c/web-mobile-software-dev/?loc=indonesia&page=",  //0
				"https://www.upwork.com/o/profiles/browse/c/it-networking/?loc=indonesia&page=",			//1
				"https://www.upwork.com/o/profiles/browse/c/data-science-analytics/?loc=indonesia&page=",	//2
				"https://www.upwork.com/o/profiles/browse/c/engineering-architecture/?loc=indonesia&page=",	//3
				"https://www.upwork.com/o/profiles/browse/c/design-creative/?loc=indonesia&page=",			//4
				"https://www.upwork.com/o/profiles/browse/c/writing/?loc=indonesia&page=",					//5
				"https://www.upwork.com/o/profiles/browse/c/translation/?loc=indonesia&page=",				//6
				"https://www.upwork.com/o/profiles/browse/c/legal/?loc=indonesia&page=",					//7
				"https://www.upwork.com/o/profiles/browse/c/customer-service/?loc=indonesia&page=",			//8
				"https://www.upwork.com/o/profiles/browse/c/sales-marketing/?loc=indonesia&page=",			//9
				"https://www.upwork.com/o/profiles/browse/c/accounting-consulting/?loc=indonesia&page=",	//10
				"https://www.upwork.com/o/profiles/browse/c/admin-support/?loc=indonesia&page=",];			//11

var startPage = process.argv[3];
var urlID = process.argv[2] - 1;

var browser;
var page;
var agent;
let proxyId = 0;
async function doScraping(selectedUrlId,selectedStartPage){
	console.log("URL ID = "+selectedUrlId);
	console.log("START PAGE = "+selectedStartPage);
	
	let finishFlag = 0
	await resetPage(false);
	console.log(agent);
	const resultDirectory = ".\\Result\\upwork_links\\";

	while(selectedUrlId<URLs.length){

		let folderName = URLs[selectedUrlId].substring(folderNameOffset,folderNameOffset+4);
		//make file directory".\\Result\\upwork_links";

		fs.mkdir(resultDirectory,function(e){
			if(!e || (e && e.code === 'EEXIST')){
				console.log("directory upwork_links created");
				fs.mkdir(resultDirectory+folderName,function(e){
					if(!e || (e && e.code === 'EEXIST')){
						console.log("directory " +folderName + " created");
					} else {
				        //debug
				        console.log(e);
				    }
				});
			} else {
		        //debug
		        console.log(e);
		    }
		});

	  	// Actual Scraping goes Here...
	  	let failCounter = 0;
	  	var links= [];
	  	let currentPage="a";
	  	let lastPage="b";
	  	while(failCounter<20 && selectedStartPage<=500){  
	  		console.log("getting links from page " +selectedStartPage);	
	  		while(true){
	  			try{
	  				await page.goto(URLs[selectedUrlId]+selectedStartPage, { timeout: 180000, waitUntil : 'domcontentloaded'});
	  				await page.waitFor(TIME_DELAY_1/2);
	  				break; 
	  			}catch(err){
	  				await resetPage(true);
	  			}
	  		}
	  		currentPage = await page.evaluate(()=>{
				return window.location.href;  
			});

	  		links = await getAllEmployeeLinks(page);
	  		console.log("getting links process was done");
	  		console.log(links);
	  		if(links[0]){		
	  			let fileExist = -1;
	  			let index = 0;
	  			let fileName = "";
	  			while(fileExist != 0){
	  				if(index === 0){
	  					fileName = resultDirectory+folderName+"\\page"+selectedStartPage+".txt";
	  				}else{
	  					fileName = resultDirectory+folderName+"\\page"+selectedStartPage+"("+ index +").txt";
	  				}
	  				if(fs.existsSync(fileName)){
	  					index++;
	  				}else{
	  					fileExist = 0;
	  				}
	  			}
	  			
	  			var stream = fs.createWriteStream(fileName);
	  			for(const link of links){

	  				if(link == new String("LAST").valueOf()){
	  					console.log("LAST PAGE REACHED");
	  					failCounter = 100;
	  					break;
	  				}
	  				stream.write(link + '\n');
	  			}
	  			stream.end();
	  			console.log("page "+selectedStartPage+" was recorded!");
	  			selectedStartPage++;
	  			if(currentPage === lastPage){
	  				failCounter+=5;;
	  				console.log("current and previous page are same (end of page reached)");
	  			}else{
	  				failCounter=0;	
	  			}
	  			lastPage = currentPage;
	  		}else{
	  			failCounter++
	  			await page.waitFor(300);
	  			console.log("reset browser...");
	  			await resetPage(true);
	  		}
	  		
	  	}
	  	selectedStartPage = 1;
	  	selectedUrlId++;
 	}
	browser.close(); 
	finishFlag = 1;
	return finishFlag;
};

async function getAllEmployeeLinks(){
	var result = [];
	result = await page.evaluate(()=>{
		let data1 = [];
		let elements = document.querySelectorAll('a.freelancer-tile-name')
		for(var element of elements){
			data1.push(element.href);
		}    
		return data1;
	});
	
	return result;
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


doScraping(urlID,startPage);

