/*
Name: Alexei Tipenko (100995947)
Date: Wednsday, November 23rd, 2016
*/

/*SocketIO based chat room. Extended to not echo messages
to the client that sent them.*/
var http = require('http').createServer(handler);
var io = require('socket.io')(http);
var fs = require('fs');									// load necessary modules
var url = require('url');
var mime = require('mime-types');
const ROOT = "./public_html";

http.listen(2406);
console.log("Chat server listening on port 2406");


function handler(req,res){
	var urlObj = url.parse(req.url,true);
	var pathname = urlObj.pathname;
	var filename = ROOT + pathname;
	console.log(filename);
	var query = urlObj.query;
	fs.stat(filename,function(err, stats){

		if(err)respondErr(err);   //try and open the file and handle the error, handle the error

		else{

			if(stats.isDirectory()) filename+="/index.html";

			fs.readFile(filename, function(err,data){
				if(err){
					res.writeHead(500);
					return res.end("Error loading index.html");
				}else{
					res.writeHead(200);
					res.end(data);
				}
			});
		}
	});

	//locally defined helper function
	//serves 404 files
	function serve404(){
		fs.readFile(ROOT+"/404.html","utf8",function(err,data){ //async
			if(err)respond(500,err.message);
			else respond(404,data);
		});
	}

	//locally defined helper function
	//responds in error, and outputs to the console
	function respondErr(err){
		console.log("Handling error: ",err);
		if(err.code==="ENOENT"){
			serve404();
		}else{
			respond(500,err.message);
		}
	}

	//locally defined helper function
	//sends off the response message
	function respond(code, data){
		// content header
		res.writeHead(code, {'content-type': mime.lookup(filename)|| 'text/html'});
		// write message and signal communication is complete
		res.end(data);
	}
};

var clients = [];																			//List of clients
io.on("connection", function(socket){
	console.log("Got a connection");

	socket.on("intro",function(data){
		socket.username = data;
		socket.blockedList = [];					//Create a blockedList for current socket
		clients.push(socket);							//Push socket into list of clients
		socket.broadcast.emit("message", timestamp()+": "+socket.username+" has entered the chatroom.");
		socket.emit("message","Welcome, "+socket.username+".");

		var currList = getUserList();			//Getting list of clients
		console.log(currList.length);
		io.sockets.emit("userList", currList);			//Emitting userList back to client
	});

	socket.on("message", function(data){					//Recieving/sending message
		console.log("got message: "+data);
		socket.broadcast.emit("message",timestamp()+", "+socket.username+": "+data);

	});

	socket.on("disconnect", function(){
		console.log(socket.username+" disconnected");
		io.emit("message", timestamp()+": "+socket.username+" disconnected.");

		clients = clients.filter(function(ele){				//Remove current socket from client list
       return ele!==socket;
		});

		var currList = getUserList();									//Getting list of clients
		io.sockets.emit("userList", currList);				//Emitting userList back to client
	});

	socket.on("privateMessage", function(data){
		var json = JSON.parse(data);
		var user = json.username;
		var message = json.message;
		console.log(user + ", " + message);

		for (var i=0; i<clients.length; i++) {				//Looping through list of clients
			if (user === clients[i].username && clients[i].blockedList.indexOf(socket.username) < 0) {
				//if user is equal to client's username and the sending user is not blocked for that user.
				//Emit privateMessage to that user
				clients[i].emit("privateMessage", JSON.stringify({"username": socket.username, "message": message}));
				break;
			}
		}
	});

	socket.on("blockUser", function(data){
		var json = JSON.parse(data);
		var user = json.username;
		var index = -1;

		for (var i=0; i<clients.length; i++) {										//Looping through client list
			if (socket.username === clients[i].username) {					//If socket username is equal to user in client list
				index = clients[i].blockedList.indexOf(user);					//Get index of user socket user's blockedlist
				if (index < 0) {																			//if that index is negative (user isnt on it)
					clients[i].blockedList.push(user);									//push user onto socket user's blockedlist
					console.log("User blocked.");
					socket.emit("message", timestamp()+": "+user+" blocked.");
				}

				else {
					clients[i].blockedList.splice(index, 1);						//otherwise, remove user from socket user's blockedList
					console.log("User unblocked.");
					socket.emit("message", timestamp()+": "+user+" unblocked.");
				}
				break;
			}
		}
	});
});


function timestamp(){
	return new Date().toLocaleTimeString();
}

function getUserList(){												//Retrieves a list identical to the client list
  var ret = [];
  for(var i=0;i<clients.length;i++){
      ret.push(clients[i].username);
  }
  return ret;
}
