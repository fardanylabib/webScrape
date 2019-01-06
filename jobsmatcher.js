const fs = require("fs");
var projects;
var workers;
let output=[];
const scrape = async () => {
	projects = projects.toString();
	projects = projects.split("\n");
	
	workers = workers.toString();
	workers = workers.split("\n");
	for(let i = 0; i<workers.length;i++){
		findThisWorker(i);
	}
	// Return a value
	return 1;
};

async function findThisWorker(index){
	let workerMoney=0;
	var firstProject = "2010-01-01";
	var lastProject = "2010-01-01";
	var workerName = workers[index].split(",");
	workerName = workerName[2];
	// console.log("finding worker name with ID "+index+": "+workerName);
	//cari worker name di projects
	let foundCounter = 0;
	for(let j=0;j<projects.length;j++){
		var projectDetail = projects[j].split(",");
		if(workerName === projectDetail[1]){
			console.log("worker name found: "+workerName);
			workerMoney = workerMoney + parseInt(projectDetail[2]);
			let currentDate = new Date(projectDetail[4]);
			if(foundCounter==0){
				firstProject = currentDate;
				lastProject = currentDate;
			}else{
				if(currentDate<firstProject){
					firstProject = currentDate;
				}else if(currentDate>lastProject){
					lastProject = currentDate;
				}
			}
			foundCounter++;
		}
	}
	if(foundCounter>0){
		let subtitute = workers[index];
		subtitute = subtitute + "," + workerMoney + "," + firstProject.toString() + "," + lastProject.toString();	
		console.log(subtitute);
		output.push(subtitute);
	}else{
		output.push(workers[index]);
	}	
	return 1;
}

async function runAll(){
	const linksDir  = ".\\DataMatang\\";
	//input path setup
	const projectsFile  = linksDir + "ProjectsDone.csv";
	const workersFile  = linksDir + "ProjectsWorkerList.csv";
	projects = fs.readFileSync(projectsFile);
	workers = fs.readFileSync(workersFile);
	
	//process
	await scrape();
	
	//output path setup
	let fileExist = -1;
	let index = 0;
	let fileName = "";
	while(fileExist != 0){
		if(index === 0){
			fileName = linksDir+"WorkersAndProjects.csv";
		}else{
			fileName = linksDir+"WorkersAndProjects("+ index +").csv";
		}
		if(fs.existsSync(fileName)){
			index++;
		}else{
			fileExist = 0;
		}
	}
	console.log("File Name = "+fileName);
	let outStream = fs.createWriteStream(fileName);
	for(let line of output){
		line = line.replace((/  |\r\n|\n|\r/gm),"");
		outStream.write(line + "\n");
	}
	outStream.end();
}

runAll();