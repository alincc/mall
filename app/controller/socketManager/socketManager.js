// http://ejohn.org/blog/ecmascript-5-strict-mode-json-and-more/
"use strict";

// Optional. You will see this name in eg. 'ps' or 'top' command
process.title = 'node-chat';

// Port where we'll run the websocket server
var webSocketsServerPort = 9094;

// websocket and http servers
var webSocketServer = require('websocket').server;
var http = require('http');

/**
 * Global variables
 */
// list of currently connected clients (users)
var clients9000 = [];

/**
 * Helper function for escaping input strings
 */
function htmlEntities(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * HTTP server
 */
var server = http.createServer(function (request, response) {
    // Not important for us. We're writing WebSocket server, not HTTP server
});
server.listen(webSocketsServerPort, function () {
    console.log((new Date()) + " websocket Server is listening on port " + webSocketsServerPort);
});

/**
 * WebSocket server
 */
var wsServer = new webSocketServer({
    // WebSocket server is tied to a HTTP server. WebSocket request is just
    // an enhanced HTTP request. For more info http://tools.ietf.org/html/rfc6455#page-6
    httpServer: server
});
// var chatServer = net.createServer(),
//     clientList = [];
// var dataList = [];


const SocketManager = (function () {
    let initSocket = function () {

        // This callback function is called every time someone
// tries to connect to the WebSocket server
        wsServer.on('request', function (request) {
            console.log((new Date()) + ' Connection from origin ' + request.origin + '.');

            // accept connection - you should check 'request.origin' to make sure that
            // client is connecting from your website
            // (http://en.wikipedia.org/wiki/Same_origin_policy)
            var connection = request.accept(null, request.origin);
            // we need to know client index to remove them on 'close' event
            var index = clients9000.push(connection) - 1;
            var userName = false;
            var userColor = false;

            console.log((new Date()) + ' Connection accepted.');

            // user sent some message
            connection.on('message', function (message) {
                console.log("222222222222222222222222 ||" + message.utf8Data);
                // if (message.type === 'utf8') { // accept only text
                //     if (userName === false) { // first message sent by user is their name
                //         // remember user name
                //         userName = htmlEntities(message.utf8Data);
                //         // get random color and send it back to the user
                //         userColor = colors.shift();
                //         //connection.sendUTF(JSON.stringify({ type:'color', data: userColor }));
                //         connection.sendUTF("test");
                //         console.log((new Date()) + ' User is known as: ' + userName
                //             + ' with ' + userColor + ' color.');
                //
                //     } else { // log and broadcast the message
                //         console.log((new Date()) + ' Received Message from '
                //             + userName + ': ' + message.utf8Data);
                //
                //         // we want to keep history of all sent messages
                //         var obj = {
                //             time: (new Date()).getTime(),
                //             text: htmlEntities(message.utf8Data),
                //             author: userName,
                //             color: userColor
                //         };
                //         history.push(obj);
                //         history = history.slice(-100);
                //
                //         // broadcast message to all connected clients
                //         var json = JSON.stringify({ type:'message', data: obj });
                //         for (var i=0; i < clients.length; i++) {
                //             clients[i].sendUTF(json);
                //         }
                //     }
                // }
            });

            // user disconnected
            connection.on('close', function (connection) {
                console.log((new Date()) + " Peer "
                    + connection.remoteAddress + " disconnected.");
                // remove user from the list of connected clients
                clients9000.splice(index, 1);
            });
        });
    }

    let sendSocket = function (content) {
        for (var i = 0; i < clients9000.length; i++) {
            if (typeof content != "string") {
                content = JSON.stringify(content);
            }
            clients9000[i].sendUTF(content);

        }

    }

    let instance = {
        initSocket: initSocket,
        sendSocket: sendSocket
    }

    return instance;
})();
module.exports = SocketManager;