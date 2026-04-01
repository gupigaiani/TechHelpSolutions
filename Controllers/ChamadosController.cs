using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TechHelpSolutions.Data;
using TechHelpSolutions.DTOs;
using TechHelpSolutions.Services;

[ApiController]
[Route("api/chamados")]
public class ChamadosController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ChamadoService _service;

    public ChamadosController(AppDbContext context, ChamadoService service)
    {
        _context = context;
        _service = service;
    }

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> CriarChamado(CriarChamadoDTO dto)
    {
        var chamado = await _service.CriarChamado(dto);
        return Ok(chamado);
    }

    [Authorize]
    [HttpGet]
    public async Task<IActionResult> Listar()
    {
        var chamados = await _context.Chamados
            .Include(c => c.Usuario)
            .Include(c => c.Status)
            .ToListAsync();

        return Ok(chamados);
    }

    [Authorize]
    [HttpGet("{id}")]
    public async Task<IActionResult> ObterPorId(int id)
    {
        var chamado = await _context.Chamados
            .Include(c => c.Usuario)
            .Include(c => c.Tecnico)
            .Include(c => c.Categoria)
            .Include(c => c.Prioridade)
            .Include(c => c.Status)
            .Include(c => c.Comentarios)
                .ThenInclude(com => com.Usuario)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (chamado == null)
            return NotFound();

        return Ok(chamado);
    }

    [Authorize]
    [HttpPut("{id}/status")]
    public async Task<IActionResult> AtualizarStatus(int id, AtualizarStatusDTO dto)
    {
        await _service.AtualizarStatus(id, dto.StatusId);
        return NoContent();
    }

    [Authorize(Roles = "Tecnico")]
    [HttpPut("{id}/assumir")]
    public async Task<IActionResult> AssumirChamado(int id)
    {
        var chamado = await _context.Chamados.FindAsync(id);

        if (chamado == null)
            return NotFound();

        var userId = User.FindFirst("UserId")?.Value;

        chamado.TecnicoId = int.Parse(userId);
        chamado.StatusId = 2; // Em andamento

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [Authorize(Roles = "Tecnico")]
    [HttpPut("{id}/finalizar")]
    public async Task<IActionResult> FinalizarChamado(int id)
    {
        var chamado = await _context.Chamados.FindAsync(id);

        if (chamado == null)
            return NotFound();

        var userId = User.FindFirst("UserId")?.Value;

        chamado.TecnicoId = int.Parse(userId);
        chamado.StatusId = 3; // Em andamento

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [Authorize]
    [HttpPost("{chamadoId}/comentarios")]
    public async Task<IActionResult> CriarComentario(int chamadoId, CriarComentarioDTO dto)
    {
        var userId = User.FindFirst("UserId")?.Value;
        if (userId == null)
            return Unauthorized();

        try
        {
            var comentario = await _service.CriarComentario(chamadoId, int.Parse(userId), dto);
            return Ok(comentario);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }
}