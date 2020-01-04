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

const App = ({ loading, creds, saveCreds, balance, signOut, tewkenBalance, tewkenDividends, reinvestDivs, settings, updateSettings }) => {
  const [accountName, setAccountName] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [tempChange, setTempChange] = useState(settings.autoReinvestDivs);

  return h('div', null, [
    h('h1', null,
      [
        h('img', { src: './logotext.png', style: { verticalAlign: 'middle', width: '50%' } }),
        h('span', null, ' BOT'),
      ]),
    h(React.Fragment, null, (() => {
      if (loading) {
        return h('h2', null, 'Loading...');
      } else if (!creds || creds.length === 0) {
        return [
          h('input', { type: 'text', placeholder: 'public key', value: accountName, onChange: (e) => setAccountName(e.target.value) }),
          h('br'),
          h('input', { type: 'password', placeholder: 'private key', value: privateKey, onChange: (e) => setPrivateKey(e.target.value) }),
          h('br'),
          h('button', {
            type: 'submit', onClick: () => {
              saveCreds({ username: accountName, password: privateKey });
              setAccountName('');
              setPrivateKey('');
            }
          }, 'Save'),
        ];
      }

      return [
        h('h2', null, ['Credentials Loaded ', h('button', { onClick: signOut }, 'Logout')]),
        h('br'),
        h('b', null, `TRX: ${Number(balance).toFixed(2)}`),
        h('br'),
        h('b', null, `Tewkens: ${tewkenBalance}`),
        h('br'),
        h('b', null, `Rewards: ${Number(tewkenDividends).toFixed(2)} TRX`),
        h('br'),
        h('button', { onClick: reinvestDivs }, 'Roll Rewards'),
        h('h2', null, 'Settings'),
        h('h3', null, 'Auto Roll'),
        h('div', null, [
          h('input', { type: 'radio', value: 'true', id: 'atrue', checked: settings.autoReinvest, onChange: () => updateSettings({ autoReinvest: true }) }),
          h('label', { htmlFor: 'atrue' }, 'Enabled'),
        ]),
        h('div', null, [
          h('input', { type: 'radio', value: 'false', id: 'afalse', checked: !settings.autoReinvest, onChange: () => updateSettings({ autoReinvest: false }) }),
          h('label', { htmlFor: 'afalse' }, 'Disabled'),
        ]),
        h('h3', null, `Roll when rewards hit: ${tempChange} TRX`),
        h('input', { type: 'range', min: '1', max: '100', step: '1', value: tempChange, onChange: (e) => {
          e.persist()
          setTempChange(e.target.value);
          if (timer) {
            clearTimeout(timer);
          }
          
          timer = setTimeout(() => updateSettings({ autoReinvestDivs: e.target.value }), 200);
        } }),
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

const render = ({ loading, creds, balance, tewkenBalance, tewkenDividends, settings }) => {
  ReactDOM.render(
    h(App, { loading, creds, saveCreds, balance, signOut, tewkenBalance, tewkenDividends, reinvestDivs, settings, updateSettings }),
    document.getElementById('app'),
  );
};

ipcRenderer.on('loaded', (_, { creds, balance, tewkenBalance, tewkenDividends, settings }) => {
  render({ loading: false, creds, balance, tewkenBalance, tewkenDividends, settings });
});


render({ loading: true });

