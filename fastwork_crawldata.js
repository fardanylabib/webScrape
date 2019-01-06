const puppeteer = require('puppeteer');
const userAgent = require('random-useragent');
const fs = require("fs");

const TIME_DELAY_1 = 1000;
const TIME_DELAY_2 = 2000;
const MAX_FAIL_LIMIT = 3;
let startLink = process.argv[2] - 1;

var browser;
var page;
var agent;

const scrape = async (start) => {
	//prepare browser
	await resetPage(false);

	const linksDir  = ".\\Result\\fastwork_links\\";
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
	const databaseFile  = linksDir + "database.txt";
	var links = fs.readFileSync(databaseFile);
	links = links.toString();
	links = links.split("\n");

	//process
	let failCounter = 0;
	for (let j = startLink;j<links.length;j++) {
		console.log("==================================== START ====================================");
		var employeeData=[];
		employeeData = await crawlEmployeeData(links[j]);
		console.log("crawl employee data was done");
		if(employeeData[0] !=="--"){
			console.log("writing links into file...");
			console.log("Data ID = "+j);
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
			await resetPage(true);
			if(failCounter<MAX_FAIL_LIMIT){
				j--;
			}
		}
		console.log("===================================== END =====================================");
	}
	stream.end();
	browser.close(); 
	// Return a value
	return result;
};

async function crawlEmployeeData(url){
	console.log('going to next page...');

	while(true){
		try{
			await page.goto(url, { timeout: 100000, waitUntil : 'load'});
			break; 
		}catch(err){
			await resetPage(true);
  		}
	}

	console.log('getting employee data...');
	const selectors = [	".header > .fw-container > .profile > .profile__info > .username",							//0 NAME
						"div > .card:nth-child(1) > .card-list:nth-child(2) > .value > span", 						//1 anggota sejak
						"div > .card > .card-list:nth-child(3) > .value > span",									//2	jumlah proyek selesai
						".content-side > div > .card:nth-child(6) > .card-list > .title",							//3 Skill		
						".review-box > .review-box__list:nth-child(1) > .user-detail > .username > .\_opct-50",		//4 last project date								
						".col-lg-4 > .fw > .info-container > .info-a > a > .title",									//5 Offers name		
	
						//BELOW ARE SELECTORS IN PROJECT PAGE
						".row .col-lg-4.col-md-4.col-xs-12._pdh-8px._mgbt-4px .fw.card .info-container .info-a a",	//6 Offers link
						".row > .\_w-100pct > .\_fdrt-r > .info-box:nth-child(3) > .description", 					//7 Offer terjual
						".content-main > .review-box > .package-container > .package-footer > .package-price"		//8 Offer harga
						];
	//general variables of employee 				
	let employeeData = [];

	//variabes to store data in salary processing
	let projectsLink = [];
	let projectsCompleted = 0;

	employeeData = await page.evaluate((selectors)=>{
		let output = [];
		//nama, anggota sejak, jml proyek selesai, skills, last project Date,offer name
		var data;		
		try{
			for(let i = 0; i<5;i++){
				data = document.querySelector(selectors[i]);
				if(data){
					if(i===3){ //for skills
						data = document.querySelectorAll(selectors[3]);
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

	// console.log("Offers name = "+employeeData[]);

	projectsCompleted = parseInt(employeeData[2]);
	//get project links
	projectsLink = await page.evaluate((selectors)=>{
		let links=[];
		let data = document.querySelectorAll(selectors[6]);
		if(data[0]){
			for(let link of data){
				links.push(link.href);
			}
		}else{
			links = null;
		}
		return links;
	},selectors);

	if(projectsCompleted !==0 && projectsLink){
		let offerCounter = 1;
		let totalMoneyEarned = 0;
		let totalSold = 0;
		
		for(let url of projectsLink){

			let failCounter = 0;
			while(true){
				try{
					if(failCounter>3){
						console.log("Offer page "+offerCounter+" is error");
						break;
					}
					await page.goto(url, { timeout: 100000, waitUntil : 'load'});
					break; 
				}catch(err){
					failCounter++;
					await resetPage(true);
				}
			}
			//masuk page
			let priceDetail = await page.evaluate((selectors)=>{
				let details = [0,0,0];
				let actualPrice = 0;
				let data = document.querySelectorAll(selectors[8]);
				if(data[0]){
					for(var price of data){
						price = price.innerText.substring(price.innerText.indexOf("Rp") + 2);
						price = price.replace(/\./g, "");
						price = parseInt(price);
						actualPrice = actualPrice + price;
					}
					actualPrice = actualPrice/data.length;
				}
				data = document.querySelector(selectors[7]);
				if(data){
					data = parseInt(data.innerText);
				}else{
					data = 0;
				}
				details[2] = actualPrice;
				actualPrice = actualPrice * data;
				details[0] = actualPrice;
				details[1] = data;
				return details;
			},selectors);
			console.log("price example : "+priceDetail[2]);
			totalMoneyEarned = totalMoneyEarned + priceDetail[0];
			totalSold = totalSold + priceDetail[1];
			offerCounter++;
		}
		let averageMoney
		if(totalSold!==0){
			averageMoney = totalMoneyEarned/totalSold;
		}else{
			averageMoney = 0;
		}
		
		console.log("projects completed = "+projectsCompleted);
		totalMoneyEarned = projectsCompleted * averageMoney;
		console.log("average money = "+averageMoney);
		console.log("totalMoneyEarned = "+totalMoneyEarned);
		employeeData.push(""+totalMoneyEarned);
	
	}else{
		employeeData.push("0");
	}
	
	return employeeData;	
}



async function resetPage(resetBrowser){
	if(resetBrowser){
		console.log("reset browser...");
		browser.close();
	}
	browser = await puppeteer.launch({ headless: false, executablePath : 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe' });
	page = await browser.newPage();
	agent = userAgent.getRandom(function (ua) {
		return ua.osName === 'Linux';
	});
	console.log(agent);
	page.setExtraHTTPHeaders({ 'user-agent': agent});
	console.log("reset page success");
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


async function checkNextButton(selectors){
	let buttonId = await page.evaluate((selectors) => {
		let available = document.querySelector(selectors[8]);
    	if(available){
    		return 8;
    	}
    	available = document.querySelector(selectors[14]);
    	if(available){
    		return 14;
    	}
    	available = document.querySelector(selectors[15]);
    	if(available){
    		return 15;
    	}else{
    		return 0;
    	} 
	},selectors);
	return buttonId;
}

scrape(startLink);
