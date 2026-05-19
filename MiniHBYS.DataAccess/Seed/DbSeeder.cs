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

        if (await context.Patients.AnyAsync())
            return;

        var doctors = await context.Doctors
            .Include(d => d.User)
            .ToListAsync();

        var patients = SeedPatients();
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
        var data = new (string Name, string Surname, string NationalId, DateTime BirthDate, string Phone, string? Email, Gender Gender, BloodType? Blood, InsuranceType Insurance, string? City, string? District)[]
        {
            ("Mehmet",   "Yıldız",     "10000000001", new DateTime(1985, 3, 12),  "05321112201", "mehmet.yildiz@example.com",     Gender.Erkek,         BloodType.ARhPositive,  InsuranceType.SGK,     "İstanbul", "Kadıköy"),
            ("Ayşe",     "Kurt",       "10000000002", new DateTime(1990, 7, 25),  "05321112202", "ayse.kurt@example.com",         Gender.Kadın,         BloodType.BRhPositive,  InsuranceType.SGK,     "İstanbul", "Beşiktaş"),
            ("Ali",      "Çetin",      "10000000003", new DateTime(1978, 11, 5),  "05321112203", null,                            Gender.Erkek,         BloodType.ORhPositive,  InsuranceType.Ozel,    "Ankara",   "Çankaya"),
            ("Fatma",    "Aksoy",      "10000000004", new DateTime(2001, 1, 18),  "05321112204", "fatma.aksoy@example.com",       Gender.Kadın,         null,                   InsuranceType.SGK,     "İzmir",    "Karşıyaka"),
            ("Hüseyin",  "Polat",      "10000000005", new DateTime(1965, 9, 30),  "05321112205", null,                            Gender.Erkek,         BloodType.ABRhPositive, InsuranceType.SGK,     "Bursa",    "Nilüfer"),
            ("Emine",    "Erdoğan",    "10000000006", new DateTime(1995, 5, 10),  "05321112206", "emine.erdogan@example.com",     Gender.Kadın,         BloodType.ARhNegative,  InsuranceType.SGK,     "İstanbul", "Üsküdar"),
            ("Mustafa",  "Yalçın",     "10000000007", new DateTime(1982, 2, 22),  "05321112207", "mustafa.yalcin@example.com",    Gender.Erkek,         BloodType.ORhNegative,  InsuranceType.Ozel,    "Antalya",  "Muratpaşa"),
            ("Zeynep",   "Şimşek",     "10000000008", new DateTime(1998, 12, 3),  "05321112208", null,                            Gender.Kadın,         BloodType.BRhNegative,  InsuranceType.SGK,     "Ankara",   "Keçiören"),
            ("Hasan",    "Tekin",      "10000000009", new DateTime(1972, 6, 15),  "05321112209", "hasan.tekin@example.com",       Gender.Erkek,         BloodType.ARhPositive,  InsuranceType.SGK,     "İzmir",    "Bornova"),
            ("Hatice",   "Güneş",      "10000000010", new DateTime(1988, 4, 8),   "05321112210", "hatice.gunes@example.com",      Gender.Kadın,         null,                   InsuranceType.SGK,     "İstanbul", "Şişli"),
            ("İbrahim",  "Korkmaz",    "10000000011", new DateTime(1960, 10, 20), "05321112211", null,                            Gender.Erkek,         BloodType.ORhPositive,  InsuranceType.SGK,     "Konya",    "Selçuklu"),
            ("Elif",     "Bulut",      "10000000012", new DateTime(2003, 8, 14),  "05321112212", "elif.bulut@example.com",        Gender.Kadın,         BloodType.ARhPositive,  InsuranceType.SGK,     "İstanbul", "Bakırköy"),
            ("Osman",    "Ergin",      "10000000013", new DateTime(1975, 1, 27),  "05321112213", null,                            Gender.Erkek,         BloodType.ABRhNegative, InsuranceType.Ozel,    "Ankara",   "Yenimahalle"),
            ("Merve",    "Keskin",     "10000000014", new DateTime(1992, 11, 9),  "05321112214", "merve.keskin@example.com",      Gender.Kadın,         BloodType.BRhPositive,  InsuranceType.SGK,     "Adana",    "Seyhan"),
            ("Yusuf",    "Aslan",      "10000000015", new DateTime(1987, 7, 2),   "05321112215", "yusuf.aslan@example.com",       Gender.Erkek,         BloodType.ORhNegative,  InsuranceType.SGK,     "Gaziantep","Şahinbey"),
            ("Sevgi",    "Duran",      "10000000016", new DateTime(1999, 3, 28),  "05321112216", null,                            Gender.Kadın,         null,                   InsuranceType.Yok,     "İstanbul", "Pendik"),
            ("Kemal",    "Sarı",       "10000000017", new DateTime(1968, 5, 17),  "05321112217", "kemal.sari@example.com",        Gender.Erkek,         BloodType.ARhNegative,  InsuranceType.SGK,     "Trabzon",  "Ortahisar"),
            ("Dilek",    "Aktaş",      "10000000018", new DateTime(1994, 9, 4),   "05321112218", "dilek.aktas@example.com",       Gender.Kadın,         BloodType.ABRhPositive, InsuranceType.SGK,     "İstanbul", "Maltepe"),
            ("Burak",    "Özkan",      "10000000019", new DateTime(1983, 12, 21), "05321112219", null,                            Gender.Erkek,         BloodType.BRhNegative,  InsuranceType.Yabanci, "İstanbul", "Fatih"),
            ("Selin",    "Yavuz",      "10000000020", new DateTime(2000, 6, 11),  "05321112220", "selin.yavuz@example.com",       Gender.Kadın,         BloodType.ORhPositive,  InsuranceType.Ozel,    "İzmir",    "Konak"),
        };

        return data.Select((p, i) => new Patient
        {
            ProtocolNumber = $"P-{(i + 1):D6}",
            Name = p.Name,
            Surname = p.Surname,
            NationalId = p.NationalId,
            BirthDate = DateTime.SpecifyKind(p.BirthDate, DateTimeKind.Utc),
            Gender = p.Gender,
            BloodType = p.Blood,
            InsuranceType = p.Insurance,
            Phone = p.Phone,
            Email = p.Email,
            City = p.City,
            District = p.District
        }).ToList();
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
