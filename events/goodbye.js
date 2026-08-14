import { getSetting } from '../settings.js'

export async function handleGoodbye(participantUpdate, sock) {
    try {
        const { id, participants, action } = participantUpdate

        // Only trigger when a member leaves or is removed/kicked
        if (action !== 'remove') return

        const botName = getSetting('bot.name') || '𝑹𝑨𝑯𝑰_𝑴𝑫'
        const groupMetadata = await sock.groupMetadata(id)
        const groupName = groupMetadata.subject
        const totalMembers = groupMetadata.participants.length

        for (const jid of participants) {
            const userNum = jid.split('@')[0]

            // Aesthetic Goodbye Card
            let goodbyeText = `
✨ ━━━━━━━⟨ 💔 *𝐺𝑂𝑂𝐷𝐵𝑌𝐸* 💔 ⟩━━━━━━━ ✨

👋 Goodbye @${userNum}!
We are sad to see you leave *${groupName}*.

╭━━━〔 🟡 *𝐺𝑅𝑶𝑈𝑃 𝑆𝑇𝐴𝑇𝑆* 🟡 〕━━━⬣
┃ 👥 *Remaining Members* : ${totalMembers}
┃ 🤖 *Bot System*        : ${botName}
╰━━━━━━━━━━━━━━━━━━━━━━━━⬣

> 💛 *We wish you all the best for the future!*`

            await sock.sendMessage(id, {
                text: goodbyeText,
                mentions: [jid],
                contextInfo: {
                    externalAdReply: {
                        title: `👋 MEMBER LEFT ${groupName.toUpperCase()}`,
                        body: `Remaining Members: ${totalMembers}`,
                        thumbnailUrl: "https://i.postimg.cc/05p6KqCc/1768548671157.jpg",
                        sourceUrl: "https://whatsapp.com",
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            })
        }
    } catch (error) {
        console.error("Goodbye Event Error:", error)
    }
}
