# Yaşam Koçu v2 — Durum Özeti (2026-07-08)

## Proje

- **Konum (yerel geliştirme):** `C:\Users\pc\code claude\yasam-kocu-v2`
- **Teknoloji:** Statik React (CDN) uygulaması — build adımı yok, tüm veri
  `localStorage`'da tutulur.
- **Test sunucusu:** `launch.json` içindeki `yasam-kocu-v2` yapılandırması
  (port 3457) veya `baslat.bat`.
- **GitHub:** Public repo yayında →
  [github.com/hanuludag/yasam-kocu](https://github.com/hanuludag/yasam-kocu)
  (`gh` CLI `hanuludag` ile oturum açık). Paylaşım zip'i: `yasam-kocu-v2.zip`.

## Tamamlanan: Session 1–32'nin tamamı

### Session 1–13: Temel

Temel tasarım sistemi + tüm sayfalar:

- Bugün
- Hedefler
- Sayfalar
- İş
- Finans
- Sağlık
- Ders
- Notlar & Günlük

### Session 14–22: Derinleştirme

- Pomodoro
- Streak dondurma
- XP
- Isı haritası
- Net değer / nakit akışı
- Vücut ölçüleri
- SM-2 flashcard + quiz
- Kariyer / görüşme hazırlığı
- Günlük promptları + ruh hali
- Haftalık sayfası
- Boş Sayfa blok editörü

### Session 23–32: Büyük güncelleme

- Seed veri kaldırıldı (gerçek boş başlangıç)
- 24 saatlik zaman çizelgesi
- Rutin editörü (full CRUD)
- Gelişmiş onboarding (ilk açılışta otomatik)
- Genişletilmiş blok editörü (tablo / alıntı / numaralı liste +
  dönüştür / çoğalt)
- Sağlık detaylı takip (kalori, yemek programı, ilaç, şeker)
- Responsive (masaüstünde sidebar)
- Reload'suz TR/EN dil geçişi
- Görsel zenginlik
- `enabledSections` ile Bugün / Hedefler / Sağlık'ta bölüm özelleştirme
  ("+ Bölüm ekle")

## Kasıtlı ertelenenler

- AI özellikleri (indigo `#4F46E5` rezerve)
- Push bildirim / uygulama engelleme (OS izni gerekiyor)
- Takvim senkronu (OAuth gerekiyor)
- Sosyal / backend fazı
