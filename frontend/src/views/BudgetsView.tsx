import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '../store/useAppStore';
import { apiRequest } from '../utils/api';
import { 
  ChevronLeft, 
  ChevronRight, 
  Copy, 
  Edit3, 
  Check, 
  X, 
  TrendingUp, 
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Trash2,
  Plus
} from 'lucide-react';
import '../App.css';

export default function BudgetsView() {
  const queryClient = useQueryClient();
  const activeHouseholdId = useAppStore((state) => state.activeHouseholdId);

  // Month state (defaults to current month: YYYY-MM)
  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const getMonthStr = (d: Date) => {
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
  };

  const monthStr = getMonthStr(currentDate);

  // Editing state
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');

  // Budget settings form state
  const [showSettings, setShowSettings] = useState(false);
  const [targetIncomeInput, setTargetIncomeInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [lastSyncedMonth, setLastSyncedMonth] = useState('');

  // Add Category Budget form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCatId, setSelectedCatId] = useState('');
  const [newPlannedAmount, setNewPlannedAmount] = useState('');

  // Inline delete confirmation state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // 1. Fetch Budget details for selected month
  const { data: budgetData, isLoading } = useQuery({
    queryKey: ['budget', activeHouseholdId, monthStr],
    queryFn: () => apiRequest(`households/${activeHouseholdId}/budgets/${monthStr}`),
    enabled: !!activeHouseholdId,
  });

  if (budgetData && lastSyncedMonth !== monthStr) {
    setTargetIncomeInput(budgetData.totalIncomeBudget?.toString() || '0');
    setNotesInput(budgetData.notes || '');
    setLastSyncedMonth(monthStr);
  }

  // Calculate totals
  const totalSpent = budgetData?.lines?.reduce((sum: number, l: any) => {
    if (l.category?.type !== 'expense') return sum;
    return sum + Number(l.actualSpent);
  }, 0) || 0;
  const totalBudgeted = budgetData?.lines?.reduce((sum: number, l: any) => {
    if (l.category?.type !== 'expense') return sum;
    return sum + Number(l.plannedAmount);
  }, 0) || 0;

  // 2. Adjust target month's overall budget headers
  const setBudgetMutation = useMutation({
    mutationFn: (payload: { totalIncomeBudget?: number; notes?: string }) => 
      apiRequest(`households/${activeHouseholdId}/budgets`, {
        method: 'POST',
        body: JSON.stringify({ month: monthStr, ...payload }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget'] });
    },
  });

  // 3. Set category lines mutation
  const setLinesMutation = useMutation({
    mutationFn: (lines: { categoryId: string; plannedAmount: number }[]) => 
      apiRequest(`households/${activeHouseholdId}/budgets/${monthStr}/lines`, {
        method: 'POST',
        body: JSON.stringify({ lines }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget'] });
      setEditingCatId(null);
      setShowAddForm(false);
      setSelectedCatId('');
      setNewPlannedAmount('');
    },
  });

  // 4. Copy budget mutation
  const copyMutation = useMutation({
    mutationFn: (sourceMonth: string) => 
      apiRequest(`households/${activeHouseholdId}/budgets/copy`, {
        method: 'POST',
        body: JSON.stringify({ sourceMonth, targetMonth: monthStr }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget'] });
      alert('Budget template copied successfully!');
    },
    onError: (err: any) => {
      alert(err.message || 'Copy failed. Make sure the previous month is configured first.');
    },
  });

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleCopyBudget = () => {
    const prevDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const prevMonthStr = getMonthStr(prevDate);
    if (window.confirm(`Copy budget configuration from ${prevMonthStr} to ${monthStr}?`)) {
      copyMutation.mutate(prevMonthStr);
    }
  };

  // Remaining pool calculation
  const unallocatedPool = (budgetData?.totalIncomeBudget || 0) - totalBudgeted;

  // Filter active budgeted expense categories (plannedAmount > 0)
  const activeCategoryBudgets = budgetData?.lines?.filter((l: any) => 
    l.category?.type === 'expense' && Number(l.plannedAmount) > 0
  ) || [];

  // Filter unbudgeted expense categories
  const unbudgetedCategories = budgetData?.lines?.filter((l: any) => 
    l.category?.type === 'expense' && Number(l.plannedAmount) === 0
  ) || [];

  const handleStartEdit = (catId: string, currentPlanned: number) => {
    setEditingCatId(catId);
    setEditingValue(currentPlanned.toString());
  };

  const handleSaveLine = async (catId: string, amount: number) => {
    if (isNaN(amount) || amount < 0) {
      alert('Please enter a valid amount.');
      return;
    }

    const totalIncomeBudget = budgetData?.totalIncomeBudget || 0;
    const currentPlannedAmount = budgetData?.lines?.find((l: any) => l.categoryId === catId)?.plannedAmount || 0;
    const availableAmount = totalIncomeBudget - totalBudgeted + currentPlannedAmount;

    if (amount > availableAmount) {
      alert(`Cannot exceed the monthly budget pool. You only have ₹${availableAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })} available to allocate.`);
      return;
    }

    // Build payload lines, mapping categories to their planned values
    const currentLines = budgetData?.lines || [];
    let lineFound = false;

    const payloadLines = currentLines.map((l: any) => {
      const isTarget = l.categoryId === catId;
      if (isTarget) {
        lineFound = true;
        return { categoryId: l.categoryId, plannedAmount: amount };
      }
      return { categoryId: l.categoryId, plannedAmount: Number(l.plannedAmount) };
    });

    if (!lineFound) {
      payloadLines.push({ categoryId: catId, plannedAmount: amount });
    }

    // Only send lines with plannedAmount > 0
    const cleanLines = payloadLines
      .filter((l: any) => l.plannedAmount > 0)
      .map((l: any) => ({
        categoryId: l.categoryId,
        plannedAmount: l.plannedAmount,
      }));

    setLinesMutation.mutate(cleanLines);
  };

  const handleDeleteLine = (catId: string) => {
    // Set to pending-confirm state first; actual deletion fires on second click
    setConfirmDeleteId(catId);
  };

  const handleConfirmDelete = () => {
    if (!confirmDeleteId) return;
    const catId = confirmDeleteId;
    setConfirmDeleteId(null);

    // Prepare payload excluding this category
    const cleanLines = (budgetData?.lines || [])
      .map((l: any) => ({
        categoryId: l.categoryId,
        plannedAmount: l.categoryId === catId ? 0 : Number(l.plannedAmount),
      }))
      .filter((l: any) => l.plannedAmount > 0);

    setLinesMutation.mutate(cleanLines);
  };

  const getMonthName = (d: Date) => {
    return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
      {/* View Header */}
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', fontFamily: 'var(--font-display)' }}>Budgets</h2>
        <p style={{ fontSize: '0.85rem' }}>Plan category targets and monitor limits.</p>
      </div>

      {/* Date Navigator & Copy tool */}
      <div className="card-glass" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px var(--spacing-md)',
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        borderRadius: 'var(--radius-md)'
      }}>
        <button style={{ minHeight: 'auto', padding: '6px', background: 'transparent', border: 'none' }} onClick={handlePrevMonth}>
          <ChevronLeft size={20} />
        </button>
        <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>{getMonthName(currentDate)}</span>
        <button style={{ minHeight: 'auto', padding: '6px', background: 'transparent', border: 'none' }} onClick={handleNextMonth}>
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Top overall status indicators */}
      <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
        <div className="card" style={{ flex: 1, padding: 'var(--spacing-sm) var(--spacing-md)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Budget Pool</span>
          <span style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--primary)' }}>
            ₹{(budgetData?.totalIncomeBudget || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </span>
        </div>

        <div className="card" style={{ flex: 1, padding: 'var(--spacing-sm) var(--spacing-md)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Allocated</span>
          <span style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--text-primary)' }}>
            ₹{totalBudgeted.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </span>
        </div>

        <div className="card" style={{ flex: 1, padding: 'var(--spacing-sm) var(--spacing-md)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Unallocated</span>
          <span style={{ 
            fontWeight: '700', 
            fontSize: '1.1rem', 
            color: unallocatedPool < 0 ? 'var(--danger)' : unallocatedPool > 0 ? 'var(--success)' : 'var(--text-muted)' 
          }}>
            ₹{unallocatedPool.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>

      {/* Copy templates trigger */}
      <button 
        className="secondary" 
        style={{ width: '100%', minHeight: '38px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
        onClick={handleCopyBudget}
        disabled={copyMutation.isPending}
      >
        <Copy size={14} /> Copy targets from previous month
      </button>

      {/* Monthly Budget Settings */}
      <div className="card-glass" style={{
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--spacing-md)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-sm)'
      }}>
        <div 
          onClick={() => setShowSettings(!showSettings)}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            userSelect: 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} color="var(--primary)" />
            <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>Monthly Budget Settings</span>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {showSettings ? 'Collapse' : 'Expand'}
            {showSettings ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>
        </div>

        {showSettings && (
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              const incomeVal = parseFloat(targetIncomeInput);
              setBudgetMutation.mutate({
                totalIncomeBudget: isNaN(incomeVal) ? 0 : incomeVal,
                notes: notesInput
              });
            }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--spacing-sm)',
              marginTop: 'var(--spacing-xs)',
              borderTop: '1px solid var(--card-border)',
              paddingTop: 'var(--spacing-sm)'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label htmlFor="totalIncomeBudget" style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                Target Monthly Income (₹)
              </label>
              <input
                id="totalIncomeBudget"
                type="number"
                value={targetIncomeInput}
                onChange={(e) => setTargetIncomeInput(e.target.value)}
                placeholder="e.g. 80000"
                style={{
                  padding: '8px 12px',
                  fontSize: '0.9rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--card-border)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label htmlFor="budgetNotes" style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                Monthly Budget Notes
              </label>
              <textarea
                id="budgetNotes"
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                placeholder="Write target notes, budget strategies, etc."
                rows={3}
                style={{
                  padding: '8px 12px',
                  fontSize: '0.9rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--card-border)',
                  color: 'var(--text-primary)',
                  resize: 'none',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                {setBudgetMutation.isSuccess && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: '600' }}>
                    ✓ Settings saved!
                  </span>
                )}
                {setBudgetMutation.isError && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--danger)', fontWeight: '600' }}>
                    Error: {(setBudgetMutation.error as any)?.message || 'Failed to save'}
                  </span>
                )}
              </div>
              <button 
                type="submit" 
                className="primary" 
                style={{ alignSelf: 'flex-end', minHeight: '36px', padding: '0 var(--spacing-md)', fontSize: '0.85rem' }}
                disabled={setBudgetMutation.isPending}
              >
                {setBudgetMutation.isPending ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Category lines */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: '700' }}>Category Budgets</h3>
          {!showAddForm && unbudgetedCategories.length > 0 && (
            <button 
              className="primary" 
              style={{
                padding: '4px 10px',
                fontSize: '0.75rem',
                minHeight: '28px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              onClick={() => {
                setShowAddForm(true);
                setSelectedCatId(unbudgetedCategories[0]?.categoryId || '');
              }}
            >
              <Plus size={12} /> Add Category Budget
            </button>
          )}
        </div>

        {/* Add Category Budget Inline Form */}
        {showAddForm && (
          <div className="card-glass" style={{
            padding: 'var(--spacing-md)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--card-bg)',
            border: '1px dashed var(--primary)',
            marginBottom: 'var(--spacing-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--spacing-sm)'
          }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: '700' }}>Allocate Budget to Category</h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label htmlFor="addCategorySelect" style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                Select Category
              </label>
              <select
                id="addCategorySelect"
                value={selectedCatId}
                onChange={(e) => setSelectedCatId(e.target.value)}
                style={{
                  padding: '8px 12px',
                  fontSize: '0.9rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--card-border)',
                  color: 'var(--text-primary)'
                }}
              >
                {unbudgetedCategories.map((c: any) => (
                  <option key={c.categoryId} value={c.categoryId}>
                    {c.category?.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label htmlFor="addPlannedAmount" style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                Planned Amount (₹)
              </label>
              <input
                id="addPlannedAmount"
                type="number"
                value={newPlannedAmount}
                onChange={(e) => setNewPlannedAmount(e.target.value)}
                placeholder={`Max available: ₹${unallocatedPool.toFixed(0)}`}
                style={{
                  padding: '8px 12px',
                  fontSize: '0.9rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--card-border)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
              <button
                className="secondary"
                style={{ minHeight: '32px', padding: '0 var(--spacing-sm)', fontSize: '0.8rem' }}
                onClick={() => {
                  setShowAddForm(false);
                  setSelectedCatId('');
                  setNewPlannedAmount('');
                }}
              >
                Cancel
              </button>
              <button
                className="primary"
                style={{ minHeight: '32px', padding: '0 var(--spacing-sm)', fontSize: '0.8rem' }}
                onClick={() => {
                  const amt = parseFloat(newPlannedAmount);
                  handleSaveLine(selectedCatId, amt);
                }}
                disabled={setLinesMutation.isPending}
              >
                {setLinesMutation.isPending ? 'Adding...' : 'Add Budget'}
              </button>
            </div>
          </div>
        )}
        
        {isLoading ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 'var(--spacing-md)' }}>Loading budget lines...</p>
        ) : activeCategoryBudgets.length === 0 ? (
          <div className="card text-center" style={{ padding: 'var(--spacing-xl)', border: '1px dashed var(--card-border)' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No category budgets allocated yet. Click the "Add Category Budget" button to allocate funds from your monthly budget pool.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {activeCategoryBudgets.map((line: any) => {
              const isEditing = editingCatId === line.categoryId;
              const isOver = line.actualSpent > line.plannedAmount;
              const percent = line.plannedAmount > 0 ? Math.min((line.actualSpent / line.plannedAmount) * 100, 100) : 0;

              return (
                <div key={line.categoryId} className="card-glass" style={{
                  padding: 'var(--spacing-md)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--card-bg)',
                  border: '1px solid var(--card-border)'
                }}>
                  {/* Category Details & Value Editor */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xs)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: '600' }}>{line.category.name}</span>
                      {isOver && <AlertTriangle size={14} color="var(--danger)" />}
                    </div>

                    {isEditing ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          style={{
                            width: '80px',
                            padding: '4px 8px',
                            fontSize: '0.85rem',
                            minHeight: '28px',
                            backgroundColor: 'var(--bg-primary)',
                            border: '1px solid var(--primary)',
                            textAlign: 'right'
                          }}
                          autoFocus
                        />
                        <button 
                          style={{ minHeight: 'auto', padding: '6px', background: 'transparent', border: 'none' }}
                          onClick={() => {
                            const amt = parseFloat(editingValue);
                            handleSaveLine(line.categoryId, amt);
                          }}
                          disabled={setLinesMutation.isPending}
                        >
                          <Check size={16} color="var(--success)" />
                        </button>
                        <button 
                          style={{ minHeight: 'auto', padding: '6px', background: 'transparent', border: 'none' }}
                          onClick={() => setEditingCatId(null)}
                        >
                          <X size={16} color="var(--danger)" />
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-secondary)' }}>
                          ₹{line.actualSpent.toFixed(0)} <span style={{ color: 'var(--text-muted)' }}>of</span> ₹{line.plannedAmount.toFixed(0)}
                        </span>

                        {confirmDeleteId === line.categoryId ? (
                          // Inline confirm/cancel
                          <>
                            <span style={{ fontSize: '0.7rem', color: 'var(--danger)', fontWeight: '600' }}>Remove?</span>
                            <button
                              style={{ minHeight: 'auto', padding: '2px 6px', fontSize: '0.7rem', borderRadius: 'var(--radius-sm)', background: 'var(--danger)', color: '#fff', border: 'none', cursor: 'pointer' }}
                              onClick={handleConfirmDelete}
                              disabled={setLinesMutation.isPending}
                            >
                              Yes
                            </button>
                            <button
                              style={{ minHeight: 'auto', padding: '2px 6px', fontSize: '0.7rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--card-border)', cursor: 'pointer' }}
                              onClick={() => setConfirmDeleteId(null)}
                            >
                              No
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              style={{ minHeight: 'auto', padding: '4px', background: 'transparent', border: 'none' }}
                              onClick={() => handleStartEdit(line.categoryId, line.plannedAmount)}
                            >
                              <Edit3 size={13} color="var(--text-muted)" />
                            </button>
                            <button 
                              style={{ minHeight: 'auto', padding: '4px', background: 'transparent', border: 'none' }}
                              onClick={() => handleDeleteLine(line.categoryId)}
                            >
                              <Trash2 size={13} color="var(--danger)" />
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Progress Line */}
                  <div style={{
                    width: '100%',
                    height: '6px',
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-full)',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${percent}%`,
                      height: '100%',
                      backgroundColor: isOver ? 'var(--danger)' : 'var(--primary)',
                      borderRadius: 'var(--radius-full)'
                    }} />
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
