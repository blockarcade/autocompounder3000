// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, Menu, Tray } = require('electron');
const path = require('path');
const keytar = require('keytar');
const TronWeb = require('tronweb');

const HttpProvider = TronWeb.providers.HttpProvider; // This provider is optional, you can just use a url for the nodes instead
const fullNode = new HttpProvider('https://api.trongrid.io'); // Full node http endpoint
const solidityNode = new HttpProvider('https://api.trongrid.io'); // Solidity node http endpoint
const eventServer = 'https://api.trongrid.io/'; // Contract events http endpoint
const Store = require('electron-store');
const store = new Store({
  defaults: {
    tewkenaire: {
      autoReinvest: false,
      autoReinvestDivs: 5,
    },
  },
});

let tronWeb = null;
let appIcon = null;

if (process.platform === 'darwin') {
  app.dock.hide();
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

const tewkenaireAddress = 'TCSw8e8M6BRUYvh1vHhHZCZPiiBrcDjv7R';

const reinvestDivs = async () => {
  const feeLimit = 5e6;
  const tewken = await tronWeb.contract().at(tewkenaireAddress);
  await tewken.reinvest().send({
    callValue: 0,
    feeLimit,
  });
};

const refreshUI = async () => {
  const settings = store.get('tewkenaire');
  const creds = await keytar.findCredentials('tewkenaire') || [];
  let balance = 0;
  let tewkenBalance = 0;
  let tewkenDividends = 0;
  if (creds.length > 0) {
    tronWeb = new TronWeb(
      fullNode,
      solidityNode,
      eventServer,
      creds[0].password,
    );

    balance = await getBalance(creds[0].account);
    tewkenBalance = await getTewkens();
    tewkenDividends = await getTewkenDividends();

    if (settings.autoReinvest && tewkenDividends > settings.autoReinvestDivs) {
      reinvestDivs();
    }
  }

  if (mainWindow) {
    mainWindow.webContents.send('loaded', { creds, balance, tewkenBalance, tewkenDividends, settings });
  }
};

setInterval(refreshUI, 1000);

ipcMain.on('updateSettings', async (event, args) => {
  const settings = store.get('tewkenaire');
  const newSettings = { ...settings, ...args };
  store.set('tewkenaire', newSettings);
  refreshUI();
});

ipcMain.on('saveCreds', async (event, args) => {
  await keytar.setPassword('tewkenaire', args.username, args.password);
  refreshUI();
});

ipcMain.on('signOut', async (event, args) => {
  const creds = await keytar.findCredentials('tewkenaire') || [];
  await keytar.deletePassword('tewkenaire', creds[0].account);
  refreshUI();
});

ipcMain.on('reinvestDivs', reinvestDivs);

ipcMain.on('refresh', refreshUI);

function createWindow() {
  if (!appIcon) {
    appIcon = new Tray(path.join(__dirname, 'tray.png'));
    const contextMenu = Menu.buildFromTemplate([
      { label: 'Open', click: createWindow },
      { label: 'Item2', type: 'separator' },
      { label: 'Exit', click: () => app.quit() },
    ]);

    appIcon.setContextMenu(contextMenu);
  }
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
    },
    backgroundColor: "#282633",
  });

  mainWindow.webContents.on('did-finish-load', async () => {
    refreshUI();
  });

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow()
});

app.on('window-all-closed', function () {
  // noop;
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.



async function getBalance(address) {
  // The majority of the function calls are asynchronus,
  // meaning that they cannot return the result instantly.
  // These methods therefore return a promise, which you can await.
  const balance = await tronWeb.trx.getBalance(address);
  return tronWeb.fromSun(balance);
}

const getTewkens = async () => {
  const tewken = await tronWeb.contract().at(tewkenaireAddress);
  let tewkenBalance;
  try {
    const result = await tewken.myTokens().call();
    tewkenBalance = Number(result / 1e18).toFixed(2);
  } catch (e) {
    console.log(e);
    tewkenBalance = 0;
  }

  return tewkenBalance;
}

const getTewkenDividends = async () => {
  const tewken = await tronWeb.contract().at(tewkenaireAddress);
  let tewkenBalance;
  try {
    const result = await tewken.myDividends(true).call();
    tewkenBalance = tronWeb.fromSun(result.toString());
  } catch (e) {
    console.log(e);
    tewkenBalance = 0;
  }

  return tewkenBalance;
} 
