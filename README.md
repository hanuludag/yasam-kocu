# Yaşam Koçu

Kişisel gün planlayıcı: görev takibi, hedefler, sağlık, finans, ders, iş ve
günlük — hepsi tarayıcında, kendi bilgisayarında çalışır. Hiçbir veri dışarı
gitmez; her şey tarayıcının yerel deposunda (localStorage) tutulur.

Kurulum gerektirmez — Node, Python ya da başka bir çalışma zamanına ihtiyaç
yoktur. Sadece bir tarayıcı yeterli.

## Nasıl çalıştırılır

### Windows
`baslat.bat` dosyasına çift tıkla. Otomatik olarak yerel bir sunucu başlatır
ve tarayıcında `http://localhost:3457` adresini açar.

### Mac / Linux
Bu klasörde bir terminal aç ve aşağıdakilerden birini çalıştır:

```bash
python3 -m http.server 3457
```

sonra tarayıcında `http://localhost:3457` adresini aç.

### Neden doğrudan `index.html`'i açmak yeterli olmuyor?
Bazı tarayıcılar dosyaları `file://` üzerinden açtığında güvenlik
kısıtlamaları uygular. Yukarıdaki yöntemlerden biriyle basit bir yerel
sunucu üzerinden açmak sorunsuz çalışmasını garantiler.

## Veri ve gizlilik
- Tüm veriler yalnızca kendi tarayıcında, `localStorage`'da saklanır.
- Hiçbir sunucuya veri gönderilmez, hesap oluşturma gerekmez.
- Farklı bir tarayıcı veya cihaz kullanırsan veriler görünmez (senkron yok).
- Tarayıcı geçmişini/verilerini temizlersen uygulama verileri de silinir.

## İlk açılış
Uygulamayı ilk açtığında kısa bir tanışma akışı seni karşılar: hangi
alanlarda (Bugün, Hedefler, Okul, İş, Finans, Sağlık, Kişisel Gelişim)
takip yapmak istediğini seçersin. İstediğin zaman "Sayfalar" ekranından
yeni bölümler ekleyebilir veya onboarding'i tekrar açabilirsin.

## Dil
Sağ üstteki "TR / EN" düğmesiyle arayüz dilini anında değiştirebilirsin.

---
Bu proje statik bir web uygulamasıdır (düz HTML/CSS/JS + CDN üzerinden React).
Build adımı yoktur; kaynak kodu doğrudan düzenlenebilir.
