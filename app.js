let config = require('config')
console.log("wits-central server started using configuration %s", config.get('configName'))

// Setup a web socker server to communicate with a wits-monitor, if any.
let WebSocketServer = require('ws').Server
let ws_port = config.get('ws_port')
let wss = new WebSocketServer({port:ws_port})
console.log('WS server listening on %j', ws_port);

let ws_outer

wss.on('connection', (ws)=>{
    ws_outer = ws
    ws.on('message', (msg)=>{
        console.log('received: %s', msg)
    })
    ws.send('send some message back')
})

// Setup an ordinary TCP socket server to communicate with the wits-agents.  Should we make this
// web sockets instead?  Maybe, maybe not.  Figure that out later.
let net = require('net');
let server = net.createServer();
let JSONDuplexStream = require('json-duplex-stream');

let Gateway = require('./gateway')

server.on('connection', handleConnection);
let socket_port = config.get('socket_port')
server.listen(socket_port, function() {
    console.log('TCP server listening on %j', server.address());
});

function handleConnection(conn) {
    if(ws_outer) ws_outer.send('incoming!')
    var s = JSONDuplexStream();
    var gateway = Gateway();
    conn.
    pipe(s.in).
    pipe(gateway).
    pipe(s.out).
    pipe(conn);

    s.in.on('error', onProtocolError);
    s.out.on('error', onProtocolError);
    conn.on('error', onConnError);

    function onProtocolError(err) {
        conn.end('protocol error:' + err.message);
    }
}

function onConnError(err) {
    console.error('connection error:', err.stack);
}