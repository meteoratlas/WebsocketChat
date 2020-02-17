const express = require("express");
const http = require("http");
const path = require("path");
const socketio = require("socket.io");
const moment = require("moment");
const { addUser, removeUser, getUser, getUsersInRoom } = require("./Users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, "../public");

app.use(express.static(publicDirectoryPath));

io.on("connection", socket => {
  //   console.log("new user connected");

  socket.on("onSendMessage", (msg, callback) => {
    io.emit("sendMessage", msg);
    callback();
  });

  socket.on("onUserNameSubmit", ({ username, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, username, room });

    if (error) {
      return callback(error);
    }

    socket.join(user.room);

    socket.emit("onUserJoined", `Welcome, ${username}!`);

    socket.broadcast.to(user.room).emit("sendMessage", {
      message: `${user.username} has joined the chat.`,
      timestamp: moment().format("h:mm:ss a, MMMM Do YYYY"),
      username: user.username
    });
    callback();
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);
    if (user) {
      io.to(user.room).emit("sendMessage", {
        message: `${user.username} has left the chat.`,
        timestamp: moment().format("h:mm:ss a, MMMM Do YYYY")
      });
    }
  });
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
