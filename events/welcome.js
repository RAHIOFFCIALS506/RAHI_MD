import { getSetting } from '../settings.js'

export async function handleWelcome(participantUpdate, sock) {
    try {
        const { id, participants, action } = participantUpdate

        // Only trigger when a new member joins/is added
        if (action !== 'add') return

        const botName = getSetting('bot.name') || '𝑹𝑨𝑯𝑰_𝑴𝑫'
        const groupMetadata = await sock.groupMetadata(id)
        const groupName = groupMetadata.subject
        const totalMembers = groupMetadata.participants.length

        for (const jid of participants) {
            const userNum = jid.split('@')[0]

            // Aesthetic Welcome Message Card
            let welcomeText = `
✨ ━━━━━━━⟨ 🥳 *𝑾𝑬𝑳𝑪𝑶𝑴𝑬* 🥳 ⟩━━━━━━━ ✨

👋 *Hello* @${userNum}!
🎉 Welcome to *${groupName}*!

╭━━━〔 🟡 *𝐺𝑅𝑶𝑈𝑃 𝐼𝑁𝐹𝑂* 🟡 〕━━━⬣
┃ 👥 *Total Members* : ${totalMembers}
┃ 🤖 *Bot System*    : ${botName}
╰━━━━━━━━━━━━━━━━━━━━━━━━⬣

> 💛 *Please make sure to read the group description and enjoy your stay!*`

            await sock.sendMessage(id, {
                text: welcomeText,
                mentions: [jid],
                contextInfo: {
                    externalAdReply: {
                        title: `🎉 WELCOME TO ${groupName.toUpperCase()} 🎉`,
                        body: `You are member #${totalMembers}`,
                        thumbnailUrl: "https://i.postimg.cc/05p6KqCc/1768548671157.jpg",
                        sourceUrl: "https://whatsapp.com",
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            })
        }
    } catch (error) {
        console.error("Welcome Event Error:", error)
    }
}
