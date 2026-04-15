using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace MiniHBYS.API.Swagger;

public class TagDescriptionsDocumentFilter : IDocumentFilter
{
    public void Apply(OpenApiDocument swaggerDoc, DocumentFilterContext context)
    {
        swaggerDoc.Tags = new List<OpenApiTag>
        {
            new() { Name = "Patients",       Description = "Hasta kayıtları — listeleme, arama, oluşturma, güncelleme, silme." },
            new() { Name = "Doctors",        Description = "Doktor kayıtları — branş bazlı listeleme dahil CRUD işlemleri." },
            new() { Name = "Appointments",   Description = "Randevular — oluşturma (çakışma kontrolü), durum güncelleme, iptal." },
            new() { Name = "MedicalRecords", Description = "Muayene kayıtları — tamamlanmış randevular üzerinden tanı ve notlar." },
            new() { Name = "Dashboard",      Description = "Genel istatistikler — hasta/doktor/randevu sayıları ve branş dağılımı." }
        };
    }
}
