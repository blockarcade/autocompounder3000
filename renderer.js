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

const App = ({ loading, creds, saveCreds, balance, signOut, tewkenBalance, tewkenDividends, reinvestDivs, settings, updateSettings, openTronLink }) => {
  if (!settings) return h('h1', null, 'Loading...');

  // console.log(window.tronWeb);

  const [accountName, setAccountName] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [tempChange, setTempChange] = useState(settings.autoReinvestDivs);
  const [tempPercent, setTempPercent] = useState(settings.autoReinvestPercent);

  return h('div', null, [
    h('h1', null,
      [
        h('img', { src: './logotext.png', style: { verticalAlign: 'middle', width: '375px' } }),
        h('span', null, ' BOT'),
      ]),
    h(React.Fragment, null, (() => {
      if (loading) {
        return h('h2', null, 'Loading...');
      } else if (!creds || creds.length === 0) {
        return [
          h('p', { style: {textAlign: 'justify' }}, 'Tewkenaire Bot needs your Tron private key to be able to manage your account in the background. Your private key is stored in the system keychain and will only be accessible to you. Please take a moment to look over the source code using the link below.'),
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
        h('h2', null, ['Credentials Loaded ', h('button', { onClick: signOut }, 'Logout')]),
        h('br'),
        h('b', null, `TRX: ${Number(balance).toFixed(2)}`),
        h('br'),
        h('b', null, `Tewkens: ${tewkenBalance}`),
        h('br'),
        h('b', null, `Rewards: ${Number(tewkenDividends).toFixed(2)} TRX`),
        h('br'),
        h('button', { onClick: reinvestDivs, className: 'button' }, 'Roll'),
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
        // h('h3', null, `Roll ${Number(tempPercent)*100}% of TRX rewards`),
        // h('input', { type: 'range', min: '0', max: '1', step: '0.1', value: tempPercent, onChange: (e) => {
        //   e.persist()
        //   setTempPercent(e.target.value);
        //   if (percentTimer) {
        //     clearTimeout(percentTimer);
        //   }
          
        //   percentTimer = setTimeout(() => updateSettings({ autoReinvestPercent: e.target.value }), 200);
        // } }),
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

