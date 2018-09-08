import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/storage';

// Initialize Firebase
var config = {
    apiKey: 'AIzaSyBAqxuluLCGZXFxPLFKR63fleZTEqGIqjo',
    authDomain: 'ore-no-nikumaki.firebaseapp.com',
    databaseURL: 'https://ore-no-nikumaki.firebaseio.com',
    projectId: 'ore-no-nikumaki',
    storageBucket: 'ore-no-nikumaki.appspot.com',
    messagingSenderId: '1052018935491'
};
firebase.initializeApp(config);
const db = firebase.firestore();
db.settings({ timestampsInSnapshots: true });
export const fire = firebase;
export const orders = db.collection('orders');
export const general = orders.doc('general');
export const ordersQuery = orders.where('cancel', '==', false).where('hand', '==', false).orderBy('orderTime');
export const items = db.collection('items');
export const itemsQuery = items.orderBy('dateTime');
export const reviews = db.collection('reviews');
export const reviewsQuery = reviews.where('block', '==', false).orderBy('dateTime', 'desc');
export const articles = db.collection('articles');

export function getFirebaseDateTime() {
    return firebase.firestore.Timestamp.now();
}

//generalの値たち
export var limitTime = 600;
export var targetTime = 600;
export var estimateTime = 600;
export var adjustTime = 0;
export var itemCount = 0;
export var riceCount = 0;
export var completeCount = 0;
export var averageOrderCallTime = 0;
export var averageCallHandTime = 0;
//常に同期
general.onSnapshot((snapshot) => {
    let d = snapshot.data();
    limitTime = d.limitTime;
    targetTime = d.targetTime;
    estimateTime = d.estimateTime;
    adjustTime = d.adjustTime;
    itemCount = d.itemCount;
    riceCount = d.riceCount;
    completeCount = d.completeCount;
    averageOrderCallTime = d.averageOrderCallTime;
    averageCallHandTime = d.averageCallHandTime;
    if (generalFunc) generalFunc();
});
var generalFunc = null;
export function generalRefresh(func) { generalFunc = func; }

export function getDatetime(d) {
    var month = d.getMonth() + 1;
    var day = d.getDate();
    var hour = ('0' + d.getHours()).slice(-2);
    var min = ('0' + d.getMinutes()).slice(-2);
    var sec = ('0' + d.getSeconds()).slice(-2);
    return (month + '/' + day + ' ' + hour + ':' + min + ':' + sec);
}