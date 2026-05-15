# 🏥 Mini HBYS - Hastane Bilgi Yönetim Sistemi

> **Tarih:** Nisan 2026  
> **Teknoloji:** ASP.NET Core · SQL Server · React · SignalR  
> **Amaç:** Sağlık bilişimi alanında yetkinlik geliştirmek ve HBYS iş akışlarını uçtan uca öğrenmek amacıyla geliştirilecek bir demo projesidir.

---

## Proje Özeti

Bu proje, bir hastanenin temel iş süreçlerini kapsayan modüler bir Hastane Bilgi Yönetim Sistemi prototipidir. Hastanın polikliniğe gelişinden taburcu olmasına kadar olan süreçleri (hasta kayıt, poliklinik muayene, laboratuvar, radyoloji, yatan hasta takibi, eczane) dijital ortamda yönetmeyi hedefler.

Proje, gerçek bir HBYS'nin küçültülmüş ama fonksiyonel bir yansımasıdır. Sahte (seed) verilerle çalışır; ancak mimari, veri modeli ve iş akışları gerçek senaryolara uygundur.

---

## Modüller

### 1. Hasta Kayıt & Kabul

| Özellik | Açıklama |
|---|---|
| Hasta arama | TC kimlik numarası ile mevcut hasta arama |
| Yeni hasta kaydı | Demografik bilgiler, iletişim, yakın bilgisi, sigorta durumu |
| Kabul işlemi | Poliklinik veya servise kabul oluşturma |
| Sevk yönetimi | Branşlar arası veya kurum dışı sevk kaydı |
| Hasta geçmişi | Tüm kabul, muayene ve tedavi geçmişinin kronolojik görünümü |

### 2. Poliklinik

| Özellik | Açıklama |
|---|---|
| Randevu alma | Branş → Doktor → Tarih/Saat seçimi |
| Canlı sıra takibi | SignalR ile anlık güncellenen sıra ekranı |
| Muayene ekranı | Anamnez, fizik muayene bulguları, vital bulgular |
| Tanı girişi | ICD-10 kodları ile tanı arama ve ekleme |
| Tedavi planı | Tedavi notları, kontrol tarihi belirleme |
| E-Reçete | İlaç veritabanından arama, doz/kullanım şekli, ilaç etkileşim uyarısı |
| Tetkik isteme | Laboratuvar ve radyoloji tetkik istekleri oluşturma |

### 3. Laboratuvar

| Özellik | Açıklama |
|---|---|
| İstek listesi | Doktorlardan gelen tetkik isteklerinin listesi |
| Numune kabul | Numune alındı kaydı, barkod oluşturma |
| Sonuç girişi | Test bazlı sonuç girişi, referans aralık kontrolü |
| Kritik değer uyarısı | Normal dışı sonuçlarda otomatik uyarı (SignalR) |
| Onay akışı | Laborant giriş → Uzman onay iş akışı |
| Bildirim | Sonuç çıktığında doktora ve hastaya anlık bildirim |

### 4. Radyoloji

| Özellik | Açıklama |
|---|---|
| İstek listesi | Gelen radyoloji istekleri |
| Çekim kaydı | Çekim yapıldı/bekliyor durum takibi |
| Rapor yazma | Radyolog tarafından rapor girişi ve onay |
| Görüntü referansı | Görüntü dosyası referansı (DICOM simülasyonu) |

### 5. Yatan Hasta / Servis

| Özellik | Açıklama |
|---|---|
| Yatak haritası | Servis → Oda → Yatak hiyerarşik görünümü (dolu/boş durumu) |
| Yatış işlemi | Hastayı servise yatırma, yatak atama |
| Nakil / Çıkış | Servisler arası nakil, taburcu işlemi |
| Order takibi | Hemşire için ilaç uygulama, vital bulgu kayıt |
| Epikriz | Taburculuk özet belgesi oluşturma |

### 6. Eczane

| Özellik | Açıklama |
|---|---|
| Reçete karşılama | Doktorun yazdığı reçeteleri görüntüleme ve karşılama |
| Stok yönetimi | İlaç stok takibi, minimum stok uyarısı |
| İlaç etkileşim | Reçetedeki ilaçlar arası etkileşim kontrolü |

### 7. Yönetim & Raporlama

| Özellik | Açıklama |
|---|---|
| Kullanıcı yönetimi | Doktor, hemşire, laborant, eczacı, admin rol tanımları |
| Rol bazlı yetkilendirme | Her modüle erişim rol ile kontrol edilir |
| Dashboard | Poliklinik doluluk, yatak doluluk, günlük hasta sayıları |
| İstatistikler | Departman bazlı hasta, tetkik, reçete istatistikleri |
| Excel export | Tarih aralıklı raporları Excel olarak dışa aktarma |

---

## Teknik Mimari

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                         │
│              React + TypeScript                     │
│         (veya Blazor WebAssembly)                   │
│     Recharts / ApexCharts · SignalR Client          │
└──────────────────────┬──────────────────────────────┘
                       │ REST API + SignalR WebSocket
┌──────────────────────┴──────────────────────────────┐
│                  BACKEND                            │
│           ASP.NET Core Web API                      │
│                                                     │
│  ┌─────────┐ ┌──────────┐ ┌───────────┐            │
│  │ Auth &  │ │ Business │ │ SignalR   │            │
│  │ JWT     │ │ Services │ │ Hubs      │            │
│  └─────────┘ └──────────┘ └───────────┘            │
│                                                     │
│  Entity Framework Core · AutoMapper · FluentValid.  │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────┐
│                 SQL SERVER                          │
│                                                     │
│  Hastalar · Doktorlar · Randevular · Muayeneler     │
│  Reçeteler · Labİstekleri · LabSonuçları            │
│  RadyolojiRaporları · Yataklar · Yatışlar           │
│  İlaçlar · StokHareketleri · Kullanıcılar           │
└─────────────────────────────────────────────────────┘
```

### Kullanılan Teknolojiler

| Katman | Teknoloji |
|---|---|
| Backend | ASP.NET Core 8 Web API |
| ORM | Entity Framework Core |
| Gerçek zamanlı | SignalR |
| Kimlik doğrulama | JWT Bearer Token (rol bazlı) |
| Veritabanı | SQL Server |
| Frontend | React 18 + TypeScript (veya Blazor) |
| Grafikler | Recharts / ApexCharts |
| Validasyon | FluentValidation |
| Mapping | AutoMapper |
| Export | ClosedXML (Excel) |

### Referans Veri Setleri

- **ICD-10:** Uluslararası hastalık sınıflandırma kodları (Türkçe)
- **İlaç veritabanı:** Mock ilaç listesi (etken madde, doz formları, etkileşim kuralları)
- **Seed data:** Sahte hasta, doktor ve geçmiş muayene verileri

---

## Geliştirme Planı

Proje aşamalı olarak geliştirilecektir. Her faz sonunda çalışan bir demo üretilebilir.

### Faz 1 — Çekirdek (Tahmini: 2-3 hafta)

- [ ] Proje iskeleti (solution yapısı, katmanlı mimari)
- [ ] Veritabanı şeması ve EF Core migration
- [ ] Kullanıcı/rol yönetimi + JWT auth
- [ ] Hasta kayıt modülü (CRUD + arama)
- [ ] Seed data oluşturma

### Faz 2 — Poliklinik (Tahmini: 2-3 hafta)

- [ ] Randevu sistemi
- [ ] Sıra yönetimi + SignalR canlı ekran
- [ ] Muayene ekranı (anamnez, tanı, tedavi)
- [ ] E-Reçete modülü
- [ ] Tetkik isteme

### Faz 3 — Laboratuvar & Radyoloji (Tahmini: 2 hafta)

- [ ] Lab istek/numune kabul/sonuç iş akışı
- [ ] Kritik değer uyarısı (SignalR)
- [ ] Radyoloji istek/rapor/onay iş akışı

### Faz 4 — Yatan Hasta & Eczane (Tahmini: 2 hafta)

- [ ] Yatak haritası ve yatış/çıkış/nakil
- [ ] Order takibi
- [ ] Epikriz oluşturma
- [ ] Eczane reçete karşılama ve stok

### Faz 5 — Dashboard & Raporlama (Tahmini: 1 hafta)

- [ ] Yönetim dashboard (grafikler, doluluk oranları)
- [ ] Departman bazlı istatistikler
- [ ] Excel export

---

## Proje Yapısı (Önerilen)

```
MiniHBYS/
├── src/
│   ├── MiniHBYS.API/                 # ASP.NET Core Web API
│   │   ├── Controllers/
│   │   ├── Hubs/                     # SignalR Hub'ları
│   │   ├── Middleware/
│   │   └── Program.cs
│   ├── MiniHBYS.Core/                # Entity'ler, DTO'lar, Interface'ler
│   │   ├── Entities/
│   │   ├── DTOs/
│   │   ├── Interfaces/
│   │   └── Enums/
│   ├── MiniHBYS.Business/            # İş mantığı servisleri
│   │   └── Services/
│   ├── MiniHBYS.DataAccess/          # EF Core, Repository, Migration
│   │   ├── Context/
│   │   ├── Repositories/
│   │   ├── Migrations/
│   │   └── Seed/
│   └── MiniHBYS.Web/                 # React veya Blazor frontend
│       ├── src/
│       │   ├── components/
│       │   ├── pages/
│       │   ├── services/
│       │   └── hooks/
│       └── package.json
└── MiniHBYS.sln
```

---

## Hedef & Beklenen Kazanımlar

1. **HBYS iş akışlarının uçtan uca anlaşılması** — hasta kabul, muayene, tetkik, tedavi, taburcu döngüsü
2. **Sağlık bilişimi standartlarına aşinalık** — ICD-10, ilaç etkileşim mantığı, lab referans aralıkları
3. **Kurumsal yazılım deneyimi** — rol bazlı yetkilendirme, çok kullanıcılı eş zamanlı kullanım, gerçek zamanlı bildirim
4. **Mevcut HBYS ekibine katkı potansiyeli** — aynı teknoloji stack'i, benzer mimari yaklaşım

---

> 💡 **Not:** Bu proje tamamen demo/eğitim amaçlıdır. Gerçek hasta verisi içermez. Tüm veriler seed (sahte) olarak üretilmiştir.
