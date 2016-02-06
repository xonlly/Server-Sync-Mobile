"use strict"

const WebSocketServer = require('ws').Server;

class Sockets {

  constructor(port) {
    this.wss = new WebSocketServer({ port: port });
    console.log('Server listen port '+port)

    this.listen()

    this.ids = 0;
    this.clients = {}
    this.onListenners = {}
  }

  saveClient(ws) {
    this.clients[this.ids] = ws;
    ws.id = this.ids;
    this.newClient && this.newClient(this.ids, ws)
    this.ids++;
  }

  sendToClient(id, type, data) {
    if (!this.clients[id]) {
      console.log('Client dont exist');
      return
    }
    try {
      this.clients[id].send(JSON.stringify({
        type : type,
        data : data
      }))
    } catch (e) {
      console.trace('Fail on stringify data.')
    }
  }

  getClients() {
    return Object.keys(this.clients)
  }

  on(type, func) {
    if (!this.onListenners[type]) {
      this.onListenners[type] = []
    }
    this.onListenners[type].push(func)
  }

  dispatchToOn(type, data) {
    if (!this.onListenners[type] || !this.onListenners[type].length) return;

    this.onListenners[type].map((func) => {
      func(data)
    })
  }

  listen() {
    this.wss.on('connection', (ws) => {

      ws.prototype = ws.prototype || { onListenners : {} }
      ws.prototype.on = function (type, func) {
        if (!this.onListenners[type]) {
          this.onListenners[type] = []
        }
        this.onListenners[type].push(func)
      }
      ws.prototype.dispatch = function (type, data) {
        if (!this.onListenners[type] || !this.onListenners[type].length) return;

        this.onListenners[type].map((func) => {
          func(data)
        })
      }
      ws.prototype.emit = function (type, data) {
        try {
          ws.send(JSON.stringify({ type : type, data : data }))
        } catch (e) {
          console.trace('Fail on stringify emit.')
        }
      }

      this.saveClient(ws)


      ws.on('message', (msg) => {
        try {

          const data = JSON.parse(msg)

          this.dispatchToOn(data.type, data.data)
          ws.prototype.dispatch(data.type, data.data)

        } catch (e) {
          console.trace('Fail on parse getted message.', msg)
        }

      })

    });
  }

}

module.exports = Sockets;
