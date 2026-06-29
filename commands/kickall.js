export default {
  info: {
    name: 'kickall',
    alias: ['removeall'],
    desc: 'Remove all participants from the group'
  },
  execute: async (m, sock) => {
    try {
      // Check if it is a group
      if (!m.key.remoteJid.endsWith('@g.us')) {
        return await sock.sendMessage(m.key.remoteJid, { text: 'This command can only be used in groups.' }, { quoted: m });
      }

      // Get group metadata to find participants
      const groupMetadata = await sock.groupMetadata(m.key.remoteJid);
      const participants = groupMetadata.participants;
      
      // Filter out the bot and the person executing the command
      const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
      const senderId = m.key.participant || m.key.remoteJid;
      
      const toKick = participants
        .filter(p => p.id !== botId && p.id !== senderId && !p.admin)
        .map(p => p.id);

      if (toKick.length === 0) {
        return await sock.sendMessage(m.key.remoteJid, { text: 'No removable participants found.' }, { quoted: m });
      }

      // Remove participants
      await sock.groupParticipantsUpdate(m.key.remoteJid, toKick, 'remove');
      
      await sock.sendMessage(m.key.remoteJid, { text: `Successfully kicked ${toKick.length} members.` }, { quoted: m });
      
    } catch (error) {
      console.error(error);
      await sock.sendMessage(m.key.remoteJid, { text: 'Failed to kick members. Make sure the bot is an admin.' }, { quoted: m });
    }
  }
}
