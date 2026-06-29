export default {
  info: {
    name: 'kick',
    alias: ['remove'],
    desc: 'Remove a specific member from the group'
  },
  execute: async (m, sock) => {
    // Check if it is a group
    if (!m.key.remoteJid.endsWith('@g.us')) {
      return await sock.sendMessage(m.key.remoteJid, { text: 'This command only works in groups.' }, { quoted: m });
    }

    // Identify the target: tagged user or replied message
    const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    const replied = m.message?.extendedTextMessage?.contextInfo?.participant;
    const target = mentioned || replied;

    if (!target) {
      return await sock.sendMessage(m.key.remoteJid, { text: 'Please tag a person or reply to their message to kick them.' }, { quoted: m });
    }

    try {
      // Perform the removal
      await sock.groupParticipantsUpdate(m.key.remoteJid, [target], 'remove');
      await sock.sendMessage(m.key.remoteJid, { text: `@${target.split('@')[0]} has been removed from the group.` , mentions: [target]}, { quoted: m });
    } catch (error) {
      console.error(error);
      await sock.sendMessage(m.key.remoteJid, { text: 'Failed to kick the user. Ensure I have administrator permissions.' }, { quoted: m });
    }
  }
}
