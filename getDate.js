const fs = require("fs");
const scrape = async () => {
	const linksDir  = ".\\Temp\\";
	//output path setup
	let fileExist = -1;
	let index = 0;
	let fileName = "";
	while(fileExist != 0){
		if(index === 0){
			fileName = linksDir+"Dates.csv";
		}else{
			fileName = linksDir+"Dates("+ index +").csv";
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
	// const databaseFile  = linksDir + "database.txt";
	const databaseFile  = linksDir + "projects.txt";
	var projects = fs.readFileSync(databaseFile);
	projects = projects.toString();
	projects = projects.split("\n");

	for (let j = 0;j<projects.length;j++) {
		// console.log("Project ID = "+j);
		let index = projects[j].indexOf(" on ")+4;
		let date = projects[j].substring(index,index + 12);
		date = date.replace(".","");
		let DMY = date.split(" ");
		let strDate = DMY[1]+"-"+DMY[0]+"-"+DMY[2];
		console.log(strDate);
		outStream.write(strDate+"\n");
	}
	outStream.end();
	// Return a value
	return 1;
};

scrape();
