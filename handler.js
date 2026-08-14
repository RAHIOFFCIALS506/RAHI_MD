import { getSetting } from './settings.js'

const spamTracker = new Map()

/**
 * ১. মেসেজ ও ফিচার হ্যান্ডলার (Message Handler)
 */
export async function handleMessage(sock, m, commands) {
  try {
    if (!m.message) return

    const jid = m.key.remoteJid
    const sender = m.key.participant || jid
    const now = Date.now()

    // ১. অ্যান্টি-স্প্যাম (Anti-Spam)
    if (global.antispam) {
      let history = spamTracker.get(sender) || []
      history = history.filter(time => now - time < 5000)
      history.push(now)
      spamTracker.set(sender, history)

      if (history.length > 5) {
        await sock.sendMessage(jid, { 
          text: "⚠️ *Stop spamming!* You are sending messages too fast." 
        }, { quoted: m })
        
        spamTracker.set(sender, [])
        return
      }
    }

    // ২. অ্যান্টি-স্টিকার (Anti-Sticker)
    if (global.antisticker) {
      const isSticker = m.message.stickerMessage || 
                        (m.message.extendedTextMessage?.contextInfo?.quotedMessage?.stickerMessage)

      if (isSticker) {
        await sock.sendMessage(jid, { 
          delete: { 
            remoteJid: jid, 
            fromMe: false, 
            id: m.key.id, 
            participant: m.key.participant 
          } 
        }).catch(() => {})
        
        await sock.sendMessage(jid, { text: "❌ *Stickers are not allowed here!*" })
        return
      }
    }

    // ৩. অ্যান্টি-লিংক (Anti-Link)
    const text = m.message?.conversation || m.message?.extendedTextMessage?.text || m.message?.imageMessage?.caption || ""
    if (getSetting('features.antilink') && jid.endsWith('@g.us') && !m.key.fromMe) {
      const linkRegex = /(https?:\/\/)?(chat\.whatsapp\.com|wa\.me)\/([a-zA-Z0-9]+)/gi
      if (linkRegex.test(text)) {
        await sock.sendMessage(jid, { delete: m.key }).catch(() => {})
        return
      }
    }

    // ৪. কমান্ড হ্যান্ডলার (Command Executer)
    const prefix = getSetting('bot.prefix') || '.'
    if (!text.startsWith(prefix)) return

    const args = text.slice(prefix.length).trim().split(/ +/)
    const cmdName = args.shift().toLowerCase()
    const command = commands.get(cmdName)

    if (command) {
      try {
        await sock.sendMessage(jid, { react: { text: '⏳', key: m.key } })
        await command.execute(m, sock, args, text.slice(prefix.length + cmdName.length).trim(), { jid, sender })
        await sock.sendMessage(jid, { react: { text: '✅', key: m.key } })
      } catch (e) {
        console.error(`Error executing command ${cmdName}:`, e)
        await sock.sendMessage(jid, { react: { text: '❌', key: m.key } })
      }
    }
  } catch (err) {
    console.error("Handle Message Error:", err)
  }
}

/**
 * ২. গ্রুপ ওয়েলকাম ও গুডবাই হ্যান্ডলার (Welcome & Goodbye Handler)
 */
export async function handleGroupParticipants(sock, update) {
  try {
    const { id, participants, action } = update
    if (action !== 'add' && action !== 'remove') return

    const botName = getSetting('bot.name') || '𝑹𝑨𝑯𝑰_𝑴𝑫'
    const menuPic = getSetting('bot.image') || 'https://i.postimg.cc/05p6KqCc/1768548671157.jpg'

    // গ্রুপ মেটাডেটা সেফলি ফেচ করা
    let groupMetadata
    try {
      groupMetadata = await sock.groupMetadata(id)
    } catch (e) {
      console.error("Failed to fetch group metadata:", e)
      return
    }

    const groupName = groupMetadata.subject || 'Our Group'
    const totalMembers = groupMetadata.participants ? groupMetadata.participants.length : 0

    for (const jid of participants) {
      const userNum = jid.split('@')[0]

      // ১. নতুন মেম্বার জয়েন করলে (Welcome)
      if (action === 'add') {
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
              thumbnailUrl: menuPic,
              sourceUrl: "https://whatsapp.com",
              mediaType: 1,
              renderLargerThumbnail: true
            }
          }
        })
      }

      // ২. মেম্বার কিক খেলে বা লিভ নিলে (Goodbye / Left)
      if (action === 'remove') {
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
              thumbnailUrl: menuPic,
              sourceUrl: "https://whatsapp.com",
              mediaType: 1,
              renderLargerThumbnail: true
            }
          }
        })
      }
    }
  } catch (error) {
    console.error("Group Participants Event Error:", error)
  }
    }
