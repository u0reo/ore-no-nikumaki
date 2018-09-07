import * as app from './app';

var dateOrders = {};
var dateItems = {};

setInterval(() => {
    document.getElementById('time-orderlist').innerHTML = new Date().toLocaleString();
    Object.keys(dateOrders).forEach((key) => {
        let row = document.getElementById('order-' + key);
        let sec = (new Date().getTime() - dateOrders[key].getTime()) / 1000;
        row.style.backgroundColor = 'rgba(' + (row.classList.contains('call') ? '169,130,116,' : '217,108,179,') + (sec / app.targetTime) + ')';
        document.getElementById('time-order-' + key).textContent = Math.floor(sec / 60) + ':' + ('00' + Math.floor(sec % 60)).slice(-2);
    });
    Object.keys(dateItems).forEach((key) => {
        let row = document.getElementById('item-' + key);
        let sec = (new Date().getTime() - dateItems[key].getTime()) / 1000;
        row.style.backgroundColor = 'rgba(217,108,179,' + (sec / app.limitTime) + ')';
        document.getElementById('time-item-' + key).textContent = Math.floor(sec / 60) + ':' + ('00' + Math.floor(sec % 60)).slice(-2);
    })
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
            if (d.call) dateOrders[data.doc.id] = d.callTime.toDate();
            else dateOrders[data.doc.id] = d.orderTime.toDate();
            row.classList = getClassList(d);
            row.getElementsByClassName('order-next')[0].textContent = getActionText(d);
            row.getElementsByClassName('order-cancel')[0].textContent = getCancelText(d);
        }
    })
);

app.itemsQuery.onSnapshot((snapshot) => 
    snapshot.docChanges().forEach((data) => {
        if (data.type === 'added') addItem(data.doc);
        else if (data.type === 'removed') {
            document.getElementById('item-' + data.doc.id).remove();
            delete dateItems[data.doc.id];
        }
    })
);

function addOrder(doc) {
    let d = doc.data();
    dateOrders[doc.id] = (d.call ? d.callTime.toDate() : d.orderTime.toDate());
    let row = document.getElementById('order-table').insertRow(-1);
    row.id = 'order-' + doc.id;
    row.classList = getClassList(d);
    let cell1 = row.insertCell(-1);
    let cell2 = row.insertCell(-1);
    cell2.classList = 'count';
    let cell3 = row.insertCell(-1);
    cell3.classList = 'count';
    //let cell4 = row.insertCell(-1);
    let cell5 = row.insertCell(-1);
    let cell6 = row.insertCell(-1);
    let cell7 = row.insertCell(-1);
    let cell8 = row.insertCell(-1);
    cell1.innerHTML = doc.id;
    cell2.innerHTML = d.taretare;
    cell3.innerHTML = d.shioshio;
    //cell4.innerHTML = d.tareshio;
    cell5.innerHTML = d.orderTime.toDate().toLocaleString();
    cell6.innerHTML = '--:--';
    cell6.id = 'time-order-' + doc.id;
    cell7.innerHTML = '<button class="mdc-button order-next">' + getActionText(d) + '</button>';
    cell7.children[0].addEventListener('click', (e) => {
        if (contain(e, 'call')) {
            updateData(e.target, { hand: true, handTime: app.getFirebaseDateTime() });
            let c = getCount(e.target);
            app.general.update({ completeCount: app.completeCount + c });
            app.itemsQuery.limit(c).get().then((snapshot) => snapshot.forEach((doc) => app.items.doc(doc.id).delete()));
        }
        else if (contain(e, 'deliver')) {
            updateData(e.target, { call: true, callTime: app.getFirebaseDateTime() });
            sendNotification(getNum(e.target));
            [...Array(getCount(e.target))].map(() => app.items.add({ dateTime: app.getFirebaseDateTime(), num: getNum(e.target) }));
        }
        else if (contain(e, 'ship')) updateData(e.target, { deliver: true });
        else updateData(e.target, { ship: true });
    });
    cell8.innerHTML = '<button class="mdc-button order-cancel">' + getCancelText(d) + '</button>';
    cell8.children[0].addEventListener('click', (e) => {
        if (contain(e, 'call')) {
            updateData(e.target, { call: false });
            //app.items.where('num', '==', getNum(e.target)).get().then((snapshot) => snapshot.forEach((doc) => app.items.doc(doc.id).delete()));
        }
        else if (contain(e, 'deliver')) updateData(e.target, { deliver: false });
        else if (contain(e, 'ship')) updateData(e.target, { ship: false });
        else updateData(e.target, { cancel: true });
    });
}

function updateData(element, data) {
    app.orders.doc(getNum(element)).update(data);
}

function contain(e, text) {
    return getParent(e.target).classList.contains(text)
}

function getParent(element) {
    return element.parentNode.parentNode;
}

function getNum(element) {
    return getParent(element).id.substr(6);
}

function getCount(element) {
    let c = 0;
    getParent(element).querySelectorAll('.count').forEach((e) => c += parseInt(e.textContent));
    return c;
}

function sendNotification(num) {
    app.orders.doc(num).get().then((snapshot) => snapshot.data().devices.forEach((value) =>
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

function getClassList(data) {
    let list = '';
    if (data.ship) list += 'ship ';
    if (data.deliver) list += 'deliver ';
    if (data.call) list += 'call ';
    if (data.hand) list += 'hand ';
    return list.trim();
}

function getActionText(data) {
    if (data.call) return '受取完了';
    else if (data.deliver) return 'コール';
    else if (data.ship) return '飛脚到着';
    else return '飛脚出発';
}

function getCancelText(data) {
    if (data.call) return '×コール';
    else if (data.deliver) return '×到着';
    else if (data.ship) return '×出発';
    else return '×オーダー';
}

function addItem(doc) {
    let row = document.getElementById('item-table').insertRow(-1);
    dateItems[doc.id] = doc.data().dateTime.toDate();
    row.id = 'item-' + doc.id;
    let cell1 = row.insertCell(-1);
    let cell2 = row.insertCell(-1);
    cell1.innerHTML = '--:--';
    cell1.id = 'time-item-' + doc.id;
    cell2.innerHTML = '<button class="mdc-button">破棄</button>';
    cell2.children[0].addEventListener('click', (e) => deleteItem(e.target.parentNode.parentNode.id.substr(5)));
}

function deleteItem(id) {
    if (confirm('本当にこの商品を破棄しますか？\n(コールの取り消しなどは自動で行いません)'))
        app.items.doc(id).delete();
} 