const WebSocket = require('ws');
const sip = require('sip');
var assert = require('assert');
var util = require('util');
var net = require('net');

const wss = new WebSocket.Server({ port: 8088 });

wss.on('connection', (ws) => {
    console.log('Client connected');

    ws.on('message', (message) => {
        console.log('Received message from client:', message);

        // Parse the SIP message
        const sipMessage = parseSIPMessage(message);

        // Handle the SIP message
        handleSIPMessage(ws, sipMessage);
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

console.log('WebSocket server is listening on ws://localhost:8088');

function parseSIPMessage(message) {
    try {
        return sip.parse(message);
    } catch (error) {
        console.error('Failed to parse SIP message:', error);
        return null;
    }
}

function handleSIPMessage(ws, sipMessage) {
    if (!sipMessage) {
        return;
    }

    /////////////////////////////////////
    const userAgentOptions = {
        uri: 'sip:1935@10.1.2.40:5060',
        transportOptions: {
          wsServers: ['wss://sip-ws.example.com'],
        },
        authorizationUsername: 'alice',
        authorizationPassword: 'supersecret',
        userAgentString: 'MySipClient',
      };
      
      const userAgent = new SIP.UA(userAgentOptions);
      
      userAgent.start();
      
      userAgent.on('registered', () => {
        console.log('Registered successfully!');
      
        const requestOptions = {
          method: SIP.C.INVITE,
          uri: 'sip:bob@example.com',
          headers: {
            'Content-Type': 'application/sdp',
          },
          body: 'v=0\r\no=- 13374 13374 IN IP4 127.0.0.1\r\ns=-\r\nc=IN IP4 127.0.0.1\r\nt=0 0\r\nm=audio 7078 RTP/AVP 0\r\na=rtpmap:0 PCMU/8000\r\n',
        };
      
        const request = userAgent.invite('sip:bob@example.com', requestOptions);
      
        request.on('progress', (response) => {
          console.log('Call is in progress');
        });
      
        request.on('accepted', (response) => {
          console.log('Call accepted');
        });
      
        request.on('rejected', (response) => {
          console.log('Call rejected');
        });
      
        request.on('failed', (response) => {
          console.log('Call failed');
        });
      });
      
      userAgent.on('registrationFailed', (error) => {
        console.error('Registration failed:', error);
      });
    /////////////////////////////////////

    // Example of handling a REGISTER message
    if (sipMessage.method === 'REGISTER') {        
        const response = sip.makeResponse(sipMessage, 200, 'OK');
        console.log(JSON.stringify(response));
        ws.send(JSON.stringify(response));

        // sip.send(sipServerOptions, (response) => {
        //     if (response.status >= 200 && response.status < 300) {
        //         console.log('SIP REGISTER succeeded:', response);
        //         ws.send(JSON.stringify(response));
        //     } else {
        //         console.error('SIP REGISTER failed:', response);
        //         ws.send(JSON.stringify(response));
        //     }
        // });
    }

    if (sipMessage.method === 'INVITE') {
        const response = sip.makeResponse(sipMessage, 200, 'OK');
        console.log(JSON.stringify(response));
        ws.send(JSON.stringify(response));
    }

    // Handle other SIP methods (INVITE, BYE, etc.) similarly
}