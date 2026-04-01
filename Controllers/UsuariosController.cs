using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechHelpSolutions.Data;
using TechHelpSolutions.DTOs;
using TechHelpSolutions.Models;

[ApiController]
[Route("api/usuarios")]
public class UsuariosController : ControllerBase
{
    private readonly AppDbContext _context;

    public UsuariosController(AppDbContext context)
    {
        _context = context;
    }
    
    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Criar(UsuarioDTO dto)
    {
        var usuario = new Usuario
        {
            Nome = dto.Nome,
            Email = dto.Email,
            Senha = dto.Senha,
            Tipo = dto.Tipo
        };

        _context.Usuarios.Add(usuario);
        await _context.SaveChangesAsync();

        return Ok(usuario);
    }
    
    [Authorize]
    [HttpGet]
    public IActionResult Listar()
    {
        return Ok(_context.Usuarios.ToList());
    }
}