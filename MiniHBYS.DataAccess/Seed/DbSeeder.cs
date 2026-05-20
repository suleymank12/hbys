using Microsoft.EntityFrameworkCore;
using MiniHBYS.Core.Entities;
using MiniHBYS.Core.Enums;
using MiniHBYS.DataAccess.Context;

namespace MiniHBYS.DataAccess.Seed;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext context)
    {
        await context.Database.MigrateAsync();

        await SeedSystemUsersAsync(context);
        await SeedDoctorsAsync(context);
        await SeedDoctorSchedulesAsync(context);
        await SeedIcd10CodesAsync(context);

        var patients = SeedPatients();

        if (await context.Patients.AnyAsync())
        {
            await MigratePatientIdentitiesAsync(context);
            await BackfillPatientDetailsAsync(context, patients);
            return;
        }

        var doctors = await context.Doctors
            .Include(d => d.User)
            .ToListAsync();

        await context.Patients.AddRangeAsync(patients);
        await context.SaveChangesAsync();

        var appointments = SeedAppointments(doctors, patients);
        await context.Appointments.AddRangeAsync(appointments);
        await context.SaveChangesAsync();

        var records = SeedMedicalRecords(appointments);
        await context.MedicalRecords.AddRangeAsync(records);
        await context.SaveChangesAsync();

        await SeedSamplePrescriptionsAsync(context, records);
    }

    private static async Task SeedSamplePrescriptionsAsync(AppDbContext context, List<MedicalRecord> records)
    {
        if (await context.Prescriptions.AnyAsync()) return;

        // İlk 5 tamamlanmış muayene kaydına örnek reçete ekle.
        var samples = new (string Diagnosis, List<PrescriptionItem> Items)[]
        {
            ("Akut üst solunum yolu enfeksiyonu, tanımlanmamış", new List<PrescriptionItem>
            {
                new() { MedicationName = "Parol 500 mg tablet",      Dosage = "500 mg", Frequency = "Günde 3 kez", Duration = "5 gün", Instructions = "Yemeklerden sonra" },
                new() { MedicationName = "Augmentin 1000 mg tablet", Dosage = "1000 mg", Frequency = "Günde 2 kez", Duration = "7 gün", Instructions = "Aç karnına" }
            }),
            ("Esansiyel (primer) hipertansiyon", new List<PrescriptionItem>
            {
                new() { MedicationName = "Coversyl 5 mg tablet", Dosage = "5 mg", Frequency = "Günde 1 kez (sabah)", Duration = "30 gün" },
                new() { MedicationName = "Norvasc 5 mg tablet",  Dosage = "5 mg", Frequency = "Günde 1 kez (akşam)", Duration = "30 gün" }
            }),
            ("Akut bronşit, tanımlanmamış", new List<PrescriptionItem>
            {
                new() { MedicationName = "Klacid 500 mg tablet",  Dosage = "500 mg", Frequency = "Günde 2 kez", Duration = "7 gün",  Instructions = "Yemekle birlikte" },
                new() { MedicationName = "Bisolvon şurup",        Dosage = "10 ml",  Frequency = "Günde 3 kez", Duration = "5 gün" }
            }),
            ("Tip 2 diabetes mellitus (komplikasyonsuz)", new List<PrescriptionItem>
            {
                new() { MedicationName = "Glucophage 1000 mg tablet", Dosage = "1000 mg", Frequency = "Günde 2 kez", Duration = "90 gün", Instructions = "Yemeklerle birlikte" }
            }),
            ("Bel ağrısı", new List<PrescriptionItem>
            {
                new() { MedicationName = "Voltaren 75 mg tablet", Dosage = "75 mg", Frequency = "Günde 2 kez", Duration = "10 gün", Instructions = "Yemeklerden sonra" },
                new() { MedicationName = "Myolastan tablet",      Dosage = "1 tablet", Frequency = "Yatmadan önce", Duration = "10 gün" }
            }),
        };

        var counter = 1;
        foreach (var sample in samples)
        {
            var record = records.FirstOrDefault(r => r.Diagnosis == sample.Diagnosis);
            if (record is null) continue;

            await context.Prescriptions.AddAsync(new Prescription
            {
                MedicalRecord = record,
                PrescriptionNumber = $"RX-{counter:D6}",
                PrescribedAt = record.CreatedAt,
                Items = sample.Items,
                CreatedAt = record.CreatedAt,
                IsActive = true
            });
            counter++;
        }
        await context.SaveChangesAsync();
    }

    private static async Task SeedSystemUsersAsync(AppDbContext context)
    {
        var systemUsers = new (string Name, string Email, string Password, UserRole Role)[]
        {
            ("Sistem Yöneticisi", "admin@minihbys.com",    "Admin1234!",   UserRole.Admin),
            ("Sekreter",          "sekreter@minihbys.com", "Sekreter123!", UserRole.Sekreter)
        };

        foreach (var u in systemUsers)
        {
            if (await context.Users.AnyAsync(x => x.Email == u.Email))
                continue;

            await context.Users.AddAsync(new User
            {
                Name = u.Name,
                Email = u.Email,
                Password = BCrypt.Net.BCrypt.HashPassword(u.Password),
                Role = u.Role,
                CreatedAt = DateTime.UtcNow,
                IsActive = true
            });
        }
        await context.SaveChangesAsync();
    }

    private static async Task SeedDoctorsAsync(AppDbContext context)
    {
        var data = new (string Title, string Name, string Branch, string Email)[]
        {
            ("Uzm. Dr.",  "Ahmet Yılmaz",   "Dahiliye",    "ahmet.yilmaz@minihbys.com"),
            ("Dr.",       "Ayşe Demir",     "Dahiliye",    "ayse.demir@minihbys.com"),
            ("Prof. Dr.", "Mehmet Kaya",    "Kardiyoloji", "mehmet.kaya@minihbys.com"),
            ("Doç. Dr.",  "Fatma Şahin",    "Kardiyoloji", "fatma.sahin@minihbys.com"),
            ("Op. Dr.",   "Mustafa Çelik",  "Ortopedi",    "mustafa.celik@minihbys.com"),
            ("Uzm. Dr.",  "Zeynep Arslan",  "Ortopedi",    "zeynep.arslan@minihbys.com"),
            ("Op. Dr.",   "Hasan Doğan",    "Göz",         "hasan.dogan@minihbys.com"),
            ("Uzm. Dr.",  "Emine Koç",      "Göz",         "emine.koc@minihbys.com"),
            ("Doç. Dr.",  "Ali Aydın",      "KBB",         "ali.aydin@minihbys.com"),
            ("Uzm. Dr.",  "Hatice Öztürk",  "KBB",         "hatice.ozturk@minihbys.com"),
        };

        var password = BCrypt.Net.BCrypt.HashPassword("Doctor123!");

        foreach (var d in data)
        {
            if (await context.Doctors.AnyAsync(x => x.User.Email == d.Email))
                continue;
            if (await context.Users.AnyAsync(u => u.Email == d.Email))
                continue;

            var displayName = $"{d.Title} {d.Name}";
            var user = new User
            {
                Name = displayName,
                Email = d.Email,
                Password = password,
                Role = UserRole.Doktor,
                CreatedAt = DateTime.UtcNow,
                IsActive = true
            };
            await context.Users.AddAsync(user);
            await context.SaveChangesAsync();

            await context.Doctors.AddAsync(new Doctor
            {
                Title = d.Title,
                Name = d.Name,
                Branch = d.Branch,
                UserId = user.Id,
                CreatedAt = DateTime.UtcNow,
                IsActive = true
            });
        }
        await context.SaveChangesAsync();
    }

    private static async Task SeedDoctorSchedulesAsync(AppDbContext context)
    {
        // Bir doktorun günlük plan haritası: (gün => başlangıç-bitiş)
        // Hafta içi 08-17 default; bazı doktorlar için farklı düzen.
        var overrides = new Dictionary<string, Dictionary<int, (TimeSpan Start, TimeSpan End)>>
        {
            // Cumartesi de çalışan kardiyolog
            ["mehmet.kaya@minihbys.com"] = new()
            {
                [1] = (new TimeSpan(9, 0, 0),  new TimeSpan(18, 0, 0)),
                [2] = (new TimeSpan(9, 0, 0),  new TimeSpan(18, 0, 0)),
                [3] = (new TimeSpan(9, 0, 0),  new TimeSpan(18, 0, 0)),
                [4] = (new TimeSpan(9, 0, 0),  new TimeSpan(18, 0, 0)),
                [5] = (new TimeSpan(9, 0, 0),  new TimeSpan(18, 0, 0)),
                [6] = (new TimeSpan(9, 0, 0),  new TimeSpan(13, 0, 0)),
            },
            // Yarım gün çalışan göz doktoru (öğleden sonra)
            ["emine.koc@minihbys.com"] = new()
            {
                [1] = (new TimeSpan(13, 0, 0), new TimeSpan(18, 0, 0)),
                [2] = (new TimeSpan(13, 0, 0), new TimeSpan(18, 0, 0)),
                [3] = (new TimeSpan(13, 0, 0), new TimeSpan(18, 0, 0)),
                [4] = (new TimeSpan(13, 0, 0), new TimeSpan(18, 0, 0)),
                [5] = (new TimeSpan(13, 0, 0), new TimeSpan(18, 0, 0)),
            },
            // Sadece Pzt-Çar-Cum çalışan ortopedist
            ["mustafa.celik@minihbys.com"] = new()
            {
                [1] = (new TimeSpan(8, 0, 0), new TimeSpan(17, 0, 0)),
                [3] = (new TimeSpan(8, 0, 0), new TimeSpan(17, 0, 0)),
                [5] = (new TimeSpan(8, 0, 0), new TimeSpan(17, 0, 0)),
            },
        };

        var doctors = await context.Doctors
            .Include(d => d.User)
            .Include(d => d.Schedules)
            .ToListAsync();

        var defaultSchedule = new Dictionary<int, (TimeSpan Start, TimeSpan End)>
        {
            [1] = (new TimeSpan(8, 0, 0), new TimeSpan(17, 0, 0)),
            [2] = (new TimeSpan(8, 0, 0), new TimeSpan(17, 0, 0)),
            [3] = (new TimeSpan(8, 0, 0), new TimeSpan(17, 0, 0)),
            [4] = (new TimeSpan(8, 0, 0), new TimeSpan(17, 0, 0)),
            [5] = (new TimeSpan(8, 0, 0), new TimeSpan(17, 0, 0)),
        };

        foreach (var doctor in doctors)
        {
            if (doctor.Schedules.Any()) continue;

            var plan = overrides.TryGetValue(doctor.User.Email, out var custom)
                ? custom
                : defaultSchedule;

            foreach (var (day, range) in plan)
            {
                await context.DoctorSchedules.AddAsync(new DoctorSchedule
                {
                    DoctorId = doctor.Id,
                    DayOfWeek = day,
                    StartTime = range.Start,
                    EndTime = range.End,
                    CreatedAt = DateTime.UtcNow,
                    IsActive = true
                });
            }
        }

        await context.SaveChangesAsync();
    }

    private static List<Patient> SeedPatients()
    {
        var seq = 0;
        Patient P(
            string name, string surname, string nationalId, DateTime birthDate,
            Gender gender, BloodType blood, InsuranceType insurance,
            string phone, string? email, string city, string district, string address,
            string emergencyName, string emergencyPhone,
            string allergies, string chronic)
            => new()
            {
                ProtocolNumber = $"P-{++seq:D6}",
                Name = name,
                Surname = surname,
                NationalId = nationalId,
                BirthDate = DateTime.SpecifyKind(birthDate, DateTimeKind.Utc),
                Gender = gender,
                BloodType = blood,
                InsuranceType = insurance,
                Phone = phone,
                Email = email,
                City = city,
                District = district,
                Address = address,
                EmergencyContactName = emergencyName,
                EmergencyContactPhone = emergencyPhone,
                Allergies = allergies,
                ChronicDiseases = chronic
            };

        return new List<Patient>
        {
            P("Mehmet",  "Yıldız",   "10000000001", new(1985, 3, 12),  Gender.Erkek, BloodType.ARhPositive,  InsuranceType.SGK,     "05321112201", "mehmet.yildiz@example.com",  "İstanbul",  "Kadıköy",      "Caferağa Mah., Moda Cad. No:42 D:5",         "Ayşe Yıldız (Eş)",     "05331114401", "Penisilin",     "Hipertansiyon"),
            P("Ayşe",    "Kurt",     "10000000002", new(1990, 7, 25),  Gender.Kadın, BloodType.BRhPositive,  InsuranceType.SGK,     "05321112202", "ayse.kurt@example.com",      "İstanbul",  "Beşiktaş",     "Levent Mah., Büyükdere Cad. No:128 D:12",    "Mehmet Kurt (Eş)",     "05331114402", "Yok",           "Yok"),
            P("Ali",     "Çetin",    "10000000003", new(1978, 11, 5),  Gender.Erkek, BloodType.ORhPositive,  InsuranceType.Ozel,    "05321112203", "ali.cetin@example.com",      "Ankara",    "Çankaya",      "Kavaklıdere Mah., Tunalı Hilmi Cad. No:71 D:8", "Hatice Çetin (Eş)",  "05331114403", "Polen, Toz",    "Astım"),
            P("Fatma",   "Aksoy",    "10000000004", new(2001, 1, 18),  Gender.Kadın, BloodType.ARhPositive,  InsuranceType.SGK,     "05321112204", "fatma.aksoy@example.com",    "İzmir",     "Karşıyaka",    "Bostanlı Mah., Cemal Gürsel Cad. No:215 D:3",   "Hasan Aksoy (Baba)", "05331114404", "Yok",           "Yok"),
            P("Hüseyin", "Polat",    "10000000005", new(1965, 9, 30),  Gender.Erkek, BloodType.ABRhPositive, InsuranceType.SGK,     "05321112205", "huseyin.polat@example.com",  "Bursa",     "Nilüfer",      "Beşevler Mah., İzmir Yolu Cad. No:312 D:7",     "Sevim Polat (Eş)",   "05331114405", "Aspirin",       "Tip 2 Diyabet, Hipertansiyon"),
            P("Emine",   "Erdoğan",  "10000000006", new(1995, 5, 10),  Gender.Kadın, BloodType.ARhNegative,  InsuranceType.SGK,     "05321112206", "emine.erdogan@example.com",  "İstanbul",  "Üsküdar",      "Murat Reis Mah., Selmanipak Cad. No:54 D:9",    "Selma Erdoğan (Anne)","05331114406", "Lateks",        "Yok"),
            P("Mustafa", "Yalçın",   "10000000007", new(1982, 2, 22),  Gender.Erkek, BloodType.ORhNegative,  InsuranceType.Ozel,    "05321112207", "mustafa.yalcin@example.com", "Antalya",   "Muratpaşa",    "Lara Mah., Kenan Evren Bulvarı No:184 D:11",    "Zeynep Yalçın (Eş)", "05331114407", "Yok",           "Hiperlipidemi"),
            P("Zeynep",  "Şimşek",   "10000000008", new(1998, 12, 3),  Gender.Kadın, BloodType.BRhNegative,  InsuranceType.SGK,     "05321112208", "zeynep.simsek@example.com",  "Ankara",    "Keçiören",     "Etlik Mah., Yenikapı Sok. No:22 D:4",           "Ali Şimşek (Baba)",  "05331114408", "Penisilin",     "Migren"),
            P("Hasan",   "Tekin",    "10000000009", new(1972, 6, 15),  Gender.Erkek, BloodType.ARhPositive,  InsuranceType.SGK,     "05321112209", "hasan.tekin@example.com",    "İzmir",     "Bornova",      "Erzene Mah., Üniversite Cad. No:97 D:6",        "Fatma Tekin (Eş)",   "05331114409", "Yok",           "Hipertansiyon, Hiperlipidemi"),
            P("Hatice",  "Güneş",    "10000000010", new(1988, 4, 8),   Gender.Kadın, BloodType.BRhPositive,  InsuranceType.SGK,     "05321112210", "hatice.gunes@example.com",   "İstanbul",  "Şişli",        "Mecidiyeköy Mah., Büyükdere Cad. No:236 D:14",  "İbrahim Güneş (Eş)", "05331114410", "Yok",           "Hipotiroidi"),
            P("İbrahim", "Korkmaz",  "10000000011", new(1960, 10, 20), Gender.Erkek, BloodType.ORhPositive,  InsuranceType.SGK,     "05321112211", "ibrahim.korkmaz@example.com","Konya",     "Selçuklu",     "Sancak Mah., Mevlana Cad. No:155 D:2",          "Ayşe Korkmaz (Eş)",  "05331114411", "Yok",           "Koroner arter hastalığı, Hipertansiyon"),
            P("Elif",    "Bulut",    "10000000012", new(2003, 8, 14),  Gender.Kadın, BloodType.ARhPositive,  InsuranceType.SGK,     "05321112212", "elif.bulut@example.com",     "İstanbul",  "Bakırköy",     "Yeşilköy Mah., İstasyon Cad. No:18 D:7",        "Murat Bulut (Baba)", "05331114412", "Polen",         "Alerjik rinit"),
            P("Osman",   "Ergin",    "10000000013", new(1975, 1, 27),  Gender.Erkek, BloodType.ABRhNegative, InsuranceType.Ozel,    "05321112213", "osman.ergin@example.com",    "Ankara",    "Yenimahalle",  "Demetevler Mah., 25. Cadde No:64 D:10",         "Selin Ergin (Eş)",   "05331114413", "İbuprofen",     "Gastrit"),
            P("Merve",   "Keskin",   "10000000014", new(1992, 11, 9),  Gender.Kadın, BloodType.BRhPositive,  InsuranceType.SGK,     "05321112214", "merve.keskin@example.com",   "Adana",     "Seyhan",       "Reşatbey Mah., Atatürk Cad. No:88 D:5",         "Burak Keskin (Eş)",  "05331114414", "Yok",           "Yok"),
            P("Yusuf",   "Aslan",    "10000000015", new(1987, 7, 2),   Gender.Erkek, BloodType.ORhNegative,  InsuranceType.SGK,     "05321112215", "yusuf.aslan@example.com",    "Gaziantep", "Şahinbey",     "İncilikaya Mah., Üniversite Bulvarı No:142 D:8","Ayşe Aslan (Eş)",    "05331114415", "Yok",           "Yok"),
            P("Sevgi",   "Duran",    "10000000016", new(1999, 3, 28),  Gender.Kadın, BloodType.ORhPositive,  InsuranceType.Yok,     "05321112216", "sevgi.duran@example.com",    "İstanbul",  "Pendik",       "Çamçeşme Mah., Ankara Cad. No:204 D:3",         "Mehmet Duran (Baba)","05331114416", "Yok",           "Yok"),
            P("Kemal",   "Sarı",     "10000000017", new(1968, 5, 17),  Gender.Erkek, BloodType.ARhNegative,  InsuranceType.SGK,     "05321112217", "kemal.sari@example.com",     "Trabzon",   "Ortahisar",    "Çukurçayır Mah., Devlet Sahil Yolu No:74 D:6",  "Hatice Sarı (Eş)",   "05331114417", "Yok",           "Hipertansiyon, KOAH"),
            P("Dilek",   "Aktaş",    "10000000018", new(1994, 9, 4),   Gender.Kadın, BloodType.ABRhPositive, InsuranceType.Ozel,    "05321112218", "dilek.aktas@example.com",    "İstanbul",  "Maltepe",      "Cevizli Mah., Bağdat Cad. No:412 D:9",          "Emre Aktaş (Eş)",    "05331114418", "Yok",           "Yok"),
            P("John",    "Mitchell", "99100000019", new(1980, 5, 14),  Gender.Erkek, BloodType.ORhPositive,  InsuranceType.Yabanci, "05321112219", "john.mitchell@example.com",  "İstanbul",  "Beşiktaş",     "Etiler Mah., Nispetiye Cad. No:75 D:9",         "Sarah Mitchell (Eş)","05331114419", "Yok",           "Yok"),
            P("Maria",   "Rossi",    "99100000020", new(1985, 9, 22),  Gender.Kadın, BloodType.ARhNegative,  InsuranceType.Yabanci, "05321112220", "maria.rossi@example.com",    "İzmir",     "Konak",        "Alsancak Mah., Cumhuriyet Bulvarı No:174 D:7",  "Marco Rossi (Eş)",   "05331114420", "Yok",           "Hipertansiyon"),
        };
    }

    private static async Task MigratePatientIdentitiesAsync(AppDbContext context)
    {
        // Mevcut DB'de Türk kimlikli olan iki kayıt artık yabancı uyruklu hastalara
        // dönüştürülüyor: TC No → YKN (99 ile başlayan), ad-soyad da güncelleniyor.
        // Idempotent: yeni YKN zaten DB'de varsa atlanır, böylece tekrar çalıştırmak güvenli.
        var migrations = new[]
        {
            new { OldNationalId = "10000000019", NewNationalId = "99100000019", NewName = "John",  NewSurname = "Mitchell" },
            new { OldNationalId = "10000000020", NewNationalId = "99100000020", NewName = "Maria", NewSurname = "Rossi"    },
        };

        var changed = false;
        foreach (var m in migrations)
        {
            if (await context.Patients.AnyAsync(x => x.NationalId == m.NewNationalId)) continue;

            var p = await context.Patients.FirstOrDefaultAsync(x => x.NationalId == m.OldNationalId);
            if (p == null) continue;

            p.NationalId = m.NewNationalId;
            p.Name = m.NewName;
            p.Surname = m.NewSurname;
            changed = true;
        }

        if (changed) await context.SaveChangesAsync();
    }

    private static async Task BackfillPatientDetailsAsync(AppDbContext context, List<Patient> seedPatients)
    {
        var existing = await context.Patients.ToListAsync();
        var bySeedNationalId = seedPatients.ToDictionary(p => p.NationalId);
        var changed = false;

        foreach (var patient in existing)
        {
            if (!bySeedNationalId.TryGetValue(patient.NationalId, out var seed)) continue;

            if (string.IsNullOrWhiteSpace(patient.Address) && !string.IsNullOrWhiteSpace(seed.Address))
            { patient.Address = seed.Address; changed = true; }

            if (string.IsNullOrWhiteSpace(patient.EmergencyContactName) && !string.IsNullOrWhiteSpace(seed.EmergencyContactName))
            { patient.EmergencyContactName = seed.EmergencyContactName; changed = true; }

            if (string.IsNullOrWhiteSpace(patient.EmergencyContactPhone) && !string.IsNullOrWhiteSpace(seed.EmergencyContactPhone))
            { patient.EmergencyContactPhone = seed.EmergencyContactPhone; changed = true; }

            if (string.IsNullOrWhiteSpace(patient.Allergies) && !string.IsNullOrWhiteSpace(seed.Allergies))
            { patient.Allergies = seed.Allergies; changed = true; }

            if (string.IsNullOrWhiteSpace(patient.ChronicDiseases) && !string.IsNullOrWhiteSpace(seed.ChronicDiseases))
            { patient.ChronicDiseases = seed.ChronicDiseases; changed = true; }

            if (!patient.BloodType.HasValue && seed.BloodType.HasValue)
            { patient.BloodType = seed.BloodType; changed = true; }

            // InsuranceType enum default is SGK — treat that as "not yet set"
            // and overwrite with the seed value when it differs. Manual edits
            // to non-SGK values are preserved.
            if (patient.InsuranceType == InsuranceType.SGK && seed.InsuranceType != InsuranceType.SGK)
            { patient.InsuranceType = seed.InsuranceType; changed = true; }

            if (string.IsNullOrWhiteSpace(patient.Email) && !string.IsNullOrWhiteSpace(seed.Email))
            { patient.Email = seed.Email; changed = true; }

            if (string.IsNullOrWhiteSpace(patient.City) && !string.IsNullOrWhiteSpace(seed.City))
            { patient.City = seed.City; changed = true; }

            if (string.IsNullOrWhiteSpace(patient.District) && !string.IsNullOrWhiteSpace(seed.District))
            { patient.District = seed.District; changed = true; }
        }

        if (changed) await context.SaveChangesAsync();
    }

    private static List<Appointment> SeedAppointments(List<Doctor> doctors, List<Patient> patients)
    {
        var rnd = new Random(42);
        var appointments = new List<Appointment>();
        var baseDate = DateTime.UtcNow.Date.AddDays(-20);

        for (int i = 0; i < 30; i++)
        {
            var patient = patients[i % patients.Count];
            var doctor = doctors[i % doctors.Count];
            var when = baseDate.AddDays(i).AddHours(9 + (i % 8));

            AppointmentStatus status;
            if (i < 15) status = AppointmentStatus.Tamamlandi;
            else if (i < 27) status = AppointmentStatus.Bekliyor;
            else status = AppointmentStatus.IptalEdildi;

            var type = (i % 5) switch
            {
                0 => AppointmentType.Kontrol,
                1 => AppointmentType.Acil,
                _ => AppointmentType.Poliklinik
            };

            appointments.Add(new Appointment
            {
                Patient = patient,
                Doctor = doctor,
                DateTime = DateTime.SpecifyKind(when, DateTimeKind.Utc),
                Status = status,
                Type = type
            });
        }

        return appointments;
    }

    private static List<MedicalRecord> SeedMedicalRecords(List<Appointment> appointments)
    {
        var diagnoses = new (string Complaint, string Diagnosis, string? Code, string? Plan)[]
        {
            ("Boğaz ağrısı ve burun akıntısı",       "Akut üst solunum yolu enfeksiyonu, tanımlanmamış", "J06.9", "Bol sıvı tüketimi, istirahat önerildi."),
            ("Baş dönmesi, ense ağrısı",             "Esansiyel (primer) hipertansiyon",                 "I10",   "Tansiyon takibi, tuz kısıtlaması."),
            ("Uzağı net görememe şikayeti",          "Miyopi",                                           "H52.1", "Gözlük reçetesi düzenlendi."),
            ("Öksürük ve hırıltı, 5 gündür",         "Akut bronşit, tanımlanmamış",                      "J20.9", "7 gün antibiyotik kürü başlandı."),
            ("Tek taraflı zonklayıcı baş ağrısı",    "Migren, tanımlanmamış",                            "G43.9", "Tetikleyici faktörlerin kaydı istendi."),
            ("Sık idrara çıkma, susama",             "Tip 2 diabetes mellitus (komplikasyonsuz)",        "E11.9", "Diyet ve metformin önerildi."),
            ("Bel ağrısı, bacağa vuran",             "Bel ağrısı",                                       "M54.5", "Fizik tedavi programına yönlendirildi."),
            ("Mide yanması, ekşime",                 "Gastrit, tanımlanmamış",                           "K29.7", "Proton pompa inhibitörü başlandı."),
            ("Kulak ağrısı, çocukta ateş",           "Otitis media, tanımlanmamış",                      "H66.9", "5 gün antibiyotik ve ağrı kesici."),
            ("Hapşırma, burun kaşıntısı",            "Vazomotor ve allerjik rinit",                      "J30.9", "Antihistaminik önerildi."),
            ("Halsizlik, çabuk yorulma",             "Demir eksikliği anemisi, tanımlanmamış",           "D50.9", "Demir takviyesi başlandı."),
            ("Yutkunma güçlüğü, ateş",               "Kronik tonsillit",                                 "J35.0", "Antibiyotik ve gargara önerildi."),
            ("Gözde kızarıklık ve çapaklanma",       "Konjonktivit, tanımlanmamış",                      "H10.9", "Antibiyotik damla verildi."),
            ("Göz yorgunluğu, baş ağrısı",           "Gerilim tipi baş ağrısı",                          "G44.2", "Ekran süresi azaltılması önerildi."),
            ("Kalçadan bacağa yayılan ağrı",         "Lomber disk hernisi",                              "M51.1", "Kas gevşetici ve istirahat."),
        };

        var completed = appointments.Where(a => a.Status == AppointmentStatus.Tamamlandi).Take(15).ToList();
        var records = new List<MedicalRecord>();

        for (int i = 0; i < completed.Count; i++)
        {
            records.Add(new MedicalRecord
            {
                Appointment = completed[i],
                ChiefComplaint = diagnoses[i].Complaint,
                Diagnosis = diagnoses[i].Diagnosis,
                DiagnosisCode = diagnoses[i].Code,
                TreatmentPlan = diagnoses[i].Plan
            });
        }

        return records;
    }

    private static async Task SeedIcd10CodesAsync(AppDbContext context)
    {
        var data = new (string Code, string NameTr, string? NameEn, string Category)[]
        {
            // J00-J06 Akut üst solunum yolu enfeksiyonları
            ("J00",   "Akut nazofarenjit (soğuk algınlığı)",                       "Acute nasopharyngitis (common cold)",   "J00-J06 Akut üst solunum yolu enfeksiyonları"),
            ("J02.9", "Akut farenjit, tanımlanmamış",                              "Acute pharyngitis, unspecified",        "J00-J06 Akut üst solunum yolu enfeksiyonları"),
            ("J03.9", "Akut tonsillit, tanımlanmamış",                             "Acute tonsillitis, unspecified",        "J00-J06 Akut üst solunum yolu enfeksiyonları"),
            ("J06.9", "Akut üst solunum yolu enfeksiyonu, tanımlanmamış",          "Acute upper respiratory infection",     "J00-J06 Akut üst solunum yolu enfeksiyonları"),
            // J20-J22 Akut alt solunum yolu enfeksiyonları
            ("J18.9", "Pnömoni, tanımlanmamış",                                    "Pneumonia, unspecified",                "J09-J18 Grip ve pnömoni"),
            ("J20.9", "Akut bronşit, tanımlanmamış",                               "Acute bronchitis, unspecified",         "J20-J22 Akut alt solunum yolu enfeksiyonları"),
            // J30-J39 Üst solunum yolu diğer hastalıkları
            ("J30.9", "Vazomotor ve allerjik rinit",                               "Allergic rhinitis",                     "J30-J39 Üst solunum yolu diğer hastalıkları"),
            ("J35.0", "Kronik tonsillit",                                          "Chronic tonsillitis",                   "J30-J39 Üst solunum yolu diğer hastalıkları"),
            ("J35.1", "Tonsil hipertrofisi",                                       "Hypertrophy of tonsils",                "J30-J39 Üst solunum yolu diğer hastalıkları"),
            // J40-J47 Kronik alt solunum yolu hastalıkları
            ("J45.9", "Astım, tanımlanmamış",                                      "Asthma, unspecified",                   "J40-J47 Kronik alt solunum yolu hastalıkları"),
            // I10-I15 Hipertansif hastalıklar
            ("I10",   "Esansiyel (primer) hipertansiyon",                          "Essential hypertension",                "I10-I15 Hipertansif hastalıklar"),
            // I20-I25 İskemik kalp hastalıkları
            ("I25.9", "Kronik iskemik kalp hastalığı, tanımlanmamış",              "Chronic ischemic heart disease",        "I20-I25 İskemik kalp hastalıkları"),
            // I50 Kalp yetmezliği
            ("I50.9", "Kalp yetmezliği, tanımlanmamış",                            "Heart failure, unspecified",            "I50 Kalp yetmezliği"),
            // E00-E07 Tiroid bozuklukları
            ("E03.9", "Hipotiroidi, tanımlanmamış",                                "Hypothyroidism, unspecified",           "E00-E07 Tiroid bozuklukları"),
            // E10-E14 Diabetes mellitus
            ("E11.9", "Tip 2 diabetes mellitus (komplikasyonsuz)",                 "Type 2 diabetes mellitus",              "E10-E14 Diabetes mellitus"),
            // E70-E78 Metabolizma bozuklukları
            ("E78.5", "Hiperlipidemi, tanımlanmamış",                              "Hyperlipidemia, unspecified",           "E70-E90 Metabolizma bozuklukları"),
            // F30-F48 Duygudurum / nevrotik bozukluklar
            ("F32.9", "Depresif episod, tanımlanmamış",                            "Depressive episode, unspecified",       "F30-F39 Duygudurum bozuklukları"),
            ("F41.1", "Yaygın anksiyete bozukluğu",                                "Generalized anxiety disorder",          "F40-F48 Nevrotik bozukluklar"),
            ("F41.9", "Anksiyete bozukluğu, tanımlanmamış",                        "Anxiety disorder, unspecified",         "F40-F48 Nevrotik bozukluklar"),
            // G40-G47 Episodik ve paroksismal bozukluklar
            ("G43.9", "Migren, tanımlanmamış",                                     "Migraine, unspecified",                 "G40-G47 Episodik bozukluklar"),
            ("G44.2", "Gerilim tipi baş ağrısı",                                   "Tension-type headache",                 "G40-G47 Episodik bozukluklar"),
            ("G47.0", "Uyku başlama ve sürdürme bozukluğu (insomnia)",             "Insomnia",                              "G40-G47 Episodik bozukluklar"),
            // H10-H13 Konjonktiva
            ("H10.9", "Konjonktivit, tanımlanmamış",                               "Conjunctivitis, unspecified",           "H10-H13 Konjonktiva bozuklukları"),
            // H52 Refraksiyon bozuklukları
            ("H52.0", "Hipermetropi",                                              "Hypermetropia",                         "H52 Akomodasyon ve refraksiyon"),
            ("H52.1", "Miyopi",                                                    "Myopia",                                "H52 Akomodasyon ve refraksiyon"),
            ("H52.2", "Astigmatizm",                                               "Astigmatism",                           "H52 Akomodasyon ve refraksiyon"),
            // H65-H75 Orta kulak
            ("H66.9", "Otitis media, tanımlanmamış",                               "Otitis media, unspecified",             "H65-H75 Orta kulak hastalıkları"),
            // K20-K31 Özofagus/mide/duodenum
            ("K21.9", "Gastroözofageal reflü hastalığı (özofajitsiz)",             "GERD without esophagitis",              "K20-K31 Özofagus, mide ve duodenum"),
            ("K29.7", "Gastrit, tanımlanmamış",                                    "Gastritis, unspecified",                "K20-K31 Özofagus, mide ve duodenum"),
            ("K30",   "Fonksiyonel dispepsi",                                      "Functional dyspepsia",                  "K20-K31 Özofagus, mide ve duodenum"),
            // K50-K52 Enteritler/kolitler
            ("K52.9", "Non-enfeksiyöz gastroenterit ve kolit, tanımlanmamış",      "Noninfective gastroenteritis",          "K50-K52 Non-enfeksiyöz enteritler"),
            // K55-K63 Bağırsağın diğer hastalıkları
            ("K59.0", "Konstipasyon",                                              "Constipation",                          "K55-K63 Bağırsağın diğer hastalıkları"),
            // M40-M54 Dorsopatiler
            ("M51.1", "Lomber disk hernisi",                                       "Lumbar disc displacement",              "M40-M54 Dorsopatiler"),
            ("M54.2", "Servikalji (boyun ağrısı)",                                 "Cervicalgia",                           "M40-M54 Dorsopatiler"),
            ("M54.5", "Bel ağrısı",                                                "Low back pain",                         "M40-M54 Dorsopatiler"),
            // M70-M79 Yumuşak doku
            ("M25.5", "Eklem ağrısı",                                              "Pain in joint",                         "M00-M25 Artropatiler"),
            ("M79.1", "Myalji",                                                    "Myalgia",                               "M70-M79 Yumuşak doku hastalıkları"),
            // N20-N23 Ürolitiazis
            ("N20.0", "Böbrek taşı",                                               "Calculus of kidney",                    "N20-N23 Ürolitiazis"),
            // N30-N39 Üriner sistem
            ("N39.0", "İdrar yolu enfeksiyonu, lokalizasyonu tanımlanmamış",       "Urinary tract infection",               "N30-N39 Üriner sistemin diğer hastalıkları"),
            // L20-L30 Dermatit / egzama
            ("L20.9", "Atopik dermatit, tanımlanmamış",                            "Atopic dermatitis, unspecified",        "L20-L30 Dermatit ve egzama"),
            ("L23.9", "Kontakt dermatit, tanımlanmamış",                           "Contact dermatitis, unspecified",       "L20-L30 Dermatit ve egzama"),
            // L70-L75 Cilt ekleri
            ("L70.0", "Akne vulgaris",                                             "Acne vulgaris",                         "L70-L75 Cilt ekleri bozuklukları"),
            // D50-D53 Beslenme anemileri
            ("D50.9", "Demir eksikliği anemisi, tanımlanmamış",                    "Iron deficiency anemia, unspecified",   "D50-D53 Beslenme anemileri"),
            // B25-B34 Diğer viral hastalıklar
            ("B34.9", "Viral enfeksiyon, tanımlanmamış",                           "Viral infection, unspecified",          "B25-B34 Diğer viral hastalıklar"),
            // R semptomlar
            ("R05",   "Öksürük",                                                   "Cough",                                 "R00-R09 Dolaşım/solunum semptomları"),
            ("R07.4", "Göğüs ağrısı, tanımlanmamış",                               "Chest pain, unspecified",               "R00-R09 Dolaşım/solunum semptomları"),
            ("R10.4", "Karın ağrısı, diğer ve tanımlanmamış",                      "Abdominal pain, unspecified",           "R10-R19 Sindirim sistemi semptomları"),
            ("R11",   "Bulantı ve kusma",                                          "Nausea and vomiting",                   "R10-R19 Sindirim sistemi semptomları"),
            ("R42",   "Baş dönmesi ve sersemlik",                                  "Dizziness and giddiness",               "R40-R46 Genel duyusal semptomlar"),
            ("R50.9", "Ateş, tanımlanmamış",                                       "Fever, unspecified",                    "R50-R69 Genel semptomlar"),
            ("R51",   "Baş ağrısı",                                                "Headache",                              "R50-R69 Genel semptomlar"),
            ("R53",   "Halsizlik ve yorgunluk",                                    "Malaise and fatigue",                   "R50-R69 Genel semptomlar"),
            // Z genel sağlık
            ("Z00.0", "Genel sağlık muayenesi",                                    "General medical examination",           "Z00-Z13 Sağlık taraması ve muayenesi"),
            // T78
            ("T78.4", "Alerji, tanımlanmamış",                                     "Allergy, unspecified",                  "T78 Yan etkiler"),
        };

        var existing = await context.Icd10Codes.Select(c => c.Code).ToListAsync();
        var existingSet = new HashSet<string>(existing);

        foreach (var d in data)
        {
            if (existingSet.Contains(d.Code)) continue;
            await context.Icd10Codes.AddAsync(new Icd10Code
            {
                Code = d.Code,
                NameTr = d.NameTr,
                NameEn = d.NameEn,
                Category = d.Category
            });
        }
        await context.SaveChangesAsync();
    }
}
