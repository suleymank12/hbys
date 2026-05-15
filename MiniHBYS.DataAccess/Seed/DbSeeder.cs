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
    }

    private static async Task SeedSystemUsersAsync(AppDbContext context)
    {
        var systemUsers = new (string Name, string Email, string Password, UserRole Role)[]
        {
            ("Sistem Yöneticisi", "admin@minihbys.com",    "Admin123!",    UserRole.Admin),
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
        var data = new (string Name, string Branch, string Email)[]
        {
            ("Dr. Ahmet Yılmaz",    "Dahiliye",    "ahmet.yilmaz@minihbys.com"),
            ("Dr. Ayşe Demir",      "Dahiliye",    "ayse.demir@minihbys.com"),
            ("Dr. Mehmet Kaya",     "Kardiyoloji", "mehmet.kaya@minihbys.com"),
            ("Dr. Fatma Şahin",     "Kardiyoloji", "fatma.sahin@minihbys.com"),
            ("Dr. Mustafa Çelik",   "Ortopedi",    "mustafa.celik@minihbys.com"),
            ("Dr. Zeynep Arslan",   "Ortopedi",    "zeynep.arslan@minihbys.com"),
            ("Dr. Hasan Doğan",     "Göz",         "hasan.dogan@minihbys.com"),
            ("Dr. Emine Koç",       "Göz",         "emine.koc@minihbys.com"),
            ("Dr. Ali Aydın",       "KBB",         "ali.aydin@minihbys.com"),
            ("Dr. Hatice Öztürk",   "KBB",         "hatice.ozturk@minihbys.com"),
        };

        var password = BCrypt.Net.BCrypt.HashPassword("Doctor123!");

        foreach (var d in data)
        {
            if (await context.Doctors.AnyAsync(x => x.User.Email == d.Email))
                continue;
            if (await context.Users.AnyAsync(u => u.Email == d.Email))
                continue;

            var user = new User
            {
                Name = d.Name,
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
                Name = d.Name,
                Branch = d.Branch,
                UserId = user.Id,
                CreatedAt = DateTime.UtcNow,
                IsActive = true
            });
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

            appointments.Add(new Appointment
            {
                Patient = patient,
                Doctor = doctor,
                DateTime = DateTime.SpecifyKind(when, DateTimeKind.Utc),
                Status = status
            });
        }

        return appointments;
    }

    private static List<MedicalRecord> SeedMedicalRecords(List<Appointment> appointments)
    {
        var diagnoses = new (string Complaint, string Diagnosis, string? Plan)[]
        {
            ("Boğaz ağrısı ve burun akıntısı",       "Üst solunum yolu enfeksiyonu",  "Bol sıvı tüketimi, istirahat önerildi."),
            ("Baş dönmesi, ense ağrısı",             "Hipertansiyon",                 "Tansiyon takibi, tuz kısıtlaması."),
            ("Uzağı net görememe şikayeti",          "Miyopi",                        "Gözlük reçetesi düzenlendi."),
            ("Öksürük ve hırıltı, 5 gündür",         "Akut bronşit",                  "7 gün antibiyotik kürü başlandı."),
            ("Tek taraflı zonklayıcı baş ağrısı",    "Migren",                        "Tetikleyici faktörlerin kaydı istendi."),
            ("Sık idrara çıkma, susama",             "Tip 2 Diyabet",                 "Diyet ve metformin önerildi."),
            ("Bel ağrısı, bacağa vuran",             "Lomber disk hernisi",           "Fizik tedavi programına yönlendirildi."),
            ("Mide yanması, ekşime",                 "Gastrit",                       "Proton pompa inhibitörü başlandı."),
            ("Kulak ağrısı, çocukta ateş",           "Otitis media",                  "5 gün antibiyotik ve ağrı kesici."),
            ("Hapşırma, burun kaşıntısı",            "Alerjik rinit",                 "Antihistaminik önerildi."),
            ("Halsizlik, çabuk yorulma",             "Anemi",                         "Demir takviyesi başlandı."),
            ("Yutkunma güçlüğü, ateş",               "Tonsillit",                     "Antibiyotik ve gargara önerildi."),
            ("Gözde kızarıklık ve çapaklanma",       "Konjonktivit",                  "Antibiyotik damla verildi."),
            ("Göz yorgunluğu, baş ağrısı",           "Astenopi",                      "Ekran süresi azaltılması önerildi."),
            ("Kalçadan bacağa yayılan ağrı",         "Siyatalji",                     "Kas gevşetici ve istirahat."),
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
                TreatmentPlan = diagnoses[i].Plan
            });
        }

        return records;
    }
}
