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
	await resetPage(false,false);
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
	// while(true){
	// 	await page.goto(mainURL, { timeout: 0, waitUntil : 'load'});	
	// 	URLs = await page.evaluate(()=>{
	// 		let urlList = [];
	// 		let elements = document.querySelectorAll(".js-category-nav.category-nav .slider-box .slider-hider .slide .dropdown li a");
	// 		for(let i=0;i<elements.length;i++){
	// 			urlList.push(elements[i].href);
	// 		}
	// 		return urlList;
	// 	});
	// 	if(URLs[0]){
	// 		break;
	// 	}else{
	// 		await resetPage(true);
	// 	}
	// }
	// console.log("Found "+URLs.length+" URLs");
	// console.log(URLs);

	// let streamUrl = fs.createWriteStream("URLs.txt");
	// console.log("writing links into file...");
	// for(const link of URLs){
	// 	streamUrl.write(link + '\n');
	// }
	// streamUrl.end();

	const URLsFileName = resultDirectory +"URLs.txt";
	var URLs = fs.readFileSync(URLsFileName);
	URLs = URLs.toString();
	URLs = URLs.split("\n");
	console.log("Found "+URLs.length+" URLs");

	for(; startUrlID<URLs.length;startUrlID++){
		const pageUrl = URLs[startUrlID];
		let pageCounter = 1;
		let failCounter = 0;
		let nbOfPage=100;
		while(pageCounter<=nbOfPage && failCounter<5){
			var links= [];
			try{
				console.log("go to : "+pageUrl+pageCounter);
				await page.goto(pageUrl+pageCounter, { timeout: 0, waitUntil : 'domcontentloaded'});
				await page.waitFor(TIME_DELAY_1/2);

				let currentURL = await page.evaluate(()=>{
					return window.location.href;  
				});
				if(currentURL.includes("https://www.fiverr.com/categories/") || currentURL.includes("https://www.fiverr.com/search/gigs?")){
					const documentTitle = await page.evaluate(()=>{
						return document.title;
					});
					if(documentTitle.includes("Attention")){
						console.log("page blocked")
						//page blocked
						await resetPage(true,true);
						continue;
					}
					console.log("berhasil masuk page");
					//berhasil masuk page
					let nbOfPageDisplay = await page.evaluate(()=>{
						var users=0;
						let str = document.querySelector(".filter-category-list.filter-multi-long .selected .rf");
						if(str){
							users = str.innerText;
							users = users.substring(users.indexOf("(")+1);
							users = parseFloat(users);
							users = users/48;
							let inUsers = Math.floor(users);
							if(users>inUsers){
								inUsers++;
							}
							users = inUsers;
							return users;
						}else{
							return users;
						}
					});
					console.log("page to be displayed : "+nbOfPageDisplay);	
					if(nbOfPageDisplay>0){
						nbOfPage = nbOfPageDisplay;
					}else if(nbOfPageDisplay===0){
						await resetPage(true,false);
						break;
					}
										
					links = await getAllEmployeeLinks();
					console.log("getting links process was done");
					console.log(links);

					if(links[0]){	
						if(links[0]==="end"){
							await resetPage(true,false);
							break;
						}
						let fileExist = -1;
						let index = 0;
						let name = (URLs[startUrlID].substring(34,URLs[startUrlID].indexOf("?"))).replace(/\//g ,'_');
						let fileName;
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
						// failCounter = 0;
					}else{
						//no links
						console.log("no links here");
						await resetPage(true,false);
						failCounter++;
					}
					// break;
				}else{
					console.log("page blocked")
					//page blocked
					await resetPage(true,true);
				}

			}catch(err){
				//connection error
				// failCounter++;
				console.log(err);
				await resetPage(true,true);
			}

			console.log("\n\n\n")
		}
	}
	browser.close(); 
	finishFlag = 1;
	return finishFlag;
};


async function getAllEmployeeLinks(){
	var result = [];
	result = await page.evaluate(()=>{
		let data1 = [];
		let elements = document.querySelectorAll(".gig-thumb-wrapper .gig-seller .seller-name.js-seller-name");
		let elementsAlternate = document.querySelectorAll(".gig-card-caption .gig-seller-info .seller-info-wrapper .seller-name");
		let endOfPage = document.querySelector(".request-cta");

		if(elements.length != 0){
			for(let i=0;i<elements.length;i++){
				data1.push(elements[i].href);
			}
		}else if(elementsAlternate.length != 0){
			for(let i=0;i<elementsAlternate.length;i++){
				data1.push(elementsAlternate[i].href);
			}
		}else if(endOfPage){
			data1.push("end");
		}
		
		return data1;
	});

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

async function resetPage(resetBrowser,rotateProxy){
	if(resetBrowser){
		console.log("reset browser...");
		browser.close();
	}
	//rotate proxy

	if(rotateProxy){
		proxyId++;
		if(proxyId >= PROXY_LIST.length){
			proxyId = 0;
		}	
	}

	let proxyStr = PROXY_LIST[proxyId];
	console.log("using proxy: "+ proxyId + ". "+proxyStr);
	if(proxyId==0){
		browser = await puppeteer.launch({ headless: false, executablePath : 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'});
	}else{
		browser = await puppeteer.launch({ headless: false, executablePath : 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe', 'args' : [proxyStr]});
	}



	page = await browser.newPage();
	agent = userAgent.getRandom(function (ua) {
		return ua.osName === 'Linux';
	});
	console.log(agent);
	page.setExtraHTTPHeaders({ 'user-agent': agent});
	console.log("reset page success");
}


scrape(startUrlID);