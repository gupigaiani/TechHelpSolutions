using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
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

        return Ok(ProjetarUsuario(usuario));
    }

    [Authorize]
    [HttpGet]
    public async Task<IActionResult> Listar()
    {
        var usuarios = await _context.Usuarios
            .AsNoTracking()
            .OrderBy(u => u.Nome)
            .Select(u => new UsuarioResponseDTO
            {
                Id = u.Id,
                Nome = u.Nome,
                Email = u.Email,
                Tipo = u.Tipo,
                DataCriacao = u.DataCriacao
            })
            .ToListAsync();

        return Ok(usuarios);
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> ObterUsuarioLogado()
    {
        var userId = ObterUsuarioIdLogado();
        if (userId == null)
            return Unauthorized();

        var usuario = await _context.Usuarios
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId.Value);

        if (usuario == null)
            return NotFound();

        return Ok(ProjetarUsuario(usuario));
    }

    [Authorize]
    [HttpPut("{id}")]
    public async Task<IActionResult> Atualizar(int id, AtualizarUsuarioDTO dto)
    {
        var userId = ObterUsuarioIdLogado();
        if (userId == null)
            return Unauthorized();

        var isAdmin = User.IsInRole("Admin");
        if (!isAdmin && userId.Value != id)
            return Forbid();

        var usuario = await _context.Usuarios.FindAsync(id);
        if (usuario == null)
            return NotFound();

        usuario.Nome = dto.Nome;
        usuario.Email = dto.Email;
        usuario.Tipo = isAdmin ? dto.Tipo : usuario.Tipo;

        if (!string.IsNullOrWhiteSpace(dto.Senha))
            usuario.Senha = dto.Senha;

        await _context.SaveChangesAsync();

        return Ok(ProjetarUsuario(usuario));
    }

    private int? ObterUsuarioIdLogado()
    {
        var userId = User.FindFirstValue("UserId");

        if (int.TryParse(userId, out var parsedUserId))
            return parsedUserId;

        return null;
    }

    private static UsuarioResponseDTO ProjetarUsuario(Usuario usuario)
    {
        return new UsuarioResponseDTO
        {
            Id = usuario.Id,
            Nome = usuario.Nome,
            Email = usuario.Email,
            Tipo = usuario.Tipo,
            DataCriacao = usuario.DataCriacao
        };
    }
}
