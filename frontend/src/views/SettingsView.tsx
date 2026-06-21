import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '../store/useAppStore';
import { apiRequest } from '../utils/api';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Plus, 
  Wallet, 
  UserCheck, 
  LogOut,
  Building
} from 'lucide-react';
import '../App.css';

export default function SettingsView() {
  const queryClient = useQueryClient();
  const activeHouseholdId = useAppStore((state) => state.activeHouseholdId);
  const user = useAppStore((state) => state.user);

  // Invite member state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'co_owner' | 'member' | 'viewer'>('member');
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');

  // Create account state
  const [accName, setAccName] = useState('');
  const [accType, setAccType] = useState('checking');
  const [accBalance, setAccBalance] = useState('0');
  const [accError, setAccError] = useState('');

  // Create Household state
  const [hName, setHName] = useState('');
  const [hError, setHError] = useState('');

  // 1. Fetch Household details (includes members list)
  const { data: householdDetails, isLoading: hLoading } = useQuery({
    queryKey: ['household-details', activeHouseholdId],
    queryFn: () => apiRequest(`households/${activeHouseholdId}`),
    enabled: !!activeHouseholdId,
  });

  // 2. Fetch Accounts list
  const { data: accounts = [], isLoading: aLoading } = useQuery({
    queryKey: ['accounts', activeHouseholdId],
    queryFn: () => apiRequest(`households/${activeHouseholdId}/accounts`),
    enabled: !!activeHouseholdId,
  });

  // Determine user's role in this household
  const currentMember = householdDetails?.members?.find((m: any) => m.userId === user?.id);
  const userRole = currentMember?.role; // owner, co_owner, member, viewer
  const canManage = userRole === 'owner' || userRole === 'co_owner';

  // 3. Create Household mutation
  const createHMutation = useMutation({
    mutationFn: (name: string) => apiRequest('households', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['households'] });
      setHName('');
      alert('Household created successfully!');
    },
    onError: (err: any) => {
      setHError(err.message || 'Failed to create household.');
    }
  });

  // 4. Invite user mutation
  const inviteMutation = useMutation({
    mutationFn: (payload: { email: string; role: string }) => 
      apiRequest(`households/${activeHouseholdId}/members`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['household-details'] });
      setInviteEmail('');
      setInviteSuccess('Member invited successfully!');
      setInviteError('');
    },
    onError: (err: any) => {
      setInviteError(err.message || 'Invitation failed. Ensure the user is registered.');
      setInviteSuccess('');
    }
  });

  // 5. Update user role mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ targetUserId, role }: { targetUserId: string; role: string }) => 
      apiRequest(`households/${activeHouseholdId}/members/${targetUserId}`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['household-details'] });
    },
  });

  // 6. Delete/remove user mutation
  const removeMemberMutation = useMutation({
    mutationFn: (targetUserId: string) => 
      apiRequest(`households/${activeHouseholdId}/members/${targetUserId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['household-details'] });
    },
  });

  // 7. Add account mutation
  const addAccountMutation = useMutation({
    mutationFn: (payload: { name: string; type: string; openingBalance: number }) => 
      apiRequest(`households/${activeHouseholdId}/accounts`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      setAccName('');
      setAccBalance('0');
      setAccError('');
    },
    onError: (err: any) => {
      setAccError(err.message || 'Failed to create account.');
    }
  });

  // 8. Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: (accountId: string) => 
      apiRequest(`households/${activeHouseholdId}/accounts/${accountId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
    onError: (err: any) => {
      alert(err.message || 'Cannot delete account. Check if it has transaction records.');
    }
  });

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    inviteMutation.mutate({ email: inviteEmail.trim(), role: inviteRole });
  };

  const handleAddAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accName.trim()) return;
    const balance = parseFloat(accBalance);
    if (isNaN(balance)) return;
    addAccountMutation.mutate({ name: accName.trim(), type: accType, openingBalance: balance });
  };

  const handleCreateHSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hName.trim()) return;
    createHMutation.mutate(hName.trim());
  };

  if (hLoading || aLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading Settings...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
      {/* Page Header */}
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', fontFamily: 'var(--font-display)' }}>Settings</h2>
        <p style={{ fontSize: '0.85rem' }}>Manage accounts, member roles and shared options.</p>
      </div>

      {/* Categories tree editor link */}
      <Link to="/categories" style={{ textDecoration: 'none' }}>
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
          <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            📁 Configure Categories Tree Hierarchy (Drag & Drop)
          </span>
          <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>➔</span>
        </div>
      </Link>

      {/* 1. Accounts Management Section */}
      <div className="card">
        <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Wallet size={18} color="var(--primary)" /> Manage Accounts
        </h3>

        {/* Existing Accounts list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: 'var(--spacing-md)' }}>
          {accounts.map((a: any) => (
            <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--spacing-xs) 0', borderBottom: '1px solid var(--card-border)' }}>
              <div>
                <span style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-primary)' }}>{a.name}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', textTransform: 'capitalize' }}>{a.type.replace('_', ' ')}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>₹{Number(a.currentBalance).toFixed(0)}</span>
                <button
                  style={{ minHeight: 'auto', padding: '4px', background: 'transparent', border: 'none' }}
                  onClick={() => {
                    if (window.confirm('Delete this account?')) {
                      deleteAccountMutation.mutate(a.id);
                    }
                  }}
                >
                  <Trash2 size={14} color="var(--text-muted)" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add Account form */}
        <form onSubmit={handleAddAccountSubmit} style={{ borderTop: '1px solid var(--card-border)', paddingTop: 'var(--spacing-md)' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: '700', marginBottom: 'var(--spacing-sm)', color: 'var(--text-secondary)' }}>ADD BANK/CASH ACCOUNT</p>
          
          {accError && <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginBottom: '8px' }}>{accError}</p>}

          <div className="form-group">
            <input
              type="text"
              placeholder="Account Name (e.g. ICICI Bank, Cash)"
              value={accName}
              onChange={(e) => setAccName(e.target.value)}
              required
              style={{ padding: '0.5rem', fontSize: '0.85rem' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
            <div style={{ flex: 1 }}>
              <select value={accType} onChange={(e) => setAccType(e.target.value)} style={{ padding: '6px', fontSize: '0.8rem', minHeight: '34px' }}>
                <option value="checking">Checking</option>
                <option value="savings">Savings</option>
                <option value="cash">Cash</option>
                <option value="credit_card">Credit Card</option>
                <option value="loan">Loan Liability</option>
                <option value="investment">Investment</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <input
                type="number"
                placeholder="Opening Bal"
                value={accBalance}
                onChange={(e) => setAccBalance(e.target.value)}
                required
                style={{ padding: '6px', fontSize: '0.8rem', minHeight: '34px' }}
              />
            </div>
          </div>

          <button type="submit" className="primary" style={{ width: '100%', minHeight: '36px', padding: '6px' }} disabled={addAccountMutation.isPending}>
            <Plus size={14} style={{ marginRight: '6px' }} /> Add Account
          </button>
        </form>
      </div>

      {/* 2. Household Members Management */}
      <div className="card">
        <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={18} color="var(--primary)" /> Household Members
        </h3>

        {/* Existing members */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
          {householdDetails?.members?.map((m: any) => {
            const isSelf = m.userId === user?.id;
            return (
              <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--spacing-xs) 0', borderBottom: '1px solid var(--card-border)' }}>
                <div>
                  <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{m.user?.fullName} {isSelf && '(You)'}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>{m.user?.email}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {/* Role picker if operator is owner/co_owner, and is modifying someone else */}
                  {canManage && !isSelf && m.role !== 'owner' ? (
                    <select
                      value={m.role}
                      onChange={(e) => updateRoleMutation.mutate({ targetUserId: m.userId, role: e.target.value })}
                      style={{ padding: '2px 4px', fontSize: '0.75rem', minHeight: '26px', width: '110px' }}
                    >
                      <option value="co_owner">Co-Owner</option>
                      <option value="member">Member</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  ) : (
                    <span style={{
                      backgroundColor: 'var(--bg-primary)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      textTransform: 'capitalize',
                      fontWeight: '600'
                    }}>{m.role.replace('_', ' ')}</span>
                  )}

                  {/* Remove action */}
                  {canManage && !isSelf && m.role !== 'owner' && (
                    <button
                      style={{ minHeight: 'auto', padding: '4px', background: 'transparent', border: 'none' }}
                      onClick={() => {
                        if (window.confirm(`Remove ${m.user?.fullName} from this household?`)) {
                          removeMemberMutation.mutate(m.userId);
                        }
                      }}
                    >
                      <Trash2 size={13} color="var(--text-muted)" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Invite Form */}
        {canManage && (
          <form onSubmit={handleInviteSubmit} style={{ borderTop: '1px solid var(--card-border)', paddingTop: 'var(--spacing-md)' }}>
            <p style={{ fontSize: '0.8rem', fontWeight: '700', marginBottom: 'var(--spacing-sm)', color: 'var(--text-secondary)' }}>INVITE REGISTERED MEMBER</p>
            
            {inviteError && <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginBottom: '8px' }}>{inviteError}</p>}
            {inviteSuccess && <p style={{ color: 'var(--success)', fontSize: '0.8rem', marginBottom: '8px' }}>{inviteSuccess}</p>}

            <div className="form-group">
              <input
                type="email"
                placeholder="User's Email Address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                style={{ padding: '0.5rem', fontSize: '0.85rem' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 'var(--spacing-md)' }}>
              <select value={inviteRole} onChange={(e: any) => setInviteRole(e.target.value)} style={{ padding: '6px', fontSize: '0.8rem', minHeight: '34px' }}>
                <option value="co_owner">Co-Owner (Full edits, can manage members)</option>
                <option value="member">Member (Can add/edit transactions & accounts)</option>
                <option value="viewer">Viewer (Read-only reports access)</option>
              </select>
            </div>

            <button type="submit" className="primary" style={{ width: '100%', minHeight: '36px', padding: '6px' }} disabled={inviteMutation.isPending}>
              <UserPlus size={14} style={{ marginRight: '6px' }} /> Invite User
            </button>
          </form>
        )}
      </div>

      {/* 3. Create Additional Household Group */}
      <div className="card">
        <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Building size={18} color="var(--primary)" /> Create Household Group
        </h3>

        <form onSubmit={handleCreateHSubmit}>
          {hError && <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginBottom: '8px' }}>{hError}</p>}
          
          <div className="form-group" style={{ marginBottom: 'var(--spacing-md)' }}>
            <input
              type="text"
              placeholder="Household Name (e.g. Office, Vacation Group)"
              value={hName}
              onChange={(e) => setHName(e.target.value)}
              required
              style={{ padding: '0.5rem', fontSize: '0.85rem' }}
            />
          </div>

          <button type="submit" className="secondary" style={{ width: '100%', minHeight: '36px', padding: '6px' }} disabled={createHMutation.isPending}>
            Create New Group
          </button>
        </form>
      </div>
    </div>
  );
}
