var settings = {
  gcm: {
    id: 'AIzaSyDzvkSdWHLOEKHw4ZIgwzkqNb-L4YBQGQw',
    msgcnt: 1,
    dataDefaults: {
      delayWhileIdle: false,
      timeToLive: 4 * 7 * 24 * 3600, // 4 weeks
      retries: 4,
    },
    // Custom GCM request options https://github.com/ToothlessGear/node-gcm#custom-gcm-request-options
    options: {},
  }
};
var PushNotifications = new require('node-pushnotifications');
module.exports = new PushNotifications(settings);
