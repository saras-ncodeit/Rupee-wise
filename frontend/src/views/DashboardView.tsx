import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '../store/useAppStore';
import { apiRequest } from '../utils/api';
import { useNavigate, Link } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight, 
  ArrowRightLeft, 
  ArrowRight,
  PlusCircle, 
  AlertCircle,
  Sparkles
} from 'lucide-react';
import '../App.css';

export default function DashboardView() {
  const navigate = useNavigate();
  const activeHouseholdId = useAppStore((state) => state.activeHouseholdId);
  const user = useAppStore((state) => state.user);
  const draftTransactions = useAppStore((state) => state.draftTransactions);

  const monthStr = new Date().toISOString().substring(0, 7); // "YYYY-MM"

  // 1. Fetch Accounts
  const { data: accounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ['accounts', activeHouseholdId],
    queryFn: () => apiRequest(`households/${activeHouseholdId}/accounts`),
    enabled: !!activeHouseholdId,
  });

  // 2. Fetch Transactions (Recent 5)
  const { data: transactionsData, isLoading: txsLoading } = useQuery({
    queryKey: ['transactions', activeHouseholdId, { limit: 5 }],
    queryFn: () => apiRequest(`households/${activeHouseholdId}/transactions?limit=5`),
    enabled: !!activeHouseholdId,
  });
  const recentTransactions = transactionsData?.transactions || [];

  // 3. Fetch Budget Details (to calculate total planned vs actual spent)
  const { data: budgetData, isLoading: budgetLoading } = useQuery({
    queryKey: ['budget', activeHouseholdId, monthStr],
    queryFn: () => apiRequest(`households/${activeHouseholdId}/budgets/${monthStr}`),
    enabled: !!activeHouseholdId,
  });

  const totalSpent = budgetData?.lines?.reduce((sum: number, l: any) => {
    if (l.category?.type !== 'expense') return sum;
    return sum + Number(l.actualSpent);
  }, 0) || 0;
  const totalBudgeted = budgetData?.lines?.reduce((sum: number, l: any) => {
    if (l.category?.type !== 'expense') return sum;
    return sum + Number(l.plannedAmount);
  }, 0) || 0;

  // Calculate Net Worth / Total Balances
  const totalBalance = accounts.reduce((sum: number, a: any) => {
    // If account type is credit_card or loan, subtract balance
    const isLiability = ['credit_card', 'loan'].includes(a.type);
    return sum + Number(a.currentBalance) * (isLiability ? -1 : 1);
  }, 0);

  // Hardcode summary for MVP display: calculate this month's cash flow
  const thisMonthIncome = budgetData?.totalIncomeBudget || 0;

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'credit_card':
        return <Wallet size={18} color="var(--danger)" />;
      case 'loan':
        return <TrendingDown size={18} color="var(--danger)" />;
      default:
        return <Wallet size={18} color="var(--primary)" />;
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
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

  if (accountsLoading || txsLoading || budgetLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading Dashboard...</p>
      </div>
    );
  }

  const progressLimit = thisMonthIncome > 0 ? thisMonthIncome : totalBudgeted;
  const budgetProgressPercent = progressLimit > 0 ? Math.min((totalSpent / progressLimit) * 100, 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
      {/* Greetings */}
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', fontFamily: 'var(--font-display)' }}>
          Hello, {user?.fullName.split(' ')[0]}!
        </h2>
        <p style={{ fontSize: '0.85rem' }}>Here is your household finance summary.</p>
      </div>

      {/* AI Narrative Review Trigger Banner */}
      <Link to="/reports" style={{ textDecoration: 'none' }}>
        <div className="card-glass" style={{
          padding: 'var(--spacing-sm) var(--spacing-md)',
          background: 'linear-gradient(135deg, var(--primary-glow), var(--secondary-glow))',
          border: '1px dashed var(--primary)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
            <Sparkles size={16} color="var(--primary)" />
            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              Read Monthly Budget Review Story
            </span>
          </div>
          <ArrowRight size={16} color="var(--primary)" />
        </div>
      </Link>

      {/* Draft Warning */}
      {draftTransactions.length > 0 && (
        <div className="card-glass" style={{
          padding: 'var(--spacing-md)',
          backgroundColor: 'var(--warning-glow)',
          border: '1px solid var(--warning)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-sm)',
          borderRadius: 'var(--radius-md)'
        }}>
          <AlertCircle size={20} color="var(--warning)" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: '600', fontSize: '0.85rem', color: 'var(--warning)' }}>Unsynced Transactions</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              You logged {draftTransactions.length} transaction(s) offline. Connect to sync.
            </p>
          </div>
        </div>
      )}

      {/* Net Worth Card */}
      <div className="card card-glass" style={{
        background: 'linear-gradient(135deg, var(--card-bg), var(--bg-secondary))',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-20px',
          right: '-20px',
          width: '100px',
          height: '100px',
          borderRadius: 'var(--radius-full)',
          background: 'radial-gradient(var(--primary-glow), transparent 60%)'
        }} />

        <span style={{ fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
          Net Balance
        </span>
        <h1 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-display)', margin: '4px 0 var(--spacing-md)' }}>
          ₹{totalBalance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
        </h1>

        <div style={{ display: 'flex', borderTop: '1px solid var(--card-border)', paddingTop: 'var(--spacing-md)', gap: 'var(--spacing-lg)' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ backgroundColor: 'var(--success-glow)', padding: '6px', borderRadius: '8px' }}>
              <TrendingUp size={16} color="var(--success)" />
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Monthly Target</span>
              <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>₹{thisMonthIncome.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ backgroundColor: 'var(--danger-glow)', padding: '6px', borderRadius: '8px' }}>
              <TrendingDown size={16} color="var(--danger)" />
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Spent So Far</span>
              <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>₹{totalSpent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Budget Summary Ring Progress */}
      <div className="card" style={{ padding: 'var(--spacing-md)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
          <h3 style={{ fontSize: '0.95rem' }}>Monthly Budget Progress</h3>
          <span style={{ fontSize: '0.85rem', fontWeight: '700', color: totalSpent > progressLimit ? 'var(--danger)' : 'var(--success)' }}>
            ₹{totalSpent.toFixed(0)} / ₹{progressLimit.toFixed(0)}
          </span>
        </div>
        <div style={{
          width: '100%',
          height: '10px',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-full)',
          overflow: 'hidden',
          border: '1px solid var(--card-border)'
        }}>
          <div style={{
            width: `${budgetProgressPercent}%`,
            height: '100%',
            backgroundColor: totalSpent > progressLimit ? 'var(--danger)' : 'var(--primary)',
            borderRadius: 'var(--radius-full)',
            transition: 'width 0.5s ease-out'
          }} />
        </div>
        <p style={{ fontSize: '0.75rem', marginTop: '6px', color: 'var(--text-muted)' }}>
          {totalSpent > progressLimit ? '⚠️ Budget limit exceeded!' : `${(100 - budgetProgressPercent).toFixed(0)}% remaining budget`}
        </p>
      </div>

      {/* Accounts List Section */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>Accounts</h3>
          <Link to="/settings" style={{ fontSize: '0.8rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: '600' }}>
            Manage
          </Link>
        </div>

        {accounts.length === 0 ? (
          <div className="card text-center" style={{ padding: 'var(--spacing-xl)' }}>
            <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--spacing-sm)' }}>No accounts created yet.</p>
            <Link to="/settings">
              <button className="secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                <PlusCircle size={14} style={{ marginRight: '6px' }} /> Add Account
              </button>
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {accounts.map((a: any) => (
              <div key={a.id} className="card-glass" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--spacing-sm) var(--spacing-md)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--card-bg)',
                border: '1px solid var(--card-border)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                  {getAccountIcon(a.type)}
                  <div>
                    <span style={{ fontSize: '0.9rem', fontWeight: '600', display: 'block', color: 'var(--text-primary)' }}>{a.name}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                      {a.type.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>
                  ₹{Number(a.currentBalance).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity List */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>Recent Activity</h3>
          <Link to="/transactions" style={{ fontSize: '0.8rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '2px' }}>
            All <ArrowRight size={12} />
          </Link>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="card text-center" style={{ padding: 'var(--spacing-xl)' }}>
            <p style={{ color: 'var(--text-muted)' }}>No transactions logged this month.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recentTransactions.map((tx: any) => (
              <div key={tx.id} className="card-glass" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--spacing-sm) var(--spacing-md)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--card-bg)',
                border: '1px solid var(--card-border)'
              }}>
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
                <span style={{ 
                  fontWeight: '700', 
                  fontSize: '0.95rem',
                  color: tx.type === 'expense' ? 'var(--danger)' : tx.type === 'income' ? 'var(--success)' : 'var(--secondary)',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}>
                  {tx.type === 'expense' ? '-' : tx.type === 'income' ? '+' : ''}
                  ₹{Number(tx.amount).toFixed(0)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
