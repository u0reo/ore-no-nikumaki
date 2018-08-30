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
export const ordersQuery = orders.where('cancel', '==', false).where('hand', '==', false).orderBy('datetime');
export const articles = db.collection('articles');

export function getFirebaseDateTime() {
    return firebase.firestore.Timestamp.now();
}

//generalの値たち
export var targetTime = 600;
export var estimateTime = 600;
export var itemCount = 0;
export var riceCount = 0;
export var completeCount = 0;
//常に同期
general.onSnapshot((snapshot) => {
    let d = snapshot.data();
    targetTime = d.targetTime;
    estimateTime = d.estimateTime;
    itemCount = d.itemCount;
    riceCount = d.riceCount;
    completeCount = d.completeCount;
    if (generalFunc) generalFunc();
});
var generalFunc = null;
export function generalRefresh(func) { generalFunc = func; }