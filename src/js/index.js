'use strict'

import * as app from './app';
import 'firebase/storage';
import 'firebase/messaging';

const storage = app.fire.storage().ref();
var messaging;
try { messaging = app.fire.messaging(); }
catch (ex) { messaging = null; }
if (messaging) messaging.usePublicVapidKey('BM8Ls9TL_hP1RuMKEldeSqRTgAoLxauVwQ4DfD5geIWmjh0-4lnDrYo6TxTQMXcI4fbTlREVEvz4xhS0J_dugYA');
import { MDCTextField } from '@material/textfield';
import { MDCRipple } from '@material/ripple';
import { MDCDialog } from '@material/dialog';
Array.from(document.querySelectorAll('.mdc-text-field'), e => new MDCTextField(e));
Array.from(document.querySelectorAll('.mdc-button'), e => new MDCRipple(e));
const reviewDialog = new MDCDialog(document.getElementById('review-post'));
new Swiper('#gallery', {
    loop: true,
    centeredSlides: true,
    autoplay: { delay: 6000, disableOnInteraction: false, },
    pagination: { el: '.swiper-pagination', },
    navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev', },
});
document.getElementById('status').addEventListener('resize', (s) =>
    document.getElementById('space').style.height = s.clientHeight + 30);

document.getElementById('secretcode-register').addEventListener('click', () => submitSecretCode(document.getElementById('secretcode').value));
document.getElementById('order-delete').addEventListener('click', () => {
    if (confirm('このオーダーの登録を消しますか？\nオーダーはキャンセルされません。'))
        deleteOrder();
})

var order = undefined;
var notification = false;
try {
    order = localStorage.getItem('order');
    notification = (localStorage.getItem('notification') === 'true');
}
catch (ex) { order = undefined; }
if (order)
    app.orders.doc(order).get().then((snapshot) => {
        if (snapshot.exists && !snapshot.data().cancel) registerOrder(order);
        else deleteOrder();
    });
    
function submitSecretCode(secretCode) {
    if (order) {
        var sc;
        try {
            sc = localStorage.getItem('secretCode');
        } catch (ex) {}
        if (sc !== secretCode) {
            if (confirm('既に' + order + '番の注文が登録されています、この注文で上書きしますか？注文の再登録は可能です。')) {
                deleteOrder();
                submitSecretCode(code);
            }
        }
    } 
    else
        app.orders.where('secretCode', '==', secretCode).get().then((snapshot) => {
            if (snapshot.size <= 0)
                alert('正しいシークレットコードを入力してください');
            else {
                var d = snapshot.docs[0].data();
                if (d.cancel) {
                    alert('この注文はキャンセル済みです');
                    document.getElementById('secretcode').value = '';
                    return;
                }
                else if (d.hand) {
                    if (!confirm('この注文は受け取り済みですが、登録しますか？\nレビューなどが行えるようになります。')) return;
                }
                registerNotification(snapshot.docs[0].id);
                registerOrder(snapshot.docs[0].id, secretCode);
                refreshOrderStatus(d, true);
            }
        });
}

function registerOrder(id, secretCode) {
    order = id
    if (!'localStorage' in window)
        alert('クッキー(cookie)が利用できない環境では正しくご利用できません。');
    else
        try {
            localStorage.setItem('order', id);
            if (secretCode) localStorage.setItem('secretCode', secretCode);
        }
        catch (ex) {
            alert('SafariのプライベートブラウザなどのlocalStorageが無効の環境では正しくご利用できません。');
        }
    document.getElementById('status-secretcode-container').style.display = 'none';
    document.getElementById('status-ticket-container').style.display = 'block';
    document.getElementById('status-ticket').textContent = id;
}

function deleteOrder() {
    order = undefined;
    localStorage.removeItem('order');
    localStorage.removeItem('secretCode');
    localStorage.removeItem('notification');
    document.getElementById('status-secretcode-container').style.display = 'block';
    document.getElementById('status-ticket-container').style.display = 'none';
}

function registerNotification(id) {
    /*if (navigator.serviceWorker) {
        navigator.serviceWorker.register('./firebase-messaging-sw.js').then(() => {
            return navigator.serviceWorker.ready;
        }).catch((error) => {
            console.error(error);
        }).then((registration) => {
            messaging.useServiceWorker(registration);
            document.getElementById('alert-browser').disabled = false;
        });
    }*/
    if (window.Notification && messaging) {
        var already = (Notification.permission === 'granted');
        if (!already)
            alert('次の画面で通知を許可すると、完成時に通知を受け取れます！');
        messaging.requestPermission().then(() => {
            //console.log('Notification permission granted.');
            messaging.getToken().then((token) => {
                //console.log(token);
                if (already) alert('通知を設定しました');
                app.orders.doc(id).update({ devices: app.fire.firestore.FieldValue.arrayUnion(token) });
                try { localStorage.setItem('notification', 'true'); notification = true; }
                catch (ex) { }
            })
            .catch((error) => alert('通知の登録に失敗しました…\n\n' + error));
            return;
        }).catch((error) => console.log('Unable to get permission to notify.', error));
    }
    else document.getElementById('alert-browser').style.display = 'block';
}

if (messaging && order) {
    messaging.onTokenRefresh(() => messaging.getToken().then((token) =>
        app.orders.doc(order).update({ devices: app.fire.firestore.FieldValue.arrayUnion(token) })));
    messaging.onMessage((payload) => {
        //console.log(payload);
        new Notification(payload.notification.title, {
            body: payload.notification.body,
            icon: payload.notification.icon,
            click_action: payload.notification.click_action
        });
    });
}

var refresh = (snapshot) => {
    snapshot.docChanges().forEach(function (change) {
        var d = change.doc.data();
        if (change.type === 'added' || change.type === 'modified') {
            if ((d.call) && !document.getElementById('ticket-' + change.doc.id)) {
                var div = document.createElement('div');
                div.classList.add('order-ticket');
                div.textContent = change.doc.id;
                div.id = 'ticket-' + change.doc.id;
                document.getElementById('complete-container').appendChild(div);
            }
            else if ((!d.call || d.hand) && document.getElementById('ticket-' + change.doc.id))
                document.getElementById('ticket-' + change.doc.id).remove();
        }
        if (change.type === 'removed' && document.getElementById('ticket-' + change.doc.id)) {
            document.getElementById('ticket-' + change.doc.id).remove();
        }

        if (change.doc.id === order)
            refreshOrderStatus(d);
    });
    clearInterval(forceRefreshIndex);
    forceRefreshIndex = setInterval(forceRefresh, 60000);
};

function refreshOrderStatus(d, flag) {
    console.log(d);
    if (!d.call) {
        //呼ばれていない
        document.getElementById('status-text').textContent = '予想待ち時間: ' + Math.floor((d.orderTime.toDate().getTime() + app.targetTime * 1000 - new Date().getTime()) / 60000) + '分';
    }
    else if (!d.hand) {
        //受け取っていない
        var text = document.getElementById('status-text').textContent;
        if (text !== '完成しました' && flag === undefined/* && !notification*/) alert('完成しました\n今すぐ受け取りに来てください！');
        document.getElementById('status-text').textContent = '完成しました';
        document.getElementById('status-button').textContent = '地図';
    }
    else {
        //受け取った
        document.getElementById('status-text').textContent = 'ありがとうございました';
        document.getElementById('status-button').textContent = 'レビュー';
        document.getElementById('status-button').addEventListener('click', () => reviewDialog.show());
    }
}

app.ordersQuery.onSnapshot(refresh);
var forceRefreshIndex;
const forceRefresh = () => app.ordersQuery.get().then(refresh);

function getReting() {
    var val = 0;
    var array = Array.from(document.getElementsByName('rating'), (e) => val = e.checked ? e.value : 0);
    array.forEach((index) => { if (index !== 0) val = parseInt(index); });
    return val;
}

document.getElementById('review-start').addEventListener('click', () => {
    if (!order) alert('オーダーを登録してください');
    else reviewDialog.show();
});

document.getElementById('review-send').addEventListener('click', () => {
    var rating = getReting();
    if (!order){
        alert('オーダーを登録してください');
    }
    else if (rating <= 0)
        alert('星評価は必須です、5段階評価してください。');
    else if (false) { //////スパム
        
    }
    else {
        app.reviews.doc(order).set({ num: order, dateTime: app.getFirebaseDateTime(),
            rate: rating, body: document.getElementById('review-body').innerText, block: false });
        reviewDialog.close();
        document.getElementById('review-body').innerText = '';
    }
});

if (location.search.indexOf('article') >= 0) {
    var rect = document.getElementById('small-blog-header').getBoundingClientRect();
    window.scrollTo(rect.left, rect.top);
}

var articleId = null;
var datalist = location.search.substring(1).split('&');
if (datalist) {
    var datasplit = datalist[0].split('=');
    if (datasplit[0] === 'article')
        articleId = datasplit[1];
    else if (datasplit[0] === 's')
        submitSecretCode(datasplit[1]);
}


app.articles.get().then((snapshot) => {
    var smallBlog = document.querySelector('#small-blog .swiper-wrapper');
    smallBlog.children[0].remove();
    snapshot.forEach((doc) => {
        var data = doc.data();
        var slide = document.createElement('div');
        slide.id = 'slide--' + doc.id;
        slide.className = 'swiper-slide';
        slide.innerHTML = 
        '<div class="mdc-card">'+
            (data.video ?
                '<div class="mdc-card__media mdc-card__media--square"><video autoplay loop>読み込み中...</video></div>':
                '<div class="mdc-card__media mdc-card__media--square">読み込み中...</div>')+
          '<div class="card-primary">'+
            '<h2 class="mdc-typography--headline6"></h2>'+
            '<h3 class="mdc-typography--subtitle2"></h3>'+
          '</div>'+
          '<div class="card-secondary mdc-typography--body2"></div>'+
        '</div>';
        slide.getElementsByClassName('mdc-typography--headline6')[0].textContent = data.title;
        slide.getElementsByClassName('mdc-typography--subtitle2')[0].textContent = data.subtitle;
        slide.getElementsByClassName('mdc-typography--body2')[0].textContent = data.body;
        if (data.video)
            storage.child(doc.id + '.mp4').getDownloadURL().then((url) => {
                slide.getElementsByClassName('mdc-card__media')[0].childNodes[0].src = url;
            });
        else
            storage.child(doc.id + '.jpg').getDownloadURL().then((url) => {
                slide.getElementsByClassName('mdc-card__media')[0].textContent = '';
                slide.getElementsByClassName('mdc-card__media')[0].style.backgroundImage = 'url(' + url + ')';
            });
        //new MDCRipple(slide.getElementsByClassName('mdc-card')[0]);
        smallBlog.insertBefore(slide, smallBlog.firstChild)
    });
    var swiper = new Swiper('#small-blog', {
        centeredSlides: true,
        pagination: { el: '.swiper-pagination', },
        navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev', },
    });
    var jumpElement = document.getElementById('slide--' + articleId);
    if (jumpElement) swiper.slideTo(([].slice.call(smallBlog.childNodes)).indexOf(jumpElement));
});