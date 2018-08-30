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
Array.from(document.querySelectorAll('.mdc-text-field'), e => new MDCTextField(e));
Array.from(document.querySelectorAll('.mdc-button'), e => new MDCRipple(e));
new Swiper('#gallery', {
    loop: true,
    centeredSlides: true,
    autoplay: { delay: 6000, disableOnInteraction: false, },
    pagination: { el: '.swiper-pagination', },
    navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev', },
});
document.getElementById('status').addEventListener('resize', (s) =>
    document.getElementById('space').style.height = s.clientHeight + 30);

app.ordersQuery.onSnapshot((snapshot) => {
    snapshot.docChanges().forEach(function (change) {
        if (change.type === 'added') {
            var div = document.createElement('div');
            div.classList.add('waiting-ticket');
            div.textContent = change.doc.data().num;
            div.id = 'ticket-' + div.textContent;
            document.getElementById('waiting-container').appendChild(div);
        }
        if (change.type === 'modified') {
            //console.log('Modified city: ', change.doc.data());
        }
        if (change.type === 'removed') {
            document.getElementById('ticket-' + change.doc.data().num).remove();
        }
    });
});

document.getElementById('secretcode-register').addEventListener('click', () => submitSecretCode(document.getElementById('secretcode').value));

function submitSecretCode(code) {
    app.orders.where('secretCode', '==', code).get().then((snapshot) => {
        if (snapshot.size <= 0)
            alert('正しいシークレットコードを入力してください');
        else {
            var d = snapshot.docs[0].data();
            if (d.cancel) {
                alert('この注文はキャンセル済みです');
                document.getElementById('secretcode').value = '';
                return;
            } else if (d.hand) {
                if (!confirm('この注文は受け取り済みですが、登録しますか？\nレビューなどが行えるようになります。')) return;
            } else if (d.call) {
                alert('既に呼ばれています、すぐに受け取りに来てください。');
            } else {
                registerNotification(snapshot.docs[0]);
            }
            registerOrder(snapshot.docs[0]);
        }
    });
}

function registerOrder(doc) {
    localStorage.setItem(['order'], [doc.id]);
}

function getOrder() {
    return localStorage.getItem(['order']);
}

function registerNotification(doc) {
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
        alert('次の画面で通知を許可すると、完成時に通知を受け取れます！');
        messaging.requestPermission().then(() => {
            console.log('Notification permission granted.');
            messaging.getToken().then((token) => {
                console.log(token);
                app.orders.doc(doc.id).update({ devices: app.fire.firestore.FieldValue.arrayUnion(token) });
            })
            .catch((error) => alert(error));
            return;
        }).catch((error) => console.log('Unable to get permission to notify.', error));
    }
    else document.getElementById('alert-browser').style.display = 'block';
}

if (messaging) {
    messaging.onTokenRefresh(() => messaging.getToken().then((token) =>
        app.orders.doc(getOrder()).update({ devices: app.fire.firestore.FieldValue.arrayUnion(token) })));
    messaging.onMessage((payload) => {
        /////通知設定時のみ
    });
}

function getReting() {
    var val = 0;
    Array.from(document.getElementsByName('rating'), (e) => val = e.checked ? e.value : 0);
    return val;
}

/*var confirmOK = -1;
document.getElementById('review-send').addEventListener('click', () => {
    var rating = getReting();
    if (document.getElementById('review-secret').value === '')
        alert('シークレットコードは必須です、注文したレシートに記載されたものを入力してください');
    else if (rating <= 0)
        alert('星評価は必須です、5段階評価してください。');
    else {
        if (confirmOK !== -1) clearTimeout(confirmOK);
        var ratingString = '';
        for (var i = 0; i < rating; i++) ratingString += '★';
        for (var i = rating; i < 5; i++) ratingString += '☆';
        document.getElementById('review-confirm-ok').disabled = true;
        document.getElementById('review-confirm-description').innerText =
            ratingString + '\n' +
            document.getElementById('review-body').innerText + '\n\n' +
            '3秒経つとOKが押せるようになります';
        reviewDialog.show();
        confirmOK = setTimeout(() => { document.getElementById('review-confirm-ok').disabled = false; }, 3000);
    }
});*/

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