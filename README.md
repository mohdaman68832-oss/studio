
# InnovateSphere | Orange Edition

This is a NextJS + Firebase application built in Firebase Studio.

## 🔗 GitHub Sync (GitHub par code kaise bhejein)
Aapko terminal use karne ki zaroorat nahi hai. Mobile par ye steps follow karein:
1. **Source Control Tab**: IDE ke left side mein teesre (3rd) icon par click karein (jo v-shape/branch jaisa dikhta hai).
2. **Commit**: Upar box mein ek message likhein (jaise "Update code") aur 'Commit' button dabayein.
3. **Push**: Phir teen dots (...) par click karke 'Push' select karein. Aapka code GitHub par dikhne lagega.

## 🚀 Firebase Terminal Errors (Login Fail kyu hota hai?)
Agar aap terminal mein `firebase login` karte hain aur error aata hai, toh ye isliye hai kyunki wo link mobile par nahi khulta.
- **Solution**: Terminal mein ye command chalayein: `firebase login --no-localhost`
- Isse ek code aayega jise aap manually copy-paste kar sakte hain.
- **Note**: Firebase Studio mein login ki zaroorat nahi padti, aapka project pehle se hi connected hai.

## 🛠 Tech Stack
- **Next.js 15 (App Router)**
- **Firebase** (Auth, Firestore)
- **Tailwind CSS**
- **ShadCN UI**
- **Genkit** (AI Analysis)

## 📱 Mobile Workflow
1. **No Terminal Needed**: Saare packages main automatically `package.json` se install kar deta hoon.
2. **Auto-Sync**: Aapka code preview window mein turant update hota hai.
3. **GitHub Visibility**: Agar GitHub par code nahi dikh raha, toh Source Control tab se "Push" kijiye.
