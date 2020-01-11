// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, Menu, Tray, shell, Notification } = require('electron');
const path = require('path');
const keytar = require('keytar');
const TronWeb = require('tronweb');
const pkg = require('./package.json');
const appVersion = pkg.version;

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
      autoReinvestPercent: 1,
      autoReinvestStable: false,
    },
  },
});

let tronWeb = null;
let appIcon = null;

if (process.platform === 'darwin') {
  // app.dock.hide();
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

const defaultRef = 'TXTkj2YgLVdgejscXAdSGTYuUzbwwWS8PT';
const tewkenaireAddress = 'TCSw8e8M6BRUYvh1vHhHZCZPiiBrcDjv7R';
const stableTewkenaireAddress = 'TSXnUzYWuockj3KspfGAd8hnRhshPm1yyw';

const reinvestDivs = async (divs, percent) => {
  const feeLimit = 5e6;
  const tewken = await tronWeb.contract().at(tewkenaireAddress);

  if (percent === 1) {
    await tewken.reinvest().send({
      callValue: 0,
      feeLimit,
    });

    return;
  }

  await tewken.withdraw().send({
    callValue: 0,
    feeLimit,
  });

  if (percent !== 0) {
    try {
      await tewken.buy(defaultRef).send({
        callValue: tronWeb.toSun(Number(divs * percent).toFixed(18)),
        feeLimit,
      });
    } catch (e) {
      console.log(e);
    }
  }
};

const reinvestStableDivs = async (divs, percent) => {
  const feeLimit = 5e6;
  const tewken = await tronWeb.contract().at(stableTewkenaireAddress);

  if (percent === 1) {
    await tewken.reinvest().send({
      callValue: 0,
      feeLimit,
    });

    return;
  }

  await tewken.withdraw().send({
    callValue: 0,
    feeLimit,
  });

  if (percent !== 0) {
    await tewken.buy().send({
      callValue: tronWeb.toSun(Number(divs * percent).toFixed(6)),
      feeLimit,
    });
  }
};

let refreshing = false;

const refreshUI = async () => {
  if (refreshing) {
    return;
  }

  refreshing = true;

  try {
    const settings = store.get('tewkenaire');
    const creds = await keytar.findCredentials('tewkenaire') || [];
    let balance = 0;
    let tewkenBalance = 0;
    let tewkenDividends = 0;
    let stableTewkenBalance = 0;
    let stableTewkenDividends = 0;
    if (creds.length > 0) {
      tronWeb = new TronWeb(
        fullNode,
        solidityNode,
        eventServer,
        creds[0].password,
      );

      balance = await getBalance(tronWeb.address.fromPrivateKey(creds[0].password));
      tewkenBalance = Number(await getTewkens());
      tewkenDividends = Number(await getTewkenDividends());
      stableTewkenBalance = Number(await getStableTewkens());
      stableTewkenDividends = Number(await getStableTewkenDividends());

      if (settings.autoReinvest && tewkenDividends > Number(settings.autoReinvestDivs)) {
        reinvestDivs(tewkenDividends, settings.autoReinvestPercent);
        const notification = new Notification({ title: 'Autocompounder 3000', body: `Auto-roll triggered! Rolled ${tewkenDividends} in TRX in CrazyTewkens` });
        notification.show();
      }

      if (settings.autoReinvestStable && stableTewkenDividends > Number(settings.autoReinvestDivs)) {
        reinvestStableDivs(stableTewkenDividends, settings.autoReinvestPercent);
        const notification = new Notification({ title: 'Autocompounder 3000', body: `Auto-roll triggered! Rolled ${stableTewkenDividends} TRX` });
        notification.show();
      }
    }

    if (mainWindow) {
      mainWindow.webContents.send('loaded', {
        creds,
        balance,
        tewkenBalance,
        tewkenDividends,
        settings,
        stableTewkenBalance,
        stableTewkenDividends,
      });
    }
  } catch (e) {
    console.log(e);
  }

  refreshing = false;
};

setInterval(refreshUI, 1000);

ipcMain.on('updateSettings', async (event, args) => {
  const settings = store.get('tewkenaire');
  const newSettings = { ...settings, ...args };
  store.set('tewkenaire', newSettings);
});

ipcMain.on('saveCreds', async (event, args) => {
  await keytar.setPassword('tewkenaire', TronWeb.address.fromPrivateKey(args.password), args.password);
});

ipcMain.on('showCode', async (event, args) => {
  shell.showItemInFolder(__filename);
});

ipcMain.on('showGithub', async (event, args) => {
  shell.openExternal('https://github.com/blockarcade/tewkenairebot');
});

ipcMain.on('signOut', async (event, args) => {
  const creds = await keytar.findCredentials('tewkenaire') || [];
  await keytar.deletePassword('tewkenaire', creds[0].account);
  refreshUI();
});

ipcMain.on('reinvestDivs', async () => {
  const settings = store.get('tewkenaire');

  const tewkenDividends = await getTewkenDividends();
  const stableTewkenDividends = await getStableTewkenDividends();

  reinvestDivs(tewkenDividends, settings.autoReinvestPercent);
  reinvestStableDivs(stableTewkenDividends, settings.autoReinvestPercent);
});

ipcMain.on('refresh', refreshUI);

function createWindow() {
  if (!appIcon) {
    appIcon = new Tray(path.join(__dirname, 'tray.png'));
    const contextMenu = Menu.buildFromTemplate([
      { label: `v${appVersion}` },
      { type: 'separator' },
      { label: 'Open', click: createWindow },
      { label: 'Exit', click: () => app.quit() },
    ]);

    appIcon.setContextMenu(contextMenu);
  }
  if (mainWindow) {
    mainWindow.show();
    return;
  }

  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 500,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
    },
    backgroundColor: "#282633",
    resizable: false,
    maximizable: false,
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

const getStableTewkens = async () => {
  const tewken = await tronWeb.contract().at(stableTewkenaireAddress);
  let tewkenBalance;
  try {
    const result = await tewken.myTokens().call();
    tewkenBalance = Number(result / 1e6).toFixed(2);
  } catch (e) {
    console.log(e);
    tewkenBalance = 0;
  }

  return tewkenBalance;
}

const getStableTewkenDividends = async () => {
  const tewken = await tronWeb.contract().at(stableTewkenaireAddress);
  let tewkenBalance;
  try {
    const result = await tewken.myDividends().call();
    tewkenBalance = tronWeb.fromSun(result.toString());
  } catch (e) {
    console.log(e);
    tewkenBalance = 0;
  }

  return tewkenBalance;
} 
