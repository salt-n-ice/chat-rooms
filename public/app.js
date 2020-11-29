var messageBox = document.querySelector(".messages");


var socket = io();
var name, room, message;
var detachRoomPage = $(".room-page").detach();

$(".typing").text("");
var detachTyping = $(".typing").detach();

                 /*********************   entering into the room      ************************/
$(document).on("click", ".submit", function() {

  $(".name-repetition").remove();
  name = $(".name").val();
  room = $(".room").val();
  socket.emit("newPerson", {room, name});
})
                 /*********************  sending message inside a room   ****************************/
$(document).on("click", ".send", function() {
  message = $(".msg").val();
  if(message!="") socket.emit("newMessage", {room, name, message});
  $(".msg").val("");
});
$(document).on("keydown", function(event){
  if(room!=undefined && event.which==13){
    message = $(".msg").val();
    if(message!="") socket.emit("newMessage", {room, name, message});
    $(".msg").val("");
  }
});
var typing = setInterval(function(){
  if($(".msg").val()!=""){
    socket.emit("typing", {room, name});
  }
}, 2000);

          /*********************  logging saved messages   ****************************/
socket.on("broadcastJoining", function({rname}){
    $(".messages").append("<div class='new-joined'><p><em>"+rname+"</em> has joined the room</p></div>");
})

socket.on("initData", function({result, ok}) {
  console.log(ok);
  if(ok){
    $(".entry").detach();
    $("body").append(detachRoomPage);
    //$("body").css("background-image", "url('')")
    $(".room-name").text(room);
    if(result){
      result.forEach(function(user) {
        if(user.message!=""){
          if(user.name==name){
            $(".messages").append("<div class = 'a-message-box' style='margin-left: auto; margin-right: 0;'><h4>" + user.name + "</h4>" + "<p>" + user.message + "</p></div>")
          }
          else{
            $(".messages").append("<div class = 'a-message-box'><h4>" + user.name + "</h4>" + "<p>" + user.message + "</p></div>");
          }

        }
      })

      messageBox.scrollTop = messageBox.scrollHeight-messageBox.clientHeight;
    }
  }
  else{
    $(".name-field").append("<p class='name-repetition'> this name has already been taken by someone in this room</p>");
  }

});

socket.on("broadcastNewMessage", function({rname, rmessage}){
  if(rname==name){
    $(".messages").append("<div class = 'a-message-box' style='margin-left: auto; margin-right: 0;'><h4>" + rname + "</h4>" + "<p>" + rmessage + "</p></div>");
  }
  else
  $(".messages").append("<div class = 'a-message-box'><h4>" + rname + "</h4>" + "<p>" + rmessage + "</p></div>");
  messageBox.scrollTop = messageBox.scrollHeight-messageBox.clientHeight;
});

socket.on("broadcastTyping", function({rname}){
  let val = $(".typing").text();
  if(!val)
  $(".typing").text(rname+" is typing...");
  else{
    $(".typing").text("");
    $(".typing").text("many people are typing...");
  }
  messageBox.scrollTop = messageBox.scrollHeight-messageBox.clientHeight;
          setTimeout(function(){
            $(".typing").html("");
          }, 1000);
})
