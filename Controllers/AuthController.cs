using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;

    public AuthController(AuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    public IActionResult Login(LoginDTO dto)
    {
        var token = _authService.Login(dto);

        if (token == null)
            return Unauthorized("Email ou senha inválidos");

        return Ok(new { token });
    }
}