import * as app from './app';

app.ordersQuery.onSnapshot((snapshot) => {
    snapshot.docChanges().forEach(function (change) {
        var d = change.doc.data();
        if (change.type === 'added' || change.type === 'modified') {
            if ((d.call) && !document.getElementById('ticket-' + change.doc.id)) {
                var div = document.createElement('div');
                div.classList.add('order-ticket');
                div.textContent = change.doc.id;
                div.id = 'ticket-' + change.doc.id;
                div.style.zoom = 8; ///////////////////////////////////////////////////
                document.getElementById('complete-container-monitor').appendChild(div);
            } else if ((!d.call || d.hand) && document.getElementById('ticket-' + change.doc.id))
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
});
