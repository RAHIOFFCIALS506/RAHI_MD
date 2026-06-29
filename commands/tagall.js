export default {
  info: {
    name: 'tagall',
    alias: ['everyone', 'all'],
    desc: 'Mention everyone in the group',
    isGroup: true
  },
  execute: async (m, sock, args, text, ctx) => {
    // Get group metadata to find all members
    const groupMetadata = await sock.groupMetadata(ctx.jid);
    const participants = groupMetadata.participants;

    // Prepare the message
    let messageText = `📢 *Attention Everyone!*\n\n`;
    messageText += text ? `Message: ${text}\n\n` : '';
    
    // Create the mention list
    const mentions = [];
    for (let mem of participants) {
      messageText += `🤍 @${mem.id.split('@')[0]}\n`;
      mentions.push(mem.id);
    }

    // Send the message with mentions
    await sock.sendMessage(ctx.jid, { 
      text: messageText, 
      mentions: mentions 
    }, { quoted: m });
  }
}
