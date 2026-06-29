export default {
  info: {
    name: 'demote',
    alias: ['removeadmin'],
    desc: 'Demote a group admin back to a regular member',
    isGroup: true
  },
  execute: async (m, sock, args, text, ctx) => {
    // 1. Check if the user is mentioning or replying to someone
    const mentioned = m.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const target = mentioned[0] || m.quoted?.sender;

    if (!target) {
      return await sock.sendMessage(ctx.jid, { text: '⚠️ Please mention or reply to an admin to demote them.' });
    }

    // 2. Check if the bot is an admin
    const groupMetadata = await sock.groupMetadata(ctx.jid);
    const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
    const botAdmin = groupMetadata.participants.find(p => p.id === botId)?.admin;

    if (!botAdmin) {
      return await sock.sendMessage(ctx.jid, { text: '❌ I need to be an Admin in this group to demote members.' });
    }

    try {
      // 3. Perform the demotion
      await sock.groupParticipantsUpdate(ctx.jid, [target], 'demote');
      await sock.sendMessage(ctx.jid, { 
        text: `✅ @${target.split('@')[0]} has been demoted from Admin!`,
        mentions: [target]
      }, { quoted: m });
    } catch (e) {
      console.error(e);
      await sock.sendMessage(ctx.jid, { text: '❌ Failed to demote user. Please check if I have sufficient permissions.' });
    }
  }
}
