using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using MiniHBYS.Core.Entities;
using MiniHBYS.Core.Interfaces;
using MiniHBYS.DataAccess.Context;

namespace MiniHBYS.DataAccess.Repositories;

public class Repository<T> : IRepository<T> where T : BaseEntity
{
    protected readonly AppDbContext _context;
    protected readonly DbSet<T> _dbSet;

    public Repository(AppDbContext context)
    {
        _context = context;
        _dbSet = context.Set<T>();
    }

    public async Task<T?> GetByIdAsync(int id) =>
        await _dbSet.FirstOrDefaultAsync(e => e.Id == id && e.IsActive);

    public async Task<IEnumerable<T>> GetAllAsync() =>
        await _dbSet.Where(e => e.IsActive).ToListAsync();

    public async Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate) =>
        await _dbSet.Where(e => e.IsActive).Where(predicate).ToListAsync();

    public async Task AddAsync(T entity)
    {
        entity.CreatedAt = DateTime.UtcNow;
        entity.IsActive = true;
        await _dbSet.AddAsync(entity);
    }

    public void Update(T entity)
    {
        entity.UpdatedAt = DateTime.UtcNow;
        _dbSet.Update(entity);
    }

    public void SoftDelete(T entity)
    {
        entity.IsActive = false;
        entity.UpdatedAt = DateTime.UtcNow;
        _dbSet.Update(entity);
    }

    public async Task<bool> ExistsAsync(Expression<Func<T, bool>> predicate) =>
        await _dbSet.Where(e => e.IsActive).AnyAsync(predicate);

    public async Task<int> SaveChangesAsync() =>
        await _context.SaveChangesAsync();
}
