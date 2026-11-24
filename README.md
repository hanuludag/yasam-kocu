# Kalori & Su

Telefon öncelikli, tek dosyalık (`index.html`) kalori, makro ve su takip uygulaması. Harici kütüphane, font ya da ikon yüklemez.

**Canlı sayfa:** https://claude.ai/artifact/3vzLx3RCuEDzFnt4v7VVrV

## Ekranlar
- **Bugün:** kalan kalori halkası (hedef aşılınca "X kcal fazla"), protein/karbonhidrat/yağ çubukları, su kartı (+200/+330/+500, özel miktar, son eklemeyi geri al), öğünler (Kahvaltı, Öğle, Akşam, Atıştırmalık). Geçmiş günlere gidilebilir, gelecek güne gidilemez.
- **Fotoğrafla ekle:** fotoğraf 1024 px / JPEG %80'e küçültülür, Claude yemekleri tanır; sonuçlar düzenlenebilir.
- **Sesle ekle:** konuşma yazıya çevrilir, Claude yemekleri çıkarır. Mikrofon yoksa yazarak da kullanılabilir.
- **Elle ekle:** arama, sık kullanılanlar, son yenenler ve elle giriş formu.
- **Raporlar:** hafta/ay; günlük kalori, ortalamalar, makro dağılımı, su, kilo grafiği ve dönem özeti.
- **Hedef:** amaç, profil, aktivite; Mifflin-St Jeor ile otomatik ya da elle hedefler; kilo kaydı.
- **Geçmiş:** aylara göre günlük kalori ve su listesi.

900 px üstünde sol menülü masaüstü düzenine geçer.

## Veri
claude.ai Artifact içinde açıldığında kayıtlar kullanıcıya özel bulut veritabanında tutulur (`data/users/<id>/profile` altında `meals`, `water`, `weights`, `favorites`), böylece telefon ve bilgisayarda ortaktır. Bulut kullanılamazsa uygulama tarayıcı depolamasına geçer ve bunu üstteki uyarıyla belirtir. Tarihler her zaman cihazın yerel saatine göre (`YYYY-MM-DD`) hesaplanır.

Fotoğraf/ses tanıma ve sesle yazma yalnızca claude.ai Artifact görünümünde çalışır; dosya doğrudan tarayıcıda açılırsa elle ekleme kullanılabilir.
