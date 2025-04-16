# 🎵 Shrimple Lyrics

**Shrimple Lyrics** is a minimal API and web interface for fetching Japanese song lyrics by scraping [Lyrical Nonsense](https://www.lyrical-nonsense.com). Built with pure JavaScript. it's a handy tool for developers and fans looking for lyrics via a simple endpoint.

> 🔗 Live Site: [shrimple-lyrics.vercel.app](https://shrimple-lyrics.vercel.app/)  
> 📦 Example API: [`/lyrics?title=natori%20terminal`](https://shrimple-lyrics.vercel.app/lyrics?title=natori%20terminal)

---

## ✨ Features

- 🔍 Search lyrics by song title  
- ⚡ Lightweight and fast API  
- 🖥️ Web UI for manual searching  
- 🚀 Deployed on Vercel  
- 🔧 Pure JavaScript (no TypeScript)

---

## 🚀 Getting Started
Clone & Install
```bash
git clone https://github.com/lhmchyd/Shrimple-Lyrics.git
```
```bash
cd Shrimple-Lyrics
```
```bash
npm install
```
```bash
npm run dev
```
Visit http://localhost:3000 in your browser.

## 📦 API Usage

Make a `GET` request to:

### Example

```bash
GET https://shrimple-lyrics.vercel.app/lyrics?title=natori%20terminal

```
```bash
{
  "title": "Terminal",
  "artist": "Natori",
  "url": "https://www.lyrical-nonsense.com/global/lyrics/natori/terminal/#Romaji",
  "lyrics": [
    "Mayonaka no manimani, fureru sanso",
    "Tokekonda aironii",
    "Machi wa nemuri ni tsuku, kimi to futari",
    "Itsuka mita yume no naka e",
    "Biru no ue, narabu kage futatsu",
    "Amefuri, machi wa shitoyaka ni",
    "Asa wo matsu, yoru no mukou",
    "Saa, kokyuu wo totonoete",
    "Kikoeru merodi ga boku ni aizu shite",
    "Kasa wo wasurete, odoru",
    "Koko ga bokura no taaminaru",
    "Doko ni datte, tsurete itte ageru",
    "Mayonaka no manimani, uso no sukima",
    "Nibui oto, merii goo rando",
    "Machi wo tsutsumu sairen, mimi wo fusagu",
    "Maboroshi no you na kokoro",
    "Biru no ue, yureru kage hitotsu",
    "Meguru yoru, mabayui hikari ga",
    "Me no mae wo nomikonda, aimai na sen no ue",
    "Nigedashita kyou wa, mata boku wo okizari ni",
    "Sore demo ii to akirameru",
    "Koko ja, boku ni wa tsumaranakute",
    "Motto, shiranai sekai ni ikitai to negatta",
    "Owaranai touhikou wo anata to",
    "Owaranai kakurenbo wo anata to",
    "Nigedashita sekai wo, boku wa okizari ni",
    "Kore de iin da to uso wo tsuku",
    "Mata, kimi no inai hibi ga tsuzuite ikun da",
    "Waraeru hodo, kirei na yoru da",
    "Koko ga bokura no taaminaru",
    "Doko ni datte, tsurete itte ageru yo",
    "Nee, doko de machigaetan darou ka",
    "Wakaranai mama, kono sekai ni sayonara wo",
    "Owaranai touhikou wo anata to",
    "Owaranai kakurenbo wo anata to"
  ]
}

