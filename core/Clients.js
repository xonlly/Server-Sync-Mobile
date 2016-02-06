"use strict"

const Sockets  = require('./Sockets')

class Clients {
  constructor(config) {
    this.mobiles = new Sockets(config.port_mobile || 8121);
    this.clients = require('socket.io')()
    this.clients.on('connection', (socket) => {
      console.log('New Client.')
      this.onClient(socket);
    })
    this.clients.listen(config.port_client || 3000);

    this.mobiles.newClient = (id, ws) => {

      console.log('New Mobile.')
      ws.prototype.on('contacts', (d) => {
        this.dispatchMobile('contacts', { id, id, data : d } )
      })

      this.dispatch('clients', this.mobiles.getClients())

    }

    this.listLisent = {}
    this.listLisentMobile = {}
  }

  listenMobile(type, func) {
    if (!this.listLisentMobile[type]) {
      this.listLisentMobile[type] = []
    }
    this.listLisentMobile[type].push(func)
  }

  dispatchMobile(type, data) {
    (this.listLisentMobile[type] || []).map(function (func) {
      func(data)
    })
  }

  listen(type, socket) {
    if (!this.listLisent[type]) {
      this.listLisent[type] = []
    }
    this.listLisent[type].push(socket)
  }

  dispatch(type, data) {
    (this.listLisent[type] || []).map(function (socket) {
      if (socket.connected) {
        socket.emit(type, data)
      }
    })
  }

  onClient(socket) {

    // Ecoute les clients en live.
    this.listen('clients', socket);

    this.listen('sms', socket);


    socket.on('sms', (data) => {
      this.mobiles.sendToClient(data.client, 'sms', data.content)
    })

    this.listenMobile('contacts', (data) => {
      socket.emit('contacts', data);
    })



    // Send les clients courent
    this.dispatch('clients', this.mobiles.getClients())
  }
}


module.exports = Clients;
