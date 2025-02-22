# Spotify Lyrics

Spotify'da çalan şarkıların sözlerini gerçek zamanlı görüntüleyen bir web uygulaması.

## 🌟 Özellikler

- Spotify hesabı ile giriş yapma
- Çalan şarkının sözlerini gerçek zamanlı görüntüleme
- Şarkı kontrolü  (Spotify Premium gerektirir)
 - Oynat/Duraklat
  - İleri/Geri
  - Ses seviyesi kontrolü
  - Shuffle ve tekrar modu
- Admin paneli ile şarkı sözü yönetimi
- Responsive tasarım

## 🚀 Demo

[https://spotify-lyrics-rose.vercel.app/](https://spotify-lyrics-rose.vercel.app/)

## 🛠️ Teknolojiler

- Next.js 13 (App Router)
- TypeScript
- Tailwind CSS
- Firebase
- Spotify Web API
- Vercel

## 💻 Kurulum

1. Repoyu klonlayın:
```bash
git clone https://github.com/yourusername/spotify-lyrics.git
cd spotify-lyrics
```

2. Bağımlılıkları yükleyin:
```bash
cd frontend
npm install
```

3. `.env.local` dosyasını oluşturun:
```env
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
NEXT_PUBLIC_SPOTIFY_REDIRECT_URI=http://localhost:3000/callback
NEXT_PUBLIC_SPOTIFY_ADMIN_REDIRECT_URI=http://localhost:3000/admin/callback
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Firebase config
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id

# Firebase Admin SDK
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_PRIVATE_KEY=your_firebase_private_key
```

4. Geliştirme sunucusunu başlatın:
```bash
npm run dev
```

## 📝 Kullanım

1. Ana sayfada "Spotify ile Bağlan" butonuna tıklayın
2. Spotify hesabınızla giriş yapın
3. Spotify'da bir şarkı çalmaya başlayın
4. Şarkı sözleri otomatik olarak görüntülenecektir


## 📄 Lisans

MIT Licence


