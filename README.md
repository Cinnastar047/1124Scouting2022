# 1124Scouting2022
Hello! Welcome to my years-long quest to put an end to quantitative scouting!
The motivation for this project is based in a things:
1. I spent a few years in high school as the head strategist on my FRC team. I know very well how difficult it is to keep high schoolers on track and recording accurate data and how it tiring it is to do so for 2-3 days straight.
2. I've been frustrated by the limitations of OPR for the purposes of making a pick list.
3. I've noticed that FIRST has recently (~2017) begun recording additional information about matches.

For the 2023 version of this project, see the [Google Sheet](https://docs.google.com/spreadsheets/d/1obQQKPVK4xG6EJBp0p6tyHqkOud8KV0JBBh8CXGgscc/edit?usp=sharing)!!

## A Word About OPR
For anyone unfamiliar, OPR finds a Least Squares solution to a very large matrix division problem to estimate how many points a team contributes to their alliance at an event. Essentially, this is done by creating a very large matrix of 1's and 0's to denote which teams are on each alliance each match, and dividing it by another very large, single-column matrix of their scores. The result is a final very large, single-column matrix, the values of which are the OPRs of each team at the event. Unforunately, this only tells us approximately how many points they contribute to each of their alliances, and when making a pick list, you may be interested in something like which rung they climb on in the endgame period.
## What This Does
As of now, FIRST records data in two ways that are relevant to the project. Some data is recorded per each robot (ex. robot 1 ended the match on the high rung), and other data is recorded per alliance (ex. # of high goals the red alliance scored in autonomous). For the first category, the program takes a simple percentage of actions performed divided by opportunities (typically # of matches). For the second type, it performs a calculation described in the OPR section above, but just to the numbers for each subscore.
## What You Need to Do to Make It Work
You will need an internet connection when setting up the program and when running it (because it draws data from The Blue Alliance).
1. Get yourself a TBA read key. You do this by going to your account on TBA (www.thebluealliance.com/account), scrolling down to Read API Keys, and clicking the button to add a new key. Then copy the text it gives you and paste it in line 4 of app.js.
```
const apiKey = 'apiKeyGoesHere';
```
2. Next, look at the inputs variable on line 12. It was intended to contain some extra options for output, but for now it just lets you input which event you want to calculate stats for. You need to input this as the event code as logged by The Blue Alliance. If you don't know what it is, find the event on TBA using a browser and look in the URL for something like "2022abca". You don't need to put the 2022 part in the event code variable. Note: you may want to test this with a finished event before using it in the middle of a competition to make sure you've set it up correctly.
3. Open your command line and navigate to the folder where you've downloaded the program files (I recommend putting them in their own folder, not just freefloating in your downloads). For those unfamiliar, the command line tool on Windows is called Command Prompt and the one on Mac and Linux is called Terminal. You can navigate to a specific folder using
```
cd 'filepath'
```
4. The first time you run the program, you need to run this command in the folder. This will add the node packages I used in the program to the folder. The program will not work without them. You may also need to install the node package manager before this command will work.  You can find how to do that here: https://docs.npmjs.com/downloading-and-installing-node-js-and-npm
```
npm i
```
5. Try running the program with this command.
```
npm start
```
This should cause app.js to run, which will send a couple requests to TBA for data, calculate the numbers described above from it, and write them to a CSV file in the same folder as the program files. You can then open this file in any spreadsheet software you'd like (Excel, Numbers, Google Sheets, etc).
## If you run into scary errors instead of getting a CSV file
Take a screenshot of it and come yell at me.
