const WebSocket = require('ws');
const sip = require('sip');
const crypto = require('crypto');

// Create a new WebSocket server
const wss = new WebSocket.Server({ port: 8088 });

wss.on('connection', (ws) => {
    console.log('New WebSocket client connected');

    ws.on('message', (message) => {
        const sipMessage = sip.parse(message);
        console.log('Received from WebSocket client:', sipMessage);

        // Example SIP INVITE request
        const method = sipMessage.method;
        const uri = sipMessage.uri;
        const username = '1935';
        const realm = 'icip_intelbras';
        const nonce = 'b39971';  // Example nonce from the server
        const cnonce = 'a1b2c3d4e5';  // Example client nonce
        const opaque = '5ccc069c403ebaf9f0171e9517f40e41';  // Example opaque from the server
        const password = '1935';

        const authorizationHeader = generateAuthorizationHeader({
            username,
            realm,
            method,
            uri,
            nonce,
            cnonce,
            opaque,
            password
        });

        var sipRequest;

        if (sipMessage.method === 'INVITE') {
            // Example SIP INVITE request
            sipRequest = {
                method: sipMessage.method,
                uri: sipMessage.uri,
                version: '2.0',
                headers: {
                    // via: [
                    //     {
                    //         version: "2.0",
                    //         protocol: "UDP",
                    //         host: "10.1.2.40",
                    //         port: 5060,
                    //         params: {
                    //             branch: sipMessage.headers.via[0].params.branch,
                    //         },
                    //     },
                    // ],
                    'max-forwards': '70',
                    //to: { uri: sipMessage.headers.to },
                    to:
                    {
                        name: '1932'
                        , uri: 'sip:1932@10.1.2.40:5060'
                        , params: {}
                    },
                    from: { uri: sipMessage.headers.from.uri, params: sipMessage.headers.from.params },
                    'call-id': sipMessage.headers['call-id'] + '@10.1.2.40',
                    cseq: {
                        seq: 2,
                        method: "INVITE",
                      },
                    contact: [{ uri: 'sip:1935@10.1.2.40' }],
                    'content-type': 'application/sdp',
                    //'proxy-authorization': authorizationHeader,
                    allow:sipMessage.headers.allow,
                    supported:'replaces, norefersub, extended-refer, timer, sec-agree, outbound, path, X-cisco-serviceuri',//sipMessage.headers.supported, 
                    'content-type':sipMessage.headers['content-type'],
                    'content-length':sipMessage.headers['content-length'],
                    'user-agent':sipMessage.headers['user-agent'],
                    'allow-events':'presence, kpml, talk, as-feature-event',
                },
                content: sipMessage.content,
            };

            //sipRequest = sipMessage;

            // sipRequest = {
            //     method: 'INVITE'
            //     , uri: 'sip:1932@10.1.2.40:5060'
            //     , version: '2.0'
            //     , headers:
            //     {
            //         via:
            //             [{
            //                 version: '2.0'
            //                 , protocol: 'UDP'
            //                 , host: '127.0.1.1'
            //                 , port: 5060
            //                 , params: { branch: sipMessage.headers.via[0].params.branch }
            //             }
            //             ]
            //         , from:
            //         {
            //             name: '1935'
            //             , uri: 'sip:1935@10.1.2.40:5060'
            //             , params: { tag: '1075SIPpTag001' }
            //         }
            //         , to:
            //         {
            //             name: '1932'
            //             , uri: 'sip:1932@10.1.2.40:5060'
            //             , params: {}
            //         }
            //         , 'call-id': sipMessage.headers['call-id'] + '@10.1.2.40'
            //         , cseq: { seq: 1, method: 'INVITE' }
            //         , contact:
            //             [{
            //                 name: 1935
            //                 , uri: 'sip:1935@10.1.2.40:5060'
            //                 , params: {}
            //             }
            //             ]
            //         , 'max-forwards': '70'
            //         , subject: 'Performance Test'
            //         , 'content-type': 'application/sdp'
            //         , 'content-length': 127
            //     }
            //     , content: 'v=0\r\no=user1 53655765 2353687637 IN IP4 127.0.1.1\r\ns=-\r\nc=IN IP4 127.0.1.1\r\nt=0 0\r\nm=audio 6000 RTP/AVP 0\r\na=rtpmap:0 PCMU/8000'
            // };
        } else {
            // Example SIP INVITE request
            sipRequest = {
                method: sipMessage.method,
                uri: sipMessage.uri,
                headers: {
                    via: [
                        {
                            version: "2.0",
                            protocol: "SIP",
                            host: "10.1.2.40",
                            port: 5060,
                            params: {
                                branch: "z9hG4bK8448439",
                            },
                        },
                    ],
                    'max-forwards': '70',
                    to: { uri: sipMessage.headers.to },
                    from: { uri: sipMessage.headers.from.uri, params: sipMessage.headers.from.params },
                    'call-id': sipMessage.headers['call-id'] + '@10.1.2.40',
                    cseq: sipMessage.headers.cseq,
                    contact: [{ uri: 'sip:1935@10.1.2.40' }],
                    'content-type': 'application/sdp',
                    authorization: authorizationHeader,
                }
            };
        }

        console.log('sipRequest:', JSON.stringify(sipRequest));

        // Send the SIP INVITE request
        sip.send(sipRequest, (response) => {
            console.log('Received SIP response:', response);
            ws.send(`SIP response: ${response.status}`);
        });
    });

    ws.on('close', () => {
        console.log('WebSocket client disconnected');
    });

    ws.send('Welcome to the WebSocket and SIP server');
});

// SIP server setup
sip.start({}, (request) => {
    if (request.method === 'INVITE') {
        console.log('Received SIP INVITE:', request);

        sip.send(sip.makeResponse(request, 180, 'Ringing'));
        setTimeout(() => {
            sip.send(sip.makeResponse(request, 200, 'OK'));
        }, 3000);
    }
});

function generateAuthorizationHeader({
    username,
    realm,
    method,
    uri,
    nonce,
    nc = '00000001',
    cnonce,
    qop = 'auth',
    opaque,
    password,
}) {
    // HA1 = MD5(username:realm:password)
    const ha1 = crypto.createHash('md5').update(`${username}:${realm}:${password}`).digest('hex');

    // HA2 = MD5(method:uri)
    const ha2 = crypto.createHash('md5').update(`${method}:${uri}`).digest('hex');

    // Response = MD5(HA1:nonce:nc:cnonce:qop:HA2)
    const response = crypto.createHash('md5').update(`${ha1}:${nonce}:${nc}:${cnonce}:${qop}:${ha2}`).digest('hex');

    return `Digest username="${username}", realm="${realm}", nonce="${nonce}", uri="${uri}", response="${response}", algorithm="MD5", cnonce="${cnonce}", opaque="${opaque}", qop=${qop}, nc=${nc}`;
}

console.log('WebSocket server is running on ws://localhost:8088');
