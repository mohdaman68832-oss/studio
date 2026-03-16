
# InnovateSphere | Orange Edition

This is a NextJS + Firebase application built in Firebase Studio.

## ✅ Kaise Check Karein ki Connect Hua ya Nahi? (Surgical Check)

1. **GitHub Par Code Dekhein**: Is link par click karein: [studio.git](https://github.com/mohdaman68832-oss/studio.git). Agar wahan saari files (src, package.json) dikh rahi hain, toh aapka code **GitHub se connect ho gaya hai!**
2. **Website Kahan Hai?**: GitHub par sirf code rehta hai. Aapki website ka link aapke **Firebase Console** mein Hosting section mein milega.

---

## 🚀 GitHub Sync Guide (Surgical Steps)
Agar aapka code GitHub par nahi dikh raha aur Blue Button nahi dab raha, toh ye 100% kaam karega:

1.  **Step 1 (SABSE ZAROORI)**: Left sidebar mein **3rd icon** (Source Control) par click karein.
2.  **Step 2 (Stage Karein)**: Jahan "Changes" likha hai, uske thik saamne ek **Plus (+)** icon hoga. Agar icon nahi dikh raha, toh "Changes" wali line par **mouse/ungli le jaayin**, tab wo dikhne lagega. Use dabayein taaki saari files "Staged" ho jayein.
3.  **Step 3 (Alternative)**: Agar phir bhi `+` nahi mil raha, toh upar teen dot **(...)** par click karein aur **Changes > Stage All** select karein.
4.  **Step 4 (Message)**: Upar khali box mein type karein: `Update Code`.
5.  **Step 5 (Commit)**: Ab niche wala **Blue Button** dark ho jayega. Us par click karein (**'Commit'** ya **'Commit change on main'**).
6.  **Step 6 (Push)**: Commit ke baad wahi par ek naya blue button aayega **'Sync Changes'** ya **'Push'** naam se. Use dabayein aur **OK** kar dein.

Ab aap apne GitHub Repo ko refresh karke dekhein, aapka code wahan 100% dikhne lagega!

## 🛠 Web vs Android
- **Web App**: Saari configuration `src/firebase/config.ts` mein hai. `google-services.json` ki zaroorat nahi hai.
- **Folder Structure**: `src` folder ke bahar `package.json` aur `firebase.json` dikhni chahiye. `public` folder agar khali hai toh kabhi kabhi dikhta nahi hai, par `src` zaroor dikhna chahiye.

## 📱 Tech Stack
- Next.js 15 (App Router)
- Firebase (Auth, Firestore, Hosting)
- Tailwind CSS & ShadCN UI
