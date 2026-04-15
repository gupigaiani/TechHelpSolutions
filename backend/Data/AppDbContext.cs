using Microsoft.EntityFrameworkCore;
using System.Reflection.Emit;
using TechHelpSolutions.Models;

namespace TechHelpSolutions.Data
{
    public class AppDbContext : DbContext
    {
        public DbSet<Usuario> Usuarios { get; set; }
        public DbSet<Chamado> Chamados { get; set; }
        public DbSet<Categoria> Categorias { get; set; }
        public DbSet<Prioridade> Prioridades { get; set; }
        public DbSet<Status> Status { get; set; }
        public DbSet<Comentario> Comentarios { get; set; }

        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options) { }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Chamado>()
                .HasOne(c => c.Usuario)
                .WithMany(u => u.ChamadosAbertos)
                .HasForeignKey(c => c.UsuarioId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Chamado>()
                .HasOne(c => c.Tecnico)
                .WithMany(u => u.ChamadosAtendidos)
                .HasForeignKey(c => c.TecnicoId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
