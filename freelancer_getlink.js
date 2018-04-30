const puppeteer = require("puppeteer");
const userAgent = require("random-useragent");
const fs = require("fs");

const urlId = 0; //0, 2, 4, 6, 8 ,10, 12, 14, 16
// const folderNameOffset = 27;

var URLs =[];



const scrape = async (selectedUrlId) => {
	//WEBSITES, IT & SOFTWARE
	URLs.push("websites it & software"); // 0
	var subURLs = ["https://www.freelancer.com/freelancers/Indonesia/php-website_design-graphic_design-html",
				"https://www.freelancer.com/freelancers/Indonesia/website_design-shopping_carts-ecommerce-html",
				"https://www.freelancer.com/freelancers/Indonesia/internet_marketing-seo-link_building",
				"https://www.freelancer.com/freelancers/Indonesia/php-software_architecture",
				"https://www.freelancer.com/freelancers/Indonesia/website_design-psd_to_html-html",
				"https://www.freelancer.com/freelancers/Indonesia/php-wordpress-css-html",
				"https://www.freelancer.com/freelancers/Indonesia/php-joomla-css-html",
				"https://www.freelancer.com/freelancers/Indonesia/php-css-drupal-html",
				"https://www.freelancer.com/freelancers/Indonesia/cocoa-macos-objective_c"];					//6
	URLs.push(subURLs);
	
	//MOBILE
	URLs.push("mobile"); // 2
	subURLs = ["https://www.freelancer.com/freelancers/Indonesia/mobile_phone-iphone",
				"https://www.freelancer.com/freelancers/Indonesia/ipad",
				"https://www.freelancer.com/freelancers/Indonesia/mobile_phone-blackberry",
				"https://www.freelancer.com/freelancers/Indonesia/mobile_phone-android",
				"https://www.freelancer.com/freelancers/Indonesia/mobile_phone-html_five-jquery_prototype"];					//6
	URLs.push(subURLs);

	//writing
	URLs.push("writing");// 4
	subURLs = ["https://www.freelancer.com/freelancers/Indonesia/articles",
				"https://www.freelancer.com/freelancers/Indonesia/ghostwriting-ebooks",
				"https://www.freelancer.com/freelancers/Indonesia/report_writing",
				"https://www.freelancer.com/freelancers/Indonesia/research_writing",
				"https://www.freelancer.com/freelancers/Indonesia/technical_writing",
				"https://www.freelancer.com/freelancers/Indonesia/blog",
				"https://www.freelancer.com/freelancers/Indonesia/translation",
				"https://www.freelancer.com/freelancers/Indonesia/editing",
				"https://www.freelancer.com/freelancers/Indonesia/proofreading",
				"https://www.freelancer.com/freelancers/Indonesia/research-ghostwriting-ebooks-book_writing",
				"https://www.freelancer.com/freelancers/Indonesia/ghostwriting-articles-article_rewriting",
				"https://www.freelancer.com/freelancers/Indonesia/articles-article_submission",
				"https://www.freelancer.com/freelancers/Indonesia/copywriting-product_descriptions-ebay",
				"https://www.freelancer.com/freelancers/Indonesia/slogans-creative_writing-catch_phrases",
				"https://www.freelancer.com/freelancers/Indonesia/copywriting-ghostwriting-articles-content_writing"];					//6
	URLs.push(subURLs);

	//design
	URLs.push("design"); // 6
	subURLs = ["https://www.freelancer.com/freelancers/Indonesia/website_design-graphic_design-user_interface_ia",
				"https://www.freelancer.com/freelancers/Indonesia/graphic_design-banner_design",
				"https://www.freelancer.com/freelancers/Indonesia/graphic_design-logo_design",
				"https://www.freelancer.com/freelancers/Indonesia/flash",
				"https://www.freelancer.com/freelancers/Indonesia/photoshop",
				"https://www.freelancer.com/freelancers/Indonesia/graphic_design-icon_design",
				"https://www.freelancer.com/freelancers/Indonesia/graphic_design-business_cards",
				"https://www.freelancer.com/freelancers/Indonesia/graphic_design-stationery_design",
				"https://www.freelancer.com/freelancers/Indonesia/logo_design-corporate_identity",
				"https://www.freelancer.com/freelancers/Indonesia/illustration",
				"https://www.freelancer.com/freelancers/Indonesia/video_services",
				"https://www.freelancer.com/freelancers/Indonesia/advertisement_design",
				"https://www.freelancer.com/freelancers/Indonesia/graphic_design-photoshop-photoshop_design-tshirts",
				"https://www.freelancer.com/freelancers/Indonesia/graphic_design-corporate_identity-covers_packaging-brochure_design",
				"https://www.freelancer.com/freelancers/Indonesia/rendering-threed_modelling-threed_animation",
				"https://www.freelancer.com/freelancers/Indonesia/animation-threed_animation",
				"https://www.freelancer.com/freelancers/Indonesia/graphic_design-social_networking-facebook_marketing",
				"https://www.freelancer.com/freelancers/Indonesia/graphic_design-social_networking-twitter",
				"https://www.freelancer.com/freelancers/Indonesia/graphic_design",
				"https://www.freelancer.com/freelancers/Indonesia/graphic_design-flyer_design",
				"https://www.freelancer.com/freelancers/Indonesia/graphic_design-brochure_design",
				"https://www.freelancer.com/freelancers/Indonesia/graphic_design-user_interface_ia",
				"https://www.freelancer.com/freelancers/Indonesia/graphic_design-wordpress-user_interface_ia",
				"https://www.freelancer.com/freelancers/Indonesia/graphic_design-fashion_design-fashion_modeling",
				"https://www.freelancer.com/freelancers/Indonesia/graphic_design-tattoo_design",
				"https://www.freelancer.com/freelancers/Indonesia/graphic_design-powerpoint-presentations",
				"https://www.freelancer.com/freelancers/Indonesia/building_architecture-threed_design"];					//6
	URLs.push(subURLs);

	//data entry
	URLs.push("data entry");// 8
	subURLs = ["https://www.freelancer.com/freelancers/Indonesia/article_submission",
				"https://www.freelancer.com/freelancers/Indonesia/data_processing",
				"https://www.freelancer.com/freelancers/Indonesia/data_entry-excel",
				"https://www.freelancer.com/freelancers/Indonesia/advertising",
				"https://www.freelancer.com/freelancers/Indonesia/virtual_assistant",
				"https://www.freelancer.com/freelancers/Indonesia/web_search",
				"https://www.freelancer.com/freelancers/Indonesia/data_entry-excel-web_scraping-web_search",
				"https://www.freelancer.com/freelancers/Indonesia/data_processing-data_entry-excel",
				"https://www.freelancer.com/freelancers/Indonesia/customer_support-virtual_assistant"];					//6
	URLs.push(subURLs);

	//PRODUCT SOURCING & MANUFACTURING
	URLs.push("product sourcing & manufacturing");//10
	subURLs = ["https://www.freelancer.com/freelancers/Indonesia/product_design",
				"https://www.freelancer.com/freelancers/Indonesia/manufacturing",
				"https://www.freelancer.com/freelancers/Indonesia/buyer_sourcing",
				"https://www.freelancer.com/freelancers/Indonesia/supplier_sourcing"];					//6
	URLs.push(subURLs);

	//SALES & MARKETING
	URLs.push("sales & marketing");//12
	subURLs = ["https://www.freelancer.com/freelancers/Indonesia/bulk_marketing",
				"https://www.freelancer.com/freelancers/Indonesia/telemarketing",
				"https://www.freelancer.com/freelancers/Indonesia/internet_marketing",
				"https://www.freelancer.com/freelancers/Indonesia/leads",
				"https://www.freelancer.com/freelancers/Indonesia/sales",
				"https://www.freelancer.com/freelancers/Indonesia/marketing",
				"https://www.freelancer.com/freelancers/Indonesia/internet_marketing-seo-link_building",
				"https://www.freelancer.com/freelancers/Indonesia/internet_marketing-seo-link_building-marketing",
				"https://www.freelancer.com/freelancers/Indonesia/internet_marketing-google_adwords",
				"https://www.freelancer.com/freelancers/Indonesia/social_networking-twitter",
				"https://www.freelancer.com/freelancers/Indonesia/twitter-facebook_marketing-google_plus-pinterest-social_media_marketing",
				"https://www.freelancer.com/freelancers/Indonesia/internet_marketing-seo-google_adwords-search_engine_marketing"];					//6
	URLs.push(subURLs);

	//BUSSINESS ACCOUNTING & LEGAL
	URLs.push("bussiness accounting & legal");//14
	subURLs = ["https://www.freelancer.com/freelancers/Indonesia/business_plans",
				"https://www.freelancer.com/freelancers/Indonesia/accounting",
				"https://www.freelancer.com/freelancers/Indonesia/project_management",
				"https://www.freelancer.com/freelancers/Indonesia/crm-salesforce_com",
				"https://www.freelancer.com/freelancers/Indonesia/accounting-finance-intuit_quickbooks-payroll"];					//6
	URLs.push(subURLs);

	//LOCAL JOBS & SERVICES
	URLs.push("local jobs & services");//16
	subURLs = ["https://www.freelancer.com/freelancers/Indonesia/delivery-pickup",
				"https://www.freelancer.com/freelancers/Indonesia/cleaning_domestic",
				"https://www.freelancer.com/freelancers/Indonesia/photography-videography",
				"https://www.freelancer.com/freelancers/Indonesia/general_labor",
				"https://www.freelancer.com/freelancers/Indonesia/videography-video_editing"];					//6
	URLs.push(subURLs);

	var browser = await puppeteer.launch({ headless: false, executablePath : "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe" });
	var page = await browser.newPage();
	var agent = userAgent.getRandom(function (ua) {
		return ua.osName === 'Linux';
	});
	console.log(agent);
	page.setExtraHTTPHeaders({ "user-agent": agent});
	const folderName = URLs[selectedUrlId];
	//make file directory

	const linksPath = ".\\freelancer_links\\"+folderName;

	fs.mkdir(".\\freelancer_links",function(e){
	    if(!e || (e && e.code === 'EEXIST')){
	        console.log("directory freelancer_links created");
			fs.mkdir(linksPath,function(e){
			    if(!e || (e && e.code === 'EEXIST')){
			        console.log("directory "+folderName+" created");
			    } else {
			        //debug
			        console.log(e);
			    }
			});
	    } else {
	        //debug
	        console.log(e);
	    }
	});



  	// Actual Scraping goes Here...
  	let globalData = [];
  	
  	var subURL = URLs[selectedUrlId+1];
  	console.log("sub url = ");
  	console.log(subURL);
  	let j = 0;
  	for(var url of subURL){
  		console.log('going to next page...');
		await page.goto(url+"/", { timeout: 0 });
		var lastLinks = [];
		var failCounter=0;
		j++;
  		for(let i = 1 ; i<=100000; i++){
	  		var links= [];
	  		links = await getAllEmployeeLinks(page, lastLinks);
	  		console.log("getting links process was done");
	  		
	  		if(links !== null && links[0]){
	  			const filename = linksPath+"\\page"+j+"."+i+".txt";
	  			console.log("file name = "+filename);
	 			var stream = fs.createWriteStream(filename);
	  			console.log("writing links into file...");
	  			lastLinks =[];
				for(const link of links){
					stream.write(link + '\n');
					lastLinks.push(link);
				}
				stream.end();
				console.log("page "+i+" was recorded!");
	  		}else{
	  			if(failCounter > 10){
	  				break;
	  			}
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
	  			i--;
	  		}
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

async function runAll(){
	for(let i = 6;i<=16;i=i+2){
		await scrape(i).then(async (links) => {
			console.log('finished');
		});
	}

}



async function getAllEmployeeLinks(page, lastLinks){

	const onlineOnly = await page.evaluate(() => {
    	const tombol = document.querySelector(".Tags-item-control.btn.btn-mini.selected_rate");
    	return tombol;
	});

	console.log("clicking");
	var linkHref = [];
  	if(onlineOnly){
  		await page.click(".Tags-item-control.btn.btn-mini.selected_rate");
  		await page.waitFor(1500);
  		console.log("online only clicked");
  	}else{
  		console.log("with online only not clicked");
  	}

  	var linkHref = [];
	linkHref = await page.evaluate(() => {
		var links = [];
    	var element = document.querySelectorAll(".ns_freelancer-list .ns_result .freelancer-details .freelancer-details-header h3 a");
		for(let i = 0;i<element.length;i++){
			links.push(element[i].href);
		}
    	return links;
	});
	const next = await page.evaluate(() => {
    	const tombol = document.querySelector(".Pagination .Pagination-item .flicon-pagination-next");
    	return tombol;
	});
	if(next){
		await page.click(".Pagination .Pagination-item .flicon-pagination-next");
		await page.waitForNavigation({ "waitUntil": "networkidle2" });
		
	}else{
		return null;
	}

	if(compareArray(linkHref,lastLinks)){
		console.log(linkHref);
		console.log(lastLinks);
		return null;
	}else{
		console.log(linkHref);
		console.log(lastLinks);
		return linkHref;
	}
	


  	

	
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

runAll();