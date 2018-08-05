import firebase from 'firebase/app';
import 'firebase/firestore';

// Initialize Firebase
var config = {
    apiKey: "AIzaSyBAqxuluLCGZXFxPLFKR63fleZTEqGIqjo",
    authDomain: "ore-no-nikumaki.firebaseapp.com",
    databaseURL: "https://ore-no-nikumaki.firebaseio.com",
    projectId: "ore-no-nikumaki",
    storageBucket: "ore-no-nikumaki.appspot.com",
    messagingSenderId: "1052018935491"
};
firebase.initializeApp(config);

setInterval(() => { document.getElementById('time-fixed').innerHTML = new Date().toLocaleString(); }, 1000);

import { MDCRipple } from '@material/ripple';
Array.from(document.querySelectorAll('.mdc-button'), e => new MDCRipple(e));

const db = firebase.firestore();
db.settings({ timestampsInSnapshots: true });
var orders = db.collection("orders");

const refresh = (snapshot) => {
    document.getElementById('order-table').innerHTML = '<tbody></tbody>';
    snapshot.forEach((doc) => {
        let d = doc.data();
        let row = document.getElementById('order-table').insertRow(-1);
        let cell1 = row.insertCell(-1);
        let cell2 = row.insertCell(-1);
        let cell3 = row.insertCell(-1);
        let cell4 = row.insertCell(-1);
        let cell5 = row.insertCell(-1);
        let cell6 = row.insertCell(-1);
        let cell7 = row.insertCell(-1);
        cell1.innerHTML = d.num;
        cell2.innerHTML = d.yakinikuCount;
        cell3.innerHTML = d.shioCount;
        cell4.innerHTML = d.date.toDate().toLocaleString();
        cell5.innerHTML = '--:--';
        cell6.innerHTML = '<button class="mdc-button">キャンセル</button>';
        cell7.innerHTML = '<button class="mdc-button">完了</button>';
    });
}
var ordersQuery = orders.where("cancel", "==", false).where("finish", "==", false).orderBy("date");
ordersQuery.onSnapshot(refresh);