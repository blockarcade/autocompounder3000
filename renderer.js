// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.
const React = require('react');
const ReactDOM = require('react-dom');
const { ipcRenderer } = require('electron');
const { useState } = React;

const h = React.createElement;

let timer = null;
let percentTimer = null;

const openSourceCode = () => {
  ipcRenderer.send('showCode');
};

const openGithub = () => {
  ipcRenderer.send('showGithub');
};

const App = ({ 
  loading, 
  creds, 
  saveCreds, 
  balance, 
  signOut, 
  tewkenBalance, 
  tewkenDividends, 
  reinvestDivs, 
  settings, 
  updateSettings, 
  stableTewkenBalance,
  stableTewkenDividends,
}) => {
  if (!settings) return h('h1', null, 'Loading...');

  // console.log(window.tronWeb);

  const [accountName, setAccountName] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [tempChange, setTempChange] = useState(settings.autoReinvestDivs);
  const [tempPercent, setTempPercent] = useState(settings.autoReinvestPercent);
  const [tempCrazyEnabled, setTempCrazyEnabled] = useState(settings.autoReinvest);
  const [tempStableEnabled, setTempStableEnabled] = useState(settings.autoReinvestStable);

  return h('div', null, [
    h('h1', null,
      [
        h('img', { src: './images/logotext.png', style: { verticalAlign: 'middle', width: '300px' } }),
      ]
    ),
    h('h1', null,
      [
        h('img', { src: './images/autocomponder.png', style: { verticalAlign: 'middle', width: '375px' } }),
      ]
    ),
    h(React.Fragment, null, (() => {
      if (loading) {
        return h('h2', null, 'Loading...');
      } else if (!creds || creds.length === 0) {
        return [
          h('p', { style: { textAlign: 'justify' } }, 'Tewkenaire Bot needs your Tron private key to be able to manage your account in the background. Your private key is stored in the system keychain and will only be accessible to you. Please take a moment to look over the source code using the link below.'),
          h('div', { style: { marginTop: '25px' } }, [
            h('img', { width: '150px', src: './images/source-code-button.png', onClick: openSourceCode }),
            h('img', { width: '150px', src: './images/github-button.png', onClick: openGithub }),
          ]),
          h('p', null, h('input', { className: 'customInput', style: { fontSize: '2em', width: '420px', border: 'none', color: 'white' }, type: 'password', placeholder: 'Private Key', value: privateKey, onChange: (e) => setPrivateKey(e.target.value) })),
          h('p', null, h('button', {
            className: 'small_button',
            type: 'submit', onClick: () => {
              saveCreds({ username: accountName, password: privateKey });
              setAccountName('');
              setPrivateKey('');
            }
          }, 'Save')),
        ];
      }

      return [
        h('p', null, [h('button', { onClick: signOut }, 'Logout')]),
        h('table', { style: { width: '300px', margin: 'auto' } }, [
          h('tr', null, [
            h('td', { style: { fontWeight: 'bold' } }, "WALLET BALANCE"),
            h('td', null, `${Number(balance).toFixed(2)} TRX`),
          ]),
        ]),
        h('div', { style: { width: '50%', display: 'inline-block', float: 'left' } }, [
            h('table', { style: { width: '100%' } }, [
              h('tr', null, [
                h('td', { style: { fontWeight: 'bold' } }, "Crazy Tewkens"),
                h('td', null, tewkenBalance),
              ]),
              h('tr', null, [
                h('td', { style: { fontWeight: 'bold' } }, "Crazy Rewards"),
                h('td', null, `${Number(tewkenDividends).toFixed(3)} TRX`),
              ]),
            ]),
          ]),
        h('div', { style: { width: '50%', display: 'inline-block', float: 'left' } }, [
          h('table', { style: { width: '100%' } }, [
            h('tr', null, [
              h('td', { style: { fontWeight: 'bold' } }, "Stable Tewkens"),
              h('td', null, stableTewkenBalance),
            ]),
            h('tr', null, [
              h('td', { style: { fontWeight: 'bold' } }, "Stable Rewards"),
              h('td', null, `${Number(stableTewkenDividends).toFixed(3)} TRX`),
            ]),
          ]),
        ]),
        h('div', { style: { clear: 'left' } }),
        h('button', { onClick: reinvestDivs, className: 'button' }, 'Roll'),
        h('div', { style: { fontWeight: 'bold', fontSize: '24px' }}, 'Settings'),
        h('div', { style: { width: '50%', display: 'inline-block', float: 'left' } }, [
          h('h4', null, 'Crazy Auto Roll'),
          h('div', null, [
            h('input', { type: 'radio', value: 'true', id: 'atrue', checked: tempCrazyEnabled, onChange: () => setTempCrazyEnabled(true) && updateSettings({ autoReinvest: true }) }),
            h('label', { htmlFor: 'atrue' }, 'Enabled'),
          ]),
          h('div', null, [
            h('input', { type: 'radio', value: 'false', id: 'afalse', checked: !tempCrazyEnabled, onChange: () => setTempCrazyEnabled(false) && updateSettings({ autoReinvest: false }) }),
            h('label', { htmlFor: 'afalse' }, 'Disabled'),
          ]),
        ]),
        h('div', { style: { width: '50%', display: 'inline-block', float: 'left' } }, [
          h('h4', null, 'Stable Auto Roll'),
          h('div', null, [
            h('input', { type: 'radio', value: 'true', id: 'a2true', checked: tempStableEnabled, onChange: () => {
              setTempStableEnabled(true);
              updateSettings({ autoReinvestStable: true });
            } }),
            h('label', { htmlFor: 'a2true' }, 'Enabled'),
          ]),
          h('div', null, [
            h('input', { type: 'radio', value: 'false', id: 'a2false', checked: !tempStableEnabled, onChange: () => {
              setTempStableEnabled(false);
              updateSettings({ autoReinvestStable: false });
            } 
            }),
            h('label', { htmlFor: 'a2false' }, 'Disabled'),
          ]),
        ]),
        h('div', { style: { width: '50%', display: 'inline-block', float: 'left' } }, [
          h('p', null, `Roll when rewards hit: ${tempChange} TRX`),
          h('input', {
            type: 'range', min: '1', max: '100', step: '1', value: tempChange, onChange: (e) => {
              e.persist()
              setTempChange(e.target.value);
              if (timer) {
                clearTimeout(timer);
              }

              timer = setTimeout(() => updateSettings({ autoReinvestDivs: e.target.value }), 1000);
            }
          }),
        ]),
        h('div', { style: { width: '50%', display: 'inline-block', float: 'left' } }, [
          h('p', null, `Roll ${Number(tempPercent) * 100}% of TRX rewards`),
          h('input', {
            type: 'range', min: '0', max: '1', step: '0.1', value: tempPercent, onChange: (e) => {
              e.persist()
              setTempPercent(e.target.value);
              if (percentTimer) {
                clearTimeout(percentTimer);
              }

              percentTimer = setTimeout(() => updateSettings({ autoReinvestPercent: e.target.value }), 1000);
            }
          }),
        ]),
        h('div', { style: { clear: 'left' } }),
      ];
    })())
  ])
};

const saveCreds = (creds) => {
  ipcRenderer.send('saveCreds', creds);
};

const updateSettings = (changes) => {
  ipcRenderer.send('updateSettings', changes);
};

const signOut = () => {
  ipcRenderer.send('signOut');
};

const reinvestDivs = () => {
  ipcRenderer.send('reinvestDivs');
};

const render = (props) => {
  ReactDOM.render(
    h(App, {saveCreds, signOut, reinvestDivs, updateSettings, ...props }),
    document.getElementById('app'),
  );
};

ipcRenderer.on('loaded', (_, props) => {
  render({ loading: false, ...props });
});


render({ loading: true });

