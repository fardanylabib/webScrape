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

	const linksDir  = ".\\Result\\pph_links\\";
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
			}else{
				failCounter = 0;
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
			await page.goto(url, { timeout: 0, waitUntil : 'load'});
			break; 
		}catch(err){
			await resetPage(true);
  		}
	}

	console.log('getting employee data...');
	const selectors = [	".main-content > .clearfix > .profile-header-member > .seller-name > h2",						//0 NAME
						".hidden-xs > .hidden-xs > .clearfix > .details-list > li:nth-child(5)", 						//1 CITY
						".main-content > .clearfix > .profile-header-member > .seller-name > p",						//2	SPECIALIZATION
						".memStats-container .widget-memberStats .memberStats-item.row .col-sm-6.value.text-right",		//3 DATE OF LAST PROJECT										
						".widget-memberStats .memberStats-item.row .col-sm-3.value.text-right",							//4 NB OF PROJECT COMPLETD (must be QUERY SELECTOR ALL AND index 2)												
						".row > .left-column > .clearfix > .clearfix > .tag-item",										//5 SKILLSET						
						".my-activity-provider > .project-list-item > .project-info-container > .col-xs-12 > h6",		//6 PROJECTS NAME
						".project-list-item > .project-info-container > .col-xs-12 > h6 > .job",						//7 PROJECTS NAME WITH LINK
						".pager > .pagination > #yw0 > li > .next",														//8 NEXT BUTTON
						".profile-main > #members-widget-hourlies-portfolio > .nav > li:nth-child(2) > a", 				//9 MY OFFER TAB
						".col-xs-12 > .hourlie-wrapper > .hourlie__profile > .hourlie__price > .price-container > span",//10 OFFER PRICE 
						".col-xs-12 > .hourlie-wrapper > .hourlie__stats--aux > .stat__item > .sales__info > .value", 	//11 OFFER NB OF SALES 

						//BELOW ARE SELECTORS IN PROJECT PAGE
						".clearfix:nth-child(1) > .col-xs-6 > .price-tag > .price-approx > span", 						//12 OFFER PRICES IN DOLLAR
						".job-stats > .clearfix:nth-child(1) > .col-xs-6 > .value > span", 								//13 OFFER PRICES IN ANY CURRENCY
						'.pager > .pagination > #yw1 > li > .next',														//14 NEXT BTN ALTERNATE1 
						'.pagination > #yw0 > li > .next > .fa',														//15  NEXT BTN ALTERNATE2
						".project-list-item > .project-info-container > .col-xs-12 > .meta > .horizontal > li:nth-child(2)"	//16 PROJECT DATE (must betaken in last page and last element)
						];
	//general variables of employee 				
	let employeeData = [];
	let projectsName = [];

	//variabes to store data in salary processing
	let projectsLink = [];
	let totalOfferAmount = [];
	let projectsCompleted = 0;

	employeeData = await page.evaluate((selectors)=>{
		let output = [];
		//name,city,specialization, last project date
		var data;		
		try{
			for(let i = 0; i<3;i++){
				data = document.querySelector(selectors[i]);
				if(data){
					output.push(data.innerText.replace(/,/g, "."));
				}else{
					output.push("--");
				}
			}
			//last project date
			data = document.querySelectorAll(selectors[3])[1];
			if(data){
				output.push(data.innerText.replace(/,/g, "."));
			}else{
				output.push("--");
			}

			//nb of completed project
			data = document.querySelectorAll(selectors[4])[2];
			if(data){
				output.push(data.innerText);
			}else{
				output.push("--");
			}

			//skillset
			data = document.querySelectorAll(selectors[5]);
			if(data[0]){
				let strSkill = "";
				for(var skill of data){
					skill = skill.innerText.replace(/,/g, ".");
					strSkill = strSkill + skill+"//";
				}
				output.push(strSkill);
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

	projectsCompleted = employeeData[4];
	
	console.log("employee data = "+employeeData);
	//check next btn
	let selectorBtnId = await checkNextButton(selectors);
	if(selectorBtnId !=0 ){
		//next button detected
		console.log("next button detected");
		let strProj = "";		
		var data = [];

		try{
			while(selectorBtnId != 0){
				let projectList1 = [];
				let projectList2 = [];
				data = await page.evaluate((selectors) => {
					let dataStr = [];
					let elements = document.querySelectorAll(selectors[6]);
					for(let element of elements){
						dataStr.push(element.innerText);
					}
					return  dataStr;
				},selectors);
				// console.log(data);
				if(data[0]){
					for(var project of data){
						project = project.replace(/,/g, ".");
						strProj = strProj + project +"//";
						projectList1.push(project);
					}
				}else{
					strProj = "--//";
					projectList1.push("--");
				}
				//check if there is project name with link
				data = await page.evaluate((selectors) => {
					let dataStr = [];
					let elements = document.querySelectorAll(selectors[7]);
					for(let element of elements){
						dataStr.push(element.href);
					}
					return  dataStr;
				},selectors);

				if(data[0]){
					for(var projectLink of data){
						projectsLink.push(projectLink);
					}
				}

				//click next button
				page.click(selectors[selectorBtnId],{delay:250});
				while(true){
					//check wether the project list are same or not
					data = await page.evaluate((selectors) => {
						let dataStr = [];
						let elements = document.querySelectorAll(selectors[6]);
						for(let element of elements){
							dataStr.push(element.innerText);
						}
						return  dataStr;
					},selectors);

					if(data[0]){
						for(var project of data){
							project = project.replace(/,/g, ".");
							projectList2.push(project);
						}
					}else{
						projectList2.push("--");
					}
					
					if(compareArray(projectList1, projectList2)){
						await page.waitFor(500);
						console.log("Wait until the page reloaded");
					}else{
						break;
					}
				}
				//check next btn
				selectorBtnId = await checkNextButton(selectors);
			}
			employeeData.push(strProj);
		}catch(err){
			console.log("Error in retreive projects data:");
			console.log(err);
		}
	}else{
		console.log("there is no next button");
		let strProj = "";
		var data = [];		
		//there is no next button, langsung cek project
		data = await page.evaluate((selectors) => {
			let dataStr = [];
			let elements = document.querySelectorAll(selectors[6]);
			for(let element of elements){
				dataStr.push(element.innerText);
			}
			return  dataStr;
		},selectors);

		if(data[0]){
			for(var project of data){
				project = project.replace(/,/g, ".");
				strProj = strProj + project +"//";
			}
			employeeData.push(strProj);
		}else{
			employeeData.push("--");
		}
		//check if there is project name with link
		data = await page.evaluate((selectors) => {
			let dataStr = [];
			let elements = document.querySelectorAll(selectors[7]);
			for(let element of elements){
				dataStr.push(element.href);
			}
			return  dataStr;
		},selectors);

		if(data[0]){
			for(var projectLink of data){
				projectsLink.push(projectLink);
			}
		}	
	}

	//get project date
	data = await page.evaluate((selectors) => {
		let dataStr = [];
		let elements = document.querySelectorAll(selectors[16]);
		for(let element of elements){
			dataStr.push(element.innerText);
		}
		return  dataStr[elements.length-1];
	},selectors);
	if(data){
		employeeData.push(data);
	}else{
		employeeData.push("--");
	}

	console.log("first project date = "+data);
	let averageMoney = 0;
	if(projectsLink !== null){
		//go to each project links
		let nbValueProject = 0;
		let totalMoney = 0;
		for(const link of projectsLink){
			while(true){
				try{
					await page.goto(link, { timeout: 0, waitUntil : 'domcontentloaded'});
					break; 
				}catch(err){
					await resetPage(true);
				}
			}
			console.log("go to : "+link);
			data = await page.evaluate((selectors) => {
				let money = [];
				var dollar = document.querySelector(selectors[12]);
				var euro = document.querySelector(selectors[13]);
				if(dollar){
					dollar = dollar.innerText;
					if(dollar.length != 0){
						money.push(parseInt(dollar));
					}else{
						money.push(0);
					}
				}else{
					money.push(0);
				}

				if(euro){
					euro = euro.innerText;
					if(euro.length != 0){
						money.push(parseInt(euro));
					}else{
						money.push(0);
					}
				}else{
					money.push(0);
				}
				return money;
			},selectors);

			if(data[0] === null){
				data[0] = 0;
			}

			if(data[1] === null){
				data[1] = 0;
			}

			console.log("money earned = "+data);
			let moneyOfThisProject = 0;
			if(data[0] === 0 || data[1] === 0){
				if(data[0] === 0){
					moneyOfThisProject = data[1];
				}else{
					moneyOfThisProject = data[0];
				}
			}else{
				moneyOfThisProject = data[0];
			}
			if(moneyOfThisProject !== 0){
				nbValueProject++;
				totalMoney = totalMoney + moneyOfThisProject;
			}
			console.log("Accumulated money = "+totalMoney);
		}
		if(nbValueProject===0){
			averageMoney = 0;
		}else{
			averageMoney = totalMoney/nbValueProject;
		}
		console.log("averageMoney money = "+averageMoney);
	}else{
		//go to 'my offer' tab
		await page.click(selectors[9],{delay:250});
		 //wait until emerged
		while(true){
			await page.waitFor(500);
			data = await page.evaluate((selectors)=>{
				return document.querySelector(selectors[10]);
			});
			if(data){
				break;
			}
		}

		averageMoney = await page.evaluate((selectors) => {
			let prices = document.querySelectorAll(selectors[10]);
			let sales = document.querySelectorAll(selectors[11]);
			let pricesVal = [];
			let salesVal = [];
			let totalPricesVal = 0;
			let totalSalesVal = 0;
			let avgMoney = 0
			if(prices){
				for(let i = 0;i<prices.length;i++){
					pricesVal[i] = parseInt(prices[i].innerText);
					salesVal[i] = parseInt(sales[i].innerText);
					totalPricesVal = totalPricesVal +  (pricesVal[i]*salesVal[i]);
					totalSalesVal = totalSalesVal + salesVal[i];
				}
				avgMoney = totalPricesVal/totalSalesVal;
			}else{
				avgMoney = 0;
			}
			return avgMoney;
		},selectors);
	}
	console.log("projects completed = "+projectsCompleted);
	let totalMoneyEarned = averageMoney * projectsCompleted;
	console.log("totalMoneyEarned = "+totalMoneyEarned);
	employeeData.push(""+totalMoneyEarned);
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
