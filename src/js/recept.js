'use strict'

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

setInterval(() => { document.getElementById('time-recept').innerHTML = app.getDatetime(new Date()); }, 1000);

var confirmOK = -1;
var lastOrderData = null;
document.getElementById('order-send').addEventListener('click', () => {
    let taretare = parseInt(document.getElementById('order-taretare-count').value);
    let shioshio = parseInt(document.getElementById('order-shioshio-count').value);
    if (taretare + shioshio <= 0)
        alert('個数が0です、1個以上にしてください。')
    else
        checkTicketDB(document.getElementById('order-num').value, (num) => {
            if (confirmOK !== -1) clearTimeout(confirmOK);
            document.getElementById('order-confirm-ok').disabled = true;
            document.getElementById('order-confirm-description').innerHTML = 
                '受付番号: ' + num + '<br>' +
                '焼き肉のたれ味: ' + taretare + '個<br>' +
                '塩味: ' + shioshio + '個<br><br>' +
                //'たれ味塩味コンビ: ' + tareshio-count + '<br><br>' +
                (taretare + shioshio > 1 ?
                    '<div style="color:red;">★複数この注文があります。<br>必ずまとめてしか受け取れないことを確認してください。<br>分けて受け取る場合は別々の注文にしてください。</div><br>': '') +
                '確定すると自動でレシートが印刷されます<br>' +
                '受け取る際に<b>レシートを見せる</b>かレシートを登録した<b>スマホを見せる</b>ことが必要なことを説明してください。<br>' +
                '2秒経つと「オーダー確定」が押せるようになります';
            orderDialog.show();
            confirmOK = setTimeout(() => { document.getElementById('order-confirm-ok').disabled = false; }, 2000);
        });
});
orderDialog.listen('MDCDialog:accept', () => {
    let num = document.getElementById('order-num');
    addTicketDB(num.value, document.getElementById('order-taretare-count').value,
        document.getElementById('order-shioshio-count').value,
        document.getElementById('order-tareshio-count').value,
        () => {
            printReceipt(lastOrderData);
            document.getElementById('printing-retry').disabled = false;
            document.getElementById('printing-retry').textContent = 'レシート(' + lastOrderData.num + ')の再印刷'
            num.value = parseInt(num.value) + 1;
        });
    document.getElementById('order-taretare-count').value = 0;
    document.getElementById('order-shioshio-count').value = 0;
    document.getElementById('order-tareshio-count').value = 0;
});
document.getElementById('printing-retry').addEventListener('click', () => {
    printReceipt(lastOrderData);
});

function printReceipt(data) {
    var url = 'AutoPrint://?';
    Object.keys(data).forEach((key) => {
        if (key === 'orderTime')
            url += key + '=' + data[key].seconds + '&';
        else
            url += key + '=' + data[key] + '&';
    });
    //url += 'receptnum=' + '127301';
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

function addTicketDB(num, taretare, shioshio, tareshio, then) {
    let code = createCode();
    app.orders.where('secretCode', '==', code).get().then((snapshot) => {
        if (snapshot.empty) {
            lastOrderData = { num: parseInt(num), secretCode: createCode(),
                taretare: parseInt(taretare), shioshio: parseInt(shioshio), tareshio: parseInt(tareshio), devices: [],
                orderTime: app.getFirebaseDateTime(), ship: false, deliver: false, call: false, hand: false, cancel: false,
                leftCount: app.itemCount - app.completeCount + parseInt(taretare) + parseInt(shioshio) + parseInt(tareshio) }
            app.orders.doc(num).set(lastOrderData);
            app.general.update({ itemCount: (app.itemCount + parseInt(taretare) + parseInt(shioshio) + parseInt(tareshio)) });
            then();
        }
        else addTicketDB(num, taretare, shioshio, tareshio, then);
    });
}

//ランダム文字列生成
function createCode() {
    var c = 'abcdefghkmnprstuvwxyz2345678';
    var r = '';
    for (var i = 0; i < 6; i++) {
        r += c[Math.floor(Math.random() * c.length)];
    }
    return r;
}

app.generalRefresh(() => {
    document.getElementById('item-count').textContent = '販売済み数: ' + app.itemCount + '個/1200個';
    document.getElementById('kinken-sheet').textContent = '金券シート: ' + (Math.floor(app.itemCount * 3 / 30) + 1) + '枚目のシート ' + app.itemCount * 3 % 30 + '枚';
    document.getElementById('nonfinished-count').textContent = '未完成数: ' + (app.itemCount - app.completeCount) +'パック';
    document.getElementById('avaeage-call-hand-time').textContent = 'コールから受け渡しまでの平均時間: ' +  Math.ceil(app.averageCallHandTime / 60) + '分';
    document.getElementById('avaeage-order-hand-time').textContent = 'パック作る平均時間: ' + Math.ceil(app.averageOrderCallTime / 60) + '分';
});
const refresh = (snapshot) => {
    document.getElementById('longest-wait').textContent = '最長待ち時間: ' + (snapshot.empty ? 'なし' :
            Math.ceil((new Date().getTime() - snapshot.docs[0].data().orderTime.toDate().getTime()) / 60000) + '分');
    clearInterval(forceRefreshIndex);
    forceRefreshIndex = setInterval(forceRefresh, 60000);
}

app.ordersQuery.limit(1).onSnapshot(refresh);
var forceRefreshIndex;
const forceRefresh = () => app.ordersQuery.limit(1).get().then(refresh);

app.reviewsQuery.onSnapshot((snapshot) =>
    snapshot.docChanges().forEach((data) => {
        if (data.type === 'added') addReview(data.doc);
        else if (data.type === 'modified') {
            document.getElementById('review-' + data.doc.id).remove();
            if (!data.doc.data().block) addReview(data.doc)
        }
        else if (data.type === 'removed')
            document.getElementById('review-' + data.doc.id).remove();
    })
);

function addReview(doc) {
    let d = doc.data();
    let row = document.getElementById('review-table').insertRow(-1);
    row.id = 'review-' + doc.id;
    let cell1 = row.insertCell(-1);
    let cell2 = row.insertCell(-1);
    let cell3 = row.insertCell(-1);
    for (let i = 0; i < d.rate; i++) cell1.innerHTML += '★';
    for (let i = d.rate; i < 5; i++) cell1.innerHTML += '☆';
    cell2.innerHTML = d.body.replace(/\\n/g, '<br>');
    cell3.innerHTML = '<button class="mdc-button">ブロック</button>';
    cell3.children[0].addEventListener('click', (e) => app.reviews.doc(doc.id).update({ block: true }));
}