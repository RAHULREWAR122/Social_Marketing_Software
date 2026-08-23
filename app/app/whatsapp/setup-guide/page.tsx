"use client";

import Link from "next/link";
import { useState } from "react";

type Lang = "en" | "hi";

const STEPS: { title: Record<Lang, string>; body: Record<Lang, string[]> }[] = [
  {
    title: {
      en: "1. Create a Meta Business Portfolio (if you don't have one)",
      hi: "1. Meta Business Portfolio बनाएं (यदि पहले से नहीं है)",
    },
    body: {
      en: [
        "Go to business.facebook.com",
        "Sign in with your Facebook account and create a Business Portfolio for your company, if you haven't already.",
      ],
      hi: [
        "business.facebook.com पर जाएं।",
        "अपने Facebook खाते से साइन इन करें और अपनी कंपनी के लिए एक Business Portfolio बनाएं, यदि आपने अभी तक नहीं बनाया है।",
      ],
    },
  },
  {
    title: {
      en: "2. Create a Meta App with WhatsApp",
      hi: "2. WhatsApp के साथ एक Meta App बनाएं",
    },
    body: {
      en: [
        "Go to developers.facebook.com/apps",
        'Click "Create App", choose "Business" as the app type, and follow the prompts.',
        'Once created, on your app\'s dashboard, find "WhatsApp" in the product list and click "Set up".',
      ],
      hi: [
        "developers.facebook.com/apps पर जाएं।",
        '"Create App" पर क्लिक करें, ऐप टाइप के रूप में "Business" चुनें, और आगे के निर्देशों का पालन करें।',
        'ऐप बनने के बाद, ऐप के डैशबोर्ड में प्रोडक्ट लिस्ट में "WhatsApp" ढूंढें और "Set up" पर क्लिक करें।',
      ],
    },
  },
  {
    title: {
      en: "3. Find your Phone Number ID and WhatsApp Business Account ID",
      hi: "3. अपना Phone Number ID और WhatsApp Business Account ID खोजें",
    },
    body: {
      en: [
        "In your app, go to WhatsApp > API Setup.",
        'You\'ll see a "From" section with a test phone number already set up — the Phone Number ID is shown right there.',
        'The WhatsApp Business Account ID is also shown on this same page (sometimes labeled "WhatsApp Business Account").',
        "If you're using your own business phone number instead of the test number, add it under WhatsApp Manager > Phone Numbers, and its ID will appear there.",
      ],
      hi: [
        "अपने ऐप में, WhatsApp > API Setup पर जाएं।",
        'आपको एक "From" सेक्शन दिखेगा जिसमें पहले से एक टेस्ट फ़ोन नंबर मौजूद होगा — Phone Number ID वहीं दिखाया जाता है।',
        'WhatsApp Business Account ID भी इसी पेज पर दिखाई देता है (कभी-कभी इसे "WhatsApp Business Account" कहा जाता है)।',
        "यदि आप टेस्ट नंबर के बजाय अपना खुद का बिज़नेस फ़ोन नंबर उपयोग कर रहे हैं, तो उसे WhatsApp Manager > Phone Numbers में जोड़ें, और उसका ID वहाँ दिखाई देगा।",
      ],
    },
  },
  {
    title: {
      en: "4. Get a permanent access token",
      hi: "4. स्थायी (Permanent) एक्सेस टोकन प्राप्त करें",
    },
    body: {
      en: [
        "The token shown on the API Setup page by default expires in 24 hours — don't use that one here.",
        "Go to business.facebook.com/settings > Users > System Users.",
        "Create a new System User (or use an existing one) with Admin access.",
        'Under "Assign assets", give this System User full control of your WhatsApp Business Account.',
        'Click "Generate new token", select your app, and check the permissions: whatsapp_business_messaging and whatsapp_business_management.',
        "Copy the token immediately — Meta only shows it once. This is your permanent access token.",
      ],
      hi: [
        "API Setup पेज पर डिफ़ॉल्ट रूप से दिखाया गया टोकन केवल 24 घंटे में समाप्त हो जाता है — इसका उपयोग यहाँ न करें।",
        "business.facebook.com/settings > Users > System Users पर जाएं।",
        "एक नया System User बनाएं (या मौजूदा का उपयोग करें) और उसे Admin एक्सेस दें।",
        '"Assign assets" के अंतर्गत, इस System User को अपने WhatsApp Business Account का पूर्ण नियंत्रण दें।',
        '"Generate new token" पर क्लिक करें, अपना ऐप चुनें, और ये permissions चेक करें: whatsapp_business_messaging और whatsapp_business_management।',
        "टोकन को तुरंत कॉपी कर लें — Meta इसे केवल एक बार दिखाता है। यही आपका स्थायी एक्सेस टोकन है।",
      ],
    },
  },
  {
    title: {
      en: "5. Business name & display phone number",
      hi: "5. बिज़नेस नाम और डिस्प्ले फ़ोन नंबर",
    },
    body: {
      en: [
        'Business name: shown in Meta Business Settings under "Business info".',
        "Display phone number: your actual WhatsApp number, shown in WhatsApp Manager > Phone Numbers.",
      ],
      hi: [
        'बिज़नेस नाम: Meta Business Settings में "Business info" के अंतर्गत दिखाया जाता है।',
        "डिस्प्ले फ़ोन नंबर: आपका असली WhatsApp नंबर, जो WhatsApp Manager > Phone Numbers में दिखाया जाता है।",
      ],
    },
  },
];

const TEXT = {
  title: { en: "Where to find your WhatsApp Business API details", hi: "अपनी WhatsApp Business API जानकारी कहाँ से प्राप्त करें" },
  intro: {
    en: "You need three things from Meta (Facebook) to connect your WhatsApp Business account here: a WhatsApp Business Account ID, a Phone Number ID, and a permanent access token. Here's exactly where to find each one.",
    hi: "यहाँ अपना WhatsApp Business खाता जोड़ने के लिए आपको Meta (Facebook) से तीन चीज़ें चाहिए: WhatsApp Business Account ID, Phone Number ID, और एक स्थायी एक्सेस टोकन। नीचे बताया गया है कि हर एक चीज़ ठीक-ठीक कहाँ मिलेगी।",
  },
  note: {
    en: "Meta's dashboard layout changes from time to time. If a menu name doesn't match exactly, look for the closest equivalent.",
    hi: "Meta का डैशबोर्ड समय-समय पर बदलता रहता है। यदि कोई मेन्यू नाम ठीक-ठीक न मिले, तो उसके सबसे नज़दीकी विकल्प को देखें।",
  },
  back: { en: "Back to WhatsApp settings", hi: "WhatsApp सेटिंग्स पर वापस जाएं" },
};

export default function WhatsAppSetupGuidePage() {
  const [lang, setLang] = useState<Lang>("en");

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{TEXT.title[lang]}</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{TEXT.intro[lang]}</p>
        </div>
        <div className="flex shrink-0 rounded-lg border border-black/[.08] p-0.5 text-sm dark:border-white/[.145]">
          <button
            onClick={() => setLang("en")}
            className={`rounded-md px-3 py-1 font-medium ${
              lang === "en" ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950" : "text-zinc-500"
            }`}
          >
            EN
          </button>
          <button
            onClick={() => setLang("hi")}
            className={`rounded-md px-3 py-1 font-medium ${
              lang === "hi" ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950" : "text-zinc-500"
            }`}
          >
            हिंदी
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        {STEPS.map((step) => (
          <section
            key={step.title.en}
            className="rounded-xl border border-black/[.08] bg-white p-5 dark:border-white/[.145] dark:bg-zinc-950"
          >
            <h2 className="font-semibold">{step.title[lang]}</h2>
            <ul className="mt-2 flex flex-col gap-1.5 text-sm text-zinc-600 dark:text-zinc-400">
              {step.body[lang].map((line) => (
                <li key={line} className="flex gap-2">
                  <span className="text-zinc-400">•</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-300">
        {TEXT.note[lang]}
      </p>

      <Link href="/app/whatsapp" className="text-sm font-medium text-zinc-600 hover:underline dark:text-zinc-400">
        ← {TEXT.back[lang]}
      </Link>
    </div>
  );
}
