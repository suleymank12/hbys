using System.Net;
using System.Text.Json;
using FluentValidation;
using MiniHBYS.Core.DTOs;

namespace MiniHBYS.API.Middleware;

public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;
    private readonly IHostEnvironment _env;

    public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger, IHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
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
        var traceId = context.TraceIdentifier;
        _logger.LogError(ex, "Yakalanmamış istisna: {Path} | TraceId: {TraceId}", context.Request.Path, traceId);

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
                BuildErrorDetails(ex, traceId)
            ),
            UnauthorizedAccessException => (
                HttpStatusCode.Unauthorized,
                "Yetkisiz erişim.",
                BuildErrorDetails(ex, traceId)
            ),
            _ => (
                HttpStatusCode.InternalServerError,
                _env.IsDevelopment()
                    ? "Beklenmeyen bir hata oluştu."
                    : $"Sunucu hatası oluştu. Referans: {traceId}",
                BuildErrorDetails(ex, traceId)
            )
        };

        var response = ApiResponse<object>.Fail(message, errors);

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)status;

        var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
        await context.Response.WriteAsync(JsonSerializer.Serialize(response, options));
    }

    private List<string> BuildErrorDetails(Exception ex, string traceId)
    {
        if (_env.IsDevelopment())
        {
            var details = new List<string> { ex.Message };
            if (!string.IsNullOrEmpty(ex.StackTrace))
                details.Add(ex.StackTrace);
            return details;
        }

        return new List<string> { $"Referans: {traceId}" };
    }
}

public static class GlobalExceptionMiddlewareExtensions
{
    public static IApplicationBuilder UseGlobalExceptionMiddleware(this IApplicationBuilder app) =>
        app.UseMiddleware<GlobalExceptionMiddleware>();
}
