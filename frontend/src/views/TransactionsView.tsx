import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '../store/useAppStore';
import { apiRequest } from '../utils/api';
import { 
  Search, 
  Trash2, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight, 
  ArrowRightLeft, 
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Tag
} from 'lucide-react';
import '../App.css';

export default function TransactionsView() {
  const queryClient = useQueryClient();
  const activeHouseholdId = useAppStore((state) => state.activeHouseholdId);

  // Filters state
  const [search, setSearch] = useState('');
  const [accountId, setAccountId] = useState('');
  const [type, setType] = useState('');
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);

  // Fetch Accounts (for filters)
  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts', activeHouseholdId],
    queryFn: () => apiRequest(`households/${activeHouseholdId}/accounts`),
    enabled: !!activeHouseholdId,
  });

  // Fetch all transactions with filters
  const { data: txData, isLoading } = useQuery({
    queryKey: ['transactions', activeHouseholdId, { search, accountId, type }],
    queryFn: () => {
      const queryParams = new URLSearchParams();
      if (search) queryParams.set('search', search);
      if (accountId) queryParams.set('accountId', accountId);
      if (type) queryParams.set('type', type);
      return apiRequest(`households/${activeHouseholdId}/transactions?${queryParams.toString()}`);
    },
    enabled: !!activeHouseholdId,
  });

  const transactions = txData?.transactions || [];

  // Delete transaction mutation
  const deleteMutation = useMutation({
    mutationFn: (txId: string) => apiRequest(`households/${activeHouseholdId}/transactions/${txId}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['budget'] });
    },
  });

  const handleDelete = (txId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      deleteMutation.mutate(txId);
    }
  };

  const getTransactionIcon = (txType: string) => {
    switch (txType) {
      case 'income':
        return (
          <div style={{ backgroundColor: 'var(--success-glow)', padding: '6px', borderRadius: 'var(--radius-full)' }}>
            <ArrowUpRight size={18} color="var(--success)" />
          </div>
        );
      case 'expense':
        return (
          <div style={{ backgroundColor: 'var(--danger-glow)', padding: '6px', borderRadius: 'var(--radius-full)' }}>
            <ArrowDownRight size={18} color="var(--danger)" />
          </div>
        );
      case 'transfer':
      default:
        return (
          <div style={{ backgroundColor: 'var(--secondary-glow)', padding: '6px', borderRadius: 'var(--radius-full)' }}>
            <ArrowRightLeft size={18} color="var(--secondary)" />
          </div>
        );
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
      {/* Page Header */}
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', fontFamily: 'var(--font-display)' }}>Transactions</h2>
        <p style={{ fontSize: '0.85rem' }}>View and search expense activity.</p>
      </div>

      {/* Filter panel */}
      <div className="card" style={{ padding: 'var(--spacing-md)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
        {/* Search */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px' }} />
          <input
            type="text"
            placeholder="Search descriptions, notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '36px', minHeight: '38px', fontSize: '0.9rem' }}
          />
        </div>

        {/* Dropdown Filters */}
        <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            style={{ flex: 1, padding: '6px 10px', fontSize: '0.8rem', minHeight: '36px' }}
          >
            <option value="">All Accounts</option>
            {accounts.map((a: any) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>

          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            style={{ flex: 1, padding: '6px 10px', fontSize: '0.8rem', minHeight: '36px' }}
          >
            <option value="">All Types</option>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
            <option value="transfer">Transfer</option>
          </select>
        </div>
      </div>

      {/* Transactions List */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
          <p style={{ color: 'var(--text-muted)' }}>Loading transactions...</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="card text-center" style={{ padding: 'var(--spacing-xl)' }}>
          <p style={{ color: 'var(--text-muted)' }}>No transactions match your search filters.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {transactions.map((tx: any) => {
            const isExpanded = expandedTxId === tx.id;
            return (
              <div 
                key={tx.id} 
                className="card-glass" 
                style={{
                  padding: 'var(--spacing-sm) var(--spacing-md)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--card-bg)',
                  border: isExpanded ? '1px solid var(--primary)' : '1px solid var(--card-border)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'border var(--transition-fast)'
                }}
                onClick={() => setExpandedTxId(isExpanded ? null : tx.id)}
              >
                {/* Main line */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', overflow: 'hidden' }}>
                    {getTransactionIcon(tx.type)}
                    <div style={{ overflow: 'hidden' }}>
                      <span style={{ 
                        fontSize: '0.9rem', 
                        fontWeight: '600', 
                        display: 'block', 
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {tx.description}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {tx.category?.name || (tx.type === 'transfer' ? 'Transfer' : 'Uncategorized')} • {new Date(tx.date).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', flexShrink: 0 }}>
                    <span style={{ 
                      fontWeight: '700', 
                      fontSize: '0.95rem',
                      color: tx.type === 'expense' ? 'var(--danger)' : tx.type === 'income' ? 'var(--success)' : 'var(--secondary)'
                    }}>
                      {tx.type === 'expense' ? '-' : tx.type === 'income' ? '+' : ''}
                      ₹{Number(tx.amount).toFixed(0)}
                    </span>
                    {isExpanded ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                  </div>
                </div>

                {/* Expanded Details drawer */}
                {isExpanded && (
                  <div style={{ 
                    marginTop: 'var(--spacing-md)', 
                    borderTop: '1px solid var(--card-border)', 
                    paddingTop: 'var(--spacing-sm)',
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    {tx.notes && (
                      <p><strong>Notes:</strong> {tx.notes}</p>
                    )}
                    
                    <p><strong>Account:</strong> {tx.account?.name} {tx.transferToAccount ? `➔ ${tx.transferToAccount.name}` : ''}</p>
                    
                    {/* Tags */}
                    {tx.tags && tx.tags.length > 0 && (
                      <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <Tag size={12} color="var(--text-muted)" />
                        {tx.tags.map((t: any) => (
                          <span key={t.tagId} style={{ backgroundColor: 'var(--bg-primary)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem' }}>
                            {t.tag?.name}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Splits Details */}
                    {tx.splits && tx.splits.length > 0 && (
                      <div style={{ marginTop: '8px', backgroundColor: 'var(--bg-primary)', padding: '8px', borderRadius: '6px' }}>
                        <p style={{ fontWeight: '700', marginBottom: '4px', fontSize: '0.8rem' }}>Split Details:</p>
                        {tx.splits.map((s: any) => (
                          <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', padding: '2px 0' }}>
                            <span>{s.category?.name}</span>
                            <span style={{ fontWeight: '600' }}>₹{Number(s.amount).toFixed(0)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Delete operation */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--spacing-sm)' }}>
                      <button 
                        style={{
                          backgroundColor: 'var(--danger-glow)',
                          border: '1px solid var(--danger)',
                          color: 'var(--danger)',
                          padding: '4px 8px',
                          fontSize: '0.75rem',
                          borderRadius: 'var(--radius-sm)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          minHeight: 'auto'
                        }}
                        onClick={(e) => handleDelete(tx.id, e)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 size={12} />
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
