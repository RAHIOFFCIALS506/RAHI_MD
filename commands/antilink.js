global.antilink = global.antilink || {};
global.antilinkKick = global.antilinkKick || {};

export default {
  info: {
    name: 'antilink',
    alias: ['anti-link'],
    desc: 'Configure antilink: .antilink on | .antilink kick on | .antilink off'
  },
  execute: async (m, sock, args) => {
    const jid = m.key.remoteJid;
    const option = args[0]?.toLowerCase();

    if (option === 'on') {
      global.antilink[jid] = true;
      global.antilinkKick[jid] = false;
      await sock.sendMessage(jid, { text: '✅ Antilink enabled (Delete mode).' }, { quoted: m });
    } else if (option === 'kick' && args[1]?.toLowerCase() === 'on') {
      global.antilink[jid] = true;
      global.antilinkKick[jid] = true;
      await sock.sendMessage(jid, { text: '✅ Antilink enabled (Kick mode active - 3 warnings).' }, { quoted: m });
    } else if (option === 'off') {
      global.antilink[jid] = false;
      global.antilinkKick[jid] = false;
      await sock.sendMessage(jid, { text: '❌ Antilink disabled.' }, { quoted: m });
    } else {
      await sock.sendMessage(jid, { text: 'Usage:\n.antilink on\n.antilink kick on\n.antilink off' }, { quoted: m });
    }
  }
}
