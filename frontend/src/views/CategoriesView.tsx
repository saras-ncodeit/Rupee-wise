import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '../store/useAppStore';
import { apiRequest } from '../utils/api';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Lock, 
  Folder, 
  FolderOpen, 
  ChevronRight, 
  HelpCircle,
  FolderPlus,
  Move
} from 'lucide-react';
import { Link } from 'react-router-dom';
import '../App.css';

export default function CategoriesView() {
  const queryClient = useQueryClient();
  const activeHouseholdId = useAppStore((state) => state.activeHouseholdId);

  // Form State
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'expense' | 'income'>('expense');
  const [newCatParentId, setNewCatParentId] = useState('');
  const [formError, setFormError] = useState('');

  // Drag State
  const [draggedId, setDraggedId] = useState<string | null>(null);

  // 1. Fetch Categories list
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories', activeHouseholdId],
    queryFn: () => apiRequest(`households/${activeHouseholdId}/categories`),
    enabled: !!activeHouseholdId,
  });

  // 2. Create Category mutation
  const createMutation = useMutation({
    mutationFn: (payload: { name: string; type: string; parentId?: string }) => 
      apiRequest(`households/${activeHouseholdId}/categories`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['budget'] });
      setNewCatName('');
      setNewCatParentId('');
      setFormError('');
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to create category.');
    }
  });

  // 3. Update Category (reparent or reorder) mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => 
      apiRequest(`households/${activeHouseholdId}/categories/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['budget'] });
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to update category tree.');
    }
  });

  // 4. Archive/Delete Category mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => 
      apiRequest(`households/${activeHouseholdId}/categories/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['budget'] });
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to archive category.');
    }
  });

  // Filter lists
  const parents = categories.filter((c: any) => c.parentId === null);
  const getSubcategories = (parentId: string) => {
    return categories.filter((c: any) => c.parentId === parentId);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    createMutation.mutate({
      name: newCatName.trim(),
      type: newCatType,
      parentId: newCatParentId || undefined,
    });
  };

  // Drag and Drop Handling
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropSubcategory = (e: React.DragEvent, targetParentId: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || draggedId;
    if (!id || id === targetParentId) return;

    const draggedCategory = categories.find((c: any) => c.id === id);
    if (!draggedCategory) return;

    // Check: system categories cannot be moved
    if (draggedCategory.isSystem) {
      alert('System categories cannot be re-parented.');
      return;
    }

    // Check: parents cannot be dropped into other parents (nesting limit 2)
    if (draggedCategory.parentId === null) {
      alert('Cannot nesting parents inside other parents. Nesting is limited to 2 levels.');
      return;
    }

    // Update parentId in database
    updateMutation.mutate({
      id,
      payload: { parentId: targetParentId },
    });
    setDraggedId(null);
  };

  const handleDropParentSort = (e: React.DragEvent, targetParentId: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || draggedId;
    if (!id || id === targetParentId) return;

    const draggedCategory = categories.find((c: any) => c.id === id);
    const targetCategory = categories.find((c: any) => c.id === targetParentId);
    
    if (!draggedCategory || !targetCategory) return;

    // Verify both are parents to allow sorting swap
    if (draggedCategory.parentId !== null || targetCategory.parentId !== null) {
      // If dropping a subcategory on a parent, it triggers reparenting instead
      if (draggedCategory.parentId !== null && targetCategory.parentId === null) {
        handleDropSubcategory(e, targetParentId);
      }
      return;
    }

    if (draggedCategory.isSystem || targetCategory.isSystem) {
      alert('System categories cannot be reordered.');
      return;
    }

    // Swap sorting index order
    const oldOrder = draggedCategory.sortOrder;
    const newOrder = targetCategory.sortOrder;

    updateMutation.mutate({
      id: draggedCategory.id,
      payload: { sortOrder: newOrder },
    });
    updateMutation.mutate({
      id: targetCategory.id,
      payload: { sortOrder: oldOrder },
    });

    setDraggedId(null);
  };

  const handleArchive = (id: string, name: string) => {
    if (window.confirm(`Archive category "${name}"? Subcategories (if any) will also be archived.`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
        <Link to="/settings" style={{ minHeight: 'auto', padding: '6px', color: 'var(--text-secondary)' }}>
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', fontFamily: 'var(--font-display)' }}>Manage Categories</h2>
          <p style={{ fontSize: '0.8rem' }}>Drag subcategories onto parents to organize them.</p>
        </div>
      </div>

      {/* Add Category Form */}
      <div className="card">
        <h3 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: 'var(--spacing-sm)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FolderPlus size={16} color="var(--primary)" /> ADD CATEGORY
        </h3>

        {formError && <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginBottom: '8px' }}>{formError}</p>}

        <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
            <input
              type="text"
              placeholder="Category Name"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              required
              style={{ flex: 2, padding: '6px 10px', fontSize: '0.85rem', minHeight: '34px' }}
            />
            
            <select
              value={newCatType}
              onChange={(e: any) => setNewCatType(e.target.value)}
              style={{ flex: 1, padding: '6px', fontSize: '0.85rem', minHeight: '34px' }}
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginTop: '4px' }}>
            <select
              value={newCatParentId}
              onChange={(e) => setNewCatParentId(e.target.value)}
              style={{ flex: 2, padding: '6px 10px', fontSize: '0.85rem', minHeight: '34px' }}
            >
              <option value="">None (Create as Parent Group)</option>
              {parents.filter((p: any) => p.type === newCatType).map((p: any) => (
                <option key={p.id} value={p.id}>Child of: {p.name}</option>
              ))}
            </select>

            <button type="submit" className="primary" style={{ flex: 1, minHeight: '34px', padding: '6px' }} disabled={createMutation.isPending}>
              <Plus size={14} style={{ marginRight: '4px' }} /> Add
            </button>
          </div>
        </form>
      </div>

      {/* Categories Tree list */}
      <div>
        <h3 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '8px' }}>Expense & Income Tree</h3>

        {isLoading ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 'var(--spacing-md)' }}>Loading category tree...</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {parents.map((parent: any) => {
              const subs = getSubcategories(parent.id);
              return (
                <div 
                  key={parent.id} 
                  className="card-glass"
                  style={{
                    padding: 'var(--spacing-sm) var(--spacing-md)',
                    border: '1px solid var(--card-border)',
                    backgroundColor: 'var(--card-bg)',
                    borderRadius: 'var(--radius-md)'
                  }}
                  draggable={!parent.isSystem}
                  onDragStart={(e) => handleDragStart(e, parent.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDropParentSort(e, parent.id)}
                >
                  {/* Parent Category Row */}
                  <div 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingBottom: subs.length > 0 ? '6px' : '0',
                      borderBottom: subs.length > 0 ? '1px solid var(--card-border)' : 'none',
                      cursor: parent.isSystem ? 'default' : 'grab'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {!parent.isSystem && <Move size={14} color="var(--text-muted)" style={{ cursor: 'grab' }} />}
                      <span style={{ fontSize: '0.95rem', fontWeight: '700', color: parent.type === 'expense' ? 'var(--text-primary)' : 'var(--success)' }}>
                        {parent.name}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                        ({parent.type})
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {parent.isSystem ? (
                        <span title="System categories cannot be edited">
                          <Lock size={12} color="var(--text-muted)" />
                        </span>
                      ) : (
                        <button
                          style={{ minHeight: 'auto', padding: '4px', background: 'transparent', border: 'none' }}
                          onClick={() => handleArchive(parent.id, parent.name)}
                        >
                          <Trash2 size={13} color="var(--text-muted)" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Nested Subcategories (Droppable container for drag reparenting!) */}
                  <div 
                    style={{ 
                      paddingLeft: 'var(--spacing-md)', 
                      paddingTop: '6px',
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '4px',
                      minHeight: '20px' // Ensures drop target area exists even if empty!
                    }}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDropSubcategory(e, parent.id)}
                  >
                    {subs.length === 0 ? (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        Drop subcategories here
                      </span>
                    ) : (
                      subs.map((sub: any) => (
                        <div 
                          key={sub.id} 
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '4px 6px',
                            backgroundColor: 'var(--bg-primary)',
                            borderRadius: '4px',
                            cursor: sub.isSystem ? 'default' : 'grab'
                          }}
                          draggable={!sub.isSystem}
                          onDragStart={(e) => handleDragStart(e, sub.id)}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {!sub.isSystem && <Move size={12} color="var(--text-muted)" />}
                            <ChevronRight size={12} color="var(--text-muted)" />
                            <span style={{ fontSize: '0.85rem' }}>{sub.name}</span>
                          </div>

                          {!sub.isSystem && (
                            <button
                              style={{ minHeight: 'auto', padding: '2px', background: 'transparent', border: 'none' }}
                              onClick={() => handleArchive(sub.id, sub.name)}
                            >
                              <Trash2 size={12} color="var(--text-muted)" />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
