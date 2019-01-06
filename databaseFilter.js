const fs = require("fs");
async function removeDuplicate(){
	const linksDir  = ".\\Result\\fiverr_links\\";
	const databaseFile  = linksDir + "database.csv";
	var links = fs.readFileSync(databaseFile);
	links = links.toString();
	links = links.split("\n");

	let outputLinks = [];
	let previousLink = "";
	let row=1;
	for(let link of links){
		let index = link.indexOf("&ref");
		if(index > 0){
			link = link.substring(0,link.indexOf("&ref"));
		}
		console.log("row "+row + "link = "+link + " index = "+index);
		outputLinks.push(link);
		row++;
	}

	//output path setup
	let fileExist = -1;
	let index = 0;
	let fileName = "";
	while(fileExist != 0){
		if(index === 0){
			fileName = linksDir+"databaseFilter.csv";
		}else{
			fileName = linksDir+"databaseFilter("+ index +").csv";
		}
		if(fs.existsSync(fileName)){
			index++;
		}else{
			fileExist = 0;
		}
	}
	console.log("File Name = "+fileName);
	const outStream = fs.createWriteStream(fileName);
	for(let link of outputLinks){
		outStream.write(link+"\n");
	}
	outStream.end();
}

removeDuplicate();