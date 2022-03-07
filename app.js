const axios = require('axios');
const {Matrix, solve} = require('ml-matrix');
const createCsvWriter = require('csv-writer').createArrayCsvWriter;
const apiKey = 'xxx';
const competitionYear = '2022';
axios.defaults.headers.common['X-TBA-Auth-Key'] = apiKey;
let cleanTeamList = [];
let relevantData = [];
let allianceMatrix = [];
let output = [];
/*---------------------- ADD YOUR INPUTS HERE ----------------------*/
let inputs = {
	eventCode: "event", // event is generally stateAbbreviation+firstThreeLettersOfHostTownName (try ctwat or cthar)
};
/*--------------- DO NOT CHANGE STUFF BELOW THIS LINE ---------------*/

async function main () {
	// get team list
	const url1 = 'https://www.thebluealliance.com/api/v3/event/' + competitionYear + inputs.eventCode + '/teams/keys';
	try {
		const rawTeamList = await axios.get(url1);
		for (i=0; i < rawTeamList.data.length; i++) {
			cleanTeamList.push(rawTeamList.data[i].substring(3));
		}
		cleanTeamList.sort(function(a, b){return a-b}); // fix that alphabetical nonsense
	} catch (e) {
		console.log(e);
	}
	
	// get quals data
	const url2 = 'https://www.thebluealliance.com/api/v3/event/' + competitionYear + inputs.eventCode + '/matches';
	try {
		const eventData = await axios.get(url2);
		for (i=0; i < eventData.data.length; i++) {
			if (eventData.data[i].comp_level == 'qm') relevantData.push(eventData.data[i]);
		}
		//console.log(relevantData);
	} catch (e) {
		console.log(e);
	}
	
	// create terrible alliance matrix
	for (i=0; i < relevantData.length; i++) {
		// push blue row
		let row = [];
		for (j=0; j < cleanTeamList.length; j++) {
			let team = 'frc' + cleanTeamList[j];
			if (relevantData[i].alliances.blue.team_keys[0] == team || relevantData[i].alliances.blue.team_keys[1] == team || relevantData[i].alliances.blue.team_keys[2] == team) row.push(1);
			else row.push(0);
		}
		allianceMatrix.push(row);
		// push red row
		row = [];
		for (j=0; j < cleanTeamList.length; j++) {
			let team = 'frc' + cleanTeamList[j];
			if (relevantData[i].alliances.red.team_keys[0] == team || relevantData[i].alliances.red.team_keys[1] == team || relevantData[i].alliances.red.team_keys[2] == team) row.push(1);
			else row.push(0);
		}
		allianceMatrix.push(row);
	}
	allianceMatrix = new Matrix(allianceMatrix);
	
	// create second terrible scores matrices
	let matchScores = []; // calculate oprs for test
	let autoCargoHigh = []; // this and the other three cargo matrices will be counts, not points
	let autoCargoLow = [];
	let teleopCargoHigh = [];
	let teleopCargoLow = [];
	let foulPoints = []; // this one is foul points committed so switch red/blue
	for (i=0; i < relevantData.length; i++) {
		matchScores.push(relevantData[i].score_breakdown.blue.totalPoints);
		matchScores.push(relevantData[i].score_breakdown.red.totalPoints);
		autoCargoHigh.push(relevantData[i].score_breakdown.blue.autoCargoUpperBlue + relevantData[i].score_breakdown.blue.autoCargoUpperFar + relevantData[i].score_breakdown.blue.autoCargoUpperNear + relevantData[i].score_breakdown.blue.autoCargoUpperRed); // i'm in hell
		autoCargoHigh.push(relevantData[i].score_breakdown.red.autoCargoUpperBlue + relevantData[i].score_breakdown.red.autoCargoUpperFar + relevantData[i].score_breakdown.red.autoCargoUpperNear + relevantData[i].score_breakdown.red.autoCargoUpperRed);
		autoCargoLow.push(relevantData[i].score_breakdown.blue.autoCargoLowerBlue + relevantData[i].score_breakdown.blue.autoCargoLowerFar + relevantData[i].score_breakdown.blue.autoCargoLowerNear + relevantData[i].score_breakdown.blue.autoCargoLowerRed);
		autoCargoLow.push(relevantData[i].score_breakdown.red.autoCargoLowerBlue + relevantData[i].score_breakdown.red.autoCargoLowerFar + relevantData[i].score_breakdown.red.autoCargoLowerNear + relevantData[i].score_breakdown.red.autoCargoLowerRed);
		teleopCargoHigh.push(relevantData[i].score_breakdown.blue.teleopCargoUpperBlue + relevantData[i].score_breakdown.blue.teleopCargoUpperFar + relevantData[i].score_breakdown.blue.teleopCargoUpperNear + relevantData[i].score_breakdown.blue.teleopCargoUpperRed);
		teleopCargoHigh.push(relevantData[i].score_breakdown.red.teleopCargoUpperBlue + relevantData[i].score_breakdown.red.teleopCargoUpperFar + relevantData[i].score_breakdown.red.teleopCargoUpperNear + relevantData[i].score_breakdown.red.teleopCargoUpperRed);
		teleopCargoLow.push(relevantData[i].score_breakdown.blue.teleopCargoLowerBlue + relevantData[i].score_breakdown.blue.teleopCargoLowerFar + relevantData[i].score_breakdown.blue.teleopCargoLowerNear + relevantData[i].score_breakdown.blue.teleopCargoLowerRed);
		teleopCargoLow.push(relevantData[i].score_breakdown.red.teleopCargoLowerBlue + relevantData[i].score_breakdown.red.teleopCargoLowerFar + relevantData[i].score_breakdown.red.teleopCargoLowerNear + relevantData[i].score_breakdown.red.teleopCargoLowerRed);
		foulPoints.push(relevantData[i].score_breakdown.red.foulPoints);
		foulPoints.push(relevantData[i].score_breakdown.blue.foulPoints);
	}
	matchScores = Matrix.columnVector(matchScores);
	autoCargoHigh = Matrix.columnVector(autoCargoHigh);
	autoCargoLow = Matrix.columnVector(autoCargoLow);
	teleopCargoHigh = Matrix.columnVector(teleopCargoHigh);
	teleopCargoLow = Matrix.columnVector(teleopCargoLow);
	foulPoints = Matrix.columnVector(foulPoints);
	
	// run the matrix calculations
	let oprs = solve(allianceMatrix, matchScores);
	let autoCargoHighPower = solve(allianceMatrix, autoCargoHigh);
	let autoCargoLowPower = solve(allianceMatrix, autoCargoLow);
	let teleopCargoHighPower = solve(allianceMatrix, teleopCargoHigh);
	let teleopCargoLowPower = solve(allianceMatrix, teleopCargoLow);
	let foulLiability = solve(allianceMatrix, foulPoints);
	
	// calculate percent based numbers
	let taxiPercent = [];
	let lowClimb = [];
	let midClimb = [];
	let highClimb = [];
	let traverseClimb = [];
	for (i=0; i < cleanTeamList.length; i++) {
		let teamKey = 'frc' + cleanTeamList[i];
		let numMatches = 0;
		let numTaxis = 0;
		let numLowClimbs = 0;
		let numMidClimbs = 0;
		let numHighClimbs = 0;
		let numTraverseClimbs = 0;
		for (j=0; j < relevantData.length; j++) {
			if (relevantData[j].alliances.blue.team_keys[0] === teamKey) {
				numMatches++;
				if (relevantData[j].score_breakdown.blue.taxiRobot1 === 'Yes') numTaxis++;
				if (relevantData[j].score_breakdown.blue.endgameRobot1 === 'Traversal') numTraverseClimbs++;
				if (relevantData[j].score_breakdown.blue.endgameRobot1 === 'High') numHighClimbs++;
				if (relevantData[j].score_breakdown.blue.endgameRobot1 === 'Mid') numMidClimbs++;
				if (relevantData[j].score_breakdown.blue.endgameRobot1 === 'Low') numLowClimbs++;
			}
			if (relevantData[j].alliances.blue.team_keys[1] === teamKey) {
				numMatches++;
				if (relevantData[j].score_breakdown.blue.taxiRobot2 === 'Yes') numTaxis++;
				if (relevantData[j].score_breakdown.blue.endgameRobot2 === 'Traversal') numTraverseClimbs++;
				if (relevantData[j].score_breakdown.blue.endgameRobot2 === 'High') numHighClimbs++;
				if (relevantData[j].score_breakdown.blue.endgameRobot2 === 'Mid') numMidClimbs++;
				if (relevantData[j].score_breakdown.blue.endgameRobot2 === 'Low') numLowClimbs++;
			}
			if (relevantData[j].alliances.blue.team_keys[2] === teamKey) {
				numMatches++;
				if (relevantData[j].score_breakdown.blue.taxiRobot3 === 'Yes') numTaxis++;
				if (relevantData[j].score_breakdown.blue.endgameRobot3 === 'Traversal') numTraverseClimbs++;
				if (relevantData[j].score_breakdown.blue.endgameRobot3 === 'High') numHighClimbs++;
				if (relevantData[j].score_breakdown.blue.endgameRobot3 === 'Mid') numMidClimbs++;
				if (relevantData[j].score_breakdown.blue.endgameRobot3 === 'Low') numLowClimbs++;
			}
			if (relevantData[j].alliances.red.team_keys[0] === teamKey) {
				numMatches++;
				if (relevantData[j].score_breakdown.red.taxiRobot1 === 'Yes') numTaxis++;
				if (relevantData[j].score_breakdown.red.endgameRobot1 === 'Traversal') numTraverseClimbs++;
				if (relevantData[j].score_breakdown.red.endgameRobot1 === 'High') numHighClimbs++;
				if (relevantData[j].score_breakdown.red.endgameRobot1 === 'Mid') numMidClimbs++;
				if (relevantData[j].score_breakdown.red.endgameRobot1 === 'Low') numLowClimbs++;
			}
			if (relevantData[j].alliances.red.team_keys[1] === teamKey) {
				numMatches++;
				if (relevantData[j].score_breakdown.red.taxiRobot2 === 'Yes') numTaxis++;
				if (relevantData[j].score_breakdown.red.endgameRobot2 === 'Traversal') numTraverseClimbs++;
				if (relevantData[j].score_breakdown.red.endgameRobot2 === 'High') numHighClimbs++;
				if (relevantData[j].score_breakdown.red.endgameRobot2 === 'Mid') numMidClimbs++;
				if (relevantData[j].score_breakdown.red.endgameRobot2 === 'Low') numLowClimbs++;
			}
			if (relevantData[j].alliances.red.team_keys[2] === teamKey) {
				numMatches++;
				if (relevantData[j].score_breakdown.red.taxiRobot3 === 'Yes') numTaxis++;
				if (relevantData[j].score_breakdown.red.endgameRobot3 === 'Traversal') numTraverseClimbs++;
				if (relevantData[j].score_breakdown.red.endgameRobot3 === 'High') numHighClimbs++;
				if (relevantData[j].score_breakdown.red.endgameRobot3 === 'Mid') numMidClimbs++;
				if (relevantData[j].score_breakdown.red.endgameRobot3 === 'Low') numLowClimbs++;
			}
		}
		taxiPercent.push(numTaxis/numMatches);
		lowClimb.push(numLowClimbs/numMatches);
		midClimb.push(numMidClimbs/numMatches);
		highClimb.push(numHighClimbs/numMatches);
		traverseClimb.push(numTraverseClimbs/numMatches);
	}
	// why was this so many lines of code???
	
	// get rankings
	const url3 = 'https://www.thebluealliance.com/api/v3/event/' + competitionYear + inputs.eventCode + '/rankings';
	let relevantRankingData = [];
	try {
		const rankingData = await axios.get(url3);
		for (i=0; i < rankingData.data.rankings.length; i++) {
			relevantRankingData.push(rankingData.data.rankings[i].team_key.substring(3));
		}
	} catch (e) {
		console.log(e);
	}
	
	// assemble the output matrix
	// output for a row will be team number, rank, taxi percent, auto high count, auto low count, auto cargo points, teleop high count, teleop low count, teleop cargo points, endgame low percent, endgame mid percent, endgame high percent, endgame traverse percent, foul liability
	for (i=0; i < cleanTeamList.length; i++) {
		//console.log(oprs.get(i,0));
		let teamRank = 0;
		for (j=0; j < relevantRankingData.length; j++) {
			if (relevantRankingData[j] === cleanTeamList[i]) teamRank = j+1;
		}
		let autoCargoPoints = autoCargoHighPower.get(i,0) * 4 + autoCargoLowPower.get(i,0) * 2;
		let teleopCargoPoints = teleopCargoHighPower.get(i,0) * 2 + teleopCargoLowPower.get(i,0);
		let row = [cleanTeamList[i], teamRank, taxiPercent[i], autoCargoHighPower.get(i,0), autoCargoLowPower.get(i,0), autoCargoPoints, teleopCargoHighPower.get(i,0), teleopCargoLowPower.get(i,0), teleopCargoPoints, lowClimb[i], midClimb[i], highClimb[i], traverseClimb[i], foulLiability.get(i,0)];
		output.push(row);
	}
	
	// save to csv file and sort it yourself :p
	const csvWriter = createCsvWriter({header: ['Team Number', 'Rank', '% Taxi', '# Auto Cargo High', '# Auto Cargo Low', 'Auto Cargo Points', '# TeleOp Cargo High', '# TeleOp Cargo Low', 'TeleOp Cargo Points', '% Low Climbs', '% Mid Climbs', '% High Climbs', '% Traverse Climbs', 'Foul Liability'], path: `Data for ${inputs.eventCode}.csv`});
	csvWriter.writeRecords(output).then(() => {console.log('Done');});
	
}

main();
