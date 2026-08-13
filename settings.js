import fs from 'fs';

// ডিফল্ট সেটিংস
let settings = {
  bot: {
    prefix: '.',
    auth: 'pr' // 'pr' = Pairing Code, 'qr' = QR Code
  },
  owner: {
    number: '8801711209381' // ⚠️ এখানে আপনার আসল নম্বর দিন (যেমন: 88017XXXXXXXX)
  },
  features: {
    welcome: true,
    antilink: true
  }
};

export async function loadSettings() {
  try {
    if (fs.existsSync('./settings.json')) {
      const data = fs.readFileSync('./settings.json', 'utf8');
      settings = JSON.parse(data);
    } else {
      fs.writeFileSync('./settings.json', JSON.stringify(settings, null, 2));
    }
  } catch (err) {
    console.error("Error loading settings:", err);
  }
}

export function getSetting(key) {
  const keys = key.split('.');
  let result = settings;
  for (const k of keys) {
    if (result && k in result) {
      result = result[k];
    } else {
      return null;
    }
  }
  return result;
}
