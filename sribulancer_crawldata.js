const puppeteer = require('puppeteer');
const userAgent = require('random-useragent');
const fs = require("fs");

const selectedUrlId = 0; //CHANGE THIS TO THE INDEXES BELOW
const folderNameOffset = 52;

const URLs = [	"https://www.sribulancer.com/id/bf/freelancer/v4/851/entri-data?page=",  					//0
				"https://www.sribulancer.com/id/bf/freelancer/v4/622/pembuatan-aplikasi-seluler?page=",	//1
				"https://www.sribulancer.com/id/bf/freelancer/v4/778/website-pengembangan?page=",			//2
				"https://www.sribulancer.com/id/bf/freelancer/v4/157/desain-multimedia?page=",			//3
				"https://www.sribulancer.com/id/bf/freelancer/v4/60/bisnis-pemasaran-online?page=",		//4
				"https://www.sribulancer.com/id/bf/freelancer/v4/705/penulisan?page=",					//5
				"https://www.sribulancer.com/id/bf/freelancer/v4/35/penerjemahan?page="];					//6


const scrape = async () => {
	const filter = (ua) => ua !== 'mobile';
 	// Actual Scraping goes Here...
  	var browser = await puppeteer.launch({ headless: false, executablePath : 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe' });
  	var page = await browser.newPage();
  	var agent = userAgent.getRandom(filter);
  	console.log(agent);
  	page.setExtraHTTPHeaders({ 'user-agent': agent});
	
	const folderName 	= URLs[selectedUrlId].substring(folderNameOffset,folderNameOffset+4);
	const linksPath 	= ".\\sribulancer_links\\"+folderName;
	const dataPath 		= linksPath+"\\data";
	
	

  	const files = fs.readdirSync(linksPath);

  	fs.mkdir(dataPath,function(e){
    	if(!e || (e && e.code === 'EEXIST')){
        	console.log("directory "+dataPath+" created");
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
	stream.end();
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

async function crawlEmployeeData(page, url){
	console.log('going to next page...');
	await page.goto(url,{ timeout: 0 , waitUntil : 'domcontentloaded'});
	console.log('getting employee data...');
  var showmore=null;;
  var i=0;
  do{
    showmore = await extractPage(page);
    console.log("showmore "+(i++));
  }while (showmore!==null);
  
  
	const res = await page.evaluate(() => {
      var employeeData = [];

      //get name of freelancer
  	  const name = document.querySelector(".user__fullname.u-text-truncate");
      if(name){
        employeeData.push(name.textContent);
      }else{
        employeeData.push("--");
      }

      //get total money earned and total job success   
      const moneys = document.querySelectorAll(".reviewSummary-v2.panel.mt-20 .panel-body.reviewSummary-panel-body .row .col-sm-3 .row .col-sm-12 .iblocks.summary__price");
      if(moneys){
        console.log("masuk 1");
        var totalMoney = 0;
        if(moneys.length > 0){
          for(var money of moneys){
            money = money.textContent;
            money = money.replace("IDR ","");
            money = money.replace(",","");
            money = parseInt(money);
            totalMoney += money;
            console.log(money);
          
          }
        } 
        console.log("masuk 2");
        employeeData.push(totalMoney);    //total money earned
        employeeData.push(moneys.length); //total job success
      // }
      // else if(moneys){
      //   console.log("masuk 2");
      //   var totalMoney = moneys.textContent;
      //   totalMoney = totalMoney.replace("IDR ","");
      //   totalMoney = totalMoney.replace(",","");
      //   totalMoney = parseInt(totalMoney);
      //   console.log(totalMoney);
      //   employeeData.push(totalMoney);    //total money earned
      //   employeeData.push(1); //total job success
      }
      else{
        console.log("masuk 3");
        employeeData.push("--");
        employeeData.push("--");
      }

      //get total job accepted (job success + job fail)
      var jobFail = document.querySelector(".list-unstyled.no-mb");
      var totalJob = 0;
      if(jobFail){
        console.log("masuk 4");
        jobFail = jobFail.textContent;
        var pos = jobFail.indexOf("tidak selesai:");
        jobFail = jobFail.substring(pos+14);
        jobFail = parseInt(jobFail);
        if(moneys){
          console.log("masuk 5");
          totalJob = moneys.length+jobFail;
        // }
        // else if(moneys){
        //   totalJob= jobFail + 1;
        }
        else{
          totalJob= jobFail;
        } 
      }else{
        console.log("masuk 6");
        totalJob = 0;
      }              
      employeeData.push(totalJob); 

      //get date of joined
      const joinFrom = document.querySelectorAll(".text-muted.mb-10");
      var date;
      if(joinFrom && joinFrom.length>0){
        console.log("masuk 7");
        date = joinFrom[joinFrom.length - 1].textContent;
      // }
      // else if(joinFrom){
      //   date = joinFrom.textContent;
      }
      else{
        console.log("masuk 8");
        date = "new joiner or no job accepted yet"; 
      }
      employeeData.push(date); 

      return employeeData;
  	});
  	console.log(res)
  	return res;
}

async function extractPage(page){
  const showmore = await page.evaluate(() => {
    const tombol = document.querySelector(".col-sm-12.pb-20.profile-panel-v2.mt-20 .create_cancel.form-horizontal .btn.btn-default.btn-md.mt-20");
    return tombol;
  });
  if(showmore){
    await page.click(".col-sm-12.pb-20.profile-panel-v2.mt-20 .create_cancel.form-horizontal .btn.btn-default.btn-md.mt-20"); 
    await page.waitFor(1500);
  }
  return showmore;
}

// function sleep(ms) {
//   return new Promise(resolve => setTimeout(resolve, ms));
// }