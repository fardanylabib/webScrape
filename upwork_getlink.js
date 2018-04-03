const puppeteer = require("puppeteer");
const userAgent = require("random-useragent");
const fs = require("fs");

const selectedUrlId = 5; //CHANGE THIS TO THE INDEXES BELOW
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
	const filter = (ua) => ua !== "mobile"
	var browser = await puppeteer.launch({ headless: false, executablePath : "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe" });
	var page = await browser.newPage();
	var agent = userAgent.getRandom(filter);
	console.log(agent);
	page.setExtraHTTPHeaders({ "user-agent": agent});
	const folderName = URLs[selectedUrlId].substring(folderNameOffset,folderNameOffset+3);
	//make file directory
	fs.mkdir(".\\upwork_links\\"+folderName,function(e){
	    if(!e || (e && e.code === 'EEXIST')){
	        console.log("directory upwork_links created");
	    } else {
	        //debug
	        console.log(e);
	    }
	});

  	// Actual Scraping goes Here...
  	let globalData = [];
  	for(let i = 1 ; i<=500 ; i++){
  		var links= [];
  		links = await getAllEmployeeLinks(page, URLs[selectedUrlId]+i);
  		console.log("getting links process was done");
  		console.log(links);
  		if(links[0]){
  			var stream = fs.createWriteStream(".\\upwork_links\\"+folderName+"\\page"+i+".txt");
  			console.log("writing links into file...");
			for(const link of links){
				stream.write(link + '\n');
			}
			stream.end();
			console.log("page "+i+" was recorded!");
  		}else{
  			console.log("reset browser...");
  			browser.close();
			browser = await puppeteer.launch({ headless: false, executablePath : "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe" });
			page = await browser.newPage();
			agent = userAgent.getRandom(filter);
			console.log(agent);
			page.setExtraHTTPHeaders({ "user-agent": agent});
  			i--;
  		}
		  // await page.goto('https://www.upwork.com/o/profiles/browse/c/web-mobile-software-dev/?loc=indonesia&page='+i, { timeout: 0 , waitUntil : 'domcontentloaded'});
		  // console.log('sini1');
		  // const result = await page.evaluate(()=>{
		  // 	let data1 = [];
		  //   let elements = document.querySelectorAll('a.freelancer-tile-name')
		  //   console.log('sini2');
		  // 	for(var element of elements){
		  // 		data1.push(element.href);
		  //   }    
		    
		  // 	return data1;
		  // });
		  // console.log(result);

		
		


	  // 	for (const link of result) {
	  // 	  	await page.goto(link,{ timeout: 0 , waitUntil : 'domcontentloaded'});
	  // 	  	const res = await page.evaluate(() => {
		 //  	  	let name = document.querySelector('.col-xs-12.col-sm-8.col-md-9.col-lg-10 .media-body .m-xs-bottom span span');
		 //  	  	let elements = document.querySelectorAll('.list-inline.m-0-bottom .m-xs-bottom');
		 //  	  	let jobSuccess = document.querySelector('.visible-xxs.m-xs-top.p-lg-right .ng-isolate-scope .hidden-xxs .ng-scope h3');
		 //  	  	let jobCategory = document.querySelector('.up-active-context.up-active-context-title.fe-job-title span');
		 //  	  	let data = [];

		 //  	  	if(name){
		 //  	  		data.push(name.textContent.replace(/\n/g, ''));
		 //  	  	}else{
		 //  	  		data.push('--');
		 //  	  	}

		 //  	  	if(jobCategory){
		 //  	  		data.push(jobCategory.textContent.replace(/\n/g, ''));
		 //  	  	}else{
		 //  	  		data.push('--');
		 //  	  	}
		  	  	
		 //  	  	for(var element of elements){
		 //  	  		if(element){
		 //  				data.push(element.textContent.replace(/\s/g, ''));
		 //  			}else{
		 //  				data.push('--');
		 //  			}
		 //    	} 
		    	
		 //    	if(jobSuccess){
		 //    		data.push(jobSuccess.textContent);
		 //    	}else{
		 //    		data.push('0%');
		 //    	}		    	
				
			// 	return data;
	  // 	  	})
			// globalData.push(res);
	  // 	  	console.log(res)
	  // 	}
	}
	browser.close(); 
  // Return a value
   // return result;
};

scrape().then(async (links) => {
	console.log('finished');
  // const browser = await puppeteer.launch({ headless: false });
  // const page = await browser.newPage();
  // page.setExtraHTTPHeaders({ 'user-agent': userAgent.getRandom()});

  // await page.goto(links[0], { timeout: 0 });
});


async function getAllEmployeeLinks(page, url){
	console.log('going to next page...');
	await page.goto(url, { timeout: 0 , waitUntil : 'domcontentloaded'});
	console.log('getting links from page...');
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