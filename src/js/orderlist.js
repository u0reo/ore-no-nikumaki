import firebase from 'firebase/app';
import 'firebase/firestore';

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

var dateOrders = {};

setInterval(() => {
    document.getElementById('time-fixed').innerHTML = new Date().toLocaleString();
    Object.keys(dateOrders).forEach((key) => {
        let row = document.getElementById('order-' + key)
        let sec = (new Date().getTime() - dateOrders[key].getTime()) / 1000;
        row.style.backgroundColor = 'rgba(' + (row.classList.contains('call') ? '169,130,116,' : '217,108,179,') + (sec / targetTime) + ')';
        document.getElementById('time-order-' + key).textContent = Math.floor(sec / 60) + ':' + ('00' + Math.floor(sec % 60)).slice(-2);
    });
}, 1000);

var targetTime = 600;
var estimateTime = 600;
var itemCount = 0;
var riceCount = 0;

db.collection('orders').doc('general').onSnapshot((snapshot) => {
    let d = snapshot.data();
    targetTime = d.targetTime;
    estimateTime = d.estimateTime;
    itemCount = d.itemCount;
    riceCount = d.riceCount;
});

var ordersQuery = db.collection('orders').where('cancel', '==', false).where('hand', '==', false).orderBy('datetime');
ordersQuery.onSnapshot((snapshot) =>
    snapshot.docChanges().forEach((data) => {
        if (data.type === 'added')
            addOrder(data.doc);
        else if (data.type === 'removed') {
            document.getElementById('order-' + data.doc.id).remove();
            delete dateOrders[data.doc.id];
        }
        else if (data.type === 'modified') {
            let row = document.getElementById('order-' + data.doc.id);
            let d = data.doc.data();
            if (d.hand || d.cancel) {
                row.remove();
                delete dateOrders[data.doc.id];
            }
            if (d.call) {
                dateOrders[data.doc.id] = data.doc.data().calledDatetime.toDate();
                row.classList.add('call');
                row.getElementsByClassName('order-next')[0].textContent = '受け渡し';
                row.getElementsByClassName('order-cancel')[0].textContent = 'コール取り消し';
            }
            else {
                dateOrders[data.doc.id] = data.doc.data().datetime.toDate();
                row.classList.remove('call');
                row.getElementsByClassName('order-next')[0].textContent = 'コール';
                row.getElementsByClassName('order-cancel')[0].textContent = 'キャンセル';
            }
        }
    })
);

function addOrder(doc) {
    let d = doc.data();
    dateOrders[d.num] = (d.call ? d.calledDatetime.toDate() : d.datetime.toDate());
    let row = document.getElementById('order-table').insertRow(-1);
    row.id = 'order-' + d.num;
    if (d.call) row.classList.add('call');
    let cell1 = row.insertCell(-1);
    let cell2 = row.insertCell(-1);
    let cell3 = row.insertCell(-1);
    let cell4 = row.insertCell(-1);
    let cell5 = row.insertCell(-1);
    let cell6 = row.insertCell(-1);
    let cell7 = row.insertCell(-1);
    cell1.innerHTML = d.num;
    cell2.innerHTML = d.taretare;
    cell3.innerHTML = d.shioshio;
    cell4.innerHTML = d.datetime.toDate().toLocaleString();
    cell5.innerHTML = '--:--';
    cell5.id = 'time-order-' + d.num;
    cell6.innerHTML = '<button class="mdc-button order-next">' + (d.call ? '受け渡し' : 'コール') + '</button>';
    cell6.children[0].addEventListener('click', (e) => {
        if (getParent(e.target).classList.contains('call'))
            db.collection('orders').doc(getNum(e.target)).update({ hand: true });
        else
            db.collection('orders').doc(getNum(e.target)).update({ call: true, calledDatetime: firebase.firestore.Timestamp.now() });
    });
    cell7.innerHTML = '<button class="mdc-button order-cancel">' + (d.call ? 'コール取り消し' : 'キャンセル') + '</button>';
    cell7.children[0].addEventListener('click', (e) => {
        if (getParent(e.target).classList.contains('call'))
            db.collection('orders').doc(getNum(e.target)).update({ call: false });
        else
            db.collection('orders').doc(getNum(e.target)).update({ cancel: true });
    });
}

function getParent(element){
    return element.parentNode.parentNode;
}

function getNum(element){
    return getParent(element).id.substr(6);
}