const PAGE_ACCESS_TOKEN = 'EAAbxR4hFEykBAKpySZATRhqHVCPhPEo82JDLIri2ATGzCVQRkL9ZAjXp2RE7GDU2v3k50eg64uhjakNxUefzRrlj6Td14hlkAKJddG1sZCvyyYjMGWOe7054QlkBwgemjZCUZAy0pWBfgcMVQTn0yCzOZAafKKOEIYjHfzqByp7QZDZD';
const APIAI_TOKEN = '67460b2deea9478ba2c72710bdcb3988';
const WEATHER_API_KEY = '9372fc4ed00ed38e46e398f65326d438';
//const SSH_KEY = require('fs').readFileSync('~/.ssh/id_rsa');

const HOST = 'localhost';
const USER = 'Wei-Wei';
const PASS = '!!Gw009257!!';


const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const apiai = require('apiai');

const app = express();
const apiaiApp = apiai(APIAI_TOKEN);

app.use(express.static(__dirname + '/public'));
app.get('/index.html', function (req, res) {
   res.sendFile(__dirname + "/" + "index.html");
})

var site_server = app.listen(8081, function () {
   var host = server.address().address
   var port = server.address().port
   console.log("MacBot listening at http://%s:%s", host, port)

})

//ssh into computer and execute remote commands
var SSH = require('simple-ssh');

var ssh = new SSH({
    //host: 'localhost',
    host: HOST,
    user: USER,
    pass: PASS
    //key: SSH_KEY
});

function resetQueue(){
  ssh = new SSH({
      //host: 'localhost',
      host: HOST,
      user: USER,
      pass: PASS
      //key: SSH_KEY
  });
}

//function to start specified app
function startApp(appName){
  appName = JSON.stringify(String(appName));
  var command = 'open -a '+appName;
  console.log(command);
  ssh.exec(command).start();
  resetQueue();
}
function quitApp(appName){
//appName = JSON.stringify(String(appName));
  var command = 'osascript -e \'quit app \"'+appName+'\"\'';
  console.log(command);
  ssh.exec(command).start();
  resetQueue();
}

function playSong(name){
  var command = '/usr/local/bin/spotify play '+name;
  console.log(command);
  ssh.exec(command).start();
  resetQueue();
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const server = app.listen(process.env.PORT || 5033, () => {
  console.log('Server listening on port %d', server.address().port);
});

//text
app.get('/test', (req, res) => {
    res.status(200).send('test successs');
});


/* For Facebook validation */
app.get('/webhook', (req, res) => {
  if (req.query['hub.mode'] && req.query['hub.verify_token'] === 'try2') {
    res.status(200).send(req.query['hub.challenge']);
  } else {
    res.status(403).end();
  }
});

/* Handling all messenges */
app.post('/webhook', (req, res) => {
  if (req.body.object === 'page') {
    req.body.entry.forEach((entry) => {
      entry.messaging.forEach((event) => {
        if (event.message && event.message.text) {
          console.log('-----FACEBOOK EVENT------');
          console.log(event);
          receivedMessage(event);

        }
      });
    });
    res.status(200).end();
  }
});

//create handling messages from website
app.get('/website', (req, res) => {
  console.log('website request');
  console.log(req);
});



/* GET query from API.ai */
function receivedMessage(event) {
  let sender = event.sender.id;
  let text = event.message.text;
  console.log('Sending api.ai text');
  console.log(text);
  let apiai = apiaiApp.textRequest(text, {
    sessionId: 'MacBot'
  });

  apiai.on('response', (response) => {
    let aiText = response.result.fulfillment.speech;
    console.log(aiText);
    prepareSendAiMessage(sender, aiText);

//ACTIONNNNNN HAHAHAHAHAHAHA
    console.log('-----JSON RESPONSE-----');
    // console.log(response.result);
    console.log('-----INTENT-----');
    console.log(response.result.metadata.intentName);
    console.log('-----PARAMETERS-----');
    console.log(response.result.parameters);
    switch(response.result.metadata.intentName) {
        case 'start-apps':
            var app = response.result.parameters.apps;
            startApp(app);
            console.log(app+' started');
            break;
        case 'stop-apps':
            var app = response.result.parameters.apps;
            if (app == ''){
              app = response.result.parameters.open_app;
            }
            quitApp(app);
            console.log(app+' stopped');
            break;
        case 'start-music':
            var song = response.result.parameters.songs;
            switch(song){
              case '':
                break;
              default:
                playSong(song);
                break;
            }
            break;
        case 'start-music-by-artist':
            var artist = response.result.parameters.artists;
            switch(artist){
              case '':
                break;
              default:
                playSong(artist);
                break;
            }
            break;
        case 'stop-music':
            var command = '/usr/local/bin/spotify quit';
            console.log(command);
            ssh.exec(command).start();
            resetQueue();
            break;
        case 'open-sites':
            var site = response.result.parameters.websites;
            var command  = 'open -a Google\\ Chrome '+site;
            console.log(command);
            ssh.exec(command).start();
            resetQueue();
            break;
        default:
            console.log('default case');
            break;
    }
  });

  apiai.on('error', (error) => {
    console.log(error);
  });

  apiai.end();
}

function sendMessage(messageData) {
  request({
    url: 'https://graph.facebook.com/v2.8/me/messages',
    qs: {access_token: PAGE_ACCESS_TOKEN},
    method: 'POST',
    json: messageData
  }, (error, response) => {
    if (error) {
        console.log('Error sending message: ', error);
    } else if (response.body.error) {
        console.log('Error: ', response.body.error);
    }
  });
}

function prepareSendAiMessage(sender, aiText) {
  let messageData = {
    recipient: {id: sender},
    message: {text: aiText}
  };
  sendMessage(messageData);
}

/* Webhook for API.ai to get response from the 3rd party API */
app.post('/ai', (req, res) => {
//  console.log('*** Webhook for api.ai query ***');
//  console.log(req.body.result);

  if (req.body.result.action === 'weather') {
  //  console.log('*** weather ***');
    let city = req.body.result.parameters['geo-city'];
    let restUrl = 'http://api.openweathermap.org/data/2.5/weather?APPID='+WEATHER_API_KEY+'&q='+city;

    request.get(restUrl, (err, response, body) => {
      if (!err && response.statusCode == 200) {
        let json = JSON.parse(body);
      //  console.log(json);
        let temp = Number((json.main.temp * 9/5 - 459).toFixed(1));
        let msg = 'The current condition in ' + json.name + ' is ' + json.weather[0].description + ' and the temperature is ' + temp +' degrees F';
        return res.json({
          speech: msg,
          displayText: msg,
          source: 'weather'
        });
      } else {
        let errorMessage = 'I failed to look up the city name.';
        return res.status(400).json({
          status: {
            code: 400,
            errorType: errorMessage
          }
        });
      }
    })
  }

});
