const puppeteer = require('puppeteer');
const userAgent = require('random-useragent');
const fs = require("fs");

const TIME_DELAY_1 = 1000;
const TIME_DELAY_2 = 2000;
const MAX_FAIL_LIMIT = 5;

let startLink = process.argv[2] - 1;

const scrape = async (start) => {
// Actual Scraping goes Here...
var browser = await puppeteer.launch({ headless: false, executablePath : 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe' });
var page = await browser.newPage();
var agent = userAgent.getRandom(function (ua) {
	return ua.osName === 'Linux';
});
console.log(agent);
page.setExtraHTTPHeaders({ 'user-agent': agent});

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
	employeeData = await crawlEmployeeData(page,links[j]);
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

async function crawlEmployeeData(page, url){
	console.log('going to next page...');
	await page.goto(url,{ timeout: 0 , waitUntil : 'load'});
	console.log('getting employee data...');

  	let res = [];
	res = await page.evaluate(() => {
		let name = document.querySelector(".row > .col-md-5 > .col-md-12 > .user__info-app > .user__username:nth-child(1)");
		let specialization = document.querySelector(".tab-content > #profile_tab > .user__bio-v2 > .mb-50 > .bio");
		let skillSet = document.querySelectorAll("#profile_tab > .mb-50 > #js-skill-review-list > .row > .u-text-truncate");

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
	});

	//go to review tab
	await page.waitForSelector('.row > .col-sm-12 > #myTab > li:nth-child(3) > a');
  	await page.click('.row > .col-sm-12 > #myTab > li:nth-child(3) > a');
  	await page.waitFor(TIME_DELAY_2);

	while(true){
		let previousReviewsLength = 0;
		let reviewsLength = 0;
		previousReviewsLength = await page.evaluate(() =>{
			let reviews  = document.querySelectorAll(".reviewSummary-v2.panel.mt-20");
			if(reviews){
				return reviews.length;
			}else{
				return 0;
			}
		});

		//scraping ends here if there is no project done yet
		if(previousReviewsLength == 0){
			console.log("no project");
			res.push('--');
			res.push('--');
			res.push('--');
			return res;
		}

		try{
			let tombol = await page.evaluate(() =>{
				let available  = document.querySelector(".tab-pane.fade.active.in .create_cancel.form-horizontal .text-center .btn.btn-default.btn-md.mt-20");
				return available;
			});

			if(tombol === null){
				console.log("no button");
				break;
			}

			if(tombol){
				console.log("click button");
				await page.waitForSelector(".tab-pane.fade.active.in .create_cancel.form-horizontal .text-center .btn.btn-default.btn-md.mt-20");
				await page.click(".tab-pane.fade.active.in .create_cancel.form-horizontal .text-center .btn.btn-default.btn-md.mt-20");
			}else{
				console.log("no button");
				break;
			}
		}catch(err){
			console.log("no button");
			break;
		}
		while(true){
			reviewsLength = await page.evaluate(() =>{
				let reviews  = document.querySelectorAll(".reviewSummary-v2.panel.mt-20");
				if(reviews){
					return reviews.length;
				}else{
					return 0;
				}
			});
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
	let moreData = await page.evaluate(() =>{
		let additionalData = [];
		const moneys = document.querySelectorAll(".reviewSummary-v2.panel.mt-20 .panel-body.reviewSummary-panel-body .row .col-sm-3 .row .col-sm-12 .iblocks.summary__price");
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

		const taskDone = document.querySelectorAll(".reviewSummary-v2 > .panel-body > .row > .col-sm-7 > .row > .col-sm-12 > .blocks > .blocks:nth-child(1)");
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

		const date = document.querySelectorAll(".reviewSummary-v2 > .panel-body > .row > .col-sm-7 > .row > .col-sm-12 > .blocks > .blocks > .text-muted");
		let firstDate = "";
		if(date){
			firstDate = date[date.length - 1].textContent;	
		}else{
			firstDate = "--";
		}
		additionalData.push(firstDate);

		return additionalData;
	});
	
	for(let data of moreData){
		res.push(data);
	}
	return res;
}

// function compareArray(arr1, arr2){
// 	if(arr1.length !== arr2.length){
// 		return false;
// 	}
// 	for(var i = 0; i< arr1.length ; i++){
// 		if(arr1[i] !== arr2[i]){
// 			return false;
// 		}
// 	}
// 	return true;
// }

scrape(startLink);
