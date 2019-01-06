const puppeteer = require('puppeteer');
const userAgent = require('random-useragent');
const fs = require("fs");

const TIME_DELAY_1 = 1000;
const TIME_DELAY_2 = 2000;


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

const MAX_FAIL_LIMIT = PROXY_LIST.length;
let proxyId = 0;
let startLink = process.argv[2] - 1;

var browser;
var page;
var agent;

const scrape = async (start) => {
	//prepare browser
	await resetPage(false,false);

	const linksDir  = ".\\Result\\fiverr_links\\";
	//output path setup
	let fileExist = -1;
	let index = 0;
	let fileName = "";
	while(fileExist != 0){
		if(index === 0){
			fileName = linksDir+"RawData.csv";
		}else{
			fileName = linksDir+"RawData("+ index +").csv";
		}
		if(fs.existsSync(fileName)){
			index++;
		}else{
			fileExist = 0;
		}
	}
	console.log("File Name = "+fileName);
	const outStream = fs.createWriteStream(fileName);

	//input path setup
	// const databaseFile  = linksDir + "database.txt";
	const databaseFile  = linksDir + "databaseWorker.txt";
	var links = fs.readFileSync(databaseFile);
	links = links.toString();
	links = links.split("\n");

	//process
	let failCounter = 0;
	let previousLink = "";
	for (let j = startLink;j<links.length;j++) {
		console.log("==================================== START ====================================");
		console.log("Data ID = "+j);
		if(links[j] === previousLink){
			continue;
		}
		var employeeData=[];
		employeeData = await crawlEmployeeData(links[j]);
		console.log("crawl employee data was done");
		if(employeeData[0] !=="--"){
			console.log("writing links into file...");
			outStream.write(j+",");
			for(let data of employeeData){
				data = data.replace(/,/g, ".");
				data = data.replace((/  |\r\n|\n|\r/gm),"");
				outStream.write(data + ",");
			}
			outStream.write("\n");
			console.log(employeeData);
			failCounter = 0;
		}else{
			failCounter++;
			console.log("reset browser...");
			await resetPage(true,true);
			if(failCounter<MAX_FAIL_LIMIT){
				j--;
			}else{
				failCounter = 0;
			}
		}
		previousLink = links[j];
		console.log("===================================== END =====================================");
	}
	outStream.end();
	browser.close(); 
	// Return a value
	return 1;
};

async function crawlEmployeeData(url){
	console.log('going to next page...');
	let userUrl = "https://www.fiverr.com/"+url; //comment this 
	while(true){
		try{
			await page.goto(userUrl, { timeout: 180000, waitUntil : 'load'});
			// await page.goto(url, { timeout: 180000, waitUntil : 'load'});
			break; 
		}catch(err){
			await resetPage(true,true);
  		}
	}

	console.log('getting employee data...');
	const selectors = [	".seller-card > .user-profile-info > .user-profile-label > .username-line > .seller-link",	//0 NAME
						".seller-card > .user-profile-info > .user-profile-label > .oneliner-wrapper > .oneliner",	//1 specialization
						".seller-card > .user-stats-desc > .user-stats > .member-since > strong",					//2	member since
						".seller-card > .user-stats-desc > .user-stats > .recent-delivery > strong",				//3 recent project date	

						"div > .items-list > .skill-bubble > a > .title",											//4 skills								
						".gig-item > .mp-gig-card > .gig-card-caption > .gig-link-main",							//5 Offers link		
	
						//BELOW ARE SELECTORS IN PROJECT PAGE
						".left-aligned.darker.js-str-currency.js-price",											//6 pricelist
						".js-gig-payment > .packages-list > .b-0 > .alt > .darker", 								//7 price (pricelist alternate)
						".package-body > .package-title > .package-price",											//8 pricelist2 (pricelist alternate) 
						".mp-gig > .gig-page-section > .mp-gig-header > .stats-row > .gig-ratings-count",			//9 nb of sell
						".mp-gig-header .stats-row .gig-ratings-count"												//10 nb of sell alternate
						];
	//general variables of employee 				
	let employeeData = [];

	//variabes to store data in salary processing
	let projectsLink = [];

	employeeData = await page.evaluate((selectors)=>{
		let output = [];
		//nama, anggota sejak, jml proyek selesai, skills, last project Date,offer name
		var data;		
		try{
			for(let i = 0; i<5;i++){
				data = document.querySelector(selectors[i]);
				if(data){
					if(i===4){ //for skills
						data = document.querySelectorAll(selectors[i]);
						let strSkill = "";
						for(var skill of data){
							strSkill = strSkill + skill.innerText.replace(/,/g, "//") + "//";
						}
						output.push(strSkill);
					}else{
						output.push(data.innerText.replace(/,/g, "."));
					}
				}else{
					output.push("--");
				}
			}
			//offers name
			data = document.querySelectorAll(selectors[5]);
			if(data[0]){
				let strOffers = "";
				for(var offer of data){
					offer = offer.innerText.replace(/,/g, ".");
					strOffers = strOffers + offer + "//";
				}
				output.push(strOffers);
			}else{
				output.push("--");
			}

		}catch(err){
			console.log("Error in retreive employee data:");
			console.log(err);
			output.push("-------");
		}
		return output;
	},selectors);

	console.log("base employee data was done");
	//get offers links
	projectsLink = await page.evaluate((selectors)=>{
		let links=[];
		let data = document.querySelectorAll(selectors[5]);
		if(data[0]){
			for(var link of data){
				link = ""+link.href;
				let index = link.indexOf("?ref");
				if(index>0){
					link = link.substring(0,index);
				}
				links.push(link);
			}
		}else{
			links = null;
		}
		return links;
	},selectors);
	console.log("projectsLink was done");
	console.log(projectsLink);
	if(projectsLink){
		let offerCounter = 1;
		let totalMoneyEarned = 0;
		let totalSold = 0;
		
		for(let url of projectsLink){
			while(true){
				try{
					console.log("go to : "+url);
					await page.goto(url, { timeout: 180000, waitUntil : 'load'});

					var documentTitle = await page.evaluate(()=>{
						return document.title;
					});
					documentTitle = documentTitle.toLowerCase();
					if(documentTitle.includes("attention") || documentTitle.includes("access") || documentTitle.includes("blocked")){
						console.log("page blocked");
						await resetPage(true,true);
					}else if(documentTitle === "Fiverr"){
						console.log("upgrade browser");
						await resetPage(true,true);
					}else{
						documentTitle = await page.evaluate(()=>{
							let title = document.querySelector('.mp-gig > .gig-page-section > .mp-gig-header > h1 > .gig-title');
							if(title){
								return title.innerText;
							}else{
								return null;
							}
						});
						
						if(documentTitle === null){
							console.log("page does not appear");
							await resetPage(true,true);
						}else if(documentTitle.includes("I Will")){
							console.log("succes masuk page");
							failCounter = 0;
							break;
						}else{
							console.log("unexpected condition");
							await resetPage(true,true);
						}
						
					}
				}catch(err){
					console.log("unexpected error");
					await resetPage(true,true);
				}
			}
			//masuk page
			let moneyEarned = await page.evaluate((selectors)=>{
				let result = [0,0,0];
				let totalMoney = 0
				let actualPrice = 0;
				let data = document.querySelectorAll(selectors[6]);
				if(data[0]){
					let isStringNotFound = false;
					for(var price of data){
						if(price){
							price = price.innerText.substring(1);
							price = parseInt(price);
							actualPrice = actualPrice + price;
						}else{
							isStringNotFound = true;
							break;
						}
					}
					if(isStringNotFound){
						data = document.querySelectorAll(selectors[8]);
						if(data[0]){
							for(var price of data){
								if(price){
									price = price.innerText.substring(1);
									price = parseInt(price);
									actualPrice = actualPrice + price;
								}
							}
							actualPrice = actualPrice/data.length;
						}else{
							data = document.querySelector(selectors[7]);
							if(data){
								actualPrice = parseInt(data.innerText.substring(1));
							}else{
								actualPrice = 0;
							}
						}
					}else{
						actualPrice = actualPrice/data.length;
					}
				}else{
					data = document.querySelector(selectors[7]);
					if(data){
						actualPrice = parseInt(data.innerText.substring(1));
					}else{
						actualPrice = 0;
					}
				}

				result[0] = actualPrice;

				data =  document.querySelector(selectors[9]);//nb of sell
				if(data){
					result[1] = parseInt(data.innerText.substring(1));
					totalMoney = actualPrice * (parseInt(data.innerText.substring(1)));
				}else{
					data =  document.querySelector(selectors[10]);//nb of sell alternate
					if(data){
						result[1] = parseInt(data.innerText.substring(1));
						totalMoney = actualPrice * (parseInt(data.innerText.substring(1)));
					}else{
						result[1] = 0
						totalMoney=0;
					}
				}

				result[2] = totalMoney;
				return result;
			},selectors);
			console.log("money earned : "+moneyEarned);
			totalSold = totalSold + moneyEarned[1];
			totalMoneyEarned = totalMoneyEarned + moneyEarned[2];
			offerCounter++;
		}
		employeeData.push(""+totalMoneyEarned);
		employeeData.push(""+totalSold);
	}else{
		employeeData.push("0");
		employeeData.push("0");
	}
	return employeeData;	
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

scrape(startLink);
