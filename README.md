# Mini HBYS

Küçük ölçekli bir Hastane Bilgi Yönetim Sistemi. Hasta, doktor, randevu ve muayene kayıtlarını tek bir arayüzden yönetmek için yazıldı. Backend'de .NET 8 Web API, frontend'de React + Vite, veritabanı olarak PostgreSQL kullanır.

## Özellikler

- Hasta CRUD (TC kimlik ile arama)
- Doktor CRUD (branşa göre filtreleme)
- Randevu oluşturma (30 dakikalık slot çakışma kontrolü), durum güncelleme, iptal
- Muayene kayıtları (sadece tamamlanmış randevular için)
- Dashboard: genel istatistikler ve branş bazlı dağılım
- Global exception middleware ve standart `ApiResponse<T>` formatı
- FluentValidation ile DTO doğrulama
- Swagger UI (dev ortamında `/swagger` adresinden erişilebilir)

## Teknoloji

**Backend**
- .NET 8, ASP.NET Core Web API
- Entity Framework Core 8 + Npgsql (PostgreSQL)
- AutoMapper, FluentValidation
- Swashbuckle (Swagger/OpenAPI)

**Frontend**
- React 19, TypeScript, Vite
- React Router, React Hook Form, Axios
- Tailwind CSS, lucide-react, recharts, date-fns
- react-hot-toast

**Veritabanı**
- PostgreSQL 14+

## Kurulum

### 1. Gereksinimler
- .NET 8 SDK
- Node.js 20+
- PostgreSQL 14+

### 2. Veritabanı

PostgreSQL'de `MiniHBYS` adında bir veritabanı oluştur. Bağlantı bilgisini `MiniHBYS.API/appsettings.json` içindeki `ConnectionStrings:DefaultConnection` alanına göre ayarla. Varsayılan:

```
Host=localhost;Port=5432;Database=MiniHBYS;Username=postgres;Password=postgres
```

### 3. Migration

Proje kökünden:

```bash
dotnet ef database update --project MiniHBYS.DataAccess --startup-project MiniHBYS.API
```

`dotnet-ef` aracı kurulu değilse:

```bash
dotnet tool install --global dotnet-ef
```

Uygulama ilk açılışta (Development ortamında) örnek veri de ekler.

### 4. Backend

```bash
cd MiniHBYS.API
dotnet run
```

API varsayılan olarak `https://localhost:5001` üzerinde çalışır. Swagger UI: `https://localhost:5001/swagger`.

### 5. Frontend

```bash
cd mini-hbys-web
npm install
npm run dev
```

Uygulama `http://localhost:5173` üzerinde açılır. API adresini değiştirmek için `mini-hbys-web/src/services/apiClient.ts` dosyasına bakabilirsin.

## API Endpoint Listesi

### Patients
| Method | URL | Açıklama |
| --- | --- | --- |
| GET    | `/api/patients`              | Tüm hastaları listeler |
| GET    | `/api/patients/{id}`         | Id'ye göre hasta getirir |
| GET    | `/api/patients/tc/{nationalId}` | TC kimlik ile hasta getirir |
| POST   | `/api/patients`              | Yeni hasta oluşturur |
| PUT    | `/api/patients/{id}`         | Hasta bilgilerini günceller |
| DELETE | `/api/patients/{id}`         | Hastayı siler (soft delete) |

### Doctors
| Method | URL | Açıklama |
| --- | --- | --- |
| GET    | `/api/doctors`                | Tüm doktorları listeler |
| GET    | `/api/doctors/{id}`           | Id'ye göre doktor getirir |
| GET    | `/api/doctors/branch/{branch}`| Branşa göre doktorları listeler |
| POST   | `/api/doctors`                | Yeni doktor oluşturur |
| PUT    | `/api/doctors/{id}`           | Doktor bilgilerini günceller |
| DELETE | `/api/doctors/{id}`           | Doktoru siler (soft delete) |

### Appointments
| Method | URL | Açıklama |
| --- | --- | --- |
| GET    | `/api/appointments`                 | Tüm randevuları listeler |
| GET    | `/api/appointments/{id}`            | Id'ye göre randevu getirir |
| GET    | `/api/appointments/doctor/{id}`     | Doktora ait randevuları listeler |
| GET    | `/api/appointments/patient/{id}`    | Hastaya ait randevuları listeler |
| POST   | `/api/appointments`                 | Yeni randevu oluşturur (çakışma kontrolü) |
| PUT    | `/api/appointments/{id}/status`     | Randevu durumunu günceller |
| DELETE | `/api/appointments/{id}/cancel`     | Randevuyu iptal eder |

### MedicalRecords
| Method | URL | Açıklama |
| --- | --- | --- |
| GET    | `/api/medical-records`                      | Tüm muayene kayıtlarını listeler |
| GET    | `/api/medical-records/patient/{patientId}`  | Hastaya ait kayıtları listeler |
| GET    | `/api/medical-records/appointment/{id}`     | Randevuya ait kaydı getirir |
| POST   | `/api/medical-records`                      | Yeni muayene kaydı oluşturur |
| PUT    | `/api/medical-records/{id}`                 | Muayene kaydını günceller |

### Dashboard
| Method | URL | Açıklama |
| --- | --- | --- |
| GET    | `/api/dashboard/stats` | Genel istatistikleri döner |


## Proje Yapısı

```
HBYSproje/
├── MiniHBYS.API/                 # Web API (controller'lar, middleware, Program.cs)
│   ├── Controllers/
│   ├── Middleware/
│   └── Swagger/
├── MiniHBYS.Business/            # İş kuralları
│   ├── Mappings/                 # AutoMapper profilleri
│   ├── Services/                 # Servis implementasyonları
│   └── Validators/               # FluentValidation kuralları
├── MiniHBYS.Core/                # Domain katmanı
│   ├── DTOs/
│   ├── Entities/
│   ├── Enums/
│   └── Interfaces/
├── MiniHBYS.DataAccess/          # Veri erişim katmanı
│   ├── Context/                  # AppDbContext
│   ├── Migrations/               # EF Core migration'ları
│   ├── Repositories/             # Generic repository
│   └── Seed/                     # Örnek veri
├── mini-hbys-web/                # React frontend
│   └── src/
│       ├── components/           # UI ve layout bileşenleri
│       ├── pages/                # Dashboard, patients, doctors, appointments, medical-records
│       ├── services/             # API istemcileri
│       └── types/                # Ortak TypeScript tipleri
└── MiniHBYS.sln
```
