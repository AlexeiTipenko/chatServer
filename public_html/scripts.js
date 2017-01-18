/*
Name: Alexei Tipenko (100995947)
Date: Wednsday, November 23rd, 2016
*/

$(document).ready(function(){

  var ctrlClicked = false;                                                //boolean for whether ctrl key was clicked
  var userName = prompt("What's your name?")||"User";                     //Prompt user for username

  var socket = io();                                                      //connect to the server that sent this page
  socket.on('connect', function(){            //Socket for the introduction
    socket.emit("intro", userName);
  });

  $('#inputText').keypress(function(ev){
      if(ev.which===13){
        //send message
        socket.emit("message",$(this).val());     //Emit to message
        ev.preventDefault(); //if any
        $("#chatLog").append((new Date()).toLocaleTimeString()+", "+userName+": "+$(this).val()+"\n")
        $(this).val(""); //empty the input
      }
  });

  socket.on("message",function(data){
    $("#chatLog").append(data+"\n");                          //append username to chatLog
    $('#chatLog')[0].scrollTop=$('#chatLog')[0].scrollHeight; //scroll to the bottom
  });


  socket.on("userList",function(data){
    $("#userList").empty();                                   //Emtpy userList
    for (var i=0; i<data.length; i++) {                       //Loop through length of data
      var tempUser = $("<li>" + data[i] + "</li>");           //Add list element containing current user
      $("#userList").append(tempUser);

      tempUser.dblclick(function() {                          //Double-click listener for every user in userList

        if (ctrlClicked) {                        //if ctrl key was clicked (or command on mac)
          console.log("Key pressed.");
          socket.emit("blockUser", JSON.stringify({username: $(this).text()}));  //Emit blockUser to server with name
        }                                                                         //that was clicked

        else {
          var privMessage = prompt("Enter a private message to send: ");

          if (privMessage !== "" && privMessage !== null) {     //If private message is not empty, emit privateMessage
            socket.emit("privateMessage", JSON.stringify({"username": $(this).text(), "message": privMessage}));
          }
        }
      });
    }
  });

  socket.on("privateMessage", function(data){
    var json = JSON.parse(data);                                //Parse json object
    var privMessage = prompt(json.username + " sent a private message: \n" + json.message);//private message prompt
    if (privMessage != "" && privMessage != null) {             //if message is not null, emit privateMessage
      socket.emit("privateMessage", JSON.stringify({"username": json.username, "message": privMessage}));
    }
  });

  $(document).on('keydown', function(e) {               //When keydown is initiated
    if (e.which === 17 || e.which === 91) {               //if the key pressed is ctrl or command
      ctrlClicked = true;                                   //ctrlClicked becomes true
    }
  });

  $(document).on('keyup', function(e){                  //When keyup is initiated
    if (e.which === 17 || e.which === 91) {               //if the key pressed is ctrl or command
      ctrlClicked = false;                                  //ctrlClicked becomes false
    }
  });
});
