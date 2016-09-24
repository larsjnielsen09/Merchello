namespace Merchello.Core.Cache
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// Represents a caching policy.
    /// </summary>
    /// <typeparam name="TEntity">
    /// The type of entity to cache
    /// </typeparam>
    internal interface IRepositoryCachePolicy<TEntity>
    {
        // note:
        // at the moment each repository instance creates its corresponding cache policy instance
        // we could reduce allocations by using static cache policy instances but then we would need
        // to modify all methods here to pass the repository and cache eg:
        //
        // TEntity Get(TRepository repository, IRuntimeCacheProvider cache, TId id);
        //
        // it is not *that* complicated but then RepositoryBase needs to have a TRepository generic
        // type parameter and it all becomes convoluted - keeping it simple for the time being.

        /// <summary>
        /// Gets an entity from the cache, else from the repository.
        /// </summary>
        /// <param name="key">The GUID identifier.</param>
        /// <param name="performGet">The repository PerformGet method.</param>
        /// <param name="performGetAll">The repository PerformGetAll method.</param>
        /// <returns>The entity with the specified identifier, if it exits, else null.</returns>
        /// <remarks>First considers the cache then the repository.</remarks>
        TEntity Get(Guid key, Func<Guid, TEntity> performGet, Func<Guid[], IEnumerable<TEntity>> performGetAll);

        /// <summary>
        /// Gets an entity from the cache.
        /// </summary>
        /// <param name="key">The GUID identifier.</param>
        /// <returns>The entity with the specified identifier, if it is in the cache already, else null.</returns>
        /// <remarks>Does not consider the repository at all.</remarks>
        TEntity GetCached(Guid key);

        /// <summary>
        /// Gets a value indicating whether an entity with a specified identifier exists.
        /// </summary>
        /// <param name="key">The GUID identifier.</param>
        /// <param name="performExists">The repository PerformExists method.</param>
        /// <param name="performGetAll">The repository PerformGetAll method.</param>
        /// <returns>A value indicating whether an entity with the specified identifier exists.</returns>
        /// <remarks>First considers the cache then the repository.</remarks>
        bool Exists(Guid key, Func<Guid, bool> performExists, Func<Guid[], IEnumerable<TEntity>> performGetAll);

        /// <summary>
        /// Creates an entity.
        /// </summary>
        /// <param name="entity">The entity.</param>
        /// <param name="persistNew">The repository PersistNewItem method.</param>
        /// <remarks>Creates the entity in the repository, and updates the cache accordingly.</remarks>
        void Create(TEntity entity, Action<TEntity> persistNew);

        /// <summary>
        /// Updates an entity.
        /// </summary>
        /// <param name="entity">The entity.</param>
        /// <param name="persistUpdated">The repository PersistUpdatedItem method.</param>
        /// <remarks>Updates the entity in the repository, and updates the cache accordingly.</remarks>
        void Update(TEntity entity, Action<TEntity> persistUpdated);

        /// <summary>
        /// Removes an entity.
        /// </summary>
        /// <param name="entity">The entity.</param>
        /// <param name="persistDeleted">The repository PersistDeletedItem method.</param>
        /// <remarks>Removes the entity from the repository and clears the cache.</remarks>
        void Delete(TEntity entity, Action<TEntity> persistDeleted);

        /// <summary>
        /// Gets entities.
        /// </summary>
        /// <param name="keys">The collection of GUID identifiers.</param>
        /// <param name="performGetAll">The repository PerformGetAll method.</param>
        /// <returns>If <paramref name="keys"/> is empty, all entities, else the entities with the specified identifiers.</returns>
        /// <remarks>Get all the entities. Either from the cache or the repository depending on the implementation.</remarks>
        TEntity[] GetAll(Guid[] keys, Func<Guid[], IEnumerable<TEntity>> performGetAll);

        /// <summary>
        /// Clears the entire cache.
        /// </summary>
        void ClearAll();
    }
}