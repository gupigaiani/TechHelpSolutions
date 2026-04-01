using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using TechHelpSolutions.Data;

public class AuthService
{
    private readonly AppDbContext _context;
    private readonly string _key = "NSIONFANSDFONAPSMFDPKSDBHPIFNSNOVASNDFIW";

    public AuthService(AppDbContext context)
    {
        _context = context;
    }

    public string Login(LoginDTO dto)
    {
        var usuario = _context.Usuarios
            .FirstOrDefault(u => u.Email == dto.Email && u.Senha == dto.Senha);

        if (usuario == null)
            return null;

        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes(_key);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new Claim[]
            {
                new Claim(ClaimTypes.Name, usuario.Nome),
                new Claim(ClaimTypes.Email, usuario.Email),
                new Claim(ClaimTypes.Role, usuario.Tipo),
                new Claim("UserId", usuario.Id.ToString())
            }),
            Expires = DateTime.UtcNow.AddHours(2),
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(key),
                SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }
}