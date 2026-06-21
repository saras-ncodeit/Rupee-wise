import { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { apiRequest } from '../utils/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X, Wallet, ArrowRightLeft } from 'lucide-react';
import '../App.css';

interface QuickAddBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickAddBottomSheet({ isOpen, onClose }: QuickAddBottomSheetProps) {
  const queryClient = useQueryClient();
  const activeHouseholdId = useAppStore((state) => state.activeHouseholdId);
  const addDraftTransaction = useAppStore((state) => state.addDraftTransaction);

  // Form State
  const [type, setType] = useState<'expense' | 'income' | 'transfer'>('expense');
  const [amountStr, setAmountStr] = useState('0');
  const [description, setDescription] = useState('');
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [transferToAccountId, setTransferToAccountId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch Accounts and Categories
  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts', activeHouseholdId],
    queryFn: () => apiRequest(`households/${activeHouseholdId}/accounts`),
    enabled: !!activeHouseholdId,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories', activeHouseholdId],
    queryFn: () => apiRequest(`households/${activeHouseholdId}/categories`),
    enabled: !!activeHouseholdId,
  });

  // Reset form when opened
  useEffect(() => {
    if (isOpen) {
      setAmountStr('0');
      setDescription('');
      setMessage(null);
      
      // Auto-select first account
      if (accounts.length > 0) {
        setAccountId(accounts[0].id);
        const secondAcc = accounts.find((a: any) => a.id !== accounts[0].id);
        if (secondAcc) setTransferToAccountId(secondAcc.id);
      }
      
      // Auto-select first category matching the type
      if (categories.length > 0) {
        const matchingCat = categories.find((c: any) => c.type === type);
        if (matchingCat) setCategoryId(matchingCat.id);
      }
    }
  }, [isOpen, accounts, type, categories]);

  // Adjust categories selection on type change
  useEffect(() => {
    if (categories.length > 0) {
      const matchingCat = categories.find((c: any) => c.type === type);
      if (matchingCat) {
        setCategoryId(matchingCat.id);
      } else {
        setCategoryId(categories[0].id);
      }
    }
  }, [type]);

  // Handle calculator keys
  const handleKeypress = (key: string) => {
    if (key === 'C') {
      setAmountStr('0');
    } else if (key === '.') {
      if (!amountStr.includes('.')) {
        setAmountStr(amountStr + '.');
      }
    } else {
      if (amountStr === '0') {
        setAmountStr(key);
      } else {
        // Limit decimals to 2 places
        if (amountStr.includes('.')) {
          const decimals = amountStr.split('.')[1];
          if (decimals.length >= 2) return;
        }
        setAmountStr(amountStr + key);
      }
    }
  };

  const handleBackspace = () => {
    if (amountStr.length <= 1) {
      setAmountStr('0');
    } else {
      setAmountStr(amountStr.slice(0, -1));
    }
  };

  const handleSave = async () => {
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid amount greater than 0' });
      return;
    }

    if (!accountId) {
      setMessage({ type: 'error', text: 'Please select an account' });
      return;
    }

    if (type !== 'transfer' && !categoryId) {
      setMessage({ type: 'error', text: 'Please select a category' });
      return;
    }

    if (type === 'transfer' && !transferToAccountId) {
      setMessage({ type: 'error', text: 'Please select a destination account' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    const payload = {
      accountId,
      categoryId: type !== 'transfer' ? categoryId : undefined,
      type,
      amount,
      date: new Date().toISOString(),
      description: description.trim() || `${type.charAt(0).toUpperCase() + type.slice(1)} transaction`,
      transferToAccountId: type === 'transfer' ? transferToAccountId : undefined,
    };

    try {
      // Generate unique key
      const idempotencyKey = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      
      // Attempt API log
      await apiRequest(`households/${activeHouseholdId}/transactions`, {
        method: 'POST',
        headers: {
          'idempotency-key': idempotencyKey,
        },
        body: JSON.stringify(payload),
      });

      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['budget'] });

      setMessage({ type: 'success', text: 'Transaction saved successfully!' });
      
      // Close sheet after short delay
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (err: any) {
      // Fallback: Queue offline draft
      console.warn('Network request failed. Queueing transaction as offline draft.', err);
      addDraftTransaction({
        accountId,
        categoryId: type !== 'transfer' ? categoryId : undefined,
        type,
        amount,
        currency: 'INR',
        date: new Date().toISOString(),
        description: description.trim() || `Draft: ${type.charAt(0).toUpperCase() + type.slice(1)}`,
        transferToAccountId: type === 'transfer' ? transferToAccountId : undefined,
      });

      setMessage({ type: 'success', text: 'Offline: Transaction queued locally!' });
      setTimeout(() => {
        onClose();
      }, 1000);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(4px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      animation: 'fadeIn var(--transition-fast) forwards'
    }} onClick={onClose}>
      <div 
        className="card-glass" 
        style={{
          width: '100%',
          maxWidth: '480px',
          backgroundColor: 'var(--bg-secondary)',
          borderTopLeftRadius: 'var(--radius-lg)',
          borderTopRightRadius: 'var(--radius-lg)',
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          padding: 'var(--spacing-lg)',
          animation: 'slideUp var(--transition-normal) forwards',
          maxHeight: '92vh',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-md)' }}>
          <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>Quick Add</h3>
          <button style={{ minHeight: 'auto', padding: '6px', background: 'transparent', border: 'none' }} onClick={onClose}>
            <X size={20} color="var(--text-muted)" />
          </button>
        </div>

        {message && (
          <div style={{
            backgroundColor: message.type === 'success' ? 'var(--success-glow)' : 'var(--danger-glow)',
            border: `1px solid ${message.type === 'success' ? 'var(--success)' : 'var(--danger)'}`,
            padding: 'var(--spacing-sm)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--spacing-md)',
            textAlign: 'center',
            fontSize: '0.9rem'
          }}>
            {message.text}
          </div>
        )}

        {/* Transaction Type Tabs */}
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)', backgroundColor: 'var(--card-bg)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
          {(['expense', 'income', 'transfer'] as const).map((t) => (
            <button
              key={t}
              style={{
                flex: 1,
                minHeight: '36px',
                padding: '6px',
                fontSize: '0.85rem',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: type === t ? 'var(--bg-primary)' : 'transparent',
                color: type === t ? (t === 'expense' ? 'var(--danger)' : t === 'income' ? 'var(--success)' : 'var(--secondary)') : 'var(--text-secondary)',
                boxShadow: type === t ? '0 1px 3px rgba(0,0,0,0.2)' : 'none'
              }}
              onClick={() => setType(t)}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Amount Field (Displays custom keypad input) */}
        <div style={{ 
          backgroundColor: 'var(--bg-primary)', 
          borderRadius: 'var(--radius-md)', 
          padding: 'var(--spacing-md)', 
          textAlign: 'right', 
          marginBottom: 'var(--spacing-md)',
          border: '1px solid var(--card-border)'
        }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block' }}>AMOUNT (INR)</span>
          <span style={{ 
            fontSize: '2.5rem', 
            fontWeight: '800', 
            fontFamily: 'var(--font-display)',
            color: type === 'expense' ? 'var(--danger)' : type === 'income' ? 'var(--success)' : 'var(--secondary)'
          }}>
            ₹{amountStr}
          </span>
        </div>

        {/* Description Field */}
        <div className="form-group" style={{ marginBottom: 'var(--spacing-md)' }}>
          <input
            type="text"
            placeholder="e.g., Groceries, Swiggy, Salary..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ padding: '0.65rem 0.85rem', fontSize: '0.95rem' }}
          />
        </div>

        {/* Accounts / Dest Account Selection */}
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '0.75rem', marginBottom: '4px', display: 'block' }}>Account</label>
            <select value={accountId} onChange={(e) => setAccountId(e.target.value)} style={{ padding: '8px', fontSize: '0.85rem', minHeight: '38px' }}>
              {accounts.map((a: any) => (
                <option key={a.id} value={a.id}>{a.name} (₹{Number(a.currentBalance).toFixed(0)})</option>
              ))}
            </select>
          </div>

          {type === 'transfer' ? (
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.75rem', marginBottom: '4px', display: 'block' }}>To Account</label>
              <select value={transferToAccountId} onChange={(e) => setTransferToAccountId(e.target.value)} style={{ padding: '8px', fontSize: '0.85rem', minHeight: '38px' }}>
                {accounts.filter((a: any) => a.id !== accountId).map((a: any) => (
                  <option key={a.id} value={a.id}>{a.name} (₹{Number(a.currentBalance).toFixed(0)})</option>
                ))}
              </select>
            </div>
          ) : (
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.75rem', marginBottom: '4px', display: 'block' }}>Category</label>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={{ padding: '8px', fontSize: '0.85rem', minHeight: '38px' }}>
                {categories.filter((c: any) => c.type === type).map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Compact Custom Numeric Calculator Keypad */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: '8px', 
          marginBottom: 'var(--spacing-lg)',
          backgroundColor: 'var(--card-bg)',
          padding: '8px',
          borderRadius: 'var(--radius-md)'
        }}>
          {['1', '2', '3', '⌫', '4', '5', '6', 'C', '7', '8', '9', '.', '0', '00'].map((k) => (
            <button
              key={k}
              type="button"
              style={{
                minHeight: '44px',
                padding: '8px',
                fontSize: '1.1rem',
                fontWeight: '700',
                border: 'none',
                backgroundColor: 'var(--bg-secondary)',
                color: k === '⌫' || k === 'C' ? 'var(--danger)' : 'var(--text-primary)',
                borderRadius: '6px',
              }}
              onClick={() => {
                if (k === '⌫') handleBackspace();
                else handleKeypress(k);
              }}
            >
              {k}
            </button>
          ))}
          
          {/* Prominent Save Done Check Button */}
          <button
            type="button"
            className="primary"
            style={{
              gridColumn: 'span 2',
              minHeight: '44px',
              backgroundColor: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
            }}
            onClick={handleSave}
            disabled={submitting}
          >
            <Check size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
