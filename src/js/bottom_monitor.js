import * as app from './app';

app.generalRefresh(() => {
    let time = app.averageOrderCallTime * (app.itemCount - app.completeCount) + app.adjustTime;
    if (time < 60 * 8) time = 60 * 8;
    document.getElementById('estimate').textContent = Math.floor(time / 60);
});