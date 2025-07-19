const { default: makeWASocket, useSingleFileAuthState } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const Filter = require('bad-words');

const filter = new Filter();
const { state, saveState } = useSingleFileAuthState('./auth.json');

async function startSock() {
  const sock = makeWASocket({ auth: state, printQRInTerminal: true });
  sock.ev.on('creds.update', saveState);

  sock.ev.on('messages.upsert', async ({ messages }) => {
    if (!messages[0]?.message) return;
    const msg = messages[0];
    const from = msg.key.remoteJid;
    const isGroup = from.endsWith('@g.us');
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';

    if (filter.isProfane(text)) {
      await sock.sendMessage(from, { text: '⚠️ Pesan toxic terdeteksi.' }, { quoted: msg });
      return;
    }
    if (text.toLowerCase() === '!hidetag' && isGroup) {
      const metadata = await sock.groupMetadata(from);
      const mentions = metadata.participants.map(p => p.id);
      await sock.sendMessage(from, { text: '👋 Hidden tag!', mentions });
    }
    if (text.toLowerCase() === 'halo') {
      await sock.sendMessage(from, { text: 'Hai juga! Ada yang bisa aku bantu?' }, { quoted: msg });
    }
  });
}

startSock();
