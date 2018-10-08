	const puppeteer = require('puppeteer');
	const userAgent = require('random-useragent');
	const fs = require("fs");

	const selectedUrlId = 3; //CHANGE THIS TO THE INDEXES BELOW
	const folderNameOffset = 43;

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


	const scrape = async () => {
		const filter = (ua) => ua !== 'mobile'
	 	// Actual Scraping goes Here...
	  	var browser = await puppeteer.launch({ headless: false, executablePath : 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe' });
	  	var page = await browser.newPage();
	  	var agent = userAgent.getRandom(filter);
	  	console.log(agent);
	  	page.setExtraHTTPHeaders({ 'user-agent': agent});
		
		const folderName 	= URLs[selectedUrlId].substring(folderNameOffset,folderNameOffset+4);
		const linksPath 	= ".\\upwork_links\\"+folderName;
		const dataPath 		= linksPath+"\\data";
		
		

	  	const files = fs.readdirSync(linksPath);

	  	fs.mkdir(dataPath,function(e){
	    	if(!e || (e && e.code === 'EEXIST')){
	        	console.log("directory upwork_links created");
	    	} else {
	        	//debug
	        	console.log(e);
	    	}
		});
	  	const outStream = fs.createWriteStream(dataPath+"\\data.txt");
	  	for(const file of files){
	  		if(file == "data"){
		  		continue;
		  	}
		  	var links = fs.readFileSync(linksPath+"\\"+file);
		  	links = links.toString();
		  	links = links.split("\n");
			console.log(links);
		  	for (let j = 0;j<links.length;j++) {
		  		if(links[j].length<5 ){
		  			continue;
		  		}else if(links[j].includes("companies")){
					continue;
		  		}
		  		var employeeData=[];
		  		employeeData = await crawlEmployeeData(page,links[j]);
		  	  	if(employeeData[0]!=="--"){
		  	  		console.log("writing links into file...");
		  	  		for(const data of employeeData){
						outStream.write(data + ';');
					}
					outStream.write("\n");
		  	  	}else{
				  	console.log("reset browser...");
		  			browser.close();
					browser = await puppeteer.launch({ headless: false, executablePath : "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe" });
					page = await browser.newPage();
					agent = userAgent.getRandom(filter);
					console.log(agent);
					page.setExtraHTTPHeaders({ "user-agent": agent});
		  			j--;
		  	  	}
		  	}
		}
		outStream.end();
		browser.close(); 
	  	// Return a value
	  	return result;
	};

	scrape().then(async (links) => {});

	async function crawlEmployeeData(page, url){
		console.log('going to next page...');
		await page.goto(url,{ timeout: 0 , waitUntil : 'domcontentloaded'});
		console.log('getting employee data...');
		const res = await page.evaluate(() => {
	  	  	let name = document.querySelector('.col-xs-12.col-sm-8.col-md-9.col-lg-10 .media-body .m-xs-bottom span span');
	 		let elements = document.querySelectorAll('.list-inline.m-0-bottom .m-xs-bottom');	  	  	
	  	  	let jobSuccess = document.querySelector('.visible-xxs.m-xs-top.p-lg-right .ng-isolate-scope .hidden-xxs .ng-scope h3');
	  	  	// let jobCategory = document.querySelector('.up-active-context.up-active-context-title.fe-job-title span');
	  	  	let data = [];

	  	  	if(name){
	  	  		data.push(name.textContent.replace(/\n/g, ''));
	  	  	}else{
	  	  		data.push('--');
	  	  	}

	  	  	// if(jobCategory){
	  	  	// 	data.push(jobCategory.textContent.replace(/\n/g, ''));
	  	  	// }else{
	  	  	// 	data.push('--');
	  	  	// }
	  	  	
	  	  	for(var element of elements){
	  	  		if(element){
	  				data.push(element.textContent.replace(/\s/g, ''));
	  			}else{
	  				data.push('--');
	  			}
	    	}
	    	const len = elements.length;
	    	if( len < 4){
	    		for(var i = len;i<4;i++){
	    			data.push("--");
	    		}
	    	} 
	    	
	    	if(jobSuccess){
	    		data.push(jobSuccess.textContent);
	    	}else{
	    		data.push("not rated");
	    	}		    	
			
			return data;
	  	});
	  	console.log(res)
	  	return res;
	}