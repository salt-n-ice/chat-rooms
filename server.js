const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const mongoose = require("mongoose");

const http = require("http").Server(app);
const io = require("socket.io")(http);

var clients = [];

app.use(express.static("public"));
app.use(bodyParser.urlencoded({
  extended: true
}));
mongoose.connect("mongodb+srv://admin-prakhar:dragonslayer@cluster0.0c4sc.mongodb.net/rooms", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
mongoose.set("useFindAndModify", false);

const roomSchema = new mongoose.Schema({
  name: String,
  user: Array //{name: String, message: String}
});

const Room = mongoose.model("Room", roomSchema);

app.get("/", function(req, res) {
  res.sendFile(__dirname + "/index.html");
});

io.on("connection", function(socket) {
  //console.log("a user connected");
  socket.on("newPerson", function({room, name}){
    let foundRoom = clients.some(function(e){return e.room==room;});
    let ok;
    if(!foundRoom){
      socket.join(room);
      clients.push({room: room, name: name, id: socket.id});
      let result = null;
      ok = true;
      socket.emit("initData", {result, ok});
    }
    else{
      let foundUser = clients.some(function(e){return e.name==name;})
      if(!foundUser){
        socket.join(room);
        clients.push({room: room, name: name, id: socket.id});
        let rname = name;
        socket.broadcast.in(room).emit("broadcastJoining", {rname});
        Room.findOne({name: room}, function(err, data){
          if(err) console.log(err);
          else{
            ok = true;
            if(data) result = data.user;
            else result = null;
            socket.emit("initData", {result, ok});
          }
        })
      }
      else{
        ok = false;
        let result = null;
        socket.emit("initData", {result, ok});
      }

    }

  })
  socket.on("newMessage", function({room, name, message}){
      Room.findOneAndUpdate({ name: room},{$push: { user: [{name: name, message: message}] } },
        {upsert: true, new: true, setDefaultsOnInsert: true},function(err, result) {
        if(result.user.length>=20){
          Room.updateOne({name: room}, {$pop : {user: -1}}, function(err, result){
            if(err) console.log(err);
          });
        }
        let rname = name, rmessage = message;
        io.sockets.in(room).emit("broadcastNewMessage", { rname, rmessage});
      });


  });
  socket.on("typing", function({room, name}){
    let rname = name;
    socket.broadcast.in(room).emit("broadcastTyping", {rname});
  })
  socket.on("disconnect", function() {
    //console.log("a user disconnected");
    let index, foundIn = false;
    for(var i=0; i<clients.length; ++i){
      if(clients[i].id==socket.id){
        foundIn = true;
        index = i;
      }
    }
    if(foundIn){
      clients.splice(index,1);
      //console.log(clients);
    }
    else{
      //console.log("not found!");
    }

  })
})



http.listen(process.env.PORT || 3000, function() {
  console.log("Server started...");
})
