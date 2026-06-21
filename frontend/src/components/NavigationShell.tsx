import { useState, useEffect } from 'react';
import { useNavigate, NavLink, useLocation } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { apiRequest } from '../utils/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  LayoutDashboard, 
  Receipt, 
  Plus, 
  PieChart, 
  Settings, 
  Sun, 
  Moon, 
  LogOut, 
  Users, 
  ChevronDown, 
  WifiOff, 
  Loader 
} from 'lucide-react';
import QuickAddBottomSheet from './QuickAddBottomSheet';
import PullToRefresh from './PullToRefresh';
import { useSwipe } from '../hooks/useSwipe';
import '../App.css';

export default function NavigationShell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  
  const token = useAppStore((state) => state.token);
  const user = useAppStore((state) => state.user);
  const theme = useAppStore((state) => state.theme);
  const activeHouseholdId = useAppStore((state) => state.activeHouseholdId);
  const draftTransactions = useAppStore((state) => state.draftTransactions);
  
  const setTheme = useAppStore((state) => state.setTheme);
  const setToken = useAppStore((state) => state.setToken);
  const setUser = useAppStore((state) => state.setUser);
  const setActiveHouseholdId = useAppStore((state) => state.setActiveHouseholdId);
  const removeDraftTransaction = useAppStore((state) => state.removeDraftTransaction);

  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [householdDropdownOpen, setHouseholdDropdownOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [newHouseholdName, setNewHouseholdName] = useState('');
  const [createHouseholdError, setCreateHouseholdError] = useState('');
  const [createHouseholdLoading, setCreateHouseholdLoading] = useState(false);

  // 1. Authenticated check
  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  // 2. Fetch Households the user belongs to
  const { data: households = [], isLoading: householdsLoading, refetch: refetchHouseholds } = useQuery({
    queryKey: ['households'],
    queryFn: () => apiRequest('households'),
    enabled: !!token,
  });

  // 3. Keep activeHouseholdId synchronized
  useEffect(() => {
    if (households.length > 0 && (!activeHouseholdId || !households.find((h: any) => h.id === activeHouseholdId))) {
      setActiveHouseholdId(households[0].id);
    }
  }, [households, activeHouseholdId, setActiveHouseholdId]);

  const activeHousehold = households.find((h: any) => h.id === activeHouseholdId);

  // Tab navigation sequence for swipe gesture handlers
  const tabSequence = ['/', '/transactions', '/budgets', '/settings'];
  
  const handleSwipeLeft = () => {
    const currentIndex = tabSequence.indexOf(location.pathname);
    if (currentIndex !== -1 && currentIndex < tabSequence.length - 1) {
      navigate(tabSequence[currentIndex + 1]);
    }
  };

  const handleSwipeRight = () => {
    const currentIndex = tabSequence.indexOf(location.pathname);
    if (currentIndex !== -1 && currentIndex > 0) {
      navigate(tabSequence[currentIndex - 1]);
    }
  };

  const swipeHandlers = useSwipe({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
  });

  const handleRefreshAll = async () => {
    await queryClient.refetchQueries();
  };

  // 4. Create household mutation for new accounts
  const handleCreateHouseholdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHouseholdName.trim()) return;

    setCreateHouseholdLoading(true);
    setCreateHouseholdError('');

    try {
      const newH = await apiRequest('households', {
        method: 'POST',
        body: JSON.stringify({ name: newHouseholdName.trim() }),
      });
      setNewHouseholdName('');
      await refetchHouseholds();
      setActiveHouseholdId(newH.id);
    } catch (err: any) {
      setCreateHouseholdError(err.message || 'Failed to create household.');
    } finally {
      setCreateHouseholdLoading(false);
    }
  };

  // 5. Automatic background drafts syncing when network is restored
  const handleSyncDrafts = async () => {
    if (draftTransactions.length === 0 || syncing || !activeHouseholdId) return;
    setSyncing(true);
    
    // Copy the array to process
    const draftsToSync = [...draftTransactions];

    for (const draft of draftsToSync) {
      try {
        const payload = {
          accountId: draft.accountId,
          categoryId: draft.categoryId,
          type: draft.type,
          amount: draft.amount,
          date: draft.date,
          description: draft.description,
          transferToAccountId: draft.transferToAccountId,
        };

        await apiRequest(`households/${activeHouseholdId}/transactions`, {
          method: 'POST',
          headers: {
            'idempotency-key': draft.idempotencyKey,
          },
          body: JSON.stringify(payload),
        });

        // Successful sync, remove it
        removeDraftTransaction(draft.id);
      } catch (err) {
        console.error('Failed to sync draft transaction', draft, err);
        // Stop syncing on first connection failure
        break;
      }
    }

    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['accounts'] });
    queryClient.invalidateQueries({ queryKey: ['budget'] });
    setSyncing(false);
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setActiveHouseholdId(null);
    navigate('/login');
  };

  if (!token) return null;

  if (householdsLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
        <Loader size={32} className="animate-spin" color="var(--primary)" />
      </div>
    );
  }

  // Check if user has no households (scaffold setup view)
  if (households.length === 0) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: 'var(--spacing-md)',
        background: 'radial-gradient(circle at top right, var(--primary-glow), transparent 40%)'
      }}>
        <div className="card card-glass" style={{ width: '100%', maxWidth: '420px', padding: 'var(--spacing-xl)' }}>
          <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-lg)' }}>
            <Users size={48} color="var(--primary)" style={{ marginBottom: 'var(--spacing-sm)' }} />
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', marginBottom: 'var(--spacing-xs)' }}>
              Setup Household
            </h2>
            <p style={{ fontSize: '0.9rem' }}>
              Welcome {user?.fullName}! To start tracking your budgets, create a household group below.
            </p>
          </div>

          {createHouseholdError && (
            <div style={{
              backgroundColor: 'var(--danger-glow)',
              border: '1px solid var(--danger)',
              color: 'var(--text-primary)',
              padding: 'var(--spacing-sm)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              marginBottom: 'var(--spacing-md)'
            }}>
              {createHouseholdError}
            </div>
          )}

          <form onSubmit={handleCreateHouseholdSubmit}>
            <div className="form-group" style={{ marginBottom: 'var(--spacing-lg)' }}>
              <label htmlFor="householdName">Household Group Name</label>
              <input
                id="householdName"
                type="text"
                placeholder="e.g., Mehta Family, My Personal Account"
                value={newHouseholdName}
                onChange={(e) => setNewHouseholdName(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="primary"
              style={{ width: '100%', marginBottom: 'var(--spacing-md)' }}
              disabled={createHouseholdLoading}
            >
              {createHouseholdLoading ? 'Creating...' : 'Create Household'}
            </button>
          </form>

          <button className="secondary" style={{ width: '100%' }} onClick={handleLogout}>
            <LogOut size={16} style={{ marginRight: '8px' }} /> Log Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)' }}>
      {/* Top Header Bar */}
      <header style={{
        height: 'var(--header-height)',
        borderBottom: '1px solid var(--card-border)',
        position: 'sticky',
        top: 0,
        backgroundColor: 'var(--bg-secondary)',
        backdropFilter: 'blur(8px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--spacing-md)'
      }}>
        {/* Household selector dropdown */}
        <div style={{ position: 'relative' }}>
          <button 
            style={{
              background: 'transparent',
              border: 'none',
              padding: '4px var(--spacing-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              minHeight: 'auto'
            }}
            onClick={() => setHouseholdDropdownOpen(!householdDropdownOpen)}
          >
            <span style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-primary)', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {activeHousehold?.name || 'Loading...'}
            </span>
            <ChevronDown size={14} color="var(--text-muted)" />
          </button>

          {householdDropdownOpen && (
            <>
              <div 
                style={{ position: 'fixed', inset: 0, zIndex: 110 }} 
                onClick={() => setHouseholdDropdownOpen(false)} 
              />
              <div className="card-glass" style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                left: 0,
                width: '200px',
                zIndex: 120,
                backgroundColor: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                borderRadius: 'var(--radius-md)',
                padding: '4px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
              }}>
                {households.map((h: any) => (
                  <button
                    key={h.id}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      minHeight: '36px',
                      padding: '8px var(--spacing-md)',
                      fontSize: '0.9rem',
                      background: h.id === activeHouseholdId ? 'var(--bg-primary)' : 'transparent',
                      border: 'none',
                      borderRadius: '4px',
                      color: h.id === activeHouseholdId ? 'var(--primary)' : 'var(--text-primary)',
                      display: 'block'
                    }}
                    onClick={() => {
                      setActiveHouseholdId(h.id);
                      setHouseholdDropdownOpen(false);
                      queryClient.invalidateQueries();
                    }}
                  >
                    {h.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Right Header Operations */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
          {/* Offline Drafts Sync indicator */}
          {draftTransactions.length > 0 && (
            <button 
              onClick={handleSyncDrafts}
              style={{
                minHeight: 'auto',
                padding: '4px 8px',
                backgroundColor: 'var(--warning-glow)',
                border: '1px solid var(--warning)',
                color: 'var(--warning)',
                fontSize: '0.75rem',
                borderRadius: 'var(--radius-full)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer'
              }}
              title="Click to sync draft transactions"
            >
              {syncing ? <Loader size={12} className="animate-spin" /> : <WifiOff size={12} />}
              <span>Sync {draftTransactions.length}</span>
            </button>
          )}

          {/* Theme switcher */}
          <button 
            style={{ minHeight: 'auto', padding: '8px', background: 'transparent', border: 'none', cursor: 'pointer' }}
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun size={18} color="var(--text-secondary)" /> : <Moon size={18} color="var(--text-secondary)" />}
          </button>

          {/* Logout */}
          <button 
            style={{ minHeight: 'auto', padding: '8px', background: 'transparent', border: 'none', cursor: 'pointer' }}
            onClick={handleLogout}
            title="Log Out"
          >
            <LogOut size={18} color="var(--text-muted)" />
          </button>
        </div>
      </header>

      {/* Main View Container */}
      <main 
        className="app-container"
        onTouchStart={swipeHandlers.onTouchStart}
        onTouchMove={swipeHandlers.onTouchMove}
        onTouchEnd={swipeHandlers.onTouchEnd}
        style={{ 
          height: 'calc(100vh - var(--header-height) - var(--nav-height))', 
          overflow: 'hidden', 
          paddingBottom: 'calc(var(--nav-height) + 12px)'
        }}
      >
        <PullToRefresh onRefresh={handleRefreshAll}>
          {children}
        </PullToRefresh>
      </main>

      {/* Bottom Nav Tab Bar */}
      <nav style={{
        height: 'var(--nav-height)',
        borderTop: '1px solid var(--card-border)',
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'var(--bg-secondary)',
        backdropFilter: 'blur(8px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--spacing-md)',
        maxWidth: '480px',
        margin: '0 auto',
        boxShadow: '0 -4px 10px rgba(0, 0, 0, 0.15)'
      }}>
        {/* Left Tabs */}
        <NavLink 
          to="/" 
          style={({ isActive }) => ({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
            color: isActive ? 'var(--primary)' : 'var(--text-muted)',
            flex: 1,
            fontSize: '0.75rem',
            gap: '2px',
            minHeight: 'auto'
          })}
        >
          <LayoutDashboard size={20} />
          <span>Overview</span>
        </NavLink>

        <NavLink 
          to="/transactions" 
          style={({ isActive }) => ({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
            color: isActive ? 'var(--primary)' : 'var(--text-muted)',
            flex: 1,
            fontSize: '0.75rem',
            gap: '2px',
            minHeight: 'auto'
          })}
        >
          <Receipt size={20} />
          <span>History</span>
        </NavLink>

        {/* Center Quick Add FAB */}
        <div style={{ position: 'relative', width: '56px', height: '56px', display: 'flex', justifyContent: 'center', flex: 1 }}>
          <button 
            style={{
              position: 'absolute',
              bottom: '12px',
              width: 'var(--fab-size)',
              height: 'var(--fab-size)',
              borderRadius: 'var(--radius-full)',
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              border: 'none',
              boxShadow: '0 8px 16px rgba(100, 108, 255, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10
            }}
            onClick={() => setIsQuickAddOpen(true)}
          >
            <Plus size={28} color="white" />
          </button>
        </div>

        {/* Right Tabs */}
        <NavLink 
          to="/budgets" 
          style={({ isActive }) => ({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
            color: isActive ? 'var(--primary)' : 'var(--text-muted)',
            flex: 1,
            fontSize: '0.75rem',
            gap: '2px',
            minHeight: 'auto'
          })}
        >
          <PieChart size={20} />
          <span>Budgets</span>
        </NavLink>

        <NavLink 
          to="/settings" 
          style={({ isActive }) => ({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
            color: isActive ? 'var(--primary)' : 'var(--text-muted)',
            flex: 1,
            fontSize: '0.75rem',
            gap: '2px',
            minHeight: 'auto'
          })}
        >
          <Settings size={20} />
          <span>Settings</span>
        </NavLink>
      </nav>

      {/* Quick Add Overlay Bottom Sheet */}
      <QuickAddBottomSheet isOpen={isQuickAddOpen} onClose={() => setIsQuickAddOpen(false)} />
    </div>
  );
}
