using System.Net;
using System.Text.Json;
using FluentValidation;
using MiniHBYS.Core.DTOs;

namespace MiniHBYS.API.Middleware;

public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;

    public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleAsync(context, ex);
        }
    }

    private async Task HandleAsync(HttpContext context, Exception ex)
    {
        _logger.LogError(ex, "Yakalanmamış istisna: {Path}", context.Request.Path);

        var (status, message, errors) = ex switch
        {
            ValidationException ve => (
                HttpStatusCode.BadRequest,
                "Doğrulama hatası.",
                ve.Errors.Select(e => e.ErrorMessage).ToList()
            ),
            KeyNotFoundException => (
                HttpStatusCode.NotFound,
                "Kayıt bulunamadı.",
                new List<string> { ex.Message }
            ),
            UnauthorizedAccessException => (
                HttpStatusCode.Unauthorized,
                "Yetkisiz erişim.",
                new List<string> { ex.Message }
            ),
            _ => (
                HttpStatusCode.InternalServerError,
                "Beklenmeyen bir hata oluştu.",
                new List<string> { ex.Message }
            )
        };

        var response = ApiResponse<object>.Fail(message, errors);

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)status;

        var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
        await context.Response.WriteAsync(JsonSerializer.Serialize(response, options));
    }
}

public static class GlobalExceptionMiddlewareExtensions
{
    public static IApplicationBuilder UseGlobalExceptionMiddleware(this IApplicationBuilder app) =>
        app.UseMiddleware<GlobalExceptionMiddleware>();
}
