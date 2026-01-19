// src/utils/flags.js

export function getLanguageFlag(language) {
  if (!language) return '🏳️';
  
  const lang = language.toLowerCase();
  
  const flags = {
    'english': '🇺🇸',
    'spanish': '🇪🇸',
    'french': '🇫🇷',
    'german': '🇩🇪',
    'italian': '🇮🇹',
    'portuguese': '🇧🇷',
    'chinese': '🇨🇳',
    'mandarin': '🇨🇳',
    'japanese': '🇯🇵',
    'korean': '🇰🇷',
    'russian': '🇷🇺',
    'arabic': '🇸🇦',
    'hindi': '🇮🇳',
    'hebrew': '🇮🇱',
    'turkish': '🇹🇷',
    'dutch': '🇳🇱',
    'swedish': '🇸🇪',
    'norwegian': '🇳🇴',
    'danish': '🇩🇰',
    'polish': '🇵🇱',
    'ukrainian': '🇺🇦',
    'greek': '🇬🇷',
    'thai': '🇹🇭',
    'vietnamese': '🇻🇳',
    'indonesian': '🇮🇩',
    'bahasa': '🇮🇩',
    'tagalog': '🇵🇭',
    'filipino': '🇵🇭',
    'czech': '🇨🇿',
    'finnish': '🇫🇮',
    'romanian': '🇷🇴',
    'hungarian': '🇭🇺'
  };
  
  // Case-insensitive exact match first
  if (flags[lang]) {
    return flags[lang];
  }
  
  // Then check for substring matches (like your original includes() logic)
  for (const [key, flag] of Object.entries(flags)) {
    if (lang.includes(key)) {
      return flag;
    }
  }
  
  return '🌍';
}
