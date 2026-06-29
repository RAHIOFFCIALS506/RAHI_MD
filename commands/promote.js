export default {
  info: {
    name: 'promote',
    alias: ['admin'],
    desc: 'Promote a mentioned user to group admin',
    isGroup: true
  },
  execute: async (m, sock, args, text, ctx) => {
    // 1. Check if the user is mentioning or replying to someone
    const mentioned = m.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const target = mentioned[0] || m.quoted?.sender;

    if (!target) {
      return await sock.sendMessage(ctx.jid, { text: '⚠️ Please mention or reply to a user to promote them.' });
    }

    // 2. Check if the bot is an admin
    const groupMetadata = await sock.groupMetadata(ctx.jid);
    const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
    const botAdmin = groupMetadata.participants.find(p => p.id === botId)?.admin;

    if (!botAdmin) {
      return await sock.sendMessage(ctx.jid, { text: '❌ I need to be an Admin in this group to promote members.' });
    }

    try {
      // 3. Perform the promotion
      await sock.groupParticipantsUpdate(ctx.jid, [target], 'promote');
      await sock.sendMessage(ctx.jid, { 
        text: `✅ @${target.split('@')[0]} has been promoted to Admin!`,
        mentions: [target]
      }, { quoted: m });
    } catch (e) {
      console.error(e);
      await sock.sendMessage(ctx.jid, { text: '❌ Failed to promote user. Ensure they are a group member and I have permission.' });
    }
  }
}
