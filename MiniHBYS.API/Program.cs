using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using MiniHBYS.API.Middleware;
using MiniHBYS.API.Swagger;
using MiniHBYS.Business.Mappings;
using MiniHBYS.Business.Services;
using MiniHBYS.Business.Validators;
using MiniHBYS.Core.Interfaces;
using MiniHBYS.DataAccess.Context;
using MiniHBYS.DataAccess.Repositories;
using MiniHBYS.DataAccess.Seed;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));

builder.Services.AddScoped<IPatientService, PatientService>();
builder.Services.AddScoped<IDoctorService, DoctorService>();
builder.Services.AddScoped<IAppointmentService, AppointmentService>();
builder.Services.AddScoped<IMedicalRecordService, MedicalRecordService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();

builder.Services.AddAutoMapper(typeof(MappingProfile).Assembly);

builder.Services.AddValidatorsFromAssemblyContaining<CreatePatientValidator>();
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddFluentValidationClientsideAdapters();

builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactClient", policy =>
        policy.WithOrigins("http://localhost:3000", "http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod());
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Mini HBYS API",
        Version = "v1",
        Description = "Hastane Bilgi Yönetim Sistemi — hasta, doktor, randevu ve muayene kayıtları için REST API.",
        Contact = new OpenApiContact { Name = "Mini HBYS" }
    });

    c.DocInclusionPredicate((_, _) => true);

    // Tag açıklamaları — Swagger UI'da grupların üstünde görünür.
    c.DocumentFilter<TagDescriptionsDocumentFilter>();

    // Tagları sabit bir sırada göster.
    c.OrderActionsBy(api => api.GroupName ?? api.ActionDescriptor.RouteValues["controller"]);

    var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath)) c.IncludeXmlComments(xmlPath, includeControllerXmlComments: true);
});

var app = builder.Build();

app.UseGlobalExceptionMiddleware();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Mini HBYS API v1");
        c.RoutePrefix = "swagger";
    });

    using var scope = app.Services.CreateScope();
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await DbSeeder.SeedAsync(context);
}

app.UseCors("ReactClient");
app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();
