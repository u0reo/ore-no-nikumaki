import * as app from './app';

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
    addTicketDB(num.value, document.getElementById('order-taretare-count').value, document.getElementById('order-shioshio-count').value, document.getElementById('order-tareshio-count').value);
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

app.orders.orderBy('num', 'desc').limit(1).get().then((snapshot) => {
    let num = (snapshot.empty ? 100 : (snapshot.docs[0].data().num + 1));
    document.getElementById('order-num').value = num;
});

function checkTicketDB(num, callback) {
    app.orders.doc(num.toString()).get().then((doc) => {
        if (!doc.exists) callback(num);
        else alert(num + '番は既に使われています');
    });
}

function addTicketDB(num, taretare, shioshio, tareshio) {
    lastOrderData = { num: parseInt(num), secret: createCode(),
        taretare: parseInt(taretare), shioshio: parseInt(shioshio), tareshio: parseInt(tareshio),
        datetime: app.getFirebaseDateTime(), call: false, hand: false, cancel: false };
    app.orders.doc(num).set(lastOrderData);
    app.general.update({ itemCount: (app.itemCount + parseInt(taretare) + parseInt(shioshio) + parseInt(tareshio)) });
}

//ランダム文字列生成
function createCode(){
    var c = 'abcdefghijklmnopqrstuvwxyz0123456789';
    var r = '';
    for (var i = 0; i < 8; i++) {
        r += c[Math.floor(Math.random() * c.length)];
    }
    return r;
}

app.generalRefresh(() => document.getElementById('nonfinished-count').textContent = '未完成数: ' + (app.itemCount - app.completeCount) +'個');
const refresh = (snapshot) => {
    document.getElementById('longest-wait').textContent = '最長待ち時間: ' + (snapshot.empty ? 'なし' :
            Math.ceil((new Date().getTime() - snapshot.docs[0].data().datetime.toDate().getTime()) / 60000) + '分');
    clearInterval(forceRefreshIndex);
    forceRefreshIndex = setInterval(forceRefresh, 60000);
}

app.ordersQuery.limit(1).onSnapshot(refresh);
var forceRefreshIndex;
const forceRefresh = () => app.ordersQuery.limit(1).get().then(refresh);