import * as app from './app';

var dateOrders = {};

setInterval(() => {
    document.getElementById('time-fixed').innerHTML = new Date().toLocaleString();
    Object.keys(dateOrders).forEach((key) => {
        let row = document.getElementById('order-' + key)
        let sec = (new Date().getTime() - dateOrders[key].getTime()) / 1000;
        row.style.backgroundColor = 'rgba(' + (row.classList.contains('call') ? '169,130,116,' : '217,108,179,') + (sec / app.targetTime) + ')';
        document.getElementById('time-order-' + key).textContent = Math.floor(sec / 60) + ':' + ('00' + Math.floor(sec % 60)).slice(-2);
    });
}, 1000);

app.ordersQuery.onSnapshot((snapshot) =>
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
    let cell8 = row.insertCell(-1);
    cell1.innerHTML = d.num;
    cell2.innerHTML = d.taretare;
    cell3.innerHTML = d.shioshio;
    cell4.innerHTML = d.tareshio;
    cell5.innerHTML = d.datetime.toDate().toLocaleString();
    cell6.innerHTML = '--:--';
    cell6.id = 'time-order-' + d.num;
    cell7.innerHTML = '<button class="mdc-button order-next">' + (d.call ? '受け渡し' : 'コール') + '</button>';
    cell7.children[0].addEventListener('click', (e) => {
        if (getParent(e.target).classList.contains('call')) {
            updateData(e.target, { hand: true });
            //orders.doc('general').update({  });
        }
        else {
            updateData(e.target, { call: true, calledDatetime: app.getFirebaseDateTime() });
            sendNotification(getNum(e.target));
        }
    });
    cell8.innerHTML = '<button class="mdc-button order-cancel">' + (d.call ? 'コール取り消し' : 'キャンセル') + '</button>';
    cell8.children[0].addEventListener('click', (e) => {
        if (getParent(e.target).classList.contains('call'))
            updateData(e.target, { call: false });
        else
            updateData(e.target, { cancel: true });
    });
}

function updateData(element, data) {
    app.orders.doc(getNum(element)).update(data);
}

function getParent(element) {
    return element.parentNode.parentNode;
}

function getNum(element) {
    return getParent(element).id.substr(6);
}

function sendNotification(num) {
    app.orders.doc(num).get().then((snapshot) => Array.prototype.slice.call(snapshot.data().devices, 0).forEach((value) =>
        fetch('https://fcm.googleapis.com/fcm/send', {
            method: 'POST',
            headers: new Headers({
                'Authorization': 'key=AAAA9PE3BsM:APA91bF4YMfy2KqeRMDE1An1pfOBzX11w-ESm4Aazf4M-TkKDG0PE7f41twkfiLfkYr4N3VDojRZ0DsVyw2S8831CL_7_xcn0kCATw4yR_PtlX7IQ-QZwy9pv2Mfgju4OlCIgSPo_cfyZrrAP7dRbArE7qIlKJbAYQ',
                'Content-Type': 'application/json',
            }),
            body: JSON.stringify({
                notification: {
                    title: '[俺の肉巻き]肉巻き完成のお知らせ',
                    body: snapshot.id + '番の注文が出来上がりました。\n受け取りに来てください。',
                    icon: 'icon-256x256.png',
                    click_action: 'https://xn--w8j5c142j0ylyx4b.tk/'
                },
                to: value
            })})
            .then(res => { })
            .catch(err => { })
    ));
}