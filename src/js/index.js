import * as app from './app';
import 'firebase/storage';

const storage = app.fire.storage().ref();
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

function getReting(){
    var val = 0;
    Array.from(document.getElementsByName('rating'), (e) => {
        if (e.checked) val = e.value;
    });
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