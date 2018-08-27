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
var lastOrderData = null;
document.getElementById('order-send').addEventListener('click', () => {
    if (parseInt(document.getElementById('order-taretare-count').value) <= 0 && document.getElementById('order-shioshio-count').value <= 0)
        alert('個数が0です、1個以上にしてください。')
    else
        checkTicketDB(document.getElementById('order-num').value, (num) => {
            if (confirmOK !== -1) clearTimeout(confirmOK);
            document.getElementById('order-confirm-ok').disabled = true;
            document.getElementById('order-confirm-description').innerText = 
                '受付番号: ' + num + '\n' +
                '焼き肉のたれ味セット: ' + document.getElementById('order-taretare-count').value + '\n' +
                '塩味: ' + document.getElementById('order-shioshio-count').value + '\n\n' +
                '確定すると自動でレシートが印刷されます\n\n' +
                '3秒経つと「オーダー確定」が押せるようになります';
            orderDialog.show();
            confirmOK = setTimeout(() => { document.getElementById('order-confirm-ok').disabled = false; }, 3000);
        });
});
orderDialog.listen('MDCDialog:accept', () => {
    let num = document.getElementById('order-num');
    addTicketDB(num.value, document.getElementById('order-taretare-count').value, document.getElementById('order-shioshio-count').value);
    printReceipt(lastOrderData);
    document.getElementById('printing-retry').disabled = false;
    document.getElementById('printing-retry').textContent = 'レシート(' + lastOrderData.num + ')の再印刷'
    num.value = parseInt(num.value) + 1;
});
document.getElementById('printing-retry').addEventListener('click', () => {
    printReceipt(lastOrderData);
});

function printReceipt(data){
    var url = 'AutoPrint://?';
    Object.keys(data).forEach((key) => {
        if (key === 'datetime')
            url += key + '=' + data[key].seconds + '&';
        else
            url += key + '=' + data[key] + '&';
    });
    url += 'receptnum=' + '127301';////////////////////////////////
    console.log(url);
    document.getElementById('hidden-frame').contentDocument.location.replace(url);
}

const db = firebase.firestore();
db.settings({ timestampsInSnapshots: true });
const orders = db.collection('orders');
const general = orders.doc('general');

var targetTime = 600;
var estimateTime = 600;
var itemCount = 0;
var riceCount = 0;

general.onSnapshot((snapshot) => {
    let d = snapshot.data();
    targetTime = d.targetTime;
    estimateTime = d.estimateTime;
    itemCount = d.itemCount;
    riceCount = d.riceCount;
});

orders.orderBy('num', 'desc').limit(1).get().then((snapshot) => {
    let num = (snapshot.empty ? 100 : (snapshot.docs[0].data().num + 1));
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

function addTicketDB(num, taretare, shioshio) {
    lastOrderData = { num: parseInt(num), secret: createCode(),
        taretare: parseInt(taretare), shioshio: parseInt(shioshio), tareshio: 0,/////////////////////////////
        datetime: firebase.firestore.Timestamp.now(), call: false, hand: false, cancel: false };
    orders.doc(num).set(lastOrderData);
    general.update({ itemCount: itemCount + taretare + shioshio });
}

//ランダム文字列生成
function createCode(){
    var c = "abcdefghijklmnopqrstuvwxyz0123456789";
    var r = "";
    for (var i = 0; i < 8; i++) {
        r += c[Math.floor(Math.random() * c.length)];
    }
    return r;
}

const refresh = (snapshot) => {
    let count = 0;
    snapshot.forEach((doc) => {
        count += parseInt(doc.data().taretare);
        count += parseInt(doc.data().shioshio);
    });
    document.getElementById('nonfinished-count').textContent = '未完成数: ' + count + '個';
    document.getElementById('longest-wait').textContent = '最長待ち時間: ' + (snapshot.empty ? 'なし' :
            Math.ceil((new Date().getTime() - snapshot.docs[0].data().datetime.toDate().getTime()) / 60000) + '分');
    clearInterval(forceRefreshIndex);
    forceRefreshIndex = setInterval(forceRefresh, 60000);
}

var ordersQuery = orders.where('cancel', '==', false).where('hand', '==', false).orderBy('datetime');
ordersQuery.onSnapshot(refresh);

var forceRefreshIndex;
const forceRefresh = () => {
    ordersQuery.get().then(refresh);
}