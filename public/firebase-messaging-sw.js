importScripts('/__/firebase/5.0.4/firebase-app.js');
importScripts('/__/firebase/5.0.4/firebase-messaging.js');
importScripts('/__/firebase/init.js');

const messaging = firebase.messaging();

messaging.setBackgroundMessageHandler(function (payload) {
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: payload.notification.icon
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('install', function (event) {
    console.log('Service Worker installing.');
});

self.addEventListener('activate', function (event) {
    console.log('Service Worker activating.');
});