export default {
  info: {
    name: 'ping',
    alias: ['p'],
    desc: 'Check bot response speed',
    category: 'other' 
  },
  execute: async (m, sock) => {
    const start = Date.now();
    
    
    const msg = await sock.sendMessage(m.key.remoteJid, { 
      text: '⏱️ *Pinging...*' 
    }, { quoted: m });
    
    const end = Date.now();
    const ping = end - start;

    
    let status = '⚡'; // Fast
    if (ping > 200) status = '🚀'; // Medium
    if (ping > 500) status = '🐢'; // Slow

    
    await sock.sendMessage(m.key.remoteJid, { 
      text: `*Pong!* ${status} \n\n*Speed:* ${ping}ms`,
      edit: msg.key
    });
  }
}
