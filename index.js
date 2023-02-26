const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const wheel = require('logitech-g27')

const Store = require('electron-store');

const schema = {
    wheelRange: {
        type: 'number',
        default: 270
    },
    windowSize: {
        type: 'object',
        properties: {
            width: {
                type: 'number',
            },
            height: {
                type: 'number',
            }
        },
        default: {
            width: 550,
            height: 520
        }
    }
}

const store = new Store({ schema: schema });

let window;

const createWindow = () => {
    const windowSize = store.get('windowSize');

    window = new BrowserWindow({
        width: windowSize.width,
        height: windowSize.height,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    });

    window.loadFile('index.html');

    window.on('resize', () => {
        let { width, height } = window.getBounds();
        store.set('windowSize', { width, height });
    });
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0)
            createWindow();
    });

    wheel.connect({
        autocenter: false,
        range: store.get("wheelRange")
    }, (err) => {
        if (err)
            console.log(err);
        else {
            wheel.on('data', (data) => {
                const wheelTurn = data[4];
                window.webContents.send('wheel-turn', (wheelTurn / 255) * 100);
            });
        }
    });
})

app.on('window-all-closed', () => {
    wheel.disconnect();
    if (process.platform !== 'darwin') {
        app.quit();
    }
})

ipcMain.on('update-wheel-cfg', (_, data) => {
    wheel.disconnect();
    wheel.connect({ autocenter: false, range: data }, function (err) {
        store.set('wheelRange', parseInt(data));
    });
});