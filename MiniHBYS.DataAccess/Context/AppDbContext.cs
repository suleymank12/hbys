using Microsoft.EntityFrameworkCore;
using MiniHBYS.Core.Entities;

namespace MiniHBYS.DataAccess.Context;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Patient> Patients => Set<Patient>();
    public DbSet<Doctor> Doctors => Set<Doctor>();
    public DbSet<Appointment> Appointments => Set<Appointment>();
    public DbSet<MedicalRecord> MedicalRecords => Set<MedicalRecord>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Patient>(b =>
        {
            b.Property(p => p.Name).IsRequired().HasMaxLength(100);
            b.Property(p => p.Surname).IsRequired().HasMaxLength(100);
            b.Property(p => p.NationalId).IsRequired().HasMaxLength(11);
            b.Property(p => p.Phone).IsRequired().HasMaxLength(15);
            b.Property(p => p.Email).HasMaxLength(200);
            b.HasIndex(p => p.NationalId).IsUnique();
            b.HasQueryFilter(e => e.IsActive);
        });

        modelBuilder.Entity<Doctor>(b =>
        {
            b.Property(d => d.Name).IsRequired().HasMaxLength(100);
            b.Property(d => d.Branch).IsRequired().HasMaxLength(100);
            b.Property(d => d.Email).IsRequired().HasMaxLength(200);
            b.Property(d => d.Password).IsRequired().HasMaxLength(200);
            b.HasIndex(d => d.Email).IsUnique();
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
            b.Property(m => m.Diagnosis).IsRequired().HasMaxLength(500);

            b.HasOne(m => m.Appointment)
                .WithOne(a => a.MedicalRecord)
                .HasForeignKey<MedicalRecord>(m => m.AppointmentId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasIndex(m => m.AppointmentId).IsUnique();
            b.HasQueryFilter(e => e.IsActive);
        });

        base.OnModelCreating(modelBuilder);
    }
}
