	const puppeteer = require('puppeteer');
	const userAgent = require('random-useragent');
	

	const scrape = async () => {
		const filter = (ua) => ua !== 'mobile'
	  // Actual Scraping goes Here...
	  const browser = await puppeteer.launch({ headless: false, executablePath : 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe' });
	  const page = await browser.newPage();
	  const agent = userAgent.getRandom(filter);
	  console.log(agent);
	  page.setExtraHTTPHeaders({ 'user-agent': agent});
	  let globalData = [];
	  	for(let i = 1 ; i<5 ; i++){

		  await page.goto('https://www.upwork.com/o/profiles/browse/?loc=indonesia&page='+i, { timeout: 0 , waitUntil : 'domcontentloaded'});
		  console.log('sini1');
		  const result = await page.evaluate(()=>{
		  	let data1 = [];
		    let elements = document.querySelectorAll('a.freelancer-tile-name')
		    console.log('sini2');
		  	for(var element of elements){
		  		data1.push(element.href);
		    }    
		    
		  	return data1;
		  });

		  	for (const link of result) {
		  	  	await page.goto(link,{ timeout: 0 , waitUntil : 'domcontentloaded'});
		  	  	const res = await page.evaluate(() => {
			  	  	let name = document.querySelector('.col-xs-12.col-sm-8.col-md-9.col-lg-10 .media-body .m-xs-bottom span span');
			  	  	let elements = document.querySelectorAll('.list-inline.m-0-bottom .m-xs-bottom');
			  	  	let jobSuccess = document.querySelector('.visible-xxs.m-xs-top.p-lg-right .ng-isolate-scope .hidden-xxs .ng-scope h3');
			  	  	let jobCategory = document.querySelector('.up-active-context.up-active-context-title.fe-job-title span');
			  	  	let data = [];

			  	  	if(name){
			  	  		data.push(name.textContent.replace(/\n/g, ''));
			  	  	}else{
			  	  		data.push('--');
			  	  	}

			  	  	if(jobCategory){
			  	  		data.push(jobCategory.textContent.replace(/\n/g, ''));
			  	  	}else{
			  	  		data.push('--');
			  	  	}
			  	  	
			  	  	for(var element of elements){
			  	  		if(element){
			  				data.push(element.textContent.replace(/\s/g, ''));
			  			}else{
			  				data.push('--');
			  			}
			    	} 
			    	
			    	if(jobSuccess){
			    		data.push(jobSuccess.textContent);
			    	}else{
			    		data.push('0%');
			    	}		    	
					
					return data;
		  	  	})
				globalData.push(res);
		  	  	console.log(res)
		  	}
		}
	  browser.close(); 
	  // Return a value
	   return result;
	};

	scrape().then(async (links) => {
		console.log('sini4');
	  // const browser = await puppeteer.launch({ headless: false });
	  // const page = await browser.newPage();
	  // page.setExtraHTTPHeaders({ 'user-agent': userAgent.getRandom()});

	  // await page.goto(links[0], { timeout: 0 });
	});