var Paydesk = require('../models/paydesk');

var PaydeskBus = {

  sockets_pool: [],

  init: function(io) {

    io.on('connection', (socket) => {

      var timeout_id;

      socket.once('hello', (data) => {
        socket.paydesk_id = data.paydesk_id;
        socket.paydesk_number = data.paydesk_number;
        this.sockets_pool.push(socket);
        this.enablePaydesk(data.paydesk_id);

        // timeout_id = setTimeout(function() {
        //   disablePaydesk(paydesk_id, client_response_callback);
        // },20000);
      });

      // socket.on('paydesk_keepalive', function(data) {
      //   clearTimeout(timeout_id);
      //   timeout_id = setTimeout(function() {
      //     disablePaydesk(paydesk_id, client_response_callback);
      //   },25000);
      // });

      socket.once('disconnect', () => {
        disconnected_socket = this.sockets_pool.find((sock) => { return sock.id == socket.id });
        this.sockets_pool = this.sockets_pool.filter((sock) => { return sock.id != socket.id });
        this.disablePaydesk(disconnected_socket.paydesk_id);
      });

    });

  },

  send: function(paydesk_number, message_string) {
    socket = this.sockets_pool.find((element) => { return element.paydesk_number == paydesk_number });
    if (socket) socket.emit('server_message', { message: message_string });
  },

  disablePaydesk: function(paydesk_id) {
    Paydesk.findOne({ _id: paydesk_id }).exec(function(err, paydesk) {
      if (!paydesk || err) return;
      paydesk.active = false;
      paydesk.save();
      console.log("Paydesk " + paydesk.number + " deactivated.");
    });
  },

  enablePaydesk: function(paydesk_id) {
    Paydesk.findOne({ _id: paydesk_id }).exec(function(err, paydesk) {
      paydesk.active = true;
      paydesk.save();
      console.log("Paydesk " + paydesk.number + " activated.");
    });
  }

};

module.exports = PaydeskBus;
