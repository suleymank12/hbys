using Microsoft.EntityFrameworkCore;
using MiniHBYS.Core.Entities;

namespace MiniHBYS.DataAccess.Context;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Patient> Patients => Set<Patient>();
    public DbSet<Doctor> Doctors => Set<Doctor>();
    public DbSet<Appointment> Appointments => Set<Appointment>();
    public DbSet<MedicalRecord> MedicalRecords => Set<MedicalRecord>();
    public DbSet<VitalSigns> VitalSigns => Set<VitalSigns>();
    public DbSet<Icd10Code> Icd10Codes => Set<Icd10Code>();
    public DbSet<Prescription> Prescriptions => Set<Prescription>();
    public DbSet<PrescriptionItem> PrescriptionItems => Set<PrescriptionItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(b =>
        {
            b.Property(u => u.Name).IsRequired().HasMaxLength(100);
            b.Property(u => u.Email).IsRequired().HasMaxLength(200);
            b.Property(u => u.Password).IsRequired().HasMaxLength(200);
            b.Property(u => u.Role).HasConversion<int>();
            b.HasIndex(u => u.Email).IsUnique();
            b.HasQueryFilter(e => e.IsActive);
        });

        modelBuilder.Entity<Patient>(b =>
        {
            b.Property(p => p.ProtocolNumber).IsRequired().HasMaxLength(20);
            b.Property(p => p.Name).IsRequired().HasMaxLength(100);
            b.Property(p => p.Surname).IsRequired().HasMaxLength(100);
            b.Property(p => p.NationalId).IsRequired().HasMaxLength(11);
            b.Property(p => p.Phone).IsRequired().HasMaxLength(15);
            b.Property(p => p.Email).HasMaxLength(200);
            b.Property(p => p.Gender).HasConversion<int>();
            b.Property(p => p.BloodType).HasConversion<int?>();
            b.Property(p => p.InsuranceType).HasConversion<int>();
            b.Property(p => p.City).HasMaxLength(100);
            b.Property(p => p.District).HasMaxLength(100);
            b.Property(p => p.Address).HasMaxLength(500);
            b.Property(p => p.EmergencyContactName).HasMaxLength(200);
            b.Property(p => p.EmergencyContactPhone).HasMaxLength(15);
            b.Property(p => p.Allergies).HasMaxLength(1000);
            b.Property(p => p.ChronicDiseases).HasMaxLength(1000);
            b.HasIndex(p => p.NationalId).IsUnique();
            b.HasIndex(p => p.ProtocolNumber).IsUnique();
            b.HasQueryFilter(e => e.IsActive);
        });

        modelBuilder.Entity<Doctor>(b =>
        {
            b.Property(d => d.Name).IsRequired().HasMaxLength(100);
            b.Property(d => d.Branch).IsRequired().HasMaxLength(100);

            b.HasOne(d => d.User)
                .WithOne(u => u.Doctor!)
                .HasForeignKey<Doctor>(d => d.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasIndex(d => d.UserId).IsUnique();
            b.HasQueryFilter(e => e.IsActive);
        });

        modelBuilder.Entity<Appointment>(b =>
        {
            b.Property(a => a.Status).HasConversion<int>();

            b.HasOne(a => a.Patient)
                .WithMany(p => p.Appointments)
                .HasForeignKey(a => a.PatientId)
                .OnDelete(DeleteBehavior.Restrict);

            b.HasOne(a => a.Doctor)
                .WithMany(d => d.Appointments)
                .HasForeignKey(a => a.DoctorId)
                .OnDelete(DeleteBehavior.Restrict);

            b.HasQueryFilter(e => e.IsActive);
        });

        modelBuilder.Entity<MedicalRecord>(b =>
        {
            b.Property(m => m.ChiefComplaint).IsRequired().HasMaxLength(1000);
            b.Property(m => m.History).HasMaxLength(2000);
            b.Property(m => m.Examination).HasMaxLength(2000);
            b.Property(m => m.Diagnosis).IsRequired().HasMaxLength(500);
            b.Property(m => m.DiagnosisCode).HasMaxLength(10);
            b.Property(m => m.TreatmentPlan).HasMaxLength(2000);

            b.HasOne(m => m.Appointment)
                .WithOne(a => a.MedicalRecord)
                .HasForeignKey<MedicalRecord>(m => m.AppointmentId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasIndex(m => m.AppointmentId).IsUnique();
            b.HasQueryFilter(e => e.IsActive);
        });

        modelBuilder.Entity<Icd10Code>(b =>
        {
            b.HasKey(c => c.Code);
            b.Property(c => c.Code).HasMaxLength(10).ValueGeneratedNever();
            b.Property(c => c.NameTr).IsRequired().HasMaxLength(500);
            b.Property(c => c.NameEn).HasMaxLength(500);
            b.Property(c => c.Category).IsRequired().HasMaxLength(200);
            b.HasIndex(c => c.NameTr);
        });

        modelBuilder.Entity<Prescription>(b =>
        {
            b.Property(p => p.PrescriptionNumber).IsRequired().HasMaxLength(20);
            b.HasIndex(p => p.PrescriptionNumber).IsUnique();

            b.HasOne(p => p.MedicalRecord)
                .WithOne(m => m.Prescription!)
                .HasForeignKey<Prescription>(p => p.MedicalRecordId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasIndex(p => p.MedicalRecordId).IsUnique();
            b.HasQueryFilter(e => e.IsActive);
        });

        modelBuilder.Entity<PrescriptionItem>(b =>
        {
            b.Property(i => i.MedicationName).IsRequired().HasMaxLength(200);
            b.Property(i => i.Dosage).IsRequired().HasMaxLength(100);
            b.Property(i => i.Frequency).IsRequired().HasMaxLength(100);
            b.Property(i => i.Duration).IsRequired().HasMaxLength(100);
            b.Property(i => i.Instructions).HasMaxLength(500);

            b.HasOne(i => i.Prescription)
                .WithMany(p => p.Items)
                .HasForeignKey(i => i.PrescriptionId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasQueryFilter(e => e.IsActive);
        });

        modelBuilder.Entity<VitalSigns>(b =>
        {
            b.Property(v => v.Temperature).HasPrecision(4, 1);
            b.Property(v => v.Height).HasPrecision(5, 1);
            b.Property(v => v.Weight).HasPrecision(5, 1);

            b.HasOne(v => v.MedicalRecord)
                .WithOne(m => m.VitalSigns!)
                .HasForeignKey<VitalSigns>(v => v.MedicalRecordId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasIndex(v => v.MedicalRecordId).IsUnique();
            b.HasQueryFilter(e => e.IsActive);
        });

        base.OnModelCreating(modelBuilder);
    }
}
