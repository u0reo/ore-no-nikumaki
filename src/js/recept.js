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

import { MDCTextField } from '@material/textfield';
import { MDCRipple } from '@material/ripple';
import { MDCDialog } from '@material/dialog';
Array.from(document.querySelectorAll('.mdc-text-field'), e => new MDCTextField(e));
Array.from(document.querySelectorAll('.mdc-button'), e => new MDCRipple(e));
const orderDialog = new MDCDialog(document.getElementById('order-confirm'));

Array.from(document.querySelectorAll('.button-up'), e => {
    e.addEventListener('click', () => {
        let i = e.parentElement.querySelector('input');
        let n = parseInt(i.value);
        i.value = n + 1;
    })
});
Array.from(document.querySelectorAll('.button-down'), e => {
    e.addEventListener('click', () => {
        let i = e.parentElement.querySelector('input');
        let n = parseInt(i.value);
        if (n > 0) i.value = n - 1;
    })
});

setInterval(() => { document.getElementById('time').innerHTML = new Date().toLocaleString(); }, 1000);

var confirmOK = -1;
document.getElementById('order-send').addEventListener('click', () => {
    if (parseInt(document.getElementById('order-yakiniku-count').value) <= 0 && document.getElementById('order-shio-count').value <= 0)
        alert('個数が0です、1個以上にしてください。')
    else
        checkTicketDB(document.getElementById('order-num').value, (num) => {
            if (confirmOK !== -1) clearTimeout(confirmOK);
            document.getElementById('order-confirm-ok').disabled = true;
            document.getElementById('order-confirm-description').innerText = 
                '受付番号: ' + num + '\n' +
                '個数(タレ:しょうゆ): ' + document.getElementById('order-yakiniku-count').value + '\n' +
                '個数(タレ:しお): ' + document.getElementById('order-shio-count').value + '\n\n' +
                '3秒経つとOKが押せるようになります';
            orderDialog.show();
            confirmOK = setTimeout(() => { document.getElementById('order-confirm-ok').disabled = false; }, 3000);
        });
});
orderDialog.listen('MDCDialog:accept', () => {
    let num = document.getElementById('order-num');
    addTicketDB(num.value, document.getElementById('order-yakiniku-count').value, document.getElementById('order-shio-count').value);
    num.value = parseInt(on.value) + 1;
})

const db = firebase.firestore();
db.settings({ timestampsInSnapshots: true });
const orders = db.collection('orders');

orders.orderBy('num', 'desc').limit(1).get().then((Snapshot) => {
    let num = (Snapshot.empty ? 100 : (Snapshot.docs[0].data().num + 1));
    document.getElementById('order-num').value = num;
});

function checkTicketDB(num, callback) {
    orders.doc(num.toString()).get().then((doc) => {
        if (!doc.exists)
            callback(num);
        else
            alert(num + '番は既に使われています');
    });
}

function addTicketDB(num, yakinikuCount, shioCount) {
    orders.doc(num).set({ num: parseInt(num), yakinikuCount: parseInt(yakinikuCount), shioCount: parseInt(shioCount),
        date: firebase.firestore.Timestamp.now(), finish: false, cancel: false });
}

const refresh = (querySnapshot) => {
    console.log('refresh');
    let count = 0;
    querySnapshot.forEach((doc) => {
        count += parseInt(doc.data().yakinikuCount);
        count += parseInt(doc.data().shioCount);
    });
    document.getElementById('nonfinished-count').textContent = '未処理数: ' + count + '個';
    if (!querySnapshot.empty)
        document.getElementById('longest-wait').textContent = '最長待ち時間: ' +
            Math.ceil((firebase.firestore.Timestamp.now().seconds - querySnapshot.docs[0].data().date.seconds) / 60) + '分';
    clearInterval(forceRefreshIndex);
    forceRefreshIndex = setInterval(forceRefresh, 60000);
}

var ordersQuery = orders.where('cancel', '==', false).where('finish', '==', false).orderBy('date');
ordersQuery.onSnapshot(refresh);

var forceRefreshIndex;
const forceRefresh = () => {
    ordersQuery.get().then(refresh);
}

/*orders.get().then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
        console.log(doc);
    });
});*/