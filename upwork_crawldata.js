const puppeteer = require('puppeteer');
const userAgent = require('random-useragent');
const fs = require("fs");

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
var startLink = process.argv[2] - 1;

var browser;
var page;
var agent;
let proxyId = 0;
var links; 

const EMAIL = "fardanylabib@gmail.com";
const PASSWORD = "Suudiyah001";

const scrape = async (startLink) => {

 	console.log("URL ID = "+startLink);
	/*INITIALIZATION START
	*/
	//output path setup
 	const linksDir 	= ".\\Result\\upwork_links\\";	
	let fileExist = -1;
	let index = 0;
	let fileName = "";
	while(fileExist != 0){
		if(index === 0){
			fileName = linksDir+"RawDataWorker.csv";
		}else{
			fileName = linksDir+"RawDataWorker("+ index +").csv";
		}
		if(fs.existsSync(fileName)){
			index++;
		}else{
			fileExist = 0;
		}
	}
	console.log("File Name = "+fileName);
  	const outStream = fs.createWriteStream(fileName);

  	//output path setup
  	const databaseFile 	= linksDir + "database.txt";
  	links = fs.readFileSync(databaseFile);
  	links = links.toString();
  	links = links.split("\n");

  	/*INITIALIZATION DONE
	*/

  	await resetPage(false,false,false);
  	let failCounter = 0;
  	for (let j = startLink;j<links.length;j++) {
  		console.log("======================= START ============================");
  		if(links[j].length<5 ){
  			continue;
  		}else if(links[j].includes("companies")){
  			continue;
  		}
  		var employeeData=[];
  		employeeData = await crawlEmployeeData(j);
  		if(employeeData[0] !== "--"){
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

  			try{
	  			let remark1 = await page.evaluate(()=>{
	  				let info = document.querySelector('#layout > .container > .alert > div > .ng-scope:nth-child(1)');
					if(info){
						//need login to see
						return "need login";
					}else{
						return null;
					}
				});

	  	// 		let remark2 = await page.evaluate(()=>{
	  	// 			let info = document.querySelector('.col-xs-12.p-xlg-left-right');
				// 	if(info){
				// 		//need login to see
				// 		return info.innerText;
				// 	}else{
				// 		return null;
				// 	}
				// });
	  			
				if(remark1){
					failCounter = 0;
					console.log("this user was set to private");
					outStream.write(j+","+"private user\n");
				// }
				// else if(remark2.includes("private")){
				// 	failCounter = 0;
				// 	console.log("this user was set to private");
				// 	outStream.write(j+","+"private user\n");
				}else{
					console.log("unexpected error");
	  				await resetPage(true,true,false);
	  				if(failCounter<3){
	  					j--;
	  				}else if (failCounter >= 3){
	  					failCounter = 0;
	  				}
	  				failCounter++;
				}
			}catch(error){
				console.log(error);
			}
  		}
  		console.log("====================== END =============================");
  	}

 	outStream.end();
 	browser.close(); 
  	// Return a value
  	return result;
  };

  scrape(startLink);

  async function crawlEmployeeData(urlID){
  	console.log('going to next page...');

  	let repeat = true;
  	while(repeat){
  		try{
  			console.log("go to URL_ID "+ urlID);
  			await page.goto(links[urlID],{ timeout: 0 , waitUntil : 'domcontentloaded'});
  			// await page.waitFor(500);
  			let pageHeader = await page.evaluate(()=>{
				return document.title; 
			});
			pageHeader = pageHeader.toLowerCase();
			if(pageHeader.includes("denied")|| pageHeader.includes("attention")){
  				console.log("access denied : "+pageHeader);
  				await resetPage(true,true,false);
  			}else{
  				console.log("berhasil masuk page");
  				repeat = false;
  			}
  		}catch(err){
  			await page.waitFor(2000);
  			let pageHeader = await page.evaluate(()=>{
				return document.title; 
			});
  			pageHeader = pageHeader.toLowerCase();
  			if(pageHeader.includes("denied")|| pageHeader.includes("attention")){
  				console.log("access denied : "+pageHeader);
  				await resetPage(true,true,false);
  			}else{
  				console.log("masuk page gagal");
  				await resetPage(true,true,false);
  			}
  			
  		}
  	}
  	
  	console.log('getting employee data...');
  	let result = [];
  	result = await page.evaluate(() => {
  		let name = document.querySelector('.col-xs-12 > .media > .media-body > .m-xs-bottom > .ng-binding');
  		let city = document.querySelector('ng-transclude > .ng-scope > .w-700 > .ng-binding > .text-capitalize');	  	  	
  		let specialization = document.querySelector('.overlay-container > .up-active-container > .m-sm-bottom > .fe-job-title > .ng-binding');
  	  	let availability = document.querySelector('.custom-display-block > .p-0-top-bottom > .up-active-context > .ng-scope > .m-0-top-bottom > .ng-binding:nth-child(1)');
  	  	let money = document.querySelector('.m-lg-top > .list-inline > .ng-scope > .m-xs-bottom > .ng-binding');
  	  	let skills = document.querySelectorAll('section > div > .ng-isolate-scope > .m-sm-top > .ng-binding');

  	  	let data = [];

  	  	if(name){
  	  		data.push(name.textContent.replace(/\n/g, ''));
  	  	}else{
  	  		data.push('--');
  	  	}
  	  	
  	  	if(city){
  	  		data.push(city.textContent);
  	  	}else{
  	  		data.push('--');
  	  	}		    	
  	  	
  	  	if(specialization){
  	  		data.push(specialization.textContent);
  	  	}else{
  	  		data.push('--');
  	  	}	

  	  	if(availability){
  	  		data.push(availability.textContent);
  	  	}else{
  	  		data.push('--');
  	  	}	

		if(money){
  	  		data.push(money.textContent);
  	  	}else{
  	  		data.push('--');
  	  	}	

  	  	if(skills[0]){
  	  		let strSkill="";
  	  		for(var skill of skills){
  	  			skill = skill.textContent;
  	  			strSkill = strSkill+skill+"//";
  	  		}
  	  		data.push(strSkill);
  	  	}else{
  	  		data.push('--');
  	  	}	
  	  	return data;
  	});
  	
  	let currentNbJob = await page.evaluate(() => {
  		let nbJob = document.querySelectorAll('.ng-scope > .ng-scope > .row > .col-sm-12 > .row > .col-sm-6 > .m-0-top > .ng-binding');
  		if(nbJob[0]){
  			return nbJob.length;
  		}else{
  			return 0;
  		}
  	});
  	console.log("number of jobs = "+currentNbJob);
  	if(currentNbJob > 0){
  		//view jobs more
  	  	const viewMoreSelector = '.m-sm-bottom > .ng-scope > .list-unstyled > .ng-scope > a';
  	  	let viewMore = true;
  	  	let nbJobAfterClick = currentNbJob;
  	  	do{
  	  		viewMore = await page.evaluate(() => {
  	  			let moreJob = document.querySelector('.m-sm-bottom > .ng-scope > .list-unstyled > .ng-scope > a');
  	  			if(moreJob){
  	  				return true;
  	  			}else{
  	  				return false;
  	  			}
  			});
  			if(viewMore){
  				page.waitForSelector('.m-sm-bottom > .ng-scope > .list-unstyled > .ng-scope > a');
				page.click('.m-sm-bottom > .ng-scope > .list-unstyled > .ng-scope > a',{delay:250});
				let waitCounter =0;
				while(true){
					await page.waitFor(800);
					nbJobAfterClick = await page.evaluate(() => {
						let nbJob = document.querySelectorAll('.ng-scope > .ng-scope > .row > .col-sm-12 > .row > .col-sm-6 > .m-0-top > .ng-binding');
						if(nbJob[0]){
							return nbJob.length;
						}else{
							return 0;
						}
					});
					if(waitCounter>100){
						break;
					}
					if(nbJobAfterClick > currentNbJob){
						break;
					}else{
						waitCounter++;
						console.log("waiting more jobs to show");
					}
				} 
  			}else{
  				viewMore = false;
  			}
 	  		currentNbJob = nbJobAfterClick;
  	  	}while(viewMore);

  	  	let jobsDone = await page.evaluate((currentNbJob) => {
  	  		let data = [];
  	  		let jobsStr = "";
  	  		let jobs = document.querySelectorAll('.ng-scope > .ng-scope > .row > .col-sm-12 > .row > .col-sm-6 > .m-0-top > .ng-binding');
  	  		for(var job of jobs){
  	  			jobsStr = jobsStr + job.innerText + "//";
  	  		}
  	  		data.push(jobsStr);
  	  		//last job
  	  		let date = document.querySelector('.ng-scope:nth-child(1) > .ng-scope > .row > .col-sm-12 > .row > .col-sm-6 > .list-inline > .m-xs-bottom > .text-muted');
  	  		if(date){
  	  			data.push(date.innerText);
  	  		}else{
  	  			data.push("--");
  	  		}
  	  		//first job
  	  		date = document.querySelector('.ng-scope:nth-child('+ currentNbJob +') > .ng-scope > .row > .col-sm-12 > .row > .col-sm-6 > .list-inline > .m-xs-bottom > .text-muted');
  	  		if(date){
  	  			data.push(date.innerText);
  	  		}else{
  	  			data.push("--");
  	  		}
  	  		return data;
  	  	},currentNbJob);
  	  	result.push(jobsDone[0]);  //jobs done string
  	  	result.push(jobsDone[1]);  //last job date
  	  	result.push(jobsDone[2]);  //first job date
  	}else{
  		result.push("--");
  		result.push("--");
  		result.push("--");
  	}

  	//jobs in progress status
  	let jobInProgress = await page.evaluate(() => {
  		let inProgress = document.querySelector('.assigment-list-content > .m-sm-bottom > .ng-scope > .ng-scope > .vertical-align-middle');
  		if(inProgress){
  			return inProgress.innerText;
  		}else{
  			return "--";
  		}
  	});

  	result.push(jobInProgress);
  	return result;
}

async function resetPage(resetBrowser, rotateProxy,needLogin){
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
	// if(needLogin){
	// 	let repeat = true;
	//   	while(repeat){
	//   		try{
	//   			await page.goto("https://www.upwork.com/ab/account-security/login",{ timeout: 0 , waitUntil : 'domcontentloaded'});
	//   			let pageHeader = await page.evaluate(()=>{
	// 				return document.title; 
	// 			});
	// 			pageHeader = pageHeader.toLowerCase();
	// 			if(pageHeader.includes("denied")|| pageHeader.includes("attention")){
	//   				console.log("access denied : "+pageHeader);
	//   				await resetPage(true,true,false);
	//   			}else{
	//   				console.log("enter login page");
	//   				//TODO: MASUKKAN EMAIL PASSW
	//   				let selector = '.ng-animate-disabled > .text-center > .col-md-10 > .has-feedback > #login_username';
	//   				let wait =true;
	//   				while(wait){
	//   					const needWait = await page.evaluate((selector)=>{
	// 						let selectorAva = document.querySelector(selector);
	// 						if(selectorAva){
	// 							return false;
	// 						}else{
	// 							return true;
	// 						}
	// 					},selector);
	// 					console.log("wait until login page displayed")
	// 					await page.waitFor(500);
	// 					wait = needWait;
	//   				}
	// 				await page.type(selector, EMAIL);
	// 				selector = '.form > .ng-animate-disabled > .text-center > .col-md-10 > .btn-block-sm';
	//   				await page.click(selector,{delay:250});

	//   				await page.waitFor(5000);
	//   				selector = '#main-auth-card > .form > .text-center > .col-md-10 > .btn-block-sm'; //selector of password OK
	//   				await page.waitForSelector(selector);
	//   				await page.type('.form > .text-center > .col-md-10 > .form-group > #login_password', PASSWORD);
	//   				await page.click(selector,{delay:250});

	//   				selector='.col-xs-12 > .media > .media-body > .m-xs-bottom > .ng-binding';// A. Labib user name
	//   				wait =true;
	//   				let waitCounter = 0;
	//   				while(wait){
	//   					const needWait = await page.evaluate((selector)=>{
	// 						let selectorAva = document.querySelector(selector);
	// 						if(selectorAva){
	// 							return false;
	// 						}else{
	// 							return true;
	// 						}
	// 					},selector);
	// 					console.log("wait until A.Labib Fardany page displayed, counter = "+waitCounter);
	// 					await page.waitFor(500);
	// 					wait = needWait;
	// 					if(waitCounter>80){
	// 						console.log("request mother name...");
	// 						const motherNameBtnSelector = ".btn-block-sm.width-sm.btn.btn-primary.m-0.text-capitalize";
	// 						const motherNameBtn = await page.evaluate((motherNameBtnSelector)=>{
	// 							let mother = document.querySelector(motherNameBtnSelector);
	// 							if(mother){
	// 								return true;
	// 							}else{
	// 								return false;
	// 							}
	// 						},motherNameBtnSelector);
	// 						if(motherNameBtn){
	// 							console.log("mother name form avalilable");
	// 							await page.waitForSelector(motherNameBtnSelector);
	// 							await page.type(".form-control.ng-pristine.ng-empty.ng-invalid.ng-invalid-required.ng-valid-inline-validator.ng-touched", "farhanah");
	// 							await page.click(motherNameBtnSelector,{delay:250});
	// 							waitCounter = 0;
	// 						}else{
	// 							break;
	// 						}
	// 					}else if(waitCounter>100){
	// 						break;
	// 					}
	// 					waitCounter++;
	//   				}
	//   				if(waitCounter>80){
	//   					repeat = true;
	//   					await resetPage(true,true,false);
	//   				}else{
	//   					repeat = false;
	//   				}
	  				
	//   			}
	//   		}catch(err){
	//   			console.log("Error Detail : "+err)
	//   			await page.waitFor(1000);
	//   			let pageHeader = await page.evaluate(()=>{
	// 				return document.title; 
	// 			});
	//   			pageHeader = pageHeader.toLowerCase();
	//   			if(pageHeader.includes("denied")|| pageHeader.includes("attention")){
	//   				console.log("access denied : "+pageHeader);
	//   				await resetPage(true,true,false);
	//   			}else if(pageHeader.includes("a. labib")){
	//   				repeat = false;
	//   			}else{
	//   				console.log("masuk page gagal");
	//   				await resetPage(true,true,false);
	//   			}
	//   		}
	//   	}
	// }
}