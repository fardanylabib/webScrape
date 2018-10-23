const puppeteer = require('puppeteer');
const userAgent = require('random-useragent');
const fs = require("fs");

const TIME_DELAY_1 = 1000;
const TIME_DELAY_2 = 2000;
const MAX_FAIL_LIMIT = 5;
const MAX_WAIT_LIMIT = 30;
let startLink = process.argv[2] - 1;

var browser;
var page;
var agent;

const scrape = async (start) => {
	// Actual Scraping goes Here...
	await resetPage(false);

	const linksDir  = ".\\Result\\sribulancer_links\\";

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
	let failCounter = 0;
	for (let j = startLink;j<links.length;j++) {
		var employeeData=[];
		employeeData = await crawlEmployeeData(links[j]);
		if(employeeData[0] !=="--"){
			console.log("writing links into file...");
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
			browser.close();
			browser = await puppeteer.launch({ headless: false, executablePath : "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe" });
			page = await browser.newPage();
			agent = userAgent.getRandom(function (ua) {
				return ua.osName === 'Linux';
			});
			console.log(agent);
			page.setExtraHTTPHeaders({ "user-agent": agent});
			if(failCounter<MAX_FAIL_LIMIT){
				j--;
			}
		}
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
			await page.goto(url, { timeout: 180000, waitUntil : 'domcontentloaded'});
			await page.waitFor(TIME_DELAY_1/2);
			break; 
		}catch(err){
			await resetPage(true);
  		}
	}

	console.log('getting employee data...');
	const selectors = [	".row > .col-md-5 > .col-md-12 > .user__info-app > .user__username:nth-child(1)", 	//0 NAME
						".tab-content > #profile_tab > .user__bio-v2 > .mb-50 > .bio",						//1	SPECIALIZATION
						"#profile_tab > .mb-50 > #js-skill-review-list > .row > .u-text-truncate",			//2	SKILLSET
						".row > .col-sm-12 > #myTab > li > a",												//3 REVIEW TAB
						".reviewSummary-v2.panel.mt-20",													//4 REVIEW FROM INDIVIDUALS
						".tab-pane.fade.active.in .create_cancel.form-horizontal .text-center .btn.btn-default.btn-md.mt-20",							//5 SHOWMORE BUTTON
						".reviewSummary-v2.panel.mt-20 .panel-body.reviewSummary-panel-body .row .col-sm-3 .row .col-sm-12 .iblocks.summary__price",	//6 MONEY
						".reviewSummary-v2 > .panel-body > .row > .col-sm-7 > .row > .col-sm-12 > .blocks > .blocks:nth-child(1)",						//7 PROJECT
						".reviewSummary-v2 > .panel-body > .row > .col-sm-7 > .row > .col-sm-12 > .blocks > .blocks > .text-muted"						//8 FIRST DATE
						];
	//check if all selector needed were available

	let resetPageCounter = 0;
	while (resetPageCounter<3){
		let wait = true;
		let waitCounter = 0;
		while(wait){
			wait = await page.evaluate((selectors) => {
				let flag = null;
				for(let i = 0 ;i<4;i++){
					flag = document.querySelector(selectors[i]);
					if(flag){
						//do nothing
					}else{
						return true;
					}
				}
				return false; //end point inside loop
			},selectors);
			console.log("wait counter = " + waitCounter + " reset page counter = "+resetPageCounter);
			if(waitCounter > MAX_WAIT_LIMIT){
				await resetPage(true);
				while(true){
					try{
						await page.goto(url, { timeout: 180000, waitUntil : 'domcontentloaded'});
						await page.waitFor(TIME_DELAY_1/2);
						break; 
					}catch(err){
						await resetPage(true);
					}
				}
				resetPageCounter++;
				break;
			}
			waitCounter++;
			await page.waitFor(TIME_DELAY_1);
		}
		if(wait == false){
			break; //end point outside loop
		}
		console.log('waiting done');	
	}

	let res = [];
	if(resetPageCounter>=3){
		res.push("account closed");
		return res;
	}

	
	res = await page.evaluate((selectors) => {
		let name = document.querySelector(selectors[0]);
		let specialization = document.querySelector(selectors[1]);
		let skillSet = document.querySelectorAll(selectors[2]);

		let data = [];

		if(name){
			data.push(name.textContent);
		}else{
			data.push('--');
		}

		if(specialization){
			data.push(specialization.textContent);
		}else{
			data.push('--');
		}

		let strData = "";
		for(let skill of skillSet){
			if(skill){
				strData = strData + skill.innerText + "//";
			}else{
				strData = strData+"--";
			}
		} 
		data.push(strData);
		return data;
	},selectors);

	//go to review tab
	let nbOfTab = await page.evaluate((selectors) =>{
		let tabs  = document.querySelectorAll(selectors[3]);
		if(tabs){
			return tabs.length;
		}else{
			return 0;
		}
	},selectors);


	await page.waitForSelector(".row > .col-sm-12 > #myTab > li:nth-child("+nbOfTab+") > a");
	await page.click(".row > .col-sm-12 > #myTab > li:nth-child("+nbOfTab+") > a",{delay:250});
	await page.waitFor(TIME_DELAY_2);
	let failCounter2 = 0;
	while(failCounter2<10){
		let previousReviewsLength = 0;
		let reviewsLength = 0;
		previousReviewsLength = await page.evaluate((selectors) =>{
			let reviews  = document.querySelectorAll(selectors[4]);
			if(reviews){
				return reviews.length;
			}else{
				return 0;
			}
		},selectors);

		//scraping ends here if there is no project done yet
		if(previousReviewsLength == 0){
			console.log("no project");
			res.push('--');
			res.push('--');
			res.push('--');
			return res;
		}

		try{
			let tombol = await page.evaluate((selectors) =>{
				let available  = document.querySelector(selectors[5]);
				return available;
			},selectors);

			if(tombol === null){
				console.log("no button");
				break;
			}

			if(tombol){
				console.log("click button");
				await page.waitForSelector(selectors[5]);
				await page.click(selectors[5],{delay:250});
			}else{
				console.log("no button");
				break;
			}
		}catch(err){
			console.log("no button");
			break;
		}
		while(true){
			reviewsLength = await page.evaluate((selectors) =>{
				let reviews  = document.querySelectorAll(selectors[4]);
				if(reviews){
					return reviews.length;
				}else{
					return 0;
				}
			},selectors);
			if(reviewsLength == 0){
				console.log("no project");
				break;
			}else if(reviewsLength != previousReviewsLength){
				console.log("reviewsLength = "+reviewsLength);
				console.log("previousReviewsLength = "+previousReviewsLength);
				break;
			}
			console.log("wait until page loaded");
			await page.waitFor(TIME_DELAY_1)		
		}
		previousReviewsLength = reviewsLength;
	}

	//get all projects and money earned per peroject
	let moreData = await page.evaluate((selectors) =>{
		let additionalData = [];
		const moneys = document.querySelectorAll(selectors[6]);
		let strData = ""
		let totalMoney = 0;
		if(moneys){
			for(let money of moneys){
				money = money.textContent;
				money = money.replace("IDR ","");
				money = money.replace(/,/g, "");
				money = parseInt(money);
				totalMoney += money;
			}
			strData = ""+totalMoney;
		}else{
			strData = "--";
		}
		additionalData.push(strData);

		const taskDone = document.querySelectorAll(selectors[7]);
		strData = "";
		if(taskDone){
			for(let task of taskDone){
				task = task.textContent;
				strData += (task +"//");
			}
		}else{
			strData = "--";
		}
		additionalData.push(strData);

		const date = document.querySelectorAll(selectors[8]);
		let firstDate = "";
		let lastDate = ""; 
		if(date){
			firstDate = date[date.length - 1].textContent;	
			lastDate = date[0].textContent;
		}else{
			firstDate = "--";
			lastDate  = "--";
		}
		additionalData.push(firstDate);
		additionalData.push(lastDate);

		


		return additionalData;
	},selectors);
	
	for(let data of moreData){
		res.push(data);
	}
	return res;
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

scrape(startLink);
