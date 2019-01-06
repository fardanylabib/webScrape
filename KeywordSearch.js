const fs 		= require("fs");

const linksDir  = ".\\DataMatang\\Education\\";

//input path setup
const educationFle  = linksDir + "SribulancerEd.csv";
const workersFile  = linksDir + "Sribulancer.csv";

var eduList = fs.readFileSync(educationFle).toString();
var workerList = fs.readFileSync(workersFile).toString();

//process
eduList = eduList.split("\n");
workerList = workerList.split("\n");

for(let i = 1; i<workerList.length;i++){
	var workerName = workerList[i].split(",");
	workerName = workerName[0];
	for(var edu of eduList){
		edu = edu.split(",");
		if(workerName === edu[0]){
			console.log("Worker name found: "+workerName);
			workerList[i] = workerList[i] + ","+edu[2];
		}
	}
}
//output path setup
let fileExist = -1;
let index = 0;
let fileName = "";
while(fileExist != 0){
	if(index === 0){
		fileName = linksDir+"SribulancerWorkerEd.csv";
	}else{
		fileName = linksDir+"SribulancerWorkerEd("+ index +").csv";
	}
	if(fs.existsSync(fileName)){
		index++;
	}else{
		fileExist = 0;
	}
}
console.log("File Name = "+fileName);
let outStream = fs.createWriteStream(fileName);

for(let worker of workerList){
	worker = worker.replace(/  |\r\n|\n|\r/gm,"");
	outStream.write(worker + "\n");
}
outStream.end();