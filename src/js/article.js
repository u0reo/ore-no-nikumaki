import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/storage';

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

import { MDCRipple } from '@material/ripple';

var storageRef = firebase.storage().ref(); 
const db = firebase.firestore();
db.settings({ timestampsInSnapshots: true });
db.collection('articles').doc(location.search.substring(1)).get().then((doc) => {
        let data = doc.data();
        let card = document.createElement('div');
        card.id = 'article-card';
        card.className = 'mdc-card mdc-ripple-upgraded';
        card.style.margin = '5px';
        card.innerHTML = 
          '<div class="mdc-card__media mdc-card__media--square">読み込み中...</div>'+
          '<div class="card-primary">'+
            '<h2 class="mdc-typography--headline6"></h2>'+
            '<h3 class="mdc-typography--subtitle2"></h3>'+
          '</div>'+
          '<div class="card-secondary mdc-typography--body2"></div>'+
          '<div class="mdc-typography--body2" style="text-align: right; margin-right: 5px; color: gray;">タップして元サイトへ</div>';
        card.getElementsByClassName('mdc-typography--headline6')[0].textContent = data.title;
        card.getElementsByClassName('mdc-typography--subtitle2')[0].textContent = data.subtitle;
        card.getElementsByClassName('mdc-typography--body2')[0].textContent = data.body;
        card.addEventListener('click', () => {
          window.top.location.href = 'https://俺の肉巻き.tk/?article=' + doc.id;
        })
        storageRef.child(doc.id + '.jpg').getDownloadURL().then((url) => {
            card.getElementsByClassName('mdc-card__media')[0].textContent = '';
            card.getElementsByClassName('mdc-card__media')[0].style.backgroundImage = 'url(' + url + ')';
        });
        new MDCRipple(card);
        document.body.appendChild(card);
})